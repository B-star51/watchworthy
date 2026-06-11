// AgentThinking — a typewriter "reasoning trace" shown while the agent works,
// instead of a generic spinner. Each step types in character-by-character, gets
// a green check when done, then the next begins. Step counts (watched, rejected,
// candidates) are REAL numbers pulled from the user's profile.
//
// Calls onDone() once all steps have completed so the modal can reveal the pick.

import { useEffect, useRef, useState } from 'react';
import { movies } from '../data/movies.js';

const TYPE_MS = 30; // per character
const GAP_MS = 600; // between steps
const CHECK_MS = 400; // pause before the checkmark appears
const FINISH_MS = 500; // pause before onDone

export default function AgentThinking({ profile, sessionAnswers, onDone }) {
  const [completed, setCompleted] = useState([]); // fully-typed step strings
  const [typing, setTyping] = useState(''); // current partially-typed step
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // Build the steps with real numbers from the user's profile.
  const steps = useRef(null);
  if (!steps.current) {
    const mood = sessionAnswers?.mood || profile?.mood || 'open';
    const watched = profile?.watchHistory?.length || 0;
    const rejected = profile?.rejected?.length || 0;
    const seen = new Set([
      ...(profile?.watchHistory || []).map((h) => (h.title || '').toLowerCase()),
      ...(profile?.rejected || []).map((r) => (r.title || r).toLowerCase()),
    ]);
    const candidates = movies.filter((m) => !seen.has(m.title.toLowerCase())).length;
    steps.current = [
      `🔍 Analysing your mood: ${mood}…`,
      `📋 Checking your watch history — ${watched} watched…`,
      `❌ Removing ${rejected} rejected film${rejected === 1 ? '' : 's'}…`,
      `⭐ Scoring ${candidates} remaining candidates…`,
      `🎯 Primary pick locked in…`,
    ];
  }

  useEffect(() => {
    let cancelled = false;
    const timers = [];
    const wait = (ms) => new Promise((r) => timers.push(setTimeout(r, ms)));

    (async () => {
      const list = steps.current;
      for (let i = 0; i < list.length; i++) {
        if (cancelled) return;
        await wait(i === 0 ? 200 : GAP_MS);
        for (let c = 1; c <= list[i].length; c++) {
          if (cancelled) return;
          setTyping(list[i].slice(0, c));
          await wait(TYPE_MS);
        }
        await wait(CHECK_MS);
        if (cancelled) return;
        setCompleted((prev) => [...prev, list[i]]);
        setTyping('');
      }
      await wait(FINISH_MS);
      if (!cancelled) onDoneRef.current?.();
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-[16rem] flex-col items-center justify-center gap-3 py-10 font-mono text-sm">
      {completed.map((step, i) => (
        <div key={i} className="flex w-full max-w-md items-start gap-2 opacity-60">
          <span className="mt-0.5 shrink-0 text-[#22C55E]">✓</span>
          <span className="text-white">{step}</span>
        </div>
      ))}

      {typing && (
        <div className="flex w-full max-w-md items-start gap-2">
          <span className="mt-0.5 shrink-0 text-white/30">›</span>
          <span className="text-white">
            {typing}
            <span className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-violet-soft align-middle" />
          </span>
        </div>
      )}
    </div>
  );
}
