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
import { LogIn, Tv } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useScoresStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!auth || !db || !isFirebaseConfigured) {
      setError('Firebase Authentication aún no está configurado para BAYCANJA 2026.');
      return;
    }

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
      router.push('/');
    } catch {
      setError('Usuario o contraseña incorrectos. Por favor, inténtelo de nuevo.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]"><div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,rgba(231,72,72,0.1),transparent)]"></div></div>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center space-y-4">
          <CardTitle className="text-4xl font-extrabold tracking-tight text-primary">BAYCANJA</CardTitle>
          <CardDescription className="text-lg">
            Bienvenido. Por favor, inicie sesión.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input 
              id="username" 
              placeholder="Ingrese su usuario" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input 
              id="password" 
              type="password"
              placeholder="Ingrese su contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          {error && <p className="text-sm font-medium text-destructive pt-1">{error}</p>}
        </CardContent>
        <CardFooter>
          <Button onClick={handleLogin} disabled={!isFirebaseConfigured} className="w-full text-lg py-6">
            <LogIn className="mr-2 h-5 w-5"/>
            Iniciar Sesión
          </Button>
        </CardFooter>
      </Card>
      <div className="mt-6 text-center">
        <Button asChild variant="link" className="text-base">
          <Link href="/public-results">
            <Tv className="mr-2 h-4 w-4" />
            Ver Tabla de Resultados Pública
          </Link>
        </Button>
      </div>
    </div>
  );
}
