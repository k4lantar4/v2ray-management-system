#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}Starting V2Ray Management System Installation...${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Please run as root (sudo ./install.sh)${NC}"
    exit 1
fi

# Function to generate random string
generate_random() {
    openssl rand -hex 16
}

# Update system
echo -e "${YELLOW}Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# Install required packages
echo -e "${YELLOW}Installing required packages...${NC}"
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    git \
    openssl

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
rm get-docker.sh

# Install Docker Compose
echo -e "${YELLOW}Installing Docker Compose...${NC}"
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p backups
chmod 755 backups

# Generate secure values for .env
echo -e "${YELLOW}Generating secure passwords and keys...${NC}"
SECRET_KEY=$(generate_random)
POSTGRES_PASSWORD=$(generate_random)
REDIS_PASSWORD=$(generate_random)
BACKUP_ENCRYPTION_KEY=$(generate_random)
GRAFANA_PASSWORD=$(generate_random)

# Update .env with secure values
echo -e "${YELLOW}Updating environment configuration...${NC}"
sed -i "s/v2ray_secure_password/$POSTGRES_PASSWORD/g" .env
sed -i "s/redis_secure_password/$REDIS_PASSWORD/g" .env
sed -i "s/your_secure_secret_key_here/$SECRET_KEY/g" .env
sed -i "s/your_secure_backup_encryption_key_here/$BACKUP_ENCRYPTION_KEY/g" .env
sed -i "s/admin_secure_password/$GRAFANA_PASSWORD/g" .env

# Update database URL with new password
sed -i "s|postgresql://v2ray_user:v2ray_secure_password@|postgresql://v2ray_user:$POSTGRES_PASSWORD@|g" .env

# Pull and build Docker images
echo -e "${YELLOW}Building Docker containers...${NC}"
docker-compose build

# Start services
echo -e "${YELLOW}Starting Docker services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 30

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose exec -T api alembic upgrade head

echo -e "${GREEN}Installation completed successfully!${NC}"
echo -e "${YELLOW}Important Information:${NC}"
echo "1. Frontend URL: http://localhost:3000"
echo "2. API URL: http://localhost:8000"
echo "3. Grafana URL: http://localhost:3000 (admin:$GRAFANA_PASSWORD)"
echo "4. Flower (Celery Monitor): http://localhost:5555"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Configure your Telegram bot:"
echo "   - Update TELEGRAM_BOT_TOKEN in .env"
echo "   - Update TELEGRAM_CHAT_ID in .env"
echo "2. Update ALLOWED_ORIGINS in .env with your domain"
echo "3. Configure SSL/TLS for production use"
echo ""
echo -e "${RED}IMPORTANT: Save these credentials in a secure location:${NC}"
echo "PostgreSQL Password: $POSTGRES_PASSWORD"
echo "Redis Password: $REDIS_PASSWORD"
echo "Grafana Admin Password: $GRAFANA_PASSWORD"
echo ""
echo -e "${YELLOW}For security reasons, please change these passwords after initial setup.${NC}"
