#!/bin/bash
# Script để rebuild backend trên server VPS

cd /var/www/livestream

# Login to GitHub Container Registry
echo "Logging in to GitHub Container Registry..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u cuong78 --password-stdin

# Set environment variables
export DOCKER_REGISTRY=ghcr.io/cuong78/livestream
export TAG=latest

# Stop backend container
echo "Stopping backend container..."
docker compose -f docker-compose.prod.yml stop backend

# Remove old backend container and image
echo "Removing old backend container and image..."
docker compose -f docker-compose.prod.yml rm -f backend
docker rmi ${DOCKER_REGISTRY}/livestream-backend:latest || true

# Pull latest backend image
echo "Pulling latest backend image..."
docker pull ${DOCKER_REGISTRY}/livestream-backend:latest

# Start backend with new image
echo "Starting backend with new image..."
docker compose -f docker-compose.prod.yml up -d backend --force-recreate

# Check logs
echo "Checking backend logs..."
docker logs livestream-backend --tail 50

echo "Backend rebuild completed!"

