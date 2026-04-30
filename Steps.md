# Service Manager - Step-by-Step Guide 📋

This guide provides detailed step-by-step instructions for setting up, developing, and deploying the Service Manager application.

## Quick Start (5 Minutes)

### Prerequisites Check

**For all deployment methods:**

```bash
# Check if Docker is installed
docker --version

# Check if kubectl is available
kubectl version --client
```

**For Terraform deployment (recommended):**

```bash
# Additional tools for Terraform
kind --version          # Local Kubernetes clusters
terraform --version     # Infrastructure as Code
helm version           # Kubernetes package manager
```

**For existing Kubernetes cluster:**

```bash
# Check if you have access to a Kubernetes cluster
kubectl cluster-info
kubectl get nodes
```

### One-Command Setup

***Option 1: Quick Kubernetes Deployment (Existing)***

```bash
# Clone and deploy everything
git clone <repository-url>
cd service-mgr
chmod +x automate.sh setup-db.sh
./automate.sh full-deploy
```

**Access:** `http://127.0.0.1:8080`

***Option 2: Terraform Local Environment (Recommended)**

```bash
# Clone and deploy with Terraform
git clone <repository-url>
cd service-mgr
chmod +x deploy-local.sh
./deploy-local.sh deploy
```

**Access:** `http://localhost:30080` (Frontend) / `http://localhost:30081` (API)

---

## Detailed Setup Steps

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd service-mgr
```

### Step 2: Make Scripts Executable

```bash
chmod +x automate.sh setup-db.sh
```

### Step 3: Environment Configuration (Optional)

```bash
# Backend environment
cp backend-node/.env.example backend-node/.env
# Edit backend-node/.env with your settings

# Frontend environment (usually not needed for basic setup)
cp frontend-react/.env.example frontend-react/.env
```

### Step 4: Deploy to Kubernetes

```bash
./automate.sh full-deploy
```

This command will:

- ✅ Build all Docker images
- ✅ Push images to registry
- ✅ Deploy to Kubernetes
- ✅ Wait for rollouts
- ✅ Run health checks
- ✅ Show status

### Step 5: Access Application

```bash
# Set up port forwarding (if not already done)
kubectl port-forward svc/service-mgr-frontend 8080:80 -n service-mgr --address 127.0.0.1 &
kubectl port-forward svc/service-mgr-node-api 8081:8081 -n service-mgr --address 127.0.0.1 &

# Open in browser
open http://127.0.0.1:8080
```

---

## Development Workflow

### Local Development Setup

#### Option A: Full Local Environment

```bash
# 1. Start PostgreSQL database
docker run -d --name service-mgr-postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=servicemgr \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16

# 2. Backend setup
cd backend-node
npm install
npm run migrate  # Initialize database
npm run dev      # Start backend server (port 8081)

# 3. Frontend setup (new terminal)
cd ../frontend-react
npm install
npm run dev      # Start frontend server (port 3000)

# 4. Worker setup (optional, new terminal)
cd ../worker-python
pip install -r requirements.txt
python worker.py
```

#### Option B: Docker Compose (Faster)

```bash
# Use docker-compose for local development
docker-compose up -d
```

#### Option C: Terraform Local Environment (Recommended)

For a **production-like local development environment** with automated CI/CD:

```bash
# 1. Deploy complete environment
./deploy-local.sh deploy

# 2. Access application
# Frontend: http://localhost:30080
# API: http://localhost:30081

# 3. Check status
./deploy-local.sh status

# 4. Clean up when done
./deploy-local.sh destroy
```

**What you get:**

- ✅ Kind Kubernetes cluster (local)
- ✅ PostgreSQL with persistent storage
- ✅ All application components (API, Frontend, Worker)
- ✅ NGINX ingress controller
- ✅ Health checks and monitoring
- ✅ **CORS properly configured**
- ✅ Isolated from host system

**Customize ports if needed:**

```bash
terraform apply -var="frontend_port=8080" -var="api_port=8081"
```

#### Option D: Full CI/CD Pipeline (Enterprise)

For **automated deployments** with GitOps and ArgoCD:

```bash
# 1. Set up GitOps repository
./scripts/setup-gitops.sh

# 2. Create GitOps repository on GitHub
# Copy generated files to: https://github.com/YOUR_USERNAME/service-mgr-gitops

