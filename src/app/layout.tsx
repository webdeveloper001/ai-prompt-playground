import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AI Prompt Playground',
  description: 'A clean, fast interface for exploring AI — powered by OpenAI.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  viewportFit: 'cover', // extend behind iPhone notch / Dynamic Island
};

// Inline script that runs before React hydration so there is no flash of
// incorrect theme. Reads from localStorage and applies the 'dark' class.
const themeScript = `
(function(){
  try {
    var raw = localStorage.getItem('ai-prompt-playground:v2');
    var stored = raw ? JSON.parse(raw) : null;
    var theme = stored?.state?.settings?.theme ?? 'dark';
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch(e) {
    document.documentElement.classList.add('dark');
  }
})();
`.trim();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      {/* eslint-disable-next-line @next/next/no-sync-scripts */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-full font-sans">{children}</body>
    </html>
  );
}
