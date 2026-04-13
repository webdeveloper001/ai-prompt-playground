'use client';

import { memo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { clsx } from 'clsx';
import { Bot, Check, Copy, Pencil, User, X } from 'lucide-react';
import { Message } from '@/types';
import { CodeBlock } from '@/components/ui/CodeBlock';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ts: number): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ts));
}

/** Strip Markdown so clipboard receives readable plain text. */
function toPlainText(md: string): string {
  return md
    .replace(/```[\w]*\n([\s\S]*?)```/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^>\s*/gm, '')
    .replace(/^[-*_]{3,}\s*$/gm, '')
    .replace(/^[ \t]*[-*+]\s+/gm, '')
    .replace(/^[ \t]*\d+\.\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── Markdown component overrides ────────────────────────────────────────────

const markdownComponents = {
  pre({ children }: { children?: React.ReactNode }) {
    return <>{children}</>;
  },
  code({ className, children, ...props }: React.ComponentPropsWithoutRef<'code'>) {
    const match = /language-(\w+)/.exec(className || '');
    const codeStr = String(children).replace(/\n$/, '');
    const isBlock = !!match || codeStr.includes('\n');

    if (isBlock) {
      return <CodeBlock language={match?.[1] ?? ''} code={codeStr} />;
    }

    return (
      <code
        className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.82em] text-slate-800 dark:bg-slate-800 dark:text-slate-200"
        {...props}
      >
        {children}
      </code>
    );
  },
};

// ─── Sub-component: action icon button ───────────────────────────────────────

function ActionButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex items-center justify-center rounded-md p-1.5 text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 active:scale-90 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300"
    >
      {children}
    </button>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ChatMessageProps {
  message: Message;
  isLoading: boolean;
  onEdit: (id: string, newContent: string) => void;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isLoading,
  onEdit,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.content);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(toPlainText(message.content));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEditStart = () => {
    setEditValue(message.content);
    setIsEditing(true);
    setTimeout(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
      ta.style.height = 'auto';
      ta.style.height = `${ta.scrollHeight}px`;
    }, 0);
  };

  const handleEditSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== message.content) {
      onEdit(message.id, trimmed);
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(message.content);
    setIsEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(); }
    if (e.key === 'Escape') { handleEditCancel(); }
  };

  return (
    <div
      className={clsx(
        'group flex animate-slide-up gap-2 px-3 py-1.5 sm:gap-3 sm:px-4 sm:py-2',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
            : 'bg-slate-100 text-indigo-500 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-indigo-400 dark:ring-slate-700',
        )}
        aria-hidden="true"
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>

      {/* Bubble column */}
      <div
        className={clsx(
          'flex max-w-[88%] flex-col gap-1 sm:max-w-[82%]',
          isUser ? 'items-end' : 'items-start',
        )}
      >
        {/* ── Edit mode (user only) ── */}
        {isUser && isEditing ? (
          <div className="flex w-full flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={handleEditKeyDown}
              rows={1}
              className="w-full resize-none rounded-2xl rounded-tr-sm border border-indigo-400 bg-indigo-50 px-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-slate-100"
              aria-label="Edit message"
            />
            <div className="flex justify-end gap-1.5">
              <button
                onClick={handleEditCancel}
                aria-label="Cancel edit"
                className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 active:scale-90 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={handleEditSave}
                disabled={!editValue.trim() || editValue.trim() === message.content}
                aria-label="Save and send"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 transition-all duration-150 hover:bg-indigo-500 active:scale-90 disabled:opacity-40 disabled:shadow-none"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Message bubble ── */}
            <div
              className={clsx(
                'rounded-2xl px-4 py-3 text-sm leading-relaxed',
                isUser
                  ? 'rounded-tr-sm bg-indigo-600 text-white'
                  : clsx(
                      'rounded-tl-sm',
                      message.hasError
                        ? 'bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-950/30 dark:text-red-300 dark:ring-red-800/40'
                        : 'bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800/70 dark:text-slate-100 dark:ring-slate-700/50',
                    ),
              )}
            >
              {isUser ? (
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              ) : (
                <div
                  className={clsx(
                    'prose prose-sm max-w-none dark:prose-invert',
                    message.isStreaming && 'typing-cursor',
                  )}
                >
                  {message.content ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                      {message.content}
                    </ReactMarkdown>
                  ) : message.isStreaming ? (
                    <span className="italic text-slate-400 dark:text-slate-500">Thinking…</span>
                  ) : null}
                </div>
              )}
            </div>

            {/* ── Action buttons below bubble, revealed on hover (always visible on touch) ── */}
            {!message.isStreaming && !message.hasError && (
              <div
                className={clsx(
                  'flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100',
                  isUser ? 'flex-row-reverse' : 'flex-row',
                )}
              >
                <ActionButton onClick={handleCopy} label={copied ? 'Copied' : 'Copy message'}>
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" aria-hidden="true" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  )}
                </ActionButton>

                {isUser && !isLoading && (
                  <ActionButton onClick={handleEditStart} label="Edit message">
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </ActionButton>
                )}
              </div>
            )}

            {/* ── Timestamp ── */}
            <time
              dateTime={new Date(message.timestamp).toISOString()}
              className="select-none px-1 text-xs text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 [@media(hover:none)]:opacity-100 dark:text-slate-600"
            >
              {formatTimestamp(message.timestamp)}
            </time>
          </>
        )}
      </div>
    </div>
  );
});
