# Progresso do desenvolvimento

## Onde paramos
- **Última atualização:** 2026-11-22
- **Fase atual:** Fases 8 e 9 concluídas (menos Planeta Guizinho). O jogo tem **6 fases, 6 chefões e 6 heróis** e um final.
- **Jogo online:** https://edipopr.github.io/JOGO_BEM/ (versão aparece na tela inicial)
- **Já aprovado pelo usuário (2026-11-22):** Guardião e Monstro de Cristal, Floresta à Noite, mira automática, botão "Jogar de novo", volume e sons.
- **Aguardando retorno do usuário:**
  - **Nina** (heroína nova; nome provisório): velocidade 5, força 2, pulo 4; punho-foguete (`ATAQUES.foguete` em `src/jogador.js`), superímã (`ima` em `src/habilidades.js`)
  - Nova tela de seleção (retratos + ficha)
  - Cartões de divulgação (PDF) ainda dizem "5 heróis" e não têm a Nina
  - Irmão do Guizinho (força, velocidade, giro) — `src/personagens.js`, `ATAQUES.bracada` em `src/jogador.js`
  - Mar do Pesadelo: nado (3 braçadas; `agua` em `src/fases/mar.js`), dificuldade dos monstros de água e do Ioro (15 de vida, 5 por cansaço)
  - Laboratório, Floresta do Pesadelo, Castelo: dificuldade dos chefões (Caixa 2 = 15, Guardião da Infecção = 15, Rei = 20; 5 por cansaço)
  - Infecção: 20 por golpe, ~26–32/s nas poças, controles invertidos 4 s (`TEMPO_INFECTADO` em `src/jogador.js`)
  - Desempenho no celular nas fases novas; músicas e sons novos (Claude não consegue ouvir)
  - **Decidir:** Planeta Guizinho (do GDD) ainda não existe; o chefão dele (Monstro de Cristal) já foi usado na fase 2. Vira fase extra? Com qual chefão?
- **Próximo passo:** ajustes pedidos pelo usuário; depois Planeta Guizinho, diálogos/história, ou Fase 10 (multiplayer local).
- **Antes de cada commit que muda o jogo:** `sh ferramentas/nova_versao.sh`
## Fases

### Fase 1 — Base jogável ✅
- [x] Estrutura do projeto (Three.js sem build)
- [x] Tela inicial em português
- [x] Cenário de teste (chão, plataformas, escadas, árvores, cogumelos)
- [x] Guizinho provisório (low-poly com primitivas)
- [x] Movimento WASD/setas, corrida (Shift), pulo (Espaço)
- [x] Câmera em terceira pessoa (arrastar mouse/dedo para girar)
- [x] Colisão com plataformas e paredes
- [x] Controles de toque (joystick virtual + botão pular)
- [x] Renascer ao cair no vazio
- [x] Servidor local (`iniciar.bat`)
- [x] Acesso pelo celular na rede Wi-Fi (`liberar_celular.bat`)

### Fase 2 — Combate básico ✅
- [x] Ataque (soco energético) — tecla J / botão Atacar na tela
- [x] Inimigo simples: gosma roxa contaminada que vaga e persegue (2 golpes para derrotar, renasce após 8 s)
- [x] Sistema de vida (3 corações), dano com empurrão e piscada de invencibilidade
- [x] Cair no vazio tira 1 coração; derrota provisória reinicia com vida cheia
- [x] Inimigo derrotado com efeito de partículas
- [x] HUD com corações

### Fase 3 — Itens e objetivos ✅
- [x] 21 cristais coletáveis + contador no placar (10 pts cada)
- [x] Coração (cura 1, só pega se estiver ferido) e 3 estrelas escondidas (100 pts cada)
- [x] 2 checkpoints (bandeira cinza → laranja); renascer no último checkpoint
- [x] Portal de saída na ilhinha → tela de vitória com 3 metas (fase, todos os cristais, todas as estrelas), tempo e pontos
- [x] Tela de derrota: "Tentar de novo" (último checkpoint) ou "Recomeçar a fase"
- [x] Gosma derrotada vale 50 pts

