# V2Ray Management System

A comprehensive management system for V2Ray with a modern web interface, Telegram bot integration, and advanced monitoring capabilities.

## Features

- Modern web interface built with Next.js
- FastAPI backend with PostgreSQL database
- Telegram bot integration
- Automated SSL certificate management
- Docker-based deployment
- Prometheus metrics integration
- Automated backups
- Multi-user support
- Subscription management
- Ticket system

## System Requirements

- Linux-based OS (Ubuntu, Debian, or CentOS recommended)
- 2GB RAM minimum (4GB recommended)
- 20GB free disk space
- Domain name pointed to your server
- Open ports: 80, 443 (for SSL), and your V2Ray ports

## Quick Installation

The system comes with two installation options:

### 1. Easy Installer (Recommended for Non-Technical Users)

Our user-friendly easy installer is designed for non-specialists who want a simple installation process:

- Installs all prerequisites in order of importance
- Handles errors gracefully with clear explanations
- Provides a beautiful typography display upon completion
- Guides you through the entire process with minimal technical knowledge required

```bash
git clone https://github.com/k4lantar4/v2ray-management-system.git && cd v2ray-management-system && chmod +x easy_installer.sh && sudo ./easy_installer.sh
```

Or if you've already cloned the repository:

```bash
chmod +x easy_installer.sh && sudo ./easy_installer.sh
```

For detailed instructions, see [EASY_INSTALL.md](EASY_INSTALL.md).

### 2. Standard Installation

The standard installer for users who prefer the traditional approach:

- Docker and Docker Compose installation
- SSL certificate setup with Let's Encrypt
- Database initialization
- Telegram bot webhook configuration
- Environment configuration
- Service deployment

```bash
git clone https://github.com/k4lantar4/v2ray-management-system.git && cd v2ray-management-system && chmod +x install.sh && ./install.sh
```

Or if you've already cloned the repository:

```bash
chmod +x install.sh && ./install.sh
```

The installer will guide you through:

1. System requirements check and software installation
2. Domain and SSL setup
3. Database configuration
4. Redis setup
5. Telegram bot configuration
6. Admin user creation

## What Gets Installed

### System Software
- Docker
- Docker Compose
- Certbot (for SSL)
- Git

### Main Components
- Frontend (Next.js)
- Backend (FastAPI)
- PostgreSQL Database
- Redis Cache
- Telegram Bot
- Prometheus Metrics
- Nginx Proxy

## Post-Installation

After installation completes, you can access:

- Frontend: https://your-domain.com
- Backend API: https://your-domain.com/api/docs
- Admin Panel: https://your-domain.com/admin

## Security Features

- Automatic SSL certificate management
- Secure cookie handling
- Rate limiting
- Two-factor authentication
- API key management
- Automated backups
- Activity logging

## Environment Configuration

The installer will help you configure:

- Database credentials
- Redis password
- Telegram bot token
- SSL certificates
- Security keys
- Backup settings

## Automatic Updates

SSL certificates will automatically renew before expiration.

## Backup System

The system includes:

- Automated daily backups
- Configurable retention period
- Encrypted backup storage
- One-click restore capability

## Monitoring

- Prometheus metrics integration
- Server resource monitoring
- User activity tracking
- Error logging

## Troubleshooting

### Common Issues

1. **Installation Fails**
   - Check system requirements
   - Ensure ports 80 and 443 are available
   - Verify domain DNS settings

2. **SSL Certificate Issues**
   - Ensure domain points to server
   - Check DNS propagation
   - Verify port 80 is available

3. **Database Connection Issues**
   - Check PostgreSQL logs
   - Verify credentials
   - Ensure ports are open

4. **Telegram Bot Issues**
   - Verify bot token
   - Check webhook setup
   - Ensure SSL is working

### Logs

Important log locations:
- Application logs: `docker-compose logs`
- SSL logs: `/var/log/letsencrypt/`
- Nginx logs: Check Docker container logs

## Support

For issues and support:
- Create an issue in the GitHub repository
- Check the documentation
- Contact the development team

## Security Recommendations

1. **Firewall Setup**
   ```bash
   # Allow only necessary ports
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw allow your-v2ray-port/tcp
   ```

2. **Regular Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade
   
   # Update Docker images
   docker-compose pull
   docker-compose up -d
   ```

3. **Backup Management**
   - Regularly verify backup integrity
   - Store backups off-site
   - Test restoration process

## License

[Your License Here]

# V2Ray Management System Installation Guide

[English](#english) | [فارسی](#persian)

<a name="english"></a>
## English

### Quick Installation

1. Make sure you have a fresh Ubuntu server with root access
2. Run the following command:
```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/v2ray-management/main/install.sh | bash
```

### Requirements
- Ubuntu 20.04 or higher
- Domain name pointed to your server
- Telegram Bot Token
- Admin Telegram ID

### Manual Installation
If you prefer to install manually:

1. Clone the repository:
```bash
git clone https://github.com/your-repo/v2ray-management.git
cd v2ray-management
```

2. Make the installer executable:
```bash
chmod +x install.sh
```

3. Run the installer:
```bash
./install.sh
```

### Features
- Automatic installation of all dependencies
- SSL certificate setup
- Docker container configuration
- Telegram bot webhook setup
- Firewall configuration
- Progress tracking for interrupted installations
- Bilingual interface (English/Persian)

### Troubleshooting
If you encounter any issues during installation:
1. Check the logs in `/var/log/v2ray/`
2. Ensure your domain is properly pointed to the server
3. Verify that ports 80 and 443 are not in use
4. Make sure your Telegram bot token is valid

For support, please open an issue on GitHub.

---

<a name="persian"></a>
## فارسی

### نصب سریع

۱. اطمینان حاصل کنید که یک سرور اوبونتو تازه با دسترسی روت دارید
۲. دستور زیر را اجرا کنید:
```bash
curl -fsSL https://raw.githubusercontent.com/your-repo/v2ray-management/main/install.sh | bash
```

### پیش‌نیازها
- اوبونتو ۲۰.۰۴ یا بالاتر
- دامنه متصل به سرور
- توکن ربات تلگرام
- شناسه عددی مدیر در تلگرام

### نصب دستی
اگر ترجیح می‌دهید به صورت دستی نصب کنید:

۱. کلون کردن مخزن:
```bash
git clone https://github.com/your-repo/v2ray-management.git
cd v2ray-management
```

۲. اجرایی کردن نصب‌کننده:
```bash
chmod +x install.sh
```

۳. اجرای نصب‌کننده:
```bash
./install.sh
```

### ویژگی‌ها
- نصب خودکار تمامی پیش‌نیازها
- راه‌اندازی گواهی SSL
- پیکربندی کانتینرهای داکر
- راه‌اندازی وبهوک ربات تلگرام
- پیکربندی فایروال
- پیگیری پیشرفت برای نصب‌های ناتمام
- رابط دو زبانه (انگلیسی/فارسی)

### عیب‌یابی
در صورت بروز مشکل در حین نصب:
۱. لاگ‌های موجود در `/var/log/v2ray/` را بررسی کنید
۲. اطمینان حاصل کنید که دامنه به درستی به سرور متصل شده است
۳. بررسی کنید که پورت‌های ۸۰ و ۴۴۳ در حال استفاده نباشند
۴. از معتبر بودن توکن ربات تلگرام اطمینان حاصل کنید

برای پشتیبانی، لطفاً در گیت‌هاب issue باز کنید.
