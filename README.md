# AI Prompt Playground

A production-quality AI chat interface built with Next.js 15 and the OpenAI API.
Streaming responses, multi-session history, syntax highlighting, and a fully
responsive layout — works on desktop and mobile.

---

## Getting started

### Prerequisites

- Node.js 18.17 or later
- An [OpenAI API key](https://platform.openai.com/api-keys)

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
#    Open .env.local and set:  OPENAI_API_KEY=sk-...

# 3. Start the development server
npm run dev
#    → http://localhost:3000
```

---

## Features

### Chat

| Feature | Details |
|---|---|
| Streaming responses | Tokens appear in real time with an animated blinking cursor |
| Stop generation | Red stop button cancels in-flight requests via `AbortController` |
| Regenerate response | Re-sends the last exchange for a fresh answer |
| Edit & resend | Inline edit any previous user message; history from that point is replaced |
| Copy message | Copies the message as clean plain text (Markdown formatting stripped) |
| Syntax highlighting | Fenced code blocks with language label and a copy button |
| Auto-scroll | Follows new tokens; pauses when you scroll up; scroll-to-bottom button appears |

### Conversations

| Feature | Details |
|---|---|
| Multiple sessions | Full sidebar with all past conversations |
| Auto-naming | First message auto-generates a conversation title |
| Inline rename | Click the pencil icon on any session to rename it in place |
| Delete session | Removes the session and switches to the next available one |
| Persistent storage | All sessions and settings survive page refresh via `localStorage` |
| Export conversation | Downloads the active chat as a formatted Markdown file |

### Customisation

| Feature | Details |
|---|---|
| Model selector | Switch between GPT-4o Mini, GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo |
| System prompt | Custom persona / instructions prepended as a `system` message; quick presets included |
| Prompt templates | One-click starters fill the input textarea |
| Light / dark theme | Toggle in the header; preference persisted to `localStorage` |

### UX & polish

| Feature | Details |
|---|---|
| Responsive layout | Fully usable on phone, tablet, and desktop |
| Mobile touch support | Action buttons are always visible on touch devices (no hover required) |
| Error toast | Smart toast with human-readable titles (API key, rate limit, network errors) |
| App icon | Branded favicon and iOS home-screen icon generated via `next/og` |
| No flash of wrong theme | Theme applied before first paint via an inline script in `<head>` |

---

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Your OpenAI secret key — never sent to the browser |

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| AI | OpenAI SDK — called server-side; API key never exposed to the client |
| State | Zustand 5 + `localStorage` persistence |
| Styling | Tailwind CSS v3 + `@tailwindcss/typography` |
| Markdown | `react-markdown` + `remark-gfm` |
| Syntax highlighting | `react-syntax-highlighter` (Prism, `oneDark` / `oneLight` themes) |
| Icons | `lucide-react` |
| Favicon | `next/og` (`ImageResponse`) |

---

## Project structure

```
src/
├── app/
│   ├── api/chat/route.ts      ← OpenAI streaming route (server-only)
│   ├── icon.tsx               ← 32 × 32 favicon (next/og)
│   ├── apple-icon.tsx         ← 180 × 180 iOS icon (next/og)
│   ├── layout.tsx             ← theme init script + metadata
│   ├── page.tsx               ← root page — composes all components
│   └── globals.css            ← Tailwind base, scrollbar, selection colours
├── components/
│   ├── chat/
│   │   ├── ChatHistory.tsx    ← scroll container, auto-scroll, scroll-to-bottom
│   │   ├── ChatMessage.tsx    ← bubble, copy, edit, syntax highlighting
│   │   ├── EmptyState.tsx     ← example prompt cards
│   │   └── PromptInput.tsx    ← textarea, send/stop, prompt templates
│   ├── layout/
│   │   ├── Header.tsx         ← model selector, theme toggle, export, settings, clear
│   │   ├── Sidebar.tsx        ← multi-session drawer (left slide-in)
│   │   └── SettingsDrawer.tsx ← system prompt drawer (right slide-in)
│   └── ui/
│       ├── Button.tsx         ← primary / ghost / danger variants
│       ├── CodeBlock.tsx      ← syntax highlight + copy button
│       ├── ErrorBanner.tsx    ← smart error toast (slide-down animation)
│       └── Spinner.tsx
├── hooks/
│   └── useChat.ts             ← send, stop, regenerate, edit & resend, export, SSE parser
├── store/
│   └── chatStore.ts           ← Zustand: sessions, auto-title, rename, settings
└── types/
    └── index.ts
```

---

## Scripts

```bash
npm run dev          # start development server (http://localhost:3000)
npm run build        # production build
npm run start        # serve the production build
npm run lint         # ESLint
npm run type-check   # TypeScript type check (no emit)
```
