// MovieRow — a titled horizontal scroll row of MovieCards with arrow controls.

import { useRef } from 'react';
import MovieCard from './MovieCard.jsx';

export default function MovieRow({ title, subtitle, movies, profileApi, onWatched, onOpenDetails, emptyHint }) {
  const scroller = useRef(null);

  const scrollBy = (dir) => {
    scroller.current?.scrollBy({ left: dir * 600, behavior: 'smooth' });
  };

  return (
    <section className="group/row">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-display text-3xl leading-none text-white">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-white/45">{subtitle}</p>}
        </div>
        {movies.length > 0 && (
          <div className="hidden gap-2 sm:flex">
            <button
              onClick={() => scrollBy(-1)}
              className="rounded-full bg-white/5 p-2 text-white/60 transition hover:bg-violet/30 hover:text-white"
              aria-label="Scroll left"
            >
              ‹
            </button>
            <button
              onClick={() => scrollBy(1)}
              className="rounded-full bg-white/5 p-2 text-white/60 transition hover:bg-violet/30 hover:text-white"
              aria-label="Scroll right"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {movies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-white/40">
          {emptyHint || 'Nothing here yet.'}
        </div>
      ) : (
        <div ref={scroller} className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto px-1 pb-2">
          {movies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              state={
                profileApi?.isOnWatchlist?.(movie.id)
                  ? 'watchlist'
                  : profileApi?.isRejected?.(movie.id)
                    ? 'rejected'
                    : 'default'
              }
              onAdd={profileApi?.addToWatchlist}
              onReject={profileApi?.rejectMovie}
              onWatched={onWatched}
              onOpenDetails={onOpenDetails}
              userProfile={profileApi?.profile}
            />
          ))}
        </div>
      )}
    </section>
  );
}
