@echo off
cd /d "C:\Fej_SD\MusicHistoreum\bb_script"

set "LOG=logs\weekly_update.log"
set "MAX_LOG_BYTES=5242880"

if exist "%LOG%" for %%F in ("%LOG%") do set "LOG_SIZE=%%~zF"
if defined LOG_SIZE if %LOG_SIZE% GTR %MAX_LOG_BYTES% move /y "%LOG%" "%LOG%.old" >nul

echo ==== %date% %time% ==== >> "%LOG%"
"%USERPROFILE%\AppData\Local\Programs\Python\Python39\python.exe" bb_scrape.py >> "%LOG%" 2>&1
"%USERPROFILE%\AppData\Local\Programs\Python\Python39\python.exe" sync_to_aiven.py >> "%LOG%" 2>&1
echo ==== done %date% %time% ==== >> "%LOG%"
