// Profile page — stats, loved genres, watchlist, and the "Not For Me" list.

import { useMemo } from 'react';
import { findMovieByTitle } from '../data/movies.js';
import MovieCard from '../components/MovieCard.jsx';

export default function Profile({ profile, profileApi, onWatched, onOpenDetails }) {
  const watched = profile.watchHistory || [];

  // Loved genres: tally genres of films rated 4+ or marked "Loved it".
  const lovedGenres = useMemo(() => {
    const counts = {};
    watched
      .filter((h) => (h.rating || 0) >= 4 || h.verdict === 'Loved it')
      .forEach((h) => {
        const movie = findMovieByTitle(h.title);
        (movie?.genre || []).forEach((g) => (counts[g] = (counts[g] || 0) + 1));
      });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g);
  }, [watched]);

  const avgRating = watched.length
    ? (watched.reduce((s, h) => s + (h.rating || 0), 0) / watched.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-display text-6xl leading-none text-white">Your Profile</h1>
        <p className="mt-2 text-sm text-white/45">The agent learns from everything below.</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Movies Watched" value={watched.length} />
        <Stat label="Avg Rating" value={avgRating} suffix={watched.length ? ' ★' : ''} />
        <Stat label="On Watchlist" value={profile.watchlist.length} />
        <Stat label="Not For Me" value={profile.rejected.length} />
      </div>

      {/* Loved genres */}
      <section>
        <h2 className="mb-3 text-display text-3xl text-white">Genres You Love</h2>
        {lovedGenres.length === 0 ? (
          <p className="text-sm text-white/40">
            Watch and rate a few films and your taste profile will appear here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lovedGenres.map((g) => (
              <span
                key={g}
                className="rounded-full bg-violet/20 px-4 py-1.5 text-sm font-semibold text-violet-soft ring-1 ring-violet/30"
              >
                {g}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Watchlist */}
      <section>
        <h2 className="mb-3 text-display text-3xl text-white">Your Watchlist</h2>
        {profile.watchlist.length === 0 ? (
          <p className="text-sm text-white/40">Empty — add films from the home feed or the agent.</p>
        ) : (
          <div className="no-scrollbar flex flex-wrap gap-4">
            {profile.watchlist.map((m) => (
              <MovieCard
                key={m.id}
                movie={m}
                state="watchlist"
                onWatched={onWatched}
                onReject={profileApi.rejectMovie}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>
        )}
      </section>

      {/* Watch history */}
      {watched.length > 0 && (
        <section>
          <h2 className="mb-3 text-display text-3xl text-white">Watch History</h2>
          <div className="overflow-hidden rounded-2xl ring-1 ring-white/10">
            {watched
              .slice()
              .reverse()
              .map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-4 border-b border-white/5 bg-surface px-4 py-3 last:border-0"
                >
                  <span className="truncate font-semibold text-white">{h.title}</span>
                  <div className="flex items-center gap-3 text-sm text-white/50">
                    <span className="tnum text-gold">{'★'.repeat(h.rating || 0)}</span>
                    <span className="hidden sm:inline">{h.verdict}</span>
                  </div>
                </div>
              ))}
          </div>
        </section>
      )}

      {/* Not for me */}
      <section>
        <h2 className="mb-3 text-display text-3xl text-white">Not For Me</h2>
        {profile.rejected.length === 0 ? (
          <p className="text-sm text-white/40">You haven't dismissed anything yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.rejected.map((r) => (
              <button
                key={r.id}
                onClick={() => profileApi.unrejectMovie(r.id)}
                className="group rounded-full bg-white/5 px-4 py-1.5 text-sm text-white/55 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
                title="Click to un-reject"
              >
                {r.title} <span className="text-white/30 group-hover:text-violet-soft">↺</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Reset */}
      <section className="border-t border-white/5 pt-8">
        <button
          onClick={() => {
            if (confirm('Reset your entire WatchWorthy profile? This clears history, watchlist and onboarding.')) {
              profileApi.resetProfile();
            }
          }}
          className="rounded-xl bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-300 ring-1 ring-red-500/20 transition hover:bg-red-500/20"
        >
          Reset Profile
        </button>
      </section>
    </div>
  );
}

function Stat({ label, value, suffix = '' }) {
  return (
    <div className="rounded-2xl bg-surface p-5 ring-1 ring-white/10">
      <p className="tnum text-display text-5xl text-white">
        {value}
        <span className="text-2xl text-gold">{suffix}</span>
      </p>
      <p className="mt-1 text-xs uppercase tracking-widest text-white/40">{label}</p>
    </div>
  );
}
