@echo off
SET PGPASSWORD=1234
SET DB_NAME=meditek
SET DB_USER=postgres
SET PG_RESTORE="C:\Program Files\PostgreSQL\18\bin\pg_restore.exe"

:: Pedir archivo a restaurar
SET /P BACKUP_FILE="Ruta del archivo .dump a restaurar: "

%PG_RESTORE% -h localhost -U %DB_USER% -d %DB_NAME% -F c -c "%BACKUP_FILE%"

IF %ERRORLEVEL% EQU 0 (
    echo ✅ Restauración exitosa
) ELSE (
    echo ❌ Error en la restauración
)
pause