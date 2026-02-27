import type { Metadata, Viewport } from 'next';
import { Instrument_Serif, Figtree } from 'next/font/google';
import { Toaster } from 'sonner';
import '@/styles/globals.css';

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument-serif',
  display: 'swap',
});

const figtree = Figtree({
  subsets: ['latin'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'We Off — Travel Planner',
  description: 'Collaborative travel planning dashboard for your next adventure',
};

export const viewport: Viewport = {
  themeColor: '#F8FAFC',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} ${figtree.variable}`}>
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
