# PartyOG

Modern black-and-white playground for free party games, built with Next.js (App Router) and TailwindCSS.

## Tech Stack

- Next.js 14 (App Router, TypeScript)
- React 18
- TailwindCSS 3

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000` to explore the homepage and navigate to `/truth-or-dare` for the interactive game.

## Structure

- `app/` – App Router pages, layouts, and global styles
- `components/` – Reusable UI and game-specific components
- `data/truth_or_dare.js` – Local store for truth/dare prompts
- `lib/` – Utility helpers (e.g., className merging)

## Deployment

The site is fully static and can be deployed for free via Vercel, Netlify, or any platform that supports Next.js static output.
