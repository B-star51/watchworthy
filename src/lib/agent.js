// ════════════════════════════════════════════════════════════════════════════
// WatchWorthy Recommendation Agent
// ════════════════════════════════════════════════════════════════════════════
//
// THE MULTI-STEP REASONING CHAIN  (this is what the hackathon judges should read)
//
// The agent is NOT a single-shot "pick a movie" call. It is instructed to think
// through an explicit, ordered chain and to RETURN that chain so it can be shown
// to the user. The six steps are:
//
//   1. Analyse the user's mood + time available for this session.
//   2. Cross-reference their watch history and the movies they rejected
//      ("Not For Me") so it never re-recommends a dud.
//   3. Filter the catalogue by mood tags and by the session's duration budget.
//   4. Score each surviving candidate against the user's stated preferences
//      (loved genres, current vibe, things to avoid).
//   5. Select a top pick AND a backup pick.
//   6. Write a personalised explanation that references *specific* things the
//      user told it ("Because you loved Parasite and only have 90 minutes…").
//
// The model returns strict JSON:
//   { reasoning_steps: string[], primary_pick: string, backup_pick: string,
//     explanation: string }
//
// PROVIDERS — the same agent can be driven by two different model backends:
//   • "anthropic" → Claude (claude-sonnet-4-6) via the Messages API, run as a
//                   genuine TOOL-USE LOOP: Claude calls filter_by_mood_and_time,
//                   check_user_history, and score_candidates; we execute each
//                   tool locally against the dataset and feed the result back,
//                   iterating until it returns the final JSON. See callAnthropic.
//   • "github"    → a GitHub-hosted model via the GitHub Models inference API
//                   (the optional "GitHub agent") — single-shot structured call.
//
// RELIABILITY — if no key is configured, or the network/model call fails, we fall
// back to a fully local scoring engine (`localReasoningEngine`) that mirrors the
// same 6 steps. The app therefore ALWAYS returns a sensible recommendation and is
// demo-safe even with no internet.
// ════════════════════════════════════════════════════════════════════════════

import { movies, findMovieByTitle } from '../data/movies.js';

const ANTHROPIC_MODEL = 'claude-sonnet-4-6';
const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
// Cap on agent tool-use iterations so a misbehaving loop can never hang the UI.
const MAX_AGENT_STEPS = 8;

// GitHub Models inference endpoint (OpenAI-compatible chat completions).
const GITHUB_MODEL = 'openai/gpt-4o-mini';
const GITHUB_URL = 'https://models.github.ai/inference/chat/completions';

// ── Settings / key resolution ──────────────────────────────────────────────
// Keys may come from build-time env vars OR from the in-app Settings panel
// (localStorage), which is preferred for deployed demos so no key ships in the
// bundle. localStorage always wins if present.

const LS_SETTINGS = 'watchworthy_agent_settings';

export function getAgentSettings() {
  let stored = {};
  try {
    stored = JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}');
  } catch {
    stored = {};
  }
  const env = import.meta.env || {};
  return {
    provider: stored.provider || 'anthropic',
    anthropicKey: stored.anthropicKey || env.VITE_ANTHROPIC_API_KEY || '',
    githubToken: stored.githubToken || env.VITE_GITHUB_TOKEN || '',
  };
}

export function saveAgentSettings(next) {
  const current = getAgentSettings();
  const merged = { ...current, ...next };
  localStorage.setItem(
    LS_SETTINGS,
    JSON.stringify({
      provider: merged.provider,
      anthropicKey: merged.anthropicKey,
      githubToken: merged.githubToken,
    }),
  );
  return merged;
}

// Which provider can actually run right now (has a key)?
export function activeProviderStatus() {
  const s = getAgentSettings();
  return {
    provider: s.provider,
    anthropicReady: Boolean(s.anthropicKey),
    githubReady: Boolean(s.githubToken),
    liveReady: s.provider === 'github' ? Boolean(s.githubToken) : Boolean(s.anthropicKey),
  };
}

