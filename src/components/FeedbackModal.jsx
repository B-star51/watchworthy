// FeedbackModal — 3-question post-watch flow.
// Triggered when a user marks a watchlist movie as watched. The result feeds
// the agent's future recommendations (watchHistory).

import { useState } from 'react';
import Modal from './Modal.jsx';

const VERDICTS = ['Loved it', 'It was fine', 'Not my thing'];
const NEXT_MOODS = ['Thrilled', 'Thoughtful', 'Laughing', 'Scared', 'Inspired', 'Feel-good'];

export default function FeedbackModal({ open, movie, onClose, onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [verdict, setVerdict] = useState('');
  const [nextMood, setNextMood] = useState('');

  if (!movie) return null;

  const reset = () => {
    setRating(0);
    setHover(0);
    setVerdict('');
    setNextMood('');
  };

  const submit = () => {
    onSubmit?.(movie, { rating, verdict, nextMood });
    reset();
  };

  const handleClose = () => {
    reset();
    onClose?.();
  };

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-lg">
      <div className="p-7 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-widest text-violet-soft">You watched</p>
        <h2 className="mb-6 text-display text-4xl leading-none text-white">{movie.title}</h2>

        {/* Q1 — stars */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-white/80">Did you enjoy it?</p>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                className={`text-3xl transition ${
                  n <= (hover || rating) ? 'text-gold' : 'text-white/15'
                } hover:scale-110`}
                aria-label={`${n} stars`}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        {/* Q2 — verdict */}
        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-white/80">What did you think?</p>
          <div className="flex flex-wrap gap-2">
            {VERDICTS.map((v) => (
              <button
                key={v}
                onClick={() => setVerdict(v)}
                className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition ${
                  verdict === v
                    ? 'bg-violet/25 ring-violet text-white'
                    : 'bg-white/5 ring-white/10 text-white/65 hover:bg-white/10'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Q3 — next mood */}
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-white/80">What are you in the mood for next?</p>
          <div className="flex flex-wrap gap-2">
            {NEXT_MOODS.map((m) => (
              <button
                key={m}
                onClick={() => setNextMood(m)}
                className={`rounded-full px-4 py-2 text-sm font-medium ring-1 transition ${
                  nextMood === m
                    ? 'bg-violet/25 ring-violet text-white'
                    : 'bg-white/5 ring-white/10 text-white/65 hover:bg-white/10'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={submit}
          disabled={!rating}
          className="w-full rounded-xl bg-violet px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
        >
          Save & teach the agent
        </button>
      </div>
    </Modal>
  );
}
