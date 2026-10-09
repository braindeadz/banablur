param([switch]$SkipAmo)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Net.Http | Out-Null
Add-Type -AssemblyName System.IO.Compression | Out-Null
Add-Type -AssemblyName System.IO.Compression.FileSystem | Out-Null

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$parent = Split-Path -Parent $root
$codeRoot = Split-Path -Parent $parent   # C:\0-Projets_CODE

$manifest = Get-Content -Raw (Join-Path $root "manifest.json") | ConvertFrom-Json
$ver = $manifest.version
$zip = Join-Path $parent "banablur-$ver.zip"
$xpi = Join-Path $parent "banablur-$ver.xpi"
$signedDir = Join-Path $parent "agego-deblur-signed"
$desktop = [Environment]::GetFolderPath("Desktop")
$addonId = $manifest.browser_specific_settings.gecko.id

if (!(Test-Path $zip)) { throw "ZIP not found: $zip (run build.ps1)" }
if (!(Test-Path $xpi)) { throw "XPI not found: $xpi (run build.ps1)" }
if (!(Test-Path $signedDir)) { New-Item -ItemType Directory -Path $signedDir -Force | Out-Null }
$signedXpi = Join-Path $signedDir "banablur-$ver-firefox-signed.xpi"

function ConvertTo-Base64Url([byte[]]$bytes) {
  return ([Convert]::ToBase64String($bytes)).TrimEnd('=').Replace('+', '-').Replace('/', '_')
}

function New-AmoJwt([string]$issuer, [string]$secret) {
  # epoch seconds
  $epoch = [int]((Get-Date).ToUniversalTime() - [datetime]'1970-01-01').TotalSeconds
  $header = '{"alg":"HS256","typ":"JWT"}'
  $payload = "{""iss"":""$issuer"",""iat"":$epoch,""exp"":$($epoch + 300),""jti"":""$([guid]::NewGuid().ToString())""}"
  $h = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($header))
  $p = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($payload))
  $hmac = New-Object System.Security.Cryptography.HMACSHA256
  $hmac.Key = [Text.Encoding]::UTF8.GetBytes($secret)
  $sig = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("$h.$p"))
  return "$h.$p.$(ConvertTo-Base64Url $sig)"
}

# --- Google service account (JWT RS256 auth, no expiring token) ---
function Read-Der([byte[]]$b, [ref]$pos) {
  $tag = $b[$pos.Value]; $pos.Value++
  $lb = $b[$pos.Value]; $pos.Value++
  $len = 0
  if ($lb -band 0x80) {
    $n = $lb -band 0x7F
    for ($i=0; $i -lt $n; $i++) { $len = ($len -shl 8) -bor $b[$pos.Value]; $pos.Value++ }
  } else { $len = $lb }
  $s = $pos.Value
  $pos.Value += $len
  return @{ Tag=$tag; Start=$s; Len=$len }
}

function Strip-Zeros([byte[]]$b) {
  $i = 0
  while ($i -lt ($b.Length - 1) -and $b[$i] -eq 0) { $i++ }
  if ($i -eq 0) { return $b }
  return [byte[]]$b[$i..($b.Length-1)]
}

function Get-RsaFromPkcs8([string]$pem) {
  $b64 = ($pem -replace '-----BEGIN [^-]+-----','' -replace '-----END [^-]+-----','' -replace '\s','')
  $der = [Convert]::FromBase64String($b64)
  $pos = 0
  $seq = Read-Der $der ([ref]$pos)
  $p = $seq.Start
  $null = Read-Der $der ([ref]$p)   # version
  $null = Read-Der $der ([ref]$p)   # algorithm
  $pk = Read-Der $der ([ref]$p)     # OCTET STRING -> PKCS#1 RSAPrivateKey
  $rsaDer = [byte[]]$der[$pk.Start..($pk.Start + $pk.Len - 1)]
  $q = 0
  $rsaSeq = Read-Der $rsaDer ([ref]$q)
  $r = $rsaSeq.Start
  $vals = @()
  for ($i=0; $i -lt 9; $i++) {
    $el = Read-Der $rsaDer ([ref]$r)
    $vals += ,([byte[]]$rsaDer[$el.Start..($el.Start + $el.Len - 1)])
  }
  $rp = New-Object System.Security.Cryptography.RSAParameters
  $rp.Modulus  = Strip-Zeros $vals[1]
  $rp.Exponent = Strip-Zeros $vals[2]
  $rp.D        = Strip-Zeros $vals[3]
  $rp.P        = Strip-Zeros $vals[4]
  $rp.Q        = Strip-Zeros $vals[5]
  $rp.DP       = Strip-Zeros $vals[6]
  $rp.DQ       = Strip-Zeros $vals[7]
  $rp.InverseQ = Strip-Zeros $vals[8]
  $rsa = New-Object System.Security.Cryptography.RSACryptoServiceProvider
  $rsa.ImportParameters($rp)
  return $rsa
}

