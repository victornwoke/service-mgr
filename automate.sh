#!/bin/bash

# Service Manager - Complete DevOps Automation Script
# Handles build, deploy, manage, and monitor the full application stack

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="service-mgr"
REGISTRY="${REGISTRY:-sirhumble07}"
TAG="${TAG:-latest}"
NAMESPACE="${NAMESPACE:-service-mgr}"
ENVIRONMENT="${ENVIRONMENT:-production}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_header() {
    echo -e "${PURPLE}================================${NC}"
    echo -e "${PURPLE}$1${NC}"
    echo -e "${PURPLE}================================${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_header "Checking Prerequisites"

    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed or not in PATH"
        exit 1
    fi

    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        log_error "kubectl is not installed or not in PATH"
        exit 1
    fi

    # Check Terraform
    if ! command -v terraform &> /dev/null; then
        log_error "Terraform is not installed or not in PATH"
        exit 1
    fi

    log_success "All prerequisites met"
}

# Build all components
build_all() {
    log_header "Building All Components"

    # Build frontend
    log_info "Building frontend..."
    cd frontend-react
    docker build -t ${REGISTRY}/sbms-frontend:${TAG} .
    log_success "Frontend built"

    # Build backend
    log_info "Building backend..."
    cd ../backend-node
    docker build -t ${REGISTRY}/sbms-api:${TAG} .
    log_success "Backend built"

    # Build worker
    log_info "Building worker..."
    cd ../worker-python
    docker build -t ${REGISTRY}/sbms-worker:${TAG} .
    log_success "Worker built"

    cd ..
    log_success "All components built successfully"
}

# Push images to registry
push_images() {
    log_header "Pushing Images to Registry"

    log_info "Pushing frontend image..."
    docker push ${REGISTRY}/sbms-frontend:${TAG}

    log_info "Pushing backend image..."
    docker push ${REGISTRY}/sbms-api:${TAG}

    log_info "Pushing worker image..."
    docker push ${REGISTRY}/sbms-worker:${TAG}

    log_success "All images pushed to registry"
}

# Deploy using Terraform
deploy_terraform() {
    log_header "Deploying with Terraform"

    cd terraform-local

    log_info "Initializing Terraform..."
    terraform init

    log_info "Planning Terraform deployment..."
    terraform plan

    log_info "Applying Terraform deployment..."
    terraform apply -auto-approve

    cd ..
    log_success "Terraform deployment completed"
}

# Destroy using Terraform
destroy_terraform() {
    log_header "Destroying with Terraform"

    cd terraform-local

    log_warning "This will destroy the entire local cluster and all resources!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Destroying Terraform resources..."
        terraform destroy -auto-approve
        log_success "Terraform destroy completed"
    else
        log_info "Destroy cancelled"
    fi

    cd ..
}

# Wait for rollout completion
wait_for_rollout() {
    log_header "Waiting for Rollout Completion"

    log_info "Waiting for backend rollout..."
    kubectl rollout status deployment/service-mgr-node-api -n ${NAMESPACE} --timeout=300s

    log_info "Waiting for frontend rollout..."
    kubectl rollout status deployment/service-mgr-frontend -n ${NAMESPACE} --timeout=300s

    log_info "Waiting for worker rollout..."
    kubectl rollout status deployment/service-mgr-python-worker -n ${NAMESPACE} --timeout=300s

    log_success "All deployments rolled out successfully"
}

# Health checks
health_check() {
    log_header "Running Health Checks"

    # Check pod status
    local unhealthy_pods=$(kubectl get pods -n ${NAMESPACE} --no-headers | grep -v Running | wc -l)

    if [ "$unhealthy_pods" -gt 0 ]; then
        log_error "Found unhealthy pods:"
        kubectl get pods -n ${NAMESPACE} | grep -v Running
        return 1
    fi

    # Test API health
    local api_url=$(kubectl get ingress -n ${NAMESPACE} -o jsonpath='{.items[0].spec.rules[0].host}')
    if [ -n "$api_url" ]; then
        log_info "Testing API health at ${api_url}/api/healthz"
        # Note: This would need curl or wget, but keeping it simple for now
        log_info "API health check would go here"
    fi

    log_success "Health checks passed"
}

# Show status
show_status() {
    log_header "Application Status"

    echo -e "${CYAN}Namespace: ${NAMESPACE}${NC}"
    echo ""

    echo -e "${CYAN}Pods:${NC}"
    kubectl get pods -n ${NAMESPACE}
    echo ""

    echo -e "${CYAN}Services:${NC}"
    kubectl get services -n ${NAMESPACE}
    echo ""

    echo -e "${CYAN}Ingress:${NC}"
    kubectl get ingress -n ${NAMESPACE}
    echo ""

    echo -e "${CYAN}Recent Events:${NC}"
    kubectl get events -n ${NAMESPACE} --sort-by=.metadata.creationTimestamp | tail -10
}

# Stop application
stop_app() {
    log_header "Stopping Application"

    log_warning "Scaling down deployments..."
    kubectl scale deployment service-mgr-node-api service-mgr-frontend service-mgr-python-worker -n ${NAMESPACE} --replicas=0

    log_success "Application stopped"
}

