@echo off
title FurnitureVision AI - ideaepipla.gr
color 0B
echo.
echo  ================================================
echo   FurnitureVision AI - ideaepipla.gr
echo  ================================================
echo.
echo  Starting local server at http://localhost:8080
echo  The browser will open automatically...
echo.
echo  Press Ctrl+C to stop the server.
echo.
node "%~dp0server.js"
pause