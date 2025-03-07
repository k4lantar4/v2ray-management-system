# V2Ray Management System - Easy Installation Guide

This guide provides simple instructions for installing the V2Ray Management System using the easy installer script. The installer is designed to be user-friendly and suitable for non-technical users.

## Prerequisites

- A computer or server running Ubuntu 20.04 LTS or newer
- Internet connection
- Sudo/root access

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/v2ray-management-system.git
cd v2ray-management-system
```

### 2. Run the Easy Installer

```bash
sudo ./easy_installer.sh
```

That's it! The installer will:

- Check and install all required dependencies
- Configure the environment
- Build and start all necessary services
- Run database migrations
- Display important information and next steps

## What the Installer Does

The easy installer handles everything in a user-friendly way:

1. **System Updates**: Updates your system packages
2. **Basic Utilities**: Installs essential utilities
3. **Python**: Installs Python and pip
4. **Node.js**: Installs Node.js and npm
5. **Docker**: Installs Docker and Docker Compose
6. **Environment Setup**: Configures environment variables
7. **Frontend Dependencies**: Installs frontend dependencies
8. **System Tests**: Runs tests to ensure everything is working
9. **Docker Images**: Builds Docker images
10. **Services**: Starts all services
11. **Database**: Runs database migrations

## After Installation

After successful installation, you'll see:

- The M-R-J logo indicating successful installation
- URLs for accessing different parts of the system
- Important credentials that you should save securely
- Next steps for configuration

## Accessing the System

- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/api/docs
- **Grafana**: http://localhost:3000 (credentials provided after installation)
- **Flower (Celery Monitor)**: http://localhost:5555

## Troubleshooting

If you encounter any issues during installation:

1. The installer will provide specific error messages and suggestions
2. You'll have the option to continue despite errors or abort the installation
3. For persistent issues, check the Docker logs:
   ```bash
   docker-compose logs
   ```

## Security Recommendations

After installation:

1. Change the default passwords
2. Configure SSL/TLS for production use
3. Set up a firewall
4. Regularly update the system

## Support

If you need help, please:

1. Check the troubleshooting section in INSTALL.md
2. Review Docker logs
3. Check GitHub issues
4. Contact the support team
