# Service Manager - Step-by-Step Guide 📋

This guide provides detailed step-by-step instructions for setting up, developing, and deploying the Service Manager application.

## Quick Start (5 Minutes)

### Prerequisites Check

```bash
# Check if Docker is installed
docker --version

# Check if kubectl is available
kubectl version --client

# Check if you have access to a Kubernetes cluster
kubectl cluster-info
```

### One-Command Setup

```bash
# Clone and deploy everything
git clone <repository-url>
cd service-mgr
chmod +x automate.sh setup-db.sh
./automate.sh full-deploy
```

**That's it!** Your application will be running at `http://127.0.0.1:8080`

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

### Automated Deployment (Recommended)

```bash
# Full production deployment
./automate.sh full-deploy

# Or step-by-step
./automate.sh build         # Build images
./automate.sh deploy        # Deploy to K8s
./automate.sh health        # Run health checks
```

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

```bash
# Update to latest version
git pull origin main

# Rebuild and redeploy
./automate.sh full-deploy

# Or rolling update
./automate.sh build
kubectl rollout restart deployment -n service-mgr
```

---

## 🎯 Feature Walkthrough

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

Need help? Check the logs or create an issue in the repository!
