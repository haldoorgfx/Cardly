'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Menu, X, Bell } from 'lucide-react';

interface PublicNavProps {
  eventSlug?: string;
  eventName?: string;
}

type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  account_type: string;
};

export function PublicNav({ eventSlug }: PublicNavProps = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user ?? null;
      setUser(u);
      if (u) {
        supabase
          .from('profiles')
          .select('id, full_name, avatar_url, account_type')
          .eq('id', u.id)
          .single()
          .then(({ data: p }) => setProfile(p));
      }
    });
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  const isAttendee = profile?.account_type === 'attendee' || (user && !profile);

  // Event-scoped nav — the event's own sections (same for everyone viewing the event)
  const eventLinks = [
    { href: `/e/${eventSlug}`,           label: 'Overview', exact: true },
    { href: `/e/${eventSlug}/schedule`,  label: 'Schedule' },
    { href: `/e/${eventSlug}/speakers`,  label: 'Speakers' },
    { href: `/e/${eventSlug}/sponsors`,  label: 'Sponsors' },
    { href: `/e/${eventSlug}/people`,    label: 'Network' },
  ];

  // Global nav for attendees (no event context)
  const attendeeLinks = [
    { href: '/home',       label: 'Home' },
    { href: '/events',     label: 'Discover' },
    { href: '/my-tickets', label: 'My tickets' },
    { href: '/saved',      label: 'Saved' },
  ];

  // Global nav for organizers / signed-out visitors
  const organizerLinks = [
    { href: '/events',       label: 'Discover' },
    { href: '/how-it-works', label: 'How it works' },
    { href: '/pricing',      label: 'Pricing' },
  ];

  const navLinks = eventSlug
    ? eventLinks
    : (user && isAttendee) ? attendeeLinks : organizerLinks;

  function isActive(href: string, exact?: boolean) {
    if (href === '/events' || exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + '/');
  }

  const avatarLetter = profile?.full_name?.[0]?.toUpperCase()
    ?? user?.email?.[0]?.toUpperCase()
    ?? '?';

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        height: 64,
        background: 'rgba(250,246,238,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E5E0D4',
      }}
    >
      <div className="max-w-[1120px] mx-auto h-full px-5 flex items-center gap-6">
        {/* Wordmark */}
        <Link href={eventSlug ? `/e/${eventSlug}` : '/'} className="flex items-center gap-1.5 shrink-0 hover:opacity-80 transition-opacity">
          <span className="font-display font-semibold text-[19px] tracking-tight" style={{ color: '#0F1F18', letterSpacing: '-0.01em' }}>
            Kart<span style={{ color: '#E8C57E' }}>a</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-7 flex-1 ml-4">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[14px] font-medium transition-colors"
              style={{ color: isActive(link.href, (link as { exact?: boolean }).exact) ? '#1F4D3A' : '#3A4A42' }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <>
              {/* Bell (attendee) */}
              {isAttendee && (
                <Link
                  href="/account/notifications"
                  className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg transition hover:bg-[#E8EFEB]"
                  style={{ border: '1px solid #E5E0D4' }}
                  aria-label="Notifications"
                >
                  <Bell size={15} strokeWidth={1.8} style={{ color: '#3A4A42' }} />
                </Link>
              )}

              {/* Dashboard (organizer) */}
              {!isAttendee && (
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex items-center h-9 px-4 rounded-lg text-[14px] font-medium transition hover:bg-[#E8EFEB]"
                  style={{ color: '#1F4D3A', border: '1px solid #1F4D3A' }}
                >
                  Dashboard
                </Link>
              )}

              {/* Avatar + dropdown */}
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setAvatarMenuOpen(v => !v)}
                  className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden shrink-0 transition hover:opacity-80"
                  style={{ border: '2px solid #E8C57E' }}
                >
                  {profile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center text-white text-[13px] font-semibold"
                      style={{ background: 'linear-gradient(135deg, #1F4D3A, #2A6A50)' }}
                    >
                      {avatarLetter}
                    </div>
                  )}
                </button>

                {avatarMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setAvatarMenuOpen(false)} />
                    <div
                      className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-40"
                      style={{ background: '#FFFFFF', border: '1px solid #E5E0D4', boxShadow: '0 8px 24px rgba(15,31,24,0.12)' }}
                    >
                      <div className="px-4 py-3 border-b" style={{ borderColor: '#E5E0D4' }}>
                        <p className="font-medium text-[13px] truncate" style={{ color: '#0F1F18' }}>
                          {profile?.full_name ?? user.email?.split('@')[0]}
                        </p>
                        <p className="text-[12px] truncate mt-0.5" style={{ color: '#6B7A72' }}>{user.email}</p>
                      </div>
                      <Link href="/home" onClick={() => setAvatarMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 text-[13px] font-medium hover:bg-[#FAF6EE] transition-colors" style={{ color: '#1F4D3A' }}>
                        Home
                      </Link>
                      {isAttendee && (
                        <Link href="/my-tickets" onClick={() => setAvatarMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-[13px] hover:bg-[#FAF6EE] transition-colors" style={{ color: '#0F1F18' }}>
                          My tickets
                        </Link>
                      )}
                      {!isAttendee && (
                        <Link href="/dashboard" onClick={() => setAvatarMenuOpen(false)}
                          className="flex items-center px-4 py-2.5 text-[13px] hover:bg-[#FAF6EE] transition-colors" style={{ color: '#0F1F18' }}>
                          Dashboard
                        </Link>
                      )}
                      <Link href="/account/profile" onClick={() => setAvatarMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 text-[13px] hover:bg-[#FAF6EE] transition-colors" style={{ color: '#0F1F18' }}>
                        Profile &amp; preferences
                      </Link>
                      <Link href="/account/notifications" onClick={() => setAvatarMenuOpen(false)}
                        className="flex items-center px-4 py-2.5 text-[13px] hover:bg-[#FAF6EE] transition-colors" style={{ color: '#0F1F18' }}>
                        Notifications
                      </Link>
                      <div className="border-t" style={{ borderColor: '#E5E0D4' }} />
                      <button onClick={handleSignOut}
                        className="w-full flex items-center px-4 py-2.5 text-[13px] hover:bg-[#FAF6EE] transition-colors" style={{ color: '#B8423C' }}>
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/account/login"
              className="hidden sm:inline-block text-[14px] font-medium transition-colors"
              style={{ color: '#3A4A42' }}
            >
              Sign in
            </Link>
          )}

          <Link
            href={user && !isAttendee ? '/events/new' : (user ? '/events' : '/account/login')}
            className="inline-flex items-center h-9 px-4 rounded-lg text-white text-[14px] font-medium transition hover:opacity-90"
            style={{ background: '#1F4D3A' }}
          >
            {user && !isAttendee ? 'Host an event' : user ? 'Discover' : 'Get started'}
          </Link>

          {/* Mobile hamburger */}
          <button
            className="md:hidden h-9 w-9 rounded-lg flex items-center justify-center transition"
            style={{ border: '1px solid #E5E0D4' }}
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={16} strokeWidth={2} /> : <Menu size={16} strokeWidth={2} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden px-5 pb-5 pt-2 flex flex-col gap-1" style={{ background: '#FAF6EE', borderTop: '1px solid #E5E0D4' }}>
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} onClick={() => setMenuOpen(false)}
              className="text-[15px] font-medium py-2.5 border-b" style={{ color: '#0F1F18', borderColor: '#F0EDE7' }}>
              {link.label}
            </Link>
          ))}
          {user && (
            <Link href="/home" onClick={() => setMenuOpen(false)}
              className="text-[15px] font-medium py-2.5 border-b" style={{ color: '#1F4D3A', borderColor: '#F0EDE7' }}>
              Home
            </Link>
          )}
          {user && (
            <>
              {!isAttendee && (
                <Link href="/dashboard" onClick={() => setMenuOpen(false)}
                  className="text-[15px] font-medium py-2.5 border-b" style={{ color: '#0F1F18', borderColor: '#F0EDE7' }}>
                  Dashboard
                </Link>
              )}
              <Link href="/account/profile" onClick={() => setMenuOpen(false)}
                className="text-[15px] font-medium py-2.5 border-b" style={{ color: '#0F1F18', borderColor: '#F0EDE7' }}>
                Profile & preferences
              </Link>
              <Link href="/account/notifications" onClick={() => setMenuOpen(false)}
                className="text-[15px] font-medium py-2.5 border-b" style={{ color: '#0F1F18', borderColor: '#F0EDE7' }}>
                Notifications
              </Link>
            </>
          )}
          {!user ? (
            <Link href="/account/login" onClick={() => setMenuOpen(false)}
              className="text-[15px] font-medium py-2.5" style={{ color: '#3A4A42' }}>
              Sign in
            </Link>
          ) : (
            <button onClick={handleSignOut}
              className="text-left text-[15px] font-medium py-2.5 mt-1" style={{ color: '#B8423C' }}>
              Sign out
            </button>
          )}
        </div>
      )}
    </header>
  );
}
