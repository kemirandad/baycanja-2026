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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const useHasScores = (judgeId: string | undefined, participantId: string) => {
  const [hasScore, setHasScore] = useState(false);

  useEffect(() => {
    if (!db || !judgeId) {
      setHasScore(false);
      return;
    }
    const firestore = db;
    const checkScore = async () => {
      if (!judgeId || !participantId) return;
      const docRef = doc(firestore, 'scores', `${judgeId}:${participantId}`);
      try {
        const docSnap = await getDoc(docRef);
        setHasScore(docSnap.exists());
      } catch (error) {
        console.warn('No se pudo comprobar si el jurado ya calificó:', error);
        setHasScore(false);
      }
    };
    checkScore();
  }, [judgeId, participantId]);

  return hasScore;
};

export default function Home() {
  const router = useRouter();
  const { currentUser, _hasHydrated } = useScoresStore();

  useEffect(() => {
    if (_hasHydrated && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, _hasHydrated, router]);

  const photoHints = [
    'folk dance', 'rock band', 'singer woman', 'magician stage',
    'public speaking', 'live painting', 'stand up comedy', 'orchestra conductor',
    'ballet dancers', 'dj mixing', 'gospel singer', 'acoustic guitar',
    'modern dance', 'hip hop dance', 'traditional dance', 'dance crew',
    'salsa dancing', 'flamenco dancer', 'group dance', 'contemporary dance'
  ];
  
  const filteredParticipants = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN') {
      return participants;
    }
    const eventType = currentUser.role === 'CANTO' ? 'Canto' : 'Baile';
    return participants.filter(p => p.eventType === eventType);
  }, [currentUser]);

  const ParticipantCard = ({ participant, index }: { participant: Participant, index: number }) => {
    const isGraded = useHasScores(currentUser?.id, participant.id);
    
    return (
      <Card
        className={cn(
          "flex flex-col overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl bg-card/80 backdrop-blur-sm",
          isGraded && "border-green-500 border-2"
        )}
      >
        <CardHeader className="p-0 relative">
          <div className="aspect-video relative">
            <Image
              src={participant.photoUrl}
              alt={`Foto de ${participant.name}`}
              width={600}
              height={400}
              className="object-cover object-top h-full w-full"
              data-ai-hint={photoHints[index % photoHints.length]}
            />
             {isGraded && (
              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 z-10 shadow-lg">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-grow p-6">
          <CardTitle className="text-2xl font-bold mb-2 text-primary">
            {participant.name}
          </CardTitle>
          <CardDescription>{participant.description}</CardDescription>
        </CardContent>
        <CardFooter className="p-6 pt-0">
          <Button asChild className="w-full">
            <Link href={`/participants/${participant.id}`}>
              Evaluar Presentación <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const renderCategoryTabs = (eventType: 'Canto' | 'Baile') => {
    const eventParticipants = filteredParticipants.filter((p) => p.eventType === eventType);
    const renderGrid = (list: Participant[]) => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {list.map((p, i) => <ParticipantCard key={p.id} participant={p} index={i} />)}
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
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-10 bg-transparent border-2 border-primary p-1 rounded-lg">
          <TabsTrigger value="categoryA" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Categoría A</TabsTrigger>
          <TabsTrigger value="categoryB" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md">Categoría B</TabsTrigger>
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
    <div className="container mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h1 className="text-5xl md:text-6xl font-extrabold text-primary mb-3 tracking-tight">
          Participantes de BAYCANJA 2026
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Conoce a los talentosos artistas y oradores que compiten este año.
        </p>
      </div>
      
      {currentUser.role === 'ADMIN' ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto mb-6">
            <TabsTrigger value="canto"><Mic className="mr-2"/>Canto</TabsTrigger>
            <TabsTrigger value="baile"><Clapperboard className="mr-2"/>Baile</TabsTrigger>
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
