'use client';

import { useState, useCallback, useRef } from 'react';
import { useChatStore } from '@/store/chatStore';

// ─── SSE parser ───────────────────────────────────────────────────────────────

async function* parseSSEStream(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<{ content?: string; error?: string }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() ?? '';

      for (const event of events) {
        for (const line of event.split('\n')) {
          if (!line.startsWith('data: ')) continue;

          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            yield JSON.parse(data) as { content?: string; error?: string };
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── Shared send logic (DRY) ──────────────────────────────────────────────────

interface SendPayload {
  apiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  aiId: string;
  model: string;
  signal: AbortSignal;
  appendToMessage: (id: string, chunk: string) => void;
  updateMessage: (id: string, updates: object) => void;
  setError: (msg: string | null) => void;
  setIsLoading: (v: boolean) => void;
  clearRef: () => void;
}

async function streamToStore(payload: SendPayload) {
  const {
    apiMessages, aiId, model, signal,
    appendToMessage, updateMessage, setError, setIsLoading, clearRef,
  } = payload;

  // Batch incoming tokens into a single Zustand update per animation frame.
  // This caps React re-renders at ~60/s regardless of token rate, keeping the
  // main thread free for smooth scrolling and interactions during generation.
  let tokenBuffer = '';
  let rafId = 0;

  const flushBuffer = () => {
    if (tokenBuffer) {
      appendToMessage(aiId, tokenBuffer);
      tokenBuffer = '';
    }
    rafId = 0;
  };

  const scheduleFlush = () => {
    if (!rafId) rafId = requestAnimationFrame(flushBuffer);
  };

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({ messages: apiMessages, model }),
    });

    if (!response.ok || !response.body) {
      const data = await response.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error ?? `HTTP ${response.status}`);
    }

    for await (const event of parseSSEStream(response.body)) {
      if (event.error) throw new Error(event.error);
      if (event.content) {
        tokenBuffer += event.content;
        scheduleFlush();
      }
    }

    // Flush any tokens that arrived in the last partial frame
    if (rafId) cancelAnimationFrame(rafId);
    flushBuffer();
  } catch (err) {
    if (rafId) { cancelAnimationFrame(rafId); tokenBuffer = ''; }
    const isAbort = err instanceof Error && err.name === 'AbortError';
    if (!isAbort) {
      const message = err instanceof Error ? err.message : 'Unexpected error';
      setError(message);
      updateMessage(aiId, {
        content: 'Sorry, something went wrong. Please try again.',
        hasError: true,
      });
    }
  } finally {
    updateMessage(aiId, { isStreaming: false });
    setIsLoading(false);
    clearRef();
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    sessions,
    activeSessionId,
    settings,
    addMessage,
    appendToMessage,
    updateMessage,
    removeLastAiMessage,
    truncateFromMessage,
    clearSession,
  } = useChatStore();

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];

  // ── Send ──────────────────────────────────────────────────────────────────

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Capture context before mutating the store
      const apiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
        ...(settings.systemPrompt
          ? [{ role: 'system' as const, content: settings.systemPrompt }]
          : []),
        ...activeSession.messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: trimmed },
      ];

      addMessage({ role: 'user', content: trimmed });
      const aiId = addMessage({ role: 'assistant', content: '', isStreaming: true });

      const controller = new AbortController();
      abortControllerRef.current = controller;

      await streamToStore({
        apiMessages,
        aiId,
        model: settings.model,
        signal: controller.signal,
        appendToMessage,
        updateMessage,
        setError,
        setIsLoading,
        clearRef: () => { abortControllerRef.current = null; },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSession.messages, isLoading, settings],
  );

  // ── Stop ──────────────────────────────────────────────────────────────────

  const stopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  // ── Regenerate ────────────────────────────────────────────────────────────

  const regenerate = useCallback(async () => {
    if (isLoading) return;

    const messages = activeSession.messages;

    // Find the last AI message index and the last user message before it
    let lastAiIndex = -1;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant') { lastAiIndex = i; break; }
    }
    if (lastAiIndex === -1) return;

    // Build context: everything up to (not including) the last AI message
    const apiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      ...(settings.systemPrompt
        ? [{ role: 'system' as const, content: settings.systemPrompt }]
        : []),
      ...messages.slice(0, lastAiIndex).map((m) => ({ role: m.role, content: m.content })),
    ];

    if (apiMessages.filter((m) => m.role !== 'system').length === 0) return;

    removeLastAiMessage();
    const aiId = addMessage({ role: 'assistant', content: '', isStreaming: true });

    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await streamToStore({
      apiMessages,
      aiId,
      model: settings.model,
      signal: controller.signal,
      appendToMessage,
      updateMessage,
      setError,
      setIsLoading,
      clearRef: () => { abortControllerRef.current = null; },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession.messages, isLoading, settings, removeLastAiMessage, addMessage]);

  // ── Edit & resend ─────────────────────────────────────────────────────────

  const editAndResend = useCallback(async (id: string, newContent: string) => {
    const trimmed = newContent.trim();
    if (!trimmed || isLoading) return;

    const messages = activeSession.messages;
    const msgIndex = messages.findIndex((m) => m.id === id);
    if (msgIndex === -1) return;

    // Build context: everything before the edited message + the new content
    const apiMessages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
      ...(settings.systemPrompt
        ? [{ role: 'system' as const, content: settings.systemPrompt }]
        : []),
      ...messages.slice(0, msgIndex).map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: trimmed },
    ];

    // Remove the edited message and everything after it, then add the new messages
    truncateFromMessage(id);
    addMessage({ role: 'user', content: trimmed });
    const aiId = addMessage({ role: 'assistant', content: '', isStreaming: true });

    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    await streamToStore({
      apiMessages,
      aiId,
      model: settings.model,
      signal: controller.signal,
      appendToMessage,
      updateMessage,
      setError,
      setIsLoading,
      clearRef: () => { abortControllerRef.current = null; },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSession.messages, isLoading, settings, truncateFromMessage, addMessage]);

  // ── Export ────────────────────────────────────────────────────────────────

  const exportChat = useCallback(() => {
    const session = activeSession;
    if (session.messages.length === 0) return;

    const title = session.title ?? 'Chat Export';
    const dateStr = new Date().toLocaleString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });

    const lines: string[] = [
      `# ${title}`,
      ``,
      `> **Model**: ${settings.model}  `,
      `> **Exported**: ${dateStr}`,
      ``,
      `---`,
      ``,
    ];

    for (const msg of session.messages) {
      if (msg.hasError) continue;
      lines.push(msg.role === 'user' ? '## You' : '## Assistant');
      lines.push('');
      lines.push(msg.content);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [activeSession, settings.model]);

  // ── Public API ────────────────────────────────────────────────────────────

  return {
    messages: activeSession.messages,
    activeSession,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    regenerate,
    editAndResend,
    exportChat,
    clearSession,
    clearError: () => setError(null),
  };
}
