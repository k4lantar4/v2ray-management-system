#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Backup directory
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

# Function to print messages in both languages
print_message() {
    echo -e "[EN] $1"
    echo -e "[FA] $2"
    echo "----------------------------------------"
}

# Function to handle errors
handle_error() {
    print_message "Error: $1" "خطا: $2"
    exit 1
}

# Function to check if service is running
is_service_running() {
    if systemctl is-active --quiet "$1"; then
        return 0
    fi
    return 1
}

# Function to create backup
create_backup() {
    print_message "Creating backup..." "در حال ایجاد نسخه پشتیبان..."
    
    mkdir -p "$BACKUP_DIR" || handle_error "Failed to create backup directory" "ایجاد پوشه پشتیبان با خطا مواجه شد"
    
    # Backup Docker volumes
    if [ "$(docker volume ls -q)" ]; then
        print_message "Backing up Docker volumes..." "در حال تهیه نسخه پشتیبان از حجم‌های داکر..."
        mkdir -p "$BACKUP_DIR/docker_volumes"
        for volume in $(docker volume ls -q); do
            docker run --rm -v "$volume":/source:ro -v "$(pwd)/$BACKUP_DIR/docker_volumes":/backup alpine tar -czf "/backup/$volume.tar.gz" -C /source .
        done
    fi
    
    # Backup Nginx configurations
    if [ -d /etc/nginx ]; then
        print_message "Backing up Nginx configurations..." "در حال تهیه نسخه پشتیبان از تنظیمات Nginx..."
        cp -r /etc/nginx "$BACKUP_DIR/" || handle_error "Failed to backup Nginx configs" "تهیه نسخه پشتیبان از تنظیمات Nginx با خطا مواجه شد"
    fi
    
    # Backup SSL certificates
    if [ -d /etc/letsencrypt ]; then
        print_message "Backing up SSL certificates..." "در حال تهیه نسخه پشتیبان از گواهی‌های SSL..."
        cp -r /etc/letsencrypt "$BACKUP_DIR/" || handle_error "Failed to backup SSL certificates" "تهیه نسخه پشتیبان از گواهی‌های SSL با خطا مواجه شد"
    fi
    
    # Backup environment files
    if [ -f .env ]; then
        cp .env "$BACKUP_DIR/" || handle_error "Failed to backup .env file" "تهیه نسخه پشتیبان از فایل .env با خطا مواجه شد"
    fi
    
    # Create archive of backup
    tar -czf "${BACKUP_DIR}.tar.gz" "$BACKUP_DIR" || handle_error "Failed to create backup archive" "ایجاد آرشیو پشتیبان با خطا مواجه شد"
    rm -rf "$BACKUP_DIR"
    
    print_message "Backup created: ${BACKUP_DIR}.tar.gz" "نسخه پشتیبان ایجاد شد: ${BACKUP_DIR}.tar.gz"
}

# Function to stop and remove Docker containers
cleanup_docker() {
    print_message "Stopping and removing Docker containers..." "در حال متوقف کردن و حذف کانتینرهای داکر..."
    
    # Check if Docker is running
    if ! is_service_running docker; then
        print_message "Docker service is not running" "سرویس Docker در حال اجرا نیست"
        return 0
    fi
    
    # Stop all containers
    if [ "$(docker ps -q)" ]; then
        docker stop $(docker ps -q) || handle_error "Failed to stop Docker containers" "توقف کانتینرهای داکر با خطا مواجه شد"
    fi
    
    # Remove containers and volumes
    docker-compose down -v || print_message "Warning: Failed to remove some Docker components" "هشدار: حذف برخی از اجزای داکر با خطا مواجه شد"
    docker system prune -af --volumes || print_message "Warning: Failed to prune Docker system" "هشدار: پاکسازی سیستم داکر با خطا مواجه شد"
}

# Function to remove Nginx configurations
cleanup_nginx() {
    print_message "Removing Nginx configurations..." "در حال حذف تنظیمات انجین‌ایکس..."
    
    # Check if Nginx is running
    if is_service_running nginx; then
        systemctl stop nginx || handle_error "Failed to stop Nginx" "توقف Nginx با خطا مواجه شد"
    fi
    
    if [ -f /etc/nginx/sites-enabled/$DOMAIN ]; then
        rm -f /etc/nginx/sites-enabled/$DOMAIN || handle_error "Failed to remove Nginx site config" "حذف تنظیمات سایت Nginx با خطا مواجه شد"
    fi
    
    if [ -f /etc/nginx/sites-available/$DOMAIN ]; then
        rm -f /etc/nginx/sites-available/$DOMAIN || handle_error "Failed to remove Nginx site config" "حذف تنظیمات سایت Nginx با خطا مواجه شد"
    fi
    
    systemctl restart nginx || print_message "Warning: Failed to restart Nginx" "هشدار: راه‌اندازی مجدد Nginx با خطا مواجه شد"
}

