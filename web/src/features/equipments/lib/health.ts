export type HealthStatusKey =
  | 'NORMAL'
  | 'ATENCAO'
  | 'CRITICO'
  | 'OFFLINE'
  | 'SEM_LEITURA';

export interface HealthStyle {
  label: string;
  dot: string;
  text: string;
  badge: string;
  bullet: string;
}

// Classes semânticas para garantir contraste WCAG AA tanto em Dark quanto em Light Mode.
const STYLES: Record<HealthStatusKey, HealthStyle> = {
  NORMAL: {
    label: 'NORMAL',
    dot: 'bg-emerald-500',
    text: 'text-[var(--color-status-normal-text)]',
    badge: 'bg-emerald-500/15 border-emerald-500/35',
    bullet: 'bg-emerald-500',
  },
  ATENCAO: {
    label: 'ATENÇÃO',
    dot: 'bg-amber-500',
    text: 'text-[var(--color-status-warning-text)]',
    badge: 'bg-amber-500/15 border-amber-500/35',
    bullet: 'bg-amber-500',
  },
  CRITICO: {
    label: 'CRÍTICO',
    dot: 'bg-red-500',
    text: 'text-[var(--color-status-critical-text)]',
    badge: 'bg-red-500/15 border-red-500/35',
    bullet: 'bg-red-500',
  },
  OFFLINE: {
    label: 'OFFLINE',
    dot: 'bg-zinc-500',
    text: 'text-[var(--color-status-offline-text)]',
    badge: 'bg-zinc-500/15 border-zinc-500/35',
    bullet: 'bg-zinc-500',
  },
  SEM_LEITURA: {
    label: 'SEM LEITURA',
    dot: 'bg-violet-500',
    text: 'text-[var(--color-status-noreading-text)]',
    badge: 'bg-violet-500/15 border-violet-500/35 border-dashed',
    bullet: 'bg-violet-500',
  },
};

/** Normaliza o status da API (com/sem acento, com espaço ou underscore). */
export function normalizeStatus(status: string | null | undefined): HealthStatusKey {
  const key = (status ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, '_');

  return key in STYLES ? (key as HealthStatusKey) : 'OFFLINE';
}

export function getHealthStyle(status: string | null | undefined): HealthStyle {
  return STYLES[normalizeStatus(status)];
}

/** Estados que exigem ação da equipe técnica. */
export function isAtRisk(status: string | null | undefined): boolean {
  const key = normalizeStatus(status);
  return key !== 'NORMAL';
}