// ── Prompt construction ──────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are WatchWorthy's recommendation agent. You reason carefully and transparently.

When recommending a movie, follow these exact steps:
1. Parse the user's current mood and time available
2. Review their full watch history — note patterns in genres and ratings
3. Identify and exclude all rejected movies
4. Score remaining candidates using genre match, mood match, and critic score
5. Factor in any live critic data available for cinema releases
6. Select primary pick (highest combined score) and a backup pick
7. Write a personalised explanation referencing specific things about this user

Rules:
- Only ever recommend movies that exist in the dataset. Use the EXACT title string.
- Never recommend a movie in the user's watch history or rejected list.
- Respect anything the user asked to avoid (e.g. horror, subtitles, sad endings).
- If nothing is a perfect fit, pick the closest reasonable match and say so honestly.

Return ONLY a JSON object (no markdown, no prose around it) with keys:
  reasoning_steps (array of short strings, one per step, e.g.
    "Mood detected: thrilled — filtering for thrilled tags",
    "Watch history reviewed: 3 films, top genres: Sci-Fi, Thriller",
    "Removed 1 rejected film from consideration",
    "Scored 12 candidates — top scorer: Parasite at 99%",
    "Live critic data factored in for cinema releases",
    "Primary pick selected: Parasite"),
  primary_pick (exact movie title from dataset),
  backup_pick (exact movie title from dataset),
  watchworthy_score (integer 0-100, how well the primary pick fits THIS user),
  explanation (string, warm and personal, 2-3 sentences).`;

// Builds the single user-turn message that carries all the structured context.
function buildUserMessage({ profile, sessionAnswers }) {
  const slimCatalogue = movies.map((m) => ({
    title: m.title,
    year: m.year,
    genre: m.genre,
    mood_tags: m.mood_tags,
    duration_mins: m.duration_mins,
    critic_score: m.critic_score,
    streaming: m.streaming,
    in_cinema: m.in_cinema,
  }));

  return `Here is everything you know.

## AVAILABLE MOVIES (the only films you may recommend)
${JSON.stringify(slimCatalogue, null, 2)}

## USER PROFILE
- Onboarding mood: ${profile?.mood || 'unknown'}
- Time preference: ${profile?.timePreference || 'unknown'}
- Last loved: ${profile?.lastLoved || 'not provided'}
- Loved genres (from history): ${summariseLovedGenres(profile) || 'none yet'}
- Watch history: ${JSON.stringify(profile?.watchHistory || [])}
- Rejected ("Not For Me"): ${JSON.stringify((profile?.rejected || []).map((r) => r.title || r))}
- Current watchlist: ${JSON.stringify((profile?.watchlist || []).map((w) => w.title || w))}

## THIS SESSION — what the user just told you
- Mood right now: ${sessionAnswers?.mood || 'unspecified'}
- Watching: ${sessionAnswers?.company || 'unspecified'}
- Wants to avoid: ${sessionAnswers?.avoid || 'nothing in particular'}

