// OnboardingQuiz — first-visit taste quiz (3 questions max).
// Shown only once; the result is stored on the user profile.

import { useState } from 'react';
import Modal from './Modal.jsx';

const MOODS = [
  { value: 'Thrilled', emoji: '⚡', tag: 'thrilled' },
  { value: 'Thoughtful', emoji: '🧠', tag: 'thoughtful' },
  { value: 'Laughing', emoji: '😂', tag: 'laughing' },
  { value: 'Scared', emoji: '😱', tag: 'scared' },
  { value: 'Inspired', emoji: '✨', tag: 'inspired' },
];

const TIMES = ['Under 90 min', '90–120 min', "Epic — I've got time"];

export default function OnboardingQuiz({ open, onComplete }) {
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState('');
  const [time, setTime] = useState('');
  const [lastLoved, setLastLoved] = useState('');

  const total = 3;
  const canAdvance = step === 0 ? mood : step === 1 ? time : true;

  const next = () => {
    if (step < total - 1) setStep((s) => s + 1);
    else onComplete({ mood, timePreference: time, lastLoved: lastLoved.trim() });
  };

  return (
    <Modal open={open} dismissable={false} maxWidth="max-w-xl">
      <div className="p-7 sm:p-9">
        {/* Brand */}
        <div className="mb-6 text-center">
          <p className="text-display text-4xl text-white">
            WATCH<span className="text-violet-soft">WORTHY</span>
          </p>
          <p className="mt-1 text-sm text-white/50">Let's calibrate your taste. Three quick questions.</p>
        </div>

        {/* Progress */}
        <div className="mb-7 flex gap-1.5">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-violet' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="animate-fade-in">
            <h2 className="text-display text-3xl text-white">Pick a mood</h2>
            <p className="mb-5 text-sm text-white/45">What kind of night is it?</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {MOODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`flex flex-col items-center gap-2 rounded-2xl p-4 text-center ring-1 transition ${
                    mood === m.value
                      ? 'bg-violet/20 ring-violet text-white shadow-glow'
                      : 'bg-white/5 ring-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <span className="text-3xl">{m.emoji}</span>
                  <span className="text-sm font-semibold">{m.value}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in">
            <h2 className="text-display text-3xl text-white">How much time do you have?</h2>
            <p className="mb-5 text-sm text-white/45">We'll respect your runtime budget.</p>
            <div className="flex flex-col gap-3">
              {TIMES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTime(t)}
                  className={`rounded-xl px-4 py-3 text-left text-sm font-semibold ring-1 transition ${
                    time === t
                      ? 'bg-violet/20 ring-violet text-white'
                      : 'bg-white/5 ring-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-display text-3xl text-white">What did you last love?</h2>
            <p className="mb-5 text-sm text-white/45">A film, a vibe, a director — optional, but it helps a lot.</p>
            <textarea
              value={lastLoved}
              onChange={(e) => setLastLoved(e.target.value)}
              rows={3}
              placeholder="e.g. Parasite, anything Nolan, slow-burn thrillers…"
              className="w-full resize-none rounded-xl bg-white/5 p-4 text-sm text-white placeholder-white/30 ring-1 ring-white/10 outline-none focus:ring-violet"
            />
          </div>
        )}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-sm text-white/40 transition hover:text-white/70 disabled:opacity-0"
          >
            ‹ Back
          </button>
          <button
            onClick={next}
            disabled={!canAdvance}
            className="rounded-xl bg-violet px-6 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
          >
            {step < total - 1 ? 'Continue' : 'Enter WatchWorthy'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
