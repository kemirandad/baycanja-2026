import Image from 'next/image';
import { participants } from '@/lib/data';
import { notFound } from 'next/navigation';
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
    <div className="container mx-auto py-8 px-4">
      <div className="grid md:grid-cols-5 gap-8">
        <div className="md:col-span-2">
          <Card className="overflow-hidden sticky top-24">
            <CardHeader className="p-0">
              <div className="aspect-w-4 aspect-h-3 relative">
                <Image
                  src={participant.photoUrl}
                  alt={`Foto de ${participant.name}`}
                  width={600}
                  height={450}
                  className="object-cover object-top h-full w-full"
                  data-ai-hint={hint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <CardTitle className="text-3xl font-bold mb-2">
                {participant.name}
              </CardTitle>
              <CardDescription className="text-base">
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
