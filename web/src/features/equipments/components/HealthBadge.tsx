import React, { useRef, useState } from 'react';
import { getHealthStyle } from '../lib/health';

interface HealthBadgeProps {
  status: string;
  reasons?: string[];
  /** 'dot' = ponto + rótulo simples (tabelas). 'pill' = cápsula com fundo (cabeçalhos). */
  variant?: 'dot' | 'pill';
}

export const HealthBadge: React.FC<HealthBadgeProps> = ({ status, reasons, variant = 'dot' }) => {
  const style = getHealthStyle(status);
  const hasReasons = !!reasons && reasons.length > 0;
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  // Tooltip em posição fixa: não é cortado por containers com overflow-hidden (tabelas).
  const show = () => {
    if (!hasReasons || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left });
  };
  const hide = () => setPos(null);

  const wrapper =
    variant === 'pill'
      ? `inline-flex items-center gap-1.5 px-2.5 py-0.5 border rounded-full ${style.badge}`
      : 'inline-flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]';

  return (
    <div
      ref={ref}
      className={`${wrapper} ${hasReasons ? 'cursor-help' : ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      tabIndex={hasReasons ? 0 : undefined}
      aria-label={hasReasons ? `${style.label}: ${reasons!.join('. ')}` : style.label}
    >
      <span className={`w-2 h-2 rounded-full ${style.dot}`} aria-hidden="true" />
      <span
        className={`font-mono font-medium tracking-wider ${
          variant === 'pill' ? `text-[10px] ${style.text}` : `text-xs ${style.text}`
        }`}
      >
        {style.label}
      </span>

      {hasReasons && pos && (
        <div
          role="tooltip"
          style={{ top: pos.top, left: pos.left }}
          className="fixed z-50 w-72 max-w-[80vw] p-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl pointer-events-none"
        >
          <p className="text-[10px] font-medium text-[var(--color-text-secondary)] uppercase tracking-widest mb-2">
            Motivos
          </p>
          <ul className="space-y-1.5">
            {reasons!.map((reason, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-xs text-[var(--color-text-main)] leading-snug normal-case font-sans"
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${style.bullet}`} />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
