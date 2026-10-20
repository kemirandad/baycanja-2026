
'use client';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/Logo';

export function Footer() {
  const pathname = usePathname();
  if (pathname === '/' || pathname === '/login' || pathname === '/public-results') {
    return null;
  }
  return (
    <footer className="bg-secondary text-secondary-foreground mt-16">
      <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Logo className="h-6 w-6" />
          <span className="font-bold text-lg">BAYCANJA</span>
        </div>
        <div className="flex flex-col items-center sm:items-end text-center sm:text-right">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Evento BAYCANJA. Todos los derechos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Plataforma de calificación con ❤️.
          </p>
        </div>
      </div>
    </footer>
  );
}