### Fase 4 — Floresta dos Amigos (fase 1 completa) ✅
- [x] Layout (sentido -Z): Clareira → Trilha dos Cogumelos → Planalto (y 6) → Plataformas móveis → Bosque Escuro → Subida → Arena do Guardião (y 12)
- [x] Três tipos de inimigos: gosma (persegue, 2 vida), saltitante (pula em você, 1 vida), cuspidor (cogumelo parado que atira, 3 vida)
- [x] 3 plataformas móveis (carregam o jogador), cogumelos-trampolim, pedras
- [x] 27 cristais, 3 estrelas escondidas (clareira, nuvem do trampolim secreto, canto do bosque), 3 corações, 3 checkpoints
- [x] Avisos de tutorial que aparecem uma vez ao passar perto
- [x] Arena com pilares e portal de saída (chefão vem na Fase 5)
- [x] Construtor de fases reutilizável (`src/fases/construtor.js`)

### Fase 5 — Chefão: Guardião da Floresta ✅
- [x] Ataques: golpe no chão (onda de choque — pular), investida (sair da frente), bolas de energia em leque
- [x] Após os 3 ataques fica cansado (núcleo amarelo, estrelinhas): só aí leva dano, máx. 3 por vez; 9 de vida = 3 ciclos; fica mais rápido a cada ciclo
- [x] Barra de vida do chefão no HUD; música e sons próprios; dicas na 1ª vez de cada ataque
- [x] Golpes fora da hora são bloqueados ("tink"); raízes fecham a entrada da arena durante a luta; muretas na beirada
- [x] Derrotado: é purificado (copa verde), +500 pts, e o portal de saída aparece
- [x] "Tentar de novo" faz o chefão voltar a dormir com vida cheia

### Ajustes pedidos (2026-11-21)
- [x] 5 corações
- [x] Mira automática (vira para o inimigo mais próximo à frente; projétil mira também na altura) e áreas de golpe maiores
- [x] Tela de vitória/derrota cabe no celular deitado (botões visíveis; rola se faltar espaço)
- [x] Painel do jogo (botão 📊 na tela inicial): partidas, vitórias, derrotas, tempo, recordes, partidas por herói, últimas 10 — salvo no aparelho
- [x] Contagem online anônima (Firebase) + painel online em `painel.html` (aparelhos, partidas por dia, quem voltou a jogar, heróis, últimas partidas) — ligada em 2026-11-21 (projeto Firebase guizinho-3685f)

### Fase 6 — Menus, áudio e salvamento ✅
- [x] Menu principal: Continuar (mostra fase, checkpoint, cristais, estrelas e tempo), Novo jogo (pergunta antes de substituir o jogo salvo), Personagens, Configurações, Painel; linha de recordes da fase
- [x] Pausa: Esc/P ou botão ⏸; pausa sozinha quando o app vai para segundo plano; Continuar, Configurações, Recomeçar a fase, Sair para o menu
- [x] Música e efeitos sonoros (Web Audio) — adiantado
- [x] Salvamento local (`src/salvamento.js`): checkpoints, itens coletados, pontos, tempo, chefão derrotado; salva em checkpoint, coleta, pausa, derrota, saída e segundo plano; vitória apaga o jogo salvo e grava recordes ("Novo recorde!" na vitória)
- [x] Configurações (`src/configuracoes.js`): volume da música e dos efeitos, giro da câmera, inverter câmera, gráficos Leve/Médio/Bonito (sombras e nitidez; celular começa no Médio), apagar progresso
- [x] Botão 🏠 Menu nas telas de vitória e derrota
- [x] Contagem online desligada em `localhost` (testes não sujam os números)

