@echo off
chcp 65001 >nul
title DealerLink — serveur local
cd /d "%~dp0"
echo.
echo DealerLink utilise le port 3000 par defaut.
echo Ouverture prevue : http://127.0.0.1:3000
echo.
call npm run dev:quick
pause
