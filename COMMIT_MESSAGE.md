# WatchWorthy: Complete Project Build

## Summary
Netflix-style AI movie recommendation engine with multi-step reasoning agent (Claude / GitHub Models) for the Microsoft Agents League Hackathon — Creative Apps track.

## Major Features & Phases

### Phase 1: Foundation & Core Agent
- **Initial scaffold**: React 18 + Vite, Tailwind CSS, react-router-dom (HashRouter for GitHub Pages)
- **Onboarding quiz**: Mood / time preference / last-loved film (shown once, stored locally)
- **Home feed**: Personalised "Picked for You" hero + Trending, Critically Acclaimed, mood-matched, and New in Cinema rows
- **Movie cards**: Signature browse cards with hover-reveal (poster zoom, critic score, streaming badges, blurb)
- **Agent core**: Multi-step local fallback reasoning engine (6-step chain) — always works without keys
- **Profile page**: Stats, loved genres, watchlist, "Not For Me" list, reset option
- **Streaming badges**: Netflix, Prime Video, Disney+ clickable links; cinema showtimes search

### Phase 2: Real Tool-Use Agent Loop & UX Polish
- **Claude tool-use loop**: Genuine multi-step agent (filter_by_mood_and_time, check_user_history, score_candidates)
  - Tools execute locally against the dataset; iterate until final JSON returned
  - Browser-direct via Anthropic Messages API with `anthropic-dangerous-direct-browser-access` header
- **Agent Thinking UI**: Typewriter reasoning trace replaces spinner (watched/rejected/candidate counts)
- **WatchWorthy Score**: Explainable composite score (critic 40% + genre fit 35% + mood fit 25%)
  - Colour-coded badge ("% for you") on every card; "Rate films to unlock" hint before taste signal
- **Convince Me**: Per-card overlay with personalised 3-sentence pitch (Claude/GitHub when keyed, local fallback)
- **Live Critic Feed**: "Fresh From the Critics" row for cinema releases via Claude web_search tool
  - Cached 6h; pulsing LIVE badge; falls back to bundled blurb so cards never break
- **Movie Details Modal**: Trailers (YouTube embeds for marquee titles, search fallback), "where to watch" links
- **Post-watch feedback**: Star rating, verdict (Loved it / Meh / Not for me), next-mood

### Phase 3: Data & Content
- **Catalogue expansion**: 30 → 50 → 77 films
  - Initial: Parasite, Knives Out, The Shawshank Redemption, etc.
  - Phase 2 add: The Matrix, Gladiator, WALL·E, Toy Story, Her, Spirited Away, etc.
  - Phase 3 add: Avatar: Fire and Ash, Shrek 5, Avengers: Doomsday, The Odyssey
- **Streaming platforms**: Netflix, Prime Video, Disney+, Hulu, HBO Max, Paramount+, Apple TV+
- **In-cinema releases**: Tracked separately for the critic feed and streaming badge logic

### Phase 4: Presentation & Hackathon Submission
- **Architecture diagram** (docs/architecture.svg): Shows GitHub Copilot build/dev workflow lane + Claude runtime agent-loop lane (tools, dataset, fallback, score, critic feed, PWA)
- **Hero banner** (docs/banner.svg): On-brand wordmark, tagline, feature chips, play mark
- **Logo** (docs/logo.svg): Clean wordmark + play-disc mark
- **Project structure diagram** (docs/structure.svg): Terminal-styled file tree
- **README**: Polished narrative, tech stack, feature list, architecture diagrams, Copilot usage notes
- **PWA**: Web manifest, generated icons (192/512), service worker (network-first navigations, stale-while-revalidate assets)

### Phase 5: Bug Fixes & Polish
- **Fixed truncated Tailwind class** in floating button (hover:bg-violet-soft)
- **Updated Claude model name** in Settings UI to match agent (claude-sonnet-4-20250514)

## Technology Stack
- **React 18 + Vite** (JSX)
- **Tailwind CSS** with custom cinematic palette (Bebas Neue, Playfair Display, Inter)
- **react-router-dom** (HashRouter, GitHub Pages compatible)
- **Claude API** (claude-sonnet-4-20250514) + **GitHub Models** (openai/gpt-4o-mini) as agent brains
- **localStorage** for profile + key persistence
- **Hardcoded movie dataset** (no external content API)
- **Fully responsive** (bottom-drawer modals on mobile, centred dialogs on desktop)

## Key Architectural Decisions
1. **Multi-step reasoning chain**: Explicit 6-step contract (mood analysis → history review → filtering → scoring → picking → explanation) returned to UI
2. **Deterministic local fallback**: Same 6-step chain runs in plain JS when no key/network, so app never breaks
3. **Browser-direct API calls**: No backend; keys stored in localStorage only
4. **Explainable scoring**: WatchWorthy Score breakdown shown alongside the number, not opaque
5. **Graceful degradation**: All features (trailers, critic feed, live agent) fall back to sensible defaults

## GitHub Copilot Usage
- Tool schemas drafted with Copilot assistance
- Repetitive JSX boilerplate (card layouts, badge maps, quiz arrays) autocompleted
- Tailwind utility combinations for hover/zoom card interaction iterated with Copilot
- Local fallback scoring heuristic drafted with Copilot

## Submission for Microsoft Agents League Hackathon
- **Track**: Creative Apps
- **Theme**: Multi-step reasoning agent that thinks out loud
- **Why it matters**: Recommendation feeds are opaque; WatchWorthy treats recommendations as a reasoned conversation, showing every step

---

## Co-Authors
- **Claude** (Anthropic) — Agent reasoning, scoring logic, system prompts, feature design
- **GitHub Copilot** — Tool schemas, JSX scaffolding, utility combinations, code acceleration
