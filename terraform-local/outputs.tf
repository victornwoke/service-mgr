output "cluster_name" {
  description = "Kind cluster name"
  value       = kind_cluster.service_mgr.name
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint"
  value       = kind_cluster.service_mgr.endpoint
}

output "frontend_url" {
  description = "Frontend application URL"
  value       = "http://localhost:${var.frontend_port}"
}

output "api_url" {
  description = "API application URL"
  value       = "http://localhost:${var.api_port}"
}

output "namespace" {
  description = "Kubernetes namespace"
  value       = kubernetes_namespace.service_mgr.metadata[0].name
}

output "postgres_connection" {
  description = "PostgreSQL connection details"
  value       = "postgresql://postgres:${var.postgres_password}@localhost:5432/sbms"
  sensitive   = true
}

output "kubectl_config" {
  description = "kubectl configuration command"
  value       = "export KUBECONFIG=$(kind get kubeconfig-path --name ${kind_cluster.service_mgr.name})"
}

output "ingress_enabled" {
  description = "Whether NGINX ingress is enabled"
  value       = var.enable_ingress
}

output "access_instructions" {
  description = "Instructions for accessing the application"
  value = <<EOT
# To access the application:

1. Frontend: http://localhost:${var.frontend_port}
2. API: http://localhost:${var.api_port}

# If using ingress (when enabled):
# Frontend: http://localhost:${var.ingress_http_port}
# API: Configure ingress rules as needed

# To check application status:
kubectl get pods -n ${kubernetes_namespace.service_mgr.metadata[0].name}

# To view logs:
kubectl logs -f deployment/service-mgr-frontend -n ${kubernetes_namespace.service_mgr.metadata[0].name}
kubectl logs -f deployment/service-mgr-node-api -n ${kubernetes_namespace.service_mgr.metadata[0].name}
EOT
}