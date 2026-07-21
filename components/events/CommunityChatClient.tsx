'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Hash, Pin, Send, Menu, ArrowLeft } from 'lucide-react';

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
  qrToken?: string | null;
  /** Dashboard mode: contained rounded card instead of full-viewport panes. */
  embedded?: boolean;
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
}

function initials(name: string | undefined) {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
}

function AvatarBubble({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div aria-hidden="true" className="rounded-full flex items-center justify-center font-bold shrink-0"
      style={{ width: size, height: size, background: '#1F4D3A', color: '#FAF6EE', fontSize: size * 0.35 }}>
      {initials(name)}
    </div>
  );
}

export function CommunityChatClient({ eventId, eventName, eventSlug, channels, initialMessages, activeChannelId: defaultChannelId, registrationId, qrToken, embedded = false }: Props) {
  const [activeChannelId, setActiveChannelId] = useState(defaultChannelId ?? channels[0]?.id ?? null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const activeChannel = channels.find((c: Channel) => c.id === activeChannelId) ?? channels[0];
  const pinned = messages.filter((m: Message) => m.is_pinned);

  async function loadChannel(channelId: string) {
    setActiveChannelId(channelId);
    setSidebarOpen(false);
    setMessages([]);
    try {
      // `reg`+`token` is how the route proves the caller is an attendee of this
      // event — reads are gated the same way writes are.
      const regParam = registrationId ? `&reg=${registrationId}&token=${qrToken ?? ''}` : '';
      const res = await fetch(`/api/events/${eventId}/community?channel_id=${channelId}${regParam}`);
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
        body: JSON.stringify({ channel_id: activeChannelId, registration_id: registrationId, content, qr_code_token: qrToken }),
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

  if (channels.length === 0) {
    return (
      <div
        className={`flex items-center justify-center text-center px-6 ${embedded ? '' : 'h-full'}`}
        style={embedded ? { height: 480 } : undefined}
      >
        <div>
          <Hash size={30} style={{ color: '#65736B' }} className="mx-auto mb-3" />
          <div className="font-display font-semibold text-[17px] mb-1" style={{ color: '#0F1F18' }}>
            No community channels yet
          </div>
          <div className="text-[13px]" style={{ color: '#65736B' }}>
            The organizer hasn’t opened any channels for this event.
          </div>
        </div>
      </div>
    );
  }

  // A 256px sidebar to list a single channel is pure overhead — most events
  // only ever have #general. The channel name already sits in the header, so
  // the rail only earns its space once there's something to switch between.
  const showChannelRail = channels.length > 1;

  return (
    <div
      className={embedded ? 'flex rounded-2xl border overflow-hidden' : 'flex h-full'}
      style={{
        // Non-embedded fills its parent instead of guessing chrome height with
        // calc(100vh - 56px), which under-counted the shell's back-link bar and
        // footer and pushed the composer below the fold.
        ...(embedded
          ? { height: 620, borderColor: '#E5E0D4', boxShadow: '0 1px 2px rgba(15,31,24,0.04)' }
          : {}),
      }}
    >
      {/* Sidebar overlay for mobile */}
      {showChannelRail && sidebarOpen && (
        <div className="fixed inset-0 z-20 lg:hidden" style={{ background: 'rgba(15,31,24,0.45)' }}
          onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      {showChannelRail && (
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative z-30 lg:z-auto h-full transition-transform w-64 shrink-0 flex flex-col`}
        style={{ background: '#FAF6EE', borderRight: '1px solid #E5E0D4' }}>
        {/* Event name */}
        <div className="px-4 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
          <div className="font-display font-semibold text-[14px]" style={{ color: '#0F1F18' }}>{eventName}</div>
          <div className="text-[12.5px] mt-0.5" style={{ color: '#65736B' }}>Community</div>
        </div>

        {/* Channels */}
        <div className="flex-1 overflow-y-auto py-3">
          <div className="px-3 mb-2 text-[12px] font-bold tracking-[0.12em] uppercase" style={{ color: '#65736B' }}>
            Channels
          </div>
          {channels.map((ch: Channel) => (
            <button key={ch.id}
              type="button"
              onClick={() => loadChannel(ch.id)}
              aria-current={ch.id === activeChannelId ? 'true' : undefined}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg mx-1 text-left transition"
              style={{
                background: ch.id === activeChannelId ? '#E8EFEB' : 'transparent',
                color: ch.id === activeChannelId ? '#1F4D3A' : '#65736B',
                width: 'calc(100% - 8px)',
              }}>
              <Hash size={14} strokeWidth={1.8} />
              <span className="text-[13px] font-medium">{ch.name}</span>
              {ch.is_pinned && <Pin size={10} className="ml-auto opacity-40" />}
            </button>
          ))}
        </div>
      </div>
      )}

      {/* Main chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b shrink-0"
          style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
          {showChannelRail && (
            <button
              type="button"
              className="lg:hidden -ml-1 w-10 h-10 flex items-center justify-center shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open channel list"
              style={{ color: '#65736B' }}
            >
              <Menu size={18} />
            </button>
          )}
          {/* The shell no longer draws a back bar above an immersive pane, so
              the way out lives here instead of costing a whole row of height. */}
          {!embedded && (
            <Link
              href={`/e/${eventSlug}`}
              aria-label={`Back to ${eventName}`}
              className="w-9 h-9 -ml-1 rounded-lg flex items-center justify-center shrink-0 transition hover:opacity-70"
              style={{ color: '#1F4D3A', background: '#E8EFEB' }}
            >
              <ArrowLeft size={16} strokeWidth={2} />
            </Link>
          )}
          <div className="min-w-0 flex items-center gap-2">
            <Hash size={16} style={{ color: '#65736B' }} className="shrink-0" />
            <span className="font-semibold text-[15px] truncate" style={{ color: '#0F1F18' }}>
              {activeChannel?.name ?? 'general'}
            </span>
          </div>
          {activeChannel?.description && (
            <span className="text-[12px] border-l pl-3 hidden md:block truncate" style={{ borderColor: '#E5E0D4', color: '#65736B' }}>
              {activeChannel.description}
            </span>
          )}
          {pinned.length > 0 && (
            <span className="ml-auto flex items-center gap-1 text-[12.5px] shrink-0" style={{ color: '#65736B' }}>
              <Pin size={11} /> {pinned.length} pinned
            </span>
          )}
        </div>

        {/* Messages. flex column so an empty channel can centre its state in
            the available space instead of stranding it at the top of a very
            tall, otherwise blank pane. */}
        <div
          className={`flex-1 min-h-0 overflow-y-auto px-4 py-4 ${messages.length === 0 && pinned.length === 0 ? 'flex flex-col' : 'space-y-4'}`}
          role="log"
          aria-live="polite"
          aria-label="Chat messages"
          style={{ background: '#FAF6EE' }}
        >
          {/* Pinned message */}
          {pinned.length > 0 && (
            <div className="rounded-xl px-4 py-3 flex items-start gap-3 mb-2"
              style={{ background: '#E8EFEB', border: '1px solid #E5E0D4' }}>
              <Pin size={13} style={{ color: '#1F4D3A', marginTop: 2 }} />
              <div>
                <div className="text-[12.5px] font-semibold mb-0.5" style={{ color: '#65736B' }}>Pinned message</div>
                <div className="text-[13px]" style={{ color: '#0F1F18' }}>{pinned[0].content}</div>
              </div>
            </div>
          )}

          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: '#E8EFEB' }}
              >
                <Hash size={22} strokeWidth={1.8} style={{ color: '#1F4D3A' }} />
              </div>
              <div className="font-display font-semibold text-[17px]" style={{ color: '#0F1F18' }}>
                Start the conversation
              </div>
              <p className="text-[13.5px] mt-1.5 max-w-[300px]" style={{ color: '#65736B', lineHeight: 1.55 }}>
                {registrationId
                  ? `No one has posted in #${activeChannel?.name ?? 'general'} yet. Say hello — introduce yourself to the other attendees.`
                  : `This is where attendees of ${eventName} talk before and during the event.`}
              </p>
            </div>
          )}

          {messages.map((msg: Message) => {
            const name = msg.registrations?.attendee_name ?? 'Attendee';
            return (
              <div key={msg.id} className="flex items-start gap-3 group relative">
                <AvatarBubble name={name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-semibold text-[13px]" style={{ color: '#0F1F18' }}>{name}</span>
                    <span className="text-[12.5px]" style={{ color: '#65736B' }}>{fmtTime(msg.created_at)}</span>
                    {msg.is_pinned && <Pin size={10} style={{ color: '#1F4D3A' }} />}
                  </div>
                  <p className="text-[14px]" style={{ color: '#3A4A42', lineHeight: 1.5 }}>{msg.content}</p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Message input — shrink-0 so it can never be squeezed out of view. */}
        <div className="px-4 py-3 border-t shrink-0" style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: '#FAF6EE', border: '1px solid #E5E0D4' }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder={registrationId ? `Message #${activeChannel?.name ?? 'general'}` : 'Message'}
              aria-label={registrationId ? `Message #${activeChannel?.name ?? 'general'}` : 'Message input, register to post'}
              disabled={!registrationId || sending}
              className="flex-1 bg-transparent text-[14px] outline-none disabled:opacity-60"
              style={{ color: '#0F1F18' }}
            />
            <button type="button" onClick={sendMessage} disabled={!input.trim() || sending || !registrationId}
              aria-label="Send message"
              className="w-10 h-10 rounded-xl flex items-center justify-center transition hover:opacity-80 disabled:opacity-30 shrink-0"
              style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
              <Send size={14} />
            </button>
          </div>
          {!registrationId && (
            // Was a dead sentence under a disabled box. Registering is the
            // actual next step, so link to it rather than describing it.
            <p className="text-[12.5px] text-center mt-2" style={{ color: '#65736B' }}>
              <Link
                href={`/e/${eventSlug}/register`}
                className="font-medium underline"
                style={{ color: '#1F4D3A' }}
              >
                Register for {eventName}
              </Link>{' '}
              to join the conversation
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
