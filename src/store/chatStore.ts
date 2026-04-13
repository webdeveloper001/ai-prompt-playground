import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Message, ChatSession, AppSettings, ModelId, AppTheme } from '@/types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function newSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

function titleFromContent(content: string): string {
  const cleaned = content
    .replace(/```[\s\S]*?```/g, '')   // strip code blocks
    .replace(/`[^`]+`/g, '')          // strip inline code
    .replace(/https?:\/\/\S+/g, '')   // strip URLs
    .replace(/[^\w\s.,!?'"-]/g, ' ')  // strip special chars
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'New conversation';
  if (cleaned.length <= 48) return cleaned;
  const cut = cleaned.slice(0, 48);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 24 ? cut.slice(0, lastSpace) : cut) + '…';
}

const DEFAULT_SETTINGS: AppSettings = {
  model: 'gpt-4o-mini',
  systemPrompt: '',
  theme: 'dark',
};

// ─── Store shape ───────────────────────────────────────────────────────────────

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string;
  settings: AppSettings;

  // Session management
  createSession: () => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, title: string) => void;

  // Message actions (operate on the active session)
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  appendToMessage: (id: string, chunk: string) => void;
  updateMessage: (id: string, updates: Partial<Omit<Message, 'id'>>) => void;
  removeLastAiMessage: () => void;
  /** Removes the message with the given id and all messages after it. */
  truncateFromMessage: (id: string) => void;
  clearSession: () => void;

  // Settings
  setModel: (model: ModelId) => void;
  setSystemPrompt: (prompt: string) => void;
  setTheme: (theme: AppTheme) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const initialSession = newSession();

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessions: [initialSession],
      activeSessionId: initialSession.id,
      settings: DEFAULT_SETTINGS,

      // ── Session management ──────────────────────────────────────────────────

      createSession: () => {
        const session = newSession();
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
        }));
      },

      switchSession: (id) => {
        set({ activeSessionId: id });
      },

      renameSession: (id, title) => {
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.id === id ? { ...s, title: title.trim() || undefined } : s,
          ),
        }));
      },

      deleteSession: (id) => {
        set((state) => {
          const remaining = state.sessions.filter((s) => s.id !== id);
          if (remaining.length === 0) {
            const fresh = newSession();
            return { sessions: [fresh], activeSessionId: fresh.id };
          }
          const newActiveId =
            state.activeSessionId === id ? remaining[0].id : state.activeSessionId;
          return { sessions: remaining, activeSessionId: newActiveId };
        });
      },

      // ── Message actions ──────────────────────────────────────────────────────

      addMessage: (message) => {
        const id = crypto.randomUUID();
        const newMessage: Message = { id, timestamp: Date.now(), ...message };

        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== state.activeSessionId) return s;
            // Auto-title from the first user message
            const shouldTitle = message.role === 'user' && !s.title && s.messages.length === 0;
            return {
              ...s,
              title: shouldTitle ? titleFromContent(message.content) : s.title,
              messages: [...s.messages, newMessage],
              updatedAt: Date.now(),
            };
          }),
        }));

        return id;
      },

      appendToMessage: (id, chunk) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== state.activeSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((msg) =>
                msg.id === id ? { ...msg, content: msg.content + chunk } : msg,
              ),
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      updateMessage: (id, updates) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== state.activeSessionId) return s;
            return {
              ...s,
              messages: s.messages.map((msg) =>
                msg.id === id ? { ...msg, ...updates } : msg,
              ),
            };
          }),
        }));
      },

      removeLastAiMessage: () => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== state.activeSessionId) return s;
            const messages = [...s.messages];
            for (let i = messages.length - 1; i >= 0; i--) {
              if (messages[i].role === 'assistant') {
                messages.splice(i, 1);
                break;
              }
            }
            return { ...s, messages };
          }),
        }));
      },

      truncateFromMessage: (id) => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== state.activeSessionId) return s;
            const idx = s.messages.findIndex((m) => m.id === id);
            if (idx === -1) return s;
            return { ...s, messages: s.messages.slice(0, idx) };
          }),
        }));
      },

      clearSession: () => {
        set((state) => ({
          sessions: state.sessions.map((s) => {
            if (s.id !== state.activeSessionId) return s;
            return { ...s, title: undefined, messages: [], updatedAt: Date.now() };
          }),
        }));
      },

      // ── Settings ─────────────────────────────────────────────────────────────

      setModel: (model) =>
        set((state) => ({ settings: { ...state.settings, model } })),

      setSystemPrompt: (systemPrompt) =>
        set((state) => ({ settings: { ...state.settings, systemPrompt } })),

      setTheme: (theme) =>
        set((state) => ({ settings: { ...state.settings, theme } })),
    }),
    {
      name: 'ai-prompt-playground:v2',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        // Strip any isStreaming flags left over from a previous session
        state.sessions = state.sessions.map((session) => ({
          ...session,
          messages: session.messages.map((msg) => ({ ...msg, isStreaming: false })),
        }));
      },
    },
  ),
);
