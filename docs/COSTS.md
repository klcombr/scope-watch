# Scopewise — Custo estimado e Monetização

## Custos por escala

| Usuários | Backend (Render) | Banco (Neon) | Frontend (Vercel) | Total/mês |
|----------|-----------------|-------------|-------------------|-----------|
| 1–100    | $0 free tier    | $0 free tier | $0 free tier     | R$ 0      |
| 100–500  | $0 free tier    | $0 free tier | $0 free tier     | R$ 0      |
| 500–2K   | $7 Starter      | $0 free tier | $0 free tier     | ~R$ 40    |
| 2K–5K    | $25 Standard    | $19 Pro      | $0 free tier     | ~R$ 220   |
| 5K–10K   | $25 Standard    | $19 Pro      | $20 Pro          | ~R$ 340   |

### Premissas

- Backend: Render free tier = 750h/mês, 512MB RAM, spinning down after 15min idle
- Banco: Neon free tier = 0.5GB storage, 24/7 (projeto sempre ativo), branch automático
- Frontend: Vercel free tier = 100GB bandwidth/mês
- Custo operacional por usuário: ~R$ 0 (free tier) → ~R$ 0,04 (10K usuários)
- Não há dependência de APIs pagas (zero tokens IA, zero serviços externos obrigatórios)

### Limitações técnicas do MVP

#### Rate limiter (in-process)

O rate limiter utiliza estado em memória (sliding window por IP). Isso é adequado ao deployment atual de processo único no Render free tier. Caso o backend seja escalado para múltiplos workers ou múltiplas instâncias, será necessário um armazenamento compartilhado (ex: Redis) para manter limites consistentes entre processos. Não há custo adicional no cenário atual.

#### Autenticação JWT em localStorage

O token de autenticação é armazenado em `localStorage` no frontend. Essa é uma decisão consciente do MVP, motivada por:

- Frontend (GitHub Pages) e backend (Render) estão em domínios diferentes (cross-site).
- Browsers modernos bloqueiam cookies `SameSite=None` entre sites por padrão (Chrome third-party cookie phase-out).
- Cookies HttpOnly cross-site não funcionam sem um BFF/proxy, o que adicionaria complexidade desproporcional ao MVP.

O risco principal de `localStorage` é exposição do token caso exista XSS. A aplicação mitigou esse risco através de:
- CSP com `script-src 'self'` (sem `unsafe-inline`) — bloqueia scripts inline.
- Validação/escape de todas as entradas do usuário.
- Ausência de bibliotecas que injetam scripts dinâmicos.

Não afirmar que `localStorage` é "seguro"; afirmar que o risco foi aceito e mitigado. Quando o MVP validar com usuários reais, considerar migração para BFF proxy se o threat model justificar.

### Recursos estimados por usuário

| Recurso         | Uso estimado/usuário/mês |
|----------------|------------------------|
| Requisições API | ~200 (projetos + pedidos + change orders) |
| Armazenamento   | ~5KB (projetos + pedidos) |
| CPU/bandwidth   | Negligenciável |

---

## Modelo de Monetização

### Plano Free (gratuito)

- **Limite**: 3 projetos ativos
- **Funcionalidades**: todas as funcionalidades core
- **Sem**: limites de funcionalidades, sem paywall artificial
- **Objetivo**: permitir que o freelancer teste e perceba valor

### Plano Pro — R$ 9/mês

- **Projetos ilimitados**
- **Exportar dados** (CSV)
- **Status**: todo o resto já funciona no free
- **Justificativa**: o freelancer que usa 3+ projetos simultaneos já está faturando e pode pagar

### Plano Agência — R$ 29/mês (futuro)

- **Múltiplos usuários** (até 5)
- **Rate customizado por projeto**
- **Logo da agência** nos change orders

---

## Por que R$ 9/mês?

- Frente de $20/mês (HoneyBook) e $15/mês (Dubsado)
- Valor percebido: se o freelancer usa 1 change order/mês de R$ 200+, o custo do plano é insignificante
- Preço baixo o suficiente para ser "impulsivo" — reduz fricção de compra
- Margem operacional: ~100% (custo quase zero no free tier)

---

## Estratégia de aquisição (inicial, sem anúncios)

1. **SEO**: landing page com "scope creep freelancer" e variações em PT-BR
2. **Reddit**: posts úteis em r/freelance, r/webdev, r/SaaS, r/indiehackers
3. **Product Hunt**: launch como ferramenta para freelancers
4. **Comunidades**: grupos de freelancers no Discord, Telegram
5. **Conteúdo**: artigo sobre como freelancers perdem dinheiro com scope creep
6. **GitHub**: open-source do backend para construir confiança

---

## Decisão sobre open-source

O **backend será open-source** (MIT) porque:
- Constrói confiança com freelancers que desconfiam de SaaS fechados
- Reduz custo de suporte (comunidade pode contribuir)
- O modelo de negócio é SaaS pago, não vender código
- O diferencial não é o código, é a UX e a simplicity
- Não compromete o modelo de negócio porque não há dados competitivos no código
