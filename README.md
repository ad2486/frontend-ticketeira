# Ticketeira: frontend

Interface web da bilheteria de eventos: vitrine, compra de ingressos e gestão dos
eventos que o usuário organiza. Consome a API do backend (`ticketeira-backend`).
Projeto de estudo, encerrado no MVP.

## Stack

- Vite + React 19 + TypeScript
- React Router (modo SPA) e TanStack Query (cache e estado do servidor)
- React Hook Form + Zod nos formulários
- Tailwind CSS v4 + shadcn/ui
- `openapi-fetch` com tipos gerados do OpenAPI do backend (`openapi-typescript`)
- Biome (lint e formatação)

## Rodando localmente

Requisitos: Node 26, pnpm e o backend rodando em `http://localhost:3000`.

```bash
pnpm install
cp .env.example .env          # VITE_API_URL=http://localhost:3000
pnpm dev                      # http://localhost:5173
```

O backend libera o CORS para `http://localhost:5173` por padrão (`FRONTEND_ORIGIN`).

| Script | |
|---|---|
| `pnpm dev` | servidor de desenvolvimento |
| `pnpm build` | checagem de tipos + build de produção |
| `pnpm lint` / `pnpm format` | Biome |
| `pnpm api:types` | regera `src/api/schema.d.ts` a partir de `/docs/json` (backend no ar) |

## Telas

| Rota | |
|---|---|
| `/` | vitrine em formato de cartaz, com filtro por cidade e estado (na URL) |
| `/events/:id` | detalhe do evento e compra |
| `/login`, `/register` | entrar e criar conta |
| `/tickets` 🔒 | meus ingressos, com o código único de cada um |
| `/my-events` 🔒 | eventos que organizo: publicar e cancelar |
| `/events/new` 🔒 | criar evento (em rascunho) |

🔒 = exige login; sem sessão, redireciona para o login e volta depois.

## Autenticação

- O access token (JWT, 15 min) fica **só em memória** (`src/auth/token.ts`), nunca
  no `localStorage`, para não ficar exposto a XSS.
- O refresh token fica num cookie httpOnly que o JavaScript não lê. Ao carregar
  a página, `main.tsx` chama `/auth/refresh` antes do primeiro render para
  recuperar a sessão.
- Um middleware do `openapi-fetch` (`src/auth/middleware.ts`) põe o
  `Authorization: Bearer` em toda requisição. Num 401, renova o token uma vez
  (requisições simultâneas compartilham a mesma renovação) e repete a original.
- Os componentes descobrem se há login com `useSyncExternalStore`, sem Context.

## Organização

```
src/
  api/         client, tipos gerados, erros (ApiError), chaves do TanStack Query
  auth/        token, sessão (refresh/logout), middleware, rota protegida
  components/  layout, cartaz do evento, campo de formulário, ui/ (shadcn)
  lib/         formatação de data/preço (fuso de São Paulo, BRL), estados do Brasil
  pages/       uma página por rota
```

## Decisões

- **Fuso:** datas são exibidas e digitadas sempre no horário de São Paulo; na
  criação, o front envia o horário com `-03:00`.
- **Dinheiro:** o preço é digitado em reais e enviado em centavos
  (`Math.round(preco * 100)`, sem erro de ponto flutuante).
- **Erros da API:** a mensagem do backend é exibida como veio. Erros 4xx não são
  repetidos pelo TanStack Query.
- **Visual:** "lambe-lambe", cartaz de show colado no muro. Uma cor só (cobalto
  `#2f55e4`), Big Shoulders Display nos títulos, cartazes e canhotos com cantos
  retos. Só tema claro.

## Fora do escopo

Editar evento, tema escuro, pagamento (PIX) e check-in não foram feitos.
