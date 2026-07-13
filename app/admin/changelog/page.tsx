import { requirePermission } from '@/lib/auth/guards';
import { CHANGELOG_EDIT } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { ChangelogAdminClient } from './ChangelogAdminClient';
import type { ChangelogEntry } from '@/components/admin/ChangelogForm';

export const metadata = { title: 'Changelog — Eventera Admin' };
export const dynamic = 'force-dynamic';

export default async function ChangelogAdminPage() {
  await requirePermission(CHANGELOG_EDIT);

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from('changelog_entries')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 lg:p-10 max-w-[860px]">
      <div className="mb-8">
        <div className=" text-[12px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Changelog
        </div>
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] text-[#0F1F18] tracking-tight">
          Changelog
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          Manage entries that appear on the public <code className=" text-[12px]">/whats-new</code> page.
        </p>
      </div>

      <ChangelogAdminClient initialEntries={(data ?? []) as ChangelogEntry[]} />
    </div>
  );
}