### Extras feitos fora de ordem (pedidos do usuário)
- [x] Áudio (adiantado da Fase 6): trilha sintetizada (menu, floresta, bosque) e efeitos (pulo, trampolim, 4 ataques, explosão, acerto, inimigo derrotado, cuspe, dano, cristal, estrela, coração, checkpoint, botão, vitória, derrota); botão 🔊/🔇
- [x] Orientação: aviso "Gire o celular", app instalado abre deitado, trava na horizontal ao jogar

### Fase 7 — Publicação da demo
- [x] GitHub Pages (adiantado): https://edipopr.github.io/JOGO_BEM/
- [x] PWA (adiantado): manifest, ícones, service worker (offline), botão "Instalar app" e dica para iPhone
- [ ] Testes em navegadores, celular e tablet

### Fase 8 — Personagens
- [x] (adiantado) TV Rambon, Experimento Caixa, Mr. Fun BOT jogáveis, com atributos do GDD (velocidade/força/pulo)
- [x] (adiantado) Ataque próprio de cada um: soco (Guizinho), explosão de luz em área (TV), raio de longo alcance (Caixa), projétil explosivo (BOT)
- [x] (adiantado) Tela de seleção com cartões, barras de atributos e o herói em 3D; escolha salva no aparelho; "Trocar herói" na vitória/derrota
- [x] Habilidades especiais (tecla K / botão "Poder", `src/habilidades.js`): dash de energia (2,5 s; protegido, atropela inimigos), onda de cores (6 s; acerta em volta, deixa tontos, apaga tiros), campo tecnológico (escudo 4 s; recarga 9 s), tiro de canhão (4 s; dano 3, explosão grande, mira de 18 m). Barra de carga no PC e botão com carga no celular
- [x] Modelos e animações mais caprichados (`src/modelos.js`): pernas que andam, braços com pivô no ombro, olhos que piscam, respiração, inclinação ao correr, "amassa" ao cair, pose de nado
- [x] **Novo herói (pedido do usuário): Irmão do Guizinho** — roxo e branco, braços gigantes; ataque "Pancada gigante" (bracada), poder "Giro gigante" (protegido, acerta em volta)
- [x] Tela de seleção com 5 cartões (herói visível acima deles) e 6 fases
- [x] **Nova heroína (pedido do usuário): Nina** — menina de cabelão castanho, óculos e braço robótico; ataque "Punho-foguete" (vai e volta, ~6 m), poder "Superímã" (protegida, puxa inimigos e solta um choque)
- [x] Seleção refeita para caber todos: cartões pequenos com retrato 3D, herói grande no palco e ficha só do escolhido (testada de 360×640 a 1366×768)

