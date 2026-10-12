# Amor Stories - photo set list generator
# GitHub Pages cannot list folders, so the files in characters/<set>/ (or characters/<set>/photos/)
# are written into js/data/photos.js. Run from the project root after adding folders/photos:
#   powershell -ExecutionPolicy Bypass -File tools/build-photos.ps1
# (ASCII only, for Windows PowerShell 5.1.)

$root = Split-Path -Parent $PSScriptRoot
$charDir = Join-Path $root 'characters'
$out = Join-Path $root 'js\data\photos.js'
$q = { param($s) '"' + ($s -replace '\\', '\\' -replace '"', '\"') + '"' }

$sets = @()
Get-ChildItem $charDir -Directory | Sort-Object Name | ForEach-Object {
  $photoDir = Join-Path $_.FullName 'photos'
  $sub = 'photos/'
  if (-not (Test-Path $photoDir)) { $photoDir = $_.FullName; $sub = '' }
  $files = Get-ChildItem $photoDir -File | Where-Object { $_.Extension -match '^\.(jpe?g|png|webp)$' } | Sort-Object Name
  if (-not $files) { return }
  # profile photo: name contains "profile", otherwise the first file
  $profile = ($files | Where-Object { $_.Name -match 'profile' } | Select-Object -First 1)
  if (-not $profile) { $profile = $files[0] }
  $others = $files | Where-Object { $_.Name -ne $profile.Name } | ForEach-Object { & $q $_.Name }
  $sets += "  { id: $(& $q $_.Name), dir: `"$sub`", profile: $(& $q $profile.Name), photos: [$($others -join ', ')] }"
}

$js = @"
/* Otomatik uretildi: tools/build-photos.ps1 (elle duzenleme) */
window.Stories = window.Stories || {};
Stories.PHOTO_SETS = [
$($sets -join ",`n")
];
"@
[System.IO.File]::WriteAllText($out, $js, (New-Object System.Text.UTF8Encoding $false))
Write-Output "$($sets.Count) photo sets -> $out"
