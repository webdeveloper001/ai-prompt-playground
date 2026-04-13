'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { SettingsDrawer } from '@/components/layout/SettingsDrawer';
import { ChatHistory } from '@/components/chat/ChatHistory';
import { PromptInput } from '@/components/chat/PromptInput';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/chat/EmptyState';
import { useChat } from '@/hooks/useChat';

export default function Page() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    stopGeneration,
    regenerate,
    editAndResend,
    exportChat,
    clearSession,
    clearError,
  } = useChat();

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950">
      {/* Drawers */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Top bar */}
      <Header
        onClear={clearSession}
        hasMessages={messages.length > 0}
        onOpenSidebar={() => setSidebarOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onExport={exportChat}
      />

      {/* Body */}
      <main className="relative flex min-h-0 flex-1 flex-col">
        {/* Error toast — fixed at top-center of viewport, above all layers */}
        {error && (
          <div className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
            <div className="w-full max-w-md">
              <ErrorBanner message={error} onDismiss={clearError} />
            </div>
          </div>
        )}

        {messages.length === 0 ? (
          <EmptyState onExampleClick={sendMessage} />
        ) : (
          <ChatHistory
            messages={messages}
            isLoading={isLoading}
            onRegenerate={regenerate}
            onEdit={editAndResend}
          />
        )}
      </main>

      <PromptInput
        onSubmit={sendMessage}
        onStop={stopGeneration}
        isLoading={isLoading}
      />
    </div>
  );
}
