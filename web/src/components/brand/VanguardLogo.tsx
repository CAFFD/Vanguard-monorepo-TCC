import React from 'react';

interface VanguardLogoProps {
  /** 'full' exibe símbolo + wordmark; 'mark' exibe apenas o escudo em V */
  variant?: 'full' | 'mark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: { icon: 22, text: 'text-sm', tagline: 'text-[10px]' },
  md: { icon: 28, text: 'text-base', tagline: 'text-[11px]' },
  lg: { icon: 38, text: 'text-xl', tagline: 'text-xs' },
};

/**
 * Identidade visual oficial do Vanguard.
 * Combina um escudo geométrico em "V" (proteção de ativos) com um pulso de
 * telemetria S.M.A.R.T. ao centro. Adapta-se automaticamente ao Dark e Light Mode
 * usando `currentColor` e variáveis semânticas de tema.
 */
export const VanguardLogo: React.FC<VanguardLogoProps> = ({
  variant = 'full',
  size = 'sm',
  showTagline = false,
  className = '',
}) => {
  const s = SIZE_MAP[size];

  return (
    <div
      className={`inline-flex items-center gap-2.5 select-none text-[var(--color-text-main)] ${className}`}
      aria-label="Vanguard — Gestão Preditiva de Ativos de TI"
    >
      <svg
        width={s.icon}
        height={s.icon}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* Moldura octogonal chanfrada estilo hardware/NOC */}
        <path
          d="M10 3.5H26L32.5 10V26L26 32.5H10L3.5 26V10L10 3.5Z"
          fill="var(--color-surface-elevated)"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="1.5"
        />
        {/* Chevron "V" principal da marca */}
        <path
          d="M9.5 11L18 26.5L26.5 11H22.3L18 19.2L13.7 11H9.5Z"
          fill="currentColor"
        />
        {/* Ponto de telemetria ativa S.M.A.R.T. no ápice superior */}
        <circle
          cx="18"
          cy="9.5"
          r="2.1"
          fill="#10b981"
        />
      </svg>

      {variant === 'full' && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className={`font-semibold tracking-tight text-[var(--color-text-main)] ${s.text}`}>
              Vanguard
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 text-[var(--color-status-normal-text)]">
              SMART
            </span>
          </div>
          {showTagline && (
            <span className={`font-mono text-[var(--color-text-secondary)] mt-1 ${s.tagline}`}>
              Telemetria &amp; Gestão Preditiva de Ativos
            </span>
          )}
        </div>
      )}
    </div>
  );
};

