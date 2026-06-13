import { requirePermission } from '@/lib/auth/guards';
import { THEME_EDIT } from '@/lib/auth/permissions';
import { getSiteSettings } from '@/lib/theme/settings';
import { ThemeEditorClient } from './ThemeEditorClient';

export const metadata = { title: 'Theme & Brand — Karta Admin' };
export const dynamic = 'force-dynamic';

export default async function ThemePage() {
  await requirePermission(THEME_EDIT);
  const settings = await getSiteSettings();

  return (
    <div className="p-6 lg:p-10 max-w-[860px]">
      <div className="mb-8">
        <div className=" text-[10px] tracking-[0.22em] uppercase text-[#6B7A72] mb-2">
          Admin · Theme
        </div>
        <h1 className="font-display font-bold text-[28px] text-[#0F1F18] tracking-tight">
          Theme & Brand
        </h1>
        <p className="mt-1.5 text-[14px] text-[#6B7A72]">
          Changes apply live across the whole product — no redeploy needed.
        </p>
      </div>

      <ThemeEditorClient settings={settings} />
    </div>
  );
}
