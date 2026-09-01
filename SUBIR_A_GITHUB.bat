@echo off
chcp 65001 > nul
title SUBIENDO ACTUALIZACIONES A GITHUB...
cls
echo ====================================================================
echo          SUBIENDO CAMBIOS AL REPOSITORIO DE GITHUB
echo ====================================================================
echo.
echo [1/3] Verificando archivos y preparando paquete...
%~dp0mingit\cmd\git.exe add -A
%~dp0mingit\cmd\git.exe commit -m Actualizacion: Orden cronologico descendente, fuentes sin vacios, tabla duplicada eliminada > nul 2>&1

echo.
echo [2/3] Subiendo cambios a GitHub (Render)...
%~dp0mingit\cmd\git.exe push origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================================================
    echo [3/3] LISTO! CAMBIOS SUBIDOS CON EXITO A GITHUB
    echo En 1 a 2 minutos Render actualizara el dashboard automaticamente.
    echo ====================================================================
) else (
    echo.
    echo ====================================================================
    echo Si te abre una ventana de inicio de sesion en el navegador,
    echo autoriza el acceso a GitHub para completar la subida.
    echo ====================================================================
)

echo.
pause