# 3. Configure ArgoCD applications
kubectl apply -f argocd/staging-app.yaml
kubectl apply -f argocd/production-app.yaml

# 4. Push code to trigger deployments
git push origin main    # Production deployment
git push origin develop # Staging deployment
```

**CI/CD Features:**

- ✅ **SHA-based immutable tagging** (security & traceability)
- ✅ Multi-environment deployments (staging/production)
- ✅ Automated security scanning (Trivy)
- ✅ GitOps with ArgoCD (automated sync)
- ✅ Comprehensive testing (backend & frontend)
- ✅ Rollback capabilities with full SHA tracking

For a complete, production-like local development environment with Kubernetes:

```bash
# 1. Prerequisites (Docker, kubectl, kind, terraform, helm)
docker --version
kubectl version --client
kind --version
terraform --version
helm version

# 2. Deploy complete environment
./deploy-local.sh deploy

# 3. Access application
# Frontend: http://localhost:30080
# API: http://localhost:30081

# 4. Check status
./deploy-local.sh status

# 5. View logs
kubectl logs -f deployment/service-mgr-frontend -n service-mgr
kubectl logs -f deployment/service-mgr-node-api -n service-mgr
```

**What you get:**

- ✅ Kind Kubernetes cluster (local)
- ✅ PostgreSQL with persistent storage
- ✅ All application components (API, Frontend, Worker)
- ✅ NGINX ingress controller
- ✅ Health checks and monitoring
- ✅ Isolated from host system
- ✅ Production-like configuration

**Customize ports if needed:**

```bash
# Edit terraform-local/local.auto.tfvars or use variables
terraform apply -var="frontend_port=8080" -var="api_port=8081"
```

### Development Commands

#### Backend Development

```bash
cd backend-node

# Start development server
npm run dev

# Run tests
npm test

# Database operations
npm run migrate     # Run migrations
npm run migrate:undo # Undo last migration
npm run seed        # Seed with sample data

# Code quality
npm run lint        # Lint code
npm run format      # Format code
```

#### Frontend Development

```bash
cd frontend-react

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Code quality
npm run lint
```

### Testing Responsiveness

#### Using Browser DevTools

1. Open `http://localhost:3000` (frontend dev server)
2. Press `F12` to open developer tools
3. Click the device icon (📱) in the top-left
4. Select different devices:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)

#### Manual Testing

1. Open application in browser
2. Resize window from 320px to 1920px width
3. Verify:
   - No horizontal scroll bars
   - All content fits screen
   - Navigation works on mobile
   - Tables scroll horizontally if needed

---

## Production Deployment

### Automated Deployment Options

#### Option A: Script-Based Deployment (Recommended for Production)

```bash
# Full production deployment
./automate.sh full-deploy

# Or step-by-step
./automate.sh build         # Build images
./automate.sh deploy        # Deploy to K8s
./automate.sh health        # Run health checks
```

#### Option B: Terraform Infrastructure as Code (Recommended for Development/Testing)

For production-like testing with infrastructure automation and **guaranteed consistency**:

```bash
# Local development with Terraform (terraform-local/)
cd terraform-local
./deploy-local.sh deploy    # Includes CORS validation

# Or manual Terraform commands
terraform init
terraform apply

# Production AWS deployment (terraform/)
cd ../terraform
terraform init
terraform plan -var="db_username=servicemgr" -var="db_password=your-secure-password"
terraform apply -var="db_username=servicemgr" -var="db_password=your-secure-password"
```

**Benefits of Terraform:**

- ✅ Infrastructure as Code
- ✅ Version-controlled infrastructure
- ✅ **Consistent CORS configuration** (prevents deployment issues)
- ✅ Automatic validation of critical settings
- ✅ Easy scaling and replication
- ✅ Audit trail of changes

#### Option C: GitOps CI/CD Pipeline (Enterprise Grade)

For **fully automated deployments** with immutable SHA-based tagging:

