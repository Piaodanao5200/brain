@echo off
chcp 65001 >nul
title kb 看板
cd /d "%~dp0"

set "NODE=node"
where node >nul 2>nul
if errorlevel 1 set "NODE=D:\WorkBuddy\binaries\node\versions\22.22.2-6\node.exe"

"%NODE%" "memory\server\ui-server.mjs"
if errorlevel 1 pause