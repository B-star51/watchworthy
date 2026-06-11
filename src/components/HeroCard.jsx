// HeroCard — the large "Picked for You" feature at the top of the home feed.
// Cinematic: full-bleed poster blurred behind, sharp poster on the left, big
// editorial title + critic summary on the right.

import Poster from './Poster.jsx';
import { StreamingBadges } from './StreamingBadge.jsx';
import { trailerWatchUrl } from '../data/movies.js';
import { calculateWatchWorthyScore, scoreTone } from '../lib/watchworthyScore.js';

const HERO_TONE = {
  violet: 'text-violet-soft',
  amber: 'text-gold',
  grey: 'text-white/60',
};

export default function HeroCard({ movie, label = 'Picked for You', reason, onAdd, onAskAgent, onOpenDetails, userProfile, isOnWatchlist }) {
  if (!movie) return null;
  const ww = calculateWatchWorthyScore(movie, userProfile);

  return (
    <section className="relative overflow-hidden rounded-3xl ring-1 ring-white/10">
      {/* Blurred backdrop */}
      <div className="absolute inset-0">
        <div className="h-full w-full scale-110 opacity-40 blur-2xl">
          <Poster movie={movie} />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
      </div>

      <div className="relative flex flex-col gap-6 p-6 sm:p-10 md:flex-row md:items-center">
        {/* Poster */}
        <div className="w-40 shrink-0 overflow-hidden rounded-2xl shadow-card ring-1 ring-white/10 sm:w-52">
          <div className="aspect-[2/3]">
            <Poster movie={movie} />
          </div>
        </div>

        {/* Copy */}
        <div className="min-w-0 flex-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-violet/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-violet-soft ring-1 ring-violet/30">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-violet-soft" />
            {label}
          </span>

          <h1 className="mt-3 text-display text-5xl leading-[0.95] text-white sm:text-6xl md:text-7xl">
            {movie.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
            <span className="tnum text-gold font-bold">★ {movie.critic_score}%</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="tnum">{movie.year}</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="tnum">{movie.duration_mins} min</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>{movie.genre.join(' · ')}</span>
          </div>

          {ww && (
            <div className="mt-4 inline-flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10">
              <span className={`tnum text-display text-4xl leading-none ${HERO_TONE[scoreTone(ww.score)]}`}>
                {ww.score}%
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                WatchWorthy
                <br />
                Matched to your taste
              </span>
            </div>
          )}

          <p className="mt-4 max-w-xl text-editorial text-lg italic leading-relaxed text-white/85">
            “{movie.critic_blurb}”
          </p>

          {reason && (
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-violet-soft/90">
              <span className="font-semibold text-violet-soft">Why you: </span>
              {reason}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-[11px] uppercase tracking-widest text-white/40">Where to watch</span>
            <StreamingBadges movie={movie} />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onAdd?.(movie)}
              disabled={isOnWatchlist}
              className="rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft disabled:cursor-default disabled:bg-white/10 disabled:text-white/50 disabled:shadow-none"
            >
              {isOnWatchlist ? '✓ On your watchlist' : '✅ Add to Watchlist'}
            </button>
            <a
              href={trailerWatchUrl(movie)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              ▶ Watch Trailer
            </a>
            {onOpenDetails && (
              <button
                onClick={() => onOpenDetails(movie)}
                className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                ℹ Details
              </button>
            )}
            <button
              onClick={onAskAgent}
              className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              🎬 Ask the agent for more
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
