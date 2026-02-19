export default function BrandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: 'var(--font-assistant)' }}>
      {children}
    </div>
  );
}