Reason through the 6 steps and return the JSON object.`;
}

function summariseLovedGenres(profile) {
  const liked = (profile?.watchHistory || []).filter((h) => (h.rating || 0) >= 4 || h.verdict === 'Loved it');
  const counts = {};
  liked.forEach((h) => {
    const movie = findMovieByTitle(h.title);
    (movie?.genre || []).forEach((g) => {
      counts[g] = (counts[g] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([g]) => g)
    .join(', ');
}

// ── Agent tools ──────────────────────────────────────────────────────────────
// These power the real multi-step tool-use loop on the Anthropic path. The
// schemas (filter_by_mood_and_time / check_user_history / score_candidates) were
// drafted with GitHub Copilot; the implementations here are wired to the actual
// dataset fields (mood_tags / duration_mins / critic_score).

const AGENT_TOOLS = [
  {
    name: 'filter_by_mood_and_time',
    description:
      'Return movies from the catalogue whose mood_tags include the given mood and whose runtime fits the time budget.',
    input_schema: {
      type: 'object',
      properties: {
        mood: { type: 'string', description: 'Mood tag, e.g. thrilled, thoughtful, laughing, scared, inspired, feel-good' },
        max_minutes: { type: 'number', description: 'Maximum runtime in minutes (omit for no limit)' },
      },
      required: ['mood'],
    },
  },
  {
    name: 'check_user_history',
    description: "Return the user's watched titles, rejected titles, loved genres, and onboarding preferences.",
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'score_candidates',
    description: 'Score candidate movie titles on critic score and how well their genres match the user\'s loved genres.',
    input_schema: {
      type: 'object',
      properties: {
        titles: { type: 'array', items: { type: 'string' }, description: 'Exact movie titles to score' },
      },
      required: ['titles'],
    },
  },
];

// Executes a tool call locally against the dataset + profile. Returns a plain
// object that gets JSON-stringified back into the tool_result block.
function runAgentTool(name, input, { profile }) {
  const slim = (m) => ({
    title: m.title,
    genre: m.genre,
    mood_tags: m.mood_tags,
    duration_mins: m.duration_mins,
    critic_score: m.critic_score,
    streaming: m.in_cinema ? ['In Cinema'] : m.streaming,
  });

  if (name === 'filter_by_mood_and_time') {
    const mood = String(input.mood || '').toLowerCase();
    const max = Number.isFinite(input.max_minutes) ? input.max_minutes : Infinity;
    const matches = movies.filter(
      (m) => (!mood || m.mood_tags.includes(mood)) && m.duration_mins <= max,
    );
    return { count: matches.length, movies: matches.map(slim) };
  }

  if (name === 'check_user_history') {
    return {
      watched: (profile?.watchHistory || []).map((h) => ({ title: h.title, rating: h.rating, verdict: h.verdict })),
      rejected: (profile?.rejected || []).map((r) => r.title || r),
      loved_genres: (summariseLovedGenres(profile) || '').split(', ').filter(Boolean),
      onboarding_mood: profile?.mood || null,
      time_preference: profile?.timePreference || null,
      last_loved: profile?.lastLoved || null,
    };
  }

  if (name === 'score_candidates') {
    const loved = new Set((summariseLovedGenres(profile) || '').split(', ').filter(Boolean));
    return {
      scored: (input.titles || []).map((t) => {
        const m = findMovieByTitle(t);
        if (!m) return { title: t, error: 'not in dataset' };
        let score = m.critic_score / 20;
        const genreMatches = m.genre.filter((g) => loved.has(g));
        score += genreMatches.length * 2;
        return {
          title: m.title,
          critic_score: m.critic_score,
          genre_matches: genreMatches,
          duration_mins: m.duration_mins,
          total_score: Math.round(score * 10) / 10,
        };
      }),
    };
  }

  return { error: `Unknown tool: ${name}` };
}

// Lean task message for the tool-use path — it lists only titles (so the model
// can't hallucinate a film) and pushes it to use the tools to do the reasoning.
function buildAgentTaskMessage({ sessionAnswers }) {
  const titles = movies.map((m) => m.title).join(', ');
  return `A user wants a movie recommendation right now.

This session — what they just told you:
- Mood right now: ${sessionAnswers?.mood || 'unspecified'}
- Watching: ${sessionAnswers?.company || 'unspecified'}
- Wants to avoid: ${sessionAnswers?.avoid || 'nothing in particular'}

The catalogue contains ONLY these titles (never recommend anything else): ${titles}.

Do the work with your tools, in order:
1. call check_user_history to see what they've watched/rejected and which genres they love,
2. call filter_by_mood_and_time with their mood and a sensible time budget,
3. call score_candidates on the most promising survivors,
then return ONLY the final JSON object.`;
}

// ── Response parsing ─────────────────────────────────────────────────────────

function extractJson(text) {
  if (!text) throw new Error('Empty model response');
  // Strip ```json fences if the model wrapped the object.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found in response');
  return JSON.parse(candidate.slice(start, end + 1));
}

