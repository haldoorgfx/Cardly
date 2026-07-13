import { requirePermission } from '@/lib/auth/guards';
import { TEMPLATE_MANAGE } from '@/lib/auth/permissions';
import { createAdminClient } from '@/lib/supabase/server';
import { TemplatesAdminClient } from './TemplatesAdminClient';

export const metadata = { title: 'Templates — Eventera Admin' };
export const dynamic = 'force-dynamic';

export default async function TemplatesAdminPage() {
  await requirePermission(TEMPLATE_MANAGE);

  const adminClient = createAdminClient();
  const { data: templates } = await adminClient
    .from('templates')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 lg:p-10 max-w-[1100px]">
      <div className="mb-8">
        <div className=" text-[12px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Templates
        </div>
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] text-[#0F1F18] tracking-tight">
          Template Management
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          Create and manage platform templates. Published templates appear in the user template picker per their minimum plan.
        </p>
      </div>

      <TemplatesAdminClient initialTemplates={templates ?? []} />
    </div>
  );
}
