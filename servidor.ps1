# Servidor HTTP local simples para testar o jogo (não precisa instalar nada).
# Aceita conexões deste computador e de aparelhos na mesma rede Wi-Fi (celular/tablet).
param([int]$Porta = 8080, [switch]$SemNavegador)

$raiz = [IO.Path]::GetFullPath($PSScriptRoot)
$tipos = @{
  '.html' = 'text/html; charset=utf-8'; '.js' = 'text/javascript; charset=utf-8'
  '.css' = 'text/css; charset=utf-8'; '.json' = 'application/json'; '.png' = 'image/png'
  '.jpg' = 'image/jpeg'; '.svg' = 'image/svg+xml'; '.ogg' = 'audio/ogg'; '.mp3' = 'audio/mpeg'
  '.webmanifest' = 'application/manifest+json'; '.ico' = 'image/x-icon'; '.md' = 'text/plain; charset=utf-8'
}

$ouvinte = New-Object System.Net.Sockets.TcpListener([System.Net.IPAddress]::IPv6Any, $Porta)
$ouvinte.Server.DualMode = $true # aceita IPv4 e IPv6
try { $ouvinte.Start() } catch {
  Write-Host "Nao foi possivel usar a porta $Porta. Talvez o jogo ja esteja aberto em outra janela." -ForegroundColor Red
  Read-Host "Pressione Enter para sair"; exit 1
}

Write-Host ""
Write-Host "  GUIZINHO - servidor do jogo ligado!" -ForegroundColor Green
Write-Host ""
Write-Host "  Neste computador:  http://localhost:$Porta"
$ips = Get-NetIPConfiguration | Where-Object { $_.IPv4DefaultGateway -and $_.NetAdapter.Status -eq 'Up' } |
  ForEach-Object { $_.IPv4Address.IPAddress }
foreach ($ip in $ips) { Write-Host "  No celular/tablet: http://${ip}:$Porta   (mesma rede Wi-Fi)" -ForegroundColor Yellow }
Write-Host ""
Write-Host "  Se o celular nao abrir, execute uma vez 'liberar_celular.bat'."
Write-Host "  Feche esta janela para desligar o servidor."
if (-not $SemNavegador) { Start-Process "http://localhost:$Porta" }

$utf8 = New-Object System.Text.UTF8Encoding($false)
while ($true) {
  $cliente = $ouvinte.AcceptTcpClient()
  try {
    $cliente.ReceiveTimeout = 5000
    $fluxo = $cliente.GetStream()
    $leitor = New-Object System.IO.StreamReader($fluxo, [System.Text.Encoding]::ASCII, $false, 4096, $true)
    $linha = $leitor.ReadLine()
    while ($true) { $h = $leitor.ReadLine(); if ($null -eq $h -or $h -eq '') { break } }
    if (-not $linha) { continue }

    $caminho = ($linha -split ' ')[1]
    if ($caminho) { $caminho = [Uri]::UnescapeDataString(($caminho -split '\?')[0].TrimStart('/')) }
    if (-not $caminho) { $caminho = 'index.html' }
    $arquivo = [IO.Path]::GetFullPath((Join-Path $raiz $caminho))

    if ($arquivo.StartsWith($raiz) -and (Test-Path $arquivo -PathType Leaf)) {
      $corpo = [IO.File]::ReadAllBytes($arquivo)
      $ext = [IO.Path]::GetExtension($arquivo).ToLower()
      $tipo = if ($tipos[$ext]) { $tipos[$ext] } else { 'application/octet-stream' }
      $status = '200 OK'
    } else {
      $corpo = $utf8.GetBytes('Arquivo nao encontrado')
      $tipo = 'text/plain; charset=utf-8'
      $status = '404 Not Found'
    }
    $cabecalho = "HTTP/1.1 $status`r`nContent-Type: $tipo`r`nContent-Length: $($corpo.Length)`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
    $bytes = $utf8.GetBytes($cabecalho)
    $fluxo.Write($bytes, 0, $bytes.Length)
    $fluxo.Write($corpo, 0, $corpo.Length)
    $fluxo.Flush()
  } catch {
    # conexão interrompida pelo navegador: ignora
  } finally {
    $cliente.Close()
  }
}
