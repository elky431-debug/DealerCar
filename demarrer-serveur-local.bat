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
echo Dossier du projet ^(doit contenir package.json^) :
cd
echo.

echo === Vérification rapide ^(port 3000, chemins^) ===
call npm run doctor
if errorlevel 1 (
  echo [AVERTISSEMENT] doctor a signale un souci — on tente quand meme le serveur.
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
echo === Démarrage du serveur ^(mode direct, sans etape predev bloquante^) ===
echo Ouvrez : http://127.0.0.1:3000
echo Si le port 3000 est pris, fermez cette fenetre et dans cmd tapez : npm run dev:quick:3001
echo Puis ouvrez : http://127.0.0.1:3001
echo.
echo Si une ERREUR rouge apparait, copiez TOUT le texte de cette fenetre.
echo Laissez la fenetre OUVERTE tant que vous testez le site. Ctrl+C pour arreter.
echo.
call npm run dev:quick
echo.
pause
