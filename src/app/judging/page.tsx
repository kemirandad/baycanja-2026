'use client';

import Link from 'next/link';
import Image from 'next/image';
import { participants } from '@/lib/data';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Mic, Clapperboard, CheckCircle2, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { useScoresStore } from '@/store/scores-store';
import { useEffect, useMemo, useState } from 'react';
import type { Participant } from '@/lib/types';
import { cn } from '@/lib/utils';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const photoHints = [
  'folk dance', 'rock band', 'singer woman', 'magician stage',
  'public speaking', 'live painting', 'stand up comedy', 'orchestra conductor',
  'ballet dancers', 'dj mixing', 'gospel singer', 'acoustic guitar',
  'modern dance', 'hip hop dance', 'traditional dance', 'dance crew',
  'salsa dancing', 'flamenco dancer', 'group dance', 'contemporary dance'
];

function ParticipantCard({ participant, index, isGraded }: { participant: Participant, index: number, isGraded: boolean }) {
  return (
    <Card className={cn(
      "group flex flex-col overflow-hidden rounded-2xl border-white/80 bg-white/75 shadow-[0_8px_28px_-18px_rgba(20,35,70,0.25)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_18px_42px_-20px_rgba(20,35,70,0.3)]",
      isGraded && "ring-1 ring-emerald-500/35"
    )}>
      <CardHeader className="relative p-0">
        <div className="relative aspect-video">
          <Image
            src={participant.photoUrl}
            alt={`Foto de ${participant.name}`}
            width={600}
            height={400}
            className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.025]"
            data-ai-hint={photoHints[index % photoHints.length]}
          />
          {isGraded && <div className="absolute right-3 top-3 z-10 rounded-full border border-white/70 bg-white/90 p-2 text-emerald-600 shadow-sm backdrop-blur"><CheckCircle2 className="h-4 w-4" /></div>}
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-6">
        <CardTitle className="mb-2 text-xl font-semibold tracking-[-0.03em] text-foreground">{participant.name}</CardTitle>
        <CardDescription className="leading-6">{participant.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-6 pt-0">
        <Button asChild className="h-11 w-full rounded-xl font-semibold shadow-sm transition-transform group-hover:translate-y-[-1px]">
          <Link href={`/participants/${participant.id}`}>Evaluar presentación <ArrowRight className="ml-2 h-4 w-4" /></Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function Home() {
  const router = useRouter();
  const { currentUser, _hasHydrated } = useScoresStore();
  const [gradedParticipantIds, setGradedParticipantIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const judgeId = currentUser?.id;
    if (!db || !judgeId) {
      setGradedParticipantIds(new Set());
      return;
    }

    let isMounted = true;
    getDocs(query(collection(db, 'scores'), where('judgeId', '==', judgeId)))
      .then((snapshot) => {
        if (isMounted) {
          setGradedParticipantIds(new Set(snapshot.docs.map((score) => score.data().participantId as string)));
        }
      })
      .catch((error) => console.warn('No se pudieron cargar las calificaciones del jurado:', error));

    return () => { isMounted = false; };
  }, [currentUser?.id]);

  useEffect(() => {
    if (_hasHydrated && !currentUser) {
      router.push('/');
    }
  }, [currentUser, _hasHydrated, router]);

  const filteredParticipants = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') {
      return participants;
    }
    const eventType = currentUser.role === 'CANTO' ? 'Canto' : 'Baile';
    return participants.filter(p => p.eventType === eventType);
  }, [currentUser]);

  const renderCategoryTabs = (eventType: 'Canto' | 'Baile') => {
    const eventParticipants = filteredParticipants.filter((p) => p.eventType === eventType);
    const renderGrid = (list: Participant[]) => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {list.map((p, i) => <ParticipantCard key={p.id} participant={p} index={i} isGraded={gradedParticipantIds.has(p.id)} />)}
      </div>
    );

    if (eventType === 'Baile') {
      return eventParticipants.length ? renderGrid(eventParticipants) : null;
    }

    const participantsA = filteredParticipants.filter((p) => p.eventType === eventType && p.category === 'A');
    const participantsB = filteredParticipants.filter((p) => p.eventType === eventType && p.category === 'B');

    if (participantsA.length === 0 && participantsB.length === 0) {
      return null;
    }

    return (
      <Tabs defaultValue="categoryA" className="w-full">
        <TabsList className="mx-auto mb-8 grid h-12 w-full max-w-md grid-cols-2 rounded-full border border-border/70 bg-white/60 p-1 shadow-sm">
          <TabsTrigger value="categoryA" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Categoría A</TabsTrigger>
          <TabsTrigger value="categoryB" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm">Categoría B</TabsTrigger>
        </TabsList>
        <TabsContent value="categoryA">
          {renderGrid(participantsA)}
        </TabsContent>
        <TabsContent value="categoryB">
          {renderGrid(participantsB)}
        </TabsContent>
      </Tabs>
    );
  }

  if (!_hasHydrated || !currentUser) {
    return null; // O un spinner de carga
  }
  
  const canSeeCanto = currentUser.role === 'ADMIN' || currentUser.role === 'CANTO';
  const canSeeBaile = currentUser.role === 'ADMIN' || currentUser.role === 'BAILE';
  const defaultTab = canSeeCanto ? 'canto' : 'baile';

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-10 flex flex-col gap-5 border-b border-black/[0.06] pb-8 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Festival de talentos · 2026</p>
        <h1 className="text-4xl font-semibold tracking-[-0.055em] text-foreground sm:text-5xl">
          Participantes
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
          Conoce a quienes subirán al escenario este año.
        </p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-white/70 px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> 36 participantes
        </div>
      </div>
      
      {currentUser.role === 'ADMIN' ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-8 grid h-12 w-full max-w-sm grid-cols-2 rounded-full border border-border/70 bg-white/60 p-1 shadow-sm">
            <TabsTrigger value="canto" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Mic className="mr-2 h-4 w-4"/>Canto</TabsTrigger>
            <TabsTrigger value="baile" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Clapperboard className="mr-2 h-4 w-4"/>Baile</TabsTrigger>
          </TabsList>
          <TabsContent value="canto">
            {renderCategoryTabs('Canto')}
          </TabsContent>
          <TabsContent value="baile">
            {renderCategoryTabs('Baile')}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          {canSeeCanto && renderCategoryTabs('Canto')}
          {canSeeBaile && renderCategoryTabs('Baile')}
        </>
      )}
    </div>
  );
}
