'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ListOrdered, LogOut, UserRound, Users } from 'lucide-react';
import { useScoresStore } from '@/store/scores-store';
import { Logo } from '@/components/Logo';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, setCurrentUser, _hasHydrated } = useScoresStore();

  const handleLogout = async () => {
    if (auth) await signOut(auth);
    setCurrentUser(null);
    router.push('/');
  };

  if (!_hasHydrated || pathname === '/' || pathname === '/login') return null;

  const isPublic = pathname === '/public-results';
  const isParticipantPath = pathname === '/judging' || pathname.startsWith('/participants/');

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-background/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href={isPublic ? '/' : '/judging'} className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Logo className="h-8 w-8" />
          <span className="text-[15px] font-semibold tracking-[-0.035em] text-foreground">BAYCANJA</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground">2026</span>
        </Link>

        {isPublic ? (
          <span className="hidden text-sm text-muted-foreground sm:inline">Resultados en vivo</span>
        ) : currentUser ? (
          <div className="flex items-center gap-2 sm:gap-5">
            <nav aria-label="Navegación principal" className="flex items-center gap-1 rounded-full bg-secondary/75 p-1">
              <Link
                href="/judging"
                aria-current={isParticipantPath ? 'page' : undefined}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors ${isParticipantPath ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Users className="h-4 w-4" /><span className="hidden sm:inline">Participantes</span>
              </Link>
              <Link
                href="/leaderboard"
                aria-current={pathname === '/leaderboard' ? 'page' : undefined}
                className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors ${pathname === '/leaderboard' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <ListOrdered className="h-4 w-4" /><span className="hidden sm:inline">Resultados</span>
              </Link>
            </nav>

            <div className="hidden items-center gap-2 border-l border-border pl-4 md:flex">
              <UserRound className="h-4 w-4 text-muted-foreground" />
              <span className="max-w-32 truncate text-sm font-medium">{currentUser.username}</span>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
