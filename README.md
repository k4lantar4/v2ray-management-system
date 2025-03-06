# 🚀 V2Ray Account Management Bot (Version 7.0)

A comprehensive Telegram bot for managing V2Ray accounts with automated subscription management, payment processing, and server monitoring.

## ✨ Features

### 👥 User Management
- Iranian phone number (+98) registration
- VIP user system with special privileges
- Multi-level user roles (Admin, Support, User, VIP)
- Wallet system for payments

### 💳 Subscription Management
- Multiple subscription plans (30/90/180 days)
- Auto-renewal system
- Usage monitoring and notifications
- Server switching capability

### 💰 Payment System
- Card-to-card payment support
- Automated receipt verification
- Wallet system with auto-recharge
- Fraud detection system

### 🖥️ Server Management
- Integration with 3x-ui panel
- Automatic load balancing
- Server health monitoring
- Performance metrics tracking

### 🔔 Notifications
- Subscription expiry alerts
- Usage notifications
- Payment confirmations
- System status updates

## 🛠️ Technical Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLModel ORM
- **Task Queue**: Celery with Redis
- **Bot Framework**: python-telegram-bot
- **Monitoring**: Prometheus + Grafana

## 📋 Prerequisites

- Python 3.9+
- PostgreSQL 13+
- Redis 6+
- 3x-ui Panel

## ⚙️ Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/v2ray-bot.git
cd v2ray-bot
```

2. Create and activate virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

5. Initialize database:
```bash
alembic upgrade head
python backend/scripts/create_admin.py
```

## 🚀 Running the Application

1. Start Redis server:
```bash
redis-server
```

2. Start Celery workers:
```bash
celery -A backend.app.tasks.celery worker --loglevel=info
celery -A backend.app.tasks.celery beat --loglevel=info
```

3. Start the FastAPI server:
```bash
uvicorn backend.app.main:app --reload
```

4. Start the Telegram bot:
```bash
python -m backend.app.bot.telegram_bot
```

## 🔧 Configuration

### Environment Variables (.env)
```env
# Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_GROUP_ID=admin_group_id
PAYMENT_CHANNEL_ID=payment_channel_id

# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=v2ray_bot

# Redis
REDIS_URL=redis://localhost:6379/0

# 3x-ui Panel
XUI_PANEL_URL=https://your-panel-url
XUI_USERNAME=admin
XUI_PASSWORD=your_password

# Security
SECRET_KEY=your_secret_key
```

## 📱 Bot Commands

- `/start` - Start the bot and register
- `/buy` - View subscription plans
- `/wallet` - Manage wallet
- `/profile` - View profile and subscriptions
- `/support` - Contact support
- `/servers` - View available servers
- `/change_server` - Switch between servers
- `/vip_status` - Check VIP status
- `/help` - Show help message

## 👥 User Roles

### 👤 Regular User
- Buy subscriptions
- Manage wallet
- Contact support
- Switch servers

### ⭐ VIP User
- Special discounts
- Priority support
- Unlimited server switching
- Extra features

### 🛠️ Support
- Handle user tickets
- Process payments
- Basic admin functions

### 👑 Admin
- Full system access
- Manage users and roles
- Monitor servers
- Configure settings

## 🔄 Automated Tasks

- Subscription monitoring (every 15 minutes)
- Server synchronization (every 5 minutes)
- Health checks (every 10 minutes)
- Auto-renewals (daily)
- Promotional offers (daily)

## 🔒 Security Features

- Phone number validation
- Payment verification
- Fraud detection
- Rate limiting
- Access control
- Secure API endpoints

## 📊 Monitoring

The system includes comprehensive monitoring:

- Server performance metrics
- User activity tracking
- Payment statistics
- System health checks
- Error logging and alerts

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/)
- [python-telegram-bot](https://python-telegram-bot.org/)
- [3x-ui Panel](https://github.com/XTLS/Xray-core)
- [SQLModel](https://sqlmodel.tiangolo.com/)

## 📞 Support

For support, please join our Telegram group or open an issue in the repository.
