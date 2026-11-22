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
- A contagem online (src/contagem.js) fica DESLIGADA em localhost — testes não contam.
- **Celular/tablet na mesma Wi-Fi:** usar o endereço amarelo mostrado na janela (ex.: http://192.168.x.x:8080). Na 1ª vez, rodar `liberar_celular.bat` (cria regra de firewall, porta 8080, só rede local; pede admin). A Wi-Fi do PC está como rede "Pública".
- **GitHub Pages:** https://edipopr.github.io/JOGO_BEM/ (repositório público desde 2026-11-21; atualiza sozinho a cada push na main).
- A máquina **não tem Node nem Python** instalados.

## Como testar (Claude consegue ver o jogo)
- Subir servidor em outra porta sem abrir navegador: `powershell -File servidor.ps1 -Porta 8099 -SemNavegador` (em background); parar depois matando o processo `powershell` com `servidor.ps1*8099` na linha de comando.
- Capturar tela com **Chrome headless** (o Edge headless não funciona aqui):
  `"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --no-first-run --enable-unsafe-swiftshader --user-data-dir=<scratchpad>\perfil-chrome --window-size=1000,600 --virtual-time-budget=4000 --screenshot=<scratchpad>\x.png "http://localhost:8099/ferramentas/teste.html?heroi=funBot&teleporte=0,6,-64&roteiro=%2BW,espera:1,Espaco,J,-W"`
- `ferramentas/teste.html`: abre o jogo, escolhe herói, teleporta e executa um roteiro (W:1 = segura W 1 s; +W/-W = segura/solta; Espaco; J; espera:1) avançando o jogo manualmente via `window.guizinhoDebug.passo(dt)` (o headless quase não gera quadros sozinho). Mostra posição/vida/derrotados embaixo e erros.
- `celular.ps1` guarda o perfil do Chrome em `%TEMP%guizinho-celular-<Porta>`: com perfil velho o service worker pode mostrar uma versão ANTIGA do jogo. Usar uma `-Porta` nova (ex.: 9341, 9342...) a cada foto ou apagar a pasta antes. Como o headless quase não gera quadros, avançar com `js:` chamando `guizinhoDebug.passo(1/30)` várias vezes antes da foto. O caractere `|` não pode aparecer dentro de um passo `js:`.
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
index.html            página (importmap, HUD + barra do chefão, telas: inicial, seleção, painel, vitória, derrota; controles de toque)
styles.css            estilos da interface
src/main.js           inicialização, estados (inicio/selecao/jogando/pausado/caindo/vitoria/derrota), menu, pausa, salvar/continuar, loop, HUD
src/entrada.js        teclado, mouse e toque (joystick virtual, botões Atacar/Pular)
src/camera.js         câmera em terceira pessoa (distancia, inclinacao, alturaAlvo)
src/personagens.js    PERSONAGENS: 6 heróis (atributos 1–5 do GDD, tipo de ataque, habilidade)
src/modelos.js        modelos low-poly dos heróis (pivôs: bracoE/D, pernaE/D, cabeca; piscam = olhos; maoD = mão que se solta no punho-foguete)
src/retratos.js       fotografa os modelos dos heróis para os cartões da seleção (uma vez por sessão)
src/jogador.js        jogador com o herói escolhido: movimento, pulo, nado (fase.agua), ataques (soco/onda/raio/projetil/bracada/foguete), vida, infecção, animação
src/habilidades.js    habilidades especiais (K / botão Poder): dash, ondaCores, campo, canhao, giro, ima — campo "habilidade" em PERSONAGENS
src/fisica.js         gravidade e colisão (cilindro × Box3); corpo.apoio = caixa em que pisa
src/inimigo.js        inimigos da floresta (gosma, saltitante, cuspidor) + GerenciadorInimigos (combate, pontos); {invocado:true} = criatura chamada por chefão (chefao.reserva)
src/inimigos/         comum.js (peças e movimentos), agua.js, laboratorio.js, pesadelo.js — cada tipo tem modelo(), agir(ini,dt,ctx), animar(ini,dt)
src/chefoes/efeitos.js  ataques prontos: Ondas, Quedas (aoCair), Brotos, Feixe, criarTontura
src/chefoes/base.js   base dos chefões (dormir, acordar, ciclo de ataques, cansado/vulnerável, purificar, barreira); entra no GerenciadorInimigos
src/chefoes/guardiao.js  Guardião da Floresta (fase 1)   src/chefoes/cristal.js  Monstro de Cristal (fase 2); ioro.js (3), caixa2.js (4), infeccao.js (5), rei.js (6, final)
src/salvamento.js     jogo salvo (Continuar) e recordes por fase (localStorage)
src/configuracoes.js  configurações (volumes, câmera, gráficos) salvas no aparelho; configuracoes.aoMudar(f)
src/estatisticas.js   painel do jogo: partidas/vitórias/derrotas/recordes salvos no aparelho (localStorage)
src/contagem.js       contagem ONLINE anônima (Firebase REST); endereço do banco em src/config-online.js (vazio = desligada)
painel.html           painel online (aparelhos, partidas por dia, heróis...); ?demo=1 = dados de exemplo; ver docs/CONTAGEM_ONLINE.md
src/projeteis.js      tiros do jogador (explodem em área) e dos inimigos
src/itens.js          cristais, corações, estrelas, checkpoints e portal de saída
src/particulas.js     efeitos de partículas
src/fases/construtor.js  ConstrutorFase: ilhas, blocos, plataformas móveis, trampolins, árvores, luz
src/fases/index.js       FASES (ordem do jogo); cada fase devolve { id, nome, caixas, inimigos, itens, checkpoints, avisos, portal, arena, barreira, criarChefao, musicaChefao, musicaEm }
src/fases/floresta.js    Fase 1: Floresta dos Amigos
src/fases/noite.js       Fase 2: Floresta à Noite (luzes de noite, lanterna, vagalumes)
src/fases/mar.js         Fase 3: Mar do Pesadelo (debaixo d'água)   laboratorio.js  Fase 4   pesadelo.js  Fase 5 (infecção)   castelo.js  Fase 6 (final)
src/pwa.js            service worker, atualização automática e botão "Instalar app"
src/audio.js          som: efeitos e trilha sintetizados (Web Audio); som.efeito(nome), som.musica(nome|null), mudo salvo
src/versao.js         versão exibida na tela inicial (trocada por ferramentas/nova_versao.sh)
sw.js                 service worker (cache offline) — ao criar arquivo novo, adicionar em ARQUIVOS e subir VERSAO
manifest.webmanifest  app instalável; ícones em icones/ (gerados por ferramentas/gerar_icones.ps1)
divulgacao/           cartoes.html → cartoes-guizinho.pdf (A4, 8 cartões com QR; gerar com ferramentas/gerar_cartoes.sh e o servidor local ligado)
ferramentas/          gerar_icones.ps1, teste.html, celular.ps1 (toque emulado), nova_versao.sh
docs/PROGRESSO.md     fases de desenvolvimento e onde paramos
```

## Convenções
- Colisão: corpo = cilindro (raio, altura) contra caixas alinhadas aos eixos (`THREE.Box3`) em `fase.caixas`. Origem nos pés; modelos olham para +Z.
- A fase anda no sentido **-Z**; o jogador começa olhando para -Z (angulo = π) com a câmera atrás (+Z).
- Equilíbrio: a TV Rambon (pulo 2 → ~1,7 m de altura, vel. 4,5) é o herói mais limitado; todo salto obrigatório deve ser possível com ela (degraus ≤ 1,2 m, vãos ≤ 2,5 m).
- Novos personagens: adicionar em `PERSONAGENS` (personagens.js) e em `NOMES` (painel.html); o cartão e o retrato aparecem sozinhos. Seleção: `#cartoes` (retrato + nome, 3 por linha) | `#palco` (espaço do herói 3D, enquadrado por `enquadrarVitrine` com `camera.setViewOffset`) | `#ficha` (dados do escolhido); em pé vira palco/ficha/cartões. Novos inimigos: `TIPOS` em inimigo.js. Novas fases: `src/fases/<nome>.js` usando ConstrutorFase + registrar em `src/fases/index.js` (e em sw.js). Novos chefões: subclasse de `ChefaoBase` com métodos `_ataque_<nome>`.
- Cada fase tem seu "mundo" (cena própria) montado uma vez em main.js (`carregarFase(id)`); o jogador muda de cena com `jogador.mudarCena`.
- Campos opcionais da fase: `agua` {gravidade, quedaMax, bracadas}, `correntes` (colunas que sobem), `infeccao: true`, `perigos(dt, jogador)` (lasers, poças, pêndulos), `limiteQueda`, `longe` (distância de visão; fases com névoa usam ~100 para ficar leve), `musicaChefao`.
- Construtor: `arenaChefao()` monta arena + muretas + barreira; `corrente`, `esteira`, `laser`, `poca`, `pendulo`, `casteloAoLonge`... Desempenho: manter ≲ 500 desenhos por quadro (teste.html mostra "desenhos").
- Teste.html extra: `giro`, `inclina`, `distancia` (câmera); ações `vida:99`, `pacifico` (some com inimigos), `luta:150` (bot que ataca o chefão cansado e mostra os estados), `vencer`, `menu`. Na URL, `+W` se escreve `%2BW`.
- Scripts .ps1 nesta máquina: rodar com `powershell -NoProfile -ExecutionPolicy Bypass -File ...` (sem isso dá erro de política de execução).
- Teste de fase: `ferramentas/teste.html?...&fase=noite` libera e escolhe a fase.
- Combate: `jogador.alvos()` lista os alvos da mira automática; um alvo com `bloquear()` (chefão) pode recusar dano. O portal fica fechado (`portal.abrir(false)`) até o chefão ser derrotado.
