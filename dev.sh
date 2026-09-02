#!/usr/bin/env bash
# Scopewise — Iniciar servidores de desenvolvimento
set -e

echo "=== Scopewise Dev ==="

# Backend
echo "[1/2] Iniciando backend na porta 8000..."
cd backend
if [ ! -d ".venv" ]; then
    echo "Criando virtual environment..."
    python3 -m venv .venv
    . .venv/bin/activate
    pip install -r requirements.txt
else
    . .venv/bin/activate
fi
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!
cd ..

# Frontend
echo "[2/2] Iniciando frontend na porta 5173..."
cd frontend
if [ ! -d "node_modules" ]; then
    echo "Instalando dependências..."
    npm install
fi
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "=== Scopewise rodando ==="
echo "  Backend:  http://localhost:8000"
echo "  Frontend: http://localhost:5173"
echo "  API Docs: http://localhost:8000/api/docs"
echo ""
echo "Pressione Ctrl+C para parar."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait