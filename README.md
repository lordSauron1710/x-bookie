# x-bookie

Bookmark intelligence workspace for analyzing Twitter/X bookmarks with a local-first review flow, interest-driven categorization, and a three-column UI inspired by your baseline reference.

[![Vite](https://img.shields.io/badge/Vite-8-646CFF)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6)](https://www.typescriptlang.org/)
[![Security Policies](https://img.shields.io/badge/Policies-enabled-black)](./POLICY_INDEX.md)

## What it does

- Imports bookmark data from flexible JSON, CSV, or pasted text.
- Lets users define the interests that matter to them and re-score bookmarks around those interests.
- Suggests categories, confidence, action lanes, and short explanations for why a bookmark landed in a given bucket.
- Supports manual overrides so users can correct the model without losing the fast review flow.
- Keeps the current MVP local-first in the browser while leaving room for secure future auth and sync features.

## Architecture

```text
Vite React app
  -> App shell (three-column taxonomy / bookmarks / insights layout)
  -> Local browser state + localStorage persistence
  -> Bookmark import pipeline (JSON / CSV / pasted text)
  -> Interest scoring and categorization engine
  -> Review and override workflow for selected bookmarks
```

## Repository layout

```text
x-bookie/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── data/
│   │   └── demoBookmarks.ts
│   ├── lib/
│   │   └── bookmarks.ts
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── ACCESSIBILITY.md
├── AGENTS.md
├── API.md
├── AUTH.md
├── DATABASE.md
├── DEPLOYMENT.md
├── ENV_VARIABLES.md
├── INCIDENT_RESPONSE.md
├── POLICY_INDEX.md
├── SECURITY.md
├── errors.md
├── eslint.config.js
├── index.html
├── package.json
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
```

## Prerequisites

- Node.js 20+ recommended
- npm 10+

## Quick start

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
npm run preview
```

## Current bookmark model

| Area | Current behavior |
| --- | --- |
| Import | Flexible JSON, CSV, and pasted text parsing |
| Storage | Browser localStorage |
| Categorization | Heuristic keyword matching over user interests |
| Review | Manual per-bookmark category override |
| Auth | Not implemented yet |
| Backend API | Not implemented yet |
| Database / sync | Not implemented yet |

## Documentation map

- `AGENTS.md`: primary repo instructions for architecture, product direction, and policy workflow.
- `POLICY_INDEX.md`: entrypoint to the repo policy set.
- `SECURITY.md`: repo-wide security baseline and required checks.
- `AUTH.md`: requirements for future auth, sessions, and authorization.
- `API.md`: requirements for future backend or network-facing handlers.
- `DATABASE.md`: requirements for future persistence and synced user data.
- `ENV_VARIABLES.md`: rules for introducing and documenting env vars safely.
- `DEPLOYMENT.md`: deployment posture and production rollout expectations.
- `ACCESSIBILITY.md`: accessibility requirements for the review UI.
- `INCIDENT_RESPONSE.md`: containment and recovery workflow for security incidents.
- `errors.md`: lessons learned from bugs, bad assumptions, and security mistakes.

## Security baseline

- The app is currently frontend-only and local-first. There is no trusted backend yet.
- Browser state and `localStorage` are convenience layers, not security boundaries.
- If this repo adds auth, APIs, persistence, or secrets, the relevant policy docs must be updated in the same change.
- Long-lived auth tokens must not be stored in browser storage if auth is introduced later.
- Any future server-side trust boundary should validate input, authenticate, authorize, and document required environment variables explicitly.

## Project status

- Current state: local-first MVP with import, categorization, filtering, insights, and manual overrides.
- Planned expansion areas: secure authentication, live X integration, user-specific sync, and better semantic classification.

## License

License file has not been added yet.
