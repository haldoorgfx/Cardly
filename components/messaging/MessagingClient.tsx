'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send } from 'lucide-react';

interface Thread {
  id: string;
  other_participant_id: string;
  other_participant_name: string;
  last_message_at: string | null;
  last_message?: { content: string; created_at: string; sender_id: string } | null;
  unread_count: number;
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  read_at: string | null;
}

interface Props {
  eventId: string;
  registrationId: string | null;
  /** Dashboard mode: contained rounded card instead of full-viewport panes. */
  embedded?: boolean;
  /** Deep-link from the People directory: open (or start) a conversation with this attendee. */
  initialRecipientId?: string;
  initialRecipientName?: string;
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export default function MessagingClient({ eventId, registrationId, embedded = false, initialRecipientId, initialRecipientName }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingThreads, setLoadingThreads] = useState(true);
  // A recipient picked from the People directory who doesn't have a thread yet —
  // rendered as a normal conversation pane until the first message is sent, at
  // which point the real thread takes over.
  const [draftRecipient, setDraftRecipient] = useState<{ id: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const handledDeepLink = useRef(false);

  const activeThread = activeId === 'draft'
    ? (draftRecipient && {
        id: 'draft',
        other_participant_id: draftRecipient.id,
        other_participant_name: draftRecipient.name,
        last_message_at: null,
        unread_count: 0,
      })
    : threads.find(t => t.id === activeId) ?? null;

  const loadThreads = useCallback(async () => {
    if (!registrationId) { setLoadingThreads(false); return; }
    try {
      const res = await fetch(`/api/threads?registration_id=${registrationId}&event_id=${eventId}`);
      const data = await res.json() as { threads?: Thread[] };
      setThreads(data.threads ?? []);
    } catch {
      setThreads([]);
    } finally {
      setLoadingThreads(false);
    }
  }, [eventId, registrationId]);

  useEffect(() => { loadThreads(); }, [loadThreads]);

  // Deep-link from the People directory ("Message" on a specific attendee's card).
  // If a thread with them already exists, open it; otherwise start a draft. Only
  // handled once — after that the user's own navigation inside the inbox wins.
  useEffect(() => {
    if (!initialRecipientId || !registrationId || loadingThreads || handledDeepLink.current) return;
    handledDeepLink.current = true;
    const existing = threads.find(t => t.other_participant_id === initialRecipientId);
    if (existing) {
      switchThread(existing.id);
    } else {
      setDraftRecipient({ id: initialRecipientId, name: initialRecipientName || 'Attendee' });
      setActiveId('draft');
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecipientId, initialRecipientName, registrationId, loadingThreads, threads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const switchThread = async (threadId: string) => {
    setActiveId(threadId);
    setMessages([]);
    if (!registrationId) return;
    try {
      const res = await fetch(`/api/events/${eventId}/messages?registration_id=${registrationId}&thread_id=${threadId}`);
      const data = await res.json() as { messages?: Message[] };
      setMessages(data.messages ?? []);
      // The GET stamps read_at server-side; clear the unread badge locally.
      setThreads(prev => prev.map(t => (t.id === threadId ? { ...t, unread_count: 0 } : t)));
    } catch { /* keep empty */ }
  };

  const send = async () => {
    const content = newMsg.trim();
    if (!content || !activeThread || !registrationId || sending) return;
    const recipientId = activeThread.other_participant_id;

    setSending(true);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      content,
      sender_id: registrationId,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages(prev => [...prev, optimistic]);
    setNewMsg('');
    try {
      const res = await fetch(`/api/events/${eventId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: registrationId, recipient_id: recipientId, content }),
      });
      const data = await res.json() as { message?: Message; thread_id?: string };
      if (data.message) {
        setMessages(prev => prev.map(m => (m.id === optimistic.id ? data.message! : m)));
        if (activeThread.id === 'draft' && data.thread_id) {
          // Promote the draft into a real thread now that the first message landed.
          const realId = data.thread_id;
          setThreads(prev => [
            {
              id: realId,
              other_participant_id: recipientId,
              other_participant_name: activeThread.other_participant_name,
              last_message_at: new Date().toISOString(),
              last_message: { content, created_at: optimistic.created_at, sender_id: registrationId },
              unread_count: 0,
            },
            ...prev,
          ]);
          setDraftRecipient(null);
          setActiveId(realId);
        } else {
          setThreads(prev => prev.map(t => (t.id === activeThread.id
            ? { ...t, last_message_at: new Date().toISOString(), last_message: { content, created_at: optimistic.created_at, sender_id: registrationId } }
            : t)));
        }
      } else {
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setNewMsg(content);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setNewMsg(content);
    } finally {
      setSending(false);
    }
  };

  const groupByDay = (msgs: Message[]) => {
    const groups: { label: string; msgs: Message[] }[] = [];
    msgs.forEach(m => {
      const day = new Date(m.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const last = groups[groups.length - 1];
      if (!last || last.label !== day) groups.push({ label: day, msgs: [m] });
      else last.msgs.push(m);
    });
    return groups;
  };

  return (
    <div
      className={embedded ? 'flex flex-col lg:grid rounded-2xl border overflow-hidden bg-white' : 'flex flex-col lg:grid'}
      style={{
        gridTemplateColumns: '320px 1fr',
        height: embedded ? 620 : 'calc(100vh - 56px)',
        ...(embedded ? { borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' } : {}),
      }}
    >
      {/* Left: inbox */}
      <aside className="max-h-[50vh] lg:max-h-full" style={{ borderRight: '1px solid #E5E0D4', display: 'flex', flexDirection: 'column', background: 'white' }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #E5E0D4' }}>
          <span className="font-display font-medium text-[16px]" style={{ color: '#0F1F18' }}>Messages</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!registrationId ? (
            <div className="py-12 px-5 text-center text-[13px]" style={{ color: '#6B7A72' }}>
              Register for this event to message other attendees.
            </div>
          ) : loadingThreads ? (
            <div className="py-12 text-center text-[13px]" style={{ color: '#6B7A72' }}>Loading…</div>
          ) : threads.length === 0 ? (
            <div className="py-12 px-5 text-center text-[13px]" style={{ color: '#6B7A72' }}>
              No messages yet.<br />Connect with people at the event to start a conversation.
            </div>
          ) : (
            threads.map(t => {
              const isActive = t.id === activeId;
              const unread = t.unread_count > 0;
              return (
                <button
                  key={t.id}
                  onClick={() => switchThread(t.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 transition-colors text-left relative"
                  style={{ background: isActive ? '#E8EFEB' : 'transparent', borderBottom: '1px solid #F0EBE3' }}
                >
                  {unread && (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full" style={{ background: '#1F4D3A' }} />
                  )}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-display font-semibold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}
                  >
                    {initials(t.other_participant_name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] truncate" style={{ color: '#0F1F18', fontWeight: unread ? 600 : 500 }}>
                      {t.other_participant_name}
                    </div>
                    <div className="text-[13px] truncate mt-0.5" style={{ color: '#6B7A72' }}>
                      {t.last_message?.content ?? ''}
                    </div>
                  </div>
                  {t.last_message_at && (
                    <div className="text-[11px] shrink-0 self-start mt-1" style={{ color: '#6B7A72' }}>
                      {timeAgo(t.last_message_at)}
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Right: thread */}
      <section style={{ display: 'flex', flexDirection: 'column', background: '#FAF6EE' }}>
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center text-[14px]" style={{ color: '#6B7A72' }}>
            Select a conversation
          </div>
        ) : (
          <>
            <div className="h-16 flex items-center gap-3 px-6 shrink-0" style={{ borderBottom: '1px solid #E5E0D4', background: 'white' }}>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-display font-semibold shrink-0"
                style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}
              >
                {initials(activeThread.other_participant_name)}
              </div>
              <div className="font-display font-medium text-[17px]" style={{ color: '#0F1F18' }}>
                {activeThread.other_participant_name}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[13px]" style={{ color: '#6B7A72' }}>
                  No messages yet. Say hello!
                </div>
              ) : (
                groupByDay(messages).map(group => (
                  <div key={group.label}>
                    <div className="text-[11px] text-center my-3" style={{ color: '#6B7A72' }}>{group.label}</div>
                    {group.msgs.map(m => {
                      const isMe = m.sender_id === registrationId;
                      return (
                        <div
                          key={m.id}
                          className="max-w-[64%] px-4 py-3 rounded-2xl text-[14px] leading-snug mb-2"
                          style={{
                            background: isMe ? '#1F4D3A' : 'white',
                            border: isMe ? 'none' : '1px solid #E5E0D4',
                            color: isMe ? 'white' : '#0F1F18',
                            alignSelf: isMe ? 'flex-end' : 'flex-start',
                            borderBottomRightRadius: isMe ? 4 : 14,
                            borderBottomLeftRadius: isMe ? 14 : 4,
                            marginLeft: isMe ? 'auto' : 0,
                          }}
                        >
                          {m.content}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderTop: '1px solid #E5E0D4', background: 'white' }}>
              <input
                type="text"
                value={newMsg}
                onChange={e => setNewMsg(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Send a message…"
                className="flex-1 rounded-full px-5 py-3 text-[14px] outline-none transition"
                style={{ border: '1px solid #E5E0D4', background: '#FAF6EE', color: '#0F1F18' }}
              />
              <button
                onClick={send}
                disabled={sending || !newMsg.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 transition-opacity"
                style={{ background: '#1F4D3A', opacity: sending || !newMsg.trim() ? 0.5 : 1 }}
              >
                <Send size={17} color="white" />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
