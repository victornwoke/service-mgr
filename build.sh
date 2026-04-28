#!/bin/bash

# Build and push Docker images for Service Manager

set -e

# Configuration
REGISTRY="${REGISTRY:-sirhumble07}"
FRONTEND_IMAGE="${REGISTRY}/sbms-frontend"
BACKEND_IMAGE="${REGISTRY}/sbms-api"
WORKER_IMAGE="${REGISTRY}/sbms-worker"
TAG="${TAG:-latest}"

echo "Building Service Manager images..."

# Build frontend
echo "Building frontend..."
cd frontend-react
docker build -t ${FRONTEND_IMAGE}:${TAG} .
echo "Frontend built: ${FRONTEND_IMAGE}:${TAG}"

# Build backend
echo "Building backend..."
cd ../backend-node
docker build -t ${BACKEND_IMAGE}:${TAG} .
echo "Backend built: ${BACKEND_IMAGE}:${TAG}"

# Build worker
echo "Building worker..."
cd ../worker-python
docker build -t ${WORKER_IMAGE}:${TAG} .
echo "Worker built: ${WORKER_IMAGE}:${TAG}"

cd ..

echo ""
echo "Pushing images to registry..."

# Push images
docker push ${FRONTEND_IMAGE}:${TAG}
docker push ${BACKEND_IMAGE}:${TAG}
docker push ${WORKER_IMAGE}:${TAG}

echo ""
echo "All images built and pushed successfully!"
echo ""
echo "Images:"
echo "  Frontend: ${FRONTEND_IMAGE}:${TAG}"
echo "  Backend:  ${BACKEND_IMAGE}:${TAG}"
echo "  Worker:   ${WORKER_IMAGE}:${TAG}"
echo ""
echo "To deploy: kubectl apply -f k8s/"