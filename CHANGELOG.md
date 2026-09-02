# Changelog

## [0.1.0] - 2026-09-01

### Adicionado

- Cadastro e login com JWT
- CRUD de projetos com escopo acordado
- Classificação de pedidos: IN_SCOPE / OUT_OF_SCOPE / DISCUSS
- Criação de change orders a partir de pedidos fora de escopo
- Workflow de change orders: DRAFT → SENT → APPROVED/REJECTED → PAID
- Dashboard com métricas: valor aprovado, pendente, fora de escopo
- Isolamento horizontal de usuários
- Rate limiting por IP (sliding window)
- Headers de segurança
- Testes automatizados (28 testes)
- Frontend React + TypeScript + Vite
