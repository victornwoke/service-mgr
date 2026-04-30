provider "kind" {}

provider "kubectl" {
  host                   = kind_cluster.service_mgr.endpoint
  cluster_ca_certificate = kind_cluster.service_mgr.cluster_ca_certificate
  client_certificate     = kind_cluster.service_mgr.client_certificate
  client_key             = kind_cluster.service_mgr.client_key
}

provider "helm" {
  kubernetes {
    host                   = kind_cluster.service_mgr.endpoint
    cluster_ca_certificate = kind_cluster.service_mgr.cluster_ca_certificate
    client_certificate     = kind_cluster.service_mgr.client_certificate
    client_key             = kind_cluster.service_mgr.client_key
  }
}

provider "kubernetes" {
  host                   = kind_cluster.service_mgr.endpoint
  cluster_ca_certificate = kind_cluster.service_mgr.cluster_ca_certificate
  client_certificate     = kind_cluster.service_mgr.client_certificate
  client_key             = kind_cluster.service_mgr.client_key
}

provider "github" {
  owner = var.github_owner
  token = var.github_token
}