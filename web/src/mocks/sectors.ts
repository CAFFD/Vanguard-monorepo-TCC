export interface Sector {
  id: string;
  name: string;
  description: string;
}

export const mockedSectors: Sector[] = [
  { id: "1", name: "Secretaria de Administração", description: "Administração Geral" },
  { id: "2", name: "Secretaria de Educação", description: "Educação Básica" },
  { id: "3", name: "Secretaria de Saúde", description: "Saúde Pública" },
  { id: "4", name: "Secretaria de Finanças", description: "Recursos e Tributos" },
  { id: "5", name: "Departamento de Tecnologia da Informação", description: "TI e Suporte" }
];
