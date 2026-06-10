// ──────────────────────────────────────────────────────────────────────────
// useUserProfile — single source of truth for the user's taste profile.
// Persists to localStorage and re-renders any component using it on change.
//
// Profile shape:
//   {
//     onboarded: boolean,
//     mood: string,                // from onboarding quiz
//     timePreference: string,      // from onboarding quiz
//     lastLoved: string,           // free text from onboarding
//     watchlist: Movie[],          // movies the user wants to watch
//     rejected: { id, title }[],   // "Not For Me"
//     watchHistory: {              // films marked watched + feedback
//       id, title, rating, verdict, nextMood, watchedAt
//     }[],
//   }
// ──────────────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'watchworthy_profile';

const EMPTY_PROFILE = {
  onboarded: false,
  mood: '',
  timePreference: '',
  lastLoved: '',
  watchlist: [],
  rejected: [],
  watchHistory: [],
};

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_PROFILE };
    return { ...EMPTY_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

export function useUserProfile() {
  const [profile, setProfile] = useState(loadProfile);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* storage full / disabled — non-fatal for a demo */
    }
  }, [profile]);

  // Keep multiple tabs / components in sync.
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) setProfile(loadProfile());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const completeOnboarding = useCallback((answers) => {
    setProfile((p) => ({
      ...p,
      onboarded: true,
      mood: answers.mood ?? p.mood,
      timePreference: answers.timePreference ?? p.timePreference,
      lastLoved: answers.lastLoved ?? p.lastLoved,
    }));
  }, []);

  const addToWatchlist = useCallback((movie) => {
    setProfile((p) => {
      if (p.watchlist.some((m) => m.id === movie.id)) return p;
      return {
        ...p,
        watchlist: [...p.watchlist, movie],
        // Adding to watchlist clears any previous rejection.
        rejected: p.rejected.filter((r) => r.id !== movie.id),
      };
    });
  }, []);

  const removeFromWatchlist = useCallback((movieId) => {
    setProfile((p) => ({ ...p, watchlist: p.watchlist.filter((m) => m.id !== movieId) }));
  }, []);

  const rejectMovie = useCallback((movie) => {
    setProfile((p) => {
      if (p.rejected.some((m) => m.id === movie.id)) return p;
      return {
        ...p,
        rejected: [...p.rejected, { id: movie.id, title: movie.title }],
        watchlist: p.watchlist.filter((m) => m.id !== movie.id),
      };
    });
  }, []);

  const unrejectMovie = useCallback((movieId) => {
    setProfile((p) => ({ ...p, rejected: p.rejected.filter((m) => m.id !== movieId) }));
  }, []);

  // Mark a watchlist film as watched + record feedback from FeedbackModal.
  const recordWatched = useCallback((movie, feedback) => {
    setProfile((p) => ({
      ...p,
      watchlist: p.watchlist.filter((m) => m.id !== movie.id),
      watchHistory: [
        ...p.watchHistory.filter((h) => h.id !== movie.id),
        {
          id: movie.id,
          title: movie.title,
          rating: feedback.rating,
          verdict: feedback.verdict,
          nextMood: feedback.nextMood,
          watchedAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const resetProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile({ ...EMPTY_PROFILE });
  }, []);

  return {
    profile,
    completeOnboarding,
    addToWatchlist,
    removeFromWatchlist,
    rejectMovie,
    unrejectMovie,
    recordWatched,
    resetProfile,
    isOnWatchlist: (id) => profile.watchlist.some((m) => m.id === id),
    isRejected: (id) => profile.rejected.some((m) => m.id === id),
  };
}

export default useUserProfile;