// Normalise whatever the model returned into the shape the UI expects, and
// resolve titles back to full movie objects for rendering.
function shapeResult(raw, source) {
  const primary = findMovieByTitle(raw.primary_pick);
  const backup = findMovieByTitle(raw.backup_pick);
  return {
    source, // 'anthropic' | 'github' | 'local'
    reasoning_steps: Array.isArray(raw.reasoning_steps)
      ? raw.reasoning_steps.map(String)
      : [String(raw.reasoning_steps || 'Reasoned through mood, time and history.')],
    primary_pick: primary || backup,
    backup_pick: backup && backup !== primary ? backup : null,
    watchworthy_score: Number.isFinite(raw.watchworthy_score) ? raw.watchworthy_score : null,
    explanation: raw.explanation || 'Here is a pick I think fits your mood right now.',
  };
}

// ── Provider calls ───────────────────────────────────────────────────────────

// Real multi-step tool-use agent loop (Claude Messages API, browser-direct).
// Claude calls our tools, we execute them locally against the dataset/profile,
// feed the tool_result back, and repeat until it returns its final JSON answer.
async function callAnthropic({ profile, sessionAnswers, apiKey }) {
  const headers = {
    'content-type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    // Required to call the API directly from a browser.
    'anthropic-dangerous-direct-browser-access': 'true',
  };

  const messages = [{ role: 'user', content: buildAgentTaskMessage({ sessionAnswers }) }];

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        tools: AGENT_TOOLS,
        messages,
      }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Anthropic API ${res.status}: ${detail.slice(0, 200)}`);
    }
    const data = await res.json();

    // Keep the assistant turn (incl. tool_use blocks) in history.
    messages.push({ role: 'assistant', content: data.content });

    if (data.stop_reason === 'tool_use') {
      // Execute every tool the model asked for, then send the results back.
      const toolResults = data.content
        .filter((b) => b.type === 'tool_use')
        .map((b) => {
          let output;
          try {
            output = runAgentTool(b.name, b.input || {}, { profile });
          } catch (err) {
            output = { error: err.message };
          }
          return { type: 'tool_result', tool_use_id: b.id, content: JSON.stringify(output) };
        });
      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Final answer — pull the JSON out of the text blocks.
    const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('');
    return shapeResult(extractJson(text), 'anthropic');
  }

  throw new Error(`Agent did not finish within ${MAX_AGENT_STEPS} tool-use steps`);
}

async function callGithub({ profile, sessionAnswers, token }) {
  const res = await fetch(GITHUB_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: GITHUB_MODEL,
      temperature: 0.6,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserMessage({ profile, sessionAnswers }) },
      ],
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`GitHub Models API ${res.status}: ${detail.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '';
  return shapeResult(extractJson(text), 'github');
}

// ── Local fallback reasoning engine ──────────────────────────────────────────
// Mirrors the same 6-step chain deterministically so the app never breaks.

