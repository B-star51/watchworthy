// Poster image with graceful fallback: if the TMDB url 404s (several of the 2026
// titles use placeholder paths that don't exist), we render a dark gradient
// plaque with the movie title instead of a broken-image icon.

import { useState } from 'react';

export default function Poster({ movie, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (failed || !movie.poster_url || movie.poster_url.includes('placeholder')) {
    return (
      <div
        className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-surface-2 to-ink p-4 text-center ${className}`}
      >
        <span className="text-display text-2xl leading-tight text-violet-soft/90">{movie.title}</span>
        <span className="mt-2 tnum text-xs text-white/40">{movie.year}</span>
      </div>
    );
  }

  return (
    <img
      src={movie.poster_url}
      alt={`${movie.title} poster`}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}