function New-GoogleSaAccessToken([string]$saPath, [System.Net.Http.HttpClient]$client) {
  $sa = [IO.File]::ReadAllText($saPath) | ConvertFrom-Json
  if (!$sa.client_email -or !$sa.private_key) { throw "invalid service account key: $saPath" }
  $rsa = Get-RsaFromPkcs8 $sa.private_key
  $epoch = [int64]((Get-Date).ToUniversalTime() - [datetime]'1970-01-01').TotalSeconds
  $header = '{"alg":"RS256","typ":"JWT"}'
  $claims = "{""iss"":""$($sa.client_email)"",""scope"":""https://www.googleapis.com/auth/chromewebstore"",""aud"":""https://oauth2.googleapis.com/token"",""iat"":$epoch,""exp"":$($epoch + 3600)}"
  $h2 = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($header))
  $c2 = ConvertTo-Base64Url ([Text.Encoding]::UTF8.GetBytes($claims))
  $toSign = "$h2.$c2"
  $sig = $rsa.SignData([Text.Encoding]::UTF8.GetBytes($toSign), [System.Security.Cryptography.SHA256]::Create())
  $jwt = "$toSign.$(ConvertTo-Base64Url $sig)"
  $formBody = "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=$([uri]::EscapeDataString($jwt))"
  $form = New-Object System.Net.Http.StringContent($formBody, [Text.Encoding]::UTF8, "application/x-www-form-urlencoded")
  $resp = $client.PostAsync("https://oauth2.googleapis.com/token", $form).GetAwaiter().GetResult()
  $tokBody = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  if (!$resp.IsSuccessStatusCode) { throw "JWT bearer service account -> $([int]$resp.StatusCode): $tokBody" }
  return ($tokBody | ConvertFrom-Json).access_token
}

function Get-CwsAccessToken([System.Net.Http.HttpClient]$client) {
  $saPath = Join-Path $codeRoot "CWS_SA.json"
  if (Test-Path $saPath) {
    Write-Host "  auth: service account (CWS_SA.json)"
    return New-GoogleSaAccessToken $saPath $client
  }
  if (!$cid -or !$csecret -or !$refresh) { throw "Neither CWS_SA.json nor an OAuth refresh_token is available" }
  Write-Host "  auth: refresh_token OAuth"
  $formBody = "client_id=$([uri]::EscapeDataString($cid))&client_secret=$([uri]::EscapeDataString($csecret))&refresh_token=$([uri]::EscapeDataString($refresh))&grant_type=refresh_token"
  $form = New-Object System.Net.Http.StringContent($formBody, [Text.Encoding]::UTF8, "application/x-www-form-urlencoded")
  $resp = $client.PostAsync("https://oauth2.googleapis.com/token", $form).GetAwaiter().GetResult()
  $tokBody = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  if (!$resp.IsSuccessStatusCode) { throw "OAuth token -> $([int]$resp.StatusCode): $tokBody" }
  return ($tokBody | ConvertFrom-Json).access_token
}

$http = New-Object System.Net.Http.HttpClient
$http.Timeout = [TimeSpan]::FromMinutes(10)

# ---------------- AMO / Firefox (unlisted signing) ----------------
if (!$SkipAmo) {
Write-Host "== AMO: unlisted signing v$ver =="
$jwtRaw = [IO.File]::ReadAllText((Join-Path $codeRoot "JWT_API.txt"))
$issuer = ([regex]::Match($jwtRaw, 'issuer\s*[:=]\s*(\S+)')).Groups[1].Value
$secret = ([regex]::Match($jwtRaw, 'secret\s*[:=]\s*(\S+)')).Groups[1].Value
if (!$issuer -or !$secret) { throw "JWT_API.txt: issuer/secret not found" }
# AMO caps the JWT lifetime (5 min), but signing a version and waiting for its
# processed status often takes longer. Mint a fresh token for every request.
function Get-AmoAuth { return "JWT $(New-AmoJwt $issuer $secret)" }

function Invoke-AmoGet([string]$url) {
  $r = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::Get, $url)
  $r.Headers.Add("Authorization", (Get-AmoAuth))
  $resp = $http.SendAsync($r).GetAwaiter().GetResult()
  $body = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
  if (!$resp.IsSuccessStatusCode) { throw "AMO GET $url -> $([int]$resp.StatusCode): $body" }
  return $body | ConvertFrom-Json
}

