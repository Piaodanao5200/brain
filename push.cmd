@echo off
chcp 65001 >nul
title push to github
cd /d "%~dp0"

set "NODE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE=D:\WorkBuddy\binaries\node\versions\22.22.2-6\node.exe"

"%NODE%" "memory\bin\push.mjs" %*
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" (
  echo [WARN] push failed - see the messages above.
)
pause
exit /b %RC%
