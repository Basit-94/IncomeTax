@echo off
setlocal enabledelayedexpansion
title Wapsi Platform — Activity Inspector

:: Change directory to script folder
cd /d "%~dp0"

:: If arguments were passed directly from command line
if "%1"=="live" goto run_live
if "%1"=="today" goto run_today
if "%1"=="all" goto run_all
if "%1"=="export" goto run_export
if "%1"=="notepad" goto run_notepad
if "%1"=="open" goto run_notepad
if not "%1"=="" (
    node scripts/inspect-activity.cjs %*
    goto end
)

:menu
cls
echo ================================================================================
echo             WAPSI PLATFORM -- LIVE JUDGE ^& USER ACTIVITY INSPECTOR
echo ================================================================================
echo.
echo   [1] Today's Activity Summary (Since 12:00 AM)
echo   [2] Real-Time Live Watcher (Auto-refreshes every 3 seconds)
echo   [3] All-Time Historical Activity (All users and dates)
echo   [4] Generate Full Audit Report ^& Open in Notepad (.txt)
echo   [5] Search Activity by PAN or Name
echo   [6] Export All Reports to reports/ folder
echo   [0] Exit
echo.
echo ================================================================================
set /p choice="Please select an option (0-6): "

if "%choice%"=="1" goto run_today
if "%choice%"=="2" goto run_live
if "%choice%"=="3" goto run_all
if "%choice%"=="4" goto run_notepad
if "%choice%"=="5" goto run_search
if "%choice%"=="6" goto run_export
if "%choice%"=="0" goto end

echo Invalid option selected.
timeout /t 2 >nul
goto menu

:run_today
cls
echo Running Today's Activity Inspector...
echo.
node scripts/inspect-activity.cjs --today
echo.
pause
goto menu

:run_live
cls
echo Starting Real-Time Live Watcher (Press Ctrl+C to stop)...
echo.
node scripts/inspect-activity.cjs --live
pause
goto menu

:run_all
cls
echo Fetching All-Time Activity...
echo.
node scripts/inspect-activity.cjs --all
echo.
pause
goto menu

:run_notepad
cls
echo Generating Full Activity Report...
echo.
node scripts/inspect-activity.cjs --all --export
if exist "reports\activity-report-latest.txt" (
    echo Opening report in Notepad...
    start notepad.exe "reports\activity-report-latest.txt"
) else (
    echo Report generation complete.
)
echo.
pause
goto menu

:run_search
cls
echo ================================================================================
echo                       SEARCH BY PAN OR JUDGE NAME
echo ================================================================================
set /p query="Enter PAN or Name to search: "
if "%query%"=="" goto menu
echo.
node scripts/inspect-activity.cjs --all --user "%query%"
echo.
pause
goto menu

:run_export
cls
echo Exporting reports...
echo.
node scripts/inspect-activity.cjs --all --export
echo.
pause
goto menu

:end
exit /b 0