```bash
# 1. Set up GitOps repository
./scripts/setup-gitops.sh

# 2. Create GitOps repository on GitHub
# Copy files to: https://github.com/YOUR_USERNAME/service-mgr-gitops

# 3. Configure ArgoCD
kubectl apply -f argocd/staging-app.yaml
kubectl apply -f argocd/production-app.yaml

# 4. Set up GitHub secrets
./scripts/setup-github-secrets.sh    # Interactive setup guide
# Required secrets:
# - GITOPS_TOKEN: Personal access token for GitOps repo
# - DB_POSTGRES_PASSWORD: Database admin password
# - DB_USERNAME: Database username
# - DB_PASSWORD: Database user password
# - DB_NAME: Database name

# 5. Push code to trigger automated deployments
git push origin main    # Production deployment via ArgoCD
git push origin develop # Staging deployment via ArgoCD
```

**Enterprise CI/CD Features:**

- ✅ **Immutable SHA-based tagging** (main-sha-abc123..., develop-sha-abc123...)
- ✅ Multi-environment deployments (staging/production)
- ✅ Automated security scanning (Trivy vulnerability scanner)
- ✅ GitOps with ArgoCD (automated synchronization)
- ✅ Comprehensive testing (backend + frontend)
- ✅ Rollback capabilities (rollback to any SHA)
- ✅ Audit trail with full commit traceability

### Manual Deployment Steps

#### Step 1: Build Images

```bash
# Build all components
docker build -t your-registry/service-mgr-frontend:latest ./frontend-react
docker build -t your-registry/service-mgr-api:latest ./backend-node
docker build -t your-registry/service-mgr-worker:latest ./worker-python

# Push to registry
docker push your-registry/service-mgr-frontend:latest
docker push your-registry/service-mgr-api:latest
docker push your-registry/service-mgr-worker:latest
```

#### Step 2: Configure Kubernetes

```bash
# Update image references in k8s/service-mgr.yaml
sed -i 's|your-registry|your-actual-registry|g' k8s/service-mgr.yaml

# Apply configurations
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/service-mgr.yaml
```

#### Step 3: Database Setup

```bash
# Run migrations
kubectl exec -n service-mgr deployment/service-mgr-node-api -- npx sequelize-cli db:migrate

# Optional: Seed with sample data
kubectl exec -n service-mgr deployment/service-mgr-node-api -- npx sequelize-cli db:seed:all
```

#### Step 4: Verify Deployment

```bash
# Check pod status
kubectl get pods -n service-mgr

# Check services
kubectl get services -n service-mgr

# Check ingress
kubectl get ingress -n service-mgr

# View logs if needed
kubectl logs -n service-mgr deployment/service-mgr-node-api
```

### Ingress Configuration

For external access, configure ingress:

```yaml
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: service-mgr-ingress
  namespace: service-mgr
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: service-mgr-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: service-mgr-frontend
            port:
              number: 80
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: service-mgr-node-api
            port:
              number: 8081
```

---

## Troubleshooting Guide

### Common Issues & Solutions

#### Issue: Port forwarding not working

```bash
# Kill existing forwards
pkill -f "kubectl port-forward"

# Restart fresh
kubectl port-forward svc/service-mgr-frontend 8080:80 -n service-mgr --address 127.0.0.1 &
kubectl port-forward svc/service-mgr-node-api 8081:8081 -n service-mgr --address 127.0.0.1 &
```

#### Issue: Pods in CrashLoopBackOff

```bash
# Check pod status
kubectl get pods -n service-mgr

# View detailed pod information
kubectl describe pod <pod-name> -n service-mgr

# Check logs
kubectl logs <pod-name> -n service-mgr

# Common fixes:
# - Check environment variables
# - Verify database connectivity
# - Check resource limits
```

#### Issue: Database connection errors

```bash
# Check if PostgreSQL is running
kubectl get pods -n service-mgr -l app=service-mgr-postgres

# Check database logs
kubectl logs -n service-mgr deployment/service-mgr-postgres

# Reset database if needed
kubectl delete pod -n service-mgr -l app=service-mgr-postgres
```

#### Issue: CORS errors in browser

**Solution (Terraform deployments):**
CORS is now automatically configured and validated during deployment.

```bash
# Check CORS configuration
kubectl get configmap service-mgr-config -n service-mgr -o yaml | grep CORS_ORIGINS

# Restart API if needed
kubectl rollout restart deployment/service-mgr-node-api -n service-mgr

# Hard refresh browser: Ctrl+Shift+R (Chrome/Edge) or Ctrl+F5 (Firefox)
```

**Custom CORS origins:**

