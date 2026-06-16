'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Plus } from 'lucide-react';

interface Thread {
  id: string;
  participant_a: string;
  participant_b: string;
  last_message_at: string | null;
  registrations?: { id: string; attendee_name: string } | null;
  preview?: string;
  unread?: boolean;
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
  initialThreads: Thread[];
  initialActiveThreadId: string | null;
  initialMessages: Message[];
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

export default function MessagingClient({
  eventId, registrationId, initialThreads, initialActiveThreadId, initialMessages,
}: Props) {
  const [threads] = useState(initialThreads);
  const [activeId, setActiveId] = useState(initialActiveThreadId);
  const [messages, setMessages] = useState(initialMessages);
  const [newMsg, setNewMsg] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeThread = threads.find(t => t.id === activeId);
  const partner = activeThread?.registrations;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const switchThread = async (threadId: string) => {
    setActiveId(threadId);
    if (!registrationId) return;
    try {
      const res = await fetch(`/api/events/${eventId}/messages?registration_id=${registrationId}&thread_id=${threadId}`);
      const data = await res.json() as { messages: Message[] };
      if (data.messages) setMessages(data.messages);
    } catch {}
  };

  const send = async () => {
    if (!newMsg.trim() || !activeId || !registrationId || sending) return;
    const t = threads.find(th => th.id === activeId);
    const recipientId = t?.registrations?.id;
    if (!recipientId) return;

    setSending(true);
    const optimistic: Message = {
      id: `tmp-${Date.now()}`,
      content: newMsg.trim(),
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
        body: JSON.stringify({ sender_id: registrationId, recipient_id: recipientId, content: optimistic.content }),
      });
      const data = await res.json() as { message: Message };
      if (data.message) {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? data.message : m));
      }
    } catch {} finally {
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
      className="flex flex-col lg:grid"
      style={{
        gridTemplateColumns: '320px 1fr',
        height: 'calc(100vh - 56px)',
      }}
    >
      {/* Left: inbox */}
      <aside className="max-h-[50vh] lg:max-h-full" style={{ borderRight: '1px solid #E5E0D4', display: 'flex', flexDirection: 'column', background: 'white' }}>
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid #E5E0D4' }}
        >
          <span className="font-display font-medium text-[16px]" style={{ color: '#1F4D3A' }}>Messages</span>
          <button
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors"
            style={{ background: '#E8EFEB', color: '#1F4D3A' }}
          >
            <Plus size={12} strokeWidth={2.5} /> New
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="py-12 text-center text-[13px]" style={{ color: '#6B7A72' }}>
              No messages yet.<br />Connect with people at the event to start a conversation.
            </div>
          ) : (
            threads.map(t => {
              const other = t.registrations;
              const isActive = t.id === activeId;
              return (
                <button
                  key={t.id}
                  onClick={() => switchThread(t.id)}
                  className="w-full flex items-center gap-3 px-5 py-4 transition-colors text-left relative"
                  style={{
                    background: isActive ? '#E8EFEB' : 'transparent',
                    borderBottom: '1px solid #F0EBE3',
                  }}
                >
                  {t.unread && (
                    <div
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{ background: '#1F4D3A' }}
                    />
                  )}
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white text-[13px] font-display font-semibold shrink-0"
                    style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}
                  >
                    {other ? initials(other.attendee_name) : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[15px] font-medium truncate"
                      style={{ color: '#1F4D3A', fontWeight: t.unread ? 600 : 500 }}
                    >
                      {other?.attendee_name ?? 'Attendee'}
                    </div>
                    <div className="text-[13px] truncate mt-0.5" style={{ color: '#6B7A72' }}>
                      {t.preview ?? ''}
                    </div>
                  </div>
                  {t.last_message_at && (
                    <div className=" text-[11px] shrink-0 self-start mt-1" style={{ color: '#6B7A72' }}>
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
            {/* Thread header */}
            <div
              className="h-16 flex items-center gap-3 px-6 shrink-0"
              style={{ borderBottom: '1px solid #E5E0D4', background: 'white' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-display font-semibold shrink-0"
                style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}
              >
                {partner ? initials(partner.attendee_name) : '?'}
              </div>
              <div>
                <div className="font-display font-medium text-[17px]" style={{ color: '#1F4D3A' }}>
                  {partner?.attendee_name ?? 'Attendee'}
                </div>
              </div>
              <a
                href={`/e/${eventId}/people`}
                className="ml-auto text-[13px] font-semibold"
                style={{ color: '#C9A45E' }}
              >
                View profile →
              </a>
            </div>

            {/* Eventera Card banner */}
            <div
              className="mx-6 mt-4 flex items-center gap-3 px-4 py-3 rounded-xl shrink-0"
              style={{ background: '#E8EFEB' }}
            >
              <div className="text-[13px] flex-1" style={{ color: '#1F4D3A' }}>
                Share your Eventera Card — let {partner?.attendee_name?.split(' ')[0] ?? 'them'} see your profile and save your contact.
              </div>
              <button className="text-[18px] leading-none" style={{ color: '#6B7A72' }}>×</button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
              {messages.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-[13px]" style={{ color: '#6B7A72' }}>
                  No messages yet. Say hello!
                </div>
              ) : (
                groupByDay(messages).map(group => (
                  <div key={group.label}>
                    <div className=" text-[11px] text-center my-3" style={{ color: '#6B7A72' }}>
                      {group.label}
                    </div>
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

            {/* Composer */}
            <div
              className="flex items-center gap-3 px-6 py-4 shrink-0"
              style={{ borderTop: '1px solid #E5E0D4', background: 'white' }}
            >
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

      <style>{`
        @media (max-width: 760px) {
          section { grid-template-columns: 1fr !important; }
          aside { display: none; }
        }
      `}</style>
    </div>
  );
}
