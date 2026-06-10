// Small pill badge for a streaming platform or "In Cinema".
// When a `movie` is supplied the badge becomes a clickable link that opens the
// platform's search for that title (or a showtimes search for cinema releases),
// so users can jump straight to where it's streaming.

import { streamingUrl, showtimesUrl } from '../data/movies.js';

const STYLES = {
  Netflix: 'bg-red-600/20 text-red-300 ring-red-500/30 hover:bg-red-600/35',
  'Prime Video': 'bg-sky-500/20 text-sky-300 ring-sky-400/30 hover:bg-sky-500/35',
  'Disney+': 'bg-blue-600/20 text-blue-300 ring-blue-400/30 hover:bg-blue-600/35',
  Cinema: 'bg-gold/20 text-gold ring-gold/40 hover:bg-gold/30',
};

const LABELS = {
  Netflix: 'Netflix',
  'Prime Video': 'Prime',
  'Disney+': 'Disney+',
  Cinema: 'In Cinema',
};

export default function StreamingBadge({ platform, href }) {
  const style = STYLES[platform] || 'bg-white/10 text-white/70 ring-white/15';
  const className = `inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 transition ${style}`;
  const label = LABELS[platform] || platform;

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={className}
        title={`Open ${label}`}
      >
        {label}
        <span className="opacity-60">↗</span>
      </a>
    );
  }
  return <span className={className}>{label}</span>;
}

// Renders the right set of badges for a movie (streaming services or cinema).
// `linked` controls whether the badges deep-link out.
export function StreamingBadges({ movie, className = '', linked = true }) {
  if (movie.in_cinema) {
    return (
      <span className={`flex flex-wrap gap-1 ${className}`}>
        <StreamingBadge platform="Cinema" href={linked ? showtimesUrl(movie) : undefined} />
      </span>
    );
  }
  if (!movie.streaming || movie.streaming.length === 0) {
    return (
      <span className={className}>
        <StreamingBadge platform="Coming Soon" />
      </span>
    );
  }
  return (
    <span className={`flex flex-wrap gap-1 ${className}`}>
      {movie.streaming.map((p) => (
        <StreamingBadge key={p} platform={p} href={linked ? streamingUrl(p, movie) : undefined} />
      ))}
    </span>
  );
}
