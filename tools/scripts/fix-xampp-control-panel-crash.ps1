$ErrorActionPreference = 'Stop'

function Assert-Admin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Execute ce script en mode administrateur."
  }
}

Assert-Admin

$xamppRoot = 'C:\Program Files\xampp'
$iniPath = Join-Path $xamppRoot 'xampp-control.ini'
$logPath = Join-Path $xamppRoot 'xampp-control.log'

if (-not (Test-Path -LiteralPath $iniPath)) {
  throw "Introuvable: $iniPath"
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath = Join-Path $xamppRoot "xampp-control.ini.bak-$stamp"
Copy-Item -LiteralPath $iniPath -Destination $backupPath -Force

$content = @'
[Common]
Edition=
Editor=notepad.exe
Browser=
Debug=0
Debuglevel=0
TomcatVisible=0
Language=en
Minimized=0

[EnableModules]
Apache=1
MySQL=1
FileZilla=0
Mercury=0
Tomcat=0

[LogSettings]
Font=Arial
FontSize=10

[WindowSettings]
Left=220
Top=120
Width=720
Height=470

[Autostart]
Apache=0
MySQL=0
FileZilla=0
Mercury=0
Tomcat=0

[Checks]
CheckRuntimes=1
CheckDefaultPorts=1

[ModuleNames]
Apache=Apache
MySQL=MySQL
FileZilla=FileZilla
Mercury=Mercury
Tomcat=Tomcat

[EnableServices]
Apache=1
MySQL=1
FileZilla=0
Tomcat=0

[BinaryNames]
Apache=httpd.exe
MySQL=mysqld.exe
FileZilla=filezillaserver.exe
FileZillaAdmin=filezilla server interface.exe
Mercury=mercury.exe
Tomcat=tomcat8.exe

[ServiceNames]
Apache=Apache2.4
MySQL=mysql
FileZilla=FileZillaServer
Tomcat=Tomcat

[ServicePorts]
Apache=80
ApacheSSL=443
MySQL=3306
FileZilla=21
FileZillaAdmin=14147
Mercury1=25
Mercury2=79
Mercury3=105
Mercury4=106
Mercury5=110
Mercury6=143
Mercury7=2224
TomcatHTTP=8080
TomcatAJP=8009
Tomcat=8005

[UserConfigs]
Apache=
MySQL=
FileZilla=
Mercury=
Tomcat=

[UserLogs]
Apache=
MySQL=
FileZilla=
Mercury=
Tomcat=
'@

Set-Content -LiteralPath $iniPath -Value $content -Encoding utf8

if (Test-Path -LiteralPath $logPath) {
  Copy-Item -LiteralPath $logPath -Destination (Join-Path $xamppRoot "xampp-control.log.bak-$stamp") -Force
  Set-Content -LiteralPath $logPath -Value '' -Encoding utf8
}

Write-Output "OK: xampp-control.ini reinitialise."
Write-Output "Backup ini: $backupPath"
Write-Output "Action suivante: relancer xampp-control.exe en admin."
