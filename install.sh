#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Store installation progress
PROGRESS_FILE=".install_progress"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

# Function to display tips
display_tip() {
    echo -e "${CYAN}💡 Tip/نکته:${NC} $1"
    echo -e "${CYAN}   $2${NC}"
    echo "----------------------------------------"
}

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
    
    # Remove any leading/trailing whitespace
    domain=$(echo "$domain" | tr -d '[:space:]')
    
    # Check if domain is empty
    if [ -z "$domain" ]; then
        handle_error "Domain name cannot be empty" "نام دامنه نمی‌تواند خالی باشد"
        return 1
    fi

    # Check for valid domain format
    if ! echo "$domain" | grep -qP '^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'; then
        print_message "Invalid domain format: $domain" "فرمت دامنه نامعتبر است: $domain"
        print_message "Domain must be a valid FQDN (e.g., example.com)" "دامنه باید یک FQDN معتبر باشد (مثال: example.com)"
        return 1
    fi
    
    # Check if domain resolves
    print_message "Checking domain DNS resolution..." "در حال بررسی تنظیمات DNS دامنه..."
    
    local server_ip=$(curl -s ifconfig.me)
    local domain_ip=$(dig +short "$domain")
    
    if [ -z "$domain_ip" ]; then
        print_message "Warning: Domain $domain does not resolve to any IP" "هشدار: دامنه $domain به هیچ IP ای متصل نیست"
        read -p "Continue anyway? (y/n) / ادامه می‌دهید؟ (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    elif [ "$domain_ip" != "$server_ip" ]; then
        print_message "Warning: Domain $domain resolves to $domain_ip but server IP is $server_ip" "هشدار: دامنه $domain به IP سرور $server_ip متصل نیست و به $domain_ip متصل است"
        read -p "Continue anyway? (y/n) / ادامه می‌دهید؟ (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            return 1
        fi
    fi

    return 0
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
    
    # Create docker group if it doesn't exist
    if ! getent group docker > /dev/null; then
        groupadd docker || handle_error "Failed to create docker group" "ایجاد گروه docker با خطا مواجه شد"
    fi
    
    # Add current user to docker group with proper error handling
    if [ -n "$SUDO_USER" ]; then
        if ! id -nG "$SUDO_USER" | grep -qw "docker"; then
            usermod -aG docker "$SUDO_USER" || handle_error "Failed to add user to docker group" "افزودن کاربر به گروه docker با خطا مواجه شد"
            print_message "Added $SUDO_USER to docker group" "کاربر $SUDO_USER به گروه docker اضافه شد"
        else
            print_message "User $SUDO_USER is already in docker group" "کاربر $SUDO_USER قبلاً در گروه docker قرار دارد"
        fi
    else
        handle_error "SUDO_USER is not set" "متغیر SUDO_USER تنظیم نشده است"
    fi
    
    # Install latest Node.js using n
    npm install -g n || handle_error "Failed to install n" "نصب n با خطا مواجه شد"
    n stable || handle_error "Failed to install stable Node.js" "نصب Node.js با خطا مواجه شد"
    
    mark_step_completed "system_dependencies"
}

