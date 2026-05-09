@echo off
chcp 65001 >nul
title DealerLink — serveur local
cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo [ERREUR] Node.js n'est pas installé ou pas dans le PATH.
  echo Installez la version LTS : https://nodejs.org
  echo Puis fermez et rouvrez cette fenêtre.
  echo.
  pause
  exit /b 1
)

if not exist "package.json" (
  echo.
  echo [ERREUR] Ce fichier doit être dans le dossier du projet DealerLink ^(avec package.json^).
  echo.
  pause
  exit /b 1
)

echo.
echo === DealerLink — installation des dépendances ^(si besoin^) ===
call npm install
if errorlevel 1 (
  echo.
  echo [ERREUR] npm install a échoué. Copiez les messages ci-dessus.
  pause
  exit /b 1
)

echo.
echo === Démarrage du serveur ===
echo Ouvrez dans le navigateur : http://localhost:3000
echo Laissez CETTE fenêtre ouverte. Fermez avec Ctrl+C pour arrêter.
echo.
call npm run dev
echo.
pause
