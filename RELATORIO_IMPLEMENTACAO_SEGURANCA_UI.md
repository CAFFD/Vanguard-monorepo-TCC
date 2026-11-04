# Relatório de Implementação: Segurança (Auth/RBAC/Criptografia), Tratamento de Exceções, Light Mode (WCAG AA) e Identidade Visual — Sistema Vanguard

> **Status da Entrega:** 100% dos 5 passos concluídos com **regressão zero**. A suíte do Vitest passou de **14 para 64 testes automatizados** (`14/14` do classificador S.M.A.R.T. + `50/50` de segurança, autenticação, RBAC e blindagem de dados), além de `100%` dos testes do Agente em Go e compilação limpa (`tsc` + `vite build`) no Backend e no Frontend.

---

## 1. Resumo Executivo das Alterações

### 1.1 Backend (`api/`) e Agente de Borda (`agent/`)

- `api/src/config/env.ts` (**Criado**): Validação *fail-fast* de variáveis de ambiente com Zod (`DATABASE_URL`, `JWT_SECRET` >= 32 chars, `AGENT_API_KEY` >= 32 chars, `CORS_ORIGINS`, `COOKIE_SAMESITE`, `LOGIN_RATE_LIMIT_MAX`).
- `api/src/lib/password.ts` (**Criado**): Derivação de senhas com `node:crypto` `scrypt` (RFC 7914, N=32768, r=8, p=1, sal aleatório de 128 bits, chave de 512 bits), comparação em tempo constante (`timingSafeEqual`), mitigação de *user enumeration* (`burnPasswordVerification`) e migração automática de hashes SHA-256 legados.
- `api/src/lib/errors.ts` (**Criado**): Hierarquia de erros semânticos de domínio (`AppError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`).
- `api/src/lib/roles.ts` (**Criado**): Definição tipada dos perfis RBAC (`GESTOR` e `TECNICO`) e *type guard* `isUserRole`.
- `api/src/lib/sanitize.ts` (**Criado**): Dupla camada de *Data Leak Prevention*: projeção explícita `toPublicUser` (*allow-list*) e sanitizador recursivo `stripSensitiveFields` (*deny-list* no hook `preSerialization`).
- `api/src/plugins/error-handler.ts` (**Criado**): `setErrorHandler` e `setNotFoundHandler` globais: formata `ZodError` (HTTP 400), mapeia erros de integridade PostgreSQL (`23505`/`23503` -> HTTP 409) e blinda erros inesperados (HTTP 500) ocultando *stack traces*, strings de conexão e SQL.
- `api/src/plugins/security.ts` (**Criado**): Registra `@fastify/helmet`, `@fastify/cors` restritivo com `credentials: true`, `@fastify/cookie`, `@fastify/jwt` (fixado em `HS256` + `onlyCookie: true`), `@fastify/rate-limit` e hook `preSerialization`.
- `api/src/middlewares/auth.ts` (**Criado**): Hooks `preHandler` de autenticação (`authenticate`), autorização por perfil (`requireRole`, `gestorOnly`) e chave M2M do Agente (`requireAgentKey`).
- `api/src/controllers/auth-controller.ts` & `api/src/routes/auth-routes.ts` (**Criados**): Rotas `POST /auth/login` (com rate limit), `POST /auth/logout` e `GET /auth/me`.
- `api/src/repositories/user-repository.ts` (**Criado**): Camada de acesso a dados de usuários desacoplada para testes unitários/integração sem depender de banco ao vivo.
- `api/src/controllers/user-controller.ts`, `sector-controller.ts`, `equipment-controller.ts`, `telemetry-controller.ts`, `occurrence-controller.ts` (**Modificados**): Integração com RBAC, hash `scrypt` server-side, exclusão administrativa de usuários/setores e delegação ao `setErrorHandler` global.
- `api/src/db/seed.ts` (**Criado**): Script `npm run db:seed` para provisionar usuários `GESTOR` e `TECNICO` de teste.
- `api/src/test/auth-security.test.ts` (**Criado**): Suíte com **50 testes automatizados** no Vitest.
- `agent/main.go` (**Modificado**): Suporte ao cabeçalho `x-api-key` (`VANGUARD_API_KEY` / `AGENT_API_KEY`).

### 1.2 Frontend (`web/`)

- `web/src/lib/api.ts` (**Modificado**): `credentials: "include"` e evento global `vanguard:unauthorized` em respostas HTTP `401`.
- `web/src/features/auth/context/AuthContext.tsx` (**Criado**): Contexto de sessão (`user`, `isAuthenticated`, `isGestor`, `login`, `logout`, `refreshSession`).
- `web/src/features/auth/components/ProtectedRoute.tsx` (**Criado**): Guarda de rotas autenticadas e guarda de perfil `GESTOR`.
- `web/src/features/auth/pages/LoginPage.tsx` & `schemas/loginSchema.ts` (**Criados**): Tela de Login com validação Zod, tratamento visual de erros e suporte a temas.
- `web/src/components/theme/ThemeContext.tsx` (**Criado**): Alternador de tema Dark/Light com persistência em `localStorage` e respeito a `prefers-color-scheme`.
- `web/src/components/brand/VanguardLogo.tsx`, `web/public/favicon.svg`, `web/index.html` (**Criados/Modificados**): Nova identidade visual escalável em SVG adaptável ao Modo Claro e Modo Escuro.
- `web/src/styles/globals.css`, `web/src/features/equipments/lib/health.ts` e páginas internas (**Modificados**): Variáveis CSS semânticas com contraste WCAG AA nos dois temas e adaptação condicional por perfil (`GESTOR` vs `TECNICO`).

---

## 2. Arquitetura de Segurança Implementada

1. **Derivação de Senhas (`scrypt` — RFC 7914):** Uso de `node:crypto.scrypt` ($N=32768, r=8, p=1$), sal aleatório de 16 bytes e chave de 64 bytes no formato `scrypt$32768$8$1$<salt_b64>$<hash_b64>`, verificada com `crypto.timingSafeEqual` e protegida contra enumeração de usuários via `burnPasswordVerification`.
2. **Sessão JWT em Cookie `HttpOnly`:** Assinatura `HS256` validada estritamente (`algorithms: ["HS256"]`, `onlyCookie: true`, `iss`, `aud`, `exp`) e transportada em cookie `HttpOnly`, `SameSite=Lax` e `Secure` (em produção), eliminando exposição do token ao JavaScript (`XSS`) e ataques `CSRF`.
3. **Autenticação M2M do Agente (`x-api-key`):** Comparação em tempo constante via digest SHA-256 de 32 bytes + `crypto.timingSafeEqual`.
4. **RBAC e Blindagem de Dados:** Hooks `preHandler` (`authenticate`, `requireRole("GESTOR")`), projeção `toPublicUser`, sanitização recursiva `preSerialization` (`stripSensitiveFields`) e `setErrorHandler` global que oculta detalhes internos em erros 500.

---

## 3. Credenciais de *Seed* (`npm run db:seed` em `api/`)

| Perfil (`role`) | Nome | E-mail | Senha |
| :--- | :--- | :--- | :--- |
| **`GESTOR`** | Ana Gestora (Admin) | `gestor@vanguard.local` | `Vanguard@2026` |
| **`TECNICO`** | Bruno Técnico (NOC) | `tecnico@vanguard.local` | `Tecnico@2026` |

