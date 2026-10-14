# Amor Stories - local server for the bot rule editor (opened by bot-editoru.bat)
# Serves the project at http://localhost:<port>/ and writes the rules saved by
# tools/bot-editor.html into js/data/bot-rules.js (and bumps the sw.js version).
# Only reachable from this computer. Close the window (or Ctrl+C) to stop.
# (ASCII only, for Windows PowerShell 5.1.)

param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$dataFile = Join-Path $root 'js\data\bot-rules.js'
$swFile = Join-Path $root 'sw.js'
$utf8 = New-Object System.Text.UTF8Encoding($false)

$MIME = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'; '.css' = 'text/css; charset=utf-8'
  '.json' = 'application/json; charset=utf-8'; '.png' = 'image/png'; '.jpg' = 'image/jpeg'; '.jpeg' = 'image/jpeg'
  '.webp' = 'image/webp'; '.gif' = 'image/gif'; '.svg' = 'image/svg+xml'; '.ico' = 'image/x-icon'; '.md' = 'text/plain; charset=utf-8'
}

function Send($ctx, [int]$code, [string]$type, [byte[]]$bytes) {
  $res = $ctx.Response
  $res.StatusCode = $code
  $res.ContentType = $type
  $res.Headers['Cache-Control'] = 'no-store'
  $res.ContentLength64 = $bytes.Length
  $res.OutputStream.Write($bytes, 0, $bytes.Length)
  $res.OutputStream.Close()
}
function SendJson($ctx, [int]$code, [string]$json) { Send $ctx $code 'application/json; charset=utf-8' $utf8.GetBytes($json) }

function ReadRules {
  if (-not (Test-Path $dataFile)) { return '{"rules":[]}' }
  $txt = [IO.File]::ReadAllText($dataFile, $utf8)
  $m = [regex]::Match($txt, '(?s)Stories\.BOT_RULES\s*=\s*(.*?);\s*$')
  if ($m.Success) { return $m.Groups[1].Value }
  return '{"rules":[]}'
}

function BumpSw {
  $sw = [IO.File]::ReadAllText($swFile, $utf8)
  $m = [regex]::Match($sw, "amor-stories-v(\d+)")
  if (-not $m.Success) { return $null }
  $next = 'amor-stories-v' + ([int]$m.Groups[1].Value + 1)
  [IO.File]::WriteAllText($swFile, $sw.Replace($m.Value, $next), $utf8)
  return $next
}

function SaveRules($ctx) {
  $reader = New-Object IO.StreamReader($ctx.Request.InputStream, $utf8)
  $body = $reader.ReadToEnd()
  $reader.Close()
  try { $obj = $body | ConvertFrom-Json } catch { SendJson $ctx 400 '{"ok":false,"error":"invalid JSON"}'; return }
  if ($null -eq $obj -or $null -eq $obj.rules) { SendJson $ctx 400 '{"ok":false,"error":"rules missing"}'; return }
  if ((ReadRules).Trim() -eq $body.Trim()) { SendJson $ctx 200 '{"ok":true,"changed":false}'; return }
  $content = "/* bot-editoru.bat ile duzenlenir (tools/bot-editor.html). Bicim: js/bot.js'in basindaki aciklama. */`nwindow.Stories = window.Stories || {};`nStories.BOT_RULES = $body;`n"
  [IO.File]::WriteAllText($dataFile, $content, $utf8)
  $ver = BumpSw
  Write-Host ("  saved  " + (Get-Date -Format 'HH:mm:ss') + "  (sw: $ver)") -ForegroundColor Green
  SendJson $ctx 200 ('{"ok":true,"changed":true,"sw":"' + $ver + '"}')
}

function ServeFile($ctx, [string]$path) {
  if ($path -eq '/') { $path = '/index.html' }
  $full = [IO.Path]::GetFullPath((Join-Path $root ($path.TrimStart('/') -replace '/', '\')))
  if (-not $full.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path $full -PathType Leaf)) {
    SendJson $ctx 404 '{"error":"not found"}'; return
  }
  $type = $MIME[[IO.Path]::GetExtension($full).ToLower()]
  if (-not $type) { $type = 'application/octet-stream' }
  Send $ctx 200 $type ([IO.File]::ReadAllBytes($full))
}

# Find a free port
$listener = $null
foreach ($p in 8790..8810) {
  try {
    $l = New-Object System.Net.HttpListener
    $l.Prefixes.Add("http://localhost:$p/")
    $l.Start()
    $listener = $l; $port = $p; break
  } catch { }
}
if (-not $listener) { Write-Host 'No free port (8790-8810).' -ForegroundColor Red; exit 1 }

$editor = "http://localhost:$port/tools/bot-editor.html"
Write-Host ''
Write-Host '  Amor Stories - Bot editor' -ForegroundColor Magenta
Write-Host "  Editor:  $editor"
Write-Host "  App:     http://localhost:$port/"
Write-Host '  Close this window (or Ctrl+C) to stop.'
Write-Host ''
if (-not $NoBrowser) { Start-Process $editor }

try {
  while ($listener.IsListening) {
    $task = $listener.GetContextAsync()
    while (-not $task.AsyncWaitHandle.WaitOne(300)) { }
    $ctx = $task.GetAwaiter().GetResult()
    try {
      $path = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath)
      $method = $ctx.Request.HttpMethod
      if ($path -eq '/api/bot-rules' -and $method -eq 'GET') { SendJson $ctx 200 (ReadRules) }
      elseif ($path -eq '/api/bot-rules' -and $method -eq 'POST') { SaveRules $ctx }
      elseif ($method -eq 'GET') { ServeFile $ctx $path }
      else { SendJson $ctx 405 '{"error":"not supported"}' }
    } catch {
      Write-Host ("  error: " + $_.Exception.Message) -ForegroundColor Red
      try { SendJson $ctx 500 '{"ok":false,"error":"server error"}' } catch { }
    }
  }
} finally {
  $listener.Stop()
  $listener.Close()
}
