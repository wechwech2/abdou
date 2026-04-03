param(
    [string]$Database = "abdou",
    [string]$MysqlExe = "C:\Program Files\xampp\mysql\bin\mysql.exe",
    [string]$User = "root",
    [switch]$Reset
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

if (-not (Test-Path $MysqlExe)) {
    throw "mysql executable not found at: $MysqlExe"
}

function Invoke-MySql {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    & $MysqlExe @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "mysql command failed with exit code ${LASTEXITCODE}: $($Arguments -join ' ')"
    }
}

function Invoke-MySqlFile {
    param(
        [Parameter(Mandatory = $true)]
        [string]$DatabaseName,
        [Parameter(Mandatory = $true)]
        [string]$FilePath
    )

    if (-not (Test-Path $FilePath)) {
        throw "SQL file not found: $FilePath"
    }

    $cmd = """$MysqlExe"" -u$User $DatabaseName < ""$FilePath"""
    cmd.exe /c $cmd
    if ($LASTEXITCODE -ne 0) {
        throw "mysql import failed with exit code ${LASTEXITCODE}: $FilePath"
    }
}

$dbExists = (& $MysqlExe "-u$User" "-N" "-s" "-e" "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = '$Database';").Trim()
if ($LASTEXITCODE -ne 0) {
    throw "failed to inspect existing database '$Database'"
}

if ($dbExists -and -not $Reset) {
    throw "database '$Database' already exists. Re-run with -Reset to recreate it."
}

if ($Reset) {
    Invoke-MySql -Arguments @("-u$User", "-e", "DROP DATABASE IF EXISTS $Database;")
}

Invoke-MySql -Arguments @("-u$User", "-e", "CREATE DATABASE $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")

$schemaFiles = @(
    "001_roles_users.sql",
    "002_clients.sql",
    "003_templates_offres.sql",
    "004_programmes.sql",
    "005_rubriques.sql",
    "006_medias.sql",
    "007_batiments_etages_lots.sql",
    "008_publications.sql",
    "999_indexes.sql"
)

$seedFiles = @(
    "001_roles.sql",
    "002_templates.sql",
    "003_offres.sql",
    "004_users.sql",
    "005_clients.sql",
    "006_programmes.sql",
    "007_users_non_admin.sql"
)

foreach ($file in $schemaFiles) {
    Invoke-MySqlFile -DatabaseName $Database -FilePath "db/mysql/schema/$file"
}

foreach ($file in $seedFiles) {
    Invoke-MySqlFile -DatabaseName $Database -FilePath "db/mysql/seeds/$file"
}

Write-Output "Database '$Database' initialized successfully."
