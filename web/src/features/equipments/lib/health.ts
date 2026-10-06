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

// Classes escritas por extenso para o Tailwind detectá-las no build.
const STYLES: Record<HealthStatusKey, HealthStyle> = {
  NORMAL: {
    label: 'NORMAL',
    dot: 'bg-emerald-500',
    text: 'text-emerald-300',
    badge: 'bg-emerald-500/10 border-emerald-500/20',
    bullet: 'bg-emerald-500',
  },
  ATENCAO: {
    label: 'ATENÇÃO',
    dot: 'bg-amber-500',
    text: 'text-amber-300',
    badge: 'bg-amber-500/10 border-amber-500/20',
    bullet: 'bg-amber-500',
  },
  CRITICO: {
    label: 'CRÍTICO',
    dot: 'bg-red-500',
    text: 'text-red-300',
    badge: 'bg-red-500/10 border-red-500/20',
    bullet: 'bg-red-500',
  },
  OFFLINE: {
    label: 'OFFLINE',
    dot: 'bg-zinc-500',
    text: 'text-zinc-400',
    badge: 'bg-zinc-500/10 border-zinc-500/20',
    bullet: 'bg-zinc-500',
  },
  SEM_LEITURA: {
    label: 'SEM LEITURA',
    dot: 'bg-violet-400',
    text: 'text-violet-300',
    badge: 'bg-violet-500/10 border-violet-500/20 border-dashed',
    bullet: 'bg-violet-400',
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
