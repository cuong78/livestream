#!/bin/bash

###############################################################################
# CLB Gà Chọi Cao Đổi - Backup Script
# Description: Automated backup script for database, Redis, and recordings
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
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y-%m-%d)
ENV_FILE="${PROJECT_DIR}/.env"

# Retention policy (days)
RETENTION_DAYS=7

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

# Load environment variables
load_env() {
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
        log_success "Environment variables loaded"
    else
        log_error ".env file not found at $ENV_FILE"
        exit 1
    fi
}

# Create backup directory structure
create_backup_structure() {
    log_info "Creating backup directory structure..."
    
    mkdir -p "${BACKUP_DIR}/database"
    mkdir -p "${BACKUP_DIR}/redis"
    mkdir -p "${BACKUP_DIR}/recordings"
    mkdir -p "${BACKUP_DIR}/configs"
    
    log_success "Backup directory structure created"
}

# Backup PostgreSQL database
backup_database() {
    log_info "Backing up PostgreSQL database..."
    
    BACKUP_FILE="${BACKUP_DIR}/database/db_${TIMESTAMP}.sql.gz"
    
    # Check if PostgreSQL container is running
    if ! docker ps | grep -q livestream-postgres; then
        log_error "PostgreSQL container is not running"
        return 1
    fi
    
    # Create backup
    docker exec livestream-postgres pg_dump -U "${DB_USERNAME}" "${DB_NAME}" | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_success "Database backup created: $BACKUP_FILE ($BACKUP_SIZE)"
        return 0
    else
        log_error "Database backup failed"
        return 1
    fi
}

# Backup Redis data
backup_redis() {
    log_info "Backing up Redis data..."
    
    # Check if Redis container is running
    if ! docker ps | grep -q livestream-redis; then
        log_error "Redis container is not running"
        return 1
    fi
    
    # Trigger Redis save
    docker exec livestream-redis redis-cli -a "${REDIS_PASSWORD}" SAVE > /dev/null 2>&1
    
    # Copy Redis dump file
    BACKUP_FILE="${BACKUP_DIR}/redis/redis_${TIMESTAMP}.rdb"
    docker cp livestream-redis:/data/dump.rdb "$BACKUP_FILE"
    
    if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_success "Redis backup created: $BACKUP_FILE ($BACKUP_SIZE)"
        return 0
    else
        log_error "Redis backup failed"
        return 1
    fi
}

# Backup SRS recordings (if enabled)
backup_recordings() {
    log_info "Backing up SRS recordings..."
    
    # Check if SRS container is running
    if ! docker ps | grep -q livestream-srs; then
        log_warning "SRS container is not running, skipping recordings backup"
        return 0
    fi
    
    # Check if recordings directory exists
    if docker exec livestream-srs ls /data/recordings > /dev/null 2>&1; then
        BACKUP_FILE="${BACKUP_DIR}/recordings/recordings_${TIMESTAMP}.tar.gz"
        docker exec livestream-srs tar czf - /data/recordings > "$BACKUP_FILE" 2>/dev/null
        
        if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
            BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log_success "Recordings backup created: $BACKUP_FILE ($BACKUP_SIZE)"
            return 0
        else
            log_warning "No recordings found or backup failed"
            return 0
        fi
    else
        log_info "No recordings directory found, skipping"
        return 0
    fi
}

# Backup configuration files
backup_configs() {
    log_info "Backing up configuration files..."
    
    BACKUP_FILE="${BACKUP_DIR}/configs/configs_${TIMESTAMP}.tar.gz"
    
    cd "$PROJECT_DIR"
    tar czf "$BACKUP_FILE" \
        docker-compose.prod.yml \
        nginx-prod.conf \
        srs.conf \
        2>/dev/null
    
    if [ $? -eq 0 ] && [ -f "$BACKUP_FILE" ]; then
        BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log_success "Config files backup created: $BACKUP_FILE ($BACKUP_SIZE)"
        return 0
    else
        log_error "Config files backup failed"
        return 1
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning up backups older than ${RETENTION_DAYS} days..."
    
    # Database backups
    find "${BACKUP_DIR}/database" -name "db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
    
    # Redis backups
    find "${BACKUP_DIR}/redis" -name "redis_*.rdb" -mtime +${RETENTION_DAYS} -delete
    
    # Recording backups
    find "${BACKUP_DIR}/recordings" -name "recordings_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
    
    # Config backups
    find "${BACKUP_DIR}/configs" -name "configs_*.tar.gz" -mtime +${RETENTION_DAYS} -delete
    
    log_success "Old backups cleaned up"
}

# Generate backup report
generate_report() {
    log_info "Generating backup report..."
    
    REPORT_FILE="${BACKUP_DIR}/backup_report_${DATE}.txt"
    
    cat > "$REPORT_FILE" << EOF
=========================================
CLB Gà Chọi Cao Đổi - Backup Report
=========================================
Date: $(date)
Backup Session: ${TIMESTAMP}

DATABASE BACKUPS:
$(ls -lh "${BACKUP_DIR}/database/" | tail -n +2 | head -5)

REDIS BACKUPS:
$(ls -lh "${BACKUP_DIR}/redis/" | tail -n +2 | head -5)

RECORDINGS BACKUPS:
$(ls -lh "${BACKUP_DIR}/recordings/" | tail -n +2 | head -5)

CONFIG BACKUPS:
$(ls -lh "${BACKUP_DIR}/configs/" | tail -n +2 | head -5)

DISK USAGE:
Total backup size: $(du -sh "${BACKUP_DIR}" | cut -f1)
Available disk space: $(df -h "${BACKUP_DIR}" | tail -1 | awk '{print $4}')

=========================================
EOF
    
    log_success "Backup report generated: $REPORT_FILE"
    cat "$REPORT_FILE"
}

# Main backup flow
main() {
    echo ""
    log_info "========================================="
    log_info "  Starting Backup Process"
    log_info "========================================="
    echo ""
    
    # Initialize
    load_env
    create_backup_structure
    
    # Perform backups
    backup_database
    backup_redis
    backup_recordings
    backup_configs
    
    # Cleanup
    cleanup_old_backups
    
    # Report
    generate_report
    
    echo ""
    log_success "========================================="
    log_success "     BACKUP COMPLETED SUCCESSFULLY"
    log_success "========================================="
    echo ""
    log_info "Backup location: ${BACKUP_DIR}"
    log_info "Backup session: ${TIMESTAMP}"
    echo ""
}

# Run main function
main "$@"
