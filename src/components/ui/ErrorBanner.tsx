'use client';

import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  onDismiss: () => void;
}

/** Derive a short title from the raw error message. */
function parseError(message: string): { title: string; detail: string } {
  if (message.toLowerCase().includes('openai_api_key')) {
    return { title: 'API key not configured', detail: message };
  }
  if (message.toLowerCase().includes('rate limit') || message.toLowerCase().includes('429')) {
    return { title: 'Rate limit reached', detail: 'Too many requests. Please wait a moment and try again.' };
  }
  if (message.toLowerCase().includes('network') || message.toLowerCase().includes('fetch')) {
    return { title: 'Network error', detail: 'Could not reach the server. Check your connection.' };
  }
  if (message.toLowerCase().includes('invalid json') || message.toLowerCase().includes('400')) {
    return { title: 'Bad request', detail: message };
  }
  return { title: 'Something went wrong', detail: message };
}

export function ErrorBanner({ message, onDismiss }: ErrorBannerProps) {
  const { title, detail } = parseError(message);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'flex w-full items-start gap-3 rounded-2xl px-4 py-3.5',
        'border border-slate-200 bg-white shadow-xl shadow-black/[0.08]',
        'dark:border-slate-700/60 dark:bg-slate-900 dark:shadow-black/30',
        'animate-slide-down',
      ].join(' ')}
    >
      {/* Icon */}
      <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-red-50 ring-1 ring-red-100 dark:bg-red-950/40 dark:ring-red-800/40">
        <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" aria-hidden="true" />
      </div>

      {/* Text */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">{detail}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        aria-label="Dismiss error"
        className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 active:scale-90 dark:hover:bg-slate-800 dark:hover:text-slate-300"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
