#!/bin/bash

# Service Manager - Docker Image Tagging Demonstration
# Shows the immutable SHA-based tagging strategy

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

# Simulate different commit scenarios
simulate_tagging() {
    local branch="$1"
    local commit_sha="$2"
    local short_sha="${commit_sha:0:7}"
    local is_default_branch="$3"

    log_info "Simulating tagging for branch: $branch, commit: $commit_sha"

    echo "Generated tags for $branch:"
    echo "  - $branch (branch name)"
    echo "  - $branch-$short_sha (branch + short SHA)"
    echo "  - $branch-sha-$commit_sha (branch + full SHA - IMMUTABLE)"
    echo "  - $short_sha (short SHA only)"

    if [ "$is_default_branch" = "true" ]; then
        echo "  - latest (default branch only)"
    fi

    echo ""
    log_success "Deployment would use: $branch-sha-$commit_sha (immutable tag)"
}

# Demonstrate rollback capability
demonstrate_rollback() {
    log_info "Demonstrating rollback capability with SHA tags"

    echo "Previous deployments (chronological):"
    echo "  main-sha-1a2b3c4d5e6f7890abcdef1234567890abcdef  (v1.2.0)"
    echo "  main-sha-2b3c4d5e6f7890abcdef1234567890abcdef123  (v1.2.1)"
    echo "  main-sha-3c4d5e6f7890abcdef1234567890abcdef123456  (v1.3.0) ← CURRENT"

    echo ""
    echo "To rollback to v1.2.1:"
    echo "  kubectl set image deployment/api api=ghcr.io/user/service-mgr-api:main-sha-2b3c4d5e6f7890abcdef1234567890abcdef123"

    log_success "SHA-based tags enable precise, immutable rollbacks"
}

# Show security benefits
show_security_benefits() {
    log_info "Security benefits of immutable SHA tagging"

    echo "🔒 Security Advantages:"
    echo "  - No mutable 'latest' tags in production"
    echo "  - Each deployment pinned to exact commit"
    echo "  - Tamper-evident through SHA verification"
    echo "  - Audit trail with full commit history"
    echo "  - Prevention of supply chain attacks"

    echo ""
    echo "🛡️  Attack Prevention:"
    echo "  - Cannot accidentally deploy wrong version"
    echo "  - SHA mismatch detection"
    echo "  - No 'floating' tag dependencies"
    echo "  - Immutable deployment artifacts"
}

main() {
    log_info "Service Manager - Docker Image Tagging Strategy"
    echo ""

    # Simulate different scenarios
    simulate_tagging "main" "1a2b3c4d5e6f7890abcdef1234567890abcdef" "true"
    simulate_tagging "develop" "2b3c4d5e6f7890abcdef1234567890abcdef123" "false"
    simulate_tagging "feature/user-auth" "3c4d5e6f7890abcdef1234567890abcdef123456" "false"

    demonstrate_rollback
    echo ""
    show_security_benefits

    echo ""
    log_success "🎉 Immutable SHA-based tagging provides production-ready deployments!"
}

main "$@"