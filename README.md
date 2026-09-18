<div align="center">

# 🖥️ Vanguard — Sistema de Monitoramento de Ativos de TI

**Trabalho de Conclusão de Curso**

Sistema distribuído de telemetria e gestão de hardware para ambientes corporativos.
Monitora a saúde de equipamentos em tempo real através de agentes de coleta locais,
uma API centralizada e um painel de controle web.

[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Go](https://img.shields.io/badge/Go-1.27-00add8?logo=go&logoColor=white)](https://go.dev/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)](https://fastify.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-3ecf8e?logo=supabase&logoColor=white)](https://supabase.com/)
[![Deploy](https://img.shields.io/badge/Deploy-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com/)

</div>

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Arquitetura do Sistema](#arquitetura-do-sistema)
- [Estrutura do Monorepo](#estrutura-do-monorepo)
- [Pré-requisitos](#pré-requisitos)
- [Configuração do Ambiente](#configuração-do-ambiente)
- [Subindo o Sistema Localmente](#subindo-o-sistema-localmente)
- [Banco de Dados (Migrações)](#banco-de-dados-migrações)
- [API — Referência de Endpoints](#api--referência-de-endpoints)
- [Lógica de Classificação de Saúde](#lógica-de-classificação-de-saúde)
- [Agente Go — Como Funciona](#agente-go--como-funciona)
- [Testando o Sistema](#testando-o-sistema)
- [Deploy em Produção (Vercel + Supabase)](#deploy-em-produção-vercel--supabase)

---

## Visão Geral

O **Vanguard** é um sistema de monitoramento de ativos de TI desenvolvido como TCC. Ele resolve o problema de falta de visibilidade sobre a saúde do hardware em ambientes corporativos com múltiplos computadores.

**O problema que resolve:** Equipes de TI precisam identificar proativamente quais máquinas estão com risco de falha de disco antes que o problema se torne crítico para o usuário.

**Como funciona, de ponta a ponta:**

```
[Máquina monitorada]          [Nuvem]                    [Gestor de TI]
  Agente Go (agent/)  ──POST──▶  API Fastify (api/)  ──▶  Painel Web (web/)
  coleta SMART + disco           valida e persiste         exibe status e
  a cada execução                no PostgreSQL             histórico
```

---

## Arquitetura do Sistema

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        Monorepo                             │
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   /agent     │    │    /api      │    │    /web      │  │
│  │              │    │              │    │              │  │
│  │  Go binary   │───▶│  Fastify 5   │◀───│  React 19   │  │
│  │  SMART + WMI │    │  Drizzle ORM │    │  Vite + TS  │  │
│  │  Windows     │    │  Zod         │    │  Tailwind 4 │  │
│  └──────────────┘    └──────┬───────┘    └──────────────┘  │
│                             │                               │
└─────────────────────────────┼───────────────────────────────┘
                              │
                    ┌─────────▼─────────┐
                    │     Supabase      │
                    │   PostgreSQL      │
                    │  (banco de dados) │
                    └───────────────────┘
```

### Decisões Técnicas

| Decisão | Escolha | Justificativa |
|---|---|---|
| Agente de coleta | **Go** | Binário único, sem runtime, ideal para distribuir em máquinas corporativas |
| Backend | **Fastify + Node** | Alta performance, excelente ecossistema TypeScript |
| ORM | **Drizzle** | Type-safe, migrações geradas automaticamente, zero abstração excessiva |
| Validação | **Zod** | Compartilhável entre api/ e web/, erros estruturados |
| Banco | **Supabase** | PostgreSQL gerenciado, gratuito para MVP, fácil de configurar |
| Deploy API | **Vercel** | Serverless, integração direta com GitHub, HTTPS automático |
| Frontend | **React 19 + Vite** | Estado da arte, build ultra-rápido |

---

## Estrutura do Monorepo

```
Vanguard-monorepo-TCC/
│
├── agent/                  # Agente de coleta (Go)
│   ├── main.go             # Coleta SMART + uso de disco e envia para a API
│   └── go.mod
│
├── api/                    # Backend REST (Node.js / Fastify)
│   ├── api/
│   │   └── index.ts        # Handler serverless (usado pela Vercel)
│   ├── src/
│   │   ├── app.ts          # Factory: cria a instância Fastify (sem .listen)
│   │   ├── server.ts       # Entrypoint local: chama app.listen(:3000)
│   │   ├── controllers/    # Lógica de cada endpoint
│   │   ├── routes/         # Registro de rotas no Fastify
│   │   ├── schemas/        # Validação Zod dos requests
│   │   └── db/
│   │       ├── index.ts    # Conexão Drizzle + PostgreSQL
│   │       └── schema.ts   # Definição das tabelas
│   ├── drizzle/            # Migrações SQL geradas automaticamente
│   ├── drizzle.config.ts   # Config do Drizzle Kit
│   ├── vercel.json         # Config de deploy serverless
│   ├── tsconfig.json
│   └── package.json
│
├── web/                    # Frontend (React 19 / Vite)
│   ├── src/
│   │   ├── app/            # App principal e roteador
│   │   ├── components/     # Componentes reutilizáveis (UI + Layout)
│   │   ├── features/       # Módulos por domínio
│   │   │   ├── equipments/ # Cadastro de equipamentos
│   │   │   ├── sectors/    # Cadastro de setores
│   │   │   ├── users/      # Cadastro de usuários
│   │   │   └── occurrences/# Abertura de chamados
│   │   ├── services/       # Camada de comunicação com localStorage/API
│   │   └── styles/         # CSS global + Tailwind
│   └── package.json
│
├── docs/
│   ├── api/                # Documentação detalhada de cada endpoint
│   └── postman/            # Collections prontas para importar no Postman
│
└── .gitignore
```

---

## Pré-requisitos

### Globais
- **Node.js** ≥ 22 — [nodejs.org](https://nodejs.org/)
- **Go** ≥ 1.22 — [go.dev](https://go.dev/dl/)
- **Git** — [git-scm.com](https://git-scm.com/)

### Para o Agente (`/agent`)
- **smartmontools** instalado na máquina monitorada
  - Windows: baixar `smartctl.exe` de [smartmontools.org](https://www.smartmontools.org/wiki/Download) e ajustar o caminho no `main.go`
- PowerShell (já presente no Windows)

### Para o Banco de Dados
- Conta gratuita no **Supabase** — [supabase.com](https://supabase.com/)

---

## Configuração do Ambiente

### 1. Clonar o repositório

```bash
git clone https://github.com/CAFFD/Vanguard-monorepo-TCC.git
cd Vanguard-monorepo-TCC
```

### 2. Configurar a API (`/api`)

```bash
cd api
cp .env.example .env
```

Editar o `.env` com a connection string do seu banco Supabase:

```env
# Encontre em: Supabase → Project Settings → Database → Connection String → URI
DATABASE_URL=postgresql://postgres:[SUA-SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres
```

### 3. Instalar dependências

```bash
# Na pasta api/
npm install

# Na pasta web/
cd ../web
npm install
```

---

## Subindo o Sistema Localmente

Abra **três terminais** separados:

### Terminal 1 — API (Backend)

```bash
cd api
npm run dev
# Servidor disponível em http://localhost:3000
```

### Terminal 2 — Frontend

```bash
cd web
npm run dev
# Interface disponível em http://localhost:5173
```

### Terminal 3 — Agente Go (em uma máquina Windows com smartmontools)

```bash
cd agent
go run main.go
# O agente coleta os dados e envia um POST para http://localhost:3000/telemetry
```

> **Nota:** O agente deve ser executado como Administrador para ter acesso
> aos dados SMART do disco via `smartctl`.

---

## Banco de Dados (Migrações)

O projeto usa **Drizzle Kit** para gerar e aplicar as migrações. As migrações
já estão geradas em `api/drizzle/`. Para aplicá-las em um banco novo:

```bash
cd api

# Gerar novas migrações (apenas se o schema.ts foi modificado)
npx drizzle-kit generate

# Aplicar migrações no banco configurado no .env
npx drizzle-kit migrate

# Visualizar o banco em um browser (Drizzle Studio)
npx drizzle-kit studio
```

### Schema do Banco

```sql
-- Setores da empresa
sectors       (id, name, description)

-- Equipamentos cadastrados
equipments    (id, sector_id, mac_address, patrimony_tag, hostname, health_status)

-- Histórico de telemetria recebida
telemetry_history (id, equipment_id, created_at, disk_usage_percent,
                   smart_5, smart_187, smart_188, smart_197, smart_198, raw_payload)

-- Usuários do sistema
users         (id, name, email, role, password_hash)

-- Chamados/ocorrências de manutenção
occurrences   (id, equipment_id, technician_id, created_at, origin,
               priority, description, diagnosis, action_taken, closure_date)
```

> **Ordem de inserção:** Crie sempre `sectors` antes de `equipments`,
> pois equipamentos referenciam setores por FK.

---

## API — Referência de Endpoints

Base URL local: `http://localhost:3000`

### Telemetria

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/telemetry` | Recebe e persiste dados de telemetria do agente |
| `GET` | `/telemetry/status` | Retorna contagem agregada do status de todos os equipamentos |
| `GET` | `/telemetry/:equipamento_id` | Retorna histórico de telemetria de um equipamento |

### Equipamentos

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/equipments` | Cadastra um novo equipamento |
| `GET` | `/equipments` | Lista todos os equipamentos |
| `PUT` | `/equipments/:id` | Atualiza dados de um equipamento |

### Setores

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/sectors` | Cadastra um novo setor |
| `GET` | `/sectors` | Lista todos os setores |

> 📁 Documentação detalhada com exemplos completos de request/response:
> [`docs/api/`](./docs/api/)
>
> 📦 Collections do Postman prontas para importar:
> [`docs/postman/`](./docs/postman/)

---

## Lógica de Classificação de Saúde

O endpoint `GET /telemetry/status` avalia cada equipamento e o classifica em
**uma única categoria**, seguindo esta ordem de precedência:

```
OFFLINE → CRÍTICO → ATENÇÃO → NORMAL
```

| Status | Critério |
|---|---|
| 🔴 **offline** | Sem nenhum registro de telemetria **OU** última leitura há mais de 2 horas |
| 🚨 **critico** | `smart_197` E `smart_198` aumentaram simultaneamente em relação à leitura anterior (setores de disco com defeito crescendo) |
| ⚠️ **atencao** | Disco com uso acima de 90% **OU** `smart_197 > 0` (há setores pendentes) |
| ✅ **normal** | Comunicação ativa e nenhum critério de alerta atingido |

---

## Agente Go — Como Funciona

O agente (`agent/main.go`) é um binário Go executado **periodicamente** nas máquinas
monitoradas (via agendador de tarefas do Windows). A cada execução, ele:

1. **Coleta o hostname** da máquina via `os.Hostname()`
2. **Coleta dados SMART** executando `smartctl -a -j /dev/sda` e parseando o JSON
3. **Coleta uso do disco** via PowerShell (`Win32_LogicalDisk`)
4. **Envia um POST** para `/telemetry` da API com todos os dados

### Atributos SMART monitorados

| ID SMART | Nome | Significado |
|---|---|---|
| `5` | Reallocated Sectors Count | Setores realocados por defeito (idealmente 0) |
| `187` | Reported Uncorrectable Errors | Erros que o disco não conseguiu corrigir |
| `188` | Command Timeout | Timeouts de comandos ao disco |
| `197` | Current Pending Sector Count | Setores instáveis aguardando realocação |
| `198` | Offline Uncorrectable Sector Count | Setores definitivamente com defeito |

### Compilar o agente para distribuição

```bash
cd agent

# Compilar para Windows (na máquina de desenvolvimento)
GOOS=windows GOARCH=amd64 go build -o vanguard-agent.exe main.go

# Ou no próprio Windows
go build -o vanguard-agent.exe main.go
```

> ⚠️ **Antes de compilar:** Ajustar o caminho do `smartctl.exe` na linha 96
> do `main.go` para o caminho correto na máquina alvo.

---

## Testando o Sistema

### Opção 1 — Postman (Recomendado)

Importe as collections em `docs/postman/` no Postman. Todas as requisições
já estão pré-configuradas com exemplos de payload.

### Opção 2 — cURL

```bash
# 1. Criar um setor
curl -X POST http://localhost:3000/sectors \
  -H "Content-Type: application/json" \
  -d '{"id": "setor-ti", "name": "TI", "description": "Departamento de Tecnologia"}'

# 2. Cadastrar um equipamento
curl -X POST http://localhost:3000/equipments \
  -H "Content-Type: application/json" \
  -d '{
    "id": "eq-pc-001",
    "sector_id": "setor-ti",
    "hostname": "SEU-HOSTNAME-AQUI",
    "mac_address": "AA:BB:CC:DD:EE:FF",
    "patrimony_tag": "PAT-001",
    "health_status": "normal"
  }'

# 3. Simular envio de telemetria (normalmente feito pelo agente Go)
curl -X POST http://localhost:3000/telemetry \
  -H "Content-Type: application/json" \
  -d '{
    "hostname": "SEU-HOSTNAME-AQUI",
    "disk_usage": 72,
    "smart_5": 0,
    "smart_187": 0,
    "smart_188": 0,
    "smart_197": 0,
    "smart_198": 0
  }'

# 4. Consultar status agregado
curl http://localhost:3000/telemetry/status

# 5. Consultar histórico do equipamento
curl http://localhost:3000/telemetry/eq-pc-001
```

> 💡 **Dica:** Substitua `SEU-HOSTNAME-AQUI` pelo resultado de `hostname`
> no terminal da sua máquina.

### Opção 3 — Rodar o Agente Diretamente

Com a API rodando localmente, execute o agente na mesma máquina:

```bash
cd agent
go run main.go
```

O agente coletará os dados reais do disco e enviará para a API automaticamente.

---

## Deploy em Produção (Vercel + Supabase)

### 1. Banco de Dados no Supabase

1. Criar um projeto no [supabase.com](https://supabase.com/)
2. Ir em **Project Settings → Database → Connection String → URI**
3. Copiar a connection string (substitua `[YOUR-PASSWORD]` pela senha definida)
4. Rodar as migrações apontando para o Supabase:
   ```bash
   cd api
   # Configurar o .env com a URL do Supabase e executar:
   npx drizzle-kit migrate
   ```

### 2. API na Vercel

1. Importar o repositório no [vercel.com](https://vercel.com/)
2. Em **Configure Project**:
   - **Root Directory:** `api`
   - **Framework Preset:** Other
3. Em **Environment Variables**, adicionar:
   - `DATABASE_URL` = connection string do Supabase
4. Clicar em **Deploy**

A Vercel detectará automaticamente o `vercel.json` dentro de `api/` e
configurará o handler serverless em `api/api/index.ts`.

> **Importante:** Para ambientes serverless (Vercel), use a URL de
> **Connection Pooling** do Supabase (porta 6543, modo Transaction),
> não a conexão direta (porta 5432). Isso evita esgotamento de conexões.

### 3. Atualizar o Agente para Produção

Após o deploy, atualizar a URL da API no `agent/main.go`:

```go
// Linha 184 — trocar localhost pela URL da Vercel
"https://seu-projeto.vercel.app/telemetry",
```

Recompilar e redistribuir o binário nas máquinas monitoradas.

---

<div align="center">

Desenvolvido como Trabalho de Conclusão de Curso

</div>
