# Amor Stories - mod photo list generator
# Scans mods/<mod>/<character>/ folders and writes js/data/mod-photos.js
# (GitHub Pages cannot list folders.) Run after adding images:
#   powershell -ExecutionPolicy Bypass -File tools/build-mods.ps1
# File naming inside a character folder:
#   profil.* / profile.* / avatar.*   -> profile photo (avatar)
#   sahne.* / bg.* / arka-plan.*      -> chat background (also first album photo / cover)
#   anything else                     -> album (alphabetical)
# Mods whose files are listed by hand in js/data/mods.js (e.g. dontstop) have no subfolders and are skipped.
# (ASCII only, for Windows PowerShell 5.1.)

$root = Split-Path -Parent $PSScriptRoot
$modsDir = Join-Path $root 'mods'
$out = Join-Path $root 'js\data\mod-photos.js'
$q = { param($s) '"' + ($s -replace '\\', '\\' -replace '"', '\"') + '"' }
$img = '^\.(jpe?g|png|webp|gif)$'

$mods = @()
foreach ($mod in Get-ChildItem $modsDir -Directory | Sort-Object Name) {
  $chars = @()
  foreach ($ch in Get-ChildItem $mod.FullName -Directory | Sort-Object Name) {
    $files = Get-ChildItem $ch.FullName -File | Where-Object { $_.Extension -match $img } | Sort-Object Name
    $rel = { param($f) "mods/$($mod.Name)/$($ch.Name)/$($f.Name)" }
    $profile = $files | Where-Object { $_.BaseName -match '^(profil|profile|avatar)$' } | Select-Object -First 1
    $bg = $files | Where-Object { $_.BaseName -match '^(sahne|bg|arka-plan|background)$' } | Select-Object -First 1
    $others = $files | Where-Object { $_ -ne $profile -and $_ -ne $bg } | ForEach-Object { & $q (& $rel $_) }
    $p = if ($profile) { & $q (& $rel $profile) } else { '""' }
    $b = if ($bg) { & $q (& $rel $bg) } else { '""' }
    $chars += "    $(& $q $ch.Name): { profile: $p, bg: $b, photos: [$($others -join ', ')] }"
    Write-Output ("  {0}/{1}: {2} image(s)" -f $mod.Name, $ch.Name, $files.Count)
  }
  if ($chars.Count) { $mods += "  $(& $q $mod.Name): {`n$($chars -join ",`n")`n  }" }
}

$js = @"
/* Otomatik uretildi: tools/build-mods.ps1 (elle duzenleme) */
window.Stories = window.Stories || {};
Stories.MOD_PHOTOS = {
$($mods -join ",`n")
};
"@
[System.IO.File]::WriteAllText($out, $js, (New-Object System.Text.UTF8Encoding $false))
Write-Output "$($mods.Count) mod(s) -> $out"
