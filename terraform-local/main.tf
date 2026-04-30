terraform {
  required_version = ">= 1.0"
  required_providers {
    kind = {
      source  = "tehcyx/kind"
      version = "~> 0.2"
    }
    kubectl = {
      source  = "gavinbunney/kubectl"
      version = "~> 1.14"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    github = {
      source  = "integrations/github"
      version = "~> 6.0"
    }
  }
}

# Kind cluster for local development
resource "kind_cluster" "service_mgr" {
  name           = var.cluster_name
  wait_for_ready = true

  kind_config {
    kind        = "Cluster"
    api_version = "kind.x-k8s.io/v1alpha4"

    node {
      role = "control-plane"

      kubeadm_config_patches = [
        "kind: InitConfiguration\nnodeRegistration:\n  kubeletExtraArgs:\n    node-labels: \"ingress-ready=true\"\n"
      ]

      extra_port_mappings {
        container_port = 80
        host_port      = var.frontend_port
      }

      extra_port_mappings {
        container_port = 443
        host_port      = 8443
      }
    }

    node {
      role = "worker"
    }
  }
}

# Namespace for the application
resource "kubernetes_namespace" "service_mgr" {
  metadata {
    name = var.namespace
  }

  depends_on = [kind_cluster.service_mgr]
}

# PostgreSQL Secret
resource "kubernetes_secret" "postgres" {
  metadata {
    name      = "service-mgr-db-secret"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  type = "Opaque"

  data = {
    POSTGRES_USER     = "postgres"
    POSTGRES_PASSWORD = var.postgres_password
    POSTGRES_DB       = "sbms"
    DB_PASS           = var.postgres_password
    JWT_SECRET        = var.jwt_secret
    INTERNAL_SERVICE_TOKEN = "worker-secret-token-123"
  }

  depends_on = [kubernetes_namespace.service_mgr]
}

# PostgreSQL ConfigMap
resource "kubernetes_config_map" "service_mgr" {
  metadata {
    name      = "service-mgr-config"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  data = {
    APP_NAME     = "Service Business Manager"
    APP_ENV      = "development"
    DB_HOST      = "service-mgr-postgres"
    DB_PORT      = "5432"
    DB_NAME      = "sbms"
    DB_USER      = "postgres"
    PORT         = "8081"
    API_BASE_URL = "http://localhost:3000"
    API_URL      = "http://service-mgr-node-api:8081/api/v1"
    FRONTEND_URL = "http://service-mgr-frontend:80"
    NODE_ENV     = "development"
    LOG_LEVEL    = "info"
    # CORS configuration for frontend-backend communication
    CORS_ORIGINS = var.cors_origins
  }

  depends_on = [kubernetes_namespace.service_mgr]
}

# PostgreSQL Persistent Volume Claim
resource "kubernetes_persistent_volume_claim" "postgres" {
  metadata {
    name      = "service-mgr-postgres-pvc"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  spec {
    access_modes = ["ReadWriteOnce"]
    resources {
      requests = {
        storage = "10Gi"
      }
    }
  }

  depends_on = [kubernetes_namespace.service_mgr]
  # Temporarily disable waiting for PVC binding to speed up deployment
  wait_until_bound = false
}

# PostgreSQL Deployment
resource "kubernetes_deployment" "postgres" {
  metadata {
    name      = "service-mgr-postgres"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "service-mgr-postgres"
      }
    }

    template {
      metadata {
        labels = {
          app = "service-mgr-postgres"
        }
      }

      spec {
        container {
          name  = "postgres"
          image = "postgres:16"

          port {
            container_port = 5432
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.postgres.metadata[0].name
            }
          }

          volume_mount {
            name       = "pgdata"
            mount_path = "/var/lib/postgresql/data"
          }

          resources {
            requests = {
              memory = "256Mi"
              cpu    = "100m"
            }
            limits = {
              memory = "512Mi"
              cpu    = "500m"
            }
          }

          readiness_probe {
            exec {
              command = ["pg_isready", "-U", "postgres"]
            }
            initial_delay_seconds = 15
            period_seconds        = 10
          }

          liveness_probe {
            exec {
              command = ["pg_isready", "-U", "postgres"]
            }
            initial_delay_seconds = 30
            period_seconds        = 20
          }
        }

        volume {
          name = "pgdata"
          persistent_volume_claim {
            claim_name = kubernetes_persistent_volume_claim.postgres.metadata[0].name
          }
        }
      }
    }
  }

  depends_on = [kubernetes_secret.postgres, kubernetes_config_map.service_mgr]
}

# PostgreSQL Service
resource "kubernetes_service" "postgres" {
  metadata {
    name      = "service-mgr-postgres"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  spec {
    selector = {
      app = "service-mgr-postgres"
    }

    port {
      port        = 5432
      target_port = 5432
    }
  }

  depends_on = [kubernetes_deployment.postgres]
}

# NGINX Ingress Controller (if enabled)
resource "helm_release" "ingress_nginx" {
  count = var.enable_ingress ? 1 : 0

  name       = "ingress-nginx"
  repository = "https://kubernetes.github.io/ingress-nginx"
  chart      = "ingress-nginx"
  namespace  = "ingress-nginx"

  create_namespace = true

  set {
    name  = "controller.service.type"
    value = "NodePort"
  }

  set {
    name  = "controller.service.nodePorts.http"
    value = tostring(var.ingress_http_port)
  }

  set {
    name  = "controller.service.nodePorts.https"
    value = tostring(var.ingress_https_port)
  }

  depends_on = [kind_cluster.service_mgr]
}

# Backend API Deployment
resource "kubernetes_deployment" "api" {
  metadata {
    name      = "service-mgr-node-api"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "service-mgr-node-api"
      }
    }

    template {
      metadata {
        labels = {
          app = "service-mgr-node-api"
        }
      }

      spec {
        container {
          name  = "api"
          image = "sirhumble07/sbms-api:latest"

          port {
            container_port = 8081
          }

          env_from {
            config_map_ref {
              name = kubernetes_config_map.service_mgr.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.postgres.metadata[0].name
            }
          }

          resources {
            requests = {
              memory = "128Mi"
              cpu    = "50m"
            }
            limits = {
              memory = "256Mi"
              cpu    = "200m"
            }
          }

          liveness_probe {
            http_get {
              path = "/healthz"
              port = 8081
            }
            initial_delay_seconds = 30
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/healthz"
              port = 8081
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }
        }
      }
    }
  }

  depends_on = [kubernetes_service.postgres]
}

