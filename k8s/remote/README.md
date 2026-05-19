# Remote Kubernetes Deploy

This folder contains the Hetzner k3s manifests for Tic Tac Arena.

The remote setup is intentionally separate from the local Docker Desktop manifests because it uses pushed registry images and the public production host.

## Current Remote Target

```text
namespace: tic-tac-arena
app host: tic-tac-arena.dmytrenko.dev
api route: https://tic-tac-arena.dmytrenko.dev/api
```

TLS is issued by the existing cluster `cert-manager` setup with the `letsencrypt-prod` ClusterIssuer.

DNS must contain:

```text
tic-tac-arena.dmytrenko.dev A 46.225.222.116
```

Supabase Auth must allow:

```text
https://tic-tac-arena.dmytrenko.dev
https://tic-tac-arena.dmytrenko.dev/**
```

The GitHub Actions variable `VITE_API_URL` must be:

```text
https://tic-tac-arena.dmytrenko.dev/api
```

Sentry GitHub Actions secrets:

```text
SENTRY_AUTH_TOKEN=
VITE_SENTRY_DSN=
```

Sentry GitHub Actions variables:

```text
SENTRY_BACKEND_PROJECT=tic-tac-arena-server
SENTRY_ENVIRONMENT=production
SENTRY_FRONTEND_PROJECT=tic-tac-arena-web
SENTRY_ORG=
```

## Required Local Files

`tic-tac-arena-server/.env` must contain:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
DATABASE_URL=
SENTRY_DSN=
SENTRY_TEST_TOKEN=
```

Local kubeconfig must exist at:

```text
C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml
```

## Build And Push Images

Log in to Docker Hub first:

```powershell
docker login
```

Then build and push both images:

```powershell
powershell.exe -ExecutionPolicy Bypass -File k8s\remote\scripts\build-push-images.ps1 -ImageRepository <dockerhub-user-or-org> -Tag manual-001
```

This creates:

```text
<dockerhub-user-or-org>/tic-tac-arena-backend:manual-001
<dockerhub-user-or-org>/tic-tac-arena-frontend:manual-001
```

## Deploy To Remote k3s

```powershell
powershell.exe -ExecutionPolicy Bypass -File k8s\remote\scripts\deploy-remote.ps1 -ImageRepository <dockerhub-user-or-org> -Tag manual-001
```

The deploy script:

- applies the namespace;
- applies config;
- creates/updates Kubernetes Secret from local `.env`;
- runs the migration Job before rollout;
- deploys backend and frontend;
- waits for rollout;
- applies Ingress.

## Verification

```powershell
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml get pods,svc,ingress,jobs -n tic-tac-arena
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml logs job/backend-migration -n tic-tac-arena
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout status deployment/backend -n tic-tac-arena
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout status deployment/frontend -n tic-tac-arena
```

Browser:

```text
https://tic-tac-arena.dmytrenko.dev/
```

## Rollback

Rollback backend:

```powershell
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout undo deployment/backend -n tic-tac-arena
```

Rollback frontend:

```powershell
kubectl --kubeconfig C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml rollout undo deployment/frontend -n tic-tac-arena
```
