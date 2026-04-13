'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { Message } from '@/types';
import { ChatMessage } from './ChatMessage';

interface ChatHistoryProps {
  messages: Message[];
  isLoading: boolean;
  onRegenerate: () => void;
  onEdit: (id: string, newContent: string) => void;
}

export function ChatHistory({ messages, isLoading, onRegenerate, onEdit }: ChatHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);
  const userScrolledUp = useRef(false); // true when the user has manually scrolled away from bottom
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  // On first render, jump to bottom instantly (no animation)
  useLayoutEffect(() => {
    if (isFirstRender.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' as ScrollBehavior });
      isFirstRender.current = false;
    }
  }, []);

  // Detect user-initiated scrolls so auto-scroll doesn't fight them
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      const dist = container.scrollHeight - container.scrollTop - container.clientHeight;
      // If the user scrolls back within 50px of the bottom, re-enable auto-scroll
      userScrolledUp.current = dist > 50;
      setShowScrollBtn(dist > 200);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Auto-scroll — skipped entirely when the user has scrolled up
  useEffect(() => {
    if (userScrolledUp.current) return;

    const container = containerRef.current;
    if (!container) return;

    if (isLoading) {
      // Direct assignment avoids triggering smooth-scroll animations on every token
      container.scrollTop = container.scrollHeight;
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  function scrollToBottom() {
    userScrolledUp.current = false;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const lastMsg = messages[messages.length - 1];
  const canRegenerate =
    lastMsg?.role === 'assistant' && !lastMsg.isStreaming && !isLoading && messages.length >= 2;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto"
        aria-live="polite"
        aria-label="Chat history"
      >
        <div className="mx-auto max-w-3xl py-4 sm:py-6">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLoading={isLoading}
              onEdit={onEdit}
            />
          ))}

          {canRegenerate && (
            <div className="flex justify-center pb-2 animate-fade-in">
              <button
                onClick={onRegenerate}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm transition-all duration-150 hover:border-indigo-300 hover:text-indigo-600 hover:shadow-md active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-indigo-600 dark:hover:text-indigo-300"
                aria-label="Regenerate last response"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Regenerate response
              </button>
            </div>
          )}

          <div ref={bottomRef} className="h-2" aria-hidden="true" />
        </div>
      </div>

      {showScrollBtn && (
        <button
          onClick={scrollToBottom}
          className={clsx(
            'absolute bottom-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-all duration-150 animate-fade-in',
            'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:ring-indigo-200 active:scale-90',
            'dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:text-indigo-300 dark:hover:ring-slate-600',
          )}
          aria-label="Scroll to bottom"
        >
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
