import { PageShell, PageHeader } from '@/components/dash';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

// ONE settings shell: standard header + section tabs, shared by every
// /settings/* page. Subpages render only their content.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell width="default">
      <PageHeader title="Settings" subtitle="Your account, workspace and billing." />
      <SettingsTabs />
      <div className="pt-6">{children}</div>
    </PageShell>
  );
}
