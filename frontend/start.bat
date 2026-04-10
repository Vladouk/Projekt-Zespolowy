@echo off
cd /d "C:\Users\vdi-terminal\Downloads\зкщоуле\frontend"
echo.
echo ========================================
echo Delivery Manager Frontend Server
echo ========================================
echo Starting simple web server on port 8000...
echo Visit: http://localhost:8000
echo.
python -m http.server 8000
pause
