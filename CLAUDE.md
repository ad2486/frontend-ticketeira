# Ticketeira

Sistema de bilheteria de eventos. Projeto de estudo (backend-first), em TypeScript.

- `backend/` — em desenvolvimento agora.
- `frontend/` — Vite + React + TS (repo próprio `frontend-ticketeira`), setup pronto (2026-10-24).

## Como trabalhar aqui

**Quem escreve o código é o Arthur.** Não escreva nem edite código a menos que ele
peça explicitamente. O papel do Claude é explicar, revisar, apontar erros, sugerir
direções e responder dúvidas — em texto, não em edits. Única exceção:
boilerplate/scaffolding, e mesmo assim só quando ele pedir na hora.

- Projeto de aprendizado: explique o porquê das decisões, não só entregue código.
- Ele está escrevendo o `schema.prisma` à mão, lendo a documentação.
- Respostas sóbrias e concisas.

## Regras de negócio

- Não existe admin: todo mundo é usuário. Qualquer usuário pode criar eventos
  (organizador) e comprar ingressos.
- Papel é relação, não tipo de conta: o dono de um evento é quem está em
  `events.creator_id`.
- Anti-abuso: o limite é na **quantidade de eventos** por usuário, não de assentos.
  O limite vem do `tier` do usuário; tiers maiores são liberados mediante pagamento
  ou verificação.
- A capacidade de cada evento é livre (> 0).
- Usuário tem duas visões: "meus ingressos" (o que comprou) e "meus eventos"
  (o que organiza).
- Eventos podem ter idade mínima (`min_age`). A data de nascimento é autodeclarada;
  a compra é bloqueada se a idade não bater. Verificação real acontece na entrada.
- **Edição de evento com ingressos vendidos** (decidido 2026-10-15):
  - `minAge`: subir é bloqueado (409); descer é permitido.
  - `startsAt` e `location`: **não mudam depois da primeira venda** (409),
    nunca. Remarcar = cancelar o evento (com reembolso, via PIX). Motivo: uma
    janela de desistência "até 48h antes" poderia ser menor que o direito de
    arrependimento de 7 dias do CDC (art. 49).
  - Demais campos livres (preço não afeta quem já pagou; capacidade é protegida
    pelo CHECK).
- **Um ingresso por CPF por evento** (decidido 2026-10-15): como CPF é único por
  usuário, é um pedido `paid` por usuário por evento; compra não tem body e
  cria 1 ticket (`orders.quantity` = 1, coluna mantida). Idade conferida **na data
  do evento** (`birthDate + minAge anos <= data do evento`). O organizador pode
  comprar do próprio evento. Transferência (pós-MVP) deve re-checar idade e a
  regra de um por evento.
- Recomendação de eventos na home usa cidade/estado do usuário.

## Stack

- TypeScript, Fastify, PostgreSQL, **Prisma 8** (`@prisma/orm-postgres`), Zod
  - Prisma 8 é contract-first: `src/prisma/contract.prisma` + `prisma contract emit`.
    Nada de `schema.prisma`/`@prisma/client` — isso é Prisma 7 e a sintaxe é outra.
    O skill `prisma-8` em `backend/.claude/skills/` é a fonte da verdade.
  - Temporais: timestamps usam as variantes `...String` (`TimestamptzString`,
    `temporal.updatedAtString()`). **Exceção decidida: `users.birth_date` é `Date`
    (não `DateString`)**, de propósito. Para isso o projeto roda Node 26.10
    (`.node-version`, já tem `Temporal` nativo) e ainda importa
    `temporal-polyfill/global` em `src/prisma/db.ts`. Não sugerir trocar.
- OpenAPI + Swagger UI via `@fastify/swagger` + `@fastify/swagger-ui`, com
  `fastify-type-provider-zod` (um schema Zod valida, tipa e documenta cada rota)
