$ErrorActionPreference = 'Continue'

$scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$logPath = Join-Path $scriptRoot "xampp-admin-repair-$stamp.log"

Start-Transcript -Path $logPath -Force | Out-Null

Write-Host "=== XAMPP admin repair started ==="
Write-Host "Log: $logPath"
Write-Host ""

$repairScript = Join-Path $scriptRoot 'repair-xampp-services.ps1'
$fixScript = Join-Path $scriptRoot 'fix-xampp-control-panel-crash.ps1'

if (Test-Path -LiteralPath $repairScript) {
  Write-Host "[1/3] Repair services (with reinstall)..."
  try {
    & $repairScript -ReinstallServices
  } catch {
    Write-Error "repair-xampp-services.ps1 failed: $($_.Exception.Message)"
  }
} else {
  Write-Error "Missing script: $repairScript"
}

if (Test-Path -LiteralPath $fixScript) {
  Write-Host ""
  Write-Host "[2/3] Fix xampp-control crash settings..."
  try {
    & $fixScript
  } catch {
    Write-Error "fix-xampp-control-panel-crash.ps1 failed: $($_.Exception.Message)"
  }
} else {
  Write-Error "Missing script: $fixScript"
}

Write-Host ""
Write-Host "[3/3] Final service status..."
foreach ($svcName in @('Apache2.4', 'mysql')) {
  try {
    $svc = Get-Service -Name $svcName -ErrorAction Stop
    Write-Host ("{0}: {1}" -f $svcName, $svc.Status)
  } catch {
    Write-Host ("{0}: NOT FOUND" -f $svcName)
  }
}

Write-Host ""
Write-Host "=== Finished ==="
Write-Host "Log file: $logPath"

Stop-Transcript | Out-Null
Read-Host "Press Enter to close this window"
