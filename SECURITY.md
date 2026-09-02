# Segurança

## Modelos de ameaça

| Ameaça | Risco | Mitigação |
|--------|-------|-----------|
| Força bruta em login | Médio | Rate limiting por IP (120/min) + bcrypt (custo 12) |
| Acesso não autorizado | Alto | JWT com expiração 7 dias, token invalidado no logout |
| Isolamento entre usuários | Crítico | Todas as queries filtram por user_id, endpoints verificam ownership |
| XSS | Médio | React escapamento por padrão, CSP headers |
| CSRF | Baixo | JWT via header Authorization (não cookie), SameSite não aplicável |
| Injeção SQL | Alto | SQLAlchemy parametriza todas as queries |
| Exposição de dados sensíveis | Alto | Nenhum dado sensível em logs, password_hash nunca exposto |
| Abuso de API | Médio | Rate limiting + input validation + max lengths |

## Princípios

1. Nunca armazenar senhas em texto puro — sempre bcrypt
2. Nunca expor API keys no frontend
3. Nunca logar dados sensíveis
4. Nunca executar comandos arbitrários
5. Nunca confiar em dados do cliente
6. Validar todas as entradas com Pydantic
7. Isolamento horizontal por usuário
8. Rate limiting em todos os endpoints

## Configuração de segurança

```
SECRET_KEY=<chave longa e aleatória — NUNCA commitar>
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=120
APP_ENV=production
```

## Relatório de vulnerabilidades

Se encontrar uma vulnerabilidade, abra um issue privado no GitHub ou contate o mantenedor diretamente.
