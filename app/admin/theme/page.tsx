import { requirePermission } from '@/lib/auth/guards';
import { THEME_EDIT } from '@/lib/auth/permissions';
import { getSiteSettings } from '@/lib/theme/settings';
import { PageShell, PageHeader } from '@/components/dash';
import { ThemeEditorClient } from './ThemeEditorClient';

export const metadata = { title: 'Theme & Brand — Eventera Admin' };
export const dynamic = 'force-dynamic';

export default async function ThemePage() {
  await requirePermission(THEME_EDIT);
  const settings = await getSiteSettings();

  return (
    <PageShell width="wide">
      <PageHeader
        eyebrow="Admin · Theme"
        title="Theme & Brand"
        subtitle="Changes apply live across the whole product — no redeploy needed."
      />

      <ThemeEditorClient settings={settings} />
    </PageShell>
  );
}
