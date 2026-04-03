$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath 'C:\xampp')) {
  Write-Output 'C:\xampp not found'
  exit 0
}

cmd /c "takeown /F C:\xampp /R /D O" | Out-Null
cmd /c "icacls C:\xampp /grant Administrators:(OI)(CI)F /T" | Out-Null

Remove-Item -LiteralPath 'C:\xampp' -Recurse -Force
Write-Output 'C:\xampp removed'