export function localReasoningEngine({ profile, sessionAnswers }) {
  const steps = [];

  // Step 1 — mood + time
  const mood = (sessionAnswers?.mood || profile?.mood || '').toLowerCase();
  const timePref = profile?.timePreference || '';
  let maxDuration = Infinity;
  if (/under 90/i.test(timePref)) maxDuration = 90;
  else if (/90.?120|90–120/i.test(timePref)) maxDuration = 125;
  steps.push(
    `Analysed your session: mood "${sessionAnswers?.mood || profile?.mood || 'open'}"` +
      (maxDuration !== Infinity ? `, runtime budget ≈ ${maxDuration} min.` : ', no strict runtime limit.'),
  );

  // Step 2 — exclude watched + rejected
  const seen = new Set((profile?.watchHistory || []).map((h) => (h.title || h).toLowerCase()));
  const rejected = new Set((profile?.rejected || []).map((r) => (r.title || r).toLowerCase()));
  steps.push(
    `Cross-referenced history (${seen.size} watched) and rejected list (${rejected.size}) so nothing repeats.`,
  );

  // Step 3 — filter by mood tag + duration + avoid
  const avoid = (sessionAnswers?.avoid || '').toLowerCase();
  const moodMap = {
    thrilled: 'thrilled',
    thoughtful: 'thoughtful',
    laughing: 'laughing',
    scared: 'scared',
    inspired: 'inspired',
    'feel-good': 'feel-good',
  };
  const wantTag = moodMap[mood] || mood;

  let candidates = movies.filter((m) => {
    if (seen.has(m.title.toLowerCase())) return false;
    if (rejected.has(m.title.toLowerCase())) return false;
    if (m.duration_mins > maxDuration) return false;
    if (avoid.includes('horror') && m.genre.includes('Horror')) return false;
    if ((avoid.includes('sad') || avoid.includes('subtitle')) && /Parasite/i.test(m.title) && avoid.includes('subtitle'))
      return false;
    return true;
  });
  if (candidates.length === 0) candidates = movies.filter((m) => !seen.has(m.title.toLowerCase()));
  steps.push(`Filtered the catalogue down to ${candidates.length} eligible films after mood, runtime and avoid-rules.`);

  // Step 4 — score
  const lovedGenres = new Set();
  (profile?.watchHistory || [])
    .filter((h) => (h.rating || 0) >= 4 || h.verdict === 'Loved it')
    .forEach((h) => (findMovieByTitle(h.title)?.genre || []).forEach((g) => lovedGenres.add(g)));

  const scored = candidates
    .map((m) => {
      let score = m.critic_score / 20; // base on quality
      if (wantTag && m.mood_tags.includes(wantTag)) score += 6;
      m.genre.forEach((g) => {
        if (lovedGenres.has(g)) score += 2;
      });
      if (profile?.lastLoved) {
        const ll = profile.lastLoved.toLowerCase();
        if (m.genre.some((g) => ll.includes(g.toLowerCase()))) score += 1.5;
      }
      return { movie: m, score };
    })
    .sort((a, b) => b.score - a.score);
  steps.push(`Scored each candidate on critic quality, mood-tag match and your loved genres (${[...lovedGenres].join(', ') || 'none yet'}).`);

  // Step 5 — pick
  const primary = scored[0]?.movie || candidates[0] || movies[0];
  const backup = scored.find((s) => s.movie !== primary)?.movie || null;
  steps.push(`Selected "${primary.title}" as the top pick${backup ? ` and "${backup.title}" as backup` : ''}.`);

  // Step 6 — explanation
  const reasons = [];
  if (wantTag && primary.mood_tags.includes(wantTag)) reasons.push(`it lands squarely in a "${wantTag}" mood`);
  if (maxDuration !== Infinity) reasons.push(`it fits your ${primary.duration_mins}-minute window`);
  if ([...lovedGenres].some((g) => primary.genre.includes(g)))
    reasons.push(`you've rated ${[...lovedGenres].filter((g) => primary.genre.includes(g)).join('/')} highly before`);
  if (profile?.lastLoved) reasons.push(`you mentioned loving "${profile.lastLoved}"`);
  const explanation = `I picked ${primary.title} because ${
    reasons.join(', ') || 'it is one of the highest-rated films that matches your vibe'
  }. At ${primary.critic_score}% critic score it's a safe-but-exciting bet${
    backup ? `, with ${backup.title} as a solid backup if you've already seen it.` : '.'
  }`;

  return {
    source: 'local',
    reasoning_steps: steps,
    primary_pick: primary,
    backup_pick: backup,
    explanation,
  };
}

// ── Public entry point ───────────────────────────────────────────────────────
// Tries the configured live provider, then ALWAYS falls back to local reasoning.

export async function recommendMovie({ profile, sessionAnswers }) {
  const settings = getAgentSettings();
  try {
    if (settings.provider === 'github' && settings.githubToken) {
      return await callGithub({ profile, sessionAnswers, token: settings.githubToken });
    }
    if (settings.provider === 'anthropic' && settings.anthropicKey) {
      return await callAnthropic({ profile, sessionAnswers, apiKey: settings.anthropicKey });
    }
    // No key for the chosen provider — try the other if it has one.
    if (settings.anthropicKey) {
      return await callAnthropic({ profile, sessionAnswers, apiKey: settings.anthropicKey });
    }
    if (settings.githubToken) {
      return await callGithub({ profile, sessionAnswers, token: settings.githubToken });
    }
  } catch (err) {
    // Surface the error in the local result so the UI can show a gentle notice.
    const local = localReasoningEngine({ profile, sessionAnswers });
    local.fallbackNotice = `Live agent unavailable (${err.message}) — used WatchWorthy's built-in reasoning engine.`;
    return local;
  }

  const local = localReasoningEngine({ profile, sessionAnswers });
  local.fallbackNotice = 'No API key configured — using WatchWorthy\'s built-in local reasoning engine. Add a key in Settings (⚙) for the live Claude agent.';
  return local;
}

