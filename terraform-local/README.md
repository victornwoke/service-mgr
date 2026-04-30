# Service Manager - Local Terraform Configuration

This Terraform configuration creates a complete local development environment for the Service Manager application using Kind (Kubernetes in Docker).

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/)
- [Terraform](https://www.terraform.io/downloads.html)
- [Helm](https://helm.sh/docs/intro/install/) (if using ingress)

### Deploy Local Environment

```bash
# Navigate to local terraform directory
cd terraform-local

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan

# Apply the configuration
terraform apply

# Wait for all resources to be ready
terraform output access_instructions
```

### Access the Application

After deployment, access your application at:
- **Frontend**: http://localhost:30080
- **API**: http://localhost:30081

## 🔒 Security & Consistency

### CORS Configuration
This setup includes automatic CORS configuration for seamless frontend-backend communication. The deployment script validates that CORS is properly configured before completion.

**CORS Origins Included:**
- `http://localhost:30080` (default frontend port)
- `http://127.0.0.1:30080` (alternative localhost)
- `http://localhost:8080` (fallback port)
- `http://127.0.0.1:8080` (alternative localhost)
- `http://localhost:3000` (Vite dev server)

**Customize CORS Origins:**
```bash
terraform apply -var="cors_origins=http://localhost:30080,http://mycustomdomain.com"
```

### Deployment Validation
The deployment script automatically validates:
- ✅ Docker daemon connectivity
- ✅ Kubernetes cluster creation
- ✅ Application component deployment
- ✅ **CORS configuration presence**
- ✅ Port forwarding setup

## 📋 Configuration Options

### Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `cluster_name` | Name of the Kind cluster | `service-mgr-local` |
| `kubernetes_version` | Kubernetes version | `v1.28.0` |
| `namespace` | Application namespace | `service-mgr` |
| `postgres_password` | Database password (default 'postgres' for local dev) | `postgres` |
| `jwt_secret` | JWT secret key | `supersecretlocaljwtkey` |
| `enable_ingress` | Enable NGINX ingress | `true` |
| `enable_monitoring` | Enable monitoring stack | `false` |
| `frontend_port` | Port to map frontend service to on host | `30080` |
| `api_port` | Port to map API service to on host | `30081` |
| `ingress_http_port` | HTTP port for NGINX ingress controller | `30080` |
| `ingress_https_port` | HTTPS port for NGINX ingress controller | `30443` |
| `cors_origins` | Allowed CORS origins for API requests | `http://localhost:30080,...` |

### Custom Configuration

```bash
# Deploy with custom settings
terraform apply \
  -var="cluster_name=my-service-mgr" \
  -var="enable_ingress=false" \
  -var="postgres_password=mysecretpassword" \
  -var="frontend_port=8080" \
  -var="api_port=8081"

# Or create local.auto.tfvars for persistent local configuration
# See local.auto.tfvars.example for a template
```

## 🏗️ What Gets Created

### Infrastructure
- **Kind Cluster**: Local Kubernetes cluster with 1 control plane + 1 worker node
- **Namespace**: Dedicated namespace for the application
- **Persistent Storage**: PostgreSQL data persistence

### Database
- **PostgreSQL 16**: Production-ready database
- **Persistent Volume**: 10GB storage for data persistence
- **Secrets**: Secure credential management

### Application Components
- **Backend API**: Node.js API server with health checks
- **Frontend**: React application
- **Worker**: Python background worker
- **Services**: Kubernetes services for inter-component communication

### Optional Components
- **NGINX Ingress**: External access controller (when `enable_ingress=true`)
- **Monitoring**: Basic observability stack (when `enable_monitoring=true`)

## 🔧 Development Workflow

### Making Code Changes

```bash
# Build and push updated images
docker build -t sirhumble07/sbms-api:latest ./backend-node
docker build -t sirhumble07/sbms-frontend:latest ./frontend-react
docker build -t sirhumble07/sbms-worker:latest ./worker-python

docker push sirhumble07/sbms-api:latest
docker push sirhumble07/sbms-frontend:latest
docker push sirhumble07/sbms-worker:latest

# Restart deployments to pick up new images
kubectl rollout restart deployment -n service-mgr
```

### Database Operations

```bash
# Access database directly
kubectl exec -it deployment/service-mgr-postgres -n service-mgr -- psql -U postgres -d sbms

# Run database migrations (if needed)
kubectl exec -it deployment/service-mgr-node-api -n service-mgr -- npm run migrate
```

### Monitoring and Debugging

```bash
# Check pod status
kubectl get pods -n service-mgr

# View logs
kubectl logs -f deployment/service-mgr-node-api -n service-mgr
kubectl logs -f deployment/service-mgr-frontend -n service-mgr

# Debug containers
kubectl exec -it deployment/service-mgr-node-api -n service-mgr -- /bin/bash

# Port forward for direct access
kubectl port-forward svc/service-mgr-frontend 3000:80 -n service-mgr
kubectl port-forward svc/service-mgr-node-api 8081:8081 -n service-mgr
```

## 🧹 Cleanup

```bash
# Destroy the local environment
terraform destroy

# Or destroy specific resources
terraform destroy -target=kubernetes_namespace.service_mgr
```

## 🔄 Switching Between Environments

This local Terraform setup is completely separate from the AWS production setup in the `terraform/` directory. You can:

1. Use `terraform-local/` for local development
2. Use `terraform/` for AWS production deployment
3. Switch between them as needed

## 📊 Resource Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **Memory**: 4GB RAM
- **Storage**: 10GB free space

### Recommended
- **CPU**: 4 cores
- **Memory**: 8GB RAM
- **Storage**: 20GB free space

## 🚨 Troubleshooting

### Common Issues

**Cluster Creation Fails**
```bash
# Check Docker is running
docker info

# Clean up old clusters
kind delete clusters --all
```

**Pods Not Starting**
```bash
# Check resource availability
kubectl describe pod <pod-name> -n service-mgr

# Check events
kubectl get events -n service-mgr --sort-by=.metadata.creationTimestamp
```

**Database Connection Issues**
```bash
# Verify database is ready
kubectl exec deployment/service-mgr-postgres -n service-mgr -- pg_isready -U postgres

# Check database logs
kubectl logs deployment/service-mgr-postgres -n service-mgr
```

**Image Pull Errors**
```bash
# Ensure images exist in registry
docker images | grep sbms

# Check image names match in terraform configuration
```

### Getting Help

1. Check the main [project README](../README.md)
2. Review Terraform logs: `TF_LOG=DEBUG terraform apply`
3. Check Kubernetes events: `kubectl get events -n service-mgr`
4. View detailed pod information: `kubectl describe pod <pod-name> -n service-mgr`

---

**🎉 Happy developing with Service Manager!**