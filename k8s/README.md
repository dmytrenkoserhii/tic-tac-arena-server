# Local Docker + Kubernetes

This folder contains the local Kubernetes setup for Tic Tac Arena.

## Prerequisites

- Docker Desktop is running.
- Docker Desktop Kubernetes is enabled.
- `kubectl config current-context` returns `docker-desktop`.
- `tic-tac-arena-server/.env` contains:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
DATABASE_URL=
WEB_ORIGIN=http://localhost:5173
PORT=3000
```

`DATABASE_URL` must be a Supabase Postgres connection string. Prefer the Supabase Session Pooler string if the direct database host does not work locally.

## One-Command Local Deploy

From `tic-tac-arena-server`:

```powershell
powershell.exe -ExecutionPolicy Bypass -File k8s\scripts\deploy-local.ps1
```

This script:

- builds backend and frontend Docker images;
- applies namespace and config;
- creates the local Kubernetes Secret from `.env`;
- runs the migration Job;
- rolls out backend and frontend;
- applies Ingress.

If images are already built:

```powershell
powershell.exe -ExecutionPolicy Bypass -File k8s\scripts\deploy-local.ps1 -SkipBuild
```

## Local URLs

```text
http://tic-tac-arena.localhost/
http://tic-tac-arena.localhost/health
http://tic-tac-arena.localhost/ready
```

## Useful Checks

```powershell
kubectl get jobs,pods,svc,ingress -n tic-tac-arena
kubectl logs job/backend-migration -n tic-tac-arena
kubectl logs deployment/backend -n tic-tac-arena
kubectl logs deployment/frontend -n tic-tac-arena
kubectl rollout status deployment/backend -n tic-tac-arena
kubectl rollout status deployment/frontend -n tic-tac-arena
```

## Manual Build Commands

Backend image:

```powershell
docker build -f docker\backend\Dockerfile -t tic-tac-arena-backend:local .
```

Frontend image:

```powershell
cd ..\tic-tac-arena-web
docker build -f ..\tic-tac-arena-server\docker\frontend\Dockerfile -t tic-tac-arena-frontend:local --build-arg VITE_API_URL=http://tic-tac-arena.localhost/api --build-arg VITE_SUPABASE_URL=<supabase-url> --build-arg VITE_SUPABASE_ANON_KEY=<supabase-anon-key> .
```

## Notes

- `k8s/secrets.yaml.example` is safe to commit.
- `k8s/secrets.yaml` is ignored and must not be committed.
- The local Ingress uses `tic-tac-arena.localhost`.
- TLS, Docker Hub, Hetzner, CI/CD, monitoring, and Sentry are intentionally outside this local phase.
