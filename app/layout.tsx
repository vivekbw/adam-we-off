import type { Metadata, Viewport } from 'next';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'We Off — Travel Planner',
  description: 'Collaborative travel planning dashboard for your next adventure',
};

export const viewport: Viewport = {
  themeColor: '#1A2744',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh' }}>{children}</div>
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
              borderRadius: 'var(--radius-md)',
            },
          }}
        />
      </body>
    </html>
  );
}
