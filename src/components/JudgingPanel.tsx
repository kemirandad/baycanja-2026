'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cantoCriteria, baileCriteria } from '@/lib/data';
import type { Participant } from '@/lib/types';
import { useScoresStore } from '@/store/scores-store';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, ClipboardCheck, Lock, LoaderCircle } from 'lucide-react';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useRouter } from 'next/navigation';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const generateFormSchema = (participant: Participant) => {
  const criteria = participant.eventType === 'Canto' ? cantoCriteria : baileCriteria;
  const schemaDefinition = criteria.reduce((acc, criterion) => {
    acc[criterion.id] = z.coerce.number().min(0).max(10);
    return acc;
  }, {} as Record<string, z.ZodTypeAny>);
  return z.object(schemaDefinition);
};

type JudgingFormValues = z.infer<ReturnType<typeof generateFormSchema>>;

const saveScoresToFirestore = async (judgeId: string, judgeUsername: string, participantId: string, scores: JudgingFormValues) => {
  if (!db) throw new Error('Firebase no está configurado.');
  const docRef = doc(db, 'scores', `${judgeId}:${participantId}`);
  const dataToSave = {
    ...scores,
    judgeId,
    judgeUsername,
    participantId,
  };
  await setDoc(docRef, dataToSave);
};

const getScoresFromFirestore = async (judgeId: string, participantId: string) => {
  if (!db || !judgeId || !participantId) return null;
  const docRef = doc(db, 'scores', `${judgeId}:${participantId}`);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    // Exclude participantId and judgeId from the form values
    const { participantId: pId, judgeId: jId, ...scores } = data;
    return scores as JudgingFormValues;
  }
  return null;
};

export default function JudgingPanel({
  participant,
}: {
  participant: Participant;
}) {
  const router = useRouter();
  const { currentUser, _hasHydrated } = useScoresStore();
  const { toast } = useToast();
  
  const judgeId = currentUser?.id;
  const canJudge = currentUser && (currentUser.role === 'ADMIN' || (currentUser.role === 'CANTO' && participant.eventType === 'Canto') || (currentUser.role === 'BAILE' && participant.eventType === 'Baile'));
  
  const criteria = participant.eventType === 'Canto' ? cantoCriteria : baileCriteria;
  const formSchema = generateFormSchema(participant);

  const defaultValues = criteria.reduce((acc, criterion) => {
    acc[criterion.id] = 0;
    return acc;
  }, {} as Record<string, number>);

  const form = useForm<JudgingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (judgeId) {
      getScoresFromFirestore(judgeId, participant.id).then(scores => {
        if (scores) {
          form.reset(scores);
        }
      });
    }
  }, [judgeId, participant.id, form]);

  async function onSubmit(data: JudgingFormValues) {
    if (!judgeId || !canJudge) return;

    try {
      await saveScoresToFirestore(judgeId, currentUser.username, participant.id, data);
      toast({
        title: 'Calificación Guardada',
        description: `La calificación de ${currentUser.username} para ${participant.name} ha sido guardada en la base de datos.`,
        action: <CheckCircle className="text-green-500" />,
      });
      // Return to the participant list; the root route is the login screen.
      router.push('/judging');
    } catch (error) {
      console.error('No se pudo guardar la calificación:', error);
      toast({
        title: 'No se pudo guardar',
        description: 'Comprueba tu conexión o los permisos de Firestore y vuelve a intentarlo.',
        variant: 'destructive',
      });
    }
  }
  
  if (!_hasHydrated || !currentUser) {
    return null; // o un spinner de carga
  }

  if (!canJudge) {
    return (
      <Card className="rounded-2xl border-white/80 bg-white/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl tracking-tight">Acceso Denegado</CardTitle>
          <CardDescription>
            No tienes permiso para calificar a este participante.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground bg-muted/50 rounded-lg">
            <Lock className="h-16 w-16 mb-4" />
            <p className="text-lg font-semibold text-center">Tu rol de {currentUser.role.toLowerCase()} solo te permite calificar eventos de {currentUser.role.toLowerCase()}.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border-white/80 bg-white/80 shadow-[0_12px_40px_-26px_rgba(20,35,70,0.3)]">
      <CardHeader className="border-b border-border/60 px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
        <CardTitle className="text-xl font-semibold tracking-[-0.03em]">Panel de evaluación</CardTitle>
        <CardDescription className="mt-1">
          Califica la presentación en una escala de 0 a 10 para cada criterio.
        </CardDescription>
          </div>
        </div>
        <p className="ml-[52px] text-xs font-medium text-muted-foreground">Jurado: {currentUser.username}</p>
      </CardHeader>
      <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
            {criteria.map((criterion) => (
              <FormField
                key={criterion.id}
                control={form.control}
                name={criterion.id as keyof JudgingFormValues}
                render={({ field }) => (
                  <FormItem className="space-y-3 border-b border-border/50 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <FormLabel className="text-base font-semibold tracking-[-0.02em]">
                          {criterion.name}
                        </FormLabel>
                        <FormDescription className="mt-1 text-sm leading-5">{criterion.description}</FormDescription>
                      </div>
                      <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold tabular-nums text-primary">{criterion.weight}%</span>
                    </div>

                    <FormControl>
                      <RadioGroup
                        aria-label={`${criterion.name}, de 0 a 10`}
                        className="flex flex-nowrap gap-1.5 overflow-x-auto pt-1 pb-1"
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                      >
                        {[...Array(11).keys()].map((i) => (
                          <FormItem key={i} className="flex items-center space-x-1 space-y-0">
                            <FormControl>
                              <RadioGroupItem value={String(i)} id={`${field.name}-${i}`} className="sr-only" />
                            </FormControl>
                            <FormLabel htmlFor={`${field.name}-${i}`}>
                              <div
                                className={cn(
                                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-all',
                                  field.value === i
                                    ? 'border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20'
                                    : 'border-border/70 bg-white/80 text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground'
                                )}
                              >
                                {i}
                              </div>
                            </FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" disabled={form.formState.isSubmitting} className="h-12 w-full rounded-xl text-base font-semibold shadow-lg shadow-primary/15">
              {form.formState.isSubmitting ? <><LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Guardando…</> : <><CheckCircle className="mr-2 h-4 w-4" /> Guardar calificación</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
