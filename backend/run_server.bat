@echo off
REM Start Django Development Server
cd /d "C:\Users\Lipi\Desktop\Django-Projects\backend"
call venv\Scripts\activate.bat
python manage.py runserver
pause