# Function to collect required information
collect_information() {
    clear
    print_message "Welcome to V2Ray Management System Installation" "به نصب‌کننده سیستم مدیریت V2Ray خوش آمدید"
    
    display_tip "Before we begin, make sure you have:" "قبل از شروع، اطمینان حاصل کنید که موارد زیر را دارید:"
    echo "1. A valid domain pointing to this server's IP"
    echo "   یک دامنه معتبر که به IP این سرور اشاره می‌کند"
    echo "2. A Telegram bot token (@BotFather)"
    echo "   توکن ربات تلگرام (@BotFather)"
    echo "3. Your Telegram user ID (@userinfobot)"
    echo "   شناسه کاربری تلگرام شما (@userinfobot)"
    echo

    # Check if .env exists and ask to use it or create new
    if [ -f ".env" ]; then
        display_tip "An existing configuration was found" "یک پیکربندی موجود پیدا شد"
        read -p "Use existing configuration? (y/n) / استفاده از تنظیمات موجود؟ (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            source .env
            print_message "Using existing configuration." "استفاده از تنظیمات موجود."
            return 0
        fi
    fi

    # Domain configuration
    while true; do
        print_message "Domain Configuration" "تنظیمات دامنه"
        display_tip "Your domain should be already pointed to this server's IP" "دامنه شما باید از قبل به IP این سرور اشاره کرده باشد"
        read -p "Enter your domain (e.g., example.com) / دامنه خود را وارد کنید (مثال: example.com): " DOMAIN
        if validate_domain "$DOMAIN"; then
            break
        fi
    done

    # Telegram configuration
    while true; do
        print_message "Telegram Bot Configuration" "تنظیمات ربات تلگرام"
        display_tip "Create a bot using @BotFather if you haven't already" "اگر هنوز ربات نساخته‌اید، با استفاده از @BotFather یک ربات بسازید"
        read -p "Enter Telegram Bot Token / توکن ربات تلگرام را وارد کنید: " BOT_TOKEN
        if validate_bot_token "$BOT_TOKEN"; then
            break
        fi
    done

    print_message "Admin Configuration" "تنظیمات مدیر"
    display_tip "Get your Telegram ID from @userinfobot" "شناسه تلگرام خود را از @userinfobot دریافت کنید"
    read -p "Enter Admin Telegram ID / شناسه تلگرام مدیر را وارد کنید: " ADMIN_ID

    # Database configuration
    print_message "Database Configuration" "تنظیمات پایگاه داده"
    read -p "Enter Database Password (leave empty for random) / رمز پایگاه داده را وارد کنید (برای تصادفی خالی بگذارید): " DB_PASSWORD_INPUT
    if [ -z "$DB_PASSWORD_INPUT" ]; then
        DB_PASSWORD=$(openssl rand -base64 32)
        print_message "Generated random database password" "رمز تصادفی پایگاه داده تولید شد"
    else
        DB_PASSWORD=$DB_PASSWORD_INPUT
    fi

    # JWT configuration
    print_message "Security Configuration" "تنظیمات امنیتی"
    read -p "Enter JWT Secret (leave empty for random) / کلید رمزنگاری JWT را وارد کنید (برای تصادفی خالی بگذارید): " JWT_SECRET_INPUT
    if [ -z "$JWT_SECRET_INPUT" ]; then
        JWT_SECRET=$(openssl rand -base64 64)
        print_message "Generated random JWT secret" "کلید رمزنگاری JWT تصادفی تولید شد"
    else
        JWT_SECRET=$JWT_SECRET_INPUT
    fi

    # Save configuration
    print_message "Saving configuration..." "در حال ذخیره تنظیمات..."
    cat > .env << EOL
# Domain Configuration / تنظیمات دامنه
DOMAIN=$DOMAIN

# Telegram Configuration / تنظیمات تلگرام
BOT_TOKEN=$BOT_TOKEN
ADMIN_ID=$ADMIN_ID

# Database Configuration / تنظیمات پایگاه داده
DB_PASSWORD=$DB_PASSWORD

# Security Configuration / تنظیمات امنیتی
JWT_SECRET=$JWT_SECRET

# Installation Date / تاریخ نصب
INSTALL_DATE=$(date '+%Y-%m-%d %H:%M:%S')
EOL

    # Show configuration summary
    print_message "Configuration Summary:" "خلاصه تنظیمات:"
    echo -e "${YELLOW}Domain/دامنه: ${NC}$DOMAIN"
    echo -e "${YELLOW}Admin ID/شناسه مدیر: ${NC}$ADMIN_ID"
    echo -e "${YELLOW}Database Password/رمز پایگاه داده: ${NC}${RED}(Hidden/مخفی)${NC}"
    echo -e "${YELLOW}JWT Secret/کلید JWT: ${NC}${RED}(Hidden/مخفی)${NC}"
    
    # Ask for confirmation
    read -p "Continue with installation? (y/n) / ادامه نصب؟ (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        handle_error "Installation cancelled by user" "نصب توسط کاربر لغو شد"
    fi
}

# Function to fix Nginx PID issues
fix_nginx_pid() {
    print_message "Fixing Nginx PID configuration..." "در حال رفع مشکل پیکربندی PID نرم‌افزار Nginx..."
    
    # Create nginx pid directory
    mkdir -p /run/nginx
    
    # Create systemd override directory
    mkdir -p /etc/systemd/system/nginx.service.d
    
    # Create override file to handle PID race condition
    cat > /etc/systemd/system/nginx.service.d/override.conf << EOL
[Service]
ExecStartPost=/bin/sleep 0.1
PIDFile=/run/nginx/nginx.pid
EOL

    # Reload systemd and restart nginx
    systemctl daemon-reload
    systemctl restart nginx
}

# Function to setup Nginx base configuration
setup_nginx_base() {
    print_message "Setting up Nginx base configuration..." "در حال پیکربندی پایه Nginx..."
    
    # Backup original nginx.conf if exists
    if [ -f /etc/nginx/nginx.conf ]; then
        cp /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.backup_$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create a clean nginx.conf
    cat > /etc/nginx/nginx.conf << 'EOL'
user www-data;
worker_processes auto;
pid /run/nginx/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 768;
    multi_accept on;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    gzip on;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOL

    # Create necessary directories
    mkdir -p /etc/nginx/sites-available
    mkdir -p /etc/nginx/sites-enabled
    mkdir -p /etc/nginx/conf.d
    mkdir -p /var/log/nginx
    
    # Remove default symbolic link if exists
    rm -f /etc/nginx/sites-enabled/default
    
    # Set proper permissions
    chown -R www-data:www-data /var/log/nginx
    chmod -R 755 /etc/nginx
}

# Function to setup SSL with timeout and proper error handling
setup_ssl() {
    if is_step_completed "ssl_setup"; then
        print_message "SSL already configured." "SSL قبلاً پیکربندی شده است."
        return 0
    fi

    print_message "Setting up SSL certificate..." "در حال راه‌اندازی گواهی SSL..."
    
    # Setup base Nginx configuration first
    setup_nginx_base
    
    # Fix Nginx PID issues
    fix_nginx_pid
    
    # Remove any existing configuration for this domain
    rm -f "/etc/nginx/sites-available/${DOMAIN}.conf"
    rm -f "/etc/nginx/sites-enabled/${DOMAIN}.conf"
    
    # Configure Nginx for initial HTTP setup
    cat > "/etc/nginx/sites-available/${DOMAIN}.conf" << EOL
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    
    root /var/www/html;
    index index.html;

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

    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }
}
EOL

    # Create symbolic link with full path
    ln -sf "/etc/nginx/sites-available/${DOMAIN}.conf" "/etc/nginx/sites-enabled/${DOMAIN}.conf"

    # Test Nginx configuration
    if ! nginx -t; then
        print_message "Attempting to fix Nginx configuration..." "در حال تلاش برای رفع مشکل پیکربندی Nginx..."
        setup_nginx_base
        fix_nginx_pid
        if ! nginx -t; then
            handle_error "Invalid Nginx configuration" "تنظیمات Nginx نامعتبر است"
        fi
    fi

    # Create webroot directory if it doesn't exist
    mkdir -p /var/www/html
    chown -R www-data:www-data /var/www/html

    # Stop Nginx before running Certbot
    systemctl stop nginx

    print_message "Obtaining SSL certificate..." "در حال دریافت گواهی SSL..."
    
    # Run Certbot with proper error handling and timeout
    if ! timeout 300 certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "admin@${DOMAIN}" \
        --domains "${DOMAIN}" \
        --preferred-challenges http; then
        handle_error "SSL certificate generation failed. Please check your domain configuration." "تولید گواهی SSL با خطا مواجه شد. لطفاً تنظیمات دامنه را بررسی کنید."
    fi

    # Update Nginx configuration with SSL
    cat > "/etc/nginx/sites-available/${DOMAIN}.conf" << EOL
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;

    # SSL configuration
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # SSL cert renewal
    location ~ /.well-known/acme-challenge {
        allow all;
        root /var/www/html;
    }
}
EOL

    # Start Nginx
    systemctl start nginx || handle_error "Failed to start Nginx" "راه‌اندازی Nginx با خطا مواجه شد"

    # Verify Nginx is running
    if ! systemctl is-active --quiet nginx; then
        handle_error "Nginx is not running" "Nginx در حال اجرا نیست"
    fi

    # Add certbot renewal cron job
    if ! crontab -l | grep -q "certbot renew"; then
        (crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/certbot renew --quiet --post-hook \"systemctl reload nginx\"") | crontab -
    fi

    mark_step_completed "ssl_setup"
    print_message "SSL certificate installed successfully!" "گواهی SSL با موفقیت نصب شد!"
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
    clear
    print_message "🎉 Installation completed successfully! 🎉" "🎉 نصب با موفقیت انجام شد! 🎉"
    
    echo -e "${GREEN}Access Information / اطلاعات دسترسی:${NC}"
    echo "----------------------------------------"
    echo -e "Website URL / آدرس وبسایت: ${YELLOW}https://$DOMAIN${NC}"
    echo -e "Admin Panel / پنل مدیریت: ${YELLOW}https://$DOMAIN/admin${NC}"
    echo -e "API Endpoint / آدرس API: ${YELLOW}https://$DOMAIN/api${NC}"
    echo "----------------------------------------"
    
    display_tip "Save these credentials in a secure place" "این اطلاعات را در جای امنی ذخیره کنید"
    echo -e "${BLUE}Default Admin Credentials / اطلاعات ورود مدیر:${NC}"
    echo "Username/نام کاربری: admin"
    echo "Password/رمز عبور: admin123"
    echo "----------------------------------------"
    
    display_tip "Security Recommendations:" "توصیه‌های امنیتی:"
    echo "1. Change the default admin password immediately"
    echo "   رمز عبور پیش‌فرض مدیر را فوراً تغییر دهید"
    echo "2. Enable Two-Factor Authentication"
    echo "   احراز هویت دو مرحله‌ای را فعال کنید"
    echo "3. Regularly backup your configuration"
    echo "   از تنظیمات خود به طور منظم پشتیبان تهیه کنید"
    echo "4. Keep your system updated"
    echo "   سیستم خود را به‌روز نگه دارید"
    echo "----------------------------------------"
    
    display_tip "Need help? Join our community:" "نیاز به کمک دارید؟ به انجمن ما بپیوندید:"
    echo "Telegram: @v2ray_management_system"
    echo "GitHub: github.com/v2ray-management-system/support"
}

# Main installation process
main() {
    # Check if running as root
    check_root
    
    print_message "Starting installation process..." "شروع فرآیند نصب..."
    
    # Create progress file if it doesn't exist
    touch "$PROGRESS_FILE"
    
    # First collect all required information
    collect_information
    
    # Show installation plan
    print_message "Installation Plan:" "برنامه نصب:"
    echo "1. Backup existing configurations / پشتیبان‌گیری از تنظیمات موجود"
    echo "2. Install system dependencies / نصب پیش‌نیازهای سیستم"
    echo "3. Configure firewall / پیکربندی فایروال"
    echo "4. Setup SSL certificate / راه‌اندازی گواهی SSL"
    echo "5. Setup Docker containers / راه‌اندازی کانتینرهای Docker"
    echo "6. Configure Telegram webhook / پیکربندی وبهوک تلگرام"
    
    read -p "Press Enter to continue... / برای ادامه Enter را فشار دهید..." -n 1 -r
    echo
    
    # Backup existing configurations
    backup_configs
    
    # Run installation steps with progress indication
    print_message "Step 1/6: Installing system dependencies..." "مرحله 1/6: نصب پیش‌نیازهای سیستم..."
    install_system_dependencies
    
    print_message "Step 2/6: Configuring firewall..." "مرحله 2/6: پیکربندی فایروال..."
    setup_firewall
    
    print_message "Step 3/6: Setting up SSL certificate..." "مرحله 3/6: راه‌اندازی گواهی SSL..."
    setup_ssl
    
    print_message "Step 4/6: Setting up Docker containers..." "مرحله 4/6: راه‌اندازی کانتینرهای Docker..."
    setup_docker
    
    print_message "Step 5/6: Setting up Telegram webhook..." "مرحله 5/6: پیکربندی وبهوک تلگرام..."
    setup_telegram_webhook
    
    print_message "Step 6/6: Finalizing installation..." "مرحله 6/6: نهایی‌سازی نصب..."
    display_completion_info
}

# Start installation
main 