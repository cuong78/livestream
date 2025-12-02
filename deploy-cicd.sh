#!/bin/bash

###############################################################################
# CLB Gà Chọi Cao Đổi - CI/CD Deployment Script
# Description: Automated deployment script using pre-built Docker images
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
PROJECT_DIR="/opt/livestream-cicd"
COMPOSE_FILE="docker-compose.cicd.yml"
ENV_FILE=".env"

# GitHub Container Registry
GHCR_REGISTRY="ghcr.io"
GHCR_USERNAME="cuong78"
BACKEND_IMAGE="${GHCR_REGISTRY}/${GHCR_USERNAME}/livestream-backend:latest"
FRONTEND_IMAGE="${GHCR_REGISTRY}/${GHCR_USERNAME}/livestream-frontend:latest"

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

# Login to GitHub Container Registry (if needed)
login_to_ghcr() {
    log_info "Checking GitHub Container Registry authentication..."
    
    # Check if already logged in
    if docker info 2>&1 | grep -q "${GHCR_REGISTRY}"; then
        log_success "Already logged in to GHCR"
        return 0
    fi
    
    # Note: In production, GitHub Actions will handle authentication
    log_info "GHCR authentication will be handled by GitHub Actions"
}

# Pull latest images from GHCR
pull_latest_images() {
    log_info "Pulling latest images from GitHub Container Registry..."
    
    cd "$PROJECT_DIR"
    
    # Pull using docker-compose
    docker-compose -f "$COMPOSE_FILE" pull backend frontend
    
    if [ $? -eq 0 ]; then
        log_success "Latest images pulled successfully"
        
        # Show image info
        log_info "Backend image: $(docker images ${BACKEND_IMAGE} --format '{{.Repository}}:{{.Tag}} ({{.Size}})')"
        log_info "Frontend image: $(docker images ${FRONTEND_IMAGE} --format '{{.Repository}}:{{.Tag}} ({{.Size}})')"
    else
        log_error "Failed to pull images"
        exit 1
    fi
}

# Stop old containers
stop_containers() {
    log_info "Stopping old containers..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" down
    
    log_success "Old containers stopped"
}

# Start new containers
start_containers() {
    log_info "Starting new containers..."
    
    cd "$PROJECT_DIR"
    docker-compose -f "$COMPOSE_FILE" up -d
    
    if [ $? -eq 0 ]; then
        log_success "Containers started successfully"
    else
        log_error "Failed to start containers"
        exit 1
    fi
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    max_attempts=30
    attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        healthy_count=$(docker-compose -f "$COMPOSE_FILE" ps | grep -c "Up (healthy)" || echo "0")
        
        if [ "$healthy_count" -ge 3 ]; then
            log_success "All services are healthy"
            return 0
        fi
        
        log_info "Attempt $((attempt + 1))/$max_attempts - Waiting for services..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    log_warning "Services took longer than expected to be healthy"
    log_info "Checking container status..."
    docker-compose -f "$COMPOSE_FILE" ps
}

# Verify deployment
verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check container status
    log_info "Container status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    # Test backend API health
    log_info "Testing backend API..."
    backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/actuator/health || echo "000")
    
    if [ "$backend_status" = "200" ]; then
        log_success "Backend API is healthy (HTTP $backend_status)"
    else
        log_warning "Backend API returned status: HTTP $backend_status"
    fi
    
    # Test frontend
    log_info "Testing frontend..."
    frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "000")
    
    if [ "$frontend_status" = "200" ] || [ "$frontend_status" = "301" ]; then
        log_success "Frontend is responding (HTTP $frontend_status)"
    else
        log_warning "Frontend returned status: HTTP $frontend_status"
    fi
    
    # Test WebSocket endpoint
    log_info "Testing WebSocket endpoint..."
    ws_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/ws/chat/info || echo "000")
    
    if [ "$ws_status" = "200" ]; then
        log_success "WebSocket endpoint is healthy (HTTP $ws_status)"
    else
        log_warning "WebSocket endpoint returned status: HTTP $ws_status"
    fi
}

# Cleanup old images
cleanup_old_images() {
    log_info "Cleaning up old images..."
    
    # Remove dangling images
    docker image prune -f
    
    # Remove images older than 7 days
    docker image prune -af --filter "until=168h"
    
    log_success "Old images cleaned up"
}

# Show deployment summary
show_summary() {
    echo ""
    log_success "========================================="
    log_success "   CI/CD DEPLOYMENT COMPLETED"
    log_success "========================================="
    echo ""
    log_info "Service URLs:"
    echo "  🌐 Frontend: https://${DOMAIN}"
    echo "  🔧 Backend API: https://${DOMAIN}/api"
    echo "  📹 RTMP: rtmp://${DOMAIN}:1935/live"
    echo "  📺 HLS: https://${DOMAIN}/hls"
    echo ""
    log_info "Docker Images:"
    echo "  🐳 Backend: ${BACKEND_IMAGE}"
    echo "  🐳 Frontend: ${FRONTEND_IMAGE}"
    echo ""
    log_info "Useful Commands:"
    echo "  📋 View logs: docker-compose -f $COMPOSE_FILE logs -f"
    echo "  ✅ Check status: docker-compose -f $COMPOSE_FILE ps"
    echo "  🔄 Restart service: docker-compose -f $COMPOSE_FILE restart <service>"
    echo "  🔍 Pull updates: docker-compose -f $COMPOSE_FILE pull"
    echo ""
}

# Main deployment flow
main() {
    echo ""
    log_info "========================================="
    log_info "  Starting CI/CD Deployment"
    log_info "========================================="
    echo ""
    
    # Pre-deployment checks
    check_privileges
    cd "$PROJECT_DIR" || exit 1
    check_env_file
    load_env
    login_to_ghcr
    
    # Pull latest images
    pull_latest_images
    
    # Deploy
    stop_containers
    start_containers
    wait_for_services
    verify_deployment
    
    # Cleanup
    cleanup_old_images
    
    # Show summary
    show_summary
    
    log_success "Deployment completed at $(date)"
}

# Run main function
main "$@"
