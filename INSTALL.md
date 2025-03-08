# V2Ray Management System - Installation Guide

## Prerequisites

Before installing the V2Ray Management System, ensure your system meets the following requirements:

- Ubuntu 20.04 or higher
- Docker and Docker Compose installed
- Git installed
- At least 2GB of RAM
- At least 20GB of free disk space

## Installation Methods

### Method 1: Using the Easy Installer (Recommended)

1. Clone the repository:
   ```bash
   git clone https://github.com/k4lantar4/v2ray-management-system.git && cd v2ray-management-system && chmod -x -R ./ && ./instal.sh
   
   ```

2. Make the installer script executable:
   ```bash
   chmod +x install.sh
   ```

3. Run the installer:
   ```bash
   ./install.sh
   ```

The installer will:
- Check system requirements
- Install necessary dependencies
- Set up environment variables
- Configure Docker containers
- Start the application

### Method 2: Manual Installation

If you prefer to install manually, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/v2ray-management-system.git
   cd v2ray-management-system
   ```

2. Copy and configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env file with your preferred settings
   ```

3. Build and start Docker containers:
   ```bash
   docker-compose up -d --build
   ```

## Post-Installation

After installation:

1. Access the web interface at `http://localhost:3000`
2. Log in with the default credentials:
   - Username: admin
   - Password: admin123

3. Change the default password immediately after first login.

## Troubleshooting

### Common Issues

1. Port Conflicts
   - Solution: Edit the ports in docker-compose.yml

2. Docker Permission Issues
   ```bash
   sudo usermod -aG docker $USER
   newgrp docker
   ```

3. Database Connection Issues
   - Check if PostgreSQL container is running
   - Verify database credentials in .env file

### Getting Help

If you encounter any issues:
1. Check the logs: `docker-compose logs`
2. Create an issue on GitHub
3. Check the documentation in README.md

## Security Notes

1. Always change default credentials
2. Keep your system and Docker up to date
3. Regularly backup your database
4. Follow security best practices in SECURITY.md

## Uninstallation

To remove the system:

1. Stop and remove containers:
   ```bash
   docker-compose down -v
   ```

2. Remove project files:
   ```bash
   cd ..
   rm -rf v2ray-management-system
   ``` 