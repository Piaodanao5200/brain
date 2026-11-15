@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0memory"

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found in PATH.
  echo         Install Node 18+ or add it to PATH, then run this again.
  echo.
  pause
  exit /b 1
)

echo.
node bin\kb.mjs refresh
set "RC=%ERRORLEVEL%"
echo.
if not "%RC%"=="0" (
  echo [WARN] finished with problems - see the messages above.
  echo.
  pause
  exit /b %RC%
)

echo [OK] Press any key to open the reading page.
pause >nul
start "" "%~dp0memory\reading\index.html"
exit /b 0
