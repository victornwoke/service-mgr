#!/bin/bash

# Test GitHub Secrets Configuration
# Verifies that GitHub secrets are properly configured for CI/CD

set -euo pipefail

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

# Test GitHub Container Registry access
test_ghcr_access() {
    log_info "Testing GitHub Container Registry access..."

    if ! command -v docker >/dev/null 2>&1; then
        log_warning "Docker not found, skipping GHCR test"
        return 0
    fi

    # This would normally use GITHUB_TOKEN, but we can't test that directly
    log_info "GHCR access is handled automatically by GitHub Actions"
    log_info "Test by triggering a pipeline: git push origin main"
    return 0
}

# Test GitOps token format (basic validation)
test_gitops_token_format() {
    local token="${GITOPS_TOKEN:-}"

    if [ -z "$token" ]; then
        log_warning "GITOPS_TOKEN not set in environment"
        log_info "This is normal - token is only available in GitHub Actions"
        return 0
    fi

    log_info "Testing GitOps token format..."

    # Basic format validation (GitHub tokens start with ghp_ or github_pat_)
    if [[ $token =~ ^(ghp_|github_pat_) ]]; then
        log_success "GitOps token format appears valid"
    else
        log_warning "GitOps token format may be incorrect"
        log_info "GitHub tokens should start with 'ghp_' or 'github_pat_'"
    fi
}

# Test database secret placeholders
test_db_secrets() {
    log_info "Testing database secret configuration..."

    local secrets=("DB_POSTGRES_PASSWORD" "DB_USERNAME" "DB_PASSWORD" "DB_NAME")
    local missing_secrets=()

    for secret in "${secrets[@]}"; do
        if [ -z "${!secret:-}" ]; then
            missing_secrets+=("$secret")
        fi
    done

    if [ ${#missing_secrets[@]} -eq 0 ]; then
        log_success "All database secrets are configured"
    else
        log_warning "Missing database secrets: ${missing_secrets[*]}"
        log_info "These will be configured in GitHub repository secrets"
    fi
}

# Display next steps
display_next_steps() {
    echo ""
    log_info "📋 Next Steps for GitHub Secrets Configuration"
    echo "================================================"

    echo ""
    echo "1. 📝 Run the setup script:"
    echo "   ./scripts/setup-github-secrets.sh"
    echo ""

    echo "2. 🔑 Add secrets to GitHub:"
    echo "   Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions"
    echo "   Add each secret from the setup script output"
    echo ""

    echo "3. 🧪 Test the configuration:"
    echo "   git commit --allow-empty -m \"Test CI/CD pipeline\""
    echo "   git push origin main"
    echo ""

    echo "4. 📊 Monitor the results:"
    echo "   Check Actions tab for pipeline status"
    echo "   Verify images are pushed to GHCR"
    echo ""

    echo "5. 🚀 Deploy to production:"
    echo "   Set up ArgoCD and GitOps repository"
    echo "   Push to main branch for production deployment"
    echo ""
}

# Main test function
main() {
    log_info "🧪 Testing GitHub Secrets Configuration"
    echo "========================================"

    test_ghcr_access
    test_gitops_token_format
    test_db_secrets

    echo ""
    log_success "✅ Local validation complete!"
    log_info "GitHub Actions will perform the actual secret validation during pipeline runs."

    display_next_steps
}

# Run main function
main "$@"