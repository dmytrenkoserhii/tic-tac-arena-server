param(
  [string]$Tag = "local",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

$namespace = "tic-tac-arena"
$hostName = "tic-tac-arena.localhost"
$serverRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$manifestRoot = Join-Path $serverRoot "k8s"
$envFile = Join-Path $serverRoot ".env"

if ((kubectl config current-context) -ne "docker-desktop") {
  throw "Current kubectl context must be docker-desktop for local deploy."
}

if (-not $SkipBuild) {
  & (Join-Path $PSScriptRoot "build-images.ps1") -Tag $Tag -ApiUrl "http://$hostName/api"
}

kubectl apply -f (Join-Path $manifestRoot "namespace.yaml")
kubectl apply -f (Join-Path $manifestRoot "configmap.yaml")

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

kubectl create secret generic tic-tac-arena-secrets `
  -n $namespace `
  --from-literal="SUPABASE_URL=$($envValues['SUPABASE_URL'])" `
  --from-literal="SUPABASE_ANON_KEY=$($envValues['SUPABASE_ANON_KEY'])" `
  --from-literal="DATABASE_URL=$($envValues['DATABASE_URL'])" `
  --dry-run=client `
  -o yaml |
  kubectl apply -f -

kubectl delete job backend-migration -n $namespace --ignore-not-found=true
kubectl apply -f (Join-Path $manifestRoot "backend-migration-job.yaml")
kubectl wait --for=condition=complete --timeout=120s job/backend-migration -n $namespace

kubectl apply -f (Join-Path $manifestRoot "backend-deployment.yaml")
kubectl apply -f (Join-Path $manifestRoot "frontend-deployment.yaml")
kubectl rollout restart deployment/backend -n $namespace
kubectl rollout restart deployment/frontend -n $namespace
kubectl rollout status deployment/backend -n $namespace --timeout=180s
kubectl rollout status deployment/frontend -n $namespace --timeout=180s

kubectl apply -f (Join-Path $manifestRoot "ingress.yaml")

Write-Host "Local Kubernetes deploy is ready:"
Write-Host "  http://$hostName/"
Write-Host "  http://$hostName/health"
