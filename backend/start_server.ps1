# Start Django Development Server (PowerShell)
# This script activates the virtual environment and starts the Django server

$ErrorActionPreference = "Stop"

Write-Host "`n" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "  Django Development Server Starter" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

# Get the directory where this script is located
$scriptDir = Split-Path -Parent $MyInvocation.MyCommandPath
Set-Location $scriptDir

Write-Host "Working directory: $(Get-Location)" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-not (Test-Path ".venv\Scripts\Activate.ps1")) {
    Write-Host "ERROR: Virtual environment not found!" -ForegroundColor Red
    Write-Host "Please run: python -m venv .venv" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Cyan
& ".venv\Scripts\Activate.ps1"

# Check if Django is installed
try {
    python -c "import django; print('Django version: ' + django.__version__)"
} catch {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Green
Write-Host "Django Development Server Starting..." -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
Write-Host "URL: http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "Admin: http://127.0.0.1:8000/admin" -ForegroundColor Yellow
Write-Host "Press CTRL+C to stop" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Green
Write-Host ""

python manage.py runserver

Read-Host "`nPress Enter to close"