- Zod também para validar variáveis de ambiente na inicialização
- Pino (logger embutido do Fastify)
- Auth: **JWT** com `@fastify/jwt` (decidido: escolhido para aprender o modelo mais
  comum). Token no header `Authorization: Bearer`, payload só com `sub` (id do
  usuário). Access token de 15 min (no JSON) + refresh token opaco de 30 dias
  com rotação, em cookie httpOnly (só o hash SHA-256 fica no banco); logout
  revoga. Senhas com argon2.
- Testes: Vitest + `fastify.inject()`; Testcontainers opcional
- Docker Compose para o Postgres local
- Biome (lint + format), tsx (dev)
- `@fastify/rate-limit` nas rotas de login e compra
- Pós-MVP: pg-boss (expirar reservas, processar webhook do PIX), OpenTelemetry,
  pagamento PIX via AbacatePay

## Modelo de dados

**users**: id, name, email (único), city, state, cpf (único), tier, password_hash,
birth_date, created_at, updated_at

**events**: id, creator_id → users, capacity, title, description, starts_at
(timestamp com fuso), location, city, state, status, min_age, ticket_price_cents,
sold_tickets, created_at, updated_at

**orders**: id, user_id → users, event_id → events, payment_id (único, nulo),
status, quantity, unit_price_cents, expires_at, created_at, updated_at

**tickets**: id, order_id → orders, user_id → users (dono atual), event_id → events,
unique_code (único), checked_in_at (nulo até a entrada), created_at, updated_at

Fonte da verdade é `backend/src/prisma/contract.prisma`; esta seção é resumo.

Decisões:

- Pedido = transação (quem pagou, quanto, status). Ticket = entrada individual
  (código próprio, check-in individual).
- Tickets **só são criados quando o pagamento confirma**. `orders.quantity` guarda
  quantos serão criados. Assim, "ticket existe = ticket pago", e nenhuma consulta
  precisa filtrar ingresso não pago.
- `orders.unit_price` é uma foto do preço no momento da compra; o preço do evento
  pode mudar depois.
- `sold_tickets` é incrementado na criação do pedido (reserva de capacidade) e
  devolvido se o pedido expirar ou for cancelado.
- Relações ficam nas FKs; `users` não tem colunas de pedidos/eventos. Limite do tier
  = `COUNT` de eventos **ativos** do usuário: `draft` + `published` **e com
  `startsAt` no futuro** (decidido 2026-10-15; eventos passados liberam a vaga
  mesmo sem job que marque `finished`). `finished` e `canceled` liberam a vaga.
  Limites (decidido 2026-10-15): `free` 2, `verified` 5, `pro` 8.
- Dinheiro em centavos (inteiro, colunas `*_cents`), nunca float.
- Status como enum (valores em minúsculas no banco, `pg/text@1`):
  - evento: `draft`, `published`, `finished`, `canceled`
  - pedido: `pending`, `paid`, `expired`, `canceled`
- `events.city`/`state`: usados na recomendação da home.
- `orders.payment_id`: id da cobrança no gateway (AbacatePay); liga o webhook ao
  pedido. Nulo no MVP.
- `orders.expires_at`: default no banco, `(now() + '00:10:00'::interval)`. Só marca
  o prazo; expirar de fato (status + devolver `sold_tickets`) é job/update à parte.
- `dbgenerated(...)` precisa estar na forma canônica que o Postgres devolve
  (parênteses incluídos), senão o `db init` falha na verificação do schema.
- `tickets.unique_code`: UUID v4 (`gen_random_uuid()`), separado do `id` para poder
  ser regenerado em transferência de dono.
- Constraints: `quantity > 0` e `sold_tickets <= capacity`. No Prisma 8 isso vai
  direto no contract com `@@check(expression: "...", name: "...")` — não precisa
  editar migration à mão (isso era limitação do Prisma 7). Nome do check prefixado
  pela tabela (`order_quantity_positive`).
- `event_id` em tickets é redundante (dá pra chegar pelo pedido); mantido para
  facilitar consultas. Consistência garantida por FK composta
  `tickets(order_id, event_id) → orders(id, event_id)`.
- Regras entre tabelas (ticket só de pedido pago, tickets ≤ quantity) não cabem em
  CHECK: ficam no service/webhook.

