# Contribuindo

## Pré-requisitos

- Python 3.12+
- Node.js 18+
- Git

## Setup local

```bash
git clone <repo-url>
cd scopewise

# Backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Frontend
cd ../frontend
npm install
```

## Desenvolvimento

### Backend

```bash
cd backend
. .venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Documentação interativa: http://localhost:8000/api/docs

### Frontend

```bash
cd frontend
npm run dev
```

Acesse http://localhost:5173. O Vite faz proxy para o backend.

## Testes

```bash
cd backend
. .venv/bin/activate
python -m pytest -v
```

Todos os 28 testes devem passar antes de submeter um PR.

## Commits

- Mensagens curtas e descritivas em português ou inglês
- Um commit por mudança lógica
- Nunca committar .env ou secrets

## Pull Requests

1. Fork o repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nome`)
3. Implemente e teste
4. Submeta o PR com descrição clreta da mudança

## Regras de código

- Sem comentários excessivos
- Validação em todas as entradas
- Isolamento de usuário em todas as queries
- Testes para funcionalidades novas
- Formatação consistente (padrão PEP 8 / ESLint)
