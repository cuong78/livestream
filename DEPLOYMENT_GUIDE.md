# 🚀 Livestream Platform Deployment Guide

This guide will help you complete the deployment of your livestream platform to your VPS server using CI/CD with GitHub Actions.

## Current Status

You've completed steps 1-5 of the deployment plan:
1. ✅ Prepared the server VPS
2. ✅ Configured domain and SSL
3. ✅ Set up CI/CD with GitHub Actions
4. ✅ Created GitHub Actions workflow
5. ✅ Set up SSH keys for GitHub Actions

## Next Steps

### Step 1: Push Code to GitHub

Now that you have set up all the necessary configuration files, you should push your code to GitHub:

```bash
git add .
git commit -m "Add CI/CD configuration"
git push origin main
```

This will trigger the GitHub Actions workflow, which will:
1. Build the backend and frontend
2. Create Docker images
3. Push the images to GitHub Container Registry
4. Deploy the application to your VPS

### Step 2: Monitor the Deployment

1. Go to your GitHub repository
2. Click on the "Actions" tab
3. You should see your workflow running
4. Click on it to see the details and logs

### Step 3: Verify the Deployment

After the workflow completes successfully, you can verify the deployment:

```bash
# SSH into your server
ssh root@72.62.65.86

# Check if the containers are running
cd /var/www/livestream
docker-compose -f docker-compose.prod.yml ps

# Check the logs if needed
docker-compose -f docker-compose.prod.yml logs -f
```

### Step 4: Access Your Application

Once deployed, you can access your application at:
- Frontend: https://anhcuong.space
- Backend API: https://anhcuong.space/api
- Swagger UI: https://anhcuong.space/api/swagger-ui.html

## Troubleshooting

If you encounter any issues during deployment:

### GitHub Actions Issues

1. Check the workflow logs in GitHub Actions
2. Ensure all secrets are properly set up (SSH_PRIVATE_KEY)
3. Verify that the repository has permission to create packages

### Server Issues

1. Check Docker service status: `systemctl status docker`
2. Check container logs: `docker logs livestream-backend`
3. Check Nginx configuration: `nginx -t`
4. Check SSL certificates: `certbot certificates`

### Connection Issues

1. Verify firewall settings: `ufw status`
2. Check DNS configuration in Cloudflare
3. Verify Nginx is properly forwarding requests

## Completing the Deployment Plan

After successful deployment, continue with:

### Step 8: Set up Automatic Backups

```bash
# Create backup script
cat > /root/backup-livestream.sh << 'EOL'
#!/bin/bash

# Backup directory
BACKUP_DIR="/root/backups"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="$BACKUP_DIR/livestream_db_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup PostgreSQL database
docker exec livestream-postgres pg_dump -U livestream_user livestream_db > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Keep only the last 7 backups
find $BACKUP_DIR -name "livestream_db_*.sql.gz" -type f -mtime +7 -delete
EOL

# Make script executable
chmod +x /root/backup-livestream.sh

# Add to crontab to run daily at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /root/backup-livestream.sh") | crontab -
```

### Step 9: Set up Monitoring

```bash
# Install Prometheus and Grafana
docker run -d --name prometheus -p 9090:9090 -v /root/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
docker run -d --name grafana -p 3001:3000 grafana/grafana
```

### Step 10: Regular Maintenance

1. Update the system regularly: `apt update && apt upgrade -y`
2. Renew SSL certificates: `certbot renew`
3. Monitor disk space: `df -h`
4. Check for security updates

## Conclusion

By following this guide, you should have a fully functional livestream platform deployed to your VPS with CI/CD. The platform includes:

- Backend (Spring Boot)
- Frontend (React)
- Database (PostgreSQL)
- Cache (Redis)
- Streaming Server (SRS)
- Web Server (Nginx)

All components are containerized with Docker and automatically deployed when you push changes to GitHub.