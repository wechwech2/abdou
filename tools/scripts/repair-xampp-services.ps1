param(
  [switch]$ReinstallServices
)

$ErrorActionPreference = 'Stop'

function Assert-Admin {
  $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Ce script doit etre execute en tant qu'administrateur."
  }
}

function Backup-Configs {
  param([string]$XamppRoot)

  $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
  $backupRoot = Join-Path $env:USERPROFILE "Desktop\\xampp-backup-$stamp"
  New-Item -ItemType Directory -Path $backupRoot -Force | Out-Null

  $files = @(
    'apache\conf\httpd.conf',
    'apache\conf\extra\httpd-vhosts.conf',
    'apache\conf\extra\httpd-ssl.conf',
    'mysql\bin\my.ini'
  )

  foreach ($rel in $files) {
    $src = Join-Path $XamppRoot $rel
    if (Test-Path -LiteralPath $src) {
      $dst = Join-Path $backupRoot $rel
      $dstDir = Split-Path -Path $dst -Parent
      New-Item -ItemType Directory -Path $dstDir -Force | Out-Null
      Copy-Item -LiteralPath $src -Destination $dst -Force
    }
  }

  return $backupRoot
}

function Ensure-ApacheSyntax {
  param([string]$HttpdExe)
  & $HttpdExe -t
}

function Ensure-Service {
  param(
    [string]$Name,
    [string]$InstallCmd
  )

  $query = sc.exe query $Name 2>$null
  if ($LASTEXITCODE -ne 0 -and $InstallCmd) {
    Invoke-Expression $InstallCmd | Out-Null
  }
}

function Restart-OrStartService {
  param([string]$Name)

  $status = (Get-Service -Name $Name -ErrorAction SilentlyContinue).Status
  if ($null -eq $status) {
    throw "Service introuvable: $Name"
  }

  if ($status -eq 'Running') {
    Restart-Service -Name $Name -Force
  } else {
    Start-Service -Name $Name
  }

  (Get-Service -Name $Name).Status
}

$xamppRoot = 'C:\Program Files\xampp'
$httpdExe = Join-Path $xamppRoot 'apache\bin\httpd.exe'
$mysqldExe = Join-Path $xamppRoot 'mysql\bin\mysqld.exe'
$myIni = Join-Path $xamppRoot 'mysql\bin\my.ini'

Assert-Admin

if (-not (Test-Path -LiteralPath $httpdExe)) {
  throw "httpd.exe introuvable: $httpdExe"
}
if (-not (Test-Path -LiteralPath $mysqldExe)) {
  throw "mysqld.exe introuvable: $mysqldExe"
}

$backupPath = Backup-Configs -XamppRoot $xamppRoot
Write-Output "Backup config cree: $backupPath"

Ensure-ApacheSyntax -HttpdExe $httpdExe | Out-Host

if ($ReinstallServices) {
  Write-Output 'Reinstallation des services Apache2.4 et mysql (sans toucher aux confs)...'
  & $httpdExe -k uninstall -n Apache2.4 | Out-Host
  & $httpdExe -k install -n Apache2.4 | Out-Host
  & $mysqldExe --remove mysql | Out-Host
  & $mysqldExe --install mysql --defaults-file="$myIni" | Out-Host
}

Ensure-Service -Name 'Apache2.4' -InstallCmd $null
Ensure-Service -Name 'mysql' -InstallCmd $null

$apacheStatus = Restart-OrStartService -Name 'Apache2.4'
$mysqlStatus = Restart-OrStartService -Name 'mysql'

Write-Output "Apache2.4: $apacheStatus"
Write-Output "mysql: $mysqlStatus"
Write-Output 'Reparation terminee.'
