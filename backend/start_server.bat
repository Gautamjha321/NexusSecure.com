@echo off
REM Start Django Development Server
REM This script activates the virtual environment and starts the Django server

cd /d "%~dp0"
echo.
echo Starting Django Development Server...
echo.

REM Check if venv exists
if not exist ".venv\Scripts\activate.bat" (
    echo ERROR: Virtual environment not found!
    echo Please run: python -m venv .venv
    pause
    exit /b 1
)

REM Activate virtual environment
call .venv\Scripts\activate.bat

REM Check if Django is installed
python -c "import django" >nul 2>&1
if errorlevel 1 (
    echo Installing dependencies...
    pip install -r requirements.txt
)

REM Start server
echo.
echo =========================================
echo Django Development Server Starting...
echo =========================================
echo URL: http://127.0.0.1:8000
echo Admin: http://127.0.0.1:8000/admin
echo Press CTRL+C to stop
echo =========================================
echo.

python manage.py runserver

pause
