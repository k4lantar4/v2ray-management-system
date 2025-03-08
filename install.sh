#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Store installation progress
PROGRESS_FILE=".install_progress"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

# Function to display messages in both English and Persian
print_message() {
    echo -e "${BLUE}[EN]${NC} $1"
    echo -e "${BLUE}[FA]${NC} $2"
    echo "----------------------------------------"
}

# Function to handle errors
handle_error() {
    print_message "Error: $1" "خطا: $2"
    exit 1
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        handle_error "This script must be run as root" "این اسکریپت باید با دسترسی روت اجرا شود"
    fi
}

# Function to validate domain
validate_domain() {
    local domain=$1
    if ! echo "$domain" | grep -qP '(?=^.{4,253}$)(^(?:[a-zA-Z0-9](?:(?:[a-zA-Z0-9\-]){0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$)'; then
        handle_error "Invalid domain format" "فرمت دامنه نامعتبر است"
    fi
    
    # Check if domain resolves to server IP
    local server_ip=$(curl -s ifconfig.me)
    local domain_ip=$(dig +short "$domain")
    
    if [[ "$domain_ip" != "$server_ip" ]]; then
        print_message "Warning: Domain $domain does not resolve to server IP $server_ip" "هشدار: دامنه $domain به IP سرور $server_ip متصل نیست"
        read -p "Continue anyway? (y/n) / ادامه می‌دهید؟ (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Function to validate Telegram bot token
validate_bot_token() {
    local token=$1
    if ! curl -s "https://api.telegram.org/bot$token/getMe" | grep -q "\"ok\":true"; then
        handle_error "Invalid Telegram bot token" "توکن ربات تلگرام نامعتبر است"
    fi
}

# Function to backup existing configurations
backup_configs() {
    print_message "Backing up existing configurations..." "در حال تهیه نسخه پشتیبان از تنظیمات موجود..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup Nginx configs
    if [ -d /etc/nginx/sites-available ]; then
        cp -r /etc/nginx/sites-available "$BACKUP_DIR/"
    fi
    
    # Backup SSL certificates
    if [ -d /etc/letsencrypt ]; then
        cp -r /etc/letsencrypt "$BACKUP_DIR/"
    fi
    
    # Backup environment files
    if [ -f .env ]; then
        cp .env "$BACKUP_DIR/"
    fi
}

# Function to check if a step is completed
is_step_completed() {
    if [ -f "$PROGRESS_FILE" ]; then
        grep -q "^$1=done$" "$PROGRESS_FILE"
        return $?
    fi
    return 1
}

# Function to mark a step as completed
mark_step_completed() {
    echo "$1=done" >> "$PROGRESS_FILE"
}

# Function to check and install system dependencies
install_system_dependencies() {
    if is_step_completed "system_dependencies"; then
        print_message "System dependencies already installed." "پیش‌نیازهای سیستم قبلاً نصب شده‌اند."
        return 0
    fi

    print_message "Installing system dependencies..." "در حال نصب پیش‌نیازهای سیستم..."
    
    # Update package list
    apt-get update || handle_error "Failed to update package list" "به‌روزرسانی لیست پکیج‌ها با خطا مواجه شد"
    
    # Install essential packages
    for package in curl git nginx certbot python3-certbot-nginx nodejs npm docker.io docker-compose ufw; do
        print_message "Installing $package..." "در حال نصب $package..."
        apt-get install -y $package || handle_error "Failed to install $package" "نصب $package با خطا مواجه شد"
    done

    # Enable and start Docker
    systemctl enable docker || handle_error "Failed to enable Docker" "فعال‌سازی Docker با خطا مواجه شد"
    systemctl start docker || handle_error "Failed to start Docker" "راه‌اندازی Docker با خطا مواجه شد"
    
    # Add current user to docker group
    usermod -aG docker $SUDO_USER || handle_error "Failed to add user to docker group" "افزودن کاربر به گروه docker با خطا مواجه شد"
    
    # Install latest Node.js using n
    npm install -g n || handle_error "Failed to install n" "نصب n با خطا مواجه شد"
    n stable || handle_error "Failed to install stable Node.js" "نصب Node.js با خطا مواجه شد"
    
    mark_step_completed "system_dependencies"
}

# Function to collect required information
collect_information() {
    if [ -f ".env" ]; then
        print_message "Configuration file found. Using existing settings." "فایل تنظیمات یافت شد. از تنظیمات موجود استفاده می‌شود."
        source .env
        return 0
    fi

    print_message "Please provide the following information:" "لطفاً اطلاعات زیر را وارد کنید:"
    
    while true; do
        read -p "Domain name / نام دامنه: " DOMAIN
        if validate_domain "$DOMAIN"; then
            break
        fi
    done
    
    while true; do
        read -p "Telegram Bot Token / توکن ربات تلگرام: " BOT_TOKEN
        if validate_bot_token "$BOT_TOKEN"; then
            break
        fi
    done
    
    read -p "Admin Telegram ID / شناسه تلگرام مدیر: " ADMIN_ID
    
    # Generate random passwords
    DB_PASSWORD=$(openssl rand -base64 32)
    JWT_SECRET=$(openssl rand -base64 64)
    
    # Save to .env file
    cat > .env << EOL
DOMAIN=$DOMAIN
BOT_TOKEN=$BOT_TOKEN
ADMIN_ID=$ADMIN_ID
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
EOL
}

# Function to setup SSL with timeout
setup_ssl() {
    if is_step_completed "ssl_setup"; then
        print_message "SSL already configured." "SSL قبلاً پیکربندی شده است."
        return 0
    fi

    print_message "Setting up SSL certificate..." "در حال راه‌اندازی گواهی SSL..."
    
    # Configure Nginx with error handling
    if ! nginx -t; then
        handle_error "Invalid Nginx configuration" "تنظیمات Nginx نامعتبر است"
    fi
    
    # Configure Nginx
    cat > /etc/nginx/sites-available/$DOMAIN << EOL
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOL

    ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    nginx -t && systemctl restart nginx

    # Get SSL certificate with timeout
    timeout 300 certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || \
        handle_error "SSL certificate generation failed" "تولید گواهی SSL با خطا مواجه شد"
    
    mark_step_completed "ssl_setup"
}

# Function to setup Telegram webhook with retry
setup_telegram_webhook() {
    if is_step_completed "telegram_webhook"; then
        print_message "Telegram webhook already configured." "وبهوک تلگرام قبلاً پیکربندی شده است."
        return 0
    fi

    print_message "Setting up Telegram webhook..." "در حال راه‌اندازی وبهوک تلگرام..."
    
    local max_retries=3
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s "https://api.telegram.org/bot$BOT_TOKEN/setWebhook?url=https://$DOMAIN/api/webhook" | grep -q "\"ok\":true"; then
            mark_step_completed "telegram_webhook"
            return 0
        fi
        retry_count=$((retry_count + 1))
        sleep 5
    done
    
    handle_error "Failed to set Telegram webhook" "تنظیم وبهوک تلگرام با خطا مواجه شد"
}

# Function to setup Docker containers with health checks
setup_docker() {
    if is_step_completed "docker_setup"; then
        print_message "Docker containers already setup." "کانتینرهای داکر قبلاً راه‌اندازی شده‌اند."
        return 0
    fi

    print_message "Setting up Docker containers..." "در حال راه‌اندازی کانتینرهای داکر..."
    
    # Create docker-compose.yml with health checks
    cat > docker-compose.yml << EOL
version: '3.8'

services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
      - BOT_TOKEN=${BOT_TOKEN}
      - ADMIN_ID=${ADMIN_ID}
      - DOMAIN=${DOMAIN}
    depends_on:
      db:
        condition: service_healthy
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:13
    environment:
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
EOL

    # Build and start containers with timeout
    timeout 600 docker-compose up -d --build || handle_error "Failed to start Docker containers" "راه‌اندازی کانتینرهای داکر با خطا مواجه شد"
    
    # Wait for containers to be healthy
    print_message "Waiting for containers to be ready..." "در حال انتظار برای آماده شدن کانتینرها..."
    sleep 30
    
    if ! docker-compose ps | grep -q "Up"; then
        handle_error "Containers failed to start properly" "کانتینرها به درستی راه‌اندازی نشدند"
    fi
    
    mark_step_completed "docker_setup"
}

# Function to configure firewall with validation
setup_firewall() {
    if is_step_completed "firewall_setup"; then
        print_message "Firewall already configured." "فایروال قبلاً پیکربندی شده است."
        return 0
    fi

    print_message "Configuring firewall..." "در حال پیکربندی فایروال..."
    
    # Reset UFW
    ufw --force reset
    
    # Configure UFW
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3000/tcp
    ufw allow 8080/tcp
    
    # Enable UFW
    echo "y" | ufw enable
    
    # Verify UFW status
    if ! ufw status | grep -q "Status: active"; then
        handle_error "Failed to enable firewall" "فعال‌سازی فایروال با خطا مواجه شد"
    fi
    
    mark_step_completed "firewall_setup"
}

# Function to display completion information
display_completion_info() {
    print_message "Installation completed successfully!" "نصب با موفقیت انجام شد!"
    echo -e "${GREEN}Access Information / اطلاعات دسترسی:${NC}"
    echo "----------------------------------------"
    echo -e "Website URL / آدرس وبسایت: ${YELLOW}https://$DOMAIN${NC}"
    echo -e "Admin Panel / پنل مدیریت: ${YELLOW}https://$DOMAIN/admin${NC}"
    echo -e "API Endpoint / آدرس API: ${YELLOW}https://$DOMAIN/api${NC}"
    echo "----------------------------------------"
    echo -e "${BLUE}Default Admin Credentials / اطلاعات ورود مدیر:${NC}"
    echo "Username/نام کاربری: admin"
    echo "Password/رمز عبور: admin123"
    echo "----------------------------------------"
    echo -e "${RED}IMPORTANT: Please change the default admin password immediately!${NC}"
    echo -e "${RED}مهم: لطفاً رمز عبور پیش‌فرض مدیر را فوراً تغییر دهید!${NC}"
}

# Main installation process
main() {
    # Check if running as root
    check_root
    
    print_message "Starting installation process..." "شروع فرآیند نصب..."
    
    # Create progress file if it doesn't exist
    touch "$PROGRESS_FILE"
    
    # Backup existing configurations
    backup_configs
    
    # Run installation steps
    install_system_dependencies
    collect_information
    setup_firewall
    setup_ssl
    setup_docker
    setup_telegram_webhook
    
    display_completion_info
}

# Start installation
main 