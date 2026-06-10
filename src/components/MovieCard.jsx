// MovieCard — the signature browse card.
// On hover the poster zooms and a gradient overlay reveals the critic score,
// streaming badges and critic blurb. No click needed to see the key info.

import Poster from './Poster.jsx';
import { StreamingBadges } from './StreamingBadge.jsx';
import { trailerWatchUrl } from '../data/movies.js';

function ScoreChip({ score }) {
  const tone = score >= 90 ? 'text-gold' : score >= 75 ? 'text-violet-soft' : 'text-white/70';
  return (
    <span className={`tnum text-sm font-bold ${tone}`} title="Critic score">
      ★ {score}%
    </span>
  );
}

export default function MovieCard({ movie, onAdd, onReject, onWatched, onOpenDetails, state, compact = false }) {
  const isWatchlist = state === 'watchlist';
  const isRejected = state === 'rejected';

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

        {/* Top-right score */}
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

        {/* Actions */}
        <div className="mt-3 flex gap-2">
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
    </div>
  );
}
