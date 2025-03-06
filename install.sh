#!/bin/bash

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    echo -e "${BLUE}[INSTALLER]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_message "Checking system requirements..."
    
    local requirements=(
        "docker:Docker is not installed. Please install Docker first: https://docs.docker.com/get-docker/"
        "docker-compose:Docker Compose is not installed. Please install Docker Compose: https://docs.docker.com/compose/install/"
        "git:Git is not installed. Please install Git: https://git-scm.com/downloads"
    )
    
    local all_requirements_met=true
    
    for req in "${requirements[@]}"; do
        IFS=":" read -r cmd msg <<< "$req"
        if ! command_exists "$cmd"; then
            print_error "$msg"
            all_requirements_met=false
        fi
    done
    
    if [ "$all_requirements_met" = false ]; then
        print_error "Please install the missing requirements and run the installer again."
        exit 1
    fi
    
    print_success "All system requirements are met!"
}

# Function to generate a random string
generate_random_string() {
    openssl rand -hex 32
}

# Function to get user input with default value
get_input() {
    local prompt="$1"
    local default="$2"
    local value
    
    if [ -n "$default" ]; then
        prompt="$prompt (default: $default)"
    fi
    
    read -p "$prompt: " value
    
    if [ -z "$value" ] && [ -n "$default" ]; then
        value="$default"
    fi
    
    echo "$value"
}

# Function to get password input
get_password_input() {
    local prompt="$1"
    local password
    
    while true; do
        read -s -p "$prompt: " password
        echo
        read -s -p "Confirm password: " password2
        echo
        
        if [ "$password" = "$password2" ]; then
            break
        else
            print_error "Passwords do not match. Please try again."
        fi
    done
    
    echo "$password"
}

# Function to create .env file
create_env_file() {
    print_message "Setting up environment variables..."
    
    # Generate secret key
    local secret_key=$(generate_random_string)
    
    # Database configuration
    print_message "Database Configuration"
    local db_user=$(get_input "Enter database username" "v2ray_user")
    local db_password=$(get_password_input "Enter database password")
    local db_name=$(get_input "Enter database name" "v2ray_db")
    local db_port=$(get_input "Enter database port" "5432")
    
    # Redis configuration
    print_message "Redis Configuration"
    local redis_password=$(get_password_input "Enter Redis password (leave empty for no password)")
    
    # Telegram bot configuration
    print_message "Telegram Bot Configuration"
    local telegram_token=$(get_input "Enter Telegram bot token")
    local telegram_chat_id=$(get_input "Enter Telegram chat ID (optional)")
    
    # Create .env file
    cat > .env << EOL
# Base
PROJECT_NAME="V2Ray Management System"
VERSION="7.0.0"

# Security
SECRET_KEY="${secret_key}"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8000"

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD="${redis_password}"

# Database
DATABASE_URL="postgresql://${db_user}:${db_password}@postgres:${db_port}/${db_name}"
MAX_CONNECTIONS_COUNT=10
MIN_CONNECTIONS_COUNT=5

# Telegram Bot
TELEGRAM_BOT_TOKEN="${telegram_token}"
TELEGRAM_CHAT_ID="${telegram_chat_id}"

# Metrics
METRICS_RETENTION_DAYS=30
ENABLE_PROMETHEUS=true

# API Documentation
DOCS_URL="/api/docs"
REDOC_URL="/api/redoc"
OPENAPI_URL="/api/openapi.json"

# Security Headers
SECURITY_HEADERS=true
HSTS_MAX_AGE=31536000

# Cookie Settings
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=Lax

# 2FA Settings
ENABLE_2FA=true
OTP_EXPIRY_SECONDS=300

# API Key Settings
API_KEY_EXPIRE_DAYS=365

# Logging
LOG_LEVEL=INFO
ENABLE_ACCESS_LOG=true

# File Upload
MAX_UPLOAD_SIZE=5242880
ALLOWED_UPLOAD_EXTENSIONS=".jpg,.jpeg,.png,.pdf"

# Cache Settings
CACHE_TTL=300
ENABLE_RESPONSE_CACHE=true

# Backup Settings
BACKUP_DIR="backups"
BACKUP_RETENTION_DAYS=30
BACKUP_COMPRESSION_LEVEL=9
BACKUP_SCHEDULE_ENABLED=true
BACKUP_SCHEDULE_CRON="0 0 * * *"
MAX_BACKUP_SIZE=1073741824
BACKUP_ENCRYPTION_KEY="${secret_key}"
EOL
    
    print_success "Environment file created successfully!"
}

# Function to setup Docker environment
setup_docker() {
    print_message "Setting up Docker environment..."
    
    # Pull required images
    print_message "Pulling required Docker images..."
    docker-compose pull
    
    # Build custom images
    print_message "Building custom images..."
    docker-compose build
    
    print_success "Docker environment setup completed!"
}

# Function to initialize the database
init_database() {
    print_message "Initializing database..."
    
    # Start the database container
    docker-compose up -d postgres
    
    # Wait for database to be ready
    print_message "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    print_message "Running database migrations..."
    docker-compose run --rm backend alembic upgrade head
    
    # Create admin user
    print_message "Creating admin user..."
    local admin_email=$(get_input "Enter admin email" "admin@example.com")
    local admin_password=$(get_password_input "Enter admin password")
    
    docker-compose run --rm backend python scripts/create_admin.py "$admin_email" "$admin_password"
    
    print_success "Database initialization completed!"
}

# Main installation function
main() {
    print_message "Starting V2Ray Management System installation..."
    
    # Check system requirements
    check_requirements
    
    # Create environment file
    create_env_file
    
    # Setup Docker environment
    setup_docker
    
    # Initialize database
    init_database
    
    # Start the system
    print_message "Starting the system..."
    docker-compose up -d
    
    print_success "Installation completed successfully!"
    print_message "You can now access:"
    echo -e "${GREEN}Frontend:${NC} http://localhost:3000"
    echo -e "${GREEN}Backend API:${NC} http://localhost:8000/api/docs"
    echo -e "${GREEN}Admin panel:${NC} http://localhost:3000/admin"
    
    print_warning "Please make sure to:"
    echo "1. Save your admin credentials"
    echo "2. Keep your .env file secure"
    echo "3. Configure your firewall if needed"
    echo "4. Set up SSL/TLS for production use"
}

# Run the installer
main
