# 🎬 WatchWorthy

**An AI movie recommendation engine that *reasons* its way to your next film.**

WatchWorthy is a Netflix-style web app with an embedded AI agent brain. Instead of a black-box "you might also like" rail, the agent thinks out loud — analysing your mood, your time budget, and everything you've watched and rejected — then shows you its reasoning chain before it recommends. Darker and more editorial than Netflix, it's built to feel like a premium film magazine went digital.

> Submission for the **Microsoft Agents League Hackathon — Creative Apps track**.

---

## The problem it solves

Recommendation feeds are opaque and shallow. They don't know that you only have 90 minutes tonight, that you're with your parents, or that you want to avoid anything sad. WatchWorthy treats recommendation as a **multi-step reasoning task**: it gathers context, filters, scores, and *explains*, the way a knowledgeable friend would.

---

## How the agent reasoning works

The agent is driven by an explicit, ordered reasoning chain and is required to **return that chain** so it can be displayed to the user (and the judges). See [`src/lib/agent.js`](src/lib/agent.js) — the top-of-file comment block documents this in detail.

```
1. Analyse the user's mood + time available for this session
2. Cross-reference their watch history and rejected ("Not For Me") movies
3. Filter the catalogue by mood tags and duration budget
4. Score each surviving candidate against stated preferences
5. Select a top pick AND a backup pick
6. Write a personalised explanation referencing specifics the user told it
```

The model returns strict JSON:

```json
{
  "reasoning_steps": ["...", "..."],
  "primary_pick": "Parasite",
  "backup_pick": "Knives Out",
  "explanation": "Because you loved slow-burn thrillers and only have 2 hours…"
}
```

The UI renders the numbered reasoning steps, the explanation, and the picks as full movie cards.

### Two agent backends ("GitHub agents" too)

The same agent can be powered by either provider — switch in-app via **Settings (⚙)**:

| Provider | Model | Notes |
|----------|-------|-------|
| **Claude** | `claude-sonnet-4-20250514` | Primary brain, Anthropic Messages API |
| **GitHub Agent** | GitHub Models (`openai/gpt-4o-mini`) | Optional alternate, GitHub Models inference API |

### Reliability & safety

- The movie dataset is **fully local** — no external content API.
- If no key is set, or a live call fails, WatchWorthy falls back to a built-in **local reasoning engine** that runs the same 6-step chain deterministically. The app **always** returns a sensible recommendation and works offline.
- The agent is constrained to only recommend titles in the dataset and never re-recommends watched or rejected films.
- Poster URLs that 404 fall back gracefully to a dark title plaque.

---

## Features

- **Onboarding taste quiz** (mood / time / last-loved) — shown once, stored locally.
- **Home feed** — a personalised "Picked for You" hero plus Trending, Critically Acclaimed, mood-matched, and New in Cinema rows.
- **Signature movie cards** — hover to zoom the poster and reveal critic score, blurb, and streaming badges, no click required.
- **"Find Me a Movie" agent flow** — 3 qualifying questions → live multi-step reasoning → primary + backup picks.
- **Post-watch feedback** — star rating, verdict, and next-mood; this data feeds future recommendations.
- **Profile page** — stats, loved genres, watchlist, and the "Not For Me" list (with one-click un-reject) and profile reset.
- **Fully responsive** — bottom-drawer modals on mobile, centred dialogs on desktop.

---

## Tech stack

- **React 18 + Vite** (JSX)
- **Tailwind CSS** for styling (custom cinematic palette + Bebas Neue / Playfair Display / Inter)
- **react-router-dom** (HashRouter, GitHub-Pages-friendly)
- **Claude API** (`claude-sonnet-4-20250514`) / **GitHub Models** as the agent brain
- **localStorage** for profile + key persistence
- Hardcoded movie dataset — no external content API

---

## Run it locally

```bash
git clone <your-repo-url>
cd watchworthy
npm install

# optional — add a key for the LIVE agent (works without one via local fallback)
cp .env.example .env
#   then set VITE_ANTHROPIC_API_KEY=... (or VITE_GITHUB_TOKEN=...)
#   OR just paste a key in the in-app Settings (⚙) panel at runtime

npm run dev
```

Open the printed `localhost` URL. On first visit you'll get the taste quiz, then the home feed. Click **Find Me a Movie** (bottom-right) to watch the agent reason.

### Build & deploy

```bash
npm run build      # outputs to dist/
npm run preview    # preview the production build
```

`vite.config.js` sets `base: './'`, so the build works on **GitHub Pages** (a project subpath) or **Vercel** with no extra config.

---

## Project structure

```
watchworthy/
├── src/
│   ├── data/movies.js          # hardcoded dataset
│   ├── lib/agent.js            # ★ the multi-step reasoning agent (Claude + GitHub + local fallback)
│   ├── hooks/useUserProfile.js # localStorage-backed profile
│   ├── components/             # MovieCard, HeroCard, MovieRow, AgentModal,
│   │                           #   OnboardingQuiz, FeedbackModal, SettingsModal, …
│   ├── pages/                  # Home, Profile
│   ├── App.jsx                 # shell, routing, modal state
│   └── main.jsx
├── .env.example
└── README.md
```

---

## Architecture diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         React UI (Vite)                       │
│  Home / Profile · MovieCard · AgentModal · OnboardingQuiz     │
└───────────────┬───────────────────────────┬──────────────────┘
                │ user answers + profile     │ reads
                ▼                             ▼
        ┌───────────────┐            ┌──────────────────┐
        │  agent.js     │            │ useUserProfile    │
        │  (reasoning   │◀──profile──│  (localStorage)   │
        │   orchestrator)│           └──────────────────┘
        └───────┬───────┘
                │ builds prompt (system + dataset + profile + session)
        ┌───────┴───────────────────────────────┐
        ▼                ▼                        ▼
  ┌──────────┐    ┌──────────────┐        ┌────────────────┐
  │ Claude   │    │ GitHub Models│        │ local fallback │
  │ Sonnet 4 │    │  agent       │        │ reasoning eng. │
  └──────────┘    └──────────────┘        └────────────────┘
        └────────────────┴──── strict JSON ─────┘
                reasoning_steps · primary · backup · explanation
```

> Want an editable version? Drop this into a [FigJam](https://figma.com/figjam) board for the submission.

---

## How GitHub Copilot was used

This project was built with AI pair-programming assistance throughout:

- **Scaffolding** the Vite + Tailwind config and component boilerplate.
- **Autocompleting** repetitive JSX (card layouts, badge maps, quiz option arrays).
- **Drafting** the local fallback scoring heuristic in `agent.js`.
- **Iterating** on Tailwind utility combinations for the hover/zoom card interaction.

> Replace this section with your specific Copilot screenshots/notes for the final submission.

---

## Screenshots

> Add screenshots or a GIF here for the submission (home feed, agent reasoning modal, profile page). A no-narration captioned demo video works well for the Discord community vote.

---

## License

MIT — do whatever you'd like.
