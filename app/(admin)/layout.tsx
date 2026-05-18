import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('role, full_name').eq('id', user.id).single();

  if (!profile || !['admin', 'super_admin'].includes(profile.role ?? '')) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F4' }}>
      <header
        className="h-14 bg-white px-6 flex items-center gap-4 border-b sticky top-0 z-40"
        style={{ borderColor: '#E5E0D4' }}
      >
        <Link href="/dashboard" className="text-[13px] text-[#6B7A72] hover:text-[#0F1F18] transition">
          ← Back to app
        </Link>
        <div className="h-4 w-px" style={{ background: '#E5E0D4' }} />
        <span className="text-[13px] font-semibold text-[#0F1F18]">Admin panel</span>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] font-mono text-[#6B7A72]/60 uppercase tracking-widest">
            {profile.role === 'super_admin' ? 'Super admin' : 'Admin'}
          </span>
          <div className="h-7 w-7 rounded-full grid place-items-center text-white text-[11px] font-semibold" style={{ background: '#1F4D3A' }}>
            {profile.full_name?.[0]?.toUpperCase() ?? 'A'}
          </div>
        </div>
      </header>

      <div className="flex">
        <nav className="w-48 shrink-0 px-3 py-5 sticky top-14 h-[calc(100vh-56px)]">
          <div className="text-[10px] font-mono text-[#6B7A72]/50 uppercase tracking-widest px-2 mb-2">Admin</div>
          <ul className="space-y-0.5">
            {[
              { href: '/admin/users', label: 'Users' },
            ].map(item => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-2.5 py-[7px] rounded-lg text-[13.5px] text-[#3A4A42] hover:bg-white hover:text-[#0F1F18] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex-1 min-w-0 p-6">{children}</main>
      </div>
    </div>
  );
}
