#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to print messages in both languages
print_message() {
    echo -e "[EN] $1"
    echo -e "[FA] $2"
    echo "----------------------------------------"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check OS and version
check_os() {
    if [[ -f /etc/os-release ]]; then
        . /etc/os-release
        if [[ "$ID" == "ubuntu" ]]; then
            # Check Ubuntu version
            version_id=$(echo "$VERSION_ID" | cut -d. -f1)
            if [[ $version_id -ge 20 ]]; then
                print_message "✓ Ubuntu $VERSION_ID detected" "✓ اوبونتو $VERSION_ID شناسایی شد"
                return 0
            else
                print_message "✗ Ubuntu version must be 20.04 or higher" "✗ نسخه اوبونتو باید ۲۰.۰۴ یا بالاتر باشد"
                return 1
            fi
        fi
    fi
    print_message "✗ This script requires Ubuntu" "✗ این اسکریپت نیاز به اوبونتو دارد"
    return 1
}

# Check system memory
check_memory() {
    local total_mem=$(free -m | awk '/^Mem:/{print $2}')
    local min_mem=2048  # 2GB minimum
    if [[ $total_mem -ge $min_mem ]]; then
        print_message "✓ Sufficient memory ($total_mem MB)" "✓ حافظه کافی ($total_mem مگابایت)"
        return 0
    fi
    print_message "✗ Insufficient memory. Minimum 2GB required" "✗ حافظه ناکافی. حداقل ۲ گیگابایت نیاز است"
    return 1
}

# Check disk space
check_disk_space() {
    local free_space=$(df -m / | awk 'NR==2 {print $4}')
    local min_space=20480  # 20GB minimum
    if [[ $free_space -ge $min_space ]]; then
        print_message "✓ Sufficient disk space ($free_space MB)" "✓ فضای دیسک کافی ($free_space مگابایت)"
        return 0
    fi
    print_message "✗ Insufficient disk space. Minimum 20GB required" "✗ فضای دیسک ناکافی. حداقل ۲۰ گیگابایت نیاز است"
    return 1
}

# Check CPU cores
check_cpu() {
    local cpu_cores=$(nproc)
    if [[ $cpu_cores -ge 2 ]]; then
        print_message "✓ Sufficient CPU cores ($cpu_cores)" "✓ تعداد هسته‌های پردازنده کافی ($cpu_cores)"
        return 0
    fi
    print_message "✗ Insufficient CPU cores. Minimum 2 cores required" "✗ تعداد هسته‌های پردازنده ناکافی. حداقل ۲ هسته نیاز است"
    return 1
}

# Check if ports are available and accessible
check_ports() {
    local ports=(80 443 3000 8080)
    local all_ports_available=true
    
    # Check if ports are in use
    for port in "${ports[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            print_message "✗ Port $port is in use" "✗ پورت $port در حال استفاده است"
            all_ports_available=false
        fi
    done
    
    # Check if ports are accessible through firewall
    if command_exists "ufw"; then
        for port in "${ports[@]}"; do
            if ! ufw status | grep -q "$port"; then
                print_message "✗ Port $port is not allowed in firewall" "✗ پورت $port در فایروال مجاز نیست"
                all_ports_available=false
            fi
        done
    fi
    
    if [[ "$all_ports_available" == "true" ]]; then
        print_message "✓ All required ports are available" "✓ تمام پورت‌های مورد نیاز در دسترس هستند"
        return 0
    fi
    return 1
}

# Check internet connectivity and DNS
check_internet() {
    # Check basic internet connectivity
    if ! ping -c 1 google.com >/dev/null 2>&1; then
        print_message "✗ No internet connection" "✗ عدم اتصال به اینترنت"
        return 1
    fi
    
    # Check DNS resolution
    if ! nslookup google.com >/dev/null 2>&1; then
        print_message "✗ DNS resolution not working" "✗ حل نام دامنه کار نمی‌کند"
        return 1
    fi
    
    # Check HTTPS connectivity
    if ! curl -s https://google.com >/dev/null 2>&1; then
        print_message "✗ HTTPS connectivity issues" "✗ مشکل در اتصال HTTPS"
        return 1
    fi
    
    print_message "✓ Internet connection and DNS working" "✓ اتصال به اینترنت و DNS برقرار است"
    return 0
}

# Check required software versions
check_software_versions() {
    local all_versions_ok=true
    
    # Check Docker version
    if command_exists "docker"; then
        local docker_version=$(docker --version | awk '{print $3}' | cut -d. -f1)
        if [[ $docker_version -lt 20 ]]; then
            print_message "✗ Docker version too old. Version 20+ required" "✗ نسخه Docker قدیمی است. نسخه ۲۰ یا بالاتر نیاز است"
            all_versions_ok=false
        fi
    else
        print_message "✗ Docker not installed" "✗ Docker نصب نشده است"
        all_versions_ok=false
    fi
    
    # Check Node.js version
    if command_exists "node"; then
        local node_version=$(node -v | cut -d. -f1 | tr -d 'v')
        if [[ $node_version -lt 16 ]]; then
            print_message "✗ Node.js version too old. Version 16+ required" "✗ نسخه Node.js قدیمی است. نسخه ۱۶ یا بالاتر نیاز است"
            all_versions_ok=false
        fi
    else
        print_message "✗ Node.js not installed" "✗ Node.js نصب نشده است"
        all_versions_ok=false
    fi
    
    if [[ "$all_versions_ok" == "true" ]]; then
        print_message "✓ All required software versions are compatible" "✓ نسخه‌های نرم‌افزارهای مورد نیاز سازگار هستند"
        return 0
    fi
    return 1
}

# Check system timezone
check_timezone() {
    local timezone=$(timedatectl | grep "Time zone" | awk '{print $3}')
    print_message "Current timezone: $timezone" "منطقه زمانی فعلی: $timezone"
    
    # Ask if timezone should be changed
    read -p "Do you want to change the timezone? (y/n) / آیا می‌خواهید منطقه زمانی را تغییر دهید؟ (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Show available timezones
        timedatectl list-timezones
        read -p "Enter timezone / منطقه زمانی را وارد کنید: " new_timezone
        if timedatectl set-timezone "$new_timezone"; then
            print_message "✓ Timezone changed successfully" "✓ منطقه زمانی با موفقیت تغییر کرد"
            return 0
        else
            print_message "✗ Failed to change timezone" "✗ تغییر منطقه زمانی با خطا مواجه شد"
            return 1
        fi
    fi
    return 0
}

# Check system locale
check_locale() {
    if ! locale -a | grep -q "en_US.utf8"; then
        print_message "✗ English locale not available" "✗ لوکال انگلیسی در دسترس نیست"
        return 1
    fi
    if ! locale -a | grep -q "fa_IR.utf8"; then
        print_message "✗ Persian locale not available" "✗ لوکال فارسی در دسترس نیست"
        return 1
    fi
    print_message "✓ Required locales are available" "✓ لوکال‌های مورد نیاز در دسترس هستند"
    return 0
}

# Main function
main() {
    echo -e "${YELLOW}System Requirements Check / بررسی پیش‌نیازهای سیستم${NC}"
    echo "----------------------------------------"
    
    local all_checks_passed=true
    
    # Run all checks
    check_os || all_checks_passed=false
    check_memory || all_checks_passed=false
    check_disk_space || all_checks_passed=false
    check_cpu || all_checks_passed=false
    check_ports || all_checks_passed=false
    check_internet || all_checks_passed=false
    check_software_versions || all_checks_passed=false
    check_timezone || all_checks_passed=false
    check_locale || all_checks_passed=false
    
    echo "----------------------------------------"
    if [[ "$all_checks_passed" == "true" ]]; then
        echo -e "${GREEN}All requirements met. You can proceed with installation.${NC}"
        echo -e "${GREEN}تمام پیش‌نیازها برآورده شده‌اند. می‌توانید نصب را شروع کنید.${NC}"
        exit 0
    else
        echo -e "${RED}Some requirements are not met. Please fix the issues above.${NC}"
        echo -e "${RED}برخی از پیش‌نیازها برآورده نشده‌اند. لطفاً مشکلات بالا را رفع کنید.${NC}"
        exit 1
    fi
}

# Run main function
main 