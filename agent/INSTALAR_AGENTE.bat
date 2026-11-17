@echo off
chcp 65001 >nul
title Instalador do Agente Vanguard
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"

