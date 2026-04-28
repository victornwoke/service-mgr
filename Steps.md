# Steps.md: Service Business Management System (SBMS) Deployment Guide

This guide walks through deploying SBMS to Kubernetes, including local development, CI/CD, GitOps, and monitoring setup.

## Prerequisites

- Kubernetes cluster (local: minikube/kind, cloud: EKS/GKE/AKS)
- kubectl configured
- Docker installed (for building images)
- Helm 3 (optional, for advanced deployments)
- Ingress controller (nginx) installed in cluster

## 1. Build Docker Images

Build and tag images for all components:

```bash
# Backend API
cd backend-node
docker build -t sbms-api:latest .

# Frontend
cd ../frontend-react
docker build -t sbms-frontend:latest .

# Worker
cd ../worker-python
docker build -t sbms-worker:latest .

# Verify
docker images | grep sbms
```

For production, push to a registry:

```bash
docker tag sbms-api:latest your-registry/sbms-api:v1.0.0
docker push your-registry/sbms-api:v1.0.0
# Repeat for all images
```

## 2. Local Development (Minikube)

Start minikube and enable ingress:

```bash
minikube start
minikube addons enable ingress
minikube addons enable metrics-server  # For monitoring
```

Load images into minikube:

```bash
minikube image load sbms-api:latest
minikube image load sbms-frontend:latest
minikube image load sbms-worker:latest
```

Apply manifests:

```bash
kubectl apply -f k8s/service-mgr.yaml
```

Wait for pods to be ready:

```bash
kubectl get pods -n service-mgr -w
```

Port-forward for local access:

```bash
kubectl port-forward svc/service-mgr-frontend 3000:80 -n service-mgr
kubectl port-forward svc/service-mgr-node-api 8081:8081 -n service-mgr
```

Access:

- Frontend: [http://localhost:3000](http://localhost:3000)
- API: [http://localhost:8081](http://localhost:8081)
- API Docs: [http://localhost:8081/api-docs](http://localhost:8081/api-docs) (future)

## 3. Production Deployment

### Kubernetes Cluster Setup

Ensure cluster has:

- Storage class for PVCs
- Ingress controller
- Metrics server (for HPA)

### Secrets & ConfigMaps

Update `k8s/service-mgr.yaml` with production values:

- Use strong passwords in secrets
- Set JWT_SECRET to a random 64-char string
- Configure external DB if not using in-cluster Postgres

### Apply Manifests

```bash
kubectl apply -f k8s/service-mgr.yaml
```

Check deployment:

```bash
kubectl get all -n service-mgr
kubectl describe deployment service-mgr-node-api -n service-mgr
```

### Ingress Configuration

Update ingress host to your domain:

```yaml
spec:
  rules:
    - host: your-domain.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: service-mgr-frontend
                port:
                  number: 80
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: service-mgr-node-api
                port:
                  number: 8081
```

Apply and get external IP:

```bash
kubectl apply -f k8s/service-mgr.yaml
kubectl get ingress -n service-mgr
```

## 4. CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Kubernetes

on:
  push:
    branches: [main]

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      
      - name: Build & Push Frontend
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/sbms-frontend:${{ github.sha }} ./frontend-react
          docker push ${{ secrets.DOCKER_USERNAME }}/sbms-frontend:${{ github.sha }}
      
      - name: Build & Push Backend
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/sbms-api:${{ github.sha }} ./backend-node
          docker push ${{ secrets.DOCKER_USERNAME }}/sbms-api:${{ github.sha }}
      
      - name: Build & Push Worker
        run: |
          docker build -t ${{ secrets.DOCKER_USERNAME }}/sbms-worker:${{ github.sha }} ./worker-python
          docker push ${{ secrets.DOCKER_USERNAME }}/sbms-worker:${{ github.sha }}
      
      - name: Deploy to K8s
        uses: azure/k8s-set-context@v1
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      
      - name: Update Images
        run: |
          kubectl set image deployment/service-mgr-frontend frontend=${{ secrets.DOCKER_USERNAME }}/sbms-frontend:${{ github.sha }} -n service-mgr
          kubectl set image deployment/service-mgr-api api=${{ secrets.DOCKER_USERNAME }}/sbms-api:${{ github.sha }} -n service-mgr
          kubectl set image deployment/service-mgr-worker worker=${{ secrets.DOCKER_USERNAME }}/sbms-worker:${{ github.sha }} -n service-mgr
```

Required secrets:

- `DOCKER_USERNAME`
- `DOCKER_PASSWORD`
- `KUBE_CONFIG` (base64 encoded)

## 5. GitOps (ArgoCD)

### Install ArgoCD

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

### Create Application

Create `gitops/application.yaml`:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: service-mgr
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/service-mgr
    targetRevision: HEAD
    path: k8s
  destination:
    server: https://kubernetes.default.svc
    namespace: service-mgr
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

Apply:

```bash
kubectl apply -f gitops/application.yaml
```

Access ArgoCD UI:

```bash
kubectl port-forward svc/argocd-server 8080:443 -n argocd
# Username: admin
# Password: kubectl get pods -n argocd -l app.kubernetes.io/name=argocd-server -o name | cut -d'/' -f 2
```

## 6. Monitoring (Prometheus + Grafana)

### Install Prometheus Stack

Using Helm:

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

### ServiceMonitor for SBMS

Create `k8s/monitoring/servicemonitor.yaml`:

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: service-mgr-api
  namespace: service-mgr
spec:
  selector:
    matchLabels:
      app: service-mgr-node-api
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

Apply and check targets:

```bash
kubectl apply -f k8s/monitoring/servicemonitor.yaml
kubectl port-forward svc/prometheus-operated 9090 -n monitoring
# Visit http://localhost:9090/targets
```

### Grafana Dashboard

Access Grafana:

```bash
kubectl port-forward svc/prometheus-grafana 3000:80 -n monitoring
# Username: admin
# Password: prom-operator
```

Import dashboard from `monitoring/grafana-dashboard.json`.

### Custom Metrics

SBMS exposes:

- `http_requests_total{path, method, status}`
- `http_request_duration_seconds{p50, p95, p99}`
- `db_connections`
- `background_tasks_pending`

## 7. Scaling & High Availability

### Horizontal Pod Autoscaling

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: service-mgr-api-hpa
  namespace: service-mgr
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: service-mgr-node-api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Database High Availability

For production, consider:

- PostgreSQL operator (CrunchyData/Zalando)
- Read replicas
- Connection pooling (pgbouncer)

## 8. Backup & Disaster Recovery

### Database Backup

Use cronjob for backups:

```yaml
apiVersion: batch/v1beta1
kind: CronJob
metadata:
  name: postgres-backup
  namespace: service-mgr
spec:
  schedule: "0 2 * * *"  # Daily at 2 AM
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: backup
            image: postgres:16
            command: ["/bin/bash", "-c"]
            args:
            - pg_dump -h service-mgr-postgres -U postgres service_mgmt > /backup/backup.sql
            volumeMounts:
            - name: backup-volume
              mountPath: /backup
          volumes:
          - name: backup-volume
            persistentVolumeClaim:
              claimName: backup-pvc
          restartPolicy: OnFailure
```

### Restore

```bash
kubectl exec -it deployment/service-mgr-postgres -n service-mgr -- bash
psql -U postgres -d service_mgmt < /backup/backup.sql
```

## 9. Security Checklist

- [ ] Rotate all secrets
- [ ] Enable TLS on ingress (cert-manager)
- [ ] Network policies to restrict pod communication
- [ ] RBAC for service accounts
- [ ] Image scanning (Trivy)
- [ ] Dependency updates (Dependabot)
- [ ] Audit logs enabled
- [ ] Rate limiting configured

## 10. Troubleshooting

### Common Issues

**Pods in CrashLoopBackOff:**

```bash
kubectl logs deployment/service-mgr-node-api -n service-mgr --previous
kubectl describe pod -n service-mgr
```

**Database Connection Issues:**

```bash
kubectl exec -it deployment/service-mgr-postgres -n service-mgr -- psql -U postgres -d sbms
```

**Ingress Not Working:**

```bash
kubectl get ingress -n service-mgr
kubectl describe ingress service-mgr-ingress -n service-mgr
```

### Logs

```bash
# All pods
kubectl logs -l app=service-mgr-node-api -n service-mgr --tail=100

# Specific pod
kubectl logs pod/service-mgr-node-api-abc123 -n service-mgr -f
```

### Performance

```bash
# Resource usage
kubectl top pods -n service-mgr

# Events
kubectl get events -n service-mgr --sort-by=.metadata.creationTimestamp
```

This guide ensures SBMS is deployed securely, monitored, and maintainable in production environments.
