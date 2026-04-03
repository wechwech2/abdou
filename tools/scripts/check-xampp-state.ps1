$ErrorActionPreference = 'Stop'

$httpdExe = 'C:\Program Files\xampp\apache\bin\httpd.exe'
$vhosts = 'C:\Program Files\xampp\apache\conf\extra\httpd-vhosts.conf'
$hosts = 'C:\Windows\System32\drivers\etc\hosts'

Write-Output '=== Services ==='
foreach ($svc in @('Apache2.4', 'mysql')) {
  $s = Get-Service -Name $svc -ErrorAction SilentlyContinue
  if ($null -eq $s) { Write-Output "${svc}: NOT_INSTALLED" } else { Write-Output "${svc}: $($s.Status)" }
}

Write-Output ''
Write-Output '=== Apache Syntax ==='
if (Test-Path -LiteralPath $httpdExe) {
  & $httpdExe -t
} else {
  Write-Output "httpd.exe introuvable: $httpdExe"
}

Write-Output ''
Write-Output '=== Vhosts Mapping (httpd -S) ==='
if (Test-Path -LiteralPath $httpdExe) {
  & $httpdExe -S 2>$null | Select-String -Pattern 'play\\.wechwech\\.tn|recouvrement\\.wechwech\\.tn|abdou\\.wechwech\\.tn|namevhost' | ForEach-Object { $_.Line }
}

Write-Output ''
Write-Output '=== IncludeOptional abdou ==='
if (Test-Path -LiteralPath $vhosts) {
  Select-String -Path $vhosts -Pattern 'abdou\\.wechwech\\.tn\\.conf' | ForEach-Object { $_.Line.Trim() }
}

Write-Output ''
Write-Output '=== Hosts Entries ==='
if (Test-Path -LiteralPath $hosts) {
  Select-String -Path $hosts -Pattern 'play\\.wechwech\\.tn|recouvrement\\.wechwech\\.tn|abdou\\.wechwech\\.tn' | ForEach-Object { $_.Line.Trim() }
}