# Function to remove SSL certificates
cleanup_ssl() {
    print_message "Removing SSL certificates..." "در حال حذف گواهی‌های SSL..."
    
    if [ -n "$DOMAIN" ]; then
        certbot delete --cert-name $DOMAIN --non-interactive || \
            print_message "Warning: Failed to remove SSL certificate" "هشدار: حذف گواهی SSL با خطا مواجه شد"
    fi
}

# Function to remove installation files
cleanup_files() {
    print_message "Removing installation files..." "در حال حذف فایل‌های نصب..."
    
    local files=(".env" ".install_progress" "docker-compose.yml")
    
    for file in "${files[@]}"; do
        if [ -f "$file" ]; then
            rm -f "$file" || print_message "Warning: Failed to remove $file" "هشدار: حذف $file با خطا مواجه شد"
        fi
    done
}

# Function to remove database files
cleanup_database() {
    print_message "Removing database files..." "در حال حذف فایل‌های پایگاه داده..."
    
    # Remove PostgreSQL data directory
    if [ -d /var/lib/docker/volumes/*postgres* ]; then
        rm -rf /var/lib/docker/volumes/*postgres* || \
            print_message "Warning: Failed to remove database files" "هشدار: حذف فایل‌های پایگاه داده با خطا مواجه شد"
    fi
}

# Function to restore backup
restore_backup() {
    local backup_file="$1"
    
    if [ ! -f "$backup_file" ]; then
        handle_error "Backup file not found" "فایل پشتیبان یافت نشد"
    fi
    
    print_message "Restoring from backup..." "در حال بازیابی از نسخه پشتیبان..."
    
    # Extract backup
    local temp_dir="temp_restore_$(date +%s)"
    mkdir -p "$temp_dir"
    tar -xzf "$backup_file" -C "$temp_dir" || handle_error "Failed to extract backup" "استخراج نسخه پشتیبان با خطا مواجه شد"
    
    # Restore configurations
    if [ -d "$temp_dir/nginx" ]; then
        cp -r "$temp_dir/nginx"/* /etc/nginx/ || print_message "Warning: Failed to restore Nginx configs" "هشدار: بازیابی تنظیمات Nginx با خطا مواجه شد"
    fi
    
    if [ -d "$temp_dir/letsencrypt" ]; then
        cp -r "$temp_dir/letsencrypt"/* /etc/letsencrypt/ || print_message "Warning: Failed to restore SSL certificates" "هشدار: بازیابی گواهی‌های SSL با خطا مواجه شد"
    fi
    
    if [ -f "$temp_dir/.env" ]; then
        cp "$temp_dir/.env" ./ || print_message "Warning: Failed to restore .env file" "هشدار: بازیابی فایل .env با خطا مواجه شد"
    fi
    
    # Clean up
    rm -rf "$temp_dir"
    
    print_message "Backup restored successfully" "نسخه پشتیبان با موفقیت بازیابی شد"
}

# Main cleanup function
main() {
    echo -e "${YELLOW}Starting cleanup process / شروع فرآیند پاکسازی${NC}"
    echo "----------------------------------------"
    
    # Source .env file if it exists
    if [ -f .env ]; then
        source .env
    fi
    
    # Create backup before cleanup
    create_backup
    
    # Run cleanup functions
    cleanup_docker
    cleanup_nginx
    cleanup_ssl
    cleanup_database
    cleanup_files
    
    echo "----------------------------------------"
    print_message "Cleanup completed successfully!" "پاکسازی با موفقیت انجام شد!"
    print_message "A backup has been created at: ${BACKUP_DIR}.tar.gz" "یک نسخه پشتیبان در ${BACKUP_DIR}.tar.gz ایجاد شد"
    print_message "To restore from backup, run: ./cleanup.sh --restore ${BACKUP_DIR}.tar.gz" "برای بازیابی از نسخه پشتیبان، دستور زیر را اجرا کنید: ./cleanup.sh --restore ${BACKUP_DIR}.tar.gz"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    handle_error "This script must be run as root" "این اسکریپت باید با دسترسی روت اجرا شود"
fi

# Handle command line arguments
if [ "$1" == "--restore" ]; then
    if [ -z "$2" ]; then
        handle_error "Please specify backup file to restore" "لطفاً فایل پشتیبان برای بازیابی را مشخص کنید"
    fi
    restore_backup "$2"
    exit 0
fi

# Ask for confirmation
read -p "Are you sure you want to clean up the installation? (y/n) / آیا از پاکسازی نصب اطمینان دارید؟ (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    main
else
    print_message "Cleanup cancelled." "پاکسازی لغو شد."
fi 