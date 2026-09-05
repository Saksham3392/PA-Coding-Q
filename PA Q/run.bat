@echo off
title Java Practice Compiler & Test Bench
echo ========================================================
echo   Launching Java Practice Compiler & Test Bench
echo ========================================================
echo.

set PORT=5080
start http://localhost:5080
python server.py

pause