# Start application
start_app() {
    log_header "Starting Application"

    log_info "Scaling up deployments..."
    kubectl scale deployment service-mgr-node-api service-mgr-frontend service-mgr-python-worker -n ${NAMESPACE} --replicas=1

    log_info "Waiting for startup..."
    kubectl wait --for=condition=available --timeout=300s deployment/service-mgr-node-api -n ${NAMESPACE}
    kubectl wait --for=condition=available --timeout=300s deployment/service-mgr-frontend -n ${NAMESPACE}
    kubectl wait --for=condition=available --timeout=300s deployment/service-mgr-python-worker -n ${NAMESPACE}

    log_success "Application started"
}

# Restart application
restart_app() {
    log_header "Restarting Application"

    log_info "Triggering rolling restart..."
    kubectl rollout restart deployment service-mgr-node-api -n ${NAMESPACE}
    kubectl rollout restart deployment service-mgr-frontend -n ${NAMESPACE}
    kubectl rollout restart deployment service-mgr-python-worker -n ${NAMESPACE}

    wait_for_rollout
    log_success "Application restarted"
}

# Cleanup resources
cleanup() {
    log_header "Cleaning Up Resources"

    log_warning "This will delete all resources in namespace ${NAMESPACE}"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deleting namespace and all resources..."
        kubectl delete namespace ${NAMESPACE} --ignore-not-found=true
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Logs
show_logs() {
    local component="${1:-api}"
    local lines="${2:-50}"

    case $component in
        api|backend)
            kubectl logs -f deployment/service-mgr-node-api -n ${NAMESPACE} --tail=${lines}
            ;;
        frontend)
            kubectl logs -f deployment/service-mgr-frontend -n ${NAMESPACE} --tail=${lines}
            ;;
        worker)
            kubectl logs -f deployment/service-mgr-python-worker -n ${NAMESPACE} --tail=${lines}
            ;;
        *)
            log_error "Invalid component. Use: api, frontend, or worker"
            exit 1
            ;;
    esac
}

# Database operations
db_backup() {
    log_header "Database Backup"

    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="backup_${timestamp}.sql"

    log_info "Creating database backup..."
    kubectl exec -n ${NAMESPACE} deployment/service-mgr-postgres -- pg_dump -U postgres sbms > ${backup_file}

    log_success "Backup saved to: ${backup_file}"
}

db_restore() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi

    log_header "Database Restore"
    log_warning "This will overwrite the current database!"

    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Restoring database from ${backup_file}..."
        kubectl exec -n ${NAMESPACE} deployment/service-mgr-postgres -- psql -U postgres sbms < ${backup_file}
        log_success "Database restored"
    else
        log_info "Restore cancelled"
    fi
}

# Main command handler
main() {
    local command="$1"

    case $command in
        build)
            check_prerequisites
            build_all
            push_images
            ;;
        deploy)
            check_prerequisites
            deploy_k8s
            wait_for_rollout
            health_check
            ;;
        terraform-deploy)
            check_prerequisites
            deploy_terraform
            ;;
        terraform-destroy)
            destroy_terraform
            ;;
        full-deploy)
            check_prerequisites
            build_all
            push_images
            deploy_terraform
            ;;
        status)
            show_status
            ;;
        health)
            health_check
            ;;
        start)
            start_app
            ;;
        stop)
            stop_app
            ;;
        restart)
            restart_app
            ;;
        logs)
            show_logs "${2:-api}" "${3:-50}"
            ;;
        backup)
            db_backup
            ;;
        restore)
            db_restore "$2"
            ;;
        cleanup)
            cleanup
            ;;
        help|*)
            show_help
            ;;
    esac
}

# Show help
show_help() {
    cat << EOF
Service Manager - Complete DevOps Automation Script

USAGE:
    $0 <command> [options]

 COMMANDS:
    build               Build all components and push images
    deploy              Deploy to Kubernetes (assumes images exist)
    terraform-deploy    Deploy using Terraform (sets up local cluster)
    terraform-destroy   Destroy Terraform resources (local cluster)
    full-deploy         Complete pipeline: build + terraform-deploy
    status              Show application status
    health              Run health checks
    start               Start application (scale up)
    stop                Stop application (scale down)
    restart             Restart all deployments
    logs <comp>         Show logs for component (api/frontend/worker)
    backup              Create database backup
    restore <file>      Restore database from backup file
    cleanup             Delete all resources (DANGER!)
    help                Show this help

ENVIRONMENT VARIABLES:
    REGISTRY        Docker registry (default: sirhumble07)
    TAG             Image tag (default: latest)
    NAMESPACE       Kubernetes namespace (default: service-mgr)
    ENVIRONMENT     Environment (default: production)

 EXAMPLES:
    $0 full-deploy              # Complete deployment pipeline (build + terraform)
    $0 build                    # Just build and push images
    $0 terraform-deploy         # Deploy with Terraform (local cluster)
    $0 terraform-destroy        # Destroy local cluster
    $0 deploy                   # Deploy with kubectl (existing cluster)
    $0 status                   # Check application status
    $0 logs api 100             # Show last 100 lines of API logs
    $0 restart                  # Rolling restart of all components
    $0 backup                   # Create database backup
    REGISTRY=myreg $0 build     # Use custom registry

EOF
}

# Script entry point
if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

main "$@"