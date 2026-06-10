// Home feed — hero "Picked for You" + themed horizontal rows.

import { useMemo } from 'react';
import { movies, findMovieByTitle } from '../data/movies.js';
import { localReasoningEngine } from '../lib/agent.js';
import HeroCard from '../components/HeroCard.jsx';
import MovieRow from '../components/MovieRow.jsx';

export default function Home({ profile, profileApi, onAskAgent, onWatched }) {
  // The hero pick reuses the same local reasoning engine the agent falls back
  // to — so "Picked for You" is genuinely personalised to the onboarding mood
  // and watch history, with zero network dependency on page load.
  const heroRec = useMemo(
    () => localReasoningEngine({ profile, sessionAnswers: { mood: profile.mood } }),
    [profile],
  );
  const hero = heroRec.primary_pick || movies[0];

  const notRejected = (m) => !profileApi.isRejected(m.id);

  const trending = useMemo(
    () => movies.filter((m) => m.critic_score >= 90 && m.id !== hero.id).filter(notRejected).slice(0, 12),
    [hero, profile],
  );
  const acclaimed = useMemo(
    () =>
      [...movies]
        .filter((m) => m.id !== hero.id)
        .filter(notRejected)
        .sort((a, b) => b.critic_score - a.critic_score)
        .slice(0, 12),
    [hero, profile],
  );
  const inCinema = useMemo(() => movies.filter((m) => m.in_cinema).filter(notRejected), [profile]);
  const matchesMood = useMemo(() => {
    const tag = (profile.mood || '').toLowerCase();
    return movies.filter((m) => m.mood_tags.includes(tag) && m.id !== hero.id).filter(notRejected);
  }, [hero, profile]);

  return (
    <div className="space-y-12">
      <HeroCard
        movie={hero}
        reason={heroRec.explanation}
        onAdd={profileApi.addToWatchlist}
        onAskAgent={onAskAgent}
        isOnWatchlist={profileApi.isOnWatchlist(hero.id)}
      />

      {matchesMood.length > 0 && (
        <MovieRow
          title={`Because you're feeling ${profile.mood || 'cinematic'}`}
          subtitle="Matched to your onboarding mood"
          movies={matchesMood}
          profileApi={profileApi}
          onWatched={onWatched}
        />
      )}

      <MovieRow
        title="Trending Now"
        subtitle="What everyone's watching this week"
        movies={trending}
        profileApi={profileApi}
        onWatched={onWatched}
      />

      <MovieRow
        title="Critically Acclaimed"
        subtitle="The highest scores in the vault"
        movies={acclaimed}
        profileApi={profileApi}
        onWatched={onWatched}
      />

      <MovieRow
        title="New in Cinema"
        subtitle="On the big screen right now"
        movies={inCinema}
        profileApi={profileApi}
        onWatched={onWatched}
        emptyHint="No cinema releases match your filters."
      />
    </div>
  );
}
