param(
  [Parameter(Mandatory = $true)]
  [string]$ImageRepository,

  [Parameter(Mandatory = $true)]
  [string]$Tag,

  [string]$Kubeconfig = "C:\Users\dmtrn\.kube\tic-tac-arena\hetzner-k3s.yaml"
)

$ErrorActionPreference = "Stop"

$namespace = "tic-tac-arena"
$serverRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$remoteRoot = Join-Path $serverRoot "k8s\remote"
$renderRoot = Join-Path $serverRoot ".temp\k8s-remote-rendered"
$envFile = Join-Path $serverRoot ".env"

if (-not (Test-Path $Kubeconfig)) {
  throw "Missing kubeconfig file: $Kubeconfig"
}

if (-not (Test-Path $envFile)) {
  throw "Missing server .env file: $envFile"
}

$envValues = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match "^([^#][^=]+)=(.*)$") {
    $envValues[$Matches[1].Trim()] = $Matches[2].Trim()
  }
}

foreach ($key in @("SUPABASE_URL", "SUPABASE_ANON_KEY", "DATABASE_URL")) {
  if (-not $envValues[$key]) {
    throw "Missing required .env value: $key"
  }
}

New-Item -ItemType Directory -Force -Path $renderRoot | Out-Null

$backendImage = "$ImageRepository/tic-tac-arena-backend:$Tag"
$frontendImage = "$ImageRepository/tic-tac-arena-frontend:$Tag"

$templates = @(
  "backend-migration-job.yaml.template",
  "backend-deployment.yaml.template",
  "frontend-deployment.yaml.template"
)

foreach ($template in $templates) {
  $source = Join-Path $remoteRoot $template
  $target = Join-Path $renderRoot ($template -replace "\.template$", "")
  (Get-Content $source -Raw).
    Replace("__BACKEND_IMAGE__", $backendImage).
    Replace("__FRONTEND_IMAGE__", $frontendImage) |
    Set-Content $target -NoNewline
}

kubectl --kubeconfig $Kubeconfig apply -f (Join-Path $remoteRoot "namespace.yaml")
kubectl --kubeconfig $Kubeconfig apply -f (Join-Path $remoteRoot "configmap.yaml")

kubectl --kubeconfig $Kubeconfig create secret generic tic-tac-arena-secrets `
  -n $namespace `
  --from-literal="SUPABASE_URL=$($envValues['SUPABASE_URL'])" `
  --from-literal="SUPABASE_ANON_KEY=$($envValues['SUPABASE_ANON_KEY'])" `
  --from-literal="DATABASE_URL=$($envValues['DATABASE_URL'])" `
  --dry-run=client `
  -o yaml |
  kubectl --kubeconfig $Kubeconfig apply -f -

kubectl --kubeconfig $Kubeconfig delete job backend-migration -n $namespace --ignore-not-found=true
kubectl --kubeconfig $Kubeconfig apply -f (Join-Path $renderRoot "backend-migration-job.yaml")
kubectl --kubeconfig $Kubeconfig wait --for=condition=complete --timeout=180s job/backend-migration -n $namespace

kubectl --kubeconfig $Kubeconfig apply -f (Join-Path $renderRoot "backend-deployment.yaml")
kubectl --kubeconfig $Kubeconfig apply -f (Join-Path $renderRoot "frontend-deployment.yaml")
kubectl --kubeconfig $Kubeconfig rollout status deployment/backend -n $namespace --timeout=240s
kubectl --kubeconfig $Kubeconfig rollout status deployment/frontend -n $namespace --timeout=240s
kubectl --kubeconfig $Kubeconfig apply -f (Join-Path $remoteRoot "ingress.yaml")

Write-Host "Remote Kubernetes deploy is ready:"
Write-Host "  http://tic-tac-arena.46.225.222.116.sslip.io/"
Write-Host "  http://tic-tac-arena.46.225.222.116.sslip.io/health"
