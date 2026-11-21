# Simula um CELULAR (tela de toque) no Chrome headless e executa toques no jogo.
# Uso: powershell -File ferramentas\celular.ps1 -Url http://localhost:8099/ -Saida tela.png `
#        -Passos "toque:#btn-jogar|espera:1|toque:.cartao[data-id=tvRambon]|js:guizinhoDebug.jogador.id"
# Passos: toque:<seletor CSS> | espera:<segundos> | js:<expressão> (mostra o resultado) | foto:<arquivo.png>
param(
  [string]$Url = 'http://localhost:8099/',
  [string]$Passos = "",
  [string]$Saida = '',
  [int]$Largura = 844, [int]$Altura = 390,
  [int]$Porta = 9333
)
$ErrorActionPreference = 'Stop'
$chrome = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
$perfil = Join-Path $env:TEMP "guizinho-celular-$Porta"
$proc = Start-Process $chrome -PassThru -ArgumentList @(
  '--headless=new', '--no-first-run', '--enable-unsafe-swiftshader', "--remote-debugging-port=$Porta",
  "--user-data-dir=$perfil", "--window-size=$Largura,$Altura", 'about:blank')
try {
  $alvo = $null
  for ($i = 0; $i -lt 40 -and -not $alvo; $i++) {
    Start-Sleep -Milliseconds 250
    try { $alvo = (Invoke-RestMethod "http://localhost:$Porta/json") | Where-Object { $_.type -eq 'page' } | Select-Object -First 1 } catch {}
  }
  $ws = New-Object System.Net.WebSockets.ClientWebSocket
  $ws.Options.KeepAliveInterval = [TimeSpan]::FromSeconds(30)
  $ws.ConnectAsync([Uri]$alvo.webSocketDebuggerUrl, [Threading.CancellationToken]::None).Wait()
  $script:id = 0

  function Enviar([string]$metodo, $params = @{}) {
    $script:id++
    $json = @{ id = $script:id; method = $metodo; params = $params } | ConvertTo-Json -Depth 10 -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($json)
    $ws.SendAsync([ArraySegment[byte]]$bytes, 'Text', $true, [Threading.CancellationToken]::None).Wait()
    while ($true) {
      $buf = New-Object byte[] 1048576; $ms = New-Object IO.MemoryStream
      do {
        $r = $ws.ReceiveAsync([ArraySegment[byte]]$buf, [Threading.CancellationToken]::None).Result
        $ms.Write($buf, 0, $r.Count)
      } while (-not $r.EndOfMessage)
      $msg = [Text.Encoding]::UTF8.GetString($ms.ToArray()) | ConvertFrom-Json
      if ($msg.id -eq $script:id) { return $msg }
    }
  }
  function Avaliar([string]$expr) {
    $r = Enviar 'Runtime.evaluate' @{ expression = $expr; returnByValue = $true }
    if ($r.result.exceptionDetails) { return "EXCECAO: $($r.result.exceptionDetails.exception.description)" }
    return $r.result.result.value
  }
  function Foto([string]$arquivo) {
    $r = Enviar 'Page.captureScreenshot' @{ format = 'png' }
    [IO.File]::WriteAllBytes($arquivo, [Convert]::FromBase64String($r.result.data))
    Write-Host "foto: $arquivo"
  }

  $null = Enviar 'Emulation.setDeviceMetricsOverride' @{ width = $Largura; height = $Altura; deviceScaleFactor = 1; mobile = $true }
  $null = Enviar 'Emulation.setTouchEmulationEnabled' @{ enabled = $true; maxTouchPoints = 5 }
  $null = Enviar 'Emulation.setUserAgentOverride' @{ userAgent = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36' }
  $null = Enviar 'Page.enable'
  $null = Enviar 'Page.navigate' @{ url = $Url }
  Start-Sleep -Seconds 4
  Write-Host "ehToque = $(Avaliar 'matchMedia(""(pointer: coarse)"").matches')"

  foreach ($passo in ($Passos -split '\|' | Where-Object { $_ })) {
    $tipo, $valor = $passo -split ':', 2
    switch ($tipo) {
      'espera' { Start-Sleep -Milliseconds ([double]$valor * 1000) }
      'js' { Write-Host "js $valor => $(Avaliar $valor)" }
      'foto' { Foto $valor }
      'toque' {
        $sel = $valor.Replace("'", "\'")
        $pos = Avaliar "(() => { const e = document.querySelector('$sel'); if (!e) return null; const r = e.getBoundingClientRect(); return JSON.stringify({ x: r.x + r.width / 2, y: r.y + r.height / 2, visivel: r.width > 0 }); })()"
        if (-not $pos -or "$pos".StartsWith("EXCECAO")) { Write-Host "toque $valor => $pos"; continue }
        $p = $pos | ConvertFrom-Json
        $quem = Avaliar "(() => { const e = document.elementFromPoint($($p.x), $($p.y)); return e ? (e.id || e.className || e.tagName) : 'nada'; })()"
        $null = Enviar 'Input.dispatchTouchEvent' @{ type = 'touchStart'; touchPoints = @(@{ x = $p.x; y = $p.y }) }
        Start-Sleep -Milliseconds 80
        $null = Enviar 'Input.dispatchTouchEvent' @{ type = 'touchEnd'; touchPoints = @() }
        Write-Host "toque $valor em ($([int]$p.x),$([int]$p.y)) -> elemento no ponto: $quem"
      }
    }
  }
  if ($Saida) { Foto $Saida }
} finally {
  if ($ws) { $ws.Dispose() }
  Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
  Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | Where-Object { $_.CommandLine -like "*guizinho-celular-$Porta*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}