## Concorrência na venda (ponto crítico)

Nunca vender além da capacidade, mesmo com compras simultâneas. Nada de
"lê, checa, escreve" em passos separados. Usar:

- update condicional atômico (`updateMany` com
  `where: { soldTickets: { lte: capacity - quantity } }`, conferindo se afetou
  1 linha), ou
- `$queryRaw` com `SELECT ... FOR UPDATE` dentro de transação.

O `CHECK (sold_tickets <= capacity)` no banco é a última linha de defesa.

Handler do webhook de pagamento precisa ser idempotente: confirmação duplicada não
pode criar tickets duas vezes.

## Pagamento: arquitetura (decidido 2026-10-15)

Provedor de pagamento desacoplado com **Ports & Adapters**:

- **Port** `PaymentProvider` (contrato do domínio): `createCharge`, `refund`,
  `parseWebhook` (verifica assinatura e devolve evento do domínio, ex.
  `{ type: "charge.paid", chargeId }`).
- **Adapters:** `AbacatePayProvider` (real) e `FakePaymentProvider` (dev/testes,
  confirma sob comando). Nenhum tipo/erro do provedor sai do adapter; erros viram
  `PaymentProviderError`.
- Provedor escolhido no `buildApp` por env (`PAYMENT_PROVIDER`) e injetado nos
  services (não importado). Testes usam o fake.
- Webhook em `POST /webhooks/:provider`; handler idempotente só vê eventos do
  domínio.
- Coluna nova `orders.payment_provider` (decidido; migration no bloco PIX): saber
  qual provedor cobrou e quem reembolsa.
- Ordem: port + fake e o fluxo completo com testes primeiro; adapter real por
  último.

## Frontend: plano (decidido 2026-10-16)

Arthur está aprendendo React; o front é o último bloco do projeto. Priorizar código
simples e idiomático e explicar decisões não óbvias.

- Vite + React + TypeScript; Biome (mesma versão e config do back, 2.5.14, mais
  `css.parser.tailwindDirectives: true`).
- **Setup pronto** (`dbf7801`, 2026-10-24): `src/main.tsx` (StrictMode, sem `!` no
  `#root`), Tailwind v4 via `@tailwindcss/vite` (sem `tailwind.config.js`), alias
  `@/` → `src/` no Vite (`fileURLToPath`, ESM não tem `__dirname`) e nos dois
  tsconfigs (`paths` sem `baseUrl`, descontinuado no TS 6), shadcn/ui iniciado
  (`components.json`, base Radix, preset Nova; `cn` vem do pacote `cn` do próprio
  shadcn). Falta: React Router, TanStack Query, React Hook Form + Zod, tipos do
  OpenAPI.
- React Router (rotas protegidas), TanStack Query, React Hook Form + Zod,
  Tailwind + shadcn/ui, openapi-typescript + openapi-fetch (tipos gerados do
  `/docs/json` do back). Sem Redux, Next/SSR, axios, animações.
- **Auth (opção A):** access token no JSON do login, guardado **em memória** no
  front; refresh token em **cookie httpOnly**. Ao recarregar a página, o front chama
  `/auth/refresh` (cookie vai sozinho). 401 → tenta refresh uma vez → se falhar,
  login. **Back pronto** (`c0c7377`, `66bb583`, 2026-10-24): `@fastify/cookie`
  registrado antes das rotas; cookie `refreshToken` com `httpOnly`,
  `secure: "auto"`, `sameSite: "strict"`, `path: "/auth"`, `maxAge` 30 dias
  (`refreshCookieOptions` em `auth.routes.ts`). Login e refresh devolvem só
  `{ accessToken }`; refresh lê `request.cookies`. `POST /auth/logout` (sem
  auth, idempotente, 204): revoga o token no banco e `clearCookie` com as
  mesmas opções (sem o mesmo `path`, o navegador não apaga). Suíte: 49 testes.
