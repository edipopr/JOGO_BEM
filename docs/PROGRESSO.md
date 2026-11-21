# Progresso do desenvolvimento

## Onde paramos
- **Última atualização:** 2026-11-21
- **Fase atual:** Fase 4 concluída + escolha de personagem (parte da Fase 8, adiantada a pedido do usuário)
- **Jogo online:** https://edipopr.github.io/JOGO_BEM/
- **Próximo passo:** usuário testar os 4 heróis e a Floresta; depois iniciar a **Fase 5 — Chefão Guardião da Floresta** (substitui o portal da arena: derrotar o chefão abre o portal).

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

### Fase 5 — Chefão: Guardião da Floresta
- [ ] Ataques: golpe no chão, investida, bolas de energia
- [ ] Fica vulnerável após três ciclos
- [ ] Barra de vida do chefão

### Fase 6 — Menus, áudio e salvamento
- [ ] Menu principal (Novo jogo, Continuar, Personagens, Configurações)
- [ ] Pausa (Esc)
- [x] Música e efeitos sonoros (Web Audio) — adiantado
- [ ] Salvamento local (progresso e configurações)

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
- [ ] Habilidades especiais (tecla K): dash de energia, onda de cores, campo tecnológico, tiro de canhão
- [ ] Modelos e animações mais caprichados

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
- **2026-11-21:** Fase 4 (Floresta dos Amigos, 3 tipos de inimigos, plataformas móveis, trampolins) + 4 heróis jogáveis com tela de seleção. Testes automáticos com Chrome headless (ferramentas/teste.html).
- **2026-11-21:** Correção da atualização no celular (cache do GitHub Pages + app aberto em segundo plano): versão visível, atualização automática, ferramentas/nova_versao.sh. Troca de herói testada com toque emulado (funciona; problema era versão misturada no cache).
- **2026-11-21:** Trilha sonora e efeitos sintetizados; orientação horizontal no celular (aviso, trava, manifest).
