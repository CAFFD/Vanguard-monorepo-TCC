# Gestão de Ativos - Frontend Inicial

Este repositório contém a versão inicial do frontend para o sistema "Gestão de Ativos" da Prefeitura. O objetivo desta entrega é estabelecer a base da interface administrativa focando nas telas de **Cadastro de Usuário** e **Cadastro de Equipamento**.

## Tecnologias Utilizadas

- **React 19**
- **TypeScript**
- **Vite**
- **React Router** para roteamento
- **React Hook Form** + **Zod** para formulários e validações
- **Tailwind CSS v4** para estilização
- **Lucide React** para ícones

## Como Instalar e Executar

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Execute o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

3. O projeto estará disponível no navegador (por padrão em http://localhost:5173).

## Como Gerar o Build

Para compilar o projeto para produção e checar as tipagens:

```bash
npm run build
```

*(O comando acima executa `tsc -b && vite build`)*

## Estrutura do Projeto

```text
src/
  app/          # Configuração global (App e Router)
  components/   # Componentes visuais isolados (layout, forms, ui, feedback)
  features/     # Divisão por domínio de negócio
    users/      # Componentes, schemas, tipos e páginas de usuários
    equipments/ # Componentes, schemas, tipos e páginas de equipamentos
    sectors/    # Componentes, schemas, tipos e páginas de setores
    occurrences/# Componentes, schemas, tipos e páginas de chamados
  mocks/        # Dados simulados (setores)
  services/     # Integração com APIs externas (atualmente mock no localStorage)
  styles/       # CSS global e tokens de tema
```

## Rotas Disponíveis

- `/usuarios/cadastrar`: Tela de cadastro de profissionais.
- `/equipamentos/cadastrar`: Tela de registro e vinculação de ativos aos setores.
- `/setores/cadastrar`: Tela de cadastro de novos setores (integração dinâmica com equipamentos).
- `/chamados/cadastrar`: Tela de abertura de chamados técnicos.
- `/`: Redireciona automaticamente para `/usuarios/cadastrar`.

## Dados Simulados e Armazenamento (StorageService)

Para fins de testes desta versão, os dados (usuários, equipamentos, setores e chamados) são manipulados no serviço `src/services/storage.ts`.
Este arquivo atua como um repositório temporário usando o `localStorage` do navegador.

- **Setores (`mockedSectors`)**: A lista de setores agora é inicializada a partir de uma base mock se vazia, mas permite adição pelo usuário. Os novos setores cadastrados aparecem dinamicamente no formulário de equipamentos.
- **Chamados (Occurrences)**: Relacionam equipamentos e técnicos (precisa que ambos existam no sistema). Campos iniciais de atendimento (`diagnosis`, `actionTaken`, etc) são definidos para nulo automaticamente durante a criação.
- **Validações de Duplicidade**: O `StorageService` verifica se há um e-mail idêntico, MAC/Hostname/Patrimônio duplicado ou Nome de Setor já existente antes de salvar.

## Preparação para o Backend (Fastify)

A comunicação com a futura API Fastify foi abstraída.
Para integrar o backend, vá até `src/services/storage.ts` e altere os métodos para chamadas HTTP correspondentes:

- `POST /users` (usuários)
- `POST /equipments` (equipamentos)
- `POST /sectors` e `GET /sectors` (setores)
- `POST /occurrences` (chamados)

Como os componentes interagem exclusivamente com este serviço e baseiam-se em contratos tipados estritos (Zod), **nenhuma refatoração nas telas será necessária**.

## Limitações Atuais (Fora do Escopo)

- A aplicação **não** se comunica com um banco de dados real.
- **Não** existe sistema de autenticação (login, gerenciamento de tokens). As senhas informadas nos testes são descartadas com segurança logo após a validação.
- Não existem telas de listagem, edição ou exclusão (CRUD completo).
- Não existe acompanhamento/resolução do chamado (registro de laudos ou diagnósticos via UI).
- Não há dashboard ou telemetria integrados.
- As permissões associadas aos papéis (GESTOR / TÉCNICO) são apenas descritivas neste momento.
