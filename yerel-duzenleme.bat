@echo off
rem Amor Stories - uygulamayi bu bilgisayarda acar; Ben > Sistem kaydi acikken eklediklerin js\data\system.js'e yazilir
cd /d "%~dp0"
title Amor Stories - Yerel duzenleme
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\bot-server.ps1" -Open app
if errorlevel 1 pause
