# Security Hardening Guide

## System Security

### 1. Operating System Hardening

```bash
# Update package list and upgrade system
sudo apt update && sudo apt upgrade -y

# Install security packages
sudo apt install -y \
    fail2ban \
    ufw \
    unattended-upgrades \
    apt-listchanges

# Configure automatic updates
sudo dpkg-reconfigure -plow unattended-upgrades

# Configure firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 2. Docker Security

```bash
# Create docker daemon configuration
sudo mkdir -p /etc/docker
cat << EOF | sudo tee /etc/docker/daemon.json
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "userns-remap": "default",
    "no-new-privileges": true,
    "live-restore": true,
    "userland-proxy": false,
    "default-ulimits": {
        "nofile": {
            "Name": "nofile",
            "Hard": 64000,
            "Soft": 64000
        }
    }
}
EOF

# Restart Docker
sudo systemctl restart docker
```

## Application Security

### 1. Environment Variables

- Use strong, randomly generated values for:
  - SECRET_KEY
  - DATABASE_URL credentials
  - REDIS_PASSWORD
  - BACKUP_ENCRYPTION_KEY
  - API keys

### 2. SSL/TLS Configuration

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Configure SSL in .env
COOKIE_SECURE=true
COOKIE_SAMESITE=Strict
HSTS_MAX_AGE=31536000
```

### 3. Database Security

```bash
# Secure PostgreSQL configuration
cat << EOF | sudo tee -a /etc/postgresql/13/main/postgresql.conf
ssl = on
ssl_cert_file = '/etc/ssl/certs/ssl-cert-snakeoil.pem'
ssl_key_file = '/etc/ssl/private/ssl-cert-snakeoil.key'
password_encryption = scram-sha-256
EOF

# Configure access restrictions
cat << EOF | sudo tee -a /etc/postgresql/13/main/pg_hba.conf
hostssl all             all             0.0.0.0/0               scram-sha-256
EOF
```

### 4. Redis Security

```bash
# Secure Redis configuration
cat << EOF | sudo tee -a /etc/redis/redis.conf
requirepass ${REDIS_PASSWORD}
bind 127.0.0.1
protected-mode yes
rename-command FLUSHDB ""
rename-command FLUSHALL ""
rename-command DEBUG ""
EOF
```

## Monitoring & Logging

### 1. Configure Fail2ban

```bash
# Create jail configuration
cat << EOF | sudo tee /etc/fail2ban/jail.local
[DEFAULT]
bantime = 1h
findtime = 10m
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true
EOF

sudo systemctl restart fail2ban
```

### 2. Setup Logging

```bash
# Configure log rotation
cat << EOF | sudo tee /etc/logrotate.d/v2ray
/var/log/v2ray/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    postrotate
        [ -f /var/run/nginx.pid ] && kill -USR1 \$(cat /var/run/nginx.pid)
    endscript
}
EOF
```

### 3. Enable Audit Logging

```bash
# Install auditd
sudo apt install -y auditd

# Configure audit rules
cat << EOF | sudo tee /etc/audit/rules.d/audit.rules
-w /etc/passwd -p wa -k identity
-w /etc/group -p wa -k identity
-w /etc/shadow -p wa -k identity
-w /etc/sudoers -p wa -k identity
EOF

sudo service auditd restart
```

## Regular Security Tasks

### 1. Update Management

```bash
# Create update script
cat << EOF > /usr/local/bin/security-updates.sh
#!/bin/bash
apt update
apt upgrade -y
docker-compose pull
docker-compose up -d
EOF
chmod +x /usr/local/bin/security-updates.sh

# Add to crontab
echo "0 3 * * * /usr/local/bin/security-updates.sh" | sudo tee -a /etc/crontab
```

### 2. Security Scanning

```bash
# Install security scanning tools
sudo apt install -y \
    rkhunter \
    chkrootkit \
    lynis

# Run security audit
sudo lynis audit system
```

### 3. Backup Verification

```bash
# Create backup verification script
cat << EOF > /usr/local/bin/verify-backups.sh
#!/bin/bash
docker-compose exec -T api python backend/scripts/verify_backup.py
EOF
chmod +x /usr/local/bin/verify-backups.sh

# Add to crontab
echo "0 4 * * * /usr/local/bin/verify-backups.sh" | sudo tee -a /etc/crontab
```

## Security Best Practices

1. **Access Control**
   - Use strong passwords (minimum 16 characters)
   - Enable 2FA for all admin accounts
   - Regularly rotate API keys and access tokens
   - Implement role-based access control

2. **Network Security**
   - Use VPN for remote access
   - Implement rate limiting
   - Enable DDoS protection
   - Monitor network traffic

3. **Data Security**
   - Encrypt sensitive data at rest
   - Use secure protocols for data transmission
   - Implement regular data backups
   - Verify backup integrity

4. **Monitoring**
   - Set up alerts for suspicious activities
   - Monitor system resources
   - Track failed login attempts
   - Review audit logs regularly

5. **Incident Response**
   - Maintain an incident response plan
   - Document security procedures
   - Regular security training
   - Keep contact information updated

## Regular Security Audit Checklist

- [ ] Review system logs
- [ ] Check for unauthorized access attempts
- [ ] Verify backup integrity
- [ ] Update security patches
- [ ] Review user permissions
- [ ] Check SSL/TLS certificates
- [ ] Monitor system resources
- [ ] Review security policies
- [ ] Test backup restoration
- [ ] Update security documentation
