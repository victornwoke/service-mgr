# Service Manager - Makefile Interface
# Alternative interface to the automation script

.PHONY: help build deploy full-deploy status health start stop restart logs backup cleanup

# Default target
help: ## Show this help message
	@echo "Service Manager - Complete DevOps Automation"
	@echo ""
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-15s %s\n", $$1, $$2}'

# Core commands
build: ## Build all components and push images
	./automate.sh build

deploy: ## Deploy to Kubernetes (assumes images exist)
	./automate.sh deploy

full-deploy: ## Complete pipeline: build + deploy + health checks
	./automate.sh full-deploy

status: ## Show application status
	./automate.sh status

health: ## Run health checks
	./automate.sh health

# Lifecycle management
start: ## Start application (scale up)
	./automate.sh start

stop: ## Stop application (scale down)
	./automate.sh stop

restart: ## Restart all deployments
	./automate.sh restart

# Monitoring
logs-api: ## Show API logs
	./automate.sh logs api

logs-frontend: ## Show frontend logs
	./automate.sh logs frontend

logs-worker: ## Show worker logs
	./automate.sh logs worker

# Database
backup: ## Create database backup
	./automate.sh backup

# Cleanup
cleanup: ## Delete all resources (DANGER!)
	./automate.sh cleanup

# Development helpers
dev-frontend: ## Start frontend in development mode
	cd frontend-react && npm run dev

dev-backend: ## Start backend in development mode
	cd backend-node && npm run dev

dev-db: ## Start local PostgreSQL database
	docker run -d --name service-mgr-postgres -p 5432:5432 \
		-e POSTGRES_DB=sbms \
		-e POSTGRES_USER=postgres \
		-e POSTGRES_PASSWORD=postgres \
		postgres:16

# Testing
test-backend: ## Run backend tests
	cd backend-node && npm test

test-frontend: ## Run frontend tests (if any)
	cd frontend-react && npm test

# Quick deployment variants
deploy-dev: ## Deploy to development environment
	NAMESPACE=development ENVIRONMENT=development ./automate.sh deploy

deploy-staging: ## Deploy to staging environment
	NAMESPACE=staging ENVIRONMENT=staging ./automate.sh deploy

deploy-prod: ## Deploy to production environment
	NAMESPACE=service-mgr ENVIRONMENT=production ./automate.sh deploy

# Utility targets
check-prereqs: ## Check if all prerequisites are installed
	@echo "Checking prerequisites..."
	@command -v docker >/dev/null 2>&1 && echo "✅ Docker installed" || echo "❌ Docker not found"
	@command -v kubectl >/dev/null 2>&1 && echo "✅ kubectl installed" || echo "❌ kubectl not found"
	@kubectl cluster-info >/dev/null 2>&1 && echo "✅ Kubernetes cluster accessible" || echo "❌ Cannot connect to Kubernetes cluster"

setup: ## Initial setup - create namespace and secrets
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/service-mgr.yaml

# CI/CD targets
ci-build: ## CI build job
	@echo "Running CI build..."
	./automate.sh build

ci-deploy: ## CI deploy job
	@echo "Running CI deploy..."
	./automate.sh deploy

ci-test: ## CI test job
	@echo "Running CI tests..."
	# Add your CI tests here
	cd backend-node && npm test