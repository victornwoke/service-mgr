# Service Manager - Complete DevOps Automation

A full-stack service management application with automated deployment pipeline.

## 🏗️ Architecture

- **Frontend**: React + Material-UI (Vite)
- **Backend**: Node.js + Express + Sequelize
- **Database**: PostgreSQL
- **Worker**: Python (background tasks)
- **Infrastructure**: Kubernetes + Docker

## 🚀 Quick Start

### One-Command Full Deployment
```bash
./automate.sh full-deploy
```

This will:
- ✅ Build all components (frontend, backend, worker)
- ✅ Create and push Docker images
- ✅ Deploy to Kubernetes
- ✅ Wait for rollouts to complete
- ✅ Run health checks
- ✅ Show final status

## 📋 Available Commands

### Core Commands
```bash
./automate.sh build           # Build & push images only
./automate.sh deploy          # Deploy existing images to K8s
./automate.sh full-deploy     # Complete pipeline (build + deploy)
./automate.sh status          # Show application status
./automate.sh health          # Run health checks
```

### Lifecycle Management
```bash
./automate.sh start           # Start application (scale to 1 replica)
./automate.sh stop            # Stop application (scale to 0 replicas)
./automate.sh restart         # Rolling restart all components
```

### Monitoring & Debugging
```bash
./automate.sh logs api        # Show API logs (last 50 lines)
./automate.sh logs frontend   # Show frontend logs
./automate.sh logs worker     # Show worker logs
./automate.sh logs api 100    # Show last 100 lines of API logs
```

### Database Operations
```bash
./automate.sh backup          # Create database backup
./automate.sh restore backup_20260428.sql  # Restore from backup
```

### Cleanup
```bash
./automate.sh cleanup         # Delete all resources (⚠️ DANGER!)
```

## 🔧 Configuration

### Environment Variables
```bash
export REGISTRY="your-registry"        # Docker registry (default: sirhumble07)
export TAG="v1.0.0"                   # Image tag (default: latest)
export NAMESPACE="production"          # K8s namespace (default: service-mgr)
export ENVIRONMENT="production"        # Environment (default: production)
```

### Examples
```bash
# Deploy to production with custom registry
REGISTRY=myregistry TAG=v2.1.0 ./automate.sh full-deploy

# Deploy to staging namespace
NAMESPACE=staging ./automate.sh deploy

# Build with specific tag
TAG=v1.2.3 ./automate.sh build
```

## 📊 Application Features

### Job Management
- ✅ Create, edit, and delete jobs
- ✅ Assign staff members
- ✅ Track job status (Pending → Quote → Booked → In Progress → Completed → Invoiced)
- ✅ Job timeline with interactive status updates

### Invoice Management
- ✅ Generate invoices from completed jobs
- ✅ Track invoice status (Unpaid/Paid)
- ✅ Automatic job status updates when invoiced

### Customer Management
- ✅ Customer profiles with contact information
- ✅ Job history per customer
- ✅ Invoice tracking

### User Management
- ✅ Staff member management
- ✅ Role-based access control (Admin/Staff)
- ✅ Secure authentication with JWT

### Dashboard
- ✅ Real-time statistics
- ✅ Recent jobs and overdue items
- ✅ Revenue tracking

## 🐳 Docker Images

The script builds and manages three Docker images:

- `sirhumble07/sbms-frontend:latest` - React frontend served by Nginx
- `sirhumble07/sbms-api:latest` - Node.js backend API
- `sirhumble07/sbms-worker:latest` - Python background worker

## ☸️ Kubernetes Resources

### Namespaces
- `service-mgr` - Main application namespace
- `access-pending` - RBAC testing namespace

### Deployments
- `service-mgr-frontend` - Frontend React app (2 replicas)
- `service-mgr-node-api` - Backend API (2 replicas)
- `service-mgr-python-worker` - Background worker (1 replica)
- `service-mgr-postgres` - PostgreSQL database (1 replica)

### Services & Ingress
- LoadBalancer services for frontend and API
- Ingress with nginx controller for external access
- PostgreSQL ClusterIP service

### Storage
- PersistentVolumeClaim for PostgreSQL data
- ConfigMaps for application configuration
- Secrets for database credentials and JWT keys

## 🔒 Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Password hashing with bcrypt
- Secure database connections
- Non-root container users
- Resource limits and health probes

## 🏥 Health Monitoring

The script includes comprehensive health checks:
- Pod readiness and liveness probes
- Application health endpoints (`/healthz`)
- Database connectivity checks
- Ingress accessibility verification

## 📝 Development Workflow

### Local Development
```bash
# Start backend
cd backend-node && npm run dev

# Start frontend
cd frontend-react && npm run dev

# Start database
docker run -p 5432:5432 -e POSTGRES_DB=sbms postgres:16
```

### Production Deployment
```bash
# Full deployment pipeline
./automate.sh full-deploy

# Just update images
./automate.sh build && ./automate.sh deploy

# Check everything is working
./automate.sh health
./automate.sh status
```

### Troubleshooting
```bash
# Check logs
./automate.sh logs api
./automate.sh logs frontend

# Restart if needed
./automate.sh restart

# Check pod status
kubectl get pods -n service-mgr
kubectl describe pod <pod-name> -n service-mgr
```

## 🔄 CI/CD Integration

The automation script is designed for CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Deploy to Kubernetes
  run: |
    ./automate.sh build
    ./automate.sh deploy
    ./automate.sh health
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration

### Job Endpoints
- `GET /api/v1/jobs` - List jobs
- `POST /api/v1/jobs` - Create job
- `GET /api/v1/jobs/:id` - Get job details
- `PUT /api/v1/jobs/:id` - Update job
- `PATCH /api/v1/jobs/:id` - Partial job update

### Customer Endpoints
- `GET /api/v1/customers` - List customers
- `POST /api/v1/customers` - Create customer
- `GET /api/v1/customers/:id` - Get customer details
- `PUT /api/v1/customers/:id` - Update customer

### Invoice Endpoints
- `GET /api/v1/invoices` - List invoices
- `POST /api/v1/invoices` - Create invoice
- `PUT /api/v1/invoices/:id` - Update invoice

### Staff Endpoints
- `GET /api/v1/staff` - List staff
- `POST /api/v1/staff` - Create staff member
- `PUT /api/v1/staff/:id` - Update staff member

## 🚨 Emergency Procedures

### Rollback Deployment
```bash
# Quick rollback to previous version
kubectl rollout undo deployment/service-mgr-node-api -n service-mgr
kubectl rollout undo deployment/service-mgr-frontend -n service-mgr

# Or redeploy with previous tag
TAG=previous-version ./automate.sh deploy
```

### Database Recovery
```bash
# Create backup
./automate.sh backup

# Restore from backup
./automate.sh restore backup_file.sql
```

### Complete Reset
```bash
# Stop everything
./automate.sh stop

# Reset database (CAUTION!)
kubectl exec -n service-mgr deployment/service-mgr-postgres -- psql -U postgres -c "DROP DATABASE sbms;"
kubectl exec -n service-mgr deployment/service-mgr-postgres -- psql -U postgres -c "CREATE DATABASE sbms;"

# Redeploy
./automate.sh full-deploy
```

## 📞 Support

For issues or questions:
1. Check the logs: `./automate.sh logs api`
2. Verify cluster status: `./automate.sh status`
3. Run health checks: `./automate.sh health`
4. Check Kubernetes events: `kubectl get events -n service-mgr`

---

**🎯 This automation script provides everything needed for complete application lifecycle management - from development to production deployment.**