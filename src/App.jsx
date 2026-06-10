// App shell — nav, routing, onboarding gate, the floating agent button, and the
// shared modal state (agent / feedback / settings).

import { useState } from 'react';
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom';
import { useUserProfile } from './hooks/useUserProfile.js';
import Home from './pages/Home.jsx';
import Profile from './pages/Profile.jsx';
import OnboardingQuiz from './components/OnboardingQuiz.jsx';
import AgentModal from './components/AgentModal.jsx';
import FeedbackModal from './components/FeedbackModal.jsx';
import SettingsModal from './components/SettingsModal.jsx';
import MovieDetailsModal from './components/MovieDetailsModal.jsx';

function NavBar({ onSettings, watchlistCount }) {
  const linkClass = ({ isActive }) =>
    `text-sm font-semibold transition ${isActive ? 'text-white' : 'text-white/45 hover:text-white/80'}`;

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <NavLink to="/" className="text-display text-2xl leading-none text-white">
          WATCH<span className="text-violet-soft">WORTHY</span>
        </NavLink>

        <nav className="flex items-center gap-5">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/profile" className={linkClass}>
            Profile
            {watchlistCount > 0 && (
              <span className="tnum ml-1 rounded-full bg-violet/30 px-1.5 py-0.5 text-[10px] text-violet-soft">
                {watchlistCount}
              </span>
            )}
          </NavLink>
          <button
            onClick={onSettings}
            className="rounded-full bg-white/5 p-2 text-white/55 transition hover:bg-white/10 hover:text-white"
            aria-label="Agent settings"
            title="Agent settings"
          >
            ⚙
          </button>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const profileApi = useUserProfile();
  const { profile, completeOnboarding, recordWatched } = profileApi;

  const [agentOpen, setAgentOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [feedbackMovie, setFeedbackMovie] = useState(null);
  const [detailsMovie, setDetailsMovie] = useState(null);

  const openFeedback = (movie) => setFeedbackMovie(movie);
  const openDetails = (movie) => setDetailsMovie(movie);

  return (
    <HashRouter>
      <div className="min-h-full">
        <NavBar onSettings={() => setSettingsOpen(true)} watchlistCount={profile.watchlist.length} />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  profile={profile}
                  profileApi={profileApi}
                  onAskAgent={() => setAgentOpen(true)}
                  onWatched={openFeedback}
                  onOpenDetails={openDetails}
                />
              }
            />
            <Route
              path="/profile"
              element={
                <Profile
                  profile={profile}
                  profileApi={profileApi}
                  onWatched={openFeedback}
                  onOpenDetails={openDetails}
                />
              }
            />
          </Routes>
        </main>

        {/* Floating "Find Me a Movie" button */}
        <button
          onClick={() => setAgentOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full bg-violet px-5 py-3.5 text-sm font-bold text-white shadow-glow transition hover:scale-105 hover:bg-violet-soft sm:bottom-8 sm:right-8"
        >
          <span className="text-lg">🎬</span>
          <span className="hidden sm:inline">Find Me a Movie</span>
          <span className="sm:hidden">Find</span>
        </button>

        {/* First-visit onboarding */}
        <OnboardingQuiz open={!profile.onboarded} onComplete={completeOnboarding} />

        {/* Agent flow */}
        <AgentModal
          open={agentOpen}
          onClose={() => setAgentOpen(false)}
          profile={profile}
          profileApi={profileApi}
          onWatched={openFeedback}
          onOpenDetails={openDetails}
        />

        {/* Post-watch feedback */}
        <FeedbackModal
          open={Boolean(feedbackMovie)}
          movie={feedbackMovie}
          onClose={() => setFeedbackMovie(null)}
          onSubmit={(movie, feedback) => {
            recordWatched(movie, feedback);
            setFeedbackMovie(null);
          }}
        />

        {/* Settings */}
        <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {/* Movie details — trailer + where to watch */}
        <MovieDetailsModal
          open={Boolean(detailsMovie)}
          movie={detailsMovie}
          onClose={() => setDetailsMovie(null)}
          profileApi={profileApi}
          onWatched={openFeedback}
        />

        <footer className="mx-auto max-w-7xl px-4 pb-28 pt-10 text-center text-xs text-white/25 sm:px-6">
          WatchWorthy · AI film curation · Built for the Microsoft Agents League Hackathon
        </footer>
      </div>
    </HashRouter>
  );
}
