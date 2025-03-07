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
