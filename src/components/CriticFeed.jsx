// CriticFeed — the "Fresh From the Critics" row. For each in-cinema film it
// pulls current critic sentiment (Claude web search, cached 6h) and shows it
// with a pulsing LIVE badge. Falls back to the bundled blurb if search is
// unavailable, so every card always renders.

import { useEffect, useRef, useState } from 'react';
import Poster from './Poster.jsx';
import { getCriticData, cachedAt } from '../lib/criticFeed.js';

function relativeTime(ts) {
  if (!ts) return null;
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
}

export default function CriticFeed({ movies, onOpenDetails }) {
  const [feed, setFeed] = useState({}); // id -> critic data
  const [updatedLabel, setUpdatedLabel] = useState(null);
  const scroller = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const movie of movies) {
        const data = await getCriticData(movie);
        if (cancelled) return;
        setFeed((prev) => ({ ...prev, [movie.id]: data }));
      }
      if (cancelled) return;
      const newest = movies.map(cachedAt).filter(Boolean).sort((a, b) => b - a)[0];
      setUpdatedLabel(newest ? relativeTime(newest) : 'from our archive');
    })();
    return () => {
      cancelled = true;
    };
  }, [movies]);

  if (!movies || movies.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2 text-display text-3xl leading-none text-white">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22C55E] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22C55E]" />
            </span>
            Fresh From the Critics
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Real-time critic sentiment for cinema releases
            {updatedLabel ? ` · updated ${updatedLabel}` : ' · loading…'}
          </p>
        </div>
        {movies.length > 1 && (
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => scroller.current?.scrollBy({ left: -600, behavior: 'smooth' })}
              className="rounded-full bg-white/5 p-2 text-white/60 transition hover:bg-violet/30 hover:text-white"
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button
              onClick={() => scroller.current?.scrollBy({ left: 600, behavior: 'smooth' })}
              className="rounded-full bg-white/5 p-2 text-white/60 transition hover:bg-violet/30 hover:text-white"
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        )}
      </div>

      <div ref={scroller} className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
        {movies.map((movie) => {
          const data = feed[movie.id];
          return (
            <article
              key={movie.id}
              className="flex w-64 shrink-0 flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-white/5 shadow-card"
            >
              <button
                type="button"
                onClick={() => onOpenDetails?.(movie)}
                className="relative block aspect-video w-full overflow-hidden text-left"
                title={`More about ${movie.title}`}
              >
                <Poster movie={movie} />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
                <span className="absolute left-2 top-2 rounded-md bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold ring-1 ring-gold/40">
                  In Cinemas Now
                </span>
                <h3 className="absolute bottom-2 left-3 right-3 truncate text-display text-2xl leading-none text-white">
                  {movie.title}
                </h3>
              </button>

              <div className="flex flex-1 flex-col p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="tnum text-lg font-bold text-gold">
                    {data ? `${data.fresh_score}%` : `${movie.critic_score}%`}
                  </span>
                  {data?.live ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#22C55E] ring-1 ring-[#22C55E]/30">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
                      Live
                    </span>
                  ) : (
                    data && (
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest text-white/40">
                        Archive
                      </span>
                    )
                  )}
                </div>

                <p className="mb-3 text-xs leading-snug text-white/70">
                  {data ? data.consensus : 'Fetching the latest reviews…'}
                </p>

                {data && (
                  <blockquote className="mt-auto border-l-2 border-violet/60 pl-3">
                    <p className="text-[13px] italic leading-snug text-white/85">“{data.top_quote}”</p>
                    <cite className="mt-1 block text-[10px] uppercase tracking-widest text-white/40 not-italic">
                      — {data.source}
                    </cite>
                  </blockquote>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
