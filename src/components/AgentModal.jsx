// AgentModal — the "Find Me a Movie" flow.
// 1. Asks 3 qualifying questions (mood / company / avoid).
// 2. Calls the recommendation agent (Claude or GitHub model, with local fallback).
// 3. Renders the agent's MULTI-STEP REASONING, then the primary + backup picks.

import { useState } from 'react';
import Modal from './Modal.jsx';
import MovieCard from './MovieCard.jsx';
import { recommendMovie, activeProviderStatus } from '../lib/agent.js';

const MOODS = ['Thrilled', 'Thoughtful', 'Laughing', 'Scared', 'Inspired', 'Feel-good'];
const COMPANY = ['Just me', 'With a partner', 'Friends', 'Family'];
const AVOID = ['Horror', 'Subtitles', 'Sad endings', 'Anything over 2h', 'Nothing — surprise me'];

export default function AgentModal({ open, onClose, profile, profileApi, onWatched, onOpenDetails }) {
  const [phase, setPhase] = useState('questions'); // questions | thinking | result | error
  const [mood, setMood] = useState('');
  const [company, setCompany] = useState('');
  const [avoid, setAvoid] = useState('');
  const [result, setResult] = useState(null);
  const status = activeProviderStatus();

  const reset = () => {
    setPhase('questions');
    setMood('');
    setCompany('');
    setAvoid('');
    setResult(null);
  };

  const handleClose = () => {
    onClose?.();
    // Reset shortly after close so the next open is fresh.
    setTimeout(reset, 300);
  };

  const run = async () => {
    setPhase('thinking');
    try {
      const rec = await recommendMovie({
        profile,
        sessionAnswers: { mood, company, avoid },
      });
      setResult(rec);
      setPhase('result');
    } catch (err) {
      setResult({ error: err.message });
      setPhase('error');
    }
  };

  const sourceLabel = {
    anthropic: 'Claude (claude-sonnet-4)',
    github: 'GitHub model agent',
    local: 'Built-in reasoning engine',
  };

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-3xl">
      <div className="p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet/20 text-2xl ring-1 ring-violet/30">
            🎬
          </div>
          <div>
            <h2 className="text-display text-3xl leading-none text-white">Find Me a Movie</h2>
            <p className="text-xs text-white/45">
              {status.liveReady
                ? `Live agent: ${status.provider === 'github' ? 'GitHub model' : 'Claude'}`
                : 'Local reasoning engine (add a key in Settings for the live agent)'}
            </p>
          </div>
        </div>

        {/* ── QUESTIONS ───────────────────────────────────────────────── */}
        {phase === 'questions' && (
          <div className="animate-fade-in space-y-6">
            <Question label="What's your mood right now?" options={MOODS} value={mood} onChange={setMood} />
            <Question label="Who's watching?" options={COMPANY} value={company} onChange={setCompany} />
            <Question label="Anything to avoid?" options={AVOID} value={avoid} onChange={setAvoid} />

            <button
              onClick={run}
              disabled={!mood}
              className="w-full rounded-xl bg-violet px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
            >
              Reason it out →
            </button>
          </div>
        )}

        {/* ── THINKING ────────────────────────────────────────────────── */}
        {phase === 'thinking' && (
          <div className="animate-fade-in py-10 text-center">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-2 border-white/10 border-t-violet" />
            <p className="text-display text-2xl text-white">Reasoning through the catalogue…</p>
            <p className="mt-2 text-sm text-white/45">
              Analysing mood, cross-referencing your history, scoring candidates.
            </p>
          </div>
        )}

        {/* ── RESULT ──────────────────────────────────────────────────── */}
        {phase === 'result' && result && (
          <div className="animate-fade-in space-y-6">
            {result.fallbackNotice && (
              <div className="rounded-xl bg-gold/10 px-4 py-3 text-xs text-gold ring-1 ring-gold/20">
                {result.fallbackNotice}
              </div>
            )}

            {/* Reasoning chain */}
            <div className="rounded-2xl bg-ink/60 p-5 ring-1 ring-white/10">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-semibold uppercase tracking-widest text-violet-soft">
                  Agent reasoning
                </span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40">
                  {sourceLabel[result.source] || result.source}
                </span>
              </div>
              <ol className="space-y-2">
                {result.reasoning_steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-white/75">
                    <span className="tnum mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet/20 text-[11px] font-bold text-violet-soft">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Explanation */}
            <p className="text-editorial text-lg italic leading-relaxed text-white/90">“{result.explanation}”</p>

            {/* Picks */}
            <div className="flex flex-wrap items-start gap-6">
              {result.primary_pick && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold">Top pick</p>
                  <MovieCard
                    movie={result.primary_pick}
                    state={
                      profileApi?.isOnWatchlist?.(result.primary_pick.id)
                        ? 'watchlist'
                        : profileApi?.isRejected?.(result.primary_pick.id)
                          ? 'rejected'
                          : 'default'
                    }
                    onAdd={profileApi?.addToWatchlist}
                    onReject={profileApi?.rejectMovie}
                    onWatched={onWatched}
                    onOpenDetails={onOpenDetails}
                  />
                </div>
              )}
              {result.backup_pick && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">Backup</p>
                  <MovieCard
                    movie={result.backup_pick}
                    compact
                    state={
                      profileApi?.isOnWatchlist?.(result.backup_pick.id)
                        ? 'watchlist'
                        : profileApi?.isRejected?.(result.backup_pick.id)
                          ? 'rejected'
                          : 'default'
                    }
                    onAdd={profileApi?.addToWatchlist}
                    onReject={profileApi?.rejectMovie}
                    onWatched={onWatched}
                    onOpenDetails={onOpenDetails}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={reset}
                className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                ↺ Ask again
              </button>
              <button
                onClick={handleClose}
                className="rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-soft"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ── ERROR ───────────────────────────────────────────────────── */}
        {phase === 'error' && (
          <div className="animate-fade-in py-8 text-center">
            <p className="text-display text-2xl text-white">Something went sideways</p>
            <p className="mt-2 text-sm text-white/50">{result?.error}</p>
            <button
              onClick={reset}
              className="mt-5 rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-soft"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Question({ label, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-white/80">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(value === opt ? '' : opt)}
            className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition ${
              value === opt
                ? 'bg-violet/25 ring-violet text-white'
                : 'bg-white/5 ring-white/10 text-white/65 hover:bg-white/10'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
