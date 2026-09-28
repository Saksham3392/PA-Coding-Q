@echo off
:: ==============================================================================
:: Java Practice Compiler & Test Bench - Windows Quick Start Launcher
:: ==============================================================================
:: Purpose:
:: Sets the environment port to 4060, launches the local Flask backend (server.py),
:: and automatically opens the user's default browser to the web workbench.
::
:: Requirements:
:: 1. Python 3.8+ installed and in PATH (with Flask & Flask-CORS: pip install -r requirements.txt)
:: 2. Java JDK 8+ installed and in PATH (javac & java)
:: ==============================================================================

title Java Practice Compiler & Test Bench
echo ========================================================
echo   Launching Java Practice Compiler & Test Bench
echo   Frontend & Backend running at: http://localhost:4060
echo ========================================================
echo.

set PORT=4060

:: Open default web browser pointing to the local server
start http://localhost:4060

:: Launch Flask backend (blocks until user terminates with Ctrl+C)
python server.py

:: Keep window open if server exits unexpectedly
pause

