@echo off
rem Amor Stories - bot modu kural editoru (tarayicida acilir)
cd /d "%~dp0"
title Amor Stories - Bot editoru
powershell -NoProfile -ExecutionPolicy Bypass -File "tools\bot-server.ps1"
if errorlevel 1 pause
