import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { AuthProvider } from '@/components/AuthProvider';
import { Footer } from '@/components/Footer';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'BAYCANJA 2026 · Festival de talentos',
  description: 'Celebra, acompaña y descubre el talento en BAYCANJA 2026.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" rx="30" fill="#E74848"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="90" font-weight="bold" fill="#ffffff" font-family="sans-serif">SFJ</text></svg>`;
  const faviconDataUri = `data:image/svg+xml;base64,${btoa(faviconSvg)}`;

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="icon" href={faviconDataUri} />
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased flex flex-col')}>
        <AuthProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
