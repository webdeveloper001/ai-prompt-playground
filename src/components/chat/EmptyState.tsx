'use client';

import { ArrowRight, Sparkles } from 'lucide-react';

const EXAMPLE_PROMPTS = [
  'Explain how React Server Components differ from Client Components',
  'Write a TypeScript utility type to make all properties required',
  'What are the SOLID principles? Give me a concrete example for each',
  'Debug this: why does `[] == false` return true in JavaScript?',
  'Write a SQL query for the top 5 users by total spend',
  'Explain Big O notation using simple real-world analogies',
];

interface EmptyStateProps {
  onExampleClick: (prompt: string) => void;
}

export function EmptyState({ onExampleClick }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 animate-fade-in sm:gap-8 sm:py-12">
      <div className="text-center">
        <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/10 ring-1 ring-indigo-500/20 transition-transform duration-300 hover:scale-110 sm:mb-4 sm:h-16 sm:w-16">
          <Sparkles className="h-5 w-5 text-indigo-500 sm:h-7 sm:w-7" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900 sm:text-xl dark:text-slate-100">
          How can I help you today?
        </h2>
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          Ask me anything — code, explanations, ideas, or analysis.
        </p>
      </div>

      <div className="grid w-full max-w-2xl grid-cols-1 gap-2 sm:grid-cols-2">
        {EXAMPLE_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onExampleClick(prompt)}
            className={[
              'group flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm',
              'border-slate-200 bg-slate-50 text-slate-500',
              'transition-all duration-200 ease-out',
              'hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:text-slate-700 hover:shadow-md hover:shadow-indigo-100',
              'active:translate-y-0 active:scale-[0.99] active:shadow-sm',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
              'dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400',
              'dark:hover:border-indigo-500/40 dark:hover:bg-slate-800/80 dark:hover:text-slate-200 dark:hover:shadow-none',
            ].join(' ')}
          >
            <span className="line-clamp-2 flex-1">{prompt}</span>
            <ArrowRight
              className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-300 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-indigo-400 dark:text-slate-600 dark:group-hover:text-indigo-400"
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
