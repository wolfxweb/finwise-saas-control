#!/bin/bash

# Script de Deploy do FinanceMax SaaS
# Uso: ./scripts/deploy-saas.sh [start|stop|restart|logs|clean]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens coloridas
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}  FinanceMax SaaS Deploy Script${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Função para verificar se o Docker está rodando
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker não está rodando. Inicie o Docker e tente novamente."
        exit 1
    fi
}

# Função para verificar se o Docker Compose está disponível
check_docker_compose() {
    if ! docker-compose --version > /dev/null 2>&1; then
        print_error "Docker Compose não está disponível."
        exit 1
    fi
}

# Função para iniciar o sistema
start_system() {
    print_message "Iniciando FinanceMax SaaS..."
    
    # Verificar se já está rodando
    if docker-compose ps | grep -q "Up"; then
        print_warning "Sistema já está rodando!"
        return
    fi
    
    # Iniciar serviços
    docker-compose up -d
    
    print_message "Aguardando serviços inicializarem..."
    sleep 10
    
    # Verificar status
    if docker-compose ps | grep -q "Up"; then
        print_message "✅ Sistema iniciado com sucesso!"
        print_message "🌐 Frontend: http://localhost:8080"
        print_message "🔧 Backend: http://localhost:8000"
        print_message "📚 API Docs: http://localhost:8000/docs"
        print_message "📧 Login: admin@financemax.com"
        print_message "🔑 Senha: admin123"
    else
        print_error "❌ Erro ao iniciar o sistema"
        docker-compose logs
        exit 1
    fi
}

# Função para parar o sistema
stop_system() {
    print_message "Parando FinanceMax SaaS..."
    docker-compose down
    print_message "✅ Sistema parado com sucesso!"
}

# Função para reiniciar o sistema
restart_system() {
    print_message "Reiniciando FinanceMax SaaS..."
    docker-compose down
    docker-compose up -d
    print_message "✅ Sistema reiniciado com sucesso!"
}

# Função para mostrar logs
show_logs() {
    print_message "Mostrando logs do sistema..."
    docker-compose logs -f
}

# Função para limpar dados
clean_system() {
    print_warning "⚠️  Esta ação irá remover todos os dados!"
    read -p "Tem certeza? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_message "Limpando dados do sistema..."
        docker-compose down -v
        docker system prune -f
        print_message "✅ Dados limpos com sucesso!"
    else
        print_message "Operação cancelada."
    fi
}

# Função para verificar status
check_status() {
    print_message "Verificando status do sistema..."
    
    if docker-compose ps | grep -q "Up"; then
        print_message "✅ Sistema está rodando"
        
        # Verificar cada serviço
        services=("postgres" "redis" "backend" "frontend")
        for service in "${services[@]}"; do
            if docker-compose ps $service | grep -q "Up"; then
                print_message "  ✅ $service: OK"
            else
                print_error "  ❌ $service: DOWN"
            fi
        done
        
        # Verificar conectividade
        if curl -s http://localhost:8000/health > /dev/null; then
            print_message "  ✅ API: Respondendo"
        else
            print_error "  ❌ API: Não responde"
        fi
        
    else
        print_error "❌ Sistema não está rodando"
    fi
}

# Função para backup
backup_database() {
    print_message "Fazendo backup do banco de dados..."
    
    if ! docker-compose ps postgres | grep -q "Up"; then
        print_error "PostgreSQL não está rodando!"
        exit 1
    fi
    
    timestamp=$(date +"%Y%m%d_%H%M%S")
    backup_file="backup_${timestamp}.sql"
    
    docker-compose exec -T postgres pg_dump -U finwise_user finwise_saas_db > "$backup_file"
    
    if [ $? -eq 0 ]; then
        print_message "✅ Backup criado: $backup_file"
    else
        print_error "❌ Erro ao criar backup"
    fi
}

# Função para mostrar ajuda
show_help() {
    print_header
    echo
    echo "Uso: $0 [COMANDO]"
    echo
    echo "Comandos disponíveis:"
    echo "  start     - Iniciar o sistema"
    echo "  stop      - Parar o sistema"
    echo "  restart   - Reiniciar o sistema"
    echo "  status    - Verificar status"
    echo "  logs      - Mostrar logs"
    echo "  backup    - Fazer backup do banco"
    echo "  clean     - Limpar todos os dados"
    echo "  help      - Mostrar esta ajuda"
    echo
    echo "Exemplos:"
    echo "  $0 start"
    echo "  $0 logs"
    echo "  $0 status"
}

# Função principal
main() {
    print_header
    
    # Verificar dependências
    check_docker
    check_docker_compose
    
    # Processar comando
    case "${1:-help}" in
        start)
            start_system
            ;;
        stop)
            stop_system
            ;;
        restart)
            restart_system
            ;;
        status)
            check_status
            ;;
        logs)
            show_logs
            ;;
        backup)
            backup_database
            ;;
        clean)
            clean_system
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Comando inválido: $1"
            show_help
            exit 1
            ;;
    esac
}

# Executar função principal
main "$@" 