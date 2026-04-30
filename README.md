# Service Manager - Production DevOps Stack

A comprehensive production-ready DevOps stack for the Service Manager application featuring Infrastructure as Code, CI/CD, GitOps, and Observability.

## 🏗️ Architecture Overview

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
│  │    AWS EKS          │◄─┼──┤   Helm Charts               │ │
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
                            ▼
                   ┌─────────────────────┐
                   │   Production App    │
                   │ service-mgr.local   │
                   └─────────────────────┘
```

## 🚀 Quick Deployment

### Prerequisites

- AWS CLI configured
- kubectl installed
- Helm installed
- Docker registry access

### Development Setup

- **Local Terraform**: `./deploy-local.sh deploy` (see terraform-local/README.md)
- **CI/CD Pipeline**: See [CI/CD Pipeline Documentation](docs/CICD-PIPELINE.md)

### One-Command Setup

```bash
# 1. Clone the repository
git clone https://github.com/victornwoke/service-mgr.git
cd service-mgr

# 2. Deploy infrastructure
cd terraform
terraform init
terraform plan
terraform apply

# 3. Configure kubectl
aws eks update-kubeconfig --name service-mgr-production

# 4. Deploy monitoring
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install monitoring prometheus-community/kube-prometheus-stack -f monitoring/values.yaml

# 5. Deploy application (GitOps)
kubectl apply -f argocd/application.yaml
```

## Component Overview

### Infrastructure (Terraform)

- **AWS EKS Cluster**: Managed Kubernetes service
- **VPC & Networking**: Private subnets, NAT gateways
- **RDS PostgreSQL**: Managed database with monitoring
- **ECR Repository**: Private container registry
- **Security Groups**: Least-privilege access controls

**Files**: `terraform/`

### CI/CD (GitHub Actions)

- **Automated Builds**: Multi-stage Docker builds
- **Security Scanning**: Trivy vulnerability scans
- **Testing**: Backend and frontend test suites
- **GitOps Updates**: Automatic manifest updates
- **Image Tagging**: SHA-based versioning

**Files**: `.github/workflows/ci.yaml`

### Packaging (Helm)

- **Modular Charts**: Separate configurations for each component
- **Configurable Values**: Environment-specific settings
- **Security Hardening**: Non-root users, resource limits
- **Monitoring Integration**: ServiceMonitors and metrics

**Files**: `charts/service-mgr/`

### GitOps (ArgoCD)

- **Automated Sync**: Push-to-deploy workflow
- **Drift Detection**: Automatic reconciliation
- **Rollback Support**: Version-controlled deployments
- **Multi-Environment**: Production/staging separation

**Files**: `argocd/application.yaml`

### Observability (Prometheus Stack)

- **Metrics Collection**: Application and infrastructure metrics
- **Custom Dashboards**: Grafana visualizations
- **Alerting**: Email notifications for critical issues
- **Service Monitoring**: Health checks and performance tracking

**Files**: `monitoring/values.yaml`

## Detailed Setup Instructions

### Phase 1: Infrastructure Setup

```bash
# Navigate to Terraform directory
cd terraform

# Initialize Terraform
terraform init

# Plan the deployment
terraform plan -var="db_username=servicemgr" -var="db_password=your-secure-password"

# Apply the infrastructure
terraform apply -var="db_username=servicemgr" -var="db_password=your-secure-password"
```

**What gets created:**

- EKS cluster with managed node groups
- VPC with public/private subnets
- RDS PostgreSQL instance
- ECR repository for images
- Security groups and IAM roles

### Phase 2: Kubernetes Configuration

```bash
# Configure kubectl for the new cluster
aws eks update-kubeconfig --name service-mgr-production

# Verify connection
kubectl get nodes
kubectl get pods -A
```

### Phase 3: Monitoring Stack

```bash
# Add Helm repositories
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install monitoring stack
helm install monitoring prometheus-community/kube-prometheus-stack \
  -f monitoring/values.yaml \
  -n monitoring --create-namespace

# Verify monitoring components
kubectl get pods -n monitoring
kubectl get svc -n monitoring
```

### Phase 4: Application Deployment (GitOps)

```bash
# Create GitOps repository (separate from main repo)
# Copy charts/service-mgr/ to your gitops repo

# Apply ArgoCD application
kubectl apply -f argocd/application.yaml

# Monitor deployment
kubectl get applications -n argocd
kubectl get pods -n service-mgr
```

## 🔧 Configuration Management

### Environment Variables

Create secrets for sensitive data:

```bash
# Database credentials
kubectl create secret generic service-mgr-secrets \
  --from-literal=database-url="postgresql://servicemgr:password@rds-endpoint:5432/servicemgr" \
  --from-literal=jwt-secret="your-super-secret-key" \
  --from-literal=redis-url="redis://redis-service:6379" \
  -n service-mgr
```

### Helm Values Override

For production overrides:

```yaml
# charts/service-mgr/values-production.yaml
api:
  replicaCount: 3
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi

postgresql:
  enabled: false  # Use external RDS

ingress:
  hosts:
    - host: your-domain.com
```

## 📊 Monitoring & Observability

### Accessing Grafana

```bash
# Get Grafana admin password
kubectl get secret monitoring-grafana -n monitoring -o jsonpath="{.data.admin-password}" | base64 --decode

# Port forward Grafana
kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80

# Access at: http://localhost:3000
# Username: admin
# Password: (from above command)
```

### Key Dashboards

- **Kubernetes / Compute Resources**: Cluster resource usage
- **Kubernetes / API Server**: API server performance
- **Service Manager**: Custom application metrics
- **PostgreSQL**: Database performance metrics

### Alerting

Configured alerts for:

- Pod restarts in service-mgr namespace
- High memory/CPU usage
- Service downtime
- Database connection errors
- Slow API responses

## 🔒 Security Best Practices

### Container Security

- **Non-root users**: All containers run as UID 1001
- **Minimal base images**: Alpine Linux for smaller attack surface
- **Read-only filesystems**: Where applicable
- **Security contexts**: Pod and container security policies

### Network Security

- **Private subnets**: Application components in private subnets
- **Security groups**: Least-privilege access rules
- **Network policies**: Inter-pod communication controls
- **TLS termination**: Ingress handles SSL/TLS

### Access Control

- **RBAC**: Role-based access for Kubernetes resources
- **Service accounts**: Component-specific identities
- **Secret management**: External secrets, no hardcoded credentials
- **IAM roles**: Least-privilege AWS permissions

## CI/CD Workflow

### Automatic Pipeline

1. **Push to main**: Triggers GitHub Actions
2. **Build**: Creates Docker images with SHA tags
3. **Test**: Runs unit and integration tests
4. **Security**: Scans for vulnerabilities
5. **GitOps Update**: Updates manifest repository
6. **ArgoCD Sync**: Automatically deploys to production

### Manual Deployment

```bash
# Force rebuild and deploy
./automate.sh full-deploy

# Update specific component
kubectl rollout restart deployment/service-mgr-api -n service-mgr

# Rollback if needed
kubectl rollout undo deployment/service-mgr-api -n service-mgr
```

## Scaling & Performance

### Horizontal Scaling

```bash
# Scale API pods
kubectl scale deployment service-mgr-api --replicas=5 -n service-mgr

# Scale worker pods
kubectl scale deployment service-mgr-worker --replicas=3 -n service-mgr
```

### Vertical Scaling

Update Helm values and redeploy:

```yaml
api:
  resources:
    limits:
      cpu: 2000m
      memory: 2Gi
    requests:
      cpu: 1000m
      memory: 1Gi
```

### Database Scaling

- RDS supports automated scaling
- Read replicas for high availability
- Connection pooling via application

## 🔍 Troubleshooting

### Application Issues

```bash
# Check pod status
kubectl get pods -n service-mgr

# View logs
kubectl logs -f deployment/service-mgr-api -n service-mgr
kubectl logs -f deployment/service-mgr-frontend -n service-mgr

# Debug containers
kubectl exec -it deployment/service-mgr-api -n service-mgr -- /bin/sh
```

### Infrastructure Issues

```bash
# Check cluster status
kubectl cluster-info
kubectl get nodes

# Verify AWS resources
aws eks describe-cluster --name service-mgr-production
aws rds describe-db-instances --db-instance-identifier service-mgr-postgres
```

### Monitoring Issues

```bash
# Check Prometheus targets
kubectl port-forward svc/monitoring-prometheus-operated -n monitoring 9090:9090
# Visit: http://localhost:9090/targets

# Check Grafana
kubectl port-forward svc/monitoring-grafana -n monitoring 3000:80
# Visit: http://localhost:3000
```

## 📚 Additional Resources

- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws)
- [Helm Documentation](https://helm.sh/docs/)
- [ArgoCD Documentation](https://argo-cd.readthedocs.io/)
- [Prometheus Documentation](https://prometheus.io/docs/)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes following the established patterns
4. Update documentation
5. Submit a pull request

## Support

For production support:

- Check application logs
- Monitor Grafana dashboards
- Review Alertmanager notifications
- Create GitHub issues for bugs

---

**Your Service Manager application now has enterprise-grade DevOps infrastructure!**

This setup provides production-ready CI/CD, GitOps deployment, comprehensive monitoring, and scalable infrastructure that can grow with your application needs.
