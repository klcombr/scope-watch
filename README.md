# Scopewise

Controle de escopo e change orders para freelancers e pequenas agências.

Transforme pedidos fora de escopo em change orders cobráveis — sem perder receita nem ter conversas constrangedoras.

---

## Por que Scopewise?

- **52–72% dos projetos de freelancers** sofrem com scope creep (Project Management Institute).
- **57% dos freelancers perdem mais de R$ 1.000/mês** em trabalho não cobrado.
- As ferramentas existentes são caras ou voltadas para enterprise.

Scopewise resolve **exatamente** isso: um lugar simples para registrar pedidos, classificar como dentro/fora de escopo e gerar change orders com o valor/hora do projeto.

---

## Funcionalidades

- **Projetos**: crie projetos com valor/hora e escopo acordado
- **Pedidos do cliente**: registre cada pedido extra e classifique como dentro ou fora de escopo
- **Change orders**: gere change orders com horas estimadas × valor/hora
- **Workflow de aprovação**: rascunho → enviada → aprovada → paga
- **Compartilhar com o cliente**: gere um link seguro para o cliente aprovar/recusar sem precisar de conta
- **Planos**: gratuito (até 3 projetos) e Pro (projetos ilimitados)
- **Dashboard**: veja quantos pedidos estão fora de escopo e quanto dinheiro está pendente
- **Isolamento de usuário**: cada usuário só vê seus próprios projetos
- **Autenticação segura**: senhas com bcrypt (custo 12), JWT com `iat`, sem dados sensíveis em logs

---

## Início rápido

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

O banco SQLite é criado automaticamente. Para produção, defina `DATABASE_URL` com PostgreSQL.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`. O Vite faz proxy das rotas `/api` para o backend.

### Ambos ao mesmo tempo

```bash
./dev.sh
```

---

## Stack

| Componente | Tecnologia |
|------------|-----------|
| Backend | Python 3.12+ / FastAPI / SQLAlchemy |
| Frontend | React 19 / TypeScript / Vite |
| Banco | SQLite (dev) / PostgreSQL (prod) |
| Autenticação | JWT + bcrypt |
| Rate limiting | Custom sliding window |
| Migrations | Alembic |
| CI/CD | GitHub Actions |
| Hospedagem | Free tier (Render, Vercel, Neon) |

---

## Estrutura do projeto

```
scopewise/
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   ├── deps.py
│   │   ├── limits.py          # Plan enforcement
│   │   ├── ratelimit.py
│   │   ├── main.py
│   │   └── routers/
│   │       ├── auth.py
│   │       ├── projects.py
│   │       ├── requests.py
│   │       ├── change_orders.py
│   │       └── share.py       # Public share links
│   ├── alembic/               # DB migrations
│   ├── tests/
│   │   ├── test_auth.py
│   │   ├── test_projects.py
│   │   └── test_share.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── ProjectsPage.tsx
│   │   │   ├── ProjectDetailPage.tsx
│   │   │   ├── SharePage.tsx  # Public client view
│   │   │   ├── PrivacyPage.tsx
│   │   │   ├── TermsPage.tsx
│   │   │   └── AboutPage.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── auth.tsx
│   │   └── types.ts
│   ├── public/
│   │   ├── sitemap.xml
│   │   ├── robots.txt
│   │   └── og-image.svg
│   └── vite.config.ts
├── .github/workflows/
│   ├── ci.yml                 # Tests + build
│   └── deploy.yml             # GitHub Pages
└── docs/
    ├── ARCHITECTURE.md
    └── COSTS.md
```

---

## Variáveis de ambiente

```bash
DATABASE_URL=sqlite:///./scopewise.db    # ou postgresql://...
SECRET_KEY=change-me-to-a-long-random-string
APP_ENV=development                      # development | production
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
DEFAULT_HOURLY_RATE=100.0
```

Em **produção**, `SECRET_KEY` deve ser definido — a aplicação recusa iniciar com o valor padrão.

---

## Testes

```bash
cd backend
. .venv/bin/activate
python -m pytest -v
```

35 testes cobrindo: autenticação, isolamento, CRUD, regras de negócio, validação, planos, compartilhamento, stats.

---

## Deploy

### Frontend (GitHub Pages)

1. Push para `main` ativa o GitHub Actions
2. Frontend é buildado e publicado em `https://<user>.github.io/scope-watch/`
3. Altere `base` em `vite.config.ts` se o repositório tiver outro nome

### Backend (Render free tier)

1. Conecte o repositório ao Render
2. Configure as variáveis de ambiente
3. Build: `cd backend && pip install -r requirements.txt`
4. Start: `cd backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Secret: defina `SECRET_KEY` com valor seguro

### Banco (Neon free tier)

1. Crie uma conta no Neon
2. Crie um projeto
3. Copie a URL de conexão
4. Defina como `DATABASE_URL` no Render

---

## Monetização

| Plano | Preço | Projetos |
|-------|-------|----------|
| Free | R$ 0 | Até 3 |
| Pro | R$ 9/mês | Ilimitados |

Cobrança ainda não implementada. Primeiro: plano, limites e enforcement.

---

## Licença

MIT — código aberto.
