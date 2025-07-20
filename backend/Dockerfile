# Dockerfile para o Backend FastAPI SaaS
FROM python:3.11-slim

# Define o diretório de trabalho
WORKDIR /app

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copia os arquivos de dependências
COPY requirements.txt .

# Instala as dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copia o código fonte
COPY . .

# Torna o script de inicialização executável
RUN chmod +x scripts/init_saas.py

# Expõe a porta
EXPOSE 8000

# Script de inicialização
COPY scripts/start.sh /start.sh
RUN chmod +x /start.sh

# Comando para executar a aplicação
CMD ["/start.sh"] 