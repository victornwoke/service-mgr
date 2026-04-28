# Service Business Management System (SBMS)

A production-ready, full‑stack SaaS platform for service‑based businesses (tradespeople, repair technicians, cleaners, etc.) built with modern cloud‑native architecture.

## 🌟 Overview

SBMS replaces paper workflows and spreadsheets with a digital system for:

- **Customer 360° view** – complete history, notes, tags

- **Job lifecycle management** – quote → booked → in progress → completed → invoiced
- **Staff scheduling & assignment** – drag‑and‑drop calendar
- **Automated background tasks** – reminders, follow‑ups, daily summaries
- **Invoicing & payments** – track revenue, payment status
- **Audit trail** – who changed what, when
- **Role‑based access control** – Owner, Admin, Manager, Staff

## 🏗 Architecture

```txt
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend UI   │────▶│   Node.js API    │────▶│   PostgreSQL    │
│  (React/MUI)    │◀────│   (Express)      │◀────│   Database      │
└─────────────────┘     └──────────────────┘     └─────────────────┘
         ▲                       ▲                       ▲
         │                       │                       │
         │              ┌──────────────────┐              │
         └─────────────▶│   Task Worker    │◀─────────────┘
                        │   (Python)       │
                        └──────────────────┘
```

### Tech Stack

- **Frontend**: React 18, Vite, Material‑UI (MUI), React Router v6
- **Backend**: Node.js 20, Express, Sequelize ORM, PostgreSQL
- **Worker**: Python 3.11 (requests, schedule)
- **Auth**: JWT with refresh tokens, bcrypt password hashing
- **Observability**: Structured logging (pino), Prometheus metrics, request tracing
- **Infrastructure**: Docker, Kubernetes, Helm-ready

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone
 git clone <repo-url>
 cd service-mgr

# 2. Backend
 cd backend-node
 npm install
 npm run migrate          # Run DB migrations
 npm start                # Starts on http://localhost:8081

# 3. Frontend
 cd ../frontend-react
 npm install
 npm run dev              # Starts on http://localhost:3000

# 4. Worker (optional)
 cd ../worker-python
 pip install -r requirements.txt
 python worker.py
```

### First Time Setup

1. Open [http://localhost:3000/register](http://localhost:3000/register)
2. Create an **Admin** account
3. Log in and start adding customers, jobs, staff

## 📦 Features

### Customer Management

- Full CRUD with search & pagination
- Tags: VIP, Late Payer, New
- Service history timeline
- Export to CSV

### Job Management

- Create jobs with date, time, location, service type
- Assign staff members
- Status workflow: Pending → Quote → Booked → In Progress → Completed → Invoiced
- Add notes & attachments
- Automatic reminders (configurable hours before start)
- Follow‑up tasks after completion

### Staff Management

- Role‑based permissions (Owner, Admin, Manager, Staff)
- Password hashing with bcrypt
- Workload overview

### Invoicing

- Create invoices from completed jobs
- Track payment status (Paid/Unpaid)
- Payment records

### Calendar / Schedule

- Week view with drag‑and‑drop (future)
- Filter by staff, service, status
- Today’s jobs panel
- Overdue jobs alert

### Background Tasks

- Job reminders (email/SMS ready)
- Follow‑up emails
- Daily summary reports
- Retry logic with exponential backoff

### Reporting & Analytics

- Jobs per week
- Revenue by service
- Job status distribution
- Exportable charts (future)

### Security

- Helmet CSP headers
- CORS locked to frontend origin
- Rate limiting (global + auth endpoints)
- Input sanitization (sanitize‑html)
- JWT authentication with short expiry
- Audit logging on all mutations

### Observability

- Structured JSON logs (pino)
- Request correlation IDs
- Prometheus `/metrics` endpoint
- Health (`/healthz`) & readiness (`/readyz`) probes

## 🐳 Docker Images

All services are containerized:

```bash
# Build
 docker build -t sbms-frontend:latest ./frontend-react
 docker build -t sbms-api:latest ./backend-node
 docker build -t sbms-worker:latest ./worker-python

# Run
 docker run -d -p 3000:3000 sbms-frontend
 docker run -d -p 8081:8081 sbms-api
 docker run -d sbms-worker
```

## ☸️ Kubernetes Deployment

See `k8s/` directory for manifests.

```bash
# Deploy all
 kubectl apply -f k8s/

# Check pods
 kubectl get pods -n service-mgr

# View logs
 kubectl logs -f deployment/service-mgr-api -n service-mgr

# Update image
 kubectl set image deployment/service-mgr-api api=sbms-api:v2 -n service-mgr
```

### Helm Chart (future)

A Helm chart is planned for easy multi‑environment deployments.

## 🔐 Configuration

### Environment Variables

**Backend (`.env`)**

```env
PORT=8081
NODE_ENV=development
JWT_SECRET=your-secret-key
INTERNAL_SERVICE_TOKEN=worker-secret-token

