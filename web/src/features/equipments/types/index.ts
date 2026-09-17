export type HealthStatus =
  | "NORMAL"
  | "ATENCAO"
  | "CRITICO"
  | "SEM_COMUNICACAO"
  | "INATIVO";

export interface Equipment {
  id: string;
  sectorId: string;
  macAddress: string;
  patrimonyTag: string;
  hostname: string;
  healthStatus: HealthStatus;
}
