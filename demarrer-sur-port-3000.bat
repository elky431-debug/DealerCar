@echo off
chcp 65001 >nul
title DealerLink — port 3000 ^(secours^)
cd /d "%~dp0"
where node >nul 2>nul || (echo Installez Node.js https://nodejs.org & pause & exit /b 1)
if not exist "package.json" (echo Placez ce fichier dans le dossier du projet. & pause & exit /b 1)
call npm install
echo.
echo Ouverture prevue : http://127.0.0.1:3000
call npm run dev:3000
pause
