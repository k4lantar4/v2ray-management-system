# V2Ray Management System Installation Guide

## System Requirements

### Minimum Hardware Requirements
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB free space

### Software Requirements
- Ubuntu 20.04 LTS or newer
- Docker 20.10 or newer
- Docker Compose v2.23.0 or newer
- Git

## Pre-Installation Steps

1. Update your system:
```bash
sudo apt update && sudo apt upgrade -y
```

2. Install required packages:
```bash
sudo apt install -y curl git openssl
```

3. Set correct system time:
```bash
sudo timedatectl set-timezone UTC
```

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/v2ray-management-system.git
cd v2ray-management-system
```

### 2. Configure Environment

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Update the following critical variables in `.env`:
- `SECRET_KEY`: Generate a secure key
- `DATABASE_URL`: Update database credentials
- `TELEGRAM_BOT_TOKEN`: Your Telegram bot token
- `ALLOWED_ORIGINS`: Add your domain
- `REDIS_PASSWORD`: Set a strong password

### 3. Run Installation Script

```bash
sudo chmod +x install.sh
sudo ./install.sh
```

## Post-Installation Steps

### 1. Security Configuration

1. Configure SSL/TLS:
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com
```

2. Update environment variables:
```bash
# Edit .env file
COOKIE_SECURE=true
ALLOWED_ORIGINS="https://yourdomain.com"
```

### 2. Verify Services

Check if all services are running:
```bash
docker-compose ps
```

Access the following URLs:
- Frontend: http://localhost:3000
- API Documentation: http://localhost:8000/api/docs
- Flower Dashboard: http://localhost:5555
- Grafana: http://localhost:3000 (default credentials in install logs)

### 3. Initial Setup

1. Create admin user:
```bash
docker-compose exec api python backend/scripts/create_admin.py
```

2. Configure backup system:
```bash
# Create backup directory with correct permissions
sudo mkdir -p /var/backups/v2ray
sudo chown -R 1000:1000 /var/backups/v2ray
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Check if ports 3000, 8000, 5432, 6379, 5555 are available
   - Modify docker-compose.yml if needed

2. **Permission Issues**
```bash
# Fix permissions for volumes
sudo chown -R $USER:$USER .
sudo chmod -R 755 .
```

3. **Database Connection Issues**
```bash
# Check database logs
docker-compose logs db

# Verify database connection
docker-compose exec db psql -U v2ray_user -d v2ray_db
```

4. **Redis Connection Issues**
```bash
# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### Monitoring

1. **Check Service Logs**
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs api
docker-compose logs frontend
docker-compose logs bot
```

2. **Monitor Resource Usage**
```bash
docker stats
```

## Security Recommendations

1. **Firewall Configuration**
```bash
# Allow only necessary ports
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

2. **Regular Updates**
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Docker images
docker-compose pull
docker-compose up -d
```

3. **Backup Configuration**
- Enable automatic backups in .env
- Set secure BACKUP_ENCRYPTION_KEY
- Configure external backup storage

4. **Access Control**
- Use strong passwords
- Enable 2FA for admin accounts
- Regularly rotate API keys
- Monitor access logs

## Production Deployment Checklist

- [ ] SSL/TLS certificates installed
- [ ] Firewall configured
- [ ] Strong passwords set for all services
- [ ] Backup system configured
- [ ] Monitoring alerts set up
- [ ] Security headers enabled
- [ ] Rate limiting configured
- [ ] Database backups automated
- [ ] Logging properly configured
- [ ] Resource limits set in Docker

## Maintenance

### Regular Maintenance Tasks

1. **Database Maintenance**
```bash
# Vacuum database
docker-compose exec db vacuumdb -U v2ray_user -d v2ray_db --analyze
```

2. **Log Rotation**
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/v2ray
```

3. **Backup Verification**
```bash
# Test backup restoration
docker-compose exec api python backend/scripts/verify_backup.py
```

### Scaling Guidelines

1. **Vertical Scaling**
- Increase container resources in docker-compose.yml
- Adjust database connection pools
- Configure Redis memory limits

2. **Horizontal Scaling**
- Use Docker Swarm or Kubernetes for multiple instances
- Configure load balancing
- Set up database replication

## Support

For issues and support:
1. Check the troubleshooting section
2. Review Docker logs
3. Check GitHub issues
4. Contact support team

## Updating

To update the system:
```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build

# Update with zero downtime
docker-compose up -d --no-deps --build api frontend bot
