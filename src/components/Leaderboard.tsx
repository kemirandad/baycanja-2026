
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useScoresStore } from '@/store/scores-store';
import { participants, cantoCriteria, baileCriteria, users } from '@/lib/data';
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
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

interface ScoreData {
  [criterionId: string]: number;
}

interface FirestoreScoreDoc {
  participantId: string;
  judgeId: string;
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
        <div className="p-4 bg-muted/50">
          <h4 className="text-lg font-semibold mb-2 text-center">
            Desglose de Puntuaciones para {participant.name}
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={participant.judgeScores.filter(s => s.score > 0)}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="judgeUsername" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value: number) => [value.toFixed(2), "Puntaje"]}/>
                <Legend />
                <Bar dataKey="score" name="Puntaje" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
};

const ParticipantRow = ({ participant }: { participant: RankedParticipant }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getPodiumIcon = (rank: number) => {
    const props = { className: 'h-6 w-6' };
    switch (rank) {
      case 1: return <Trophy {...props} color="#FFD700" />;
      case 2: return <Medal {...props} color="#C0C0C0" />;
      case 3: return <Award {...props} color="#CD7F32" />;
      default: return <span className="font-mono text-lg">{rank}</span>;
    }
  };

  return (
    <React.Fragment>
      <TableRow className={participant.rank <= 3 ? 'font-bold bg-secondary/50' : ''}>
        <TableCell className="text-center">
          <div className="flex justify-center items-center gap-2">
            {getPodiumIcon(participant.rank)}
          </div>
        </TableCell>
        <TableCell className="text-lg">{participant.name}</TableCell>
        <TableCell className="text-right text-lg text-primary font-mono">
          {participant.totalScore.toFixed(2)}
        </TableCell>
        <TableCell className="text-center">
          <Button variant="ghost" size="sm" onClick={() => setIsOpen(!isOpen)}>
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
  const router = useRouter();

  useEffect(() => {
    if (!isPublic && _hasHydrated && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, router, isPublic, _hasHydrated]);

  useEffect(() => {
    if (!db) return;
    const q = query(collection(db, "scores"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const scoresData = querySnapshot.docs.map(doc => doc.data() as FirestoreScoreDoc);
      setAllScores(scoresData);
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
        const judgeUsername = users.find(u => u.id === s.judgeId)?.username || 'Desconocido';
        const { judgeId, participantId, ...scores } = s;
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
          <p className="text-lg">No hay participantes en esta categoría.</p>
        </div>
      );
    }

    const qualifiedParticipants = data.filter(p => p.totalScore > 0);

    if (qualifiedParticipants.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg">No hay participantes calificados en esta categoría aún.</p>
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
        <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-8">
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
    <Card>
      <CardContent className="pt-6">
       {showTabs ? (
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-lg mx-auto mb-6">
            {canSeeCanto && <TabsTrigger value="canto"><Mic className="mr-2"/>Canto</TabsTrigger>}
            {canSeeBaile && <TabsTrigger value="baile"><Clapperboard className="mr-2"/>Baile</TabsTrigger>}
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
       )}
      </CardContent>
    </Card>
  );
}
