# 🐳 Docker Setup - FinanceMax

Este documento explica como configurar e executar o projeto FinanceMax usando Docker.

## 📋 Pré-requisitos

- Docker Desktop instalado
- Docker Compose instalado
- Git instalado

## 🚀 Setup Rápido

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd finwise-saas-control
```

### 2. Execute o script de setup
```bash
./scripts/docker-setup.sh
```

O script irá:
- Verificar se Docker está instalado
- Criar arquivo `.env` com configurações padrão
- Construir e iniciar todos os containers
- Mostrar status dos serviços

## 🔧 Configuração Manual

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Configurações do Banco de Dados
POSTGRES_DB=finwise_db
POSTGRES_USER=finwise_user
POSTGRES_PASSWORD=finwise_password

# Configurações do Backend
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Configurações do Frontend
VITE_API_URL=http://localhost:8000

# Configurações do Ambiente
NODE_ENV=production
PYTHON_ENV=production
```

### 2. Construir e Executar

```bash
# Construir todas as imagens
docker-compose build

# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps
```

## 📊 Serviços Disponíveis

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Frontend | 8080 | Aplicação React |
| Backend | 8000 | API FastAPI |
| PostgreSQL | 5432 | Banco de dados |
| Nginx | 80 | Proxy reverso |

## 🔍 URLs de Acesso

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8000
- **Nginx Proxy**: http://localhost:80
- **API Docs**: http://localhost:8000/docs

## 📋 Comandos Úteis

### Gerenciamento de Containers
```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Parar todos os serviços
docker-compose down

# Parar e remover volumes
docker-compose down -v

# Reiniciar um serviço específico
docker-compose restart backend
docker-compose restart frontend
```

### Desenvolvimento
```bash
# Executar apenas o backend para desenvolvimento
docker-compose up backend postgres

# Executar apenas o frontend para desenvolvimento
docker-compose up frontend

# Acessar shell do container
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Banco de Dados
```bash
# Acessar PostgreSQL
docker-compose exec postgres psql -U finwise_user -d finwise_db

# Fazer backup do banco
docker-compose exec postgres pg_dump -U finwise_user finwise_db > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U finwise_user -d finwise_db < backup.sql
```

## 🛠️ Troubleshooting

### Problemas Comuns

#### 1. Porta já em uso
```bash
# Verificar portas em uso
lsof -i :8080
lsof -i :8000
lsof -i :5432

# Parar processo que está usando a porta
kill -9 <PID>
```

#### 2. Containers não iniciam
```bash
# Verificar logs detalhados
docker-compose logs

# Reconstruir containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### 3. Problemas de permissão
```bash
# Dar permissão ao script
chmod +x scripts/docker-setup.sh
```

#### 4. Problemas de rede
```bash
# Verificar redes Docker
docker network ls

# Remover rede e recriar
docker-compose down
docker network prune
docker-compose up -d
```

### Logs de Debug

```bash
# Ver logs de todos os serviços
docker-compose logs

# Ver logs de um serviço específico
docker-compose logs backend
docker-compose logs frontend
docker-compose logs postgres

# Ver logs em tempo real
docker-compose logs -f
```

## 🔒 Segurança

### Para Produção

1. **Altere as senhas padrão** no arquivo `.env`
2. **Use HTTPS** configurando SSL no Nginx
3. **Configure firewall** para permitir apenas portas necessárias
4. **Use secrets** do Docker para senhas sensíveis
5. **Configure backup automático** do banco de dados

### Exemplo de .env para Produção
```env
POSTGRES_PASSWORD=senha-super-segura-aqui
SECRET_KEY=chave-secreta-muito-longa-e-aleatoria
NODE_ENV=production
PYTHON_ENV=production
```

## 📈 Monitoramento

### Health Checks
```bash
# Verificar saúde dos serviços
curl http://localhost:80/health
curl http://localhost:8000/health
```

### Métricas
```bash
# Ver uso de recursos
docker stats

# Ver uso de disco
docker system df
```

## 🗂️ Estrutura de Arquivos

```
finwise-saas-control/
├── Dockerfile.frontend          # Dockerfile do frontend
├── docker-compose.yml           # Orquestração dos serviços
├── nginx.conf                   # Configuração do Nginx
├── .dockerignore               # Arquivos ignorados no build
├── .env                        # Variáveis de ambiente
├── scripts/
│   └── docker-setup.sh         # Script de setup automático
├── backend/
│   ├── Dockerfile              # Dockerfile do backend
│   └── requirements.txt        # Dependências Python
└── README-Docker.md            # Esta documentação
```

## 🤝 Contribuição

Para contribuir com melhorias no Docker:

1. Teste as mudanças localmente
2. Atualize esta documentação
3. Verifique se todos os serviços iniciam corretamente
4. Teste em diferentes ambientes (Linux, macOS, Windows)

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker-compose logs`
2. Consulte a seção de troubleshooting
3. Abra uma issue no repositório
4. Inclua logs e informações do ambiente 