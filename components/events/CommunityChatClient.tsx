'use client';

import { useState, useRef, useEffect } from 'react';
import { Hash, Pin, Send, SmilePlus, Menu, X } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Channel = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Message = any;

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  channels: Channel[];
  initialMessages: Message[];
  activeChannelId: string | null;
  registrationId?: string;
}

const REACTIONS = ['👍', '❤️', '🔥', '😂', '🎉'];

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string | undefined) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function AvatarBubble({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)', color: '#FAF6EE', fontSize: size * 0.35 }}>
      {initials(name)}
    </div>
  );
}

export function CommunityChatClient({ eventId, eventName, channels, initialMessages, activeChannelId: defaultChannelId, registrationId }: Props) {
  const [activeChannelId, setActiveChannelId] = useState(defaultChannelId ?? channels[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [showReactionFor, setShowReactionFor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const activeChannel = channels.find((c: Channel) => c.id === activeChannelId) ?? channels[0];
  const pinned = messages.filter((m: Message) => m.is_pinned);

  async function loadChannel(channelId: string) {
    setActiveChannelId(channelId);
    setSidebarOpen(false);
    setMessages([]);
    try {
      const res = await fetch(`/api/events/${eventId}/community?channel_id=${channelId}`);
      const data = await res.json() as { messages?: Message[] };
      setMessages(data.messages ?? []);
    } catch { /* keep empty */ }
  }

  async function sendMessage() {
    const content = input.trim();
    if (!content || sending || !activeChannelId || !registrationId) return;
    setSending(true);
    const optimistic: Message = {
      id: `local-${Date.now()}`,
      content,
      created_at: new Date().toISOString(),
      is_pinned: false,
      registrations: { attendee_name: 'You' },
    };
    setMessages(prev => [...prev, optimistic]);
    setInput('');
    try {
      const res = await fetch(`/api/events/${eventId}/community`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel_id: activeChannelId, registration_id: registrationId, content }),
      });
      const data = await res.json() as { message?: Message; error?: string };
      if (data.message) {
        setMessages(prev => prev.map(m => (m.id === optimistic.id ? data.message : m)));
      } else {
        // Roll back on failure and restore the text.
        setMessages(prev => prev.filter(m => m.id !== optimistic.id));
        setInput(content);
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimistic.id));
      setInput(content);
    } finally {
      setSending(false);
    }
  }

  function addReaction(messageId: string, emoji: string) {
    setReactions(prev => ({
      ...prev,
      [messageId]: [...(prev[messageId] ?? []), emoji],
    }));
    setShowReactionFor(null);
  }

  if (channels.length === 0) {
    return (
      <div className="flex items-center justify-center text-center px-6" style={{ height: 'calc(100vh - 56px)' }}>
        <div>
          <Hash size={30} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
          <div className="font-display font-semibold text-[17px] mb-1" style={{ color: '#0F1F18' }}>
            No community channels yet
          </div>
          <div className="text-[13px]" style={{ color: '#6B7A72' }}>
            The organizer hasn’t opened any channels for this event.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ background: 'rgba(15,31,24,0.45)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 lg:z-auto h-full transition-transform w-64 shrink-0 flex flex-col`}
        style={{ background: '#0F1F18', borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        {/* Event name */}
        <div className="px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
          <div className="font-display font-semibold text-[14px]" style={{ color: '#FAF6EE' }}>{eventName}</div>
          <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Community</div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto py-3">
          <div className="px-3 mb-2 text-[10px] font-bold tracking-[0.12em] uppercase" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Channels
          </div>
          {channels.map((ch: Channel) => (
            <button key={ch.id}
              onClick={() => loadChannel(ch.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mx-1 text-left transition"
              style={{
                background: ch.id === activeChannelId ? 'rgba(255,255,255,0.1)' : 'transparent',
                color: ch.id === activeChannelId ? '#FAF6EE' : 'rgba(255,255,255,0.5)',
                width: 'calc(100% - 8px)',
              }}>
              <Hash size={14} strokeWidth={1.8} />
              <span className="text-[13px] font-medium">{ch.name}</span>
              {ch.is_pinned && <Pin size={10} className="ml-auto opacity-40" />}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b"
          style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
          <button className="lg:hidden mr-1" onClick={() => setSidebarOpen(true)} style={{ color: '#6B7A72' }}>
            <Menu size={18} />
          </button>
          <Hash size={16} style={{ color: '#1F4D3A' }} />
          <span className="font-semibold text-[15px]" style={{ color: '#0F1F18' }}>
            {activeChannel?.name ?? 'general'}
          </span>
          {activeChannel?.description && (
            <span className="text-[12px] border-l pl-3 hidden sm:block" style={{ borderColor: '#E5E0D4', color: '#6B7A72' }}>
              {activeChannel.description}
            </span>
          )}
          {pinned.length > 0 && (
            <span className="ml-auto flex items-center gap-1 text-[11px]" style={{ color: '#6B7A72' }}>
              <Pin size={11} /> {pinned.length} pinned
            </span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: '#FAF6EE' }}>
          {/* Pinned message */}
          {pinned.length > 0 && (
            <div className="rounded-xl px-4 py-3 flex items-start gap-3 mb-2"
              style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
              <Pin size={13} style={{ color: '#1F4D3A', marginTop: 2 }} />
              <div>
                <div className="text-[11px] font-semibold mb-0.5" style={{ color: '#1F4D3A' }}>Pinned message</div>
                <div className="text-[13px]" style={{ color: '#0F1F18' }}>{pinned[0].content}</div>
              </div>
            </div>
          )}

          {messages.map((msg: Message) => {
            const name = msg.registrations?.attendee_name ?? 'Attendee';
            const msgReactions = reactions[msg.id] ?? [];
            return (
              <div key={msg.id} className="flex items-start gap-3 group relative">
                <AvatarBubble name={name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-semibold text-[13px]" style={{ color: '#0F1F18' }}>{name}</span>
                    <span className="text-[11px]" style={{ color: '#C9C3B1' }}>{fmtTime(msg.created_at)}</span>
                    {msg.is_pinned && <Pin size={10} style={{ color: '#1F4D3A' }} />}
                  </div>
                  <p className="text-[14px]" style={{ color: '#3A4A42', lineHeight: 1.5 }}>{msg.content}</p>
                  {/* Reactions */}
                  {msgReactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {Object.entries(
                        msgReactions.reduce((acc: Record<string, number>, e: string) => { acc[e] = (acc[e] ?? 0) + 1; return acc; }, {})
                      ).map(([emoji, count]) => (
                        <button key={emoji}
                          className="px-2 py-0.5 rounded-full text-[12px] border transition hover:opacity-80"
                          style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
                          {emoji} {String(count)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* Reaction picker trigger */}
                <button
                  onClick={() => setShowReactionFor(showReactionFor === msg.id ? null : msg.id)}
                  className="opacity-0 group-hover:opacity-100 transition w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#6B7A72', flexShrink: 0 }}>
                  <SmilePlus size={13} />
                </button>
                {showReactionFor === msg.id && (
                  <div className="absolute right-0 top-0 z-10 flex gap-1 px-2 py-1.5 rounded-xl shadow-lg"
                    style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
                    {REACTIONS.map(emoji => (
                      <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                        className="text-[18px] hover:scale-125 transition-transform">
                        {emoji}
                      </button>
                    ))}
                    <button onClick={() => setShowReactionFor(null)} style={{ color: '#6B7A72' }}>
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input */}
        <div className="px-4 py-3 border-t" style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder={registrationId ? `Message #${activeChannel?.name ?? 'general'}` : 'Register to post a message'}
              disabled={!registrationId || sending}
              className="flex-1 bg-transparent text-[14px] outline-none disabled:opacity-60"
              style={{ color: '#0F1F18' }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || sending || !registrationId}
              className="w-8 h-8 rounded-xl flex items-center justify-center transition hover:opacity-80 disabled:opacity-30"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              <Send size={14} />
            </button>
          </div>
          {!registrationId && (
            <p className="text-[11px] text-center mt-2" style={{ color: '#C9C3B1' }}>
              Register for the event to post messages
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