- **CORS no back: pronto** (`d0111b8`, 2026-10-19): `@fastify/cors` com
  `FRONTEND_ORIGIN` (env, default `http://localhost:5173`), `credentials: true` e
  `methods` incluindo `PATCH` (o default do plugin é só GET/HEAD/POST). Teste em
  `src/common/cors.test.ts`. Suíte: 47 testes.
- **Sem assentos:** ingresso é por capacidade, um por CPF. Detalhe do evento tem
  só o botão "Comprar"; tratar 409 (esgotado / já tem / começou), 403 (idade),
  429.
- Telas: cadastro/login; vitrine (loading, erro, vazio); detalhe + compra; meus
  ingressos; criar evento (403 do tier); **meus eventos com publicar/cancelar**
  (sem publicar, o evento nunca aparece na vitrine).

## Escopo

MVP: cadastro/login, CRUD de eventos com limite por tier, compra com controle de
capacidade, "meus ingressos" com código único, "meus eventos". No MVP a compra pode
marcar o pedido como pago direto, sem gateway.

Pós-MVP: PIX (AbacatePay) com reserva e expiração, check-in, frontend,
observabilidade.

## Estado atual (atualizar a cada sessão)

Última atualização: 2026-10-24.

- Pronto e commitado em `backend/`: contract + migration init, `POST /users`
  completo, error handler global, env com Zod (`src/env.ts`), Biome, Swagger em
  `/docs`, `src/common/schemas.ts` (`errorResponse`), tabela `refresh_tokens` e
  `POST /auth/login` (JWT 15 min + refresh token 30 dias, só o hash SHA-256 no
  banco), `GET /users/me` (hook `onRequest: authenticate` de
  `src/common/auth.ts`; payload tipado em `src/types/fastify-jwt.d.ts`).
  `POST /auth/refresh` (UPDATE condicional atômico revoga o usado e emite novo
  par; reuso de token revogado → revoga todos do usuário).
  Rate limit no login (5/min por IP, `global: false`; produção atrás de proxy
  precisa `trustProxy`) e Authorize (bearer) no Swagger.
  `src/app.ts` exporta `buildApp()`; `src/index.ts` só faz `listen`.
  Vitest (`pnpm test`): banco `ticketeira_test` no mesmo container (via
  `vitest.config.ts` `test.env`), dados únicos por teste (sem limpeza),
  `src/modules/auth/auth.test.ts` com 5 testes. Rate limit do login vale nos
  testes (inject = 127.0.0.1). Nova migration → aplicar também no
  `ticketeira_test` (`pnpm migrate --db <url>`).
