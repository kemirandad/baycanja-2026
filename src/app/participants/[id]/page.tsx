import Image from 'next/image';
import { participants } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import JudgingPanel from '@/components/JudgingPanel';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function generateStaticParams() {
  return participants.map((p) => ({ id: p.id }));
}

export default async function ParticipantPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const participant = participants.find((p) => p.id === id);

  if (!participant) {
    notFound();
  }

  const photoHints = [
    'folk dance',
    'rock band',
    'singer woman',
    'magician stage',
    'public speaking',
    'live painting',
    'stand up comedy',
    'orchestra conductor',
    'ballet dancers',
    'dj mixing',
    'gospel singer',
    'acoustic guitar',
  ];
  const participantIndex = participants.findIndex((p) => p.id === id);
  const hint = photoHints[participantIndex % photoHints.length] || 'person';

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
      <Link href="/judging" className="mb-7 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/80 hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a participantes
      </Link>
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <div>
          <Card className="overflow-hidden rounded-2xl border-white/80 bg-white/80 shadow-sm lg:sticky lg:top-24">
            <CardHeader className="p-0">
              <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-blue-100 via-indigo-50 to-orange-100">
                <Image
                  src={participant.photoUrl}
                  alt={`Foto de ${participant.name}`}
                  width={600}
                  height={450}
                  className="h-full w-full object-cover object-top"
                  data-ai-hint={hint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 sm:p-7">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{participant.eventType}</span>
                {participant.category && <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground">Categoría {participant.category}</span>}
              </div>
              <CardTitle className="mb-2 text-2xl font-semibold tracking-[-0.04em] sm:text-3xl">
                {participant.name}
              </CardTitle>
              <CardDescription className="text-sm leading-6 sm:text-base">
                {participant.longDescription}
              </CardDescription>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-3">
          <JudgingPanel participant={participant} />
        </div>
      </div>
    </div>
  );
}
