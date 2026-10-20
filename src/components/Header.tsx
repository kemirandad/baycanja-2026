
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Users, ListOrdered, User, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
    router.push('/login');
  };

  const navItems = [
    { href: '/judging', label: 'Participantes', icon: Users },
    { href: '/leaderboard', label: 'Resultados', icon: ListOrdered },
  ];
  
  if (!_hasHydrated) {
    return (
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
        <div className="container flex h-20 items-center" />
      </header>
    );
  }

  if (pathname === '/' || pathname === '/login') {
    return null;
  }
  
  if (pathname === '/public-results') {
    return (
       <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
         <div className="container flex h-20 items-center justify-center">
          <Link href="/login" className="flex items-center space-x-3">
              <Logo className="h-8 w-8" />
              <span className="text-2xl font-bold tracking-tight">BAYCANJA</span>
          </Link>
         </div>
       </header>
    )
  }
  
  if (!currentUser) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="container flex h-20 items-center">
        <div className="grid grid-cols-3 items-center w-full">
          {/* Left Section */}
          <div className="flex justify-start items-center">
            <Link href="/" className="flex items-center space-x-3">
              <Logo className="h-8 w-8" />
              <span className="hidden sm:inline-block text-2xl font-bold tracking-tight">BAYCANJA</span>
            </Link>
          </div>
          
          {/* Center Section (Desktop Nav) */}
          <nav className="hidden md:flex justify-self-center items-center gap-2">
            {navItems.map((item) => (
              <Button
                asChild
                variant="link"
                key={item.href}
                className={cn(
                  'text-lg text-muted-foreground transition-colors hover:text-primary',
                  pathname === item.href && 'text-primary font-bold'
                )}
              >
                <Link href={item.href}>{item.label}</Link>
              </Button>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex justify-end items-center gap-4">
              {/* Desktop user info */}
              <div className="hidden md:flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold">{currentUser?.username}</span>
              </div>
              <div className="hidden md:block">
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir
                </Button>
              </div>

              {/* Mobile Nav and Logout */}
              <div className="flex md:hidden items-center">
                {navItems.map((item) => (
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    key={item.href}
                    className={cn('ml-1', pathname === item.href && 'bg-accent')}
                  >
                    <Link href={item.href} aria-label={item.label}>
                      <item.icon className="h-5 w-5" />
                    </Link>
                  </Button>
                ))}
                <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-2">
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
          </div>
        </div>
      </div>
    </header>
  );
}
