@echo off
chcp 65001 >nul
title kb-memory
cd /d "%~dp0"

set "NODE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE=D:\WorkBuddy\binaries\node\versions\22.22.2-6\node.exe"

if not exist "%NODE%" (
  if "%NODE%"=="node" (
    echo [ERROR] node not found. Install Node 18+ or edit NODE path in this file.
    pause
    exit /b 1
  )
)

echo Starting kb-memory on http://localhost:8787
echo.
echo   Index  : http://localhost:8787/index
echo   Search : http://localhost:8787/search?q=keyword
echo   MCP    : http://localhost:8787/mcp
echo.
echo Press Ctrl+C to stop.
echo.

start "" "http://localhost:8787/index"
"%NODE%" "server\mcp-server.mjs"
pause
