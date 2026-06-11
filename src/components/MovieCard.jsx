// MovieCard — the signature browse card.
// On hover the poster zooms and a gradient overlay reveals the critic score,
// streaming badges and critic blurb. Also shows the personalised WatchWorthy
// Score, and a "Convince Me" button that flips the card to a tailored pitch.

import { useState } from 'react';
import Poster from './Poster.jsx';
import { StreamingBadges } from './StreamingBadge.jsx';
import { trailerWatchUrl } from '../data/movies.js';
import { calculateWatchWorthyScore, scoreTone } from '../lib/watchworthyScore.js';
import { convinceMe } from '../lib/agent.js';

function ScoreChip({ score }) {
  const tone = score >= 90 ? 'text-gold' : score >= 75 ? 'text-violet-soft' : 'text-white/70';
  return (
    <span className={`tnum text-sm font-bold ${tone}`} title="Critic score">
      ★ {score}%
    </span>
  );
}

const WW_TONE = {
  violet: 'bg-violet/20 text-violet-soft ring-violet/40',
  amber: 'bg-gold/20 text-gold ring-gold/40',
  grey: 'bg-white/5 text-white/55 ring-white/10',
};

// The personalised WatchWorthy Score badge (or the "unlock" hint).
export function WatchWorthyBadge({ ww, className = '' }) {
  if (!ww) {
    return (
      <span
        className={`inline-flex items-center rounded-lg bg-white/5 px-2 py-1 text-[10px] font-medium text-white/40 ring-1 ring-white/10 ${className}`}
      >
        Rate films to unlock your score
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ${WW_TONE[scoreTone(ww.score)]} ${className}`}
      title={`Critic ${ww.breakdown.critic}% · genre fit ${ww.breakdown.genreBonus} · mood fit ${ww.breakdown.moodBonus}`}
    >
      <span className="grid h-3.5 w-3.5 place-items-center rounded-[3px] bg-current/20 text-[8px]">WW</span>
      {ww.score}% for you
    </span>
  );
}

export default function MovieCard({ movie, onAdd, onReject, onWatched, onOpenDetails, userProfile, state, compact = false }) {
  const isWatchlist = state === 'watchlist';
  const isRejected = state === 'rejected';
  const ww = calculateWatchWorthyScore(movie, userProfile);

  const [showPitch, setShowPitch] = useState(false);
  const [pitch, setPitch] = useState('');
  const [pitchLoading, setPitchLoading] = useState(false);

  const runConvince = async () => {
    setShowPitch(true);
    setPitchLoading(true);
    setPitch('');
    const res = await convinceMe(movie, userProfile);
    setPitch(res.pitch);
    setPitchLoading(false);
  };

  return (
    <div
      className={`group relative shrink-0 overflow-hidden rounded-xl bg-surface ring-1 ring-white/5 shadow-card transition-all duration-300 hover:ring-violet/40 hover:shadow-glow ${
        compact ? 'w-40 sm:w-44' : 'w-44 sm:w-52'
      }`}
    >
      {/* Poster (click opens full details) */}
      <button
        type="button"
        onClick={() => onOpenDetails?.(movie)}
        className="relative block aspect-[2/3] w-full overflow-hidden text-left"
        title={`More about ${movie.title}`}
      >
        <div className="h-full w-full transition-transform duration-500 ease-out group-hover:scale-110">
          <Poster movie={movie} />
        </div>

        {/* Always-on bottom gradient for legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-ink via-ink/60 to-transparent" />

        {/* Top-right critic score */}
        <div className="absolute right-2 top-2 rounded-md bg-ink/70 px-1.5 py-0.5 backdrop-blur">
          <ScoreChip score={movie.critic_score} />
        </div>

        {isRejected && (
          <div className="absolute left-2 top-2 rounded-md bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/50">
            Not for me
          </div>
        )}

        {/* Hover-revealed blurb + badges + trailer */}
        <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <p className="mb-2 line-clamp-2 text-xs leading-snug text-white/80">{movie.critic_blurb}</p>
          <StreamingBadges movie={movie} />
          <a
            href={trailerWatchUrl(movie)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold text-white ring-1 ring-white/15 transition hover:bg-violet/40"
          >
            ▶ Trailer
          </a>
        </div>
      </button>

      {/* Title block */}
      <div className="p-3">
        <h3
          onClick={() => onOpenDetails?.(movie)}
          className="cursor-pointer truncate text-display text-xl leading-none text-white transition hover:text-violet-soft"
          title={movie.title}
        >
          {movie.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-white/45">
          <span className="tnum">{movie.year}</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="truncate">{movie.genre.join(' · ')}</span>
        </div>

        {/* WatchWorthy Score */}
        <div className="mt-2">
          <WatchWorthyBadge ww={ww} />
        </div>

        {/* Convince me */}
        <button
          onClick={runConvince}
          className="mt-2 w-full rounded-lg bg-white/5 px-2 py-1.5 text-[11px] font-semibold text-violet-soft ring-1 ring-violet/20 transition hover:bg-violet/15"
        >
          💬 Convince me
        </button>

        {/* Actions */}
        <div className="mt-2 flex gap-2">
          {isWatchlist ? (
            <button
              onClick={() => onWatched?.(movie)}
              className="flex-1 rounded-lg bg-violet/90 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-violet"
            >
              ✓ Watched it
            </button>
          ) : (
            <button
              onClick={() => onAdd?.(movie)}
              className="flex-1 rounded-lg bg-white/10 px-2 py-1.5 text-xs font-semibold text-white transition hover:bg-violet/80"
              title="Add to watchlist"
            >
              ✅ Watchlist
            </button>
          )}
          <button
            onClick={() => onReject?.(movie)}
            className={`rounded-lg px-2 py-1.5 text-xs font-semibold transition ${
              isRejected
                ? 'bg-white/10 text-white/40 hover:bg-white/15'
                : 'bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-300'
            }`}
            title="Not for me"
          >
            ❌
          </button>
        </div>
      </div>

      {/* ── "Convince Me" pitch overlay ──────────────────────────────────── */}
      {showPitch && (
        <div className="absolute inset-0 z-20 flex flex-col bg-gradient-to-br from-[#1a1230] via-surface-2 to-ink/95 p-4 ring-1 ring-violet/40 animate-scale-in">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-violet-soft">
            Why you, tonight
          </p>

          <div className="flex-1 overflow-y-auto thin-scroll">
            {pitchLoading ? (
              <p className="text-sm italic text-white/60">
                Crafting your pitch
                <span className="animate-pulse">…</span>
              </p>
            ) : (
              <p className="text-[13px] italic leading-relaxed text-white/90">{pitch}</p>
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                onAdd?.(movie);
                setShowPitch(false);
              }}
              disabled={pitchLoading || isWatchlist}
              className="flex-1 rounded-lg bg-violet px-2 py-1.5 text-[11px] font-semibold text-white transition hover:bg-violet-soft disabled:opacity-50"
            >
              ✅ Add to Watchlist
            </button>
            <button
              onClick={() => setShowPitch(false)}
              className="rounded-lg bg-white/10 px-2 py-1.5 text-[11px] font-semibold text-white/70 transition hover:bg-white/20"
            >
              Still not convinced
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
