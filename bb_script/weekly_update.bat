@echo off
cd /d "C:\Fej_SD\MusicHistoreum\bb_script"
echo ==== %date% %time% ==== >> logs\weekly_update.log
"C:\Users\looko\AppData\Local\Programs\Python\Python39\python.exe" bb_scrape.py >> logs\weekly_update.log 2>&1
"C:\Users\looko\AppData\Local\Programs\Python\Python39\python.exe" sync_to_aiven.py >> logs\weekly_update.log 2>&1
echo ==== done %date% %time% ==== >> logs\weekly_update.log
