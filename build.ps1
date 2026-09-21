$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$parent = Split-Path -Parent $root

# Lit la version depuis manifest.json pour nommer les fichiers de sortie.
$manifest = Get-Content -Raw (Join-Path $root "manifest.json") | ConvertFrom-Json
$version = $manifest.version

$dist = Join-Path $parent "banablur-dist"
$zipPath = Join-Path $parent "banablur-$version.zip"
$xpiPath = Join-Path $parent "banablur-$version.xpi"
$unpacked = Join-Path $parent "banablur-$version"

# --- Proprete: nettoyer TOUS les artefacts de builds precedents ---
# Dossier source = ce repo (sans suffixe de version). Ne jamais le supprimer.
# Sorties = banablur-<version>.zip/.xpi et dossier extrait banablur-<version>/.
# Ne touche jamais aux dossiers de signature *-signed/.
Get-ChildItem -Path $parent -Filter "banablur*.zip" -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path $parent -Filter "banablur*.xpi" -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path $parent -Filter "agego-deblur*.zip" -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path $parent -Filter "agego-deblur*.xpi" -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path $parent -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^banablur-\d' -or $_.Name -match '^agego-deblur-\d' } |
  Remove-Item -Recurse -Force
if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }

New-Item -ItemType Directory -Path $dist -Force | Out-Null

$files = @(
  "manifest.json",
  "background.js",
  "content.js",
  "chaturbate-gate.css",
  "chaturbate.js",
  "chaturbate-page.js",
  "xvideos-page.js",
  "xhamster-page.js",
  "lebonporn-page.js",
  "ageverif-page.js",
  "lebonporn-inject.js",
  "hls.min.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "override.css",
  "icons\icon-16.png",
  "icons\icon-32.png",
  "icons\icon-48.png",
  "icons\icon-96.png",
  "icons\icon-128.png"
)

foreach ($f in $files) {
  $src = Join-Path $root $f
  $dest = Join-Path $dist $f
  $destDir = Split-Path $dest -Parent
  if (!(Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
  Copy-Item $src $dest
}

# Compress-Archive (Windows) ecrit des chemins avec "\" : Firefox juge le XPI
# "corrompu". On force des slashs Unix + Deflate via .NET ZipFile.
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

function New-ExtensionZip {
  param(
    [Parameter(Mandatory = $true)][string]$SourceDir,
    [Parameter(Mandatory = $true)][string]$OutPath
  )
  if (Test-Path $OutPath) { Remove-Item $OutPath -Force }
  $zip = [System.IO.Compression.ZipFile]::Open($OutPath, [System.IO.Compression.ZipArchiveMode]::Create)
  try {
    $distFull = (Resolve-Path $SourceDir).Path
    Get-ChildItem -Path $SourceDir -Recurse -File | ForEach-Object {
      $rel = $_.FullName.Substring($distFull.Length).TrimStart('\').Replace('\', '/')
      [void][System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile(
        $zip,
        $_.FullName,
        $rel,
        [System.IO.Compression.CompressionLevel]::Optimal
      )
    }
  } finally {
    $zip.Dispose()
  }
}

# Source manifest keeps both keys for local mixed use.
# Chrome MV3 rejects background.scripts (warning: requires manifest v2 or lower).
# Firefox AMO uses background.scripts and ignores service_worker.
$manifestPath = Join-Path $dist "manifest.json"
$originalManifest = [System.IO.File]::ReadAllText($manifestPath)

# Chrome zip + dossier extrait: service_worker only (no background.scripts).
$chromeManifest = $originalManifest -replace ',\s*"scripts"\s*:\s*\[\s*"background\.js"\s*\]', ''
[System.IO.File]::WriteAllText($manifestPath, $chromeManifest)
New-ExtensionZip -SourceDir $dist -OutPath $zipPath

# Firefox XPI: background.scripts only (no service_worker).
$firefoxManifest = $originalManifest -replace '"service_worker"\s*:\s*"background\.js"\s*,', ''
[System.IO.File]::WriteAllText($manifestPath, $firefoxManifest)
New-ExtensionZip -SourceDir $dist -OutPath $xpiPath

# --- Extraction automatique du zip (evite de le decompresser a la main) ---
Expand-Archive -Path $zipPath -DestinationPath $unpacked -Force

# Nettoyage du staging temporaire
Remove-Item $dist -Recurse -Force

Write-Host "Build OK (version $version):"
Write-Host "  ZIP:      $zipPath"
Write-Host "  XPI:      $xpiPath"
Write-Host "  UNPACKED: $unpacked"