- `POST /events` pronto (2026-10-13): `stateEnum`/`timestamptz` em
  `src/common/schemas.ts`; service em transação com `SELECT tier ... FOR UPDATE`
  via `db.raw.sql` (plano montado com `db.raw`, executado com `tx.query` — `tx`
  não tem `raw`; retorna array) → corrida do limite de tier corrigida e provada
  (sem o lock, 3 simultâneos dão 3×201). `startsAt` usa `abort: true`: no Zod 4
  o `.refine` roda mesmo após falha de formato (sem fuso → `Temporal` lançava →
  500). Testes: `src/test/helpers.ts` (`createUser`, `login`, `accessTokenFor`),
  `events.test.ts` com 5 testes, incluindo concorrência. Suíte: 10 testes.
  `GET /events/mine` pronto (todos os status, `startsAt` asc, sem paginação;
  `eventFields` `as const` compartilhado no service).
  `PATCH /events/:id` pronto: `eventParams` (uuid), `updateEventBody` =
  `eventBody.partial()` + refine "pelo menos um campo" (**`.partial()` do Zod 4
  mantém `.default()`** → `minAge` é `.optional()` no body e o default 0 vem do
  banco). UPDATE condicional (id + creatorId + status draft/published); se null,
  busca → 404 (inexistente ou de outro usuário, mesma mensagem) ou 409 (não
  editável). CHECK de capacidade (`23514`, constraint com sufixo de hash →
  `startsWith`) vira 409 via `.catch` na Promise do update.
  Testes: `accessTokenFor` assina o JWT direto (`app.jwt.sign`), sem consumir o
  rate limit do login; estados sem rota (cancelado, vendidos) preparados direto
  no banco de teste. Suíte: 18 testes.
  Publish/cancel prontos (2026-10-14): `POST /events/:id/publish` (draft →
  published) e `/cancel` (draft/published → canceled), via `transitionEvent`
  interno (UPDATE condicional com `status.in(from)` + `startsAt > agora`);
  falha → `throwWriteFailure` (404/409, compartilhado com o PATCH). Suíte: 23
  testes.
  Listagem pública pronta (2026-10-14), sem auth: `GET /events` (só `published`
  e futuros; `city` via `ilike`, `state`; `limit` 1–100 default 20 e `offset`
  com `z.coerce`; ordem `startsAt`, `id` para desempate; filtros opcionais com
  `let query` + `if`) e `GET /events/:id` (só `published`, senão 404). Testes
  isolam por cidade única (UUID), já que o banco de teste não é limpo.
  Suíte: 30 testes.
  Compra pronta (2026-10-15): `POST /events/:id/orders` (módulo `orders/`,
  registrado sem prefixo; `idParams` genérico em `common/schemas.ts`). Lock
  `SELECT ... FOR UPDATE` via `db.raw.sql` com `AS "camelCase"` (as chaves do
  `returnsRow` casam por nome; sem o alias → `RAW_ROW_COLUMN_MISSING`). Datas:
  comparar com `Temporal.Instant.compare`, nunca string (o banco devolve
  `2026-10-15 22:00:00+00`, com espaço); `birthDate` chega como
  `Temporal.PlainDate`; idade no dia local do evento (`America/Sao_Paulo`).
  Rate limit 10/min. Testes: `remoteAddress` no `inject` simula IPs; provado que
  sem o lock 10 compras simultâneas vendem 10 numa capacidade 5 (lost update:
  o CHECK não pega, porque o contador fica em 1). Suíte: 41 testes.
  **MVP completo (2026-10-15):** `GET /tickets/mine` (módulo `tickets/`, filtro
  pelo dono atual `tickets.userId`, evento via `.include`; o ORM tipa include
  "para um" como nullable → `flatMap` tira o null do tipo; ordem por data do
  evento em JS). Helpers de teste `publishedEvent` e `buyTicket` em
  `src/test/helpers.ts`. Suíte: 45 testes. Push feito até `4e36f86`;
  `1d7ac0b` (tiers 2/5/8), `0fce4ca` (`lib: ES2022`) locais.
- **Ordem decidida (2026-10-15):** 1) ajustes pendentes (abaixo); 2) check-in pelo
  `uniqueCode`; 3) frontend React. Pagamento (PIX) **em dúvida**: Arthur pode não
  fazer neste projeto (complexidade: filas, idempotência, locks, NF-e) porque
  quer Java como stack principal. Transferência de ingresso: sem data.
- Pendências (2026-10-15):
  - **Implementar:** contagem do tier ignorar eventos com `startsAt` no passado
    (um `.where` a mais na contagem do `createEvent`).
  - **Implementar:** no PATCH, com `soldTickets > 0` → 409 para aumento de
    `minAge` e para qualquer mudança em `startsAt`/`location`.
  - **Requisito do bloco PIX:** reembolso por arrependimento em até 7 dias da
    compra (CDC art. 49), independente de remarcação; confirmar aplicabilidade a
    ingressos com orientação jurídica (postura conservadora: oferecer).
  - **Decidido:** reembolso ao cancelar evento com vendas só junto com o PIX.
- Commits: o Claude faz quando o Arthur pede (conventional commits, em inglês,
  separados por assunto, `pnpm lint` e `tsc` limpos). Push é do Arthur.

## Em aberto

- Fazer ou não o pagamento (PIX) neste projeto; decidir depois do frontend
  (Arthur tende a encerrar o projeto após o front).
- Ajustes pendentes do back (tier e PATCH com vendas): antes do front ou deixar.
