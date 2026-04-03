$ErrorActionPreference = 'Stop'

$sslConf = 'C:\Program Files\xampp\apache\conf\extra\httpd-ssl.conf'
$include = 'IncludeOptional "C:/Users/webmaster/OneDrive/Dev/abdou/apache/abdou.wechwech.tn-ssl.conf"'

$raw = Get-Content -LiteralPath $sslConf -Raw
if ($raw -notmatch [regex]::Escape($include)) {
  Add-Content -LiteralPath $sslConf -Value "`r`n# --- Project include: abdou HTTPS ---`r`n$include`r`n"
}

Write-Output 'OK'
