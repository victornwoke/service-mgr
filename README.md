# Service Manager 🏢

A comprehensive service management application built with modern technologies for managing jobs, customers, staff, and invoices.

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://docker.com)
[![Kubernetes](https://img.shields.io/badge/Kubernetes-Deployed-326ce5)](https://kubernetes.io)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue)](https://postgresql.org)
[![CI/CD](https://img.shields.io/badge/CI/CD-GitHub%20Actions-2088FF)](https://github.com/actions)
[![GitOps](https://img.shields.io/badge/GitOps-ArgoCD-FF4081)](https://argo-cd.readthedocs.io/)

## Overview

Service Manager is a comprehensive SaaS platform for service-based businesses (tradespeople, repair technicians, cleaners, etc.) built with modern cloud-native architecture and enterprise-grade DevOps infrastructure.

## 📋 Table of Contents

- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Development](#-development)
- [Deployment](#-deployment)
- [CI/CD Pipeline](#-cicd-pipeline)
- [API Documentation](#-api-documentation)
- [Mobile Responsiveness](#-mobile-responsiveness)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## ✨ Features

### Job Management
- ✅ **Create & Edit Jobs**: Full CRUD operations with validation
- ✅ **Job Timeline**: Interactive status workflow (Pending → Quote → Booked → In Progress → Completed → Invoiced)
- ✅ **Staff Assignment**: Assign staff members to jobs
- ✅ **Advanced Filtering**: Filter by status, staff, customer, date ranges
- ✅ **Job Notes**: Track progress with detailed notes

### Customer Management
- ✅ **Customer Profiles**: Complete customer information management
- ✅ **Job History**: View all jobs associated with customers
- ✅ **Contact Management**: Phone, email, and address tracking
- ✅ **Search & Filter**: Find customers quickly

### Staff Management
- ✅ **Staff Directory**: Manage staff members with role-based access
- ✅ **Role Management**: Admin, Manager, Staff roles with different permissions
- ✅ **Workload Tracking**: Monitor staff assignments and availability
- ✅ **Performance Metrics**: Track completed jobs and efficiency

### Invoice Management
- ✅ **Automatic Invoice Creation**: Generate invoices from completed jobs
- ✅ **Invoice Tracking**: Monitor paid/unpaid status
- ✅ **PDF Generation**: Export invoices (coming soon)
- ✅ **Email Integration**: Send invoices to customers (coming soon)

### Dashboard & Analytics
- ✅ **Real-time Metrics**: Today's jobs, monthly revenue, completion rates
- ✅ **Visual Charts**: Status breakdowns and performance indicators
- ✅ **Quick Actions**: Fast access to create jobs, customers, and invoices

### Schedule Management
- ✅ **Interactive Calendar**: Clickable date navigation
- ✅ **Weekly/Monthly Views**: Navigate between different time periods
- ✅ **Job Visualization**: See jobs scheduled for each day
- ✅ **Today Highlighting**: Special indicators for current date

## 🏗️ Architecture

```txt
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Backend │    │ PostgreSQL DB   │
│   (Port 3000)   │◄──►│   (Port 8081)   │◄──►│   (Port 5432)   │
│                 │    │                 │    │                 │
│ • User Interface│    │ • REST API      │    │ • Jobs          │
│ • Dashboard     │    │ • Authentication│    │ • Customers     │
│ • Forms         │    │ • Business Logic│    │ • Staff         │
│ • Responsive UI │    │ • File Uploads  │    │ • Invoices      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                                 │
┌─────────────────┐                                              │
│ Python Worker   │                                              │
│ (Port 8082)     │◄─────────────────────────────────────────────┘
│                 │
│ • Background Jobs│
│ • Email Sending │
│ • File Processing│
└─────────────────┘
```

### Deployment Architecture (Kubernetes + GitOps)

```txt
┌─────────────────────────────────────────────────────────────┐
│                    Production Stack                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Terraform  │  │ GitHub      │  │     ArgoCD          │  │
│  │   (IaC)     │  │ Actions     │  │    (GitOps)         │  │
│  │             │  │ (CI/CD)     │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│           │               │                      │           │
│           └───────────────┼──────────────────────┘           │
│                           │                                  │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐ │
│  │   AWS EKS          │◄─┼──┤   Helm Charts               │ │
│  │  (Kubernetes)      │  │  │   (Packaging)               │ │
│  │                     │  │  │                             │ │
│  │ • Service Manager  │  │  │ • Frontend, API, Worker     │ │
│  │ • PostgreSQL       │  │  │ • ConfigMaps, Secrets       │ │
│  │ • Redis            │  │  │ • Ingress, Services         │ │
│  │ • Monitoring       │  │  │ • RBAC, Security            │ │
│  └─────────────────────┘  │  └─────────────────────────────┘ │
│                           │                                  │
│  ┌─────────────────────┐  │  ┌─────────────────────────────┐ │
│  │   Prometheus        │◄─┼──┤   Grafana Dashboard        │ │
│  │   Alertmanager      │  │  │   Custom Metrics           │ │
│  │   (Monitoring)      │  │  │   Alerts & Notifications   │ │
│  └─────────────────────┘  │  └─────────────────────────────┘ │
└───────────────────────────┼──────────────────────────────────┘
                            │
                    ┌─────────────────────┐
                    │   Production App    │
                    │ service-mgr.local   │
                    └─────────────────────┘
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **Material-UI (MUI)** - Component library with theming
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Vite** - Fast build tool and dev server

### Backend
- **Node.js 20** - Runtime environment
- **Express.js** - Web framework
- **Sequelize** - ORM for database operations
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing

### Database
- **PostgreSQL 16** - Relational database
- **Sequelize CLI** - Database migrations and seeding
- **Persistent Storage** - Kubernetes PVC for data persistence

### DevOps & Deployment
- **Docker** - Containerization
- **Kubernetes** - Container orchestration
- **Nginx** - Reverse proxy and load balancing
- **RBAC** - Role-based access control
- **Health Checks** - Application monitoring

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** - Testing framework
- **Git** - Version control

## 📋 Prerequisites

- **Docker & Docker Compose** (for local development)
- **Kubernetes cluster** (for production deployment)
- **kubectl** (Kubernetes CLI)
- **Node.js 20+** (for local frontend/backend development)
- **Python 3.11+** (for worker development)

## 🚀 Installation

### Quick Start (Automated)

```bash
# 1. Clone the repository
git clone https://github.com/victornwoke/service-mgr.git
cd service-mgr

# Make scripts executable
chmod +x automate.sh setup-db.sh

# Full automated deployment
./automate.sh full-deploy
```

This will:
- ✅ Build all Docker images
- ✅ Push to registry
- ✅ Deploy to Kubernetes
- ✅ Set up database
- ✅ Run health checks

### Manual Installation

#### 1. Clone and Setup
```bash
git clone <repository-url>
cd service-mgr
```

#### 2. Environment Setup
```bash
# Copy environment files
cp backend-node/.env.example backend-node/.env
cp frontend-react/.env.example frontend-react/.env
```

#### 3. Database Setup
```bash
# Start PostgreSQL
docker run -d --name service-mgr-postgres \
  -p 5432:5432 \
  -e POSTGRES_DB=servicemgr \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16

# Run migrations
cd backend-node
npm run migrate
```

#### 4. Backend Setup
```bash
cd backend-node
npm install
npm run dev
```

#### 5. Frontend Setup
```bash
cd ../frontend-react
npm install
npm run dev
```

#### 6. Worker Setup (Optional)
```bash
cd ../worker-python
pip install -r requirements.txt
python worker.py
```

## 💻 Development

### Local Development Workflow
```bash
# Terminal 1: Start database
docker run -d --name service-mgr-postgres -p 5432:5432 postgres:16

# Terminal 2: Start backend
cd backend-node && npm run dev

# Terminal 3: Start frontend
cd frontend-react && npm run dev

# Terminal 4: Start worker (optional)
cd worker-python && python worker.py
```

### Available Scripts

#### Backend (`backend-node/`)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run migrate      # Run database migrations
npm run seed         # Seed database with sample data
npm run lint         # Lint code
```

#### Frontend (`frontend-react/`)
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run lint         # Lint code
npm run preview      # Preview production build
```

#### Automation Scripts
```bash
./automate.sh build         # Build all images
./automate.sh deploy        # Deploy to Kubernetes
./automate.sh full-deploy   # Complete deployment pipeline
./automate.sh status        # Check cluster status
./automate.sh logs api      # View API logs
./setup-db.sh              # Initialize database
```

## 🚢 Deployment

### Automated Deployment
```bash
# Full production deployment
./automate.sh full-deploy

# Or step-by-step
./automate.sh build
./automate.sh deploy
```

### Manual Kubernetes Deployment
```bash
# Apply RBAC and configurations
kubectl apply -f k8s/rbac.yaml
kubectl apply -f k8s/namespace.yaml

# Deploy services
kubectl apply -f k8s/service-mgr.yaml

# Check deployment status
kubectl get pods -n service-mgr
kubectl get services -n service-mgr
```

### Environment Configuration
Create secrets for sensitive data:
```bash
# Database credentials
kubectl create secret generic service-mgr-secrets \
  --from-literal=database-url="postgresql://servicemgr:password@rds-endpoint:5432/servicemgr" \
  --from-literal=jwt-secret="your-super-secret-key" \
  --from-literal=redis-url="redis://redis-service:6379" \
  -n service-mgr
```

## 🔧 CI/CD Pipeline

### Overview
This project includes a complete CI/CD pipeline using GitHub Actions, Helm, and ArgoCD for automated deployments.

### Pipeline Stages
1. **Build & Test**: Docker image creation and testing
2. **Security Scan**: Trivy vulnerability scanning
3. **Deploy Staging**: Automatic deployment to staging on develop branch
4. **Deploy Production**: Automatic deployment to production on main branch

### GitOps Integration
- **ArgoCD Applications**: Automated synchronization
- **Multi-environment**: Staging and production environments
- **Immutable Deployments**: SHA-based image tagging

### Setup Instructions
See [CI/CD Pipeline Documentation](docs/CICD-PIPELINE.md) for complete setup instructions.

## 📡 API Documentation

### Authentication Endpoints
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "Staff"
}
```

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Job Management
```http
GET    /api/v1/jobs              # List jobs with pagination
POST   /api/v1/jobs              # Create new job
GET    /api/v1/jobs/:id          # Get job details
PUT    /api/v1/jobs/:id          # Update job
DELETE /api/v1/jobs/:id          # Delete job
PATCH  /api/v1/jobs/:id/status   # Update job status
```

### Customer Management
```http
GET    /api/v1/customers         # List customers
POST   /api/v1/customers         # Create customer
GET    /api/v1/customers/:id     # Get customer details
PUT    /api/v1/customers/:id     # Update customer
DELETE /api/v1/customers/:id     # Delete customer
```

### Staff Management
```http
GET    /api/v1/staff             # List staff (Admin only)
POST   /api/v1/staff             # Create staff member
GET    /api/v1/staff/:id         # Get staff details
PUT    /api/v1/staff/:id         # Update staff member
DELETE /api/v1/staff/:id         # Delete staff member
```

### Invoice Management
```http
GET    /api/v1/invoices          # List invoices
POST   /api/v1/invoices          # Create invoice
GET    /api/v1/invoices/:id      # Get invoice details
PUT    /api/v1/invoices/:id      # Update invoice
DELETE /api/v1/invoices/:id      # Delete invoice
```

Interactive Swagger UI available at `/api-docs` (future).

## 📱 Mobile Responsiveness

The application is fully responsive and optimized for mobile devices:

### Responsive Features
- ✅ **No horizontal scrolling** on any screen size
- ✅ **Touch-friendly buttons** and interactive elements
- ✅ **Responsive navigation** that adapts to screen size
- ✅ **Optimized tables** with horizontal scroll when needed
- ✅ **Mobile-first forms** with proper input sizing

### Breakpoints
- **xs (0-600px)**: Mobile phones
- **sm (600-900px)**: Tablets
- **md (900-1200px)**: Small desktops
- **lg (1200px+)**: Large desktops

### Testing Responsiveness

**Chrome DevTools:**
1. Press `F12` → Click device icon (📱)
2. Select device presets or drag viewport
3. Test from 320px to 1920px widths

**Manual Testing:**
```bash
# Resize browser window and check:
# - No horizontal scroll bars
# - All content accessible
# - Buttons and links clickable
# - Text readable at all sizes
```

## 🔧 Troubleshooting

### Common Issues

**Port Forwarding Issues:**
```bash
# Restart port forwarding
pkill -f kubectl
kubectl port-forward svc/service-mgr-frontend 30080:80 -n service-mgr &
kubectl port-forward svc/service-mgr-node-api 30081:8081 -n service-mgr &
```

**Database Connection Issues:**
```bash
# Check database pod
kubectl logs -n service-mgr deployment/service-mgr-postgres

# Reset database
kubectl delete pod -n service-mgr -l app=service-mgr-postgres
```

**Pod Crash Issues:**
```bash
# Check pod status
kubectl get pods -n service-mgr

# View pod logs
kubectl logs -n service-mgr <pod-name>

# Describe pod for details
kubectl describe pod -n service-mgr <pod-name>
```

**Build Issues:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild images
./automate.sh build

# Force redeploy
kubectl rollout restart deployment -n service-mgr
```

### Health Checks
```bash
# API health
curl http://localhost:8081/healthz

# Database connectivity
kubectl exec -n service-mgr deployment/service-mgr-node-api -- npm run db:check

# Pod health
kubectl get pods -n service-mgr
kubectl top pods -n service-mgr

# Check events
kubectl get events -n service-mgr --sort-by=.metadata.creationTimestamp
```

### Logs and Monitoring
```bash
# View all logs
./automate.sh logs api
./automate.sh logs frontend
./automate.sh logs worker

# Monitor resources
kubectl top nodes
kubectl top pods -n service-mgr

# Check events
kubectl get events -n service-mgr --sort-by=.metadata.creationTimestamp
```

## 🤝 Contributing

### Development Setup
1. **Fork the repository**
2. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Run tests:**
   ```bash
   cd backend-node && npm test
   cd ../frontend-react && npm test
   ```
5. **Commit your changes:**
   ```bash
   git commit -m "feat: Add your feature description"
   ```
6. **Push to your fork**
7. **Create a Pull Request**

### Code Standards
- **ESLint**: Follow the configured linting rules
- **Prettier**: Code is automatically formatted
- **Testing**: Write tests for new features
- **Documentation**: Update README for new features

### Commit Message Format
```txt
type(scope): description

Types:
- feat: New features
- fix: Bug fixes
- docs: Documentation
- style: Code style changes
- refactor: Code refactoring
- test: Testing
- chore: Maintenance
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Material-UI** for the excellent component library
- **Sequelize** for the robust ORM
- **Express.js** for the web framework
- **PostgreSQL** for the reliable database
- **Kubernetes** for container orchestration
- **ArgoCD** for GitOps excellence
- **GitHub Actions** for CI/CD automation

---

**🎉 Your Service Manager application now has enterprise-grade DevOps infrastructure!**

This setup provides production-ready CI/CD, GitOps deployment, comprehensive monitoring, and scalable infrastructure that can grow with your application needs.