// MovieDetailsModal — full movie view opened by clicking a card poster/title.
// Shows the trailer (embedded inline when we have a verified YouTube ID, else a
// "Watch on YouTube" button), a clear "Where to watch" section with clickable
// streaming links, plus cast/director and the watchlist actions.

import Modal from './Modal.jsx';
import Poster from './Poster.jsx';
import StreamingBadge from './StreamingBadge.jsx';
import { trailerEmbedUrl, trailerWatchUrl, streamingUrl, showtimesUrl } from '../data/movies.js';

export default function MovieDetailsModal({ movie, open, onClose, profileApi, onWatched }) {
  if (!movie) return null;

  const embed = trailerEmbedUrl(movie);
  const onWatchlist = profileApi?.isOnWatchlist?.(movie.id);
  const isRejected = profileApi?.isRejected?.(movie.id);

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-3xl">
      {/* Trailer / hero */}
      <div className="relative aspect-video w-full overflow-hidden rounded-t-3xl bg-black sm:rounded-t-3xl">
        {embed ? (
          <iframe
            className="h-full w-full"
            src={embed}
            title={`${movie.title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="relative h-full w-full">
            <div className="absolute inset-0 scale-110 opacity-50 blur-md">
              <Poster movie={movie} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink to-transparent" />
            <a
              href={trailerWatchUrl(movie)}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white transition hover:scale-[1.02]"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-violet text-2xl shadow-glow">
                ▶
              </span>
              <span className="text-sm font-semibold">Watch Trailer on YouTube</span>
            </a>
          </div>
        )}
      </div>

      <div className="p-6 sm:p-8">
        <h2 className="text-display text-5xl leading-none text-white">{movie.title}</h2>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-white/60">
          <span className="tnum font-bold text-gold">★ {movie.critic_score}%</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="tnum">{movie.year}</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span className="tnum">{movie.duration_mins} min</span>
          <span className="h-1 w-1 rounded-full bg-white/20" />
          <span>{movie.genre.join(' · ')}</span>
        </div>

        <p className="mt-4 text-editorial text-lg italic leading-relaxed text-white/85">“{movie.critic_blurb}”</p>

        <div className="mt-4 space-y-1 text-sm text-white/55">
          <p>
            <span className="text-white/40">Director: </span>
            {movie.director}
          </p>
          <p>
            <span className="text-white/40">Cast: </span>
            {movie.cast.join(', ')}
          </p>
        </div>

        {/* Where to watch */}
        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-soft">Where to watch</p>
          {movie.in_cinema ? (
            <a
              href={showtimesUrl(movie)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-gold/15 px-4 py-2.5 text-sm font-semibold text-gold ring-1 ring-gold/30 transition hover:bg-gold/25"
            >
              🎟️ In cinemas now — find showtimes ↗
            </a>
          ) : movie.streaming.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {movie.streaming.map((p) => (
                <a
                  key={p}
                  href={streamingUrl(p, movie)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/10 transition hover:bg-violet/20 hover:ring-violet/40"
                >
                  Watch on {p} ↗
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-white/40">Not yet available to stream — coming soon.</p>
          )}
        </div>

        {/* Trailer link (always present, even when embedded) */}
        <a
          href={trailerWatchUrl(movie)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-2 text-sm text-white/50 transition hover:text-white"
        >
          ▶ Open trailer on YouTube ↗
        </a>

        {/* Actions */}
        <div className="mt-7 flex flex-wrap gap-3">
          {onWatchlist ? (
            <button
              onClick={() => {
                onWatched?.(movie);
                onClose?.();
              }}
              className="rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft"
            >
              ✓ Mark as watched
            </button>
          ) : (
            <button
              onClick={() => profileApi?.addToWatchlist?.(movie)}
              className="rounded-xl bg-violet px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft"
            >
              ✅ Add to Watchlist
            </button>
          )}
          <button
            onClick={() => profileApi?.rejectMovie?.(movie)}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              isRejected
                ? 'bg-white/10 text-white/40'
                : 'bg-white/5 text-white/60 hover:bg-red-500/20 hover:text-red-300'
            }`}
          >
            ❌ Not for me
          </button>
        </div>
      </div>
    </Modal>
  );
}
