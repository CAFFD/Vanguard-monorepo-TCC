import React from 'react';
import { getHealthStyle } from '../lib/health';

interface HealthReasonsProps {
  status: string;
  reasons?: string[];
}

export const HealthReasons: React.FC<HealthReasonsProps> = ({ status, reasons }) => {
  if (!reasons || reasons.length === 0) return null;
  const style = getHealthStyle(status);

  return (
    <div className="rounded-md border border-white/10 bg-zinc-900/40 p-4 mb-8">
      <h3 className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest mb-3">
        Diagnóstico
      </h3>
      <ul className="space-y-2">
        {reasons.map((reason, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-zinc-300">
            <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${style.bullet}`} />
            <span>{reason}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
