# FinanceMax SaaS - Execução com Docker

## 🚀 Início Rápido

### Pré-requisitos
- Docker
- Docker Compose

### 1. Clone o repositório
```bash
git clone <repository-url>
cd finwise-saas-control
```

### 2. Execute o sistema
```bash
docker-compose up -d
```

### 3. Acesse o sistema
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **Documentação API**: http://localhost:8000/docs

### 4. Login inicial
- **Email**: admin@financemax.com
- **Senha**: admin123

## 📋 Serviços Disponíveis

### Frontend (React)
- **Porta**: 8080
- **URL**: http://localhost:8080
- **Descrição**: Interface do usuário

### Backend (FastAPI)
- **Porta**: 8000
- **URL**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Descrição**: API REST do sistema

### PostgreSQL
- **Porta**: 5432
- **Database**: finwise_saas_db
- **Usuário**: finwise_user
- **Senha**: finwise_password
- **Descrição**: Banco de dados principal

### Redis
- **Porta**: 6379
- **Descrição**: Cache e sessões

### Nginx (Opcional)
- **Porta**: 80, 443
- **Descrição**: Proxy reverso para produção

## 🔧 Configuração

### Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
# Backend
DATABASE_URL=postgresql://finwise_user:finwise_password@postgres:5432/finwise_saas_db
REDIS_URL=redis://redis:6379
SECRET_KEY=your-super-secret-key-for-saas-multiempresa
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
VITE_API_URL=http://localhost:8000

# CORS
BACKEND_CORS_ORIGINS=http://localhost:8080,http://localhost:3000,http://localhost:5173
```

### Comandos Úteis

#### Iniciar todos os serviços
```bash
docker-compose up -d
```

#### Parar todos os serviços
```bash
docker-compose down
```

#### Ver logs
```bash
# Todos os serviços
docker-compose logs -f

# Serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

#### Reiniciar serviço específico
```bash
docker-compose restart backend
docker-compose restart frontend
```

#### Acessar container
```bash
# Backend
docker-compose exec backend bash

# Frontend
docker-compose exec frontend sh

# PostgreSQL
docker-compose exec postgres psql -U finwise_user -d finwise_saas_db
```

#### Limpar dados
```bash
# Parar e remover volumes
docker-compose down -v

# Reconstruir imagens
docker-compose build --no-cache
```

## 🏗️ Arquitetura do Sistema

### Estrutura Multiempresa
- **Isolamento de dados**: Cada empresa tem seus dados isolados
- **Múltiplos CNPJs**: Suporte a matriz e filiais
- **Controle de acesso**: Permissões granulares por usuário

### Módulos Disponíveis
1. **Financeiro**
   - Fluxo de Caixa (R$ 79/mês)
   - Contas a Receber (R$ 59/mês)
   - Contas a Pagar (R$ 59/mês)
   - Centro de Custos (R$ 49/mês)

2. **Estoque**
   - Produtos (R$ 39/mês)
   - Gestão de Estoque (R$ 49/mês)

3. **Cadeia de Suprimentos**
   - Fornecedores (R$ 29/mês)
   - Compras (R$ 39/mês)
   - Expedição (R$ 39/mês)

4. **Vendas**
   - Pedidos (R$ 49/mês)
   - Marketplace (R$ 69/mês)
   - Nota Fiscal (R$ 39/mês)

5. **Gestão**
   - Usuários (R$ 19/mês)
   - Atendimento (R$ 29/mês)

### Planos Disponíveis
- **Básico**: R$ 99/mês (3 usuários, 1 filial)
- **Profissional**: R$ 199/mês (10 usuários, 3 filiais)
- **Empresarial**: R$ 399/mês (50 usuários, 10 filiais)

## 🔐 Segurança

### Autenticação
- JWT Tokens
- Tokens com expiração configurável
- Refresh tokens automáticos

### Isolamento de Dados
- Filtros automáticos por empresa
- Validação de permissões por módulo
- Middleware de autenticação em todas as rotas

### Controle de Acesso
- RBAC (Role-Based Access Control)
- Permissões granulares por módulo
- Validação de assinaturas ativas

## 📊 Monitoramento

### Logs
```bash
# Ver logs em tempo real
docker-compose logs -f

# Logs específicos
docker-compose logs -f backend | grep ERROR
```

### Métricas
- Uso por empresa
- Consumo de recursos
- Performance do sistema

## 🚀 Produção

### Configurações Recomendadas
1. **Alterar SECRET_KEY**
2. **Configurar domínios no CORS**
3. **Configurar SSL/TLS**
4. **Configurar backup do banco**
5. **Configurar monitoramento**

### Comandos para Produção
```bash
# Build para produção
docker-compose -f docker-compose.prod.yml up -d

# Backup do banco
docker-compose exec postgres pg_dump -U finwise_user finwise_saas_db > backup.sql

# Restore do banco
docker-compose exec -T postgres psql -U finwise_user finwise_saas_db < backup.sql
```

## 🐛 Troubleshooting

### Problemas Comuns

#### Backend não inicia
```bash
# Verificar logs
docker-compose logs backend

# Verificar se o banco está pronto
docker-compose exec postgres pg_isready -U finwise_user
```

#### Frontend não carrega
```bash
# Verificar se a API está respondendo
curl http://localhost:8000/health

# Verificar logs do frontend
docker-compose logs frontend
```

#### Problemas de conexão com banco
```bash
# Testar conexão
docker-compose exec backend python -c "
from app.core.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('Conexão OK')
"
```

## 📞 Suporte

Para suporte técnico:
- **Email**: suporte@financemax.com
- **Documentação**: http://localhost:8000/docs
- **Issues**: GitHub Issues

---

**FinanceMax SaaS** - Sistema de Gestão Empresarial Multiempresa 