```bash
terraform apply -var="cors_origins=http://localhost:30080,http://mycustomdomain.com"
```

#### Issue: GitHub secrets not working

**Secret Configuration Issues:**

```bash
# Test local secret configuration
./scripts/test-github-secrets.sh

# Run interactive setup
./scripts/setup-github-secrets.sh

# Check repository secrets
# Go to: https://github.com/YOUR_REPO/settings/secrets/actions
```

**Common Secret Issues:**

- `GITOPS_TOKEN`: Check token has `repo` and `workflow` permissions
- `DB_*` secrets: Ensure all database secrets are set for production
- Token expiration: Regenerate if expired
- Repository access: Verify token has access to GitOps repository

#### Issue: Terraform deployment fails

**Local Terraform Issues:**

```bash
# Check Terraform prerequisites
cd terraform-local
terraform validate

# If Docker daemon issues
docker info

# Clean up failed deployments
terraform destroy
kind delete clusters service-mgr-local

# Restart fresh
terraform init
terraform apply
```

**Common Terraform fixes:**

- Port conflicts: `terraform apply -var="frontend_port=8080"`
- Resource issues: `docker system prune -a`
- State issues: `rm terraform.tfstate* && terraform init`
- **CORS validation fails**: Check that CORS_ORIGINS is set in config map

**AWS Terraform Issues:**

```bash
cd terraform
terraform validate
aws eks update-kubeconfig --name service-mgr-production
kubectl get nodes
```

#### Issue: CORS errors in browser*

```bash
# Check if port forwarding is using correct IPs
# Frontend should be accessible at 127.0.0.1:8080
# API should be accessible at 127.0.0.1:8081

# Verify CORS configuration in backend
kubectl exec -n service-mgr deployment/service-mgr-node-api -- cat src/app.js | grep -A 5 "cors"
```

#### Issue: Application not responsive

```bash
# Check if you're accessing the correct URL
# Development: http://localhost:3000
# Production: http://127.0.0.1:8080 (with port forwarding)

# Clear browser cache
# Try incognito/private browsing mode
```

### Health Checks

```bash
# API health
curl http://127.0.0.1:8081/healthz

# Database connectivity
kubectl exec -n service-mgr deployment/service-mgr-node-api -- npm run db:check

# Application logs
./automate.sh logs api
./automate.sh logs frontend
```

### Reset Everything (Last Resort)

```bash
# Stop all services
./automate.sh stop

# Clean up
kubectl delete namespace service-mgr

# Rebuild from scratch
./automate.sh full-deploy
```

---

## Monitoring & Maintenance

### Daily Operations

**Script-based deployment:**

```bash
# Check application status
./automate.sh status

# View logs
./automate.sh logs api 50     # Last 50 lines of API logs
./automate.sh logs frontend   # Frontend logs

# Monitor resources
kubectl top pods -n service-mgr
kubectl top nodes
```

**Terraform deployment:**

```bash
# Check status
./deploy-local.sh status

# View Terraform outputs
cd terraform-local && terraform output

# Monitor resources
kubectl top pods -n service-mgr
kubectl get nodes

# Check Terraform state
terraform show
```

### Database Maintenance

```bash
# Create backup
./automate.sh backup

# Restore from backup
./automate.sh restore backup_20260429.sql

# Database maintenance
kubectl exec -n service-mgr deployment/service-mgr-postgres -- psql -U postgres -d sbms -c "VACUUM ANALYZE;"
```

### Updates & Upgrades

**Script-based deployment:**

```bash
# Update to latest version
git pull origin main

# Rebuild and redeploy
./automate.sh full-deploy

# Or rolling update
./automate.sh build
kubectl rollout restart deployment -n service-mgr
```

**Terraform deployment:**

```bash
# Update code
git pull origin main

# Update Terraform infrastructure
cd terraform-local
terraform plan    # Review changes
terraform apply   # Apply updates

# Or for AWS production
cd ../terraform
terraform plan -var="db_username=servicemgr" -var="db_password=your-password"
terraform apply -var="db_username=servicemgr" -var="db_password=your-password"
```

---

## Feature Walkthrough

### First Time User Setup

1. **Access Application**: `http://127.0.0.1:8080`
2. **Register Admin User**:
   - Click "Register" link
   - Fill form: Name, Email, Password
   - Role will default to "Staff"
