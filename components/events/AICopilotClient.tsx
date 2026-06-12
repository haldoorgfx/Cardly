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
    content: 'Hi! I\'m your Karta Copilot — I know everything about your event and can help you manage it. Ask me anything about registrations, communications, check-in, or your schedule.',
  },
];

function getAutoResponse(question: string, eventName: string, stats: Stats): string {
  const q = question.toLowerCase();
  if (q.includes('register') || q.includes('how many')) {
    return `You currently have **${stats.registrations.toLocaleString()} confirmed registrations** for ${eventName}. ${stats.checkedIn > 0 ? `Of those, **${stats.checkedIn}** have already checked in.` : 'Check-in hasn\'t started yet.'}`;
  }
  if (q.includes('check-in') || q.includes('checkin')) {
    const rate = stats.registrations > 0 ? Math.round((stats.checkedIn / stats.registrations) * 100) : 0;
    return `Your current check-in rate is **${rate}%** (${stats.checkedIn.toLocaleString()} of ${stats.registrations.toLocaleString()} registrations). ${rate < 60 ? 'Consider sending a reminder — check-in rates typically peak in the last 24 hours before the event.' : 'Great turnout!'}`;
  }
  if (q.includes('email') || q.includes('reminder')) {
    return `Here's a draft reminder email for your attendees:\n\n---\n**Subject:** See you tomorrow at ${eventName} 🎉\n\nHi [Name],\n\nWe're so excited to see you at ${eventName}! Here are a few things to know:\n\n• **Doors open at [TIME]**\n• Bring your QR code (it's in your ticket email)\n• Arrive 15 minutes early to avoid queues\n\nSee you there!\n\n*The ${eventName} Team*\n\n---\n\nWant me to adjust the tone or add more details?`;
  }
  if (q.includes('social') || q.includes('post')) {
    return `Here's a social post you can use:\n\n---\n🎉 **${eventName}** is almost here!\n\nJoin ${stats.registrations}+ attendees for an unforgettable experience. We can't wait to see you there.\n\n📍 [Venue] · 📅 [Date]\n\nGet your tickets → [link]\n\n#Karta #Events #${eventName.replace(/\s+/g, '')}\n\n---\n\nWant a version for LinkedIn, Twitter/X, or WhatsApp?`;
  }
  if (q.includes('survey') || q.includes('feedback')) {
    return `Here are 3 strong post-event survey questions:\n\n1. **Overall experience** (1–5 stars): How would you rate your overall experience at ${eventName}?\n2. **Open-ended**: What was the highlight of the event for you?\n3. **NPS**: How likely are you to recommend this event to a friend or colleague? (0–10)\n\nKeep it under 5 questions for the best response rate.`;
  }
  if (q.includes('door') || q.includes('time')) {
    return `A good rule of thumb: **open doors 30–45 minutes before your first session starts**. This gives check-in staff time to process attendees without creating a queue at peak time. If you have ${stats.registrations} registrations, I'd recommend 2–3 check-in stations minimum.`;
  }
  return `That's a great question about ${eventName}! I'm working with the data I have — ${stats.registrations} registrations and ${stats.checkedIn} check-ins so far. Could you rephrase or give me more context so I can give you a precise answer?`;
}

function renderContent(content: string) {
  return content
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n---\n/g, '<hr style="border-color:#E5E0D4;margin:8px 0"/>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

export function AICopilotClient({ eventName, stats }: Omit<Props, 'eventId'> & { eventId?: string }) {
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
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    const reply = getAutoResponse(content, eventName, stats);
    setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'assistant', content: reply }]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)', background: '#FAF6EE' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center gap-3" style={{ background: '#FFFFFF', borderColor: '#E5E0D4' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #1F4D3A, #E8C57E)' }}>
          <Sparkles size={16} style={{ color: '#FAF6EE' }} />
        </div>
        <div>
          <h1 className="font-display font-semibold text-[16px]" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            AI Copilot
          </h1>
          <p className="text-[12px]" style={{ color: '#6B7A72' }}>{eventName} · Powered by Karta AI</p>
        </div>
        {/* Live stats */}
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-1.5 text-[13px]" style={{ color: '#6B7A72' }}>
            <Users size={13} style={{ color: '#1F4D3A' }} />
            <span className="font-semibold" style={{ color: '#0F1F18', fontFamily: '"JetBrains Mono", monospace' }}>{stats.registrations.toLocaleString()}</span>
            <span>regs</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-[13px]" style={{ color: '#6B7A72' }}>
            <ScanLine size={13} style={{ color: '#2D7A4F' }} />
            <span className="font-semibold" style={{ color: '#0F1F18', fontFamily: '"JetBrains Mono", monospace' }}>{stats.checkedIn.toLocaleString()}</span>
            <span>checked in</span>
          </div>
          {stats.registrations > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[13px]" style={{ color: '#6B7A72' }}>
              <TrendingUp size={13} style={{ color: '#E8C57E' }} />
              <span className="font-semibold" style={{ color: '#0F1F18', fontFamily: '"JetBrains Mono", monospace' }}>
                {Math.round((stats.checkedIn / stats.registrations) * 100)}%
              </span>
              <span>rate</span>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
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
              style={{ background: 'linear-gradient(135deg, #1F4D3A, #E8C57E)' }}>
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
            className="flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: '#0F1F18' }}
          />
          <button onClick={() => send()} disabled={!input.trim() || loading}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition hover:opacity-80 disabled:opacity-30"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
