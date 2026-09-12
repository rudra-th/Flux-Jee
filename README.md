# FluxJEE

**The real JEE exam interface, minus the seat.**

FluxJEE recreates the actual JEE exam interface as a mock-test platform. Instead of training on generic-looking quiz pages, you practice on the same layout, controls and timer behaviour you'd see in the real Centre — full-screen session, per-question navigation, and a clock that behaves like the paper one.

## Live App

**[fluxjee.vercel.app](https://fluxjee.vercel.app/)**

## Features

- **Faithful copy of the real exam interface** — instruction screens, question palette, submit flow
- **Full-screen test environment** — distraction-free, timer-driven sessions
- **Accurate exam-style timer** — behaves like the paper clock, with auto-submit on expiry
- **Question-map navigation** — jump between questions, see attempted/skipped/marked status
- **Practice mode** — chapter-wise and subject-wise drills from a large JEE question bank
- **Adaptive engine** — questions weighted against your accuracy, attempts and weak chapters
- **Daily challenge & weak-chapter builder** — auto-generated tests targeting your gaps
- **Analytics** — accuracy, mistake tracking, bookmarks, flashcards and formula sheets
- **Everything local** — progress, test history and bookmarks persist in your browser (IndexedDB); no account needed
- **Optional AI tutor** — explain a question with your own Gemini key (BYOK) or a server-configured key

## Tech Stack

| Layer | Choice |
| --- | --- |
| Framework | React 19 + TypeScript |
| Build | Vite |
| Persistence | Dexie (IndexedDB) — no backend database |
| AI endpoint | Serverless API (Gemini / Groq / OpenRouter, env-configured) |
| Hosting | Vercel |

## Running locally

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to ./dist
npm run preview  # preview the production build
```

## Project structure

```
src/
├── api/            # AI serverless endpoint client
├── db/             # Dexie schema + seed imports
├── engines/        # adaptive, analytics, flashcards, scoring, search, testBuilder
├── pages/          # Practice, TestBuilder, TestRunner, TestResult, Analytics, ...
├── components/     # question palette, timer, submit dialog, UI kit
├── constants/      # exams, modes, syllabus
└── stores/         # settings / test / UI state
```

## Notes

- The AI assistant is optional. You can use your own Gemini key from **Settings → AI**; it is stored only in your browser.
- All question data ships with the app — no external API is required for tests.