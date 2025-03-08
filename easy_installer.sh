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

# Set environment variables
export DEBIAN_FRONTEND=noninteractive
export NODE_VERSION=18.19.1
export PYTHON_VERSION=3.11
export DOCKER_COMPOSE_VERSION=v2.24.5

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

# New function to check system requirements
check_system_requirements() {
    # Check Ubuntu version
    if ! grep -q "Ubuntu" /etc/os-release; then
        display_error "This script is designed for Ubuntu Server"
        exit 1
    fi
    
    # Check minimum system requirements
    local total_mem=$(free -m | awk '/^Mem:/{print $2}')
    local cpu_cores=$(nproc)
    local disk_space=$(df -BG / | awk 'NR==2 {print $4}' | sed 's/G//')
    
    if [ $total_mem -lt 2048 ]; then
        display_warning "Minimum 2GB RAM recommended (found ${total_mem}MB)"
    fi
    
    if [ $cpu_cores -lt 2 ]; then
        display_warning "Minimum 2 CPU cores recommended (found $cpu_cores)"
    fi
    
    if [ $disk_space -lt 20 ]; then
        display_warning "Minimum 20GB disk space recommended (found ${disk_space}GB)"
    fi
}

# Function to install Python with pyenv
install_python() {
    display_info "Installing Python $PYTHON_VERSION with pyenv..."
    
    # Install pyenv dependencies
    apt-get install -y make build-essential libssl-dev zlib1g-dev \
        libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
        libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev \
        libffi-dev liblzma-dev
    
    # Install pyenv
    curl https://pyenv.run | bash
    
    # Add pyenv to PATH
    echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
    echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
    echo 'eval "$(pyenv init -)"' >> ~/.bashrc
    
    # Install Python
    export PATH="$HOME/.pyenv/bin:$PATH"
    eval "$(pyenv init -)"
    pyenv install $PYTHON_VERSION
    pyenv global $PYTHON_VERSION
}

# Function to install Node.js with nvm
install_nodejs() {
    display_info "Installing Node.js $NODE_VERSION with nvm..."
    
    # Install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    
    # Add nvm to PATH
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    
    # Install Node.js
    nvm install $NODE_VERSION
    nvm use $NODE_VERSION
    nvm alias default $NODE_VERSION
}

# Function to setup virtual environment
setup_venv() {
    display_info "Setting up Python virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip setuptools wheel
}

# Function to install and configure Docker
install_docker() {
    display_info "Installing Docker..."
    
    # Remove old versions
    apt-get remove -y docker docker-engine docker.io containerd runc || true
    
    # Install prerequisites
    apt-get install -y apt-transport-https ca-certificates curl software-properties-common
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Install Docker
    apt-get update
    apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Install Docker Compose
    curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    
    # Add user to docker group
    usermod -aG docker $SUDO_USER
    
    # Start and enable Docker service
    systemctl start docker
    systemctl enable docker
}

# Function to setup SSL certificates
setup_ssl() {
    display_info "Setting up SSL certificates..."
    
    if ! command_exists certbot; then
        apt-get install -y certbot
    fi
    
    # Generate self-signed certificate for development
    if [ ! -d "certificates" ]; then
        mkdir -p certificates
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout certificates/privkey.pem \
            -out certificates/fullchain.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    fi
}

# Function to setup firewall
setup_firewall() {
    display_info "Configuring firewall..."
    
    if ! command_exists ufw; then
        apt-get install -y ufw
    fi
    
    # Configure UFW
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow http
    ufw allow https
    ufw allow 8388/tcp  # V2Ray default port
    ufw allow 8388/udp  # V2Ray default port
    
    # Enable firewall
    echo "y" | ufw enable
}

# Function to install frontend dependencies
install_frontend_deps() {
    display_info "Installing frontend dependencies..."
    
    if [ ! -d "frontend" ]; then
        display_error "Frontend directory not found"
        return 1
    fi
    
    cd frontend || return 1
    
    # First try with --legacy-peer-deps
    if ! npm install --legacy-peer-deps; then
        display_warning "Failed to install with --legacy-peer-deps, trying with --force"
        if ! npm install --force; then
            display_error "Failed to install frontend dependencies"
            cd ..
            return 1
        fi
    fi
    
    cd ..
    return 0
}

# Main installation process
main() {
    clear
    display_header "Welcome to V2Ray Management System Installer"
    
    # Check root and system requirements
    check_root
    check_system_requirements
    
    # Update system
    display_step 1 "Updating system packages"
    apt-get update && apt-get upgrade -y
    
    # Install basic utilities
    display_step 2 "Installing basic utilities"
    apt-get install -y build-essential git curl wget unzip
    
    # Install Python
    display_step 3 "Installing Python"
    install_python
    
    # Setup virtual environment
    display_step 4 "Setting up virtual environment"
    setup_venv
    
    # Install Node.js
    display_step 5 "Installing Node.js"
    install_nodejs
    
    # Install Docker
    display_step 6 "Installing Docker"
    install_docker
    
    # Setup SSL
    display_step 7 "Setting up SSL"
    setup_ssl
    
    # Setup firewall
    display_step 8 "Configuring firewall"
    setup_firewall
    
    # Install project dependencies
    display_step 9 "Installing project dependencies"
    pip install -r requirements.txt
    install_frontend_deps
    
    # Generate environment variables
    display_step 10 "Configuring environment"
    if [ ! -f .env ]; then
        if [ ! -f .env.example ]; then
            display_error "No .env.example file found"
            exit 1
        fi
        cp .env.example .env
        # Update environment variables
        sed -i "s/your-secret-key-here/$(generate_random)/g" .env
        sed -i "s/change-me-in-production/$(generate_random)/g" .env
    fi
    
    # Build frontend
    display_step 11 "Building frontend"
    if [ -d "frontend" ]; then
        cd frontend && npm run build && cd ..
    else
        display_error "Frontend directory not found"
        exit 1
    fi
    
    # Start services
    display_step 12 "Starting services"
    if [ ! -f "docker-compose.yml" ]; then
        display_error "docker-compose.yml not found"
        exit 1
    fi
    docker-compose up -d
    
    # Display success message
    display_mrj
    
    # Display access information
    echo -e "${GREEN}V2Ray Management System has been installed successfully!${NC}"
    echo -e "${YELLOW}Access the dashboard at: https://$(curl -s ifconfig.me)${NC}"
    echo -e "${YELLOW}Default admin credentials: admin / admin${NC}"
    echo -e "${RED}IMPORTANT: Please change the default admin password after first login!${NC}"
}

# Run main installation
main "$@"
