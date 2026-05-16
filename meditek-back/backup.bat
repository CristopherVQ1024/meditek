@echo off
SET PGPASSWORD=1234
SET BACKUP_DIR=C:\backups\meditek
SET DB_NAME=meditek
SET DB_USER=postgres
SET DB_HOST=localhost
SET DB_PORT=5432
SET PG_DUMP="C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"

:: Crear carpeta si no existe
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Obtener fecha y hora con PowerShell (compatible Windows 10/11)
FOR /F "usebackq" %%D IN (`powershell -NoProfile -Command "Get-Date -Format 'yyyy-MM-dd_HH-mm'"`) DO SET DATE_STR=%%D

:: Hacer backup
%PG_DUMP% -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F c -f "%BACKUP_DIR%\backup_%DATE_STR%.dump"

IF %ERRORLEVEL% EQU 0 (
    echo Backup exitoso: %BACKUP_DIR%\backup_%DATE_STR%.dump
) ELSE (
    echo Error en el backup
)
pause