# Backend API Service
resource "kubernetes_service" "api" {
  metadata {
    name      = "service-mgr-node-api"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  spec {
    selector = {
      app = "service-mgr-node-api"
    }

    port {
      port        = 8081
      target_port = 8081
    }
  }

  depends_on = [kubernetes_deployment.api]
}

# Frontend Deployment
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "service-mgr-frontend"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "service-mgr-frontend"
      }
    }

    template {
      metadata {
        labels = {
          app = "service-mgr-frontend"
        }
      }

      spec {
        container {
          name  = "frontend"
          image = "sirhumble07/sbms-frontend:v4"

          port {
            container_port = 80
          }

          env {
            name  = "REACT_APP_API_URL"
            value = "http://localhost:${var.api_port}/api/v1"
          }

          resources {
            requests = {
              memory = "64Mi"
              cpu    = "25m"
            }
            limits = {
              memory = "128Mi"
              cpu    = "100m"
            }
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 30
            period_seconds        = 30
          }

          readiness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 5
            period_seconds        = 5
          }
        }
      }
    }
  }

  depends_on = [kubernetes_service.api]
}

# Frontend Service
resource "kubernetes_service" "frontend" {
  metadata {
    name      = "service-mgr-frontend"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  spec {
    selector = {
      app = "service-mgr-frontend"
    }

    port {
      port        = 80
      target_port = 80
    }
  }

  depends_on = [kubernetes_deployment.frontend]
}

# Worker Deployment
resource "kubernetes_deployment" "worker" {
  metadata {
    name      = "service-mgr-python-worker"
    namespace = kubernetes_namespace.service_mgr.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        app = "service-mgr-python-worker"
      }
    }

    template {
      metadata {
        labels = {
          app = "service-mgr-python-worker"
        }
      }

      spec {
        container {
          name  = "worker"
          image = "sirhumble07/sbms-worker:latest"

          env_from {
            config_map_ref {
              name = kubernetes_config_map.service_mgr.metadata[0].name
            }
          }

          env_from {
            secret_ref {
              name = kubernetes_secret.postgres.metadata[0].name
            }
          }

           resources {
             requests = {
               memory = "64Mi"
               cpu    = "25m"
             }
             limits = {
               memory = "128Mi"
               cpu    = "100m"
             }
           }
         }
       }
     }
   }

   depends_on = [kubernetes_service.postgres]
 }

# Trigger GitHub Actions workflow for local testing
resource "github_repository_dispatch" "trigger_ci_staging" {
  repository = var.github_repository
  event_type = "deploy"
  client_payload = jsonencode({
    environment = "staging"
  })

  depends_on = [kubernetes_deployment.worker]
}

resource "github_repository_dispatch" "trigger_ci_production" {
  repository = var.github_repository
  event_type = "deploy"
  client_payload = jsonencode({
    environment = "production"
  })

  depends_on = [kubernetes_deployment.worker]
}