'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useChatStore } from '@/store/chatStore';
import { Button } from '@/components/ui/Button';

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDrawer({ open, onClose }: SettingsDrawerProps) {
  // Keep component mounted during the exit animation, then fully unmount
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else {
      setVisible(false);
      const id = setTimeout(() => setMounted(false), 220);
      return () => clearTimeout(id);
    }
  }, [open]);

  const systemPrompt = useChatStore((state) => state.settings.systemPrompt);
  const setSystemPrompt = useChatStore((state) => state.setSystemPrompt);

  const [draft, setDraft] = useState(systemPrompt);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft when drawer opens
  useEffect(() => {
    if (open) {
      setDraft(systemPrompt);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  }, [open, systemPrompt]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleClose() {
    setSystemPrompt(draft.trim());
    onClose();
  }

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm',
          visible ? 'animate-fade-in' : 'animate-fade-out',
        )}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="System prompt settings"
        aria-modal="true"
        className={clsx(
          'fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl dark:bg-slate-900',
          visible ? 'animate-slide-in-right' : 'animate-slide-out-right',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600/10 ring-1 ring-indigo-500/20">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              System Prompt
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} aria-label="Close settings">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set a custom persona or persistent instructions. This is prepended to every
            conversation as a{' '}
            <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
              system
            </code>{' '}
            message.
          </p>

          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={`E.g. "You are a senior TypeScript engineer. Be concise, prefer functional patterns, and always provide typed examples."`}
            rows={10}
            className="w-full flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500"
          />

          {/* Quick presets */}
          <div>
            <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              Quick presets
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => setDraft(p.prompt)}
                  className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs text-slate-600 transition-all duration-150 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                >
                  {p.label}
                </button>
              ))}
              {draft && (
                <button
                  onClick={() => setDraft('')}
                  className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-600 transition-all duration-150 hover:bg-red-100 active:scale-95 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 p-5 dark:border-slate-800">
          <Button variant="primary" size="md" onClick={handleClose} className="w-full">
            Save &amp; Close
          </Button>
        </div>
      </aside>
    </>
  );
}

const PRESETS = [
  {
    label: 'Senior Engineer',
    prompt:
      'You are a senior software engineer. Be concise and precise. Prefer functional patterns, strong typing, and battle-tested solutions. Skip filler words.',
  },
  {
    label: 'Socratic Tutor',
    prompt:
      'You are a Socratic tutor. Instead of giving direct answers, ask guiding questions that help the user discover the answer themselves.',
  },
  {
    label: 'Technical Writer',
    prompt:
      'You are a technical writer. Explain concepts clearly using plain language, concrete examples, and numbered steps. Avoid jargon without explanation.',
  },
  {
    label: 'Code Reviewer',
    prompt:
      'You are a strict code reviewer. Identify bugs, security risks, performance issues, and style violations. Be direct and actionable.',
  },
];