DB_HOST=localhost
DB_PORT=5432
DB_NAME=sbms
DB_USER=postgres
DB_PASS=postgres

FRONTEND_URL=http://localhost:3000
```

**Worker***

```env
API_URL=http://backend-node:8081/api/v1
INTERNAL_SERVICE_TOKEN=worker-secret-token
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user
SMTP_PASS=pass
NOTIFY_EMAIL=alerts@example.com
```

## 📊 Monitoring

### Prometheus Metrics

Exposed at `/metrics`:

- `http_requests_total` (by path, method, status)
- `http_request_duration_seconds` (p50, p95, p99)
- `db_connections`
- `background_tasks_pending`

### Grafana Dashboard

Import the dashboard JSON from `monitoring/grafana-dashboard.json`.

## 🔄 CI/CD

### GitHub Actions

Example workflow (`.github/workflows/deploy.yml`):

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
      
      - name: Build & Push Frontend
        run: |
          docker build -t ghcr.io/your-org/sbms-frontend:${{ github.sha }} ./frontend-react
          docker push ghcr.io/your-org/sbms-frontend:${{ github.sha }}
      
      - name: Build & Push Backend
        run: |
          docker build -t ghcr.io/your-org/sbms-api:${{ github.sha }} ./backend-node
          docker push ghcr.io/your-org/sbms-api:${{ github.sha }}
      
      - name: Deploy to K8s
        run: |
          kubectl set image deployment/service-mgr-frontend frontend=ghcr.io/your-org/sbms-frontend:${{ github.sha }} -n service-mgr
          kubectl set image deployment/service-mgr-api api=ghcr.io/your-org/sbms-api:${{ github.sha }} -n service-mgr
```

### GitOps (ArgoCD)

An `Application` manifest is provided in `gitops/` for ArgoCD.

## 🧪 Testing

```bash
# Backend tests
 cd backend-node
 npm test

# Frontend tests (future)
 cd frontend-react
 npm run test
```

## 📚 API Documentation

Interactive Swagger UI available at `/api-docs` (future).

Current endpoints:

### Auth

- `POST /api/v1/auth/login` – Login
- `POST /api/v1/auth/register` – Register (Admin only)

### Customers

- `GET /api/v1/customers` – List (paginated, searchable)
- `POST /api/v1/customers` – Create
- `GET /api/v1/customers/:id` – Detail (360 view)
- `PUT /api/v1/customers/:id` – Update
- `DELETE /api/v1/customers/:id` – Delete

### Jobs

- `GET /api/v1/jobs` – List (filterable)
- `POST /api/v1/jobs` – Create
- `GET /api/v1/jobs/:id` – Detail
- `PATCH /api/v1/jobs/:id` – Update
- `DELETE /api/v1/jobs/:id` – Delete

### Staff

- `GET /api/v1/staff` – List
- `POST /api/v1/staff` – Create (Admin)
- `PUT /api/v1/staff/:id` – Update (Admin)
- `DELETE /api/v1/staff/:id` – Delete (Admin)

### Invoices

- `GET /api/v1/invoices` – List
- `POST /api/v1/invoices` – Create
- `PATCH /api/v1/invoices/:id` – Update status

### Services

- `GET /api/v1/services` – List
- `POST /api/v1/services` – Create (Admin)
- `PUT /api/v1/services/:id` – Update (Admin)

### Dashboard

- `GET /api/v1/dashboard` – Overview stats
- `GET /api/v1/dashboard/today` – Today’s schedule
- `GET /api/v1/dashboard/overdue` – Overdue jobs
- `GET /api/v1/dashboard/customers/:id` – Customer 360

### Reporting

- `GET /api/v1/reporting/jobs-per-week` – Weekly job counts
- `GET /api/v1/reporting/revenue-by-service` – Revenue breakdown
- `GET /api/v1/reporting/jobs-by-status` – Status distribution

### Tasks (Worker)

- `GET /api/v1/tasks` – List pending tasks (Admin)
- `PATCH /api/v1/tasks/:id` – Update status

### Audit

- `GET /api/v1/audit` – Audit log (Admin)

## 🛡️ Security Best Practices

1. **Secrets Management**: Use Kubernetes Secrets or external vault (e.g., HashiCorp Vault)
2. **Network Policies**: Restrict pod-to-pod communication
3. **TLS**: Terminate at ingress (cert‑manager)
4. **RBAC**: Least privilege for service accounts
5. **Backups**: Automated PostgreSQL backups with tested restore
6. **Updates**: Regular dependency updates (Dependabot)
7. **Scanning**: Container image scanning (Trivy)

## 📈 Roadmap

- [ ] Mobile app (React Native)
- [ ] Customer portal (self‑service booking)
- [ ] SMS/email integrations (Twilio, SendGrid)
- [ ] Inventory management
- [ ] QuickBooks/Xero integration
- [ ] Multi‑tenant support
- [ ] Advanced analytics dashboard

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

MIT © 2026 Service Manager Team
