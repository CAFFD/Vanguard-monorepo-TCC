export type UserRole = "GESTOR" | "TECNICO";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