3. **Login** with created credentials
4. **Explore Dashboard** - see overview metrics

### Adding Your First Data

1. **Add Customers**:
   - Go to Customers page
   - Click "New Customer"
   - Fill customer details

2. **Add Staff** (if admin):
   - Go to Staff page
   - Click "Add Staff Member"
   - Create additional staff accounts

3. **Create Jobs**:
   - Go to Jobs page
   - Click "Create New Job"
   - Select customer, add service details
   - Assign staff member

4. **Schedule Management**:
   - Visit Schedule page
   - Click dates to navigate weeks
   - View jobs by day
   - Use filters to find specific jobs

5. **Invoice Creation**:
   - Complete jobs first
   - Go to job details
   - Click "Create Invoice"
   - Fill invoice details

### Advanced Features

- **Job Timeline**: Track job progress through status changes
- **Advanced Filtering**: Filter jobs by multiple criteria
- **Mobile Access**: Full functionality on mobile devices
- **Real-time Updates**: Dashboard updates automatically

---

## Choosing Your Deployment Method

### Quick Decision Guide

| Scenario | Recommended Method | Why |
|----------|--------------------|-----|

| **First-time setup** | Terraform Local (`./deploy-local.sh deploy`) | Complete environment, zero configuration |
| **Rapid prototyping** | Docker Compose | Fastest startup, minimal dependencies |
| **Full-stack development** | Individual services (npm/pip) | Best for active development |
| **Production deployment** | Script-based (`./automate.sh full-deploy`) | Optimized for production |
| **Infrastructure testing** | Terraform AWS | Infrastructure as Code, scalable |
| **CI/CD integration** | Script-based | Easy automation |
| **Learning Kubernetes** | Terraform Local | Production-like local environment |

### Method Comparison

| Feature            | Script (automate.sh) | Terraform Local                       | Docker Compose          | Manual Services              |
|--------------------|----------------------|---------------------------------------|-------------------------|------------------------------|
| **Setup Time**     | 10-15 min            | 5-10 min                              | 2-5 min                 | 5-10 min                     |
| **Kubernetes**     | ✅ Full cluster      | ✅ Kind cluster                       | ❌                      | ❌                           |
| **Persistence**    | ✅ Database          | ✅ Database                           | ✅ Database             | ❌                           |
| **Production-like**| ✅ High              | ✅ High                               | ⚠️ Medium               | ❌ Low                       |
| **Customization**  | ⚠️ Medium            | ✅ High                               | ⚠️ Medium               | ✅ High                      |
| **Dependencies**   | Docker, kubectl      | Docker, kubectl, kind, terraform, helm| Docker, docker-compose. | Node.js, Python, PostgreSQL. |
| **Best For**       | Production deployment| Development testing.                  | Quick prototyping.      | Active development           |

---

## Support & Next Steps

### Getting Help

- **Check logs**: `./automate.sh logs api`
- **Health checks**: `./automate.sh health`
- **Pod status**: `./automate.sh status`

### Customization

- **Themes**: Modify `frontend-react/src/theme.js`
- **Features**: Add new components in respective folders
- **Database**: Create new migrations in `backend-node/migrations/`

### Production Considerations

- **SSL/TLS**: Configure ingress with certificates
- **Backups**: Set up automated database backups
- **Monitoring**: Add logging and metrics collection
- **Scaling**: Configure horizontal pod autoscaling
- **Immutable Deployments**: Use SHA-based tagging for security and traceability
- **Secrets Management**: Use Sealed Secrets or External Secrets Operator

### SHA-Based Immutable Deployments

This project implements **enterprise-grade immutable deployments** using SHA-based tagging:

**Security Benefits:**

- ✅ No mutable `latest` tags in production
- ✅ Each deployment pinned to exact commit SHA
- ✅ Tamper-evident through SHA verification
- ✅ Complete audit trail of deployments

**Tag Format:**

- Production: `main-sha-{full-commit-sha}` (e.g., `main-sha-abc123...`)
- Staging: `develop-sha-{full-commit-sha}` (e.g., `develop-sha-abc123...`)

**Rollback Example:**

```bash
# Rollback to specific SHA
kubectl set image deployment/api api=ghcr.io/user/service-mgr-api:main-sha-abc1234567890abcdef
```

Need help? Check the logs or create an issue in the repository!
