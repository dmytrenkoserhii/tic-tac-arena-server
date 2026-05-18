#!/usr/bin/env bash
set -euo pipefail

IMAGE_REPOSITORY="${IMAGE_REPOSITORY:?IMAGE_REPOSITORY is required}"
RELEASE_TAG="${RELEASE_TAG:?RELEASE_TAG is required}"

NAMESPACE="tic-tac-arena"
APP_URL="https://tic-tac-arena.dmytrenko.dev"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REMOTE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RENDER_ROOT="$(mktemp -d)"

BACKEND_IMAGE="${IMAGE_REPOSITORY}/tic-tac-arena-backend:${RELEASE_TAG}"
FRONTEND_IMAGE="${IMAGE_REPOSITORY}/tic-tac-arena-frontend:${RELEASE_TAG}"

cleanup() {
  rm -rf "$RENDER_ROOT"
}
trap cleanup EXIT

render_template() {
  local source="$1"
  local target="$2"

  sed \
    -e "s|__BACKEND_IMAGE__|${BACKEND_IMAGE}|g" \
    -e "s|__FRONTEND_IMAGE__|${FRONTEND_IMAGE}|g" \
    "$source" > "$target"
}

echo "Deploying Tic Tac Arena release: ${RELEASE_TAG}"
echo "Backend image: ${BACKEND_IMAGE}"
echo "Frontend image: ${FRONTEND_IMAGE}"

kubectl apply -f "$REMOTE_ROOT/namespace.yaml"
kubectl apply -f "$REMOTE_ROOT/configmap.yaml"

kubectl get secret tic-tac-arena-secrets -n "$NAMESPACE" >/dev/null

render_template "$REMOTE_ROOT/backend-migration-job.yaml.template" "$RENDER_ROOT/backend-migration-job.yaml"
render_template "$REMOTE_ROOT/backend-deployment.yaml.template" "$RENDER_ROOT/backend-deployment.yaml"
render_template "$REMOTE_ROOT/frontend-deployment.yaml.template" "$RENDER_ROOT/frontend-deployment.yaml"

kubectl delete job backend-migration -n "$NAMESPACE" --ignore-not-found=true
kubectl apply -f "$RENDER_ROOT/backend-migration-job.yaml"
kubectl wait --for=condition=complete --timeout=180s job/backend-migration -n "$NAMESPACE"

kubectl apply -f "$RENDER_ROOT/backend-deployment.yaml"
kubectl apply -f "$RENDER_ROOT/frontend-deployment.yaml"
kubectl apply -f "$REMOTE_ROOT/ingress.yaml"

kubectl rollout status deployment/backend -n "$NAMESPACE" --timeout=240s
kubectl rollout status deployment/frontend -n "$NAMESPACE" --timeout=240s
kubectl wait --for=condition=Ready --timeout=180s certificate/tic-tac-arena-tls -n "$NAMESPACE"

curl -fsS "${APP_URL}/health" >/dev/null
curl -fsS "${APP_URL}/ready" >/dev/null
curl -fsS "${APP_URL}/" >/dev/null

echo "Deploy completed successfully: ${APP_URL}"
