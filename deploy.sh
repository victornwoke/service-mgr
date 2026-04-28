#!/bin/bash

# Deploy Service Manager to Kubernetes

set -e

NAMESPACE="${NAMESPACE:-service-mgr}"

echo " Deploying Service Manager to namespace: ${NAMESPACE}"

# Create namespace if it doesn't exist
kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -

# Apply RBAC resources
echo "Applying RBAC resources..."
kubectl apply -f k8s/rbac.yaml

# Apply database resources
echo "Applying database resources..."
kubectl apply -f k8s/db/

# Apply API resources
echo "Applying API resources..."
kubectl apply -f k8s/api/

# Apply main service resources
echo "Applying main service resources..."
kubectl apply -f k8s/service-mgr.yaml

# Wait for deployments to be ready
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/service-mgr-postgres -n ${NAMESPACE}
kubectl wait --for=condition=available --timeout=300s deployment/service-mgr-node-api -n ${NAMESPACE}
kubectl wait --for=condition=available --timeout=300s deployment/service-mgr-frontend -n ${NAMESPACE}
kubectl wait --for=condition=available --timeout=300s deployment/service-mgr-python-worker -n ${NAMESPACE}

echo ""
echo "Service Manager deployed successfully!"
echo ""
echo "Service URLs:"
echo "  Frontend: http://service-mgr.local"
echo "  API: http://service-mgr.local/api"
echo ""
echo "Check status:"
echo "  kubectl get pods -n ${NAMESPACE}"
echo "  kubectl get services -n ${NAMESPACE}"
echo "  kubectl logs -f deployment/service-mgr-node-api -n ${NAMESPACE}"