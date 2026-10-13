@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0tools\build-photos.ps1"
powershell -ExecutionPolicy Bypass -File "%~dp0tools\build-mods.ps1"
pause
