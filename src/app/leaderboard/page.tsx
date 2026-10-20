import Leaderboard from '@/components/Leaderboard';
import { Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-9 border-b border-black/[0.06] pb-8 sm:mb-12">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Coordinación</p>
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary" />
          <h1 className="text-4xl font-semibold tracking-[-0.055em] text-foreground sm:text-5xl">Tabla de resultados</h1>
        </div>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">Promedios consolidados de las presentaciones.</p>
      </div>
      <Leaderboard />
    </div>
  );
}
