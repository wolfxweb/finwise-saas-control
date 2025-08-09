# Deploy FinWise SaaS no EasyPanel

## ✅ Problema das Migrations e PostgreSQL Resolvido!

Agora o sistema possui inicialização robusta que resolve automaticamente:
- ❌ Erro de autenticação PostgreSQL
- ❌ Problemas de migrations 
- ❌ Usuários não criados
- ✅ Criação automática de empresa master
- ✅ Criação automática do usuário admin

## 📁 Arquivos Necessários

Para o deploy funcionar, você precisa destes arquivos:

1. `docker-compose.prod.yml` - Configuração de produção
2. `backend/scripts/init_production.py` - Script de inicialização robusto
3. `init-db.sql` - Script de inicialização do PostgreSQL
4. `production.env.example` - Exemplo de variáveis de ambiente

## 🌐 URL de Deploy

- **Frontend:** https://desenvolvimento-financeiro.219u5p.easypanel.host
- **Backend API:** https://desenvolvimento-financeiro.219u5p.easypanel.host:8000
- **Painel Admin:** https://desenvolvimento-financeiro.219u5p.easypanel.host/admin/login

## ⚙️ Configuração no EasyPanel

### 1. Criar Projeto

1. **Tipo:** Git Repository
2. **Repository:** Seu repositório Git
3. **Branch:** main
4. **Docker Compose File:** `docker-compose.prod.yml`

### 2. Variáveis de Ambiente

#### **Obrigatórias:**
```bash
SECRET_KEY=seu-secret-key-super-seguro-aqui
POSTGRES_PASSWORD=sua-senha-postgres-muito-segura
VITE_API_URL=https://desenvolvimento-financeiro.219u5p.easypanel.host:8000
```

#### **Opcionais (com valores padrão):**
```bash
POSTGRES_DB=finwise_saas_db
POSTGRES_USER=finwise_user
BACKEND_CORS_ORIGINS=https://desenvolvimento-financeiro.219u5p.easypanel.host
```

### 3. Configuração de Domínios

#### **Frontend:**
- **Host:** `desenvolvimento-financeiro.219u5p.easypanel.host`
- **Path:** `/`
- **Port:** `8080`
- **Service:** `frontend`

#### **Backend API:**
- **Host:** `desenvolvimento-financeiro.219u5p.easypanel.host`
- **Path:** `/api` (ou usar porta diferente)
- **Port:** `8000`
- **Service:** `backend`

## 🔧 Como Funciona a Inicialização

### Script PostgreSQL (`init-db.sql`)
```sql
-- Cria usuário finwise_user se não existir
-- Define senha correta
-- Cria banco finwise_saas_db
-- Concede todas as permissões
```

### Script Python (`init_production.py`)
```python
# 1. Aguarda PostgreSQL ficar disponível
# 2. Importa todos os modelos SQLAlchemy
# 3. Cria todas as tabelas
# 4. Cria módulos do sistema
# 5. Cria planos (Básico, Profissional, Empresarial)
# 6. Cria empresa master (FinanceMax System)
# 7. Cria usuário master admin (wolfxweb@gmail.com)
```

### Logs de Exemplo
```
🚀 Iniciando configuração completa para produção...
⏳ Aguardando serviços dependentes...
🔧 Executando script de inicialização...
✅ Banco de dados conectado!
✅ Todos os modelos importados!
✅ Tabelas criadas: ['users', 'companies', 'plans'...]
✅ Módulos criados com sucesso!
✅ Planos criados com sucesso!
✅ Empresa master criada: FinanceMax System
✅ Usuário master criado com sucesso!
🎉 CONFIGURAÇÃO MASTER CONCLUÍDA!
📧 Login Master: wolfxweb@gmail.com
🔑 Senha Master: wolfx2020
```

## 🎯 Vantagens da Nova Configuração

1. **Sem Conflitos de Containers**: Nomes dinâmicos no EasyPanel
2. **Health Checks**: Aguarda serviços estarem 100% prontos
3. **Migrations Seguras**: Não quebra se já executadas
4. **Logs Claros**: Mostra exatamente o que está acontecendo
5. **Variáveis Flexíveis**: Valores padrão para facilitar deploy
6. **Auto-Recovery**: Reinicia automaticamente em caso de falha
7. **Inicialização PostgreSQL**: Garante usuário e banco corretos

## 💾 Volumes Persistentes

- `postgres_data` - Dados do PostgreSQL
- `redis_data` - Cache Redis

## 🔄 Atualizações

Para atualizar a aplicação:
1. Faça push para o repositório Git
2. No EasyPanel, clique em "Redeploy"
3. Aguarde o build e deploy automático

## 🌐 Portas de Acesso

- **Frontend:** 8080
- **Backend:** 8000  
- **PostgreSQL:** 5432 (interno)
- **Redis:** 6379 (interno)

## 📊 Monitoramento e Logs

Acesse os logs no EasyPanel:
- **Backend:** Mostra inicialização e API
- **Frontend:** Mostra requisições HTTP
- **PostgreSQL:** Mostra queries (se habilitado)
- **Redis:** Mostra cache operations

## 🆘 Troubleshooting

### Erro de Autenticação PostgreSQL
```
FATAL: password authentication failed for user "finwise_user"
```
**Solução:** 
1. Verifique se `POSTGRES_PASSWORD` está definida
2. Limpe volumes: `docker-compose down -v`
3. Rebuild: `docker-compose up --build`

### Frontend não carrega
**Verificar:**
1. `VITE_API_URL` aponta para a URL correta
2. Backend está rodando na porta 8000
3. CORS configurado corretamente

### Backend não conecta ao banco
**Verificar:**
1. `DATABASE_URL` está correta
2. PostgreSQL está healthy
3. Variáveis de ambiente estão definidas

### Usuário admin não existe
**Solução:**
1. Verificar logs do `init_production.py`
2. Recriar containers: `docker-compose up --force-recreate`

## 💾 Backup Recomendado

Configure backup automático dos volumes:
- `postgres_data` - Dados essenciais
- `redis_data` - Cache (opcional)

## 🔒 SSL/HTTPS

O EasyPanel configura SSL automaticamente:
1. Certificados Let's Encrypt
2. Redirecionamento HTTP → HTTPS
3. Renovação automática

## 🚀 Deploy Rápido

```bash
# 1. Configure as variáveis no EasyPanel
SECRET_KEY=seu-secret-key-unico
POSTGRES_PASSWORD=senha-muito-segura
VITE_API_URL=https://seu-dominio.easypanel.host:8000

# 2. Deploy usando docker-compose.prod.yml
# 3. Aguarde a inicialização completa
# 4. Acesse: https://seu-dominio.easypanel.host/admin/login

# Credenciais:
# Email: wolfxweb@gmail.com
# Senha: wolfx2020
```

---

✅ **Sistema pronto para produção!**
🔐 **Acesso master configurado automaticamente**
🚀 **Deploy sem complicações no EasyPanel** 