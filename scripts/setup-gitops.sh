#!/bin/bash

# Service Manager - GitOps Repository Setup Script
# Creates the initial structure for the GitOps repository

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GITOPS_DIR="${SCRIPT_DIR}/../gitops-repo-structure"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Create directory structure
create_directories() {
    log_info "Creating GitOps repository structure..."

    mkdir -p "${GITOPS_DIR}/charts"
    mkdir -p "${GITOPS_DIR}/environments/staging"
    mkdir -p "${GITOPS_DIR}/environments/production"
    mkdir -p "${GITOPS_DIR}/argocd"

    log_success "Directory structure created"
}

# Copy Helm chart
copy_helm_chart() {
    log_info "Copying Helm chart..."

    if [ -d "${SCRIPT_DIR}/../charts/service-mgr" ]; then
        cp -r "${SCRIPT_DIR}/../charts/service-mgr" "${GITOPS_DIR}/charts/"
        log_success "Helm chart copied"
    else
        log_error "Helm chart not found at ${SCRIPT_DIR}/../charts/service-mgr"
        exit 1
    fi
}

# Create environment-specific values
create_environment_values() {
    log_info "Creating environment-specific values files..."

    # Staging values
    cat > "${GITOPS_DIR}/environments/staging/values.yaml" << 'EOF'
global:
  environment: staging

frontend:
  replicaCount: 1
  image:
    tag: "latest"

api:
  replicaCount: 1
  image:
    tag: "latest"

worker:
  replicaCount: 1
  image:
    tag: "latest"

ingress:
  enabled: true
  hosts:
    - host: staging.service-mgr.local
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
              name: service-mgr-api
              port:
                number: 8081
EOF

    # Production values
    cat > "${GITOPS_DIR}/environments/production/values.yaml" << 'EOF'
global:
  environment: production

frontend:
  replicaCount: 3
  image:
    tag: "latest"

api:
  replicaCount: 3
  image:
    tag: "latest"

worker:
  replicaCount: 2
  image:
    tag: "latest"

postgresql:
  auth:
    postgresPassword: "CHANGE_THIS_IN_PRODUCTION"
    username: "servicemgr"
    password: "CHANGE_THIS_IN_PRODUCTION"
    database: "servicemgr"

ingress:
  enabled: true
  hosts:
    - host: service-mgr.local
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
              name: service-mgr-api
              port:
                number: 8081
  tls:
    - secretName: service-mgr-tls
      hosts:
        - service-mgr.local
EOF

    log_success "Environment values files created"
}

# Create ArgoCD applications
create_argocd_apps() {
    log_info "Creating ArgoCD application manifests..."

    # Staging application
    cat > "${GITOPS_DIR}/argocd/staging-app.yaml" << 'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: service-mgr-staging
  namespace: argocd
  labels:
    environment: staging
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_USERNAME/service-mgr-gitops
    targetRevision: HEAD
    path: charts/service-mgr
    helm:
      valueFiles:
        - values.yaml
        - ../../environments/staging/values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: service-mgr-staging
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
EOF

    # Production application
    cat > "${GITOPS_DIR}/argocd/production-app.yaml" << 'EOF'
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: service-mgr-production
  namespace: argocd
  labels:
    environment: production
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    repoURL: https://github.com/YOUR_USERNAME/service-mgr-gitops
    targetRevision: HEAD
    path: charts/service-mgr
    helm:
      valueFiles:
        - values.yaml
        - ../../environments/production/values.yaml
  destination:
    server: https://kubernetes.default.svc
    namespace: service-mgr
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  revisionHistoryLimit: 10
EOF

    log_success "ArgoCD applications created"
}

# Create secrets template
create_secrets_template() {
    log_info "Creating secrets template..."

    cat > "${GITOPS_DIR}/environments/production/secrets.yaml.template" << 'EOF'
# Production Secrets Template
# Use this as a reference for creating encrypted secrets

apiVersion: v1
kind: Secret
metadata:
  name: service-mgr-secrets
  namespace: service-mgr
type: Opaque
data:
  # Base64 encoded values - replace with actual encrypted secrets
  database-url: "cG9zdGdyZXM6Ly91c2VyOnBhc3NAZGI6NTQzMi9kYm5hbWU="  # postgresql://user:pass@db:5432/dbname
  jwt-secret: "eW91ci1zdXBlci1zZWNyZXQtand0LWtleS1jaGFuZ2UtdGhpcy1pbi1wcm9kdWN0aW9u"
  redis-url: "cmVkaXM6Ly9zZXJ2aWNlLW1nci1yZWRpczowMDAw"
EOF

    log_success "Secrets template created"
}

# Create .gitignore
create_gitignore() {
    log_info "Creating .gitignore..."

    cat > "${GITOPS_DIR}/.gitignore" << 'EOF'
# Environment-specific secrets
environments/*/secrets.yaml
environments/*/secrets.enc.yaml
!environments/*/secrets.yaml.template

# Temporary files
*.tmp
*.bak

# OS generated files
.DS_Store
Thumbs.db
EOF

    log_success ".gitignore created"
}

# Main setup function
main() {
    log_info "Setting up GitOps repository structure..."

    create_directories
    copy_helm_chart
    create_environment_values
    create_argocd_apps
    create_secrets_template
    create_gitignore

    log_success "✅ GitOps repository structure setup complete!"
    echo ""
    log_info "Next steps:"
    echo "1. Create a new GitHub repository: YOUR_USERNAME/service-mgr-gitops"
    echo "2. Copy the contents of gitops-repo-structure/ to the new repository"
    echo "3. Update YOUR_USERNAME in argocd/*.yaml files"
    echo "4. Set up secrets in environments/production/secrets.yaml"
    echo "5. Push to the gitops repository"
    echo "6. Apply ArgoCD applications: kubectl apply -f argocd/"
    echo ""
    log_info "Repository structure created at: ${GITOPS_DIR}"
}

main "$@"