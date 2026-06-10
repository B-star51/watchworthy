// Small pill badge for a streaming platform or "In Cinema".
// Colour-coded but kept muted to fit the editorial dark theme.

const STYLES = {
  Netflix: 'bg-red-600/20 text-red-300 ring-red-500/30',
  'Prime Video': 'bg-sky-500/20 text-sky-300 ring-sky-400/30',
  'Disney+': 'bg-blue-600/20 text-blue-300 ring-blue-400/30',
  Cinema: 'bg-gold/20 text-gold ring-gold/40',
};

const LABELS = {
  Netflix: 'Netflix',
  'Prime Video': 'Prime',
  'Disney+': 'Disney+',
  Cinema: 'In Cinema',
};

export default function StreamingBadge({ platform }) {
  const style = STYLES[platform] || 'bg-white/10 text-white/70 ring-white/15';
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${style}`}
    >
      {LABELS[platform] || platform}
    </span>
  );
}

// Renders the right set of badges for a movie (streaming services or cinema).
export function StreamingBadges({ movie, className = '' }) {
  const items = movie.in_cinema ? ['Cinema'] : movie.streaming;
  if (!items || items.length === 0) {
    return (
      <span className={className}>
        <StreamingBadge platform="Coming Soon" />
      </span>
    );
  }
  return (
    <span className={`flex flex-wrap gap-1 ${className}`}>
      {items.map((p) => (
        <StreamingBadge key={p} platform={p} />
      ))}
    </span>
  );
}