# 1) upload
$mp = New-Object System.Net.Http.MultipartFormDataContent
$bytes = [IO.File]::ReadAllBytes($xpi)
$bc = New-Object System.Net.Http.ByteArrayContent(, $bytes)
$bc.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/octet-stream")
$mp.Add($bc, "upload", "banablur-$ver.xpi")
$mp.Add((New-Object System.Net.Http.StringContent("unlisted")), "channel")
$req = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::Post, "https://addons.mozilla.org/api/v5/addons/upload/")
$req.Headers.Add("Authorization", (Get-AmoAuth))
$req.Content = $mp
$resp = $http.SendAsync($req).GetAwaiter().GetResult()
$upBody = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
if (!$resp.IsSuccessStatusCode) { throw "AMO upload -> $([int]$resp.StatusCode): $upBody" }
$up = $upBody | ConvertFrom-Json
$uuid = $up.uuid
Write-Host "  upload uuid: $uuid"

# 2) poll
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Seconds 3
  $st = Invoke-AmoGet "https://addons.mozilla.org/api/v5/addons/upload/$uuid/"
  if ($st.processed) {
    if (!$st.valid) { throw "AMO validation failed: $($st.validation | ConvertTo-Json -Depth 6)" }
    Write-Host "  validation OK"
    break
  }
}
if (!$st.processed) { throw "AMO: upload not processed (timeout)" }

# 3) create version (idempotent: if already created, we fetch the existing one)
$verUrl = "https://addons.mozilla.org/api/v5/addons/addon/$([uri]::EscapeDataString($addonId))/versions/"
$verPayload = @{ upload = $uuid } | ConvertTo-Json
$req = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::Post, $verUrl)
$req.Headers.Add("Authorization", (Get-AmoAuth))
$req.Content = New-Object System.Net.Http.StringContent($verPayload, [Text.Encoding]::UTF8, "application/json")
$resp = $http.SendAsync($req).GetAwaiter().GetResult()
$verBody = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
$vinfo = $null
if ($resp.IsSuccessStatusCode) {
  $vinfo = $verBody | ConvertFrom-Json
} elseif ($verBody -match 'already exists') {
  Write-Host "  version $ver already exists, fetching"
} else {
  throw "AMO create version -> $([int]$resp.StatusCode): $verBody"
}

$singleUrl = "https://addons.mozilla.org/api/v5/addons/addon/$([uri]::EscapeDataString($addonId))/versions/$ver/"
if (!$vinfo) { $vinfo = Invoke-AmoGet $singleUrl }
Write-Host "  version: $($vinfo.version) (file status: $($vinfo.file.status))"

# 4) wait for the (asynchronous) signing, then download
$fileUrl = $null
$st = $null
for ($i = 0; $i -lt 60; $i++) {
  $v = Invoke-AmoGet $singleUrl
  $st = $v.file.status
  if ($st -eq 'public' -or $st -eq 'signed') { $fileUrl = $v.file.url; break }
  if ($st -eq 'disabled' -or $st -eq 'rejected') { throw "AMO: file status $st" }
  Start-Sleep -Seconds 5
}
if (!$fileUrl) { throw "AMO: signed file not available (timeout), last status=$st" }
Write-Host "  signed file ready (status: $st)"

$signedXpi = Join-Path $signedDir "banablur-$ver-firefox-signed.xpi"
Write-Host "  signed url: $fileUrl"
$sb = $null
$lastCode = 0
for ($i = 0; $i -lt 20; $i++) {
  $req = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::Get, $fileUrl)
  $req.Headers.Add("Authorization", (Get-AmoAuth))
  $resp = $http.SendAsync($req).GetAwaiter().GetResult()
  if ($resp.IsSuccessStatusCode) {
    $sb = $resp.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
    break
  }
  $lastCode = [int]$resp.StatusCode
  Start-Sleep -Seconds 5
}
if (!$sb) { throw "AMO download signed -> $lastCode ($fileUrl)" }
[IO.File]::WriteAllBytes($signedXpi, $sb)
Write-Host "  signed XPI: $signedXpi ($($sb.Length) bytes)"

# 5) verify mozilla.rsa
$za = [System.IO.Compression.ZipFile]::OpenRead($signedXpi)
try {
  $hasRsa = ($za.Entries | Where-Object { $_.FullName -eq 'META-INF/mozilla.rsa' }).Count -gt 0
} finally { $za.Dispose() }
if (!$hasRsa) { throw "signed XPI without META-INF/mozilla.rsa" }
Write-Host "  META-INF/mozilla.rsa present"
} else {
  if (!(Test-Path $signedXpi)) { throw "-SkipAmo but signed XPI missing: $signedXpi" }
  Write-Host "== AMO: skipped (-SkipAmo), existing signed XPI =="
}

