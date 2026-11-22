#!/bin/sh
# Gera divulgacao/cartoes-guizinho.pdf (A4, 8 cartões com QR Code) a partir de divulgacao/cartoes.html.
# Antes, deixe o servidor local ligado:  powershell -NoProfile -ExecutionPolicy Bypass -File servidor.ps1 -Porta 8099 -SemNavegador
# Uso (na pasta do projeto):  sh ferramentas/gerar_cartoes.sh [porta]
cd "$(dirname "$0")/.." || exit 1
SAIDA="$(cygpath -w "$PWD/divulgacao/cartoes-guizinho.pdf")"
PERFIL="$(cygpath -w "${TEMP:-/tmp}/guizinho-cartoes")"
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --no-first-run --enable-unsafe-swiftshader \
  --user-data-dir="$PERFIL" --virtual-time-budget=30000 --no-pdf-header-footer \
  --print-to-pdf="$SAIDA" "http://localhost:${1:-8099}/divulgacao/cartoes.html"
