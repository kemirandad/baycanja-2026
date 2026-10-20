
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useScoresStore } from '@/store/scores-store';
import { participants, cantoCriteria, baileCriteria } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trophy, Medal, Award, Mic, Clapperboard, RotateCcw, ChevronDown } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from './ui/button';
import React from 'react';
import type { Participant } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { collection, onSnapshot, query, writeBatch, getDocs, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const ScoreBreakdownChart = dynamic(() => import('./ScoreBreakdownChart'), {
  ssr: false,
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-secondary/70" />,
});

interface ScoreData {
  [criterionId: string]: number;
}

interface FirestoreScoreDoc {
  participantId: string;
  judgeId: string;
  judgeUsername?: string;
  [key: string]: any; // scores
}

interface RankedParticipant extends Participant {
  totalScore: number;
  rank: number;
  judgeScores: { judgeUsername: string; score: number }[];
}

const calculateTotalScore = (scores: ScoreData, eventType: 'Canto' | 'Baile'): number => {
  if (!scores) return 0;
  const criteriaList = eventType === 'Canto' ? cantoCriteria : baileCriteria;
  const totalScore = criteriaList.reduce((total, criterion) => {
    const scoreValue = scores[criterion.id];
    if (typeof scoreValue === 'number') {
      return total + (scoreValue * (criterion.weight / 100));
    }
    return total;
  }, 0);
  return totalScore * 10;
};


const DetailsRow = ({ participant }: { participant: RankedParticipant }) => {
  return (
    <TableRow>
      <TableCell colSpan={4} className="p-0">
        <div className="bg-background/70 p-5 sm:p-7">
          <h4 className="mb-4 text-center text-base font-semibold tracking-tight">
            Desglose de Puntuaciones para {participant.name}
          </h4>
          <div className="h-64 w-full rounded-2xl border border-border/60 bg-white p-4">
            <ScoreBreakdownChart scores={participant.judgeScores} />
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

const ParticipantRow = ({ participant }: { participant: RankedParticipant }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getPodiumIcon = (rank: number) => {
    const props = { className: 'h-5 w-5' };
    switch (rank) {
      case 1: return <Trophy {...props} color="#FFD700" />;
      case 2: return <Medal {...props} color="#C0C0C0" />;
      case 3: return <Award {...props} color="#CD7F32" />;
      default: return <span className="font-mono text-lg">{rank}</span>;
    }
  };

  return (
    <React.Fragment>
      <TableRow className={participant.rank <= 3 ? 'bg-primary/[0.035]' : ''}>
        <TableCell className="text-center font-semibold tabular-nums">
          <div className="flex justify-center items-center gap-2">
            {getPodiumIcon(participant.rank)}
          </div>
        </TableCell>
        <TableCell className="py-4 text-sm font-medium sm:text-base">{participant.name}</TableCell>
        <TableCell className="text-right font-mono text-base font-semibold tabular-nums text-primary sm:text-lg">
          {participant.totalScore.toFixed(2)}
        </TableCell>
        <TableCell className="text-center">
          <Button variant="ghost" size="sm" aria-label={`Ver detalle de ${participant.name}`} aria-expanded={isOpen} onClick={() => setIsOpen(!isOpen)}>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </TableCell>
      </TableRow>
      {isOpen && <DetailsRow participant={participant} />}
    </React.Fragment>
  );
};

export default function Leaderboard({ isPublic = false }: { isPublic?: boolean }) {
  const { currentUser, _hasHydrated } = useScoresStore();
  const [allScores, setAllScores] = useState<FirestoreScoreDoc[]>([]);
  const [isLoadingScores, setIsLoadingScores] = useState(true);
  const [scoresError, setScoresError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!isPublic && _hasHydrated && !currentUser) {
      router.push('/');
    }
  }, [currentUser, router, isPublic, _hasHydrated]);

  useEffect(() => {
    if (!db) {
      setIsLoadingScores(false);
      return;
    }
    const q = query(collection(db, "scores"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const scoresData = querySnapshot.docs.map(doc => doc.data() as FirestoreScoreDoc);
      setAllScores(scoresData);
      setScoresError(null);
      setIsLoadingScores(false);
    }, (error) => {
      console.warn('No se pudieron cargar las puntuaciones de Firebase:', error);
      setScoresError(error.code === 'permission-denied'
        ? 'Firebase rechazó la lectura de puntuaciones. Hay que habilitar la lectura de la colección “scores” en las reglas de Firestore.'
        : 'No se pudieron cargar las puntuaciones. Comprueba la conexión con Firebase e inténtalo de nuevo.');
      setIsLoadingScores(false);
    });

    return () => unsubscribe();
  }, []);

  const rankedParticipants = useMemo(() => {
    const scoresByParticipant = allScores.reduce((acc, scoreDoc) => {
      const { participantId } = scoreDoc;
      if (!acc[participantId]) {
        acc[participantId] = [];
      }
      acc[participantId].push(scoreDoc);
      return acc;
    }, {} as Record<string, FirestoreScoreDoc[]>);
  
    const averagedParticipants = participants.map((participant) => {
      const participantScoreDocs = scoresByParticipant[participant.id] || [];
      const judgeScores = participantScoreDocs.map(s => {
        const judgeUsername = s.judgeUsername || 'Jurado';
        const { judgeId, participantId, judgeUsername: _judgeUsername, ...scores } = s;
        return {
          judgeUsername,
          score: calculateTotalScore(scores, participant.eventType),
        };
      });
  
      const totalAverageScore = judgeScores.length > 0
        ? judgeScores.reduce((acc, s) => acc + s.score, 0) / judgeScores.length
        : 0;
  
      return {
        ...participant,
        totalScore: totalAverageScore,
        judgeScores,
      };
    });
  
    const rankParticipants = (list: typeof averagedParticipants): RankedParticipant[] => {
      const sorted = [...list].sort((a, b) => b.totalScore - a.totalScore);
      return sorted.map((p, index) => ({
        ...p,
        rank: index + 1,
      }));
    };
  
    const cantoA = rankParticipants(averagedParticipants.filter(p => p.eventType === 'Canto' && p.category === 'A'));
    const cantoB = rankParticipants(averagedParticipants.filter(p => p.eventType === 'Canto' && p.category === 'B'));
    const baile = rankParticipants(averagedParticipants.filter(p => p.eventType === 'Baile'));
  
    return {cantoA, cantoB, baile};
  }, [allScores]);

  const resetScoresForEvent = async (eventType: 'Canto' | 'Baile') => {
    if (!db) return;
    const participantIdsToReset = participants
      .filter(p => p.eventType === eventType)
      .map(p => p.id);
  
    if (participantIdsToReset.length === 0) return;
  
    const scoresCollection = collection(db, "scores");
    // Firestore `where in` queries support up to 30 items. 
    // Chunking is needed if you have more than 30 participants per event type.
    const q = query(scoresCollection, where('participantId', 'in', participantIdsToReset));
    
    try {
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        console.log(`No scores found for event ${eventType} to reset.`);
        return;
      }
      const batch = writeBatch(db);
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
  
      await batch.commit();
      console.log(`Successfully reset scores for ${eventType}`);
    } catch (error) {
      console.error("Error resetting scores: ", error);
    }
  };

  const renderLeaderboardTable = (data: RankedParticipant[]) => {    
    if (data.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-base">No hay participantes en esta categoría.</p>
        </div>
      );
    }

    const qualifiedParticipants = data.filter(p => p.totalScore > 0);

    if (qualifiedParticipants.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-base">Aún no hay calificaciones para esta categoría.</p>
            </div>
          );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px] text-center">Puesto</TableHead>
            <TableHead>Participante</TableHead>
            <TableHead className="text-right">Promedio Final</TableHead>
            <TableHead className="w-[100px] text-center">Detalles</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {qualifiedParticipants
            .sort((a, b) => a.rank - b.rank)
            .map((p) => <ParticipantRow key={p.id} participant={p} />
          )}
        </TableBody>
      </Table>
    );
  };

  const renderCategoryTabs = (eventType: 'Canto' | 'Baile') => {
    if (eventType === 'Baile') {
      return (
        <div>
          {renderLeaderboardTable(rankedParticipants.baile)}
          {currentUser?.role === 'ADMIN' && !isPublic && (
            <div className="mt-8 text-center">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reiniciar Puntuaciones de Baile
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción borrará permanentemente todas las puntuaciones para el evento de Baile. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => resetScoresForEvent('Baile')}>Continuar</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      );
    }

    const dataA = rankedParticipants.cantoA;
    const dataB = rankedParticipants.cantoB;

    return (
      <Tabs defaultValue="categoryA" className="w-full">
        <TabsList className="mx-auto mb-8 grid h-11 w-full max-w-md grid-cols-2 rounded-full border border-border/70 bg-white/60 p-1 shadow-sm">
          <TabsTrigger value="categoryA">Categoría A</TabsTrigger>
          <TabsTrigger value="categoryB">Categoría B</TabsTrigger>
        </TabsList>
        <TabsContent value="categoryA">
          {renderLeaderboardTable(dataA)}
        </TabsContent>
        <TabsContent value="categoryB">
          {renderLeaderboardTable(dataB)}
        </TabsContent>
        {currentUser?.role === 'ADMIN' && !isPublic && (
           <div className="mt-8 text-center">
           <AlertDialog>
             <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Reiniciar Puntuaciones de {eventType}
                </Button>
             </AlertDialogTrigger>
             <AlertDialogContent>
               <AlertDialogHeader>
                 <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                 <AlertDialogDescription>
                    Esta acción borrará permanentemente todas las puntuaciones para el evento de {eventType}. Esta acción no se puede deshacer.
                 </AlertDialogDescription>
               </AlertDialogHeader>
               <AlertDialogFooter>
                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                 <AlertDialogAction onClick={() => resetScoresForEvent(eventType)}>Continuar</AlertDialogAction>
               </AlertDialogFooter>
             </AlertDialogContent>
           </AlertDialog>
         </div>
        )}
      </Tabs>
    );
  };

  if (!_hasHydrated || (!isPublic && !currentUser)) {
    return null;
  }
  
  const canSeeCanto = isPublic || currentUser?.role === 'ADMIN' || currentUser?.role === 'CANTO';
  const canSeeBaile = isPublic || currentUser?.role === 'ADMIN' || currentUser?.role === 'BAILE';
  const defaultTab = canSeeCanto ? 'canto' : 'baile';

  const showTabs = isPublic || currentUser?.role === 'ADMIN';

  return (
    <Card className="overflow-hidden rounded-2xl border-white/80 bg-white/80 shadow-[0_12px_40px_-26px_rgba(20,35,70,0.3)]">
      <CardContent className="p-4 sm:p-7">
       {isLoadingScores ? (
        <div role="status" aria-label="Cargando resultados" className="space-y-3 py-3">
          {[0, 1, 2, 3, 4].map((row) => <div key={row} className="h-14 animate-pulse rounded-xl bg-secondary/70" />)}
        </div>
       ) : <>
       {scoresError && (
        <div role="alert" className="mb-6 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {scoresError}
        </div>
       )}
       {!scoresError && (showTabs ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mx-auto mb-7 grid h-12 w-full max-w-sm grid-cols-2 rounded-full border border-border/70 bg-secondary/70 p-1 shadow-sm">
            {canSeeCanto && <TabsTrigger value="canto" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Mic className="mr-2 h-4 w-4"/>Canto</TabsTrigger>}
            {canSeeBaile && <TabsTrigger value="baile" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-foreground data-[state=active]:shadow-sm"><Clapperboard className="mr-2 h-4 w-4"/>Baile</TabsTrigger>}
          </TabsList>
          {canSeeCanto && <TabsContent value="canto">
            {renderCategoryTabs('Canto')}
          </TabsContent>}
          {canSeeBaile && <TabsContent value="baile">
            {renderCategoryTabs('Baile')}
          </TabsContent>}
        </Tabs>
         ) : (
          <>
            {canSeeCanto && renderCategoryTabs('Canto')}
            {canSeeBaile && renderCategoryTabs('Baile')}
          </>
       ))}
       </>}
      </CardContent>
    </Card>
  );
}
