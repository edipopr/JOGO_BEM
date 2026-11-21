# Gera os ícones PNG do app (rosto do Guizinho) usando System.Drawing do Windows.
# Uso: powershell -ExecutionPolicy Bypass -File ferramentas\gerar_icones.ps1
Add-Type -AssemblyName System.Drawing
$pasta = Join-Path (Split-Path $PSScriptRoot -Parent) 'icones'
New-Item -ItemType Directory -Force $pasta | Out-Null

function Novo-Icone([int]$tam, [string]$nome) {
  $bmp = New-Object System.Drawing.Bitmap $tam, $tam
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $s = $tam / 512.0
  $ret = { param($x, $y, $w, $h) New-Object System.Drawing.RectangleF ($x * $s), ($y * $s), ($w * $s), ($h * $s) }

  # Fundo: céu em degradê (ocupa tudo, para ícones "maskable")
  $fundo = New-Object System.Drawing.Drawing2D.LinearGradientBrush (& $ret 0 0 512 512), ([System.Drawing.Color]::FromArgb(126, 200, 255)), ([System.Drawing.Color]::FromArgb(60, 150, 70)), 90
  $g.FillRectangle($fundo, 0, 0, $tam, $tam)

  $laranja = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 138, 31))
  $verde = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(76, 209, 55))
  $escuro = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(43, 43, 43))
  $branco = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)

  # Cabelo espetado
  foreach ($i in -2..2) {
    $cx = 256 + $i * 55; $topo = 95 + [math]::Abs($i) * 22
    $pts = @(
      (New-Object System.Drawing.PointF (($cx - 45) * $s), (200 * $s)),
      (New-Object System.Drawing.PointF ($cx * $s), ($topo * $s)),
      (New-Object System.Drawing.PointF (($cx + 45) * $s), (200 * $s)))
    $g.FillPolygon($laranja, $pts)
  }
  # Cabeça, máscara e olhos
  $g.FillEllipse($verde, (& $ret 116 150 280 280))
  $g.FillRectangle($escuro, (& $ret 106 245 300 70))
  $g.FillEllipse($branco, (& $ret 180 258 46 46))
  $g.FillEllipse($branco, (& $ret 286 258 46 46))
  # Sorriso
  $caneta = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(43, 43, 43)), (12 * $s)
  $caneta.StartCap = 'Round'; $caneta.EndCap = 'Round'
  $g.DrawArc($caneta, (& $ret 206 300 100 70), 20, 140)

  $bmp.Save((Join-Path $pasta $nome), [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

Novo-Icone 512 'icone-512.png'
Novo-Icone 192 'icone-192.png'
Novo-Icone 180 'apple-touch-icon.png'
Write-Host "Icones gerados em $pasta"
