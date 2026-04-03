@echo off
setlocal

set SCRIPT_PATH=%~dp0xampp-admin-repair.ps1

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe' -ArgumentList '-NoProfile -ExecutionPolicy Bypass -NoExit -File ""%SCRIPT_PATH%""' -Verb RunAs"

echo.
echo Admin repair launcher started. Check the elevated PowerShell window.
echo.
pause

endlocal
