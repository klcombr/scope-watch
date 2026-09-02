# Arquitetura

## Visão geral

Scopewise é uma aplicação monolítica composta por:
- Backend: FastAPI (Python) com SQLAlchemy ORM
- Frontend: React + TypeScript + Vite (SPA)
- Banco: SQLite (dev) / PostgreSQL (produção)
- Autenticação: JWT + bcrypt
- Rate limiting: sliding window in-process

---

## Fluxo principal

```
Usuário (freelancer)
  │
  ├── Registra projeto + escopo acordado
  │
  ├── Registra pedidos do cliente ao longo do projeto
  │     └── Classifica: IN_SCOPE / OUT_OF_SCOPE / DISCUSS
  │
  ├── Para pedidos FORA de escopo:
  │     └── Cria change order: título + horas × valor/hora
  │           └── Workflow: DRAFT → SENT → APPROVED/REJECTED → PAID
  │
  └── Dashboard: total aprovado, pendente, recebido
```

---

## Modelo de dados

```
User (id, email, name, password_hash, plan, created_at)
  └── Project (id, user_id, title, status, hourly_rate, notes)
        ├── ScopeEntry[] (id, project_id, text)
        ├── Request[] (id, project_id, text, classification, status, change_order_id)
        └── ChangeOrder[] (id, project_id, title, description, hours, rate, status)
              └── Request[] (via change_order_id)
```

---

## Segurança

- Senhas: bcrypt com custo 12
- JWT: HS256, expira em 7 dias
- Isolamento horizontal: query filtra por user_id em todas as operações
- Rate limiting: 120 req/min por IP (configurável)
- CORS: apenas origens conhecidas
- Headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- Validação: Pydantic em todas as entradas

---

## Decisões técnicas

1. **SQLite em dev, PostgreSQL em prod**: zero config local, Postgres para robustez em produção
2. **SQLAlchemy como ORM**: portável entre SQLite/Postgres, type-safe, migrations prontas
3. **JWT sem refresh token para MVP**: simplificação — token de 7 dias, re-login se expirar
4. **Rate limiter in-process**: adequado para MVP single-box; Redis para horizontal scaling futuro
5. **Hash routing no frontend**: sem react-router, zero configuração de servidor

---

## Escalabilidade

- **Single box (1-10K users)**: Render free tier + Neon Postgres
- **Múltiplos workers**: rate limiter precisa de store compartilhado (Redis) — substituir SlidingWindowRateLimiter
- **Separar frontend**: estático no Vercel/Cloudflare Pages, backend no Render/Fly.io
