#!/bin/bash

###############################################################################
# CLB Gà Chọi Cao Đổi - Production Deployment Script
# Description: Automated deployment script for live streaming platform
# Author: Anh Cương
# Date: December 2025
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/livestream"
BACKUP_DIR="${PROJECT_DIR}/backups"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env"

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
check_privileges() {
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root or with sudo"
        exit 1
    fi
}

# Check if .env file exists
check_env_file() {
    if [ ! -f "${PROJECT_DIR}/${ENV_FILE}" ]; then
        log_error ".env file not found at ${PROJECT_DIR}/${ENV_FILE}"
        log_info "Please create .env file with required environment variables"
        exit 1
    fi
    log_success ".env file found"
}

# Load environment variables
load_env() {
    log_info "Loading environment variables..."
    source "${PROJECT_DIR}/${ENV_FILE}"
    log_success "Environment variables loaded"
}

# Create backup directory if not exists
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory..."
        mkdir -p "$BACKUP_DIR"
        log_success "Backup directory created"
    fi
}

# Backup database
backup_database() {
    log_info "Creating database backup..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/db_backup_${TIMESTAMP}.sql.gz"
    
    docker exec livestream-postgres pg_dump -U "${DB_USERNAME}" "${DB_NAME}" | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log_success "Database backup created: $BACKUP_FILE"
        
        # Keep only last 7 backups
        log_info "Cleaning old backups (keeping last 7)..."
        cd "$BACKUP_DIR"
        ls -t db_backup_*.sql.gz | tail -n +8 | xargs -r rm
        log_success "Old backups cleaned"
    else
        log_error "Database backup failed"
        exit 1
    fi
}

# Pull latest code from GitHub
pull_latest_code() {
    log_info "Pulling latest code from GitHub..."
    
    cd "$PROJECT_DIR"
    
    # Stash any local changes
    if git diff-index --quiet HEAD --; then
        log_info "No local changes to stash"
    else
        log_warning "Stashing local changes..."
        git stash
    fi
    
    # Pull latest code
    git pull origin main
    
    if [ $? -eq 0 ]; then
        log_success "Latest code pulled successfully"
    else
        log_error "Failed to pull latest code"
        exit 1
    fi
}

# Build and restart containers
deploy_containers() {
    log_info "Building and deploying containers..."
    
    cd "$PROJECT_DIR"
    
    # Pull latest images
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build custom images
    log_info "Building custom images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Stop old containers
    log_info "Stopping old containers..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start new containers
    log_info "Starting new containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    if [ $? -eq 0 ]; then
        log_success "Containers deployed successfully"
    else
        log_error "Failed to deploy containers"
        exit 1
    fi
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        # Check backend health
        backend_health=$(docker inspect --format='{{.State.Health.Status}}' livestream-backend 2>/dev/null || echo "starting")
        
        if [ "$backend_health" = "healthy" ]; then
            log_success "All services are healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        log_info "Waiting... (${attempt}/${max_attempts})"
        sleep 10
    done
    
    log_warning "Services took longer than expected to be healthy"
    log_info "Checking container status..."
    docker-compose -f "$COMPOSE_FILE" ps
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check if all containers are running
    log_info "Checking container status..."
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Test backend API
    log_info "Testing backend API..."
    backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/actuator/health || echo "000")
    
    if [ "$backend_status" = "200" ]; then
        log_success "Backend API is responding"
    else
        log_warning "Backend API returned status: $backend_status"
    fi
    
    # Test frontend
    log_info "Testing frontend..."
    frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "000")
    
    if [ "$frontend_status" = "200" ] || [ "$frontend_status" = "301" ]; then
        log_success "Frontend is responding"
    else
        log_warning "Frontend returned status: $frontend_status"
    fi
}

# Show deployment summary
show_summary() {
    echo ""
    log_success "========================================="
    log_success "     DEPLOYMENT COMPLETED SUCCESSFULLY"
    log_success "========================================="
    echo ""
    log_info "Service URLs:"
    echo "  - Frontend: https://${DOMAIN}"
    echo "  - Backend API: https://${DOMAIN}/api"
    echo "  - RTMP: rtmp://${DOMAIN}:1935/live"
    echo "  - HLS: https://${DOMAIN}/hls"
    echo ""
    log_info "Useful commands:"
    echo "  - View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  - Check status: docker-compose -f $COMPOSE_FILE ps"
    echo "  - Restart service: docker-compose -f $COMPOSE_FILE restart <service>"
    echo ""
}

# Main deployment flow
main() {
    echo ""
    log_info "========================================="
    log_info "  Starting Production Deployment"
    log_info "========================================="
    echo ""
    
    # Pre-deployment checks
    check_privileges
    cd "$PROJECT_DIR" || exit 1
    check_env_file
    load_env
    create_backup_dir
    
    # Backup before deployment
    if docker ps | grep -q livestream-postgres; then
        backup_database
    else
        log_warning "PostgreSQL container not running, skipping backup"
    fi
    
    # Deploy
    pull_latest_code
    deploy_containers
    wait_for_services
    verify_deployment
    
    # Show summary
    show_summary
    
    log_success "Deployment completed at $(date)"
}

# Run main function
main "$@"
