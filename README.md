# V2Ray Management System

A comprehensive management system for V2Ray with a modern web interface, Telegram bot integration, and advanced monitoring capabilities.

## System Requirements

- Docker (20.10.0 or higher)
- Docker Compose (2.0.0 or higher)
- Git
- 2GB RAM minimum (4GB recommended)
- 20GB free disk space

## Quick Installation

1. Clone the repository:
```bash
git clone https://github.com/k4lantar4/v2ray-management-system.git
cd v2ray-management-system
```

2. Run the interactive installer:
```bash
./install.sh
```

The installer will guide you through:
- System requirements check
- Environment configuration
- Database setup
- Admin user creation
- Service deployment

## What the Installer Does

1. **System Check**
   - Verifies required software (Docker, Docker Compose, Git)
   - Checks system resources

2. **Configuration**
   - Creates secure environment variables
   - Configures database settings
   - Sets up Redis connection
   - Configures Telegram bot integration
   - Sets up backup parameters

3. **Database Initialization**
   - Creates database schema
   - Runs migrations
   - Creates admin user

4. **Service Deployment**
   - Builds Docker images
   - Starts all services
   - Verifies system health

## Post-Installation

After successful installation, you can access:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/api/docs
- Admin Panel: http://localhost:3000/admin

## Security Recommendations

1. **Change Default Passwords**
   - Change the admin password after first login
   - Secure your database password
   - Update Redis password if needed

2. **Configure Firewall**
   - Allow only necessary ports
   - Set up rate limiting
   - Configure SSL/TLS

3. **Regular Backups**
   - Enable automated backups
   - Test backup restoration
   - Store backups securely

## Components

- **Frontend**: Next.js with TypeScript
- **Backend**: FastAPI with PostgreSQL
- **Cache**: Redis
- **Bot**: Telegram Bot Integration
- **Monitoring**: Prometheus & Server Metrics
- **Backup System**: Automated backup and restore

## Environment Variables

Key environment variables that will be configured during installation:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`: Redis server host
- `TELEGRAM_BOT_TOKEN`: Telegram bot API token
- `SECRET_KEY`: Application secret key
- `BACKUP_ENCRYPTION_KEY`: Backup encryption key

For a complete list of environment variables, see `.env.example`.

## Troubleshooting

If you encounter issues during installation:

1. **Database Connection Issues**
   - Check PostgreSQL container logs
   - Verify database credentials
   - Ensure PostgreSQL is running

2. **Redis Connection Issues**
   - Verify Redis container status
   - Check Redis password
   - Ensure Redis is running

3. **Service Start Issues**
   - Check Docker logs
   - Verify port availability
   - Check system resources

## Support

For issues and support:
- Create an issue in the GitHub repository
- Check the documentation
- Contact the development team

## License

[Your License Here]
