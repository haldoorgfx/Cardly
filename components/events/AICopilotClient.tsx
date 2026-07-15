'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, TrendingUp, Users, ScanLine, MessageSquare } from 'lucide-react';

interface Stats {
  registrations: number;
  checkedIn: number;
}

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  stats: Stats;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const PROMPT_CHIPS = [
  'How many people are registered?',
  'Write a reminder email for attendees',
  'What\'s my check-in rate?',
  'Suggest a post-event survey question',
  'Draft a social post about this event',
  'What time should doors open?',
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'init',
    role: 'assistant',
    content: 'Hi! I\'m your Eventera Copilot — I know everything about your event and can help you manage it. Ask me anything about registrations, communications, check-in, or your schedule.',
  },
];

function renderContent(content: string) {
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n---\n/g, '<hr style="border-color:#E5E0D4;margin:8px 0"/>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

export function AICopilotClient({ eventId, eventName, stats }: Props) {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function send(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content };

    // Build the conversation to send (history minus the seeded greeting + new turn).
    const history = [...messages, userMsg]
      .filter(m => m.id !== 'init')
      .map(m => ({ role: m.role, content: m.content }));

    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const assistantId = `a-${Date.now()}`;
    try {
      const res = await fetch(`/api/events/${eventId}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || `Request failed (${res.status})`);
      }

      // First chunk: drop the loading dots and start the assistant bubble.
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
      setLoading(false);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages(prev => prev.map(m => (m.id === assistantId ? { ...m, content: acc } : m)));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      setLoading(false);
      setMessages(prev => {
        const withoutEmpty = prev.filter(m => !(m.id === assistantId && m.content === ''));
        return [...withoutEmpty, { id: `e-${Date.now()}`, role: 'assistant', content: `Sorry — I couldn't reach the AI service. ${msg}` }];
      });
    }
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)', background: '#FAF6EE' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: '#1F4D3A' }}>
          <Sparkles size={16} style={{ color: '#FAF6EE' }} />
        </div>
        <div>
          <h1 className="font-display font-semibold text-[16px]" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            AI Copilot
          </h1>
          <p className="text-[12px]" style={{ color: '#6B7A72' }}>{eventName} · Powered by Eventera AI</p>
        </div>
        {/* Live stats */}
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[13px]" style={{ color: '#6B7A72' }}>
            <Users size={13} style={{ color: '#6B7A72' }} />
            <span className="font-semibold" style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>{stats.registrations.toLocaleString()}</span>
            <span>regs</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[13px]" style={{ color: '#6B7A72' }}>
            <ScanLine size={13} style={{ color: '#2D7A4F' }} />
            <span className="font-semibold" style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>{stats.checkedIn.toLocaleString()}</span>
            <span>checked in</span>
          </div>
          {stats.registrations > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[13px]" style={{ color: '#6B7A72' }}>
              <TrendingUp size={13} style={{ color: '#E8C57E' }} />
              <span className="font-semibold" style={{ color: '#0F1F18', fontFamily: 'Inter, system-ui, sans-serif' }}>
                {Math.round((stats.checkedIn / stats.registrations) * 100)}%
              </span>
              <span>rate</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4" role="log" aria-live="polite" aria-label="Copilot conversation">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ background: msg.role === 'assistant' ? 'linear-gradient(135deg, #1F4D3A, #E8C57E)' : '#E8EFEB' }}>
              {msg.role === 'assistant'
                ? <Sparkles size={13} style={{ color: '#FAF6EE' }} />
                : <MessageSquare size={13} style={{ color: '#1F4D3A' }} />}
            </div>
            <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${
              msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
            }`}
              style={{
                background: msg.role === 'user' ? '#1F4D3A' : '#FFFFFF',
                color: msg.role === 'user' ? '#FAF6EE' : '#0F1F18',
                border: msg.role === 'assistant' ? '1px solid #E5E0D4' : 'none',
              }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
            />
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#1F4D3A' }}>
              <Sparkles size={13} style={{ color: '#FAF6EE' }} />
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-sm" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
              <div className="flex gap-1">
                {[0, 1, 2].map(i => (
                  <div key={i} className="w-2 h-2 rounded-full animate-bounce"
                    style={{ background: '#1F4D3A', animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Prompt chips */}
      <div className="px-5 pb-2 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {PROMPT_CHIPS.map(chip => (
          <button key={chip} onClick={() => send(chip)}
            className="px-3 py-1.5 rounded-full text-[12px] font-medium whitespace-nowrap transition hover:opacity-80 shrink-0"
            style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', color: '#3A4A42' }}>
            {chip}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-5 pb-5 pt-2">
        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl"
          style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask about your event…"
            aria-label="Ask AI Copilot about your event"
            className="flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: '#0F1F18' }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading} aria-label="Send message"
            className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80 disabled:opacity-30"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
