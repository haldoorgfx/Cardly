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
    <div className="max-w-[900px] mx-auto px-5 py-8">
      <AttendingTabs slug={slug} />
      {children}
    </div>
  );
}