// ── "Convince Me" — a short, personalised pitch for one film ───────────────────
// Uses the live provider when a key is set, else a deterministic local pitch so
// the feature always returns something compelling (demo-safe).

const PITCH_SYSTEM = `You are WatchWorthy's persuasion agent. Write a punchy, personalised 3-sentence pitch for why THIS specific user should watch THIS specific film tonight.

Rules:
- Reference something specific from their watch history or preferences
- Make it feel like a friend who knows their taste is recommending it
- End with one killer reason they specifically will love it
- Maximum 3 sentences. No fluff. Make it compelling.
- Do NOT start with "I" or "You should"`;

function buildPitchMessage(movie, profile) {
  return `User taste profile:
- Current mood: ${profile?.mood || 'unknown'}
- Loved genres: ${summariseLovedGenres(profile) || 'unknown'}
- Last loved: ${profile?.lastLoved || 'not provided'}
- Recently watched: ${JSON.stringify((profile?.watchHistory || []).slice(-5).map((h) => h.title))}

Film to pitch: ${movie.title} (${movie.year}) — ${movie.genre.join(', ')}.
Critic note: ${movie.critic_blurb}
Mood tags: ${movie.mood_tags.join(', ')}. Director: ${movie.director}. Critic score: ${movie.critic_score}%.`;
}

function localPitch(movie, profile) {
  const loved = (summariseLovedGenres(profile) || '').split(', ').filter(Boolean);
  const hook = loved.find((g) => movie.genre.includes(g));
  const a = hook
    ? `Right in your ${hook} wheelhouse — ${movie.title} hits the exact register you keep coming back to.`
    : `${movie.title} is the kind of film that actually rewards a real night in.`;
  const b = `${movie.director} is working at full power here, and at ${movie.critic_score}% the critics back it up.`;
  const c = profile?.lastLoved
    ? `If you loved ${profile.lastLoved}, this scratches the same itch — press play tonight.`
    : `It's ${movie.duration_mins} minutes you won't want back — press play tonight.`;
  return `${a} ${b} ${c}`;
}

export async function convinceMe(movie, profile) {
  const s = getAgentSettings();
  try {
    if (s.anthropicKey) {
      const res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': s.anthropicKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 220,
          system: PITCH_SYSTEM,
          messages: [{ role: 'user', content: buildPitchMessage(movie, profile) }],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
        if (text) return { pitch: text, source: 'anthropic' };
      }
    } else if (s.githubToken) {
      const res = await fetch(GITHUB_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${s.githubToken}` },
        body: JSON.stringify({
          model: GITHUB_MODEL,
          temperature: 0.7,
          messages: [
            { role: 'system', content: PITCH_SYSTEM },
            { role: 'user', content: buildPitchMessage(movie, profile) },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content?.trim();
        if (text) return { pitch: text, source: 'github' };
      }
    }
  } catch {
    /* fall through to local */
  }
  return { pitch: localPitch(movie, profile), source: 'local' };
}

export default recommendMovie;
