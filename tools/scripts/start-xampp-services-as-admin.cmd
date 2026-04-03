@echo off
setlocal

powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "Start-Process -FilePath 'C:\Program Files\PowerShell\7\pwsh.exe' -ArgumentList '-NoProfile -Command ""Start-Service Apache2.4; Start-Service mysql; Get-Service Apache2.4,mysql | Select-Object Name,Status | Format-Table -AutoSize""' -Verb RunAs"

endlocal
