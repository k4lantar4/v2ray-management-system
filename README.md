# V2Ray Management System

A comprehensive management system built with FastAPI, PostgreSQL, Redis, and Docker.

## 🚀 Quick Installation

### Automated Installation (Recommended)

1. Clone the repository:
```bash
git clone <repository-url>
cd project-root
```

2. Make the installer executable:
```bash
chmod +x install.sh
```

3. Run the installer:
```bash
./install.sh
```

The installer will:
- Install all system dependencies
- Set up Docker and Docker Compose
- Configure PostgreSQL and Redis
- Set up environment variables with secure defaults
- Build and start all services
- Run database migrations
- Create an admin user
- Generate and save secure passwords

### Manual Installation

If you prefer to install components manually, follow these steps:

#### Prerequisites

1. System Requirements:
   - Ubuntu Server (20.04 LTS or later)
   - Sudo privileges
   - At least 2GB RAM
   - 10GB free disk space

2. Install system dependencies:
```bash
sudo apt-get update
sudo apt-get install -y \
    python3.10 \
    python3.10-venv \
    python3-pip \
    postgresql \
    postgresql-contrib \
    redis-server \
    git \
    curl \
    build-essential \
    libpq-dev
```

3. Install Docker and Docker Compose:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Project Setup

1. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configurations
nano .env
```

2. Build and start services:
```bash
docker-compose up -d --build
```

3. Run database migrations:
```bash
docker-compose exec api alembic upgrade head
```

4. Create admin user:
```bash
docker-compose exec api python backend/scripts/create_admin.py
```

## 🌐 Services

The project includes several services:

- **API** (Port 8000): FastAPI backend service
  - API Documentation: http://localhost:8000/api/docs
  - ReDoc Documentation: http://localhost:8000/api/redoc

- **Database** (Port 5432): PostgreSQL database
  - Persistent storage for application data
  - Automated backups

- **Redis** (Port 6379): Caching and message broker
  - Session management
  - Rate limiting
  - Task queue broker

- **Celery**: Background task processing
  - Worker: Processes background tasks
  - Beat: Schedules periodic tasks
  - Flower (Port 5555): Task monitoring interface

- **Monitoring**:
  - Prometheus (Port 9090): Metrics collection
  - Grafana (Port 3000): Metrics visualization
  - System and application metrics monitoring

- **Telegram Bot**: Automated notifications and commands
  - User notifications
  - Administrative commands
  - Status updates

## 🔧 Configuration

### Environment Variables

Key configurations in `.env`:

```ini
# Base
PROJECT_NAME="V2Ray Management System"
VERSION="7.0.0"

# Security
SECRET_KEY="your-secret-key"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database
POSTGRES_USER="v2ray_user"
POSTGRES_PASSWORD="your-password"
POSTGRES_DB="v2ray_db"

# Redis
REDIS_PASSWORD="your-redis-password"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-bot-token"
```

### Security Recommendations

1. **Passwords**:
   - Change default passwords
   - Use strong, unique passwords
   - Regularly rotate credentials

2. **Firewall**:
   - Configure UFW or similar
   - Only expose necessary ports
   - Use reverse proxy for production

3. **SSL/TLS**:
   - Set up HTTPS in production
   - Use Let's Encrypt for certificates
   - Enable HSTS

## 📊 Monitoring

### Grafana Dashboards

1. Access Grafana:
   - URL: http://localhost:3000
   - Default credentials: admin:your-grafana-password

2. Available dashboards:
   - System Metrics
   - Application Performance
   - User Analytics
   - Service Health

### Prometheus Metrics

- Endpoint: http://localhost:9090
- Custom metrics available at /metrics

## 🔍 Troubleshooting

### Common Issues

1. Service not starting:
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

2. Database connection issues:
```bash
# Check database status
docker-compose exec db pg_isready

# View database logs
docker-compose logs db
```

3. Redis connection issues:
```bash
# Check Redis status
docker-compose exec redis redis-cli ping

# View Redis logs
docker-compose logs redis
```

### Maintenance

1. Backup database:
```bash
docker-compose exec db pg_dump -U v2ray_user v2ray_db > backup.sql
```

2. Restore database:
```bash
docker-compose exec -T db psql -U v2ray_user v2ray_db < backup.sql
```

3. Update services:
```bash
git pull
docker-compose up -d --build
docker-compose exec api alembic upgrade head
```

## 📝 License

[Your License Here]

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

- GitHub Issues: [Repository Issues]
- Documentation: [Link to Docs]
- Community: [Link to Community]
