'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Hash, Plus, Pin, MessageSquare, ExternalLink, Trash2, Users, Bell } from 'lucide-react';
import { PageShell, PageHeader } from '@/components/dash';
import { Modal } from '@/components/ui/Modal';
import { toast } from '@/hooks/use-toast';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Channel = any;

interface Props {
  eventId: string;
  eventName: string;
  eventSlug: string;
  channels: Channel[];
  msgCounts: Record<string, number>;
  activePosters: number;
}

export function OrganizerCommunityClient({ eventId, eventName, eventSlug, channels, msgCounts: counts, activePosters }: Props) {
  const router = useRouter();
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Channel | null>(null);
  const [deleting, setDeleting] = useState(false);

  const totalMessages = Object.values(counts).reduce((a, b) => a + b, 0);

  async function handleCreate() {
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/events/${eventId}/community/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Couldn’t create the channel', description: data.error ?? 'Please try again.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Channel created', description: `#${data.channel?.name ?? newName.trim()}`, variant: 'success' });
      setNewName(''); setNewDesc(''); setShowNew(false);
      router.refresh();
    } catch {
      toast({ title: 'Couldn’t reach the server', description: 'Check your connection and try again.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  }

  async function performDelete() {
    if (!deleteTarget || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/events/${eventId}/community/channels?channel_id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast({ title: 'Couldn’t delete the channel', description: data.error ?? 'Please try again.', variant: 'destructive' });
        return;
      }
      toast({ title: 'Channel deleted', variant: 'success' });
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast({ title: 'Couldn’t reach the server', description: 'Check your connection and try again.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <PageShell width="wide">
      <PageHeader
        title="Community"
        subtitle={`Attendees discuss and connect before, during, and after ${eventName}`}
        actions={
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition hover:opacity-90"
            style={{ background: '#1F4D3A', color: '#FAF6EE' }}>
            <Plus size={14} /> New channel
          </button>
        }
      />

      {/* Summary stats — all real */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Channels', value: channels.length, icon: <Hash size={16} /> },
          { label: 'Total messages', value: totalMessages, icon: <MessageSquare size={16} /> },
          { label: 'Active attendees', value: activePosters, icon: <Users size={16} /> },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4" style={{ background: '#FFFFFF', border: '1px solid #E5E0D4' }}>
            <div className="flex items-center gap-2 mb-1" style={{ color: '#65736B' }}>{s.icon}
              <span className="text-[12px]">{s.label}</span>
            </div>
            <div className="font-display font-bold text-[22px]" style={{ color: '#0F1F18' }}>
              {s.value.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Channels list */}
      <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #E5E0D4' }}>
        <div className="px-5 py-3 flex items-center justify-between" style={{ background: '#FAF6EE', borderBottom: '1px solid #E5E0D4' }}>
          <span className="text-[12px] font-semibold" style={{ color: '#65736B' }}>CHANNELS</span>
          {channels.length > 0 && (
            // The attendee community lives in the dashboard; /e/:slug/community
            // only 307s here. Link the destination so this opens directly.
            <Link href={`/attending/${eventSlug}/community`} target="_blank"
              className="flex items-center gap-1.5 text-[12px] font-medium transition hover:opacity-70"
              style={{ color: '#1F4D3A' }}>
              <ExternalLink size={12} /> View as attendee
            </Link>
          )}
        </div>

        {channels.map((ch: Channel, i: number) => (
          <div key={ch.id}
            className="px-5 py-4 flex items-center gap-4"
            style={{ borderBottom: i < channels.length - 1 ? '1px solid #E5E0D4' : 'none', background: '#FFFFFF' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: ch.is_pinned ? '#E8EFEB' : '#FAF6EE' }}>
              <Hash size={15} style={{ color: ch.is_pinned ? '#1F4D3A' : '#65736B' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-[14px]" style={{ color: '#0F1F18' }}>#{ch.name}</span>
                {ch.is_pinned && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold"
                    style={{ background: 'rgba(232,197,126,0.12)', color: '#C9A45E' }}>
                    <Pin size={9} /> Pinned
                  </span>
                )}
              </div>
              <p className="text-[12px] truncate" style={{ color: '#65736B' }}>{ch.description}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[15px] font-semibold" style={{ color: '#0F1F18' }}>
                  {(counts[ch.id] ?? 0).toLocaleString()}
                </div>
                <div className="text-[12.5px]" style={{ color: '#C9C3B1' }}>messages</div>
              </div>
              <button onClick={() => setDeleteTarget(ch)} aria-label={`Delete #${ch.name}`}
                className="w-10 h-10 rounded-lg flex items-center justify-center transition hover:bg-[#FAF6EE]"
                style={{ color: '#B8423C' }}>
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {channels.length === 0 && (
          <div className="py-16 text-center" style={{ background: '#FFFFFF' }}>
            <Hash size={28} style={{ color: '#C9C3B1' }} className="mx-auto mb-3" />
            <p className="font-medium text-[15px] mb-1" style={{ color: '#0F1F18' }}>No channels yet</p>
            <p className="text-[13px]" style={{ color: '#65736B' }}>Create a channel to let attendees connect.</p>
          </div>
        )}
      </div>

      {/* Notification tip */}
      <div className="mt-4 rounded-2xl px-5 py-4 flex items-start gap-3"
        style={{ background: '#E8EFEB', border: '1px solid #C9E0D4' }}>
        <Bell size={16} style={{ color: '#1F4D3A', marginTop: 2 }} />
        <p className="text-[13px]" style={{ color: '#3A4A42', lineHeight: 1.5 }}>
          Attendees who opted in get a push notification for each message in the{' '}
          <strong>#announcements</strong> channel. Post there for important updates only.
        </p>
      </div>

      {/* New channel modal */}
      <Modal
        open={showNew}
        onClose={() => setShowNew(false)}
        title="New channel"
        footer={
          <>
            <button onClick={() => setShowNew(false)}
              className="h-10 px-4 rounded-xl text-[13px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#65736B' }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={!newName.trim() || creating}
              className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40" style={{ background: '#1F4D3A' }}>
              {creating ? 'Creating…' : 'Create channel'}
            </button>
          </>
        }
      >
        <div className="mb-3">
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#65736B' }}>Channel name</label>
          <input value={newName} onChange={e => setNewName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="e.g. networking"
            className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
            style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }} />
        </div>
        <div>
          <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#65736B' }}>Description (optional)</label>
          <input value={newDesc} onChange={e => setNewDesc(e.target.value)}
            placeholder="What this channel is for"
            className="w-full px-3 py-2.5 rounded-xl text-[14px] outline-none"
            style={{ background: '#FAF6EE', border: '1px solid #E5E0D4', color: '#0F1F18' }} />
        </div>
      </Modal>

      {/* Delete confirmation modal (branded, not a native dialog) */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete channel?"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)}
              className="h-10 px-4 rounded-xl text-[13px] font-medium border" style={{ borderColor: '#E5E0D4', color: '#65736B' }}>
              Cancel
            </button>
            <button onClick={performDelete} disabled={deleting}
              className="h-10 px-5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-40" style={{ background: '#B8423C' }}>
              {deleting ? 'Deleting…' : 'Delete channel'}
            </button>
          </>
        }
      >
        <p className="text-[14px]" style={{ color: '#3A4A42', lineHeight: 1.5 }}>
          <strong>#{deleteTarget?.name}</strong> and all its messages will be permanently removed. This can’t be undone.
        </p>
      </Modal>
    </PageShell>
  );
}
