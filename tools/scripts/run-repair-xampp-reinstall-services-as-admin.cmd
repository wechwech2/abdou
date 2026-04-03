@echo off
setlocal

set SCRIPT_PATH=%~dp0repair-xampp-services.ps1

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'C:\Program Files\PowerShell\7\pwsh.exe' -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%SCRIPT_PATH%"" -ReinstallServices' -Verb RunAs"

endlocal
