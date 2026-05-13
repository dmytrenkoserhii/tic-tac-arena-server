# Remote Kubernetes Deploy

This folder contains the Hetzner k3s manifests for Tic Tac Arena.

The remote setup is intentionally separate from the local Docker Desktop manifests because it uses pushed registry images and a public temporary `sslip.io` host.

## Current Remote Target

```text
namespace: tic-tac-arena
app host: tic-tac-arena.46.225.222.116.sslip.io
api route: http://tic-tac-arena.46.225.222.116.sslip.io/api
```

TLS and real project domains are intentionally handled in a later phase.

## Required Local Files

`tic-tac-arena-server/.env` must contain:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
DATABASE_URL=
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
http://tic-tac-arena.46.225.222.116.sslip.io/
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
