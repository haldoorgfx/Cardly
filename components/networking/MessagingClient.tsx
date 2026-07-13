'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, ArrowLeft } from 'lucide-react';

interface ThreadSummary {
  id: string;
  other_participant_id: string;
  other_participant_name: string;
  last_message_at: string | null;
  unread_count: number;
}

interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface Props {
  eventId: string;
  registrationId: string;
  initialThreads: ThreadSummary[];
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-display font-semibold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.35, background: '#1F4D3A' }}
    >
      {initials}
    </div>
  );
}

export default function MessagingClient({ eventId, registrationId, initialThreads }: Props) {
  const [threads, setThreads] = useState(initialThreads);
  const [activeThread, setActiveThread] = useState<ThreadSummary | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showThreads, setShowThreads] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (threadId: string) => {
    const res = await fetch(
      `/api/events/${eventId}/messages?registration_id=${registrationId}&thread_id=${threadId}`
    );
    const data = await res.json() as { messages: Message[] };
    setMessages(data.messages ?? []);
  };

  const selectThread = (thread: ThreadSummary) => {
    setActiveThread(thread);
    setShowThreads(false);
    loadMessages(thread.id);
  };

  const sendMessage = async () => {
    if (!input.trim() || !activeThread || sending) return;
    setSending(true);
    const content = input.trim();
    setInput('');
    try {
      const res = await fetch(`/api/events/${eventId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: registrationId,
          recipient_id: activeThread.other_participant_id,
          content,
        }),
      });
      const data = await res.json() as { message: Message };
      setMessages(prev => [...prev, data.message]);
      setThreads(prev =>
        prev.map(t =>
          t.id === activeThread.id ? { ...t, last_message_at: new Date().toISOString() } : t
        )
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ background: '#FAF6EE' }}>
      {/* Thread list */}
      <div
        className={`flex-none border-r flex flex-col ${showThreads ? 'flex' : 'hidden'} md:flex`}
        style={{ width: 320, background: 'white', borderColor: '#E5E0D4' }}
      >
        <div className="px-5 py-4 border-b" style={{ borderColor: '#E5E0D4' }}>
          <h2 className="font-display font-semibold text-[16px]" style={{ color: '#0F1F18' }}>Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {threads.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="text-[28px] mb-2">💬</div>
              <p className="text-[13px] font-medium mb-1" style={{ color: '#0F1F18' }}>No messages yet</p>
              <p className="text-[12px]" style={{ color: '#6B7A72' }}>Connect with attendees to start a conversation.</p>
            </div>
          ) : threads.map(thread => (
            <button
              key={thread.id}
              onClick={() => selectThread(thread)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b"
              style={{ background: activeThread?.id === thread.id ? '#E8EFEB' : 'transparent', borderColor: '#F0EBE3' }}
            >
              <Avatar name={thread.other_participant_name} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[14px] truncate" style={{ color: '#0F1F18' }}>{thread.other_participant_name}</span>
                  {thread.unread_count > 0 && (
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: '#1F4D3A' }} />
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Thread / empty */}
      <div className={`flex-1 flex flex-col ${!showThreads || 'hidden'} md:flex`}>
        {!activeThread ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-[20px] font-display font-medium mb-2" style={{ color: '#1F4D3A' }}>Your messages</div>
              <div className="text-[14px]" style={{ color: '#6B7A72' }}>Select a conversation to read it.</div>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0" style={{ background: 'white', borderColor: '#E5E0D4' }}>
              <button className="md:hidden mr-1" onClick={() => setShowThreads(true)}><ArrowLeft size={18} style={{ color: '#6B7A72' }} /></button>
              <Avatar name={activeThread.other_participant_name} size={36} />
              <div className="font-display font-medium text-[15px]" style={{ color: '#0F1F18' }}>{activeThread.other_participant_name}</div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {messages.map(msg => {
                const isMine = msg.sender_id === registrationId;
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[75%] px-4 py-2.5 rounded-2xl text-[14px]"
                      style={{
                        background: isMine ? '#1F4D3A' : 'white',
                        color: isMine ? 'white' : '#0F1F18',
                        border: isMine ? 'none' : '1px solid #E5E0D4',
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer */}
            <div className="px-5 py-3 border-t shrink-0" style={{ background: 'white', borderColor: '#E5E0D4' }}>
              <div className="flex gap-2 items-end">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Send a message…"
                  aria-label="Message"
                  rows={1}
                  className="flex-1 rounded-2xl px-4 py-2.5 text-[14px] resize-none outline-none"
                  style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18', minHeight: 44, maxHeight: 120 }}
                />
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || sending}
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-opacity"
                  style={{ background: '#1F4D3A', opacity: !input.trim() || sending ? 0.5 : 1 }}
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
