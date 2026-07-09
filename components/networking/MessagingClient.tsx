'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface ThreadSummary {
  id: string;
  other_participant_id: string;
  other_participant_name: string;
  last_message: { content: string; sender_id: string } | null;
  unread_count: number;
}

interface Props {
  eventId: string;
  registrationId: string;
  initialThreads: ThreadSummary[];
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatThreadTime(iso: string | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MessagingClient({ eventId, registrationId, initialThreads }: Props) {
  const [threads, setThreads] = useState<ThreadSummary[]>(initialThreads);
  const [selectedThread, setSelectedThread] = useState<ThreadSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [showList, setShowList] = useState(true); // mobile toggle
  const [cardBannerDismissed, setCardBannerDismissed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function selectThread(thread: ThreadSummary) {
    setSelectedThread(thread);
    setShowList(false);
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/threads/${thread.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
    } catch {
      // no-op
    } finally {
      setLoadingMessages(false);
    }
    // mark read
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unread_count: 0 } : t))
    );
  }

  async function sendMessage() {
    if (!draft.trim() || !selectedThread || sending) return;
    const content = draft.trim();
    setDraft('');
    setSending(true);

    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      sender_id: registrationId,
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/threads/${selectedThread.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: registrationId, content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? data.message : m))
        );
        // update thread preview
        setThreads((prev) =>
          prev.map((t) =>
            t.id === selectedThread.id
              ? { ...t, last_message: { content, sender_id: registrationId } }
              : t
          )
        );
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div
      className="flex h-[calc(100vh-120px)] min-h-[500px] rounded-2xl border overflow-hidden"
      style={{ borderColor: '#E5E0D4' }}
    >
      {/* LEFT — Thread list */}
      <div
        className={`${showList ? 'flex' : 'hidden'} md:flex flex-col w-full md:w-[320px] border-r shrink-0`}
        style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between"
          style={{ borderColor: '#E5E0D4' }}
        >
          <h2 className="font-display font-medium text-[17px]" style={{ color: '#0F1F18' }}>
            Messages
          </h2>
          <span className="text-[12px]" style={{ color: '#6B7A72' }}>
            Compose not available yet
          </span>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <p className="text-[13px]" style={{ color: '#6B7A72' }}>
                No messages yet.
              </p>
            </div>
          ) : (
            threads.map((thread) => {
              const isActive = selectedThread?.id === thread.id;
              return (
                <button
                  key={thread.id}
                  onClick={() => selectThread(thread)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b text-left transition-colors hover:bg-[#FAF6EE]"
                  style={{
                    borderColor: '#E5E0D4',
                    background: isActive ? '#E8EFEB' : undefined,
                    minHeight: 72,
                  }}
                >
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }}
                  >
                    <span className="text-white text-[12px] font-medium">
                      {getInitials(thread.other_participant_name)}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="text-[15px] font-medium truncate"
                        style={{ color: '#0F1F18' }}
                      >
                        {thread.other_participant_name}
                      </span>
                      <span className="font-mono text-[11px] shrink-0" style={{ color: '#6B7A72' }}>
                        {thread.last_message
                          ? formatThreadTime(new Date().toISOString())
                          : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {thread.last_message && (
                        <p
                          className="text-[13px] truncate flex-1"
                          style={{ color: '#6B7A72' }}
                        >
                          {thread.last_message.sender_id === registrationId ? 'You: ' : ''}
                          {thread.last_message.content}
                        </p>
                      )}
                      {thread.unread_count > 0 && (
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: '#1F4D3A' }}
                        />
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT — Conversation */}
      <div
        className={`${!showList ? 'flex' : 'hidden'} md:flex flex-1 flex-col`}
        style={{ background: '#FAF6EE' }}
      >
        {!selectedThread ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[14px]" style={{ color: '#6B7A72' }}>
              Select a conversation
            </p>
          </div>
        ) : (
          <>
            {/* Thread header */}
            <div
              className="px-5 py-3.5 border-b flex items-center gap-3"
              style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}
            >
              <button
                className="md:hidden p-1.5 -ml-1 rounded-lg"
                onClick={() => setShowList(true)}
              >
                ←
              </button>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #1F4D3A 0%, #2A6A50 100%)' }}
              >
                <span className="text-white text-[12px] font-medium">
                  {getInitials(selectedThread.other_participant_name)}
                </span>
              </div>
              <div className="flex-1">
                <p className="text-[15px] font-medium" style={{ color: '#0F1F18' }}>
                  {selectedThread.other_participant_name}
                </p>
                <a
                  href="#"
                  className="text-[12px]"
                  style={{ color: '#6B7A72' }}
                  onClick={(e) => e.preventDefault()}
                >
                  View profile →
                </a>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[13px]" style={{ color: '#6B7A72' }}>Loading…</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-[13px]" style={{ color: '#6B7A72' }}>
                    No messages yet. Say hello!
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === registrationId;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[72%] px-3.5 py-2.5 rounded-2xl text-[14px]"
                        style={
                          isMine
                            ? { background: '#1F4D3A', color: '#fff' }
                            : { background: '#FAF6EE', color: '#0F1F18', border: '1px solid #E5E0D4' }
                        }
                      >
                        <p>{msg.content}</p>
                        <p
                          className="font-mono text-[10px] mt-1"
                          style={{ color: isMine ? 'rgba(255,255,255,0.6)' : '#6B7A72' }}
                        >
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Karta card share banner */}
            {!cardBannerDismissed && (
              <div
                className="mx-4 mb-2 px-4 py-3 rounded-xl flex items-center justify-between gap-3 border"
                style={{ background: '#FAF6EE', borderColor: '#E5E0D4' }}
              >
                <p className="text-[13px]" style={{ color: '#3A4A42' }}>
                  Share your Karta Card with this attendee
                </p>
                <button
                  className="text-[12px] font-medium mr-2"
                  style={{ color: '#1F4D3A' }}
                  onClick={() => {/* TODO: share card */}}
                >
                  Share
                </button>
                <button
                  onClick={() => setCardBannerDismissed(true)}
                  className="p-0.5 rounded"
                  style={{ color: '#6B7A72' }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Composer */}
            <div
              className="px-4 pb-4 pt-2 border-t flex items-end gap-2"
              style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write a message… (Enter to send)"
                rows={2}
                className="flex-1 resize-none border rounded-xl px-3.5 py-2.5 text-[14px] outline-none"
                style={{ borderColor: '#E5E0D4', color: '#0F1F18', background: '#FAF6EE' }}
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                className="h-[46px] w-[46px] rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50 transition-opacity"
                style={{ background: '#1F4D3A', color: '#fff' }}
              >
                <Send size={16} strokeWidth={2} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
