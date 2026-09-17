@echo off
title Java Practice Compiler & Test Bench
echo ========================================================
echo   Launching Java Practice Compiler & Test Bench
echo ========================================================
echo.

set PORT=4060
start http://localhost:4060
python server.py

pause
