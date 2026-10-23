@echo off
chcp 65001 >nul
cd /d "%~dp0..\mcp-bridge"
if not exist node_modules (
  call npm ci
  if errorlevel 1 exit /b 1
)
node setup.js
if errorlevel 1 exit /b 1
node runner.js
pause
