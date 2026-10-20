'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type JudgeScore = { judgeUsername: string; score: number };

export default function ScoreBreakdownChart({ scores }: { scores: JudgeScore[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={scores.filter((score) => score.score > 0)} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
        <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 5" vertical={false} />
        <XAxis dataKey="judgeUsername" tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
        <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
        <Tooltip formatter={(value: number) => [value.toFixed(2), 'Puntaje']} />
        <Legend />
        <Bar dataKey="score" name="Puntaje" fill="hsl(var(--primary))" radius={[7, 7, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
