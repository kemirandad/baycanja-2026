'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useScoresStore } from '@/store/scores-store';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, authEmailForUsername, db, isFirebaseConfigured } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ArrowRight, LockKeyhole, Sparkles, Tv } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useScoresStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!auth || !db || !isFirebaseConfigured) {
      setError('Firebase Authentication aún no está configurado para BAYCANJA 2026.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const credential = await signInWithEmailAndPassword(auth, authEmailForUsername(username), password);
      const profile = await getDoc(doc(db, 'userRoles', credential.user.uid));
      const role = profile.data()?.role;
      const claimedUsername = profile.data()?.username;
      if (!profile.exists() || typeof role !== 'string' || !['ADMIN', 'CANTO', 'BAILE'].includes(role) || typeof claimedUsername !== 'string') {
        await signOut(auth);
        setError('La cuenta no tiene un rol autorizado. Contacta al administrador.');
        return;
      }

      setError('');
      setCurrentUser({ id: credential.user.uid, username: claimedUsername, role: role as 'ADMIN' | 'CANTO' | 'BAILE' });
      router.push('/judging');
    } catch {
      setError('Usuario o contraseña incorrectos. Por favor, inténtelo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative isolate min-h-[100svh] overflow-hidden px-5 py-8 sm:px-8 lg:px-12">
      <div aria-hidden="true" className="pointer-events-none absolute -left-48 top-[-14rem] -z-10 h-[38rem] w-[38rem] rounded-full bg-blue-200/35 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-72 right-[-10rem] -z-10 h-[42rem] w-[42rem] rounded-full bg-orange-200/35 blur-3xl" />

      <div className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-12 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        <section className="mx-auto w-full max-w-xl lg:mx-0">
          <div className="mb-9 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3.5 py-2 text-xs font-semibold tracking-[0.12em] text-primary shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> FESTIVAL DE TALENTOS · 2026
          </div>
          <div className="mb-5 flex items-center gap-3">
            <Logo className="h-11 w-11" />
            <span className="text-sm font-bold tracking-[0.22em] text-muted-foreground">BAYCANJA</span>
          </div>
          <h1 className="max-w-xl text-5xl font-semibold leading-[1.03] tracking-[-0.065em] text-foreground sm:text-6xl lg:text-[4.5rem]">
            Una noche.<br />
            <span className="text-primary">36 historias</span><br />
            por descubrir.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-muted-foreground sm:text-xl">
            El escenario está listo. Acompaña y celebra el talento de quienes hacen de BAYCANJA algo inolvidable.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/80 bg-white/60 px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm">25 voces</span>
            <span className="rounded-full border border-white/80 bg-white/60 px-4 py-2 text-sm font-medium text-foreground/80 shadow-sm">11 grupos de baile</span>
          </div>
          <div className="mt-14 hidden items-center gap-3 text-sm text-muted-foreground lg:flex">
            <span className="h-px w-10 bg-primary/40" />
            Una experiencia para reconocer el talento local
          </div>
        </section>

        <section className="mx-auto w-full max-w-md">
          <Card className="overflow-hidden rounded-[1.75rem] border-white/80 bg-white/80 shadow-[0_24px_80px_-32px_rgba(25,43,80,0.28)] backdrop-blur-xl">
            <CardHeader className="space-y-3 px-7 pb-5 pt-8 sm:px-9 sm:pt-10">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <CardTitle className="text-3xl font-semibold tracking-[-0.045em]">Bienvenido</CardTitle>
              <CardDescription className="text-base leading-6">Inicia sesión para continuar al portal de evaluación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 px-7 sm:px-9">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">Usuario</Label>
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="Tu usuario"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-12 rounded-xl border-border/80 bg-white/80 px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  className="h-12 rounded-xl border-border/80 bg-white/80 px-4"
                />
              </div>
              {error && <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex-col gap-4 px-7 pb-8 pt-6 sm:px-9 sm:pb-10">
              <Button onClick={handleLogin} disabled={!isFirebaseConfigured || isSubmitting} className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/15 transition-transform hover:-translate-y-0.5">
                {isSubmitting ? 'Verificando acceso…' : <>Ingresar al portal <ArrowRight className="ml-1 h-4 w-4" /></>}
              </Button>
              <p className="text-center text-xs text-muted-foreground">Acceso seguro para jurados y coordinación</p>
            </CardFooter>
          </Card>

          <div className="mt-5 rounded-2xl border border-white/75 bg-white/55 px-5 py-4 text-center backdrop-blur">
            <p className="mb-1 text-sm font-medium text-foreground">¿Solo vienes a disfrutar los resultados?</p>
            <Button asChild variant="link" className="h-auto p-0 text-sm font-semibold text-primary">
              <Link href="/public-results"><Tv className="mr-2 h-4 w-4" /> Ver tabla pública</Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
