'use client';

import Leaderboard from '@/components/Leaderboard';
import { Radio } from 'lucide-react';

export default function PublicResultsPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
      <div className="mb-9 flex flex-col gap-4 border-b border-black/[0.06] pb-8 sm:mb-12 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">BAYCANJA · 2026</p>
          <h1 className="text-4xl font-semibold tracking-[-0.055em] text-foreground sm:text-5xl">Resultados en vivo</h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">La emoción del escenario, en tiempo real.</p>
        </div>
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200/70 bg-emerald-50/80 px-3.5 py-2 text-sm font-medium text-emerald-800">
          <Radio className="h-4 w-4" /> Actualización automática
        </div>
      </div>
      <Leaderboard isPublic={true} />
    </div>
  );
}
