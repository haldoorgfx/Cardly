import AttendingTabs from './AttendingTabs';

// Dashboard-native attendee event tools — logged-in twin of /e/[slug]/*.
// The AppShell provides the outer chrome; this layout adds the per-event
// tool tabs so moving between agenda / messages / networking stays inside
// the dashboard.
export default async function AttendingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10" style={{ maxWidth: 900 }}>
      <AttendingTabs slug={slug} />
      {children}
    </div>
  );
}