### Fase 9 — Demais fases e vilões
- [x] (adiantado, pedido do usuário) **Fase 2: Floresta à Noite** (`src/fases/noite.js`): clareira enluarada, pedras flutuantes, Bosque dos Vagalumes, cogumelo-elevador, Planalto dos Cristais (trampolim secreto), Lago Escuro, Bosque Sombrio, Arena de Cristal; lanterna no herói, lua, vagalumes, cogumelos brilhantes; 27 cristais, 3 estrelas, 4 corações, 4 checkpoints; música "noite"
- [x] **Chefão Monstro de Cristal** (`src/chefoes/cristal.js`): chuva de cristais (círculos de aviso), linhas de espinhos (3 em leque depois do 1º cansaço), anéis de estilhaços; 12 de vida, 4 golpes por cansaço; música própria
- [x] Chefões com base comum (`src/chefoes/base.js`); Guardião em `src/chefoes/guardiao.js`
- [x] Várias fases: `src/fases/index.js` (FASES); escolha da fase na seleção (a 2 libera ao vencer a 1); "Próxima fase ▶" na vitória; jogo salvo e recordes por fase; contagem online registra a fase
- [x] Correção: o modelo do chefão aparecia no início da fase (posição 0,0,0) antes da luta
- [x] **Fase 3: Mar do Pesadelo** (`mar.js`, pedido do usuário): debaixo d'água escura, castelo ao fundo crescendo; nado (gravidade menor + 3 braçadas), coluna de bolhas; peixe-lanterna, água-viva elétrica, caranguejo, baiacu; navio naufragado, ruínas
- [x] **Chefão Ioro** (`ioro.js`): pancada de 4 mãos, bolas explosivas, giro dos 4 braços, corrida que ricocheteia; no picadeiro afundado (substitui o "Circo do Ioro" do GDD)
- [x] **Fase 4: Laboratório Perdido** (`laboratorio.js`): lasers, esteiras, ventilador, ácido; drone, caixinha disfarçada, robô-tanque. **Chefão Experimento Caixa 2** (`caixa2.js`): mordida, raio giratório, invoca caixinhas, chuva de caixas
- [x] **Fase 5: Floresta do Pesadelo** (`pesadelo.js`): poças de infecção, sombra, olho voador, espinhoso, tentáculo. **Chefão Guardião da Infecção** (`infeccao.js`): salto esmagador, tentáculos, poças, enxame
- [x] **Fase 6: Castelo do Pesadelo** (`castelo.js`): cavaleiros, pêndulos, torres flutuantes. **Chefão final Rei do Pesadelo** (`rei.js`): mergulho pelo chão, tentáculos em estrela, olhar (raios), chuva de gosma, exército; núcleo exposto; tela final "Você salvou o universo!"
- [x] Sistema de infecção (barra ☣ no HUD, véu roxo, controles invertidos 4 s ao chegar a 100%, antivírus)
- [ ] Planeta Guizinho (decidir o chefão)
- [ ] História/diálogos entre as fases

### Fase 10 — Multiplayer local
### Fase 11 — Multiplayer online

## Histórico
- **2026-11-21:** GDD lido; repositório criado; tecnologia definida (Three.js); Fase 1 implementada.
- **2026-11-21:** Fase 2 implementada (combate, inimigos, vida, partículas; física movida para src/fisica.js).
- **2026-11-21:** Servidor reescrito para aceitar a rede local (celular); GitHub Pages pendente (repo privado).
- **2026-11-21:** Repositório tornado público e GitHub Pages ativado.
- **2026-11-21:** Web app instalável (PWA) e Fase 3 implementada (itens, checkpoints, portal, telas de vitória/derrota).
- **2026-11-21:** Fase 4 (Floresta dos Amigos, 3 tipos de inimigos, plataformas móveis, trampolins) + 4 heróis jogáveis com tela de seleção. Testes automáticos com Chrome headless (ferramentas/teste.html).
- **2026-11-21:** Correção da atualização no celular (cache do GitHub Pages + app aberto em segundo plano): versão visível, atualização automática, ferramentas/nova_versao.sh. Troca de herói testada com toque emulado (funciona; problema era versão misturada no cache).
- **2026-11-21:** Trilha sonora e efeitos sintetizados; orientação horizontal no celular (aviso, trava, manifest).
- **2026-11-21:** Ajustes (5 vidas, mira automática, tela de vitória deitada, painel de partidas) e Fase 5 (chefão Guardião da Floresta).
- **2026-11-21:** Contagem online (Firebase) + painel online; Fase 6 (menu, pausa, salvamento, configurações).
- **2026-11-21:** Fase 8 (habilidades especiais) e segunda fase (Floresta à Noite + Monstro de Cristal); suporte a várias fases.
- **2026-11-22:** Irmão do Guizinho, modelos/animações novos, fases 3 a 6 (Mar, Laboratório, Floresta do Pesadelo, Castelo) com Ioro, Experimento Caixa 2, Guardião da Infecção e Rei do Pesadelo; infecção; final do jogo. Correção: árvore tapava o herói no início da Floresta à Noite; inimigos apareciam amontoados no (0,0,0) na tela de seleção.
- **2026-11-22:** Cartões de divulgação em PDF A4 com QR Code (`divulgacao/cartoes-guizinho.pdf`, 8 por folha).
- **2026-11-22:** Heroína Nina (braço robótico) e nova tela de seleção com retratos, palco e ficha.
