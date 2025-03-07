#!/bin/bash

# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║                     V2Ray Management System Installer                     ║
# ║                                                                           ║
# ║  This script installs all prerequisites for the V2Ray Management System   ║
# ║  in order from least to most important, handling errors along the way.    ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to display fancy headers
display_header() {
    local text="$1"
    local width=80
    local padding=$(( (width - ${#text} - 4) / 2 ))
    local padding_right=$padding
    
    if [ $(( (width - ${#text} - 4) % 2 )) -ne 0 ]; then
        padding_right=$((padding + 1))
    fi
    
    echo -e "\n${BOLD}${BLUE}╔═$(printf '═%.0s' $(seq 1 $((width - 4))))═╗${NC}"
    echo -e "${BOLD}${BLUE}║${WHITE} ${text}${BLUE} $(printf '%*s' $padding_right '')║${NC}"
    echo -e "${BOLD}${BLUE}╚═$(printf '═%.0s' $(seq 1 $width))═╝${NC}\n"
}

# Function to display step information
display_step() {
    echo -e "${BOLD}${CYAN}[STEP $1/${TOTAL_STEPS}]${NC} ${YELLOW}$2${NC}"
}

# Function to display success message
display_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to display error message
display_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to display info message
display_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Function to display warning message
display_warning() {
    echo -e "${PURPLE}⚠ $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        display_error "Please run as root (sudo ./easy_installer.sh)"
        exit 1
    fi
}

# Function to generate random string
generate_random() {
    openssl rand -hex 16
}

# Function to handle errors
handle_error() {
    local error_message="$1"
    local suggestion="$2"
    
    display_error "$error_message"
    
    if [ -n "$suggestion" ]; then
        display_info "Suggestion: $suggestion"
    fi
    
    echo -e "${YELLOW}Do you want to continue anyway? (y/n)${NC}"
    read -r response
    if [[ "$response" =~ ^[Nn]$ ]]; then
        display_info "Installation aborted by user."
        exit 1
    fi
    
    display_warning "Continuing installation despite error..."
}

# Function to display progress bar
progress_bar() {
    local duration=$1
    local steps=20
    local sleep_duration=$(echo "scale=3; $duration/$steps" | bc)
    
    echo -ne "${YELLOW}["
    for ((i=0; i<$steps; i++)); do
        echo -ne "${GREEN}#${NC}"
        sleep $sleep_duration
    done
    echo -e "${YELLOW}] ${GREEN}Done!${NC}"
}

# Function to display the M-R-J typography
display_mrj() {
    echo -e "\n${BOLD}${GREEN}"
    echo "  ███╗   ███╗      ██████╗       ██╗"
    echo "  ████╗ ████║      ██╔══██╗      ██║"
    echo "  ██╔████╔██║█████╗██████╔╝█████╗██║"
    echo "  ██║╚██╔╝██║╚════╝██╔══██╗╚════╝██║"
    echo "  ██║ ╚═╝ ██║      ██║  ██║      ██║"
    echo "  ╚═╝     ╚═╝      ╚═╝  ╚═╝      ╚═╝"
    echo -e "${NC}\n"
    echo -e "${BOLD}${CYAN}V2Ray Management System has been successfully installed!${NC}\n"
}

# Set total number of installation steps
TOTAL_STEPS=12

# Display welcome message
clear
display_header "Welcome to V2Ray Management System Installer"
echo -e "${YELLOW}This installer will set up all prerequisites for the V2Ray Management System.${NC}"
echo -e "${YELLOW}It is designed to be user-friendly and handle errors gracefully.${NC}"
echo -e "\n${BOLD}${WHITE}Press Enter to continue...${NC}"
read

# Check if running as root
check_root

# Step 1: Update system packages
display_step 1 "Updating system packages"
apt-get update && apt-get upgrade -y
if [ $? -ne 0 ]; then
    handle_error "Failed to update system packages" "Check your internet connection and try again"
fi
display_success "System packages updated successfully"

# Step 2: Install basic utilities (least important)
display_step 2 "Installing basic utilities"
apt-get install -y \
    curl \
    wget \
    git \
    openssl \
    ca-certificates \
    gnupg \
    lsb-release \
    apt-transport-https \
    software-properties-common

if [ $? -ne 0 ]; then
    handle_error "Failed to install basic utilities" "Try running 'apt-get update' manually and check for errors"
fi
display_success "Basic utilities installed successfully"

# Step 3: Install Python and pip
display_step 3 "Installing Python and pip"
apt-get install -y python3 python3-pip python3-venv
if [ $? -ne 0 ]; then
    handle_error "Failed to install Python" "Try installing Python manually: 'apt-get install python3'"
fi
display_success "Python and pip installed successfully"

# Step 4: Install Node.js and npm
display_step 4 "Installing Node.js and npm"
if ! command_exists node; then
    display_info "Node.js not found, installing..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
    if [ $? -ne 0 ]; then
        handle_error "Failed to install Node.js" "Try installing Node.js manually from https://nodejs.org/"
    fi
else
    display_info "Node.js is already installed"
fi
display_success "Node.js and npm installed successfully"

# Step 5: Install Docker
display_step 5 "Installing Docker"
if ! command_exists docker; then
    display_info "Docker not found, installing..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    if [ $? -ne 0 ]; then
        handle_error "Failed to install Docker" "Try installing Docker manually: https://docs.docker.com/engine/install/"
    fi
    rm get-docker.sh
else
    display_info "Docker is already installed"
fi
display_success "Docker installed successfully"

# Step 6: Install Docker Compose
display_step 6 "Installing Docker Compose"
if ! command_exists docker-compose; then
    display_info "Docker Compose not found, installing..."
    curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    if [ $? -ne 0 ]; then
        handle_error "Failed to install Docker Compose" "Try installing Docker Compose manually: https://docs.docker.com/compose/install/"
    fi
else
    display_info "Docker Compose is already installed"
fi
display_success "Docker Compose installed successfully"

# Step 7: Create necessary directories
display_step 7 "Creating necessary directories"
mkdir -p backups
chmod 755 backups
display_success "Directories created successfully"

# Step 8: Configure environment
display_step 8 "Configuring environment"
if [ ! -f .env ]; then
    display_info "Creating .env file from .env.example..."
    cp .env.example .env
    
    # Generate secure values for .env
    display_info "Generating secure passwords and keys..."
    SECRET_KEY=$(generate_random)
    POSTGRES_PASSWORD=$(generate_random)
    REDIS_PASSWORD=$(generate_random)
    BACKUP_ENCRYPTION_KEY=$(generate_random)
    GRAFANA_PASSWORD=$(generate_random)
    
    # Update .env with secure values
    sed -i "s/your-secret-key-here/$SECRET_KEY/g" .env
    
    # Add database configuration
    echo "# Database Configuration" >> .env
    echo "POSTGRES_USER=v2ray_user" >> .env
    echo "POSTGRES_PASSWORD=$POSTGRES_PASSWORD" >> .env
    echo "POSTGRES_DB=v2ray_db" >> .env
    echo "DATABASE_URL=postgresql://v2ray_user:$POSTGRES_PASSWORD@db:5432/v2ray_db" >> .env
    
    # Add Redis password
    sed -i "s/REDIS_PASSWORD=$/REDIS_PASSWORD=$REDIS_PASSWORD/g" .env
    
    # Add backup encryption key
    sed -i "s/BACKUP_ENCRYPTION_KEY=\"\"/BACKUP_ENCRYPTION_KEY=\"$BACKUP_ENCRYPTION_KEY\"/g" .env
    
    # Add Grafana password
    echo "# Grafana Configuration" >> .env
    echo "GRAFANA_ADMIN_PASSWORD=$GRAFANA_PASSWORD" >> .env
else
    display_info ".env file already exists, skipping configuration"
fi
display_success "Environment configured successfully"

# Step 9: Install frontend dependencies
display_step 9 "Installing frontend dependencies"
if [ -d "frontend" ]; then
    cd frontend
    npm install
    if [ $? -ne 0 ]; then
        cd ..
        handle_error "Failed to install frontend dependencies" "Try running 'cd frontend && npm install' manually"
    else
        cd ..
        display_success "Frontend dependencies installed successfully"
    fi
else
    handle_error "Frontend directory not found" "Make sure you're in the correct directory"
fi

# Step 10: Run system tests
display_step 10 "Running system tests"
python3 test_system.py
if [ $? -ne 0 ]; then
    handle_error "System tests failed" "Check the error messages above and fix any issues"
else
    display_success "System tests passed successfully"
fi

# Step 11: Build Docker images (most important)
display_step 11 "Building Docker images"
display_info "This may take a few minutes..."
docker-compose build
if [ $? -ne 0 ]; then
    handle_error "Failed to build Docker images" "Check Docker installation and try again"
else
    display_success "Docker images built successfully"
fi

# Step 12: Start services
display_step 12 "Starting services"
docker-compose up -d
if [ $? -ne 0 ]; then
    handle_error "Failed to start services" "Check Docker logs: 'docker-compose logs'"
else
    display_success "Services started successfully"
    
    # Wait for services to be ready
    display_info "Waiting for services to be ready..."
    progress_bar 10
    
    # Run database migrations
    display_info "Running database migrations..."
    docker-compose exec -T api alembic upgrade head
    if [ $? -ne 0 ]; then
        handle_error "Failed to run database migrations" "Try running migrations manually: 'docker-compose exec api alembic upgrade head'"
    else
        display_success "Database migrations completed successfully"
    fi
fi

# Display M-R-J typography
display_mrj

# Display important information
echo -e "${BOLD}${WHITE}Important Information:${NC}"
echo -e "${YELLOW}1. Frontend URL: ${WHITE}http://localhost:3000${NC}"
echo -e "${YELLOW}2. API URL: ${WHITE}http://localhost:8000${NC}"
echo -e "${YELLOW}3. API Documentation: ${WHITE}http://localhost:8000/api/docs${NC}"
echo -e "${YELLOW}4. Grafana URL: ${WHITE}http://localhost:3000${NC} (admin:$GRAFANA_PASSWORD)"
echo -e "${YELLOW}5. Flower (Celery Monitor): ${WHITE}http://localhost:5555${NC}"
echo -e "\n${BOLD}${WHITE}Next Steps:${NC}"
echo -e "${YELLOW}1. Configure your Telegram bot:${NC}"
echo -e "   - Update TELEGRAM_BOT_TOKEN in .env"
echo -e "   - Update TELEGRAM_CHAT_ID in .env"
echo -e "${YELLOW}2. Update ALLOWED_ORIGINS in .env with your domain${NC}"
echo -e "${YELLOW}3. Configure SSL/TLS for production use${NC}"
echo -e "\n${BOLD}${RED}IMPORTANT: Save these credentials in a secure location:${NC}"
echo -e "${YELLOW}PostgreSQL Password: ${WHITE}$POSTGRES_PASSWORD${NC}"
echo -e "${YELLOW}Redis Password: ${WHITE}$REDIS_PASSWORD${NC}"
echo -e "${YELLOW}Grafana Admin Password: ${WHITE}$GRAFANA_PASSWORD${NC}"
echo -e "\n${BOLD}${YELLOW}For security reasons, please change these passwords after initial setup.${NC}"
echo -e "\n${BOLD}${GREEN}Installation completed successfully!${NC}"
