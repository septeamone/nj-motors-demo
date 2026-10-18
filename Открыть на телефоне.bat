@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist out call npm run build
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '169.*' -and $_.IPAddress -ne '127.0.0.1' } | Select-Object -First 1).IPAddress"`) do set IP=%%i
echo.
echo  Откройте на телефоне (телефон в той же сети, что и компьютер):
echo.
echo      http://%IP%:8772/
echo.
echo  Чтобы выключить, закройте это окно.
echo.
node scripts/serve.mjs 8772 out