# ---------------- CWS / Chrome ----------------
Write-Host "== Chrome Web Store: upload v$ver =="
$cwsRaw = [IO.File]::ReadAllText((Join-Path $codeRoot "CWS_API.txt"))
$cid = ([regex]::Match($cwsRaw, 'client_id\s*[:=]\s*(\S+)')).Groups[1].Value
$csecret = ([regex]::Match($cwsRaw, 'client_secret\s*[:=]\s*(\S+)')).Groups[1].Value
$refresh = ([regex]::Match($cwsRaw, 'refresh_token\s*[:=]\s*(\S+)')).Groups[1].Value
$itemId = ([regex]::Match($cwsRaw, 'extension_id\s*[:=]?\s*([A-Za-z0-9]+)')).Groups[1].Value
$publisherId = ([regex]::Match($cwsRaw, 'publisher_id\s*[:=]?\s*([A-Za-z0-9-]+)')).Groups[1].Value
if (!$itemId -or !$publisherId) { throw "CWS_API.txt incomplete (extension_id / publisher_id)" }
Write-Host "  item: $itemId (publisher: $publisherId)"

# API v2 (documented) with v1.1 fallback if v2 is unavailable.
function Invoke-CwsUpload([string]$token, [byte[]]$bytes) {
  $urls = @()
  if ($publisherId) { $urls += "https://chromewebstore.googleapis.com/upload/v2/publishers/$publisherId/items/$itemId`:upload" }
  $urls += "https://www.googleapis.com/upload/chromewebstore/v1.1/items/$itemId?uploadType=media"
  $last = ""
  foreach ($u in $urls) {
    $m = if ($u -match '/v1\.1/') { [System.Net.Http.HttpMethod]::Put } else { [System.Net.Http.HttpMethod]::Post }
    $req = New-Object System.Net.Http.HttpRequestMessage($m, $u)
    $req.Headers.Add("Authorization", "Bearer $token")
    $req.Content = New-Object System.Net.Http.ByteArrayContent(, $bytes)
    $req.Content.Headers.ContentType = [System.Net.Http.Headers.MediaTypeHeaderValue]::Parse("application/zip")
    $resp = $http.SendAsync($req).GetAwaiter().GetResult()
    $body = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if ($resp.IsSuccessStatusCode) { return @{ ok = $true; url = $u; body = $body } }
    $last = "$([int]$resp.StatusCode) $body [$u]"
  }
  return @{ ok = $false; body = $last }
}

function Invoke-CwsPublish([string]$token) {
  $urls = @()
  if ($publisherId) { $urls += "https://chromewebstore.googleapis.com/v2/publishers/$publisherId/items/$itemId`:publish" }
  $urls += "https://www.googleapis.com/chromewebstore/v1.1/items/$itemId/publish"
  $last = ""
  foreach ($u in $urls) {
    $req = New-Object System.Net.Http.HttpRequestMessage([System.Net.Http.HttpMethod]::Post, $u)
    $req.Headers.Add("Authorization", "Bearer $token")
    $resp = $http.SendAsync($req).GetAwaiter().GetResult()
    $body = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    if ($resp.IsSuccessStatusCode) { return @{ ok = $true; url = $u; body = $body } }
    $last = "$([int]$resp.StatusCode) $body [$u]"
  }
  return @{ ok = $false; body = $last }
}

$tokenExpired = $false
try {
$at = Get-CwsAccessToken $http

$zipBytes = [IO.File]::ReadAllBytes($zip)
$up = Invoke-CwsUpload $at $zipBytes
if (!$up.ok) { throw "CWS upload -> $($up.body)" }
Write-Host "  upload ($($up.url)): $($up.body)"

$pub = Invoke-CwsPublish $at
if (!$pub.ok) { throw "CWS publish -> $($pub.body)" }
Write-Host "  publish ($($pub.url)): $($pub.body)"
} catch {
  $tokenExpired = $_.Exception.Message -match 'invalid_grant'
  Write-Host "  [CWS FAILED] $($_.Exception.Message)"
  if ($tokenExpired) {
    Write-Host "  -> Google refresh_token expired/revoked: regenerate CWS_API.txt (OAuth Playground / Cloud Console)."
  }
  Write-Host "  -> Desktop will still be updated with the Chrome zip."
}

# ---------------- Desktop ----------------
Write-Host "== Copy to the desktop =="
$deskXpi = Join-Path $desktop "Banablur-$ver-FIREFOX-SIGNE.xpi"
$deskZip = Join-Path $desktop "Banablur-$ver-CHROME.zip"
Copy-Item $signedXpi $deskXpi -Force
Copy-Item $zip $deskZip -Force
Write-Host "  $deskXpi"
Write-Host "  $deskZip"

Write-Host ""
Write-Host "DONE v$ver"
