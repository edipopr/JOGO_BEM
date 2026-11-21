# Progresso do desenvolvimento

## Onde paramos
- **Última atualização:** 2026-11-21
- **Fase atual:** Fase 3 concluída + web app instalável (aguardando teste do usuário)
- **Jogo online:** https://edipopr.github.io/JOGO_BEM/
- **Próximo passo:** testar a Fase 3 e a instalação no celular; depois iniciar a **Fase 4 — Floresta dos Amigos** (fase completa com layout próprio, 3 tipos de inimigos, plataformas móveis).

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

### Fase 4 — Floresta dos Amigos (fase 1 completa)
- [ ] Layout da fase (caminho, áreas, segredos)
- [ ] Três tipos de inimigos
- [ ] Plataformas móveis e obstáculos
- [ ] Missão e caminho até o chefão

### Fase 5 — Chefão: Guardião da Floresta
- [ ] Ataques: golpe no chão, investida, bolas de energia
- [ ] Fica vulnerável após três ciclos
- [ ] Barra de vida do chefão

### Fase 6 — Menus, áudio e salvamento
- [ ] Menu principal (Novo jogo, Continuar, Personagens, Configurações)
- [ ] Pausa (Esc)
- [ ] Música e efeitos sonoros (Web Audio)
- [ ] Salvamento local (progresso e configurações)

### Fase 7 — Publicação da demo
- [x] GitHub Pages (adiantado): https://edipopr.github.io/JOGO_BEM/
- [x] PWA (adiantado): manifest, ícones, service worker (offline), botão "Instalar app" e dica para iPhone
- [ ] Testes em navegadores, celular e tablet

### Fase 8 — Personagens
- [ ] TV Rambon, Experimento Caixa, Mr. Fun BOT
- [ ] Habilidades especiais (tecla K)
- [ ] Tela de seleção de personagem

### Fase 9 — Demais fases e vilões
- [ ] Planeta Guizinho, Laboratório Perdido, Circo do Ioro, Floresta do Pesadelo, Castelo
- [ ] Experimento Caixa 2, Ioro, Rei do Pesadelo
- [ ] Sistema de infecção

### Fase 10 — Multiplayer local
### Fase 11 — Multiplayer online

## Histórico
- **2026-11-21:** GDD lido; repositório criado; tecnologia definida (Three.js); Fase 1 implementada.
- **2026-11-21:** Fase 2 implementada (combate, inimigos, vida, partículas; física movida para src/fisica.js).
- **2026-11-21:** Servidor reescrito para aceitar a rede local (celular); GitHub Pages pendente (repo privado).
- **2026-11-21:** Repositório tornado público e GitHub Pages ativado.
- **2026-11-21:** Web app instalável (PWA) e Fase 3 implementada (itens, checkpoints, portal, telas de vitória/derrota).
