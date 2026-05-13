param(
  [Parameter(Mandatory = $true)]
  [string]$ImageRepository,

  [Parameter(Mandatory = $true)]
  [string]$Tag,

  [string]$ApiUrl = "http://tic-tac-arena.46.225.222.116.sslip.io/api"
)

$ErrorActionPreference = "Stop"

$serverRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..\..")
$workspaceRoot = Resolve-Path (Join-Path $serverRoot "..")
$webRoot = Join-Path $workspaceRoot "tic-tac-arena-web"
$envFile = Join-Path $serverRoot ".env"

if (-not (Test-Path $envFile)) {
  throw "Missing server .env file: $envFile"
}

$envValues = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match "^([^#][^=]+)=(.*)$") {
    $envValues[$Matches[1].Trim()] = $Matches[2].Trim()
  }
}

foreach ($key in @("SUPABASE_URL", "SUPABASE_ANON_KEY")) {
  if (-not $envValues[$key]) {
    throw "Missing required .env value: $key"
  }
}

$backendImage = "$ImageRepository/tic-tac-arena-backend:$Tag"
$frontendImage = "$ImageRepository/tic-tac-arena-frontend:$Tag"

docker build `
  -f (Join-Path $serverRoot "docker\backend\Dockerfile") `
  -t $backendImage `
  $serverRoot

docker build `
  -f (Join-Path $serverRoot "docker\frontend\Dockerfile") `
  -t $frontendImage `
  --build-arg "VITE_API_URL=$ApiUrl" `
  --build-arg "VITE_SUPABASE_URL=$($envValues['SUPABASE_URL'])" `
  --build-arg "VITE_SUPABASE_ANON_KEY=$($envValues['SUPABASE_ANON_KEY'])" `
  $webRoot

docker push $backendImage
docker push $frontendImage

Write-Host "Pushed images:"
Write-Host "  $backendImage"
Write-Host "  $frontendImage"
