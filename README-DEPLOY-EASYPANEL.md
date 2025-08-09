# Deploy FinWise SaaS no EasyPanel

## ✅ Problema das Migrations Resolvido!

Este projeto agora usa uma estratégia robusta para contornar problemas de migrations em produção.

## Configuração para Produção

### 1. Arquivos Necessários
- `docker-compose.prod.yml` - **Versão otimizada para produção (RECOMENDADO)**
- `backend/` - Código do backend
- `src/` - Código do frontend
- `backend/scripts/init_production.py` - Script de inicialização segura

### 2. URL de Deploy
- **Frontend**: `https://desenvolvimento-financeiro.219u5p.easypanel.host`
- **Backend API**: `https://desenvolvimento-financeiro.219u5p.easypanel.host:8000`

### 3. Configuração no EasyPanel

#### ✅ Configuração Recomendada (Git Repository)
1. **Source Type:** Git
2. **Repository URL:** `https://github.com/wolfxweb/finwise-saas-control`
3. **Branch:** `main`
4. **Build Path:** `/`
5. **Docker Compose File:** `docker-compose.prod.yml`

### 4. Variáveis de Ambiente (Configurar no EasyPanel)

#### Obrigatórias:
- `SECRET_KEY`: `finwise-super-secret-key-production-2024-SEU-TOKEN-AQUI`
- `POSTGRES_PASSWORD`: `sua-senha-postgres-muito-segura`
- `VITE_API_URL`: `https://desenvolvimento-financeiro.219u5p.easypanel.host:8000`

#### Opcionais:
- `POSTGRES_DB`: `finwise_saas_db` (padrão)
- `POSTGRES_USER`: `finwise_user` (padrão)
- `BACKEND_CORS_ORIGINS`: `https://desenvolvimento-financeiro.219u5p.easypanel.host,http://localhost:3000`

### 5. Como Funciona a Inicialização

O novo sistema resolve problemas de migrations automaticamente:

```
🚀 Iniciando configuração para produção...
✅ Banco de dados conectado!
📋 Tabelas existentes: []
✅ Todos os modelos importados!
✅ Novas tabelas criadas: ['users', 'companies', 'branches', ...]
✅ Dados básicos verificados!
🎉 Banco de dados configurado com sucesso!
📝 Marcando migrations como executadas...
🔄 Executando migrations pendentes (se houver)...
🌐 Iniciando servidor FastAPI...
```

### 6. Vantagens da Nova Configuração

- ✅ **Sem conflitos de nomes**: Removido `container_name` que causa conflitos
- ✅ **Health checks**: Aguarda BD e Redis estarem prontos
- ✅ **Migrations seguras**: Cria tabelas via SQLAlchemy + Alembic como backup
- ✅ **Logs claros**: Emojis e mensagens descritivas
- ✅ **Variáveis flexíveis**: Configuração via environment variables
- ✅ **Recovery automático**: Continua mesmo se algumas migrations falharem

### 7. Volumes Persistentes
- `postgres_data` - Dados do banco PostgreSQL
- `redis_data` - Cache do Redis

**IMPORTANTE:** Os dados são preservados entre deploys!

### 8. Portas de Acesso
- **Frontend:** Porta 8080
- **Backend API:** Porta 8000

### 9. Monitoramento e Logs

Para verificar se tudo está funcionando:
```bash
# Logs do backend
docker logs <container_backend> -f

# Verificar se API está respondendo
curl https://desenvolvimento-financeiro.219u5p.easypanel.host:8000/health
```

### 10. Troubleshooting

#### Se o deploy falhar:
1. **Verifique as variáveis de ambiente** no EasyPanel
2. **Confira os logs** do container backend
3. **Teste a conexão** com banco de dados

#### Logs importantes a procurar:
- ✅ `Banco de dados conectado!`
- ✅ `Tabelas criadas com sucesso!`
- ✅ `Iniciando servidor FastAPI...`

#### Se aparecer erro de migration:
- **Não se preocupe!** O sistema cria as tabelas via SQLAlchemy
- As migrations são executadas como backup, mas não são críticas

### 11. Atualizações

Para atualizar o sistema:
1. **Faça push** das mudanças no repositório Git
2. **Clique em "Deploy"** no EasyPanel
3. **Aguarde** a nova build completar
4. **Verifique** se tudo está funcionando

### 12. Backup Recomendado

Configure backup automático do volume `postgres_data` no EasyPanel para proteger os dados.

### 13. SSL/HTTPS

O EasyPanel configura SSL automaticamente para os domínios. Certifique-se de que:
- Frontend aceita HTTPS
- Backend está configurado para CORS com HTTPS
- `VITE_API_URL` usa HTTPS

---

## 🚀 Deploy Rápido

1. **Configure no EasyPanel:**
   - Git: `https://github.com/wolfxweb/finwise-saas-control`
   - Branch: `main`
   - Docker Compose: `docker-compose.prod.yml`

2. **Adicione variáveis:**
   - `SECRET_KEY`: Sua chave secreta
   - `POSTGRES_PASSWORD`: Senha segura
   - `VITE_API_URL`: URL da API

3. **Deploy!** 🎉 