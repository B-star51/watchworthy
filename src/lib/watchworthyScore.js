// ──────────────────────────────────────────────────────────────────────────
// WatchWorthy Score — a deterministic, explainable match score (0–100) computed
// in plain JS (no AI), so it's instant and never fails. It blends the film's
// critic score with how well the film fits THIS user's taste + current mood.
//
//   WatchWorthy = critic_score*0.40 + genre_match*0.35 + mood_match*0.25
//
// Returns `null` when the user has no taste signal yet (first visit) so the UI
// can show "Rate films to unlock your score" instead of a meaningless number.
// `breakdown` is returned alongside so the score can be shown WITH its reasons
// (the "explainable / cited" angle), not as an opaque figure.
// ──────────────────────────────────────────────────────────────────────────

import { findMovieByTitle } from '../data/movies.js';

// The user's most-loved genres, inferred from films they rated 4+ / "Loved it".
export function topGenres(userProfile, limit = 3) {
  const counts = {};
  (userProfile?.watchHistory || [])
    .filter((h) => (h.rating || 0) >= 4 || h.verdict === 'Loved it')
    .forEach((h) => {
      const movie = findMovieByTitle(h.title);
      (movie?.genre || []).forEach((g) => (counts[g] = (counts[g] || 0) + 1));
    });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([g]) => g);
}

export function calculateWatchWorthyScore(movie, userProfile) {
  if (!movie || !userProfile) return null;

  const loved = topGenres(userProfile);
  const mood = (userProfile.mood || '').toLowerCase();
  const hasSignal = loved.length > 0 || Boolean(mood);
  if (!hasSignal) return null; // first visit — nothing to personalise against yet

  // ── genre match ────────────────────────────────────────────────────────
  const genreOverlap = movie.genre.filter((g) => loved.includes(g));
  let genreBonus;
  if (loved.length === 0) genreBonus = 60; // taste unknown → neutral
  else if (genreOverlap.length >= 2 || genreOverlap.length === movie.genre.length) genreBonus = 100;
  else if (genreOverlap.length === 1) genreBonus = 60;
  else genreBonus = 20;

  // ── mood match ─────────────────────────────────────────────────────────
  let moodBonus;
  if (!mood) moodBonus = 50; // no mood set → neutral
  else if (movie.mood_tags.includes(mood)) moodBonus = 100;
  else moodBonus = 0;

  const raw = movie.critic_score * 0.4 + genreBonus * 0.35 + moodBonus * 0.25;
  const score = Math.round(raw);

  return {
    score,
    breakdown: {
      critic: movie.critic_score,
      genreBonus,
      genreOverlap,
      moodBonus,
      mood,
      lovedGenres: loved,
    },
  };
}

// Colour token for the score badge per the spec's thresholds.
export function scoreTone(score) {
  if (score >= 85) return 'violet';
  if (score >= 70) return 'amber';
  return 'grey';
}

export default calculateWatchWorthyScore;
