@echo off
:: Libera a porta 8080 no Firewall do Windows SOMENTE para aparelhos da rede local
:: (celular/tablet no mesmo Wi-Fi). Precisa ser executado uma vez, como administrador.
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Pedindo permissao de administrador...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' -Verb RunAs"
  exit /b
)
powershell -NoProfile -Command ^
  "Remove-NetFirewallRule -DisplayName 'Guizinho - jogo na rede local' -ErrorAction SilentlyContinue;" ^
  "New-NetFirewallRule -DisplayName 'Guizinho - jogo na rede local' -Direction Inbound -Protocol TCP -LocalPort 8080 -RemoteAddress LocalSubnet -Action Allow -Profile Any | Out-Null"
echo.
echo Pronto! A porta 8080 foi liberada para aparelhos da sua rede Wi-Fi.
echo Agora abra o iniciar.bat e use no celular o endereco que aparecer em amarelo.
echo.
pause
