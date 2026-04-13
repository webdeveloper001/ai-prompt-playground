'use client';

import {
  useRef,
  useState,
  useCallback,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { Send, Square, Zap } from 'lucide-react';
import { clsx } from 'clsx';

const MAX_CHARS = 4000;
const CHAR_WARN_THRESHOLD = 200;

const PROMPT_TEMPLATES = [
  {
    label: 'Explain concept',
    template: 'Explain {concept} in simple terms, with a real-world analogy.',
  },
  {
    label: 'Debug code',
    template:
      'Here is my code. Please identify the bug and explain the fix:\n\n```\n{paste code here}\n```',
  },
  {
    label: 'Write a function',
    template:
      'Write a {language} function that {description}. Include type annotations and a brief docstring.',
  },
  {
    label: 'Improve writing',
    template:
      'Improve the clarity and professionalism of this text:\n\n{paste text here}',
  },
  {
    label: 'Compare options',
    template:
      'Compare {option A} and {option B}: key differences, pros and cons, and when to use each.',
  },
  {
    label: 'Step-by-step plan',
    template: 'Create a step-by-step plan to achieve the following goal: {goal}',
  },
];

interface PromptInputProps {
  onSubmit: (value: string) => void;
  onStop: () => void;
  isLoading: boolean;
}

export function PromptInput({ onSubmit, onStop, isLoading }: PromptInputProps) {
  const [value, setValue] = useState('');
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const resetTextarea = useCallback(() => {
    setValue('');
    const ta = textareaRef.current;
    if (ta) ta.style.height = 'auto';
  }, []);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    resetTextarea();
  }, [value, isLoading, onSubmit, resetTextarea]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleChange = useCallback((e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length > MAX_CHARS) return;

    setValue(newValue);

    // Auto-resize: expand up to 200 px, then scroll
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, []);

  const applyTemplate = useCallback((template: string) => {
    setValue(template);
    setTemplatesOpen(false);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
      ta.focus();
    }
  }, []);

  const remaining = MAX_CHARS - value.length;
  const canSubmit = value.trim().length > 0 && !isLoading;

  return (
    <div
      className="border-t border-slate-200 bg-white px-3 pt-3 sm:px-4 sm:pt-4 dark:border-slate-800 dark:bg-slate-950"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto max-w-3xl">
        {/* Prompt templates dropdown */}
        <div className="relative">
          {templatesOpen && (
            <>
              {/* Click-outside overlay */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setTemplatesOpen(false)}
                aria-hidden="true"
              />
              <div className="absolute bottom-full z-20 mb-2 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-fade-in dark:border-slate-700 dark:bg-slate-900">
                <div className="border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Prompt templates
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {PROMPT_TEMPLATES.map((t) => (
                    <button
                      key={t.label}
                      onClick={() => applyTemplate(t.template)}
                      className="flex w-full flex-col gap-0.5 px-4 py-2.5 text-left transition-all duration-100 hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800 dark:active:bg-slate-700/70"
                    >
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">
                        {t.label}
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {t.template.length > 65
                          ? t.template.slice(0, 65) + '…'
                          : t.template}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Input container */}
          <div className="relative flex items-end gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 shadow-sm transition-all duration-150 focus-within:border-indigo-500/60 focus-within:shadow-indigo-500/5 focus-within:ring-2 focus-within:ring-indigo-500/25 dark:border-slate-700 dark:bg-slate-900 sm:px-4 sm:py-3">
            {/* Templates button */}
            <button
              onClick={() => setTemplatesOpen((v) => !v)}
              disabled={isLoading}
              className={clsx(
                'flex flex-shrink-0 items-center justify-center rounded-lg p-1.5 transition-all duration-150 active:scale-90',
                templatesOpen
                  ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300',
                isLoading && 'cursor-not-allowed opacity-40',
              )}
              aria-label="Prompt templates"
              aria-expanded={templatesOpen}
            >
              <Zap className="h-4 w-4" aria-hidden="true" />
            </button>

            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Ask anything…"
              rows={1}
              aria-label="Message input"
              className="max-h-[160px] min-h-[1.5rem] flex-1 resize-none bg-transparent text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:opacity-50 dark:text-slate-100 dark:placeholder-slate-500 sm:max-h-[200px]"
            />

            {/* Send / Stop button */}
            {isLoading ? (
              <button
                onClick={onStop}
                aria-label="Stop generation"
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500 text-white shadow-sm shadow-red-500/30 transition-all duration-150 hover:bg-red-400 active:scale-90 sm:h-8 sm:w-8"
              >
                <Square className="h-4 w-4 fill-current" aria-hidden="true" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                aria-label="Send message"
                className={clsx(
                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-all duration-150 sm:h-8 sm:w-8',
                  canSubmit
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30 hover:bg-indigo-500 active:scale-90 active:bg-indigo-700'
                    : 'cursor-not-allowed bg-slate-200 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
                )}
              >
                <Send className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Footer row */}
        <div className="mt-1.5 flex items-center justify-between px-1">
          <p className="hidden text-xs text-slate-400 sm:block dark:text-slate-600">
            Enter to send · Shift+Enter for new line
          </p>
          <span className="sm:hidden" />
          {remaining <= CHAR_WARN_THRESHOLD && (
            <p
              className={clsx(
                'text-xs tabular-nums',
                remaining < 50 ? 'text-red-500' : 'text-amber-500',
              )}
              aria-live="polite"
            >
              {remaining.toLocaleString()} chars left
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
