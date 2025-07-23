# Deploy FinanceMax SaaS no EasyPanel

## Configuração para Produção

### 1. Arquivos Necessários
- `docker-compose.prod.yml` - Versão otimizada para produção
- `backend/` - Código do backend
- `src/` - Código do frontend
- `nginx.conf` - Configuração do Nginx
- `Dockerfile` e `Dockerfile.frontend` - Imagens Docker

### 2. Configuração no EasyPanel

#### Opção A: Upload do docker-compose.yml
1. Selecione "docker-compose.yml" como source type
2. Faça upload do arquivo `docker-compose.prod.yml`
3. Renomeie para `docker-compose.yml` no EasyPanel

#### Opção B: Git Repository
1. Selecione "Git" como source type
2. Configure:
   - **Repository URL:** URL do seu repositório
   - **Branch:** main/master
   - **Build Path:** `/`
   - **Docker Compose File:** `docker-compose.prod.yml`

### 3. Variáveis de Ambiente (Opcional)
Configure no EasyPanel se necessário:
- `SECRET_KEY` - Chave secreta para JWT
- `BACKEND_CORS_ORIGINS` - Domínios permitidos para CORS
- `VITE_API_URL` - URL da API para o frontend
- `PGADMIN_EMAIL` - Email do pgAdmin
- `PGADMIN_PASSWORD` - Senha do pgAdmin

### 4. Volumes Persistentes
O sistema usa volumes persistentes para:
- `postgres_data` - Dados do banco PostgreSQL
- `redis_data` - Cache do Redis
- `pgadmin_data` - Configurações do pgAdmin

**IMPORTANTE:** Os dados do banco são preservados entre deploys!

### 5. Migrations Automáticas
O backend executa automaticamente:
1. Aguarda o banco estar pronto
2. Executa `alembic upgrade head`
3. Inicia a aplicação

### 6. Health Checks
- PostgreSQL: Verifica se o banco está respondendo
- Redis: Verifica se o cache está funcionando
- Dependências: Backend só inicia após banco e Redis estarem prontos

### 7. Acessos
- **Frontend:** http://seu-dominio:8080
- **Backend API:** http://seu-dominio:8000
- **pgAdmin:** http://seu-dominio:5050
- **Nginx:** http://seu-dominio:80

### 8. Credenciais pgAdmin
- **Email:** admin@finwise.com
- **Senha:** admin123
- **Host:** postgres
- **Porta:** 5432
- **Usuário:** finwise_user
- **Senha:** finwise_password
- **Banco:** finwise_saas_db

### 9. Atualizações
Para atualizar o sistema:
1. Faça push das mudanças no Git (se usando Git)
2. Ou faça upload do novo docker-compose.yml
3. Clique em "Deploy" no EasyPanel
4. As migrations serão executadas automaticamente
5. Os dados do banco são preservados

### 10. Backup
Recomenda-se configurar backup automático do volume `postgres_data` no EasyPanel.

### 11. Domínios
Configure domínios no EasyPanel para:
- Frontend (porta 8080)
- API (porta 8000)
- pgAdmin (porta 5050) - opcional

### 12. SSL/HTTPS
Configure SSL no EasyPanel para os domínios configurados. 