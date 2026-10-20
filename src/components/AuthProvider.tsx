'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useScoresStore } from '@/store/scores-store';

const validRoles = ['ADMIN', 'CANTO', 'BAILE'] as const;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setCurrentUser, setHasHydrated } = useScoresStore();

  useEffect(() => {
    if (!auth || !db) {
      setCurrentUser(null);
      setHasHydrated(true);
      return;
    }
    const firestore = db;

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null);
        setHasHydrated(true);
        return;
      }

      try {
        const profileSnapshot = await getDoc(doc(firestore, 'userRoles', firebaseUser.uid));
        const role = profileSnapshot.data()?.role;
        const username = profileSnapshot.data()?.username;

        if (typeof role !== 'string' || !validRoles.includes(role as (typeof validRoles)[number]) || typeof username !== 'string') {
          setCurrentUser(null);
        } else {
          setCurrentUser({ id: firebaseUser.uid, username, role: role as (typeof validRoles)[number] });
        }
      } catch (error) {
        console.error('No se pudo validar el perfil de Firebase Authentication:', error);
        setCurrentUser(null);
      } finally {
        setHasHydrated(true);
      }
    });
  }, [setCurrentUser, setHasHydrated]);

  return children;
}
