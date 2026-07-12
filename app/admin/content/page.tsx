import { requirePermission } from '@/lib/auth/guards';
import { CONTENT_EDIT } from '@/lib/auth/permissions';
import { listPages } from '@/lib/cms/queries';
import { ContentAdminClient } from './ContentAdminClient';

export const metadata = { title: 'Content — Eventera Admin' };
export const dynamic = 'force-dynamic';

export default async function ContentAdminPage() {
  await requirePermission(CONTENT_EDIT);
  const pages = await listPages();

  return (
    <div className="p-6 lg:p-10 max-w-[1000px]">
      <div className="mb-8">
        <div className=" text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Content
        </div>
        <h1 className="font-display font-semibold text-[26px] sm:text-[30px] text-[#0F1F18] tracking-tight">
          Content Pages
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          CMS-managed marketing pages. Preview before publishing.
        </p>
      </div>

      <ContentAdminClient initialPages={pages} />
    </div>
  );
}
