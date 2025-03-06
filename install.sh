#!/bin/bash

# Exit on error
set -e

echo "Starting project installation..."

# Update package list
echo "Updating package list..."
sudo apt-get update

# Install system dependencies
echo "Installing system dependencies..."
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

# Install Docker and Docker Compose if not installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Generate random passwords and keys
DB_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
SECRET_KEY=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 16)

# Initialize environment variables
echo "Setting up environment variables..."
if [ -f .env ]; then
    mv .env .env.backup
    echo "Existing .env file backed up as .env.backup"
fi

# Create new .env file with secure defaults
cat > .env << EOL
# Base
PROJECT_NAME="V2Ray Management System"
VERSION="7.0.0"

# Security
SECRET_KEY="${SECRET_KEY}"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8000"

# Docker Database Configuration
POSTGRES_USER="v2ray_user"
POSTGRES_PASSWORD="${DB_PASSWORD}"
POSTGRES_DB="v2ray_db"
DATABASE_URL="postgresql://v2ray_user:${DB_PASSWORD}@db:5432/v2ray_db"
MAX_CONNECTIONS_COUNT=10
MIN_CONNECTIONS_COUNT=5

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD="${REDIS_PASSWORD}"

# Telegram Bot
TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""

# Metrics
METRICS_RETENTION_DAYS=30
ENABLE_PROMETHEUS=true

# Grafana
GRAFANA_ADMIN_PASSWORD="${GRAFANA_PASSWORD}"

# XUI Panel Configuration
XUI_PANEL_URL="localhost:54321"
XUI_USERNAME="admin"
XUI_PASSWORD="admin"

# Node Exporter
NODE_EXPORTER_ENABLED=true
NODE_EXPORTER_PORT=9100

# API Documentation
DOCS_URL="/api/docs"
REDOC_URL="/api/redoc"
OPENAPI_URL="/api/openapi.json"

# Security Headers
SECURITY_HEADERS=true
HSTS_MAX_AGE=31536000

# Cookie Settings
COOKIE_SECURE=true
COOKIE_HTTPONLY=true
COOKIE_SAMESITE=Lax

# 2FA Settings
ENABLE_2FA=true
OTP_EXPIRY_SECONDS=300

# API Key Settings
API_KEY_EXPIRE_DAYS=365

# Logging
LOG_LEVEL=INFO
ENABLE_ACCESS_LOG=true

# File Upload
MAX_UPLOAD_SIZE=5242880
ALLOWED_UPLOAD_EXTENSIONS=".jpg,.jpeg,.png,.pdf"

# Cache Settings
CACHE_TTL=300
ENABLE_RESPONSE_CACHE=true
EOL

# Set proper permissions
echo "Setting proper permissions..."
chmod 600 .env

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p receipts

# Add Node Exporter service to docker-compose
echo "Adding Node Exporter service..."
cat >> docker-compose.override.yml << EOL
version: '3.8'

services:
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    command:
      - '--path.rootfs=/host'
    network_mode: host
    pid: host
    restart: unless-stopped
    volumes:
      - '/:/host:ro,rslave'
EOL

# Pull Docker images
echo "Pulling Docker images..."
docker-compose pull

# Build and start services
echo "Building and starting services..."
docker-compose up -d --build

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Run database migrations
echo "Running database migrations..."
docker-compose exec api alembic upgrade head

# Create admin user
echo "Creating admin user..."
docker-compose exec api python backend/scripts/create_admin.py

echo "Installation completed successfully!"
echo ""
echo "Important Security Information:"
echo "------------------------------"
echo "Database Name: v2ray_db"
echo "Database User: v2ray_user"
echo "Database Password: $DB_PASSWORD"
echo "Redis Password: $REDIS_PASSWORD"
echo "Grafana Admin Password: $GRAFANA_PASSWORD"
echo ""
echo "These credentials have been automatically added to your .env file."
echo "Please save these credentials in a secure location and delete this message."
echo ""
echo "Services running:"
echo "1. API: http://localhost:8000/api/docs"
echo "2. Grafana: http://localhost:3000"
echo "3. Flower (Celery Monitor): http://localhost:5555"
echo "4. Prometheus: http://localhost:9090"
echo "5. Node Exporter: http://localhost:9100/metrics"
echo ""
echo "Next steps:"
echo "1. Configure your Telegram bot token in .env if you plan to use the bot feature"
echo "2. Update XUI panel credentials in .env"
echo "3. Review and adjust other settings in .env as needed"
echo "4. Log in to Grafana (admin:${GRAFANA_PASSWORD})"
echo ""
echo "For security reasons:"
echo "- Change the admin password after first login"
echo "- Keep your .env file secure and backup your credentials"
echo "- Consider setting up SSL/TLS for production use"
echo "- Set up proper firewall rules"
echo ""
echo "To check service status:"
echo "docker-compose ps"
echo ""
echo "To view logs:"
echo "docker-compose logs -f"
echo ""
echo "To monitor system metrics:"
echo "Visit Grafana at http://localhost:3000 and import the default dashboards"
