export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#FAF6EE', minHeight: '100vh' }}>
      <main>{children}</main>
    </div>
  );
}
