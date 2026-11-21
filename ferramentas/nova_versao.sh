#!/bin/sh
# Rodar ANTES de cada commit que muda o jogo: troca a versão do jogo.
# Assim o service worker muda e celulares/apps instalados baixam a versão nova sozinhos.
# Uso (na pasta do projeto):  sh ferramentas/nova_versao.sh
cd "$(dirname "$0")/.." || exit 1
V=$(date +%Y-%m-%d-%H%M%S)
VL=$(date "+%d/%m/%Y %H:%M")
sed -i "s/^const VERSAO = 'guizinho-[^']*';/const VERSAO = 'guizinho-$V';/" sw.js
sed -i "s|^export const VERSAO = '[^']*';|export const VERSAO = '$VL';|" src/versao.js
echo "Versão do jogo: $VL"
