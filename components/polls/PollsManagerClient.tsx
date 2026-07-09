'use client';

import { useState } from 'react';
import { Plus, Trash2, Play, X as CloseIcon } from 'lucide-react';
import type { Poll, PollOption } from './PollsClient';

interface Props {
  eventId: string;
  initialPolls: Poll[];
}

const EMPTY_OPTIONS = ['', ''];

export default function PollsManagerClient({ eventId, initialPolls }: Props) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [showForm, setShowForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState<string[]>(EMPTY_OPTIONS);
  const [launchNow, setLaunchNow] = useState(true);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [patching, setPatching] = useState<string | null>(null);

  function addOption() {
    if (options.length >= 6) return;
    setOptions((prev) => [...prev, '']);
  }

  function updateOption(idx: number, val: string) {
    setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function createPoll() {
    const trimmedQ = question.trim();
    const validOpts = options.map((o) => o.trim()).filter(Boolean);
    if (!trimmedQ) { setFormError('Enter a question.'); return; }
    if (validOpts.length < 2) { setFormError('Add at least 2 options.'); return; }
    setCreating(true);
    setFormError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/polls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmedQ, options: validOpts, is_active: launchNow }),
      });
      if (!res.ok) throw new Error('Failed to create poll.');
      const data = await res.json();
      setPolls((prev) => [data.poll, ...prev]);
      setShowForm(false);
      setQuestion('');
      setOptions(EMPTY_OPTIONS);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setCreating(false);
    }
  }

  async function patchPoll(pollId: string, patch: { is_active?: boolean; is_closed?: boolean }) {
    setPatching(pollId);
    try {
      const res = await fetch(`/api/events/${eventId}/polls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId, ...patch }),
      });
      if (res.ok) {
        setPolls((prev) => prev.map((p) => (p.id === pollId ? { ...p, ...patch } : p)));
      }
    } catch { /* no-op */ }
    finally { setPatching(null); }
  }

  async function deletePoll(pollId: string) {
    try {
      await fetch(`/api/events/${eventId}/polls`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poll_id: pollId }),
      });
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
    } catch { /* no-op */ }
  }

  function PollBar({ option, total }: { option: PollOption; total: number }) {
    const pct = total > 0 ? Math.round((option.votes_count / total) * 100) : 0;
    return (
      <div className="space-y-0.5">
        <div className="flex justify-between text-[12px]">
          <span style={{ color: '#0F1F18' }}>{option.text}</span>
          <span className="font-mono" style={{ color: '#6B7A72' }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full" style={{ background: '#FAF6EE' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: '#1F4D3A' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display font-medium text-[20px]" style={{ color: '#0F1F18' }}>
          Polls
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white"
            style={{ background: '#1F4D3A' }}
          >
            <Plus size={14} strokeWidth={2.5} />
            Create poll
          </button>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <div
          className="bg-white border rounded-2xl p-5 space-y-4"
          style={{ borderColor: '#E5E0D4' }}
        >
          <h3 className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>
            New poll
          </h3>

          <input
            type="text"
            placeholder="Poll question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full border rounded-xl px-4 py-2.5 text-[14px] outline-none"
            style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
          />

          <div className="space-y-2">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  className="flex-1 border rounded-xl px-4 py-2 text-[14px] outline-none"
                  style={{ borderColor: '#E5E0D4', color: '#0F1F18' }}
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(idx)}
                    className="p-1.5 rounded-lg hover:bg-red-50"
                    style={{ color: '#6B7A72' }}
                  >
                    <CloseIcon size={14} />
                  </button>
                )}
              </div>
            ))}
            {options.length < 6 && (
              <button
                onClick={addOption}
                className="text-[13px] font-medium"
                style={{ color: '#1F4D3A' }}
              >
                + Add option
              </button>
            )}
          </div>

          <label className="flex items-center gap-2 text-[13px] cursor-pointer select-none" style={{ color: '#3A4A42' }}>
            <input
              type="checkbox"
              checked={launchNow}
              onChange={(e) => setLaunchNow(e.target.checked)}
              className="rounded"
            />
            Launch immediately
          </label>

          {formError && (
            <p className="text-[12px] px-3 py-1.5 rounded-lg" style={{ background: '#FEE2E2', color: '#B8423C' }}>
              {formError}
            </p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={() => { setShowForm(false); setFormError(null); }}
              className="px-4 py-2 rounded-lg text-[13px] font-medium border"
              style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
            >
              Cancel
            </button>
            <button
              onClick={createPoll}
              disabled={creating}
              className="px-5 py-2 rounded-lg text-[13px] font-medium text-white disabled:opacity-60"
              style={{ background: '#1F4D3A' }}
            >
              {creating ? 'Creating…' : 'Create poll'}
            </button>
          </div>
        </div>
      )}

      {/* Polls list */}
      {polls.length === 0 && !showForm ? (
        <div className="py-16 text-center">
          <p className="text-[14px] mb-4" style={{ color: '#6B7A72' }}>
            No polls yet. Create one to engage your audience.
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 rounded-xl text-[14px] font-medium text-white"
            style={{ background: '#1F4D3A' }}
          >
            Create first poll
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll) => (
            <div
              key={poll.id}
              className="bg-white border rounded-2xl p-5 space-y-4"
              style={{ borderColor: '#E5E0D4' }}
            >
              {/* Status badge */}
              <div className="flex items-center gap-2">
                {poll.is_active && !poll.is_closed ? (
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: '#E8EFEB', color: '#2D7A4F' }}
                  >
                    Live
                  </span>
                ) : poll.is_closed ? (
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: '#FAF6EE', color: '#6B7A72' }}
                  >
                    Closed
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{ background: '#FAF6EE', color: '#C97A2D' }}
                  >
                    Draft
                  </span>
                )}
                <span className="font-mono text-[11px]" style={{ color: '#6B7A72' }}>
                  {poll.total_votes} {poll.total_votes === 1 ? 'vote' : 'votes'}
                </span>
              </div>

              <p className="font-medium text-[15px]" style={{ color: '#0F1F18' }}>
                {poll.question}
              </p>

              {/* Option bars */}
              <div className="space-y-2.5">
                {poll.options
                  .sort((a, b) => a.position - b.position)
                  .map((opt) => (
                    <PollBar key={opt.id} option={opt} total={poll.total_votes} />
                  ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {!poll.is_active && !poll.is_closed && (
                  <button
                    onClick={() => patchPoll(poll.id, { is_active: true })}
                    disabled={patching === poll.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors"
                    style={{ borderColor: '#2D7A4F', color: '#2D7A4F' }}
                  >
                    <Play size={12} fill="#2D7A4F" />
                    Launch
                  </button>
                )}
                {poll.is_active && !poll.is_closed && (
                  <button
                    onClick={() => patchPoll(poll.id, { is_active: false, is_closed: true })}
                    disabled={patching === poll.id}
                    className="px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors"
                    style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}
                  >
                    Close voting
                  </button>
                )}
                <button
                  onClick={() => deletePoll(poll.id)}
                  className="ml-auto p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  style={{ color: '#6B7A72' }}
                  title="Delete poll"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
