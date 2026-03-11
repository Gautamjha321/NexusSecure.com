@echo off
REM Start Next.js Frontend Development Server

cd /d "%~dp0"
echo.
echo Starting Next.js Development Server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local from example...
    copy .env.local.example .env.local
    echo Please edit .env.local with your settings
)

REM Start server
echo.
echo =========================================
echo Next.js Development Server Starting...
echo =========================================
echo URL: http://localhost:3000
echo Press CTRL+C to stop
echo =========================================
echo.

call npm run dev

pause
