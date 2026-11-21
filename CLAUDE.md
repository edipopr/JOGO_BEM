# Contexto do projeto — Guizinho: A Invasão do Pesadelo

Este arquivo é lido automaticamente pelo Claude no início de cada sessão.
**Antes de começar qualquer trabalho, leia [docs/PROGRESSO.md](docs/PROGRESSO.md)** — ele diz em que fase estamos e qual é o próximo passo.

## Regras do projeto
- **Idioma:** todo o jogo (textos, menus, HUD, diálogos) em **português brasileiro**. Nomes de variáveis/funções também em português quando natural.
- **Desenvolvimento por partes:** uma fase pequena por vez (ver PROGRESSO.md). Não adiantar fases futuras.
- **Git:** após cada parte concluída, commit com mensagem em português e `git push` para `origin main` (https://github.com/edipopr/JOGO_BEM.git).
- **Publicar versão nova (OBRIGATÓRIO antes de cada commit que muda o jogo):** rodar `sh ferramentas/nova_versao.sh` — troca a versão em `sw.js` e `src/versao.js`. Sem isso, celulares e apps instalados NÃO recebem a atualização. (Gancho automático do git foi bloqueado pelo modo de permissões; por isso é manual.)
- **Ao terminar uma sessão/fase:** atualizar `docs/PROGRESSO.md` (marcar o que foi feito, registrar "Onde paramos" e o próximo passo).
- Design completo do jogo: [Guizinho_Game_Design_Document.md](Guizinho_Game_Design_Document.md).

## Tecnologia (decidido em 2026-11-21)
- **Three.js r160** via CDN (importmap em `index.html`), JavaScript ES modules puro, **sem build, sem npm**.
- Motivo: mais simples de manter, roda direto no navegador (PC, celular, tablet), publica fácil no GitHub Pages. Substitui a proposta de Godot do GDD.
- Gráficos low-poly feitos com primitivas do Three.js (sem modelos externos por enquanto). Áudio futuro via Web Audio API (sons sintetizados, sem arquivos pesados).

## Como rodar localmente
- Dê dois cliques em `iniciar.bat` (usa `servidor.ps1`, servidor HTTP em PowerShell com TcpListener, escuta toda a rede) e abra http://localhost:8080
- **Celular/tablet na mesma Wi-Fi:** usar o endereço amarelo mostrado na janela (ex.: http://192.168.x.x:8080). Na 1ª vez, rodar `liberar_celular.bat` (cria regra de firewall, porta 8080, só rede local; pede admin). A Wi-Fi do PC está como rede "Pública".
- **GitHub Pages:** https://edipopr.github.io/JOGO_BEM/ (repositório público desde 2026-11-21; atualiza sozinho a cada push na main).
- A máquina **não tem Node nem Python** instalados.

## Como testar (Claude consegue ver o jogo)
- Subir servidor em outra porta sem abrir navegador: `powershell -File servidor.ps1 -Porta 8099 -SemNavegador` (em background); parar depois matando o processo `powershell` com `servidor.ps1*8099` na linha de comando.
- Capturar tela com **Chrome headless** (o Edge headless não funciona aqui):
  `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --no-first-run --enable-unsafe-swiftshader --user-data-dir=<scratchpad>\perfil-chrome --window-size=1000,600 --virtual-time-budget=4000 --screenshot=<scratchpad>\x.png "http://localhost:8099/ferramentas/teste.html?heroi=funBot&teleporte=0,6,-64&roteiro=%2BW,espera:1,Espaco,J,-W"`
- `ferramentas/teste.html`: abre o jogo, escolhe herói, teleporta e executa um roteiro (W:1 = segura W 1 s; +W/-W = segura/solta; Espaco; J; espera:1) avançando o jogo manualmente via `window.guizinhoDebug.passo(dt)` (o headless quase não gera quadros sozinho). Mostra posição/vida/derrotados embaixo e erros.
- O loop do jogo tem try/catch: erros aparecem numa faixa vermelha na tela (`#erro`).
- **Celular com toque de verdade:** `powershell -File ferramentas/celular.ps1 -Largura 390 -Altura 800 -Url http://localhost:8099/ -Saida <png> -Passos "toque:#btn-jogar|espera:1|toque:.cartao[data-id=tvRambon]|js:guizinhoDebug.jogador.id"` — emula Android (touch + mobile) via protocolo DevTools e mostra qual elemento recebeu cada toque.

## Celular
- O jogo é pensado para o celular **deitado**: manifest `orientation: landscape`; ao tocar em Jogar pede tela cheia + `screen.orientation.lock('landscape')`; em pé aparece o aviso `#girar` (com "Jogar assim mesmo"); em pé a câmera abre o FOV para 80°.

## Atualização no celular (PWA)
- GitHub Pages manda `Cache-Control: max-age=600`. Por isso o `sw.js` busca com `cache: 'no-cache'` (rede primeiro, 5 s de limite, senão cópia guardada) e instala com `cache: 'reload'`.
- `src/pwa.js`: registra com `updateViaCache: 'none'`, procura atualização ao voltar ao app e a cada 5 min; quando a versão nova assume (`controllerchange`) recarrega sozinho fora da partida, ou mostra o botão "Nova versão! Toque para atualizar".
- A versão aparece na tela inicial ("versão dd/mm/aaaa hh:mm") — peça ao usuário para conferir.

## Estrutura
```
index.html            página (importmap, HUD, telas: inicial, seleção, vitória, derrota; controles de toque)
styles.css            estilos da interface
src/main.js           inicialização, estados (inicio/selecao/jogando/caindo/vitoria/derrota), loop, HUD
src/entrada.js        teclado, mouse e toque (joystick virtual, botões Atacar/Pular)
src/camera.js         câmera em terceira pessoa (distancia, inclinacao, alturaAlvo)
src/personagens.js    PERSONAGENS: 4 heróis (atributos 1–5 do GDD, tipo de ataque, modelo low-poly)
src/jogador.js        jogador com o herói escolhido: movimento, pulo, ataques (soco/onda/raio/projetil), vida
src/fisica.js         gravidade e colisão (cilindro × Box3); corpo.apoio = caixa em que pisa
src/inimigo.js        inimigos (gosma, saltitante, cuspidor) + GerenciadorInimigos (combate, pontos)
src/projeteis.js      tiros do jogador (explodem em área) e dos inimigos
src/itens.js          cristais, corações, estrelas, checkpoints e portal de saída
src/particulas.js     efeitos de partículas
src/fases/construtor.js  ConstrutorFase: ilhas, blocos, plataformas móveis, trampolins, árvores, luz
src/fases/floresta.js    Floresta dos Amigos (layout, inimigos, itens, checkpoints, avisos, portal)
src/pwa.js            service worker, atualização automática e botão "Instalar app"
src/audio.js          som: efeitos e trilha sintetizados (Web Audio); som.efeito(nome), som.musica(nome|null), mudo salvo
src/versao.js         versão exibida na tela inicial (trocada por ferramentas/nova_versao.sh)
sw.js                 service worker (cache offline) — ao criar arquivo novo, adicionar em ARQUIVOS e subir VERSAO
manifest.webmanifest  app instalável; ícones em icones/ (gerados por ferramentas/gerar_icones.ps1)
ferramentas/          gerar_icones.ps1, teste.html, celular.ps1 (toque emulado), nova_versao.sh
docs/PROGRESSO.md     fases de desenvolvimento e onde paramos
```

## Convenções
- Colisão: corpo = cilindro (raio, altura) contra caixas alinhadas aos eixos (`THREE.Box3`) em `fase.caixas`. Origem nos pés; modelos olham para +Z.
- A fase anda no sentido **-Z**; o jogador começa olhando para -Z (angulo = π) com a câmera atrás (+Z).
- Equilíbrio: a TV Rambon (pulo 2 → ~1,7 m de altura, vel. 4,5) é o herói mais limitado; todo salto obrigatório deve ser possível com ela (degraus ≤ 1,2 m, vãos ≤ 2,5 m).
- Novos personagens: adicionar em `PERSONAGENS` (personagens.js). Novos inimigos: `TIPOS` em inimigo.js. Novas fases: `src/fases/<nome>.js` usando ConstrutorFase.
