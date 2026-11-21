# Servidor HTTP local simples para testar o jogo (não precisa instalar nada).
param([int]$Porta = 8080)

$raiz = $PSScriptRoot
$tipos = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json'; '.png' = 'image/png'
  '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'; '.ogg' = 'audio/ogg'; '.mp3' = 'audio/mpeg'
  '.webmanifest' = 'application/manifest+json'; '.ico' = 'image/x-icon'
}

$ouvinte = New-Object System.Net.HttpListener
$ouvinte.Prefixes.Add("http://localhost:$Porta/")
$ouvinte.Start()
Write-Host "Jogo rodando em http://localhost:$Porta  (feche esta janela para parar)"
Start-Process "http://localhost:$Porta"

while ($ouvinte.IsListening) {
  $ctx = $ouvinte.GetContext()
  $caminho = [Uri]::UnescapeDataString($ctx.Request.Url.AbsolutePath.TrimStart('/'))
  if ($caminho -eq '') { $caminho = 'index.html' }
  $arquivo = [IO.Path]::GetFullPath((Join-Path $raiz $caminho))
  $resp = $ctx.Response
  if ($arquivo.StartsWith($raiz) -and (Test-Path $arquivo -PathType Leaf)) {
    $bytes = [IO.File]::ReadAllBytes($arquivo)
    $ext = [IO.Path]::GetExtension($arquivo).ToLower()
    $resp.ContentType = if ($tipos[$ext]) { $tipos[$ext] } else { 'application/octet-stream' }
    $resp.Headers.Add('Cache-Control', 'no-store')
    $resp.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $resp.StatusCode = 404
  }
  $resp.Close()
}
