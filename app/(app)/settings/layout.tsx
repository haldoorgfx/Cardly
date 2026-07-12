import { Suspense } from 'react';
import { PageShell, PageHeader } from '@/components/dash';
import { SettingsTabs } from '@/components/settings/SettingsTabs';

// ONE settings shell: standard header + a single section tab bar, shared by
// every /settings/* page. Subpages render only their content.
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageShell width="default">
      <PageHeader title="Settings" subtitle="Your account, workspace and billing." />
      {/* SettingsTabs reads ?tab= via useSearchParams → needs a Suspense boundary. */}
      <Suspense fallback={<div style={{ borderBottom: '1px solid #E5E0D4', height: 41 }} />}>
        <SettingsTabs />
      </Suspense>
      <div className="pt-5">{children}</div>
    </PageShell>
  );
}
