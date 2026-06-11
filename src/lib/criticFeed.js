// ──────────────────────────────────────────────────────────────────────────
// Live Critic Feed — pulls *current* critic sentiment for in-cinema films via
// Claude's web_search tool. Results are cached in localStorage for 6 hours, and
// any failure (no key, no search results, parse error) falls back gracefully to
// the film's bundled critic_blurb so a card is NEVER broken or empty.
//
// Returns: { fresh_score, consensus, top_quote, source, last_updated, live }
//   live=true  → real, freshly-searched data (gets the pulsing LIVE badge)
//   live=false → dataset fallback (no LIVE badge)
// ──────────────────────────────────────────────────────────────────────────

import { getAgentSettings } from './agent.js';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const CACHE_PREFIX = 'watchworthy_critics_';
const TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function cacheKey(movie) {
  return `${CACHE_PREFIX}${movie.id}`;
}

function readCache(movie) {
  try {
    const raw = localStorage.getItem(cacheKey(movie));
    if (!raw) return null;
    const { at, data } = JSON.parse(raw);
    if (Date.now() - at > TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(movie, data) {
  try {
    localStorage.setItem(cacheKey(movie), JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* non-fatal */
  }
}

function fallback(movie) {
  return {
    fresh_score: movie.critic_score,
    consensus: movie.critic_blurb,
    top_quote: movie.critic_blurb,
    source: 'WatchWorthy archive',
    last_updated: 'from our notes',
    live: false,
  };
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('no json');
  return JSON.parse(candidate.slice(start, end + 1));
}

async function searchLive(movie, apiKey) {
  const prompt = `Search for the latest critic reviews for the film "${movie.title}" (${movie.year}).
Return a JSON object with:
- fresh_score: current Rotten Tomatoes or Metacritic % (number)
- consensus: one sentence summarising critic opinion right now (string)
- top_quote: the most interesting critic quote you find, under 15 words (string)
- source: which publication the quote is from (string)
- last_updated: today's date (string)

Return ONLY valid JSON, no other text.`;

  // web_search is a server-side tool; Claude runs the search and may pause_turn.
  // We loop a few times, feeding the assistant turn back, until it answers.
  const messages = [{ role: 'user', content: prompt }];
  const headers = {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  };

  for (let step = 0; step < 4; step++) {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 800,
        tools: [{ type: 'web_search_20260209', name: 'web_search' }],
        messages,
      }),
    });
    if (!res.ok) throw new Error(`anthropic ${res.status}`);
    const data = await res.json();
    messages.push({ role: 'assistant', content: data.content });

    if (data.stop_reason === 'pause_turn') continue; // server tool still working

    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    const parsed = extractJson(text);
    return {
      fresh_score: Number(parsed.fresh_score) || movie.critic_score,
      consensus: String(parsed.consensus || movie.critic_blurb),
      top_quote: String(parsed.top_quote || movie.critic_blurb),
      source: String(parsed.source || 'Critics'),
      last_updated: String(parsed.last_updated || new Date().toLocaleDateString()),
      live: true,
    };
  }
  throw new Error('search did not converge');
}

// Public: get critic data for one film (cache → live → fallback).
export async function getCriticData(movie) {
  const cached = readCache(movie);
  if (cached) return cached;

  const { anthropicKey } = getAgentSettings();
  if (!anthropicKey) return fallback(movie); // no key → dataset blurb, no LIVE badge

  try {
    const live = await searchLive(movie, anthropicKey);
    writeCache(movie, live);
    return live;
  } catch {
    return fallback(movie);
  }
}

// When was this film's live data last fetched (ms epoch), or null.
export function cachedAt(movie) {
  try {
    const raw = localStorage.getItem(cacheKey(movie));
    return raw ? JSON.parse(raw).at : null;
  } catch {
    return null;
  }
}
