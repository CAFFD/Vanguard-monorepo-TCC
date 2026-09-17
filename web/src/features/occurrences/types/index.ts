export type OccurrenceOrigin =
  | "SOLICITACAO_USUARIO"
  | "IDENTIFICACAO_TECNICA"
  | "TELEMETRIA";

export type OccurrencePriority =
  | "BAIXA"
  | "MEDIA"
  | "ALTA"
  | "CRITICA";

export interface Occurrence {
  id: string;
  equipmentId: string;
  technicianId: string;
  createdAt: string;
  origin: OccurrenceOrigin;
  priority: OccurrencePriority;
  description: string;
  diagnosis: string | null;
  actionTaken: string | null;
  closureDate: string | null;
}
