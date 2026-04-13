'use client';

import { useEffect, useRef, useState } from 'react';
import { MessageSquarePlus, Pencil, Trash2, X, MessageSquare } from 'lucide-react';
import { clsx } from 'clsx';
import { useChatStore } from '@/store/chatStore';
import { Button } from '@/components/ui/Button';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
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

  const { sessions, activeSessionId, createSession, switchSession, deleteSession, renameSession } =
    useChatStore();

  // Inline rename state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: React.MouseEvent, id: string, currentTitle: string) {
    e.stopPropagation();
    setEditingId(id);
    setEditValue(currentTitle);
    setTimeout(() => {
      editInputRef.current?.focus();
      editInputRef.current?.select();
    }, 0);
  }

  function commitEdit() {
    if (editingId) {
      renameSession(editingId, editValue);
      setEditingId(null);
    }
  }

  function cancelEdit() {
    setEditingId(null);
  }

  // Close sidebar on Escape (but not when editing a title)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingId) { cancelEdit(); }
        else { onClose(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, onClose, editingId]);

  function handleNewChat() {
    createSession();
    onClose();
  }

  function handleSwitch(id: string) {
    switchSession(id);
    onClose();
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    deleteSession(id);
  }

  const sorted = [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);

  if (!mounted) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-sm',
          visible ? 'animate-fade-in' : 'animate-fade-out',
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-label="Chat sessions"
        aria-modal="true"
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-2xl dark:bg-slate-900',
          visible ? 'animate-slide-in-left' : 'animate-slide-out-left',
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Conversations
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close sidebar">
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* New chat button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center gap-2.5 rounded-xl border border-dashed border-slate-300 px-3 py-2.5 text-sm text-slate-500 transition-all duration-150 hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-600 active:scale-[0.98] active:bg-indigo-100 dark:border-slate-700 dark:text-slate-400 dark:hover:border-indigo-500 dark:hover:bg-indigo-950/30 dark:hover:text-indigo-300"
          >
            <MessageSquarePlus className="h-4 w-4" aria-hidden="true" />
            New conversation
          </button>
        </div>

        {/* Sessions list */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4" aria-label="Conversation list">
          {sorted.length === 0 ? (
            <p className="px-1 py-2 text-xs text-slate-500 dark:text-slate-500">
              No conversations yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-1" role="list">
              {sorted.map((session) => {
                const isActive = session.id === activeSessionId;
                const title = session.title ?? 'New conversation';
                const date = formatSessionDate(session.updatedAt);

                const isEditing = editingId === session.id;

                return (
                  <li key={session.id} role="listitem">
                    <div className="group flex items-center gap-1">

                      {/* ── Inline rename mode ── */}
                      {isEditing ? (
                        <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl bg-indigo-50 px-3 py-2 dark:bg-indigo-950/40">
                          <MessageSquare className="h-4 w-4 flex-shrink-0 text-indigo-400" aria-hidden="true" />
                          <input
                            ref={editInputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={commitEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); commitEdit(); }
                              if (e.key === 'Escape') { e.stopPropagation(); cancelEdit(); }
                            }}
                            className="min-w-0 flex-1 bg-transparent text-sm font-medium text-indigo-700 placeholder-indigo-300 focus:outline-none dark:text-indigo-300 dark:placeholder-indigo-600"
                            placeholder="Conversation name"
                            aria-label="Rename conversation"
                          />
                        </div>
                      ) : (
                        /* ── Normal mode ── */
                        <button
                          onClick={() => handleSwitch(session.id)}
                          className={clsx(
                            'flex min-w-0 flex-1 items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all duration-150',
                            isActive
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                              : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:active:bg-slate-700',
                          )}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <MessageSquare
                            className={clsx(
                              'mt-0.5 h-4 w-4 flex-shrink-0',
                              isActive ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500',
                            )}
                            aria-hidden="true"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium leading-snug">{title}</p>
                            <p
                              className={clsx(
                                'text-xs',
                                isActive ? 'text-indigo-400' : 'text-slate-400 dark:text-slate-500',
                              )}
                            >
                              {session.messages.length} msg{session.messages.length !== 1 ? 's' : ''} · {date}
                            </p>
                          </div>
                        </button>
                      )}

                      {/* ── Rename button ── */}
                      {!isEditing && (
                        <button
                          onClick={(e) => startEdit(e, session.id, title)}
                          className="flex-shrink-0 rounded p-1 text-slate-400 opacity-0 transition-all duration-150 hover:bg-slate-200 hover:text-slate-600 active:scale-90 group-hover:opacity-100 [@media(hover:none)]:opacity-100 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
                          aria-label={`Rename conversation: ${title}`}
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}

                      {/* ── Delete button ── */}
                      {!isEditing && (
                        <button
                          onClick={(e) => handleDelete(e, session.id)}
                          className="flex-shrink-0 rounded p-1 text-slate-400 opacity-0 transition-all duration-150 hover:bg-red-100 hover:text-red-500 active:scale-90 group-hover:opacity-100 [@media(hover:none)]:opacity-100 dark:text-slate-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                          aria-label={`Delete conversation: ${title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      )}

                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>
      </aside>
    </>
  );
}

function formatSessionDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(ts));
}
