@echo off
setlocal

set SCRIPT_PATH=%~dp0fix-xampp-control-panel-crash.ps1

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'C:\Program Files\PowerShell\7\pwsh.exe' -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File ""%SCRIPT_PATH%""' -Verb RunAs"

endlocal
