#!/bin/bash

# Service Manager - Local Development Deployment Script
# Uses Terraform to create a complete local development environment

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="${SCRIPT_DIR}/terraform-local"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

# Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check Docker daemon connectivity
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running or not accessible"
        log_info "Start Docker Desktop or Docker daemon, then try again"
        exit 1
    fi

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        log_info "Install kubectl from: https://kubernetes.io/docs/tasks/tools/"
        exit 1
    fi

    # Check kind
    if ! command -v kind &> /dev/null; then
        log_error "Kind is not installed or not in PATH"
        log_info "Install Kind from: https://kind.sigs.k8s.io/docs/user/quick-start/"
        exit 1
    fi

    # Check terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed or not in PATH"
        log_info "Install Terraform from: https://www.terraform.io/downloads.html"
        exit 1
    fi

    log_success "All prerequisites met"
}

# Main deployment function
deploy() {
    log_info "Starting local deployment..."

    cd "$TERRAFORM_DIR"

    # Initialize Terraform
    log_info "Initializing Terraform..."
    terraform init

    # Plan the deployment
    log_info "Planning deployment..."
    terraform plan -out=tfplan

    # Apply the configuration
    log_info "Applying configuration..."
    terraform apply tfplan

    # Validate CORS configuration
    log_info "Validating CORS configuration..."
    if kubectl get configmap service-mgr-config -n service-mgr -o jsonpath='{.data.CORS_ORIGINS}' > /dev/null 2>&1; then
        log_success "CORS configuration validated"
    else
        log_error "CORS configuration missing! Please check the deployment."
        exit 1
    fi

    # Show access information
    log_success "Deployment completed!"
    echo ""
    terraform output access_instructions

    log_success "Service Manager is now running locally!"
    log_info "Frontend: http://localhost:30080"
    log_info "API: http://localhost:30081"
}

# Destroy the environment
destroy() {
    log_warning "Destroying local environment..."

    cd "$TERRAFORM_DIR"

    read -p "Are you sure you want to destroy the local environment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        terraform destroy
        log_success "Environment destroyed"
    else
        log_info "Destroy cancelled"
    fi
}

# Show status
status() {
    log_info "Checking environment status..."

    if kind get clusters | grep -q "service-mgr-local"; then
        log_success "Kind cluster 'service-mgr-local' exists"

        # Configure kubectl
        export KUBECONFIG="$(kind get kubeconfig-path --name service-mgr-local)"

        # Check namespace
        if kubectl get namespace service-mgr &> /dev/null; then
            log_success "Namespace 'service-mgr' exists"

            # Show pods
            echo ""
            log_info "Pods in service-mgr namespace:"
            kubectl get pods -n service-mgr

            # Show services
            echo ""
            log_info "Services in service-mgr namespace:"
            kubectl get services -n service-mgr
        else
            log_warning "Namespace 'service-mgr' does not exist"
        fi
    else
        log_warning "Kind cluster 'service-mgr-local' does not exist"
        log_info "Run './deploy-local.sh deploy' to create the environment"
    fi
}

# Show help
show_help() {
    cat << EOF
Service Manager - Local Development Deployment Script

USAGE:
    $0 <command> [options]

COMMANDS:
    deploy      Create the complete local development environment
    destroy     Destroy the local environment (WARNING: loses data)
    status      Show status of local environment
    help        Show this help message

EXAMPLES:
    $0 deploy              # Create local environment
    $0 status              # Check environment status
    $0 destroy             # Destroy environment

The script will create:
- Kind Kubernetes cluster
- PostgreSQL database
- Service Manager application (API, Frontend, Worker)
- NGINX ingress controller

Access URLs after deployment:
- Frontend: http://localhost:8080
- API: http://localhost:8081

EOF
}

# Main script logic
main() {
    local command="${1:-help}"

    case $command in
        deploy)
            check_prerequisites
            deploy
            ;;
        destroy)
            destroy
            ;;
        status)
            status
            ;;
        help|*)
            show_help
            ;;
    esac
}

main "$@"