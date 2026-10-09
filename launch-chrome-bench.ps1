# EXTERNAL bench Chrome + uBlock Origin Lite (ads must not cost us a site).
$ErrorActionPreference = "Stop"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$tools = Join-Path (Split-Path -Parent $PSScriptRoot) "tools"
$ubol = Join-Path $tools "uBOLite"
$profile = Join-Path $env:TEMP "banablur-strict-profile"
$port = 9336

if (!(Test-Path $ubol)) {
  throw "uBOLite not found: $ubol — run download-ubol.ps1 first"
}

Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1

Start-Process -FilePath $chrome -ArgumentList @(
  "--remote-debugging-port=$port",
  "--user-data-dir=$profile",
  "--no-first-run",
  "--no-default-browser-check",
  "--enable-unsafe-extension-debugging",
  "--load-extension=$ubol"
)
Write-Host "Chrome bench CDP 127.0.0.1:$port + uBOLite $ubol"
