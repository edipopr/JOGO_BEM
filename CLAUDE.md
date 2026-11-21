# Contexto do projeto — Guizinho: A Invasão do Pesadelo

Este arquivo é lido automaticamente pelo Claude no início de cada sessão.
**Antes de começar qualquer trabalho, leia [docs/PROGRESSO.md](docs/PROGRESSO.md)** — ele diz em que fase estamos e qual é o próximo passo.

## Regras do projeto
- **Idioma:** todo o jogo (textos, menus, HUD, diálogos) em **português brasileiro**. Nomes de variáveis/funções também em português quando natural.
- **Desenvolvimento por partes:** uma fase pequena por vez (ver PROGRESSO.md). Não adiantar fases futuras.
- **Git:** após cada parte concluída, commit com mensagem em português e `git push` para `origin main` (https://github.com/edipopr/JOGO_BEM.git).
- **Ao terminar uma sessão/fase:** atualizar `docs/PROGRESSO.md` (marcar o que foi feito, registrar "Onde paramos" e o próximo passo).
- Design completo do jogo: [Guizinho_Game_Design_Document.md](Guizinho_Game_Design_Document.md).

## Tecnologia (decidido em 2026-11-21)
- **Three.js r160** via CDN (importmap em `index.html`), JavaScript ES modules puro, **sem build, sem npm**.
- Motivo: mais simples de manter, roda direto no navegador (PC, celular, tablet), publica fácil no GitHub Pages. Substitui a proposta de Godot do GDD.
- Gráficos low-poly feitos com primitivas do Three.js (sem modelos externos por enquanto). Áudio futuro via Web Audio API (sons sintetizados, sem arquivos pesados).

## Como rodar localmente
- Dê dois cliques em `iniciar.bat` (usa `servidor.ps1`, servidor HTTP em PowerShell) e abra http://localhost:8080
- A máquina **não tem Node nem Python** instalados.

## Estrutura
```
index.html        página do jogo (importmap, HUD, telas, controles de toque)
styles.css        estilos da interface
src/main.js       inicialização, loop do jogo, telas
src/entrada.js    teclado, mouse e controles de toque (joystick virtual)
src/jogador.js    modelo do Guizinho, movimento, pulo, ataque, vida
src/fisica.js     gravidade e colisão compartilhadas (jogador e inimigos)
src/inimigo.js    gosmas contaminadas (IA simples) + GerenciadorInimigos (combate)
src/particulas.js efeitos de partículas
src/camera.js     câmera em terceira pessoa
src/fase.js       cenário de teste (chão, plataformas, árvores)
docs/PROGRESSO.md fases de desenvolvimento e onde paramos
```

## Convenções de física
- Colisão simples: jogador = cilindro (raio 0,45, altura 1,6) contra caixas alinhadas aos eixos (`THREE.Box3`) listadas em `fase.caixas`.
- Origem do jogador nos pés; modelo olha para +Z.
