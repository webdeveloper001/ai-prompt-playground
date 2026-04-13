import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { ApiChatMessage } from '@/types';

// Singleton per server process — avoids class instantiation on every request.
// On cold-start the instance is created once; warm requests reuse it.
let _openai: OpenAI | undefined;
function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return (_openai ??= new OpenAI({ apiKey }));
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-3.5-turbo'] as const;
type AllowedModel = (typeof ALLOWED_MODELS)[number];

// ─── Validation ───────────────────────────────────────────────────────────────

function validateMessages(messages: unknown): messages is ApiChatMessage[] {
  if (!Array.isArray(messages) || messages.length === 0) return false;

  return messages.every(
    (m) =>
      m !== null &&
      typeof m === 'object' &&
      typeof (m as ApiChatMessage).role === 'string' &&
      ['user', 'assistant', 'system'].includes((m as ApiChatMessage).role) &&
      typeof (m as ApiChatMessage).content === 'string' &&
      (m as ApiChatMessage).content.trim().length > 0,
  );
}

function resolveModel(raw: unknown): AllowedModel {
  if (typeof raw === 'string' && (ALLOWED_MODELS as readonly string[]).includes(raw)) {
    return raw as AllowedModel;
  }
  return 'gpt-4o-mini';
}

// ─── Error response helper ────────────────────────────────────────────────────

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  let openai: OpenAI;
  try {
    openai = getOpenAI();
  } catch {
    return errorResponse('Server configuration error: OPENAI_API_KEY is not set.', 500);
  }

  let body: { messages: unknown; model?: unknown; systemPrompt?: unknown };
  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON body.', 400);
  }

  if (!validateMessages(body.messages)) {
    return errorResponse('Request body must contain a non-empty "messages" array.', 400);
  }

  const model = resolveModel(body.model);

  const systemPrompt =
    typeof body.systemPrompt === 'string' && body.systemPrompt.trim().length > 0
      ? body.systemPrompt.trim()
      : null;

  const messages: ApiChatMessage[] = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...body.messages]
    : body.messages;

  try {
    const stream = await openai.chat.completions.create({
      model,
      messages,
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`),
              );
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (err) {
          const msg = err instanceof Error ? err.message : 'Stream error';
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      return errorResponse(err.message, err.status ?? 502);
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return errorResponse(message, 500);
  }
}
