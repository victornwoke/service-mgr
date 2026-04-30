#!/bin/bash

# GitHub Secrets Setup and Testing Script
# Helps configure and test GitHub secrets for CI/CD pipeline

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

# Check if required tools are available
check_prerequisites() {
    log_info "Checking prerequisites..."

    local missing_tools=()

    if ! command -v curl >/dev/null 2>&1; then
        missing_tools+=("curl")
    fi

    if ! command -v jq >/dev/null 2>&1; then
        missing_tools+=("jq")
    fi

    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}"
        log_info "Install missing tools:"
        log_info "  Ubuntu/Debian: sudo apt-get install curl jq"
        log_info "  macOS: brew install curl jq"
        log_info "  Or visit: https://stedolan.github.io/jq/download/"
        exit 1
    fi

    log_success "All prerequisites met"
}

# Generate secure random passwords
generate_passwords() {
    log_info "Generating secure passwords..."

    # Generate random passwords (16 characters)
    DB_POSTGRES_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-16)
    DB_PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-16)

    # Fixed values for demonstration
    DB_USERNAME="servicemgr"
    DB_NAME="servicemgr"

    log_success "Generated secure credentials:"
    echo "  DB_POSTGRES_PASSWORD: $DB_POSTGRES_PASSWORD"
    echo "  DB_USERNAME: $DB_USERNAME"
    echo "  DB_PASSWORD: $DB_PASSWORD"
    echo "  DB_NAME: $DB_NAME"
}

# Test GitHub token permissions
test_github_token() {
    local token="$1"
    local username="$2"
    local repo="$3"

    log_info "Testing GitHub token permissions..."

    # Test basic authentication
    local auth_response
    auth_response=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/user")

    if [ "$auth_response" != "200" ]; then
        log_error "GitHub token authentication failed (HTTP $auth_response)"
        log_info "Check your personal access token is valid"
        return 1
    fi

    log_success "GitHub token authentication successful"

    # Test repository access
    local repo_response
    repo_response=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$username/$repo")

    if [ "$repo_response" != "200" ]; then
        log_error "Repository access failed (HTTP $repo_response)"
        log_info "Check repository exists and token has access"
        return 1
    fi

    log_success "Repository access confirmed"

    # Test GitOps repository if it exists
    local gitops_repo="${repo}-gitops"
    local gitops_response
    gitops_response=$(curl -s -w "%{http_code}" -o /dev/null \
        -H "Authorization: token $token" \
        -H "Accept: application/vnd.github.v3+json" \
        "https://api.github.com/repos/$username/$gitops_repo")

    if [ "$gitops_response" = "200" ]; then
        log_success "GitOps repository access confirmed"
    else
        log_warning "GitOps repository ($gitops_repo) not found or not accessible"
        log_info "You may need to create the GitOps repository first"
    fi

    return 0
}

# Display setup instructions
display_setup_instructions() {
    local username="$1"
    local repo="$2"

    echo ""
    log_info "📋 GitHub Secrets Setup Instructions"
    echo "=========================================="
    echo ""
    echo "1. Go to: https://github.com/$username/$repo/settings/secrets/actions"
    echo ""
    echo "2. Click 'New repository secret' for each secret:"
    echo ""

    # GITOPS_TOKEN
    echo "🔑 GITOPS_TOKEN"
    echo "   Purpose: Access to GitOps repository"
    echo "   How to create:"
    echo "   - Go to: https://github.com/settings/tokens"
    echo "   - Generate new token (classic)"
    echo "   - Name: service-mgr-gitops"
    echo "   - Scopes: ✅ repo, ✅ workflow"
    echo "   - Expiration: No expiration (or long period)"
    echo ""

    # Database secrets
    echo "🗄️  Database Secrets (for production deployment)"
    echo ""
    echo "   DB_POSTGRES_PASSWORD: $DB_POSTGRES_PASSWORD"
    echo "   DB_USERNAME: $DB_USERNAME"
    echo "   DB_PASSWORD: $DB_PASSWORD"
    echo "   DB_NAME: $DB_NAME"
    echo ""

    echo "3. Test the configuration:"
    echo "   git commit --allow-empty -m \"Test CI/CD pipeline\""
    echo "   git push origin main"
    echo ""

    echo "4. Monitor the Actions tab for successful pipeline execution"
    echo ""
}

# Interactive setup
interactive_setup() {
    echo ""
    log_info "🔐 GitHub Secrets Interactive Setup"
    echo "====================================="

    # Get repository information
    read -p "Enter your GitHub username: " github_username
    read -p "Enter your repository name (default: service-mgr): " github_repo
    github_repo=${github_repo:-service-mgr}

    # Generate passwords
    generate_passwords

    # Test existing token if provided
    read -p "Do you have a GitOps token to test? (y/N): " test_token
    if [[ $test_token =~ ^[Yy]$ ]]; then
        read -p "Enter your GitOps token (hidden): " -s gitops_token
        echo ""
        if test_github_token "$gitops_token" "$github_username" "$github_repo"; then
            log_success "GitOps token is working correctly!"
        else
            log_error "GitOps token test failed"
            return 1
        fi
    fi

    # Display instructions
    display_setup_instructions "$github_username" "$github_repo"

    # Save configuration
    cat > .github-secrets-config << EOF
# GitHub Secrets Configuration (generated $(date))
GITHUB_USERNAME=$github_username
GITHUB_REPO=$github_repo
DB_POSTGRES_PASSWORD=$DB_POSTGRES_PASSWORD
DB_USERNAME=$DB_USERNAME
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Next steps:
# 1. Add these secrets to: https://github.com/$github_username/$github_repo/settings/secrets/actions
# 2. Test with: git push origin main
EOF

    log_success "Configuration saved to .github-secrets-config"
    log_info "Add the secrets to your GitHub repository and test the pipeline!"
}

# Main function
main() {
    echo "🔐 GitHub Secrets Setup and Testing Tool"
    echo "========================================="
    echo ""

    check_prerequisites

    echo "Choose an option:"
    echo "1. Interactive setup (recommended)"
    echo "2. Generate passwords only"
    echo "3. Display setup instructions"
    echo ""

    read -p "Enter your choice (1-3): " choice

    case $choice in
        1)
            interactive_setup
            ;;
        2)
            generate_passwords
            display_setup_instructions "YOUR_USERNAME" "service-mgr"
            ;;
        3)
            display_setup_instructions "YOUR_USERNAME" "service-mgr"
            ;;
        *)
            log_error "Invalid choice. Please run again."
            exit 1
            ;;
    esac
}

# Run main function if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi