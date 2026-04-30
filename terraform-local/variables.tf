variable "cluster_name" {
  description = "Name of the Kind cluster"
  type        = string
  default     = "service-mgr-local"
}

variable "kubernetes_version" {
  description = "Kubernetes version for the Kind cluster"
  type        = string
  default     = "v1.28.0"
}

variable "namespace" {
  description = "Kubernetes namespace for the application"
  type        = string
  default     = "service-mgr"
}

variable "postgres_password" {
  description = "PostgreSQL database password (default 'postgres' for local development)"
  type        = string
  default     = "postgres"
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for authentication"
  type        = string
  default     = "supersecretlocaljwtkey"
  sensitive   = true
}

variable "enable_ingress" {
  description = "Enable NGINX ingress controller"
  type        = bool
  default     = true
}

variable "enable_monitoring" {
  description = "Enable basic monitoring stack"
  type        = bool
  default     = false
}

variable "frontend_port" {
  description = "Port to map frontend service to on host"
  type        = number
  default     = 30080
}

variable "api_port" {
  description = "Port to map API service to on host"
  type        = number
  default     = 30081
}

variable "ingress_http_port" {
  description = "HTTP port for NGINX ingress controller"
  type        = number
  default     = 30080
}

variable "ingress_https_port" {
  description = "HTTPS port for NGINX ingress controller"
  type        = number
  default     = 30443
}

variable "cors_origins" {
  description = "Allowed CORS origins for API requests"
  type        = string
  default     = "http://localhost:30080,http://127.0.0.1:30080,http://localhost:8080,http://127.0.0.1:8080,http://localhost:3000"
}

variable "github_owner" {
  description = "GitHub repository owner"
  type        = string
  default     = "victornwoke"
}

variable "github_token" {
  description = "GitHub personal access token"
  type        = string
  sensitive   = true
}

variable "github_repository" {
  description = "GitHub repository name"
  type        = string
  default     = "service-mgr"
}