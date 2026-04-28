# Instructions for Service Business Management System (SBMS)

## Big Picture Architecture

- **Monorepo** with three main services:
  - `frontend-react/`: React SPA (Vite, Tailwind, Nginx)
  - `backend-node/`: Node.js REST API (Express, Sequelize, PostgreSQL)
  - `worker-python/`: Python async worker (polls API for background tasks)
- **Kubernetes-first**: All components are containerized and deployed via manifests in `k8s/`.
- **Data flow:**
  - Frontend calls backend API (`/api/*` endpoints)
  - Backend persists data in PostgreSQL and exposes REST endpoints
  - Worker polls backend for async/background jobs
- **Secrets/config:** Managed via Kubernetes ConfigMaps and Secrets (see `k8s/service-mgr.yaml`).

## Developer Workflows

- **Build images:**
  - `docker build -t sirhumble07/service-mgr-frontend:latest frontend-react/`
  - `docker build -t sirhumble07/service-mgr-node-api:latest backend-node/`
  - `docker build -t sirhumble07/service-mgr-python-worker:latest worker-python/`
- **Push images:**
  - `docker push sirhumble07/service-mgr-frontend:latest` (repeat for other images)
- **Deploy to K8s:**
  - `kubectl apply -f k8s/`
  - Restart deployments after image update: `kubectl rollout restart deployment/<name> -n service-mgr`
- **Local dev:**
  - Use Docker Compose (not included, but see README for typical ports)
  - Frontend: <http://localhost:8080>, API: <http://localhost:3000>, DB: <http://localhost:5432>
- **Testing:**
  - Node API: add Jest tests as needed
  - Integration: use Docker Compose or K8s + `kubectl port-forward` for smoke tests

## Project Conventions & Patterns

- **Frontend:**
  - Main entry: `src/App.jsx` (routing, layout, auth state)
  - Pages in `src/pages/`, use `api.js` for all API calls (JWT via localStorage)
  - No Redux/global state; use React hooks
  - Tailwind for styling; see `Dashboard.jsx`, `Customers.jsx` for patterns
- **Backend:**
  - Express routes in `src/routes/`, controllers in `src/controllers/`, models in `src/models/`
  - Use Sequelize for DB access
  - Health endpoints: `/health`, `/ready`
- **Worker:**
  - `worker.py` polls API for tasks, handles graceful shutdown (SIGTERM/SIGINT)
- **K8s:**
  - All-in-one manifest: `k8s/service-mgr.yaml` (namespace, secrets, config, deployments, ingress)
  - DB credentials in `service-mgr-db-secret`, config in `service-mgr-config`

## Integration Points

- **API:** All services communicate via REST endpoints
- **Auth:** JWT-based, token stored in frontend localStorage, injected by axios interceptor
- **DB:** PostgreSQL, schema in `k8s/schema/schema.sql`

## Examples

- Add a frontend page: create in `src/pages/`, add route in `App.jsx`, use `api.js` for data
- Add a backend route: add to `src/routes/`, implement in controller, update model if needed
- Add a worker task: extend polling logic in `worker.py`

---

**Update this file if you change service boundaries, API patterns, or deployment structure.**
