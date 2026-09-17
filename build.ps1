$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$parent = Split-Path -Parent $root

# Lit la version depuis manifest.json pour nommer les fichiers de sortie.
$manifest = Get-Content -Raw (Join-Path $root "manifest.json") | ConvertFrom-Json
$version = $manifest.version

$dist = Join-Path $parent "agego-deblur-dist"
$zipPath = Join-Path $parent "agego-deblur-$version.zip"
$xpiPath = Join-Path $parent "agego-deblur-$version.xpi"
$unpacked = Join-Path $parent "agego-deblur-$version"

# --- Proprete: nettoyer TOUS les artefacts de builds precedents ---
# Supprime archives (.zip/.xpi) et dossiers extraits de toutes les versions,
# ainsi que le staging. Ne touche jamais au dossier source "agego-deblur"
# (sans tiret de version).
Get-ChildItem -Path $parent -Filter "agego-deblur*.zip" -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path $parent -Filter "agego-deblur*.xpi" -File -ErrorAction SilentlyContinue | Remove-Item -Force
Get-ChildItem -Path $parent -Directory -ErrorAction SilentlyContinue |
  Where-Object { $_.Name -match '^agego-deblur-\d' } |
  Remove-Item -Recurse -Force

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
  "pornhub-page.js",
  "lebonporn-page.js",
  "lebonporn-inject.js",
  "hls.min.js",
  "popup.html",
  "popup.js",
  "popup.css",
  "override.css",
  "icons\icon-16.png",
  "icons\icon-48.png",
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
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)
try {
  $distFull = (Resolve-Path $dist).Path
  Get-ChildItem -Path $dist -Recurse -File | ForEach-Object {
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
Copy-Item $zipPath $xpiPath -Force

# --- Extraction automatique du zip (evite de le decompresser a la main) ---
Expand-Archive -Path $zipPath -DestinationPath $unpacked -Force

# Nettoyage du staging temporaire
Remove-Item $dist -Recurse -Force

Write-Host "Build OK (version $version):"
Write-Host "  ZIP:      $zipPath"
Write-Host "  XPI:      $xpiPath"
Write-Host "  UNPACKED: $unpacked"
