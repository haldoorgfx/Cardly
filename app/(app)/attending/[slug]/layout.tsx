// Dashboard-native attendee event hub — logged-in twin of /e/[slug]/*.
// The AppShell provides the outer chrome; the hub landing (page.tsx) shows the
// ticket, card, and an 8-tool card grid. Individual tool pages render below.
export default async function AttendingLayout({
  children,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  return (
    <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10" style={{ maxWidth: 1100 }}>
      {children}
    </div>
  );
}
