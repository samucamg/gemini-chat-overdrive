@echo off
chcp 65001 > nul
title Gemini MCP - Inicializador Chrome Debugger (Porta 9222)
color 0B

echo ==============================================================================
echo       INICIALIZADOR GOOGLE CHROME DEVTOOLS DEBUGGER (PORTA 9222)
echo ==============================================================================
echo.
echo Este script inicia o Google Chrome com a porta de depuração 9222 aberta.
echo Ele usa um perfil de desenvolvedor isolado para NAO conflitar com seu Chrome pessoal.
echo.

set "CHROME_PATH="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
) else if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
) else if exist "%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe" (
    set "CHROME_PATH=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
)

if "%CHROME_PATH%"=="" (
    color 0C
    echo [ERRO] O executavel chrome.exe nao foi encontrado nos caminhos padrao.
    pause
    exit /b 1
)

echo [OK] Chrome encontrado em: "%CHROME_PATH%"
echo [OK] Abrindo Chrome na porta 9222 com perfil isolado...
echo.

start "" "%CHROME_PATH%" --remote-debugging-port=9222 --user-data-dir="%LOCALAPPDATA%\Google\Chrome-MCP-Debug" http://localhost:9222/json/version

echo Navegador iniciado! Deixe esta janela ou o navegador aberto para que o
echo servidor 'chrome-devtools-mcp' consiga inspecionar requisições, console e DOM.
echo.
pause
