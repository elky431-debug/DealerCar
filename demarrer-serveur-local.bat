@echo off
chcp 65001 >nul
title DealerLink — serveur local (port 3001)
cd /d "%~dp0"
where node >nul 2>nul || (echo Installez Node.js depuis https://nodejs.org & pause & exit /b 1)
if not exist "package.json" (echo Placez ce fichier a la racine du projet DealerLink. & pause & exit /b 1)
echo.
echo Lancement sur http://127.0.0.1:3001 — laissez cette fenetre ouverte.
echo.
call npm install
call npm run dev
pause
