# scripts/setup.ps1 - Automated Setup & Environment Verification for AstroAI Agent
# Windows PowerShell compatible script

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " AstroAI Agent - Automated System Setup   " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Verify Prerequisites
Write-Host "`n[1/7] Checking System Prerequisites..." -ForegroundColor Yellow
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    Write-Host "[-] Python is not found in PATH! Please install Python 3.11+." -ForegroundColor Red
    exit 1
}
Write-Host "[+] Python executable: $($python.Source)" -ForegroundColor Green

# 2. Check Directory Structure
Write-Host "`n[2/7] Ensuring Required Directories Exist..." -ForegroundColor Yellow
$directories = @(
    "storage",
    "storage/reports",
    "storage/uploads",
    "documents",
    "documents/sources",
    "documents/approved",
    "documents/metadata",
    "documents/manifests",
    "packages",
    "website/frontend",
    "website/frontend/css",
    "website/frontend/js",
    "website/frontend/assets",
    "website/backend/app",
    "website/backend/tests",
    "ai/frontend",
    "ai/frontend/css",
    "ai/frontend/js",
    "ai/frontend/assets",
    "ai/backend/app",
    "ai/backend/tests"
)

foreach ($dir in $directories) {
    if (-not (Test-Path -Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "  Created directory: $dir" -ForegroundColor Gray
    }
}
Write-Host "[+] Directory structure verified." -ForegroundColor Green

# 3. Ensure .env exists
Write-Host "`n[3/7] Checking Configuration (.env)..." -ForegroundColor Yellow
if (-not (Test-Path -Path ".env")) {
    if (Test-Path -Path ".env.example") {
        Copy-Item -Path ".env.example" -Destination ".env"
        Write-Host "[+] Created .env from .env.example (Demo Mode default)." -ForegroundColor Green
    } else {
        Write-Host "[-] .env.example not found." -ForegroundColor Red
    }
} else {
    Write-Host "[+] .env already exists. Preserving existing configuration." -ForegroundColor Green
}

# 4. Check & Install Python Dependencies
Write-Host "`n[4/7] Checking Python Dependencies..." -ForegroundColor Yellow
python scripts/verify_environment.py

# 5. Database Initialization
Write-Host "`n[5/7] Initializing Local Database..." -ForegroundColor Yellow
python -c "
from packages.database.session import init_db;
init_db();
print('Database initialized successfully.')
"

# 6. Execute Smoke Tests
Write-Host "`n[6/7] Running Unit & Smoke Tests..." -ForegroundColor Yellow
python -m pytest website/backend/tests/test_smoke.py -v --tb=short

# 7. Summary
Write-Host "`n[7/7] Setup Complete!" -ForegroundColor Cyan
Write-Host "--------------------------------------------------" -ForegroundColor Cyan
Write-Host "To start the Astro Jyotish website backend server:" -ForegroundColor White
Write-Host "  python -m uvicorn website.backend.app.main:app --host 127.0.0.1 --port 8000 --reload" -ForegroundColor Green
Write-Host "`nTo start the AstroAI consultation backend server:" -ForegroundColor White
Write-Host "  python -m uvicorn ai.backend.app.main:app --host 127.0.0.1 --port 8001 --reload" -ForegroundColor Green
Write-Host "`nTo serve the website frontend:" -ForegroundColor White
Write-Host "  python -m http.server 3000 --directory website/frontend" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
