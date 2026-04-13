'use client';

import { useEffect, useState } from 'react';
import { Check, Cpu, Download, Menu, Moon, Settings, Sun, Trash2, X } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { useChatStore } from '@/store/chatStore';
import { ModelId } from '@/types';

const MODELS: { id: ModelId; label: string }[] = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
];

// How long (ms) the confirm prompt stays open before auto-dismissing
const CONFIRM_TIMEOUT = 3000;

interface HeaderProps {
  onClear: () => void;
  hasMessages: boolean;
  onOpenSidebar: () => void;
  onOpenSettings: () => void;
  onExport: () => void;
}

export function Header({
  onClear,
  hasMessages,
  onOpenSidebar,
  onOpenSettings,
  onExport,
}: HeaderProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const model = useChatStore((state) => state.settings.model);
  const theme = useChatStore((state) => state.settings.theme);
  const setModel = useChatStore((state) => state.setModel);
  const setTheme = useChatStore((state) => state.setTheme);

  // Apply / remove the 'dark' class on <html> whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Auto-cancel the confirm state
  useEffect(() => {
    if (!isConfirming) return;
    const id = setTimeout(() => setIsConfirming(false), CONFIRM_TIMEOUT);
    return () => clearTimeout(id);
  }, [isConfirming]);

  function handleConfirm() {
    onClear();
    setIsConfirming(false);
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 sm:px-6">
      {/* Left — sidebar toggle + branding */}
      <div className="flex items-center gap-2 sm:gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSidebar}
          aria-label="Open conversation history"
        >
          <Menu className="h-4 w-4" aria-hidden="true" />
        </Button>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/20">
            <Cpu className="h-4 w-4 text-white" aria-hidden="true" />
          </div>
          <div className="leading-tight">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              AI Prompt Playground
            </h1>
            <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-500">
              Powered by OpenAI
            </p>
          </div>
        </div>
      </div>

      {/* Right — controls */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        {/* Model selector — hidden on very small screens */}
        <select
          value={model}
          onChange={(e) => setModel(e.target.value as ModelId)}
          className={clsx(
            'hidden cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700',
            'focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30',
            'transition-all duration-150 hover:border-indigo-300 hover:bg-white',
            'dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-500/50 dark:hover:bg-slate-700',
            'sm:block',
          )}
          aria-label="Select AI model"
        >
          {MODELS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label}
            </option>
          ))}
        </select>

        {/* Export — hidden on mobile */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onExport}
          disabled={!hasMessages}
          aria-label="Export conversation as Markdown"
          className="hidden sm:inline-flex"
        >
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>

        {/* System prompt settings */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          aria-label="System prompt settings"
        >
          <Settings className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <Sun className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Moon className="h-3.5 w-3.5" aria-hidden="true" />
          )}
        </Button>

        {/* Clear chat — inline confirm */}
        {isConfirming ? (
          <>
            <span className="hidden animate-fade-in text-xs text-slate-500 sm:block dark:text-slate-400">
              Clear all messages?
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirm}
              aria-label="Confirm clear"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Yes, clear</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsConfirming(false)}
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">Cancel</span>
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsConfirming(true)}
            disabled={!hasMessages}
            aria-label="Clear chat history"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Clear</span>
          </Button>
        )}
      </div>
    </header>
  );
}
