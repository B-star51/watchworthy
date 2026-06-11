// SettingsModal — choose the agent provider and paste API keys at runtime.
// Keys are stored in localStorage (never committed), which is the recommended
// path for a deployed demo so no secret ships in the bundle.

import { useState } from 'react';
import Modal from './Modal.jsx';
import { getAgentSettings, saveAgentSettings } from '../lib/agent.js';

export default function SettingsModal({ open, onClose }) {
  const initial = getAgentSettings();
  const [provider, setProvider] = useState(initial.provider);
  const [anthropicKey, setAnthropicKey] = useState(initial.anthropicKey);
  const [githubToken, setGithubToken] = useState(initial.githubToken);
  const [saved, setSaved] = useState(false);

  const save = () => {
    saveAgentSettings({ provider, anthropicKey, githubToken });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-lg">
      <div className="p-7 sm:p-9">
        <h2 className="text-display text-4xl leading-none text-white">Agent Settings</h2>
        <p className="mt-1 text-sm text-white/45">
          Pick which model powers the recommendation agent. Keys stay in your browser only.
        </p>

        {/* Provider toggle */}
        <div className="mt-6">
          <p className="mb-2 text-sm font-semibold text-white/80">Agent provider</p>
          <div className="grid grid-cols-2 gap-3">
            <ProviderCard
              active={provider === 'anthropic'}
              onClick={() => setProvider('anthropic')}
              title="Claude"
              subtitle="claude-sonnet-4-20250514"
              emoji="🧠"
            />
            <ProviderCard
              active={provider === 'github'}
              onClick={() => setProvider('github')}
              title="GitHub Agent"
              subtitle="GitHub Models"
              emoji="🐙"
            />
          </div>
        </div>

        {/* Keys */}
        <div className="mt-6 space-y-4">
          <Field
            label="Anthropic API key"
            hint="console.anthropic.com → API keys"
            value={anthropicKey}
            onChange={setAnthropicKey}
            placeholder="sk-ant-…"
          />
          <Field
            label="GitHub token (Models permission)"
            hint="github.com/settings/tokens — fine-grained, Models scope"
            value={githubToken}
            onChange={setGithubToken}
            placeholder="github_pat_…"
          />
        </div>

        <div className="mt-4 rounded-xl bg-ink/60 px-4 py-3 text-xs text-white/45 ring-1 ring-white/10">
          No key? No problem — WatchWorthy falls back to a built-in reasoning engine that runs the same
          6-step chain locally, so the demo always works offline.
        </div>

        <button
          onClick={save}
          className="mt-6 w-full rounded-xl bg-violet px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:bg-violet-soft"
        >
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
      </div>
    </Modal>
  );
}

function ProviderCard({ active, onClick, title, subtitle, emoji }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-2xl p-4 text-left ring-1 transition ${
        active ? 'bg-violet/20 ring-violet shadow-glow' : 'bg-white/5 ring-white/10 hover:bg-white/10'
      }`}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-sm font-semibold text-white">{title}</span>
      <span className="text-[11px] text-white/45">{subtitle}</span>
    </button>
  );
}

function Field({ label, hint, value, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-semibold text-white/80">{label}</label>
      <p className="mb-1.5 text-[11px] text-white/35">{hint}</p>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/25 ring-1 ring-white/10 outline-none focus:ring-violet"
      />
    </div>
  );
}
