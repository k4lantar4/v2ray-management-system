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

# Function to detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$NAME
        VER=$VERSION_ID
    else
        print_error "Cannot detect OS"
        exit 1
    fi
}

# Function to install Docker
install_docker() {
    print_message "Installing Docker..."
    
    if command_exists docker; then
        print_success "Docker is already installed"
        return
    fi
    
    detect_os
    
    case $OS in
        "Ubuntu")
            # Remove old versions
            sudo apt-get remove -y docker docker-engine docker.io containerd runc || true
            
            # Install prerequisites
            sudo apt-get update
            sudo apt-get install -y \
                apt-transport-https \
                ca-certificates \
                curl \
                gnupg \
                lsb-release
            
            # Add Docker's official GPG key
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            
            # Set up stable repository
            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
                $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # Install Docker Engine
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io
            
            # Start Docker service
            sudo systemctl start docker
            sudo systemctl enable docker
            
            # Add current user to docker group
            sudo usermod -aG docker $USER
            ;;
            
        "Debian GNU/Linux")
            # Remove old versions
            sudo apt-get remove -y docker docker-engine docker.io containerd runc || true
            
            # Install prerequisites
            sudo apt-get update
            sudo apt-get install -y \
                apt-transport-https \
                ca-certificates \
                curl \
                gnupg \
                lsb-release
            
            # Add Docker's official GPG key
            curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
            
            # Set up stable repository
            echo \
                "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian \
                $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            
            # Install Docker Engine
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io
            
            # Start Docker service
            sudo systemctl start docker
            sudo systemctl enable docker
            
            # Add current user to docker group
            sudo usermod -aG docker $USER
            ;;
            
        "CentOS Linux")
            # Remove old versions
            sudo yum remove -y docker docker-client docker-client-latest docker-common docker-latest docker-latest-logrotate docker-logrotate docker-engine
            
            # Install prerequisites
            sudo yum install -y yum-utils
            
            # Add Docker repository
            sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
            
            # Install Docker Engine
            sudo yum install -y docker-ce docker-ce-cli containerd.io
            
            # Start Docker service
            sudo systemctl start docker
            sudo systemctl enable docker
            
            # Add current user to docker group
            sudo usermod -aG docker $USER
            ;;
            
        *)
            print_error "Unsupported OS: $OS"
            exit 1
            ;;
    esac
    
    print_success "Docker installed successfully!"
    print_warning "Please log out and log back in for group changes to take effect."
}

# Function to install Docker Compose
install_docker_compose() {
    print_message "Installing Docker Compose..."
    
    if command_exists docker-compose; then
        print_success "Docker Compose is already installed"
        return
    fi
    
    # Download Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Apply executable permissions
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose installed successfully!"
}

# Function to install Certbot and get SSL certificate
setup_ssl() {
    print_message "Setting up SSL with Certbot..."
    
    local domain=$(get_input "Enter your domain name (e.g., example.com)")
    local email=$(get_input "Enter your email address for SSL notifications")
    
    detect_os
    
    # Install Certbot
    case $OS in
        "Ubuntu"|"Debian GNU/Linux")
            sudo apt-get update
            sudo apt-get install -y certbot
            ;;
        "CentOS Linux")
            sudo yum install -y certbot
            ;;
        *)
            print_error "Unsupported OS for Certbot installation: $OS"
            return 1
            ;;
    esac
    
    # Stop any running web server
    docker-compose down || true
    
    # Get SSL certificate
    sudo certbot certonly --standalone -d $domain --email $email --agree-tos --no-eff-email
    
    # Create SSL directory if it doesn't exist
    sudo mkdir -p ./ssl
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/$domain/fullchain.pem ./ssl/
    sudo cp /etc/letsencrypt/live/$domain/privkey.pem ./ssl/
    
    # Set proper permissions
    sudo chown -R $USER:$USER ./ssl
    sudo chmod -R 600 ./ssl
    
    # Update environment variables
    sed -i "s#ALLOWED_ORIGINS=.*#ALLOWED_ORIGINS=\"https://$domain\"#g" .env
    
    print_success "SSL certificates obtained successfully!"
    
    # Setup auto-renewal
    (crontab -l 2>/dev/null; echo "0 0 * * * certbot renew --quiet --deploy-hook 'docker-compose restart'") | crontab -
    
    print_success "SSL auto-renewal configured!"
    
    # Save domain for later use
    echo "$domain" > .domain
}

# Function to setup Telegram bot webhook
setup_telegram_webhook() {
    print_message "Setting up Telegram bot webhook..."
    
    # Get domain from saved file
    local domain=$(cat .domain)
    local bot_token=$(grep TELEGRAM_BOT_TOKEN .env | cut -d '"' -f 2)
    
    if [ -z "$bot_token" ]; then
        print_error "Telegram bot token not found in .env file"
        return 1
    fi
    
    # Set webhook URL
    local webhook_url="https://$domain/api/bot/webhook"
    
    # Call Telegram API to set webhook
    local response=$(curl -s -F "url=$webhook_url" "https://api.telegram.org/bot$bot_token/setWebhook")
    
    if echo "$response" | grep -q '"ok":true'; then
        print_success "Telegram webhook configured successfully!"
    else
        print_error "Failed to set Telegram webhook. Response: $response"
        return 1
    fi
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_message "Checking system requirements..."
    
    # Install Docker if not present
    if ! command_exists docker; then
        install_docker
    fi
    
    # Install Docker Compose if not present
    if ! command_exists docker-compose; then
        install_docker_compose
    fi
    
    # Install Git if not present
    if ! command_exists git; then
        detect_os
        case $OS in
            "Ubuntu"|"Debian GNU/Linux")
                sudo apt-get update
                sudo apt-get install -y git
                ;;
            "CentOS Linux")
                sudo yum install -y git
                ;;
            *)
                print_error "Please install Git manually: https://git-scm.com/downloads"
                exit 1
                ;;
        esac
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
    
    # Check and install system requirements
    check_requirements
    
    # Create environment file
    create_env_file
    
    # Setup SSL certificates
    setup_ssl
    
    # Setup Docker environment
    setup_docker
    
    # Initialize database
    init_database
    
    # Setup Telegram webhook
    setup_telegram_webhook
    
    # Start the system
    print_message "Starting the system..."
    docker-compose up -d
    
    # Get domain from saved file
    local domain=$(cat .domain)
    
    print_success "Installation completed successfully!"
    print_message "You can now access:"
    echo -e "${GREEN}Frontend:${NC} https://$domain"
    echo -e "${GREEN}Backend API:${NC} https://$domain/api/docs"
    echo -e "${GREEN}Admin panel:${NC} https://$domain/admin"
    
    print_warning "Please make sure to:"
    echo "1. Save your admin credentials"
    echo "2. Keep your .env file secure"
    echo "3. Backup your SSL certificates"
    echo "4. Configure your firewall if needed"
    
    # Cleanup
    rm -f .domain
}

# Run the installer
main
