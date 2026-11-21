# GUIZINHO: A INVASÃO DO PESADELO

## Game Design Document (GDD) --- Versão 1.0

**Tipo de documento:** Planejamento de jogo / Game Design Document\
**Gênero:** Aventura arcade, plataforma 3D, combate, exploração e
cooperação\
**Público-alvo:** Crianças de 10 a 12 anos, acessível a todas as idades\
**Plataformas:** Navegador web (computador, celular e tablet);
possibilidade de PWA e versão desktop\
**Tecnologia proposta:** Godot 4, com exportação Web\
**Estado do projeto:** Conceito e planejamento

------------------------------------------------------------------------

## 1. Visão geral

Criar um jogo arcade 3D de aventura, colorido, leve e acessível,
protagonizado por Guizinho e seus amigos. O grupo precisa salvar o
planeta de Guizinho e outros mundos de uma infecção misteriosa espalhada
pelo Rei do Pesadelo.

O jogo deve oferecer exploração, plataformas, combate simples, coleta de
itens, desafios, chefões e, futuramente, multiplayer cooperativo. A
experiência deve ser divertida e fácil de aprender, especialmente para
crianças de 10 a 12 anos.

### Referências de experiência

-   Exploração e plataforma inspiradas em jogos como Mario 64.
-   Controles simplificados e câmera amigável.
-   Cenários e personagens cartunescos, coloridos e exagerados.
-   Progressão por fases, objetivos claros e chefões.

### Pilares de design

1.  **Simplicidade:** controles fáceis de aprender.
2.  **Diversão:** movimentos responsivos, efeitos e recompensas.
3.  **Exploração:** caminhos, colecionáveis e segredos.
4.  **Cooperação:** personagens com habilidades diferentes.
5.  **Progressão:** novas mecânicas e desafios gradualmente.
6.  **Acessibilidade:** checkpoints frequentes e punições leves.
7.  **Leveza:** recursos gráficos e áudio compactos para web e
    dispositivos móveis.

------------------------------------------------------------------------

## 2. Premissa e enredo

O jogo começa em uma floresta onde Guizinho encontra seus amigos. Uma
energia escura surge e criaturas contaminadas começam a aparecer. O
grupo descobre que o Rei do Pesadelo está espalhando uma infecção capaz
de dominar criaturas, máquinas e personagens.

Os amigos viajam para o planeta de Guizinho. Ao chegar, encontram TV
Rambon quebrado e descobrem que o planeta está sendo infectado. O irmão
de Guizinho, que possui braços imensos, também aparece e ajuda a abrir
caminhos e superar obstáculos.

Ao longo das fases, o grupo descobre experimentos contaminados, enfrenta
Ioro e, por fim, precisa derrotar o Rei do Pesadelo para impedir que a
infecção domine o universo.

### Introdução --- O encontro na floresta

-   Guizinho espera os amigos em uma floresta.
-   TV Rambon, Experimento Caixa e Mr. Fun BOT chegam para a aventura.
-   Um portal ou fenômeno escuro aparece no céu.
-   Criaturas contaminadas surgem.
-   O grupo aprende os controles e descobre a ameaça.

### Capítulo 1 --- O Planeta Guizinho

-   Os amigos viajam ao planeta de Guizinho.
-   Encontram florestas, cristais e criaturas contaminadas.
-   TV Rambon está quebrado após a viagem.
-   O irmão de Guizinho, com braços gigantes, ajuda o grupo.
-   A infecção está crescendo e a fonte precisa ser encontrada.

### Capítulo 2 --- A Fábrica dos Experimentos

-   Experimento Caixa descobre uma antiga fábrica.
-   O Experimento Caixa 2 está infectado.
-   O vilão é maior, mais agressivo e muito inteligente.
-   Ele possui uma boca grande na barriga e cria inimigos contaminados.

### Capítulo 3 --- O Reino de Ioro

-   Ioro domina uma região com armadilhas e desafios.
-   O grupo enfrenta seu circo caótico.
-   Ioro é um palhaço monstruoso com quatro braços e extremidades
    gigantes.

### Capítulo 4 --- O Reino do Pesadelo

-   A infecção domina o ambiente.
-   O Rei do Pesadelo aparece.
-   Ele atravessa paredes, cria tentáculos, infecta personagens e pode
    controlá-los temporariamente.
-   O grupo precisa destruir o núcleo da infecção.

------------------------------------------------------------------------

## 3. Personagens jogáveis

Todos os personagens devem compartilhar controles básicos semelhantes.
Cada um possui uma habilidade especial, mas nenhuma habilidade deve
impedir que a fase seja completada individualmente.

### 3.1 Guizinho --- O Herói

-   **Visual:** humano verde e laranja, máscara no rosto e cabelo.
-   **Perfil:** equilibrado.
-   **Velocidade:** 4/5.
-   **Força:** 3/5.
-   **Pulo:** 4/5.
-   **Habilidade especial:** dash de energia.
-   **Ataque:** soco energético.

### 3.2 TV Rambon --- O Poder Colorido

-   **Visual:** cabeça de TV; personagem mais alto do grupo.
-   **Perfil:** especialista em força e poderes coloridos.
-   **Velocidade:** 2/5.
-   **Força:** 4/5.
-   **Pulo:** 2/5.
-   **Habilidade especial:** onda de cores.
-   **Ataque:** explosão de luz.

### 3.3 Experimento Caixa --- O Cientista

-   **Visual:** caixa na cabeça, um olho em formato de X vermelho e
    outro olho grande.
-   **Personalidade:** inteligente, esperto e falante.
-   **Velocidade:** 3/5.
-   **Força:** 2/5.
-   **Pulo:** 3/5.
-   **Habilidade especial:** campo tecnológico.
-   **Ataque:** raio elétrico.

### 3.4 Mr. Fun BOT --- O Robô

-   **Visual:** robô com rosto quadrado, boca quadrada e canhão na mão.
-   **Perfil:** ataque à distância.
-   **Velocidade:** 3/5.
-   **Força:** 3/5.
-   **Pulo:** 3/5.
-   **Habilidade especial:** tiro de canhão.
-   **Ataque:** projétil explosivo.

### Seleção de personagem

-   Os quatro personagens devem estar disponíveis no início, se
    possível.
-   No single-player, o jogador escolhe um personagem antes da fase.
-   No multiplayer, cada jogador escolhe seu personagem.
-   A tela de seleção deve mostrar animação, descrição e habilidade.

------------------------------------------------------------------------

## 4. Vilões

### 4.1 Ioro --- O Palhaço Caótico

-   **Porte:** segundo maior vilão.
-   **Visual:** palhaço com quatro braços, mãos e pés gigantes.
-   **Ataques:**
    -   Pancada no chão.
    -   Arremesso de bolas explosivas.
    -   Ataque com quatro braços.
    -   Corrida descontrolada.
-   **Fase:** Circo do Ioro.

### 4.2 Rei do Pesadelo --- O Vilão Final

-   **Visual:** gosma misteriosa, escura ou colorida, com aparência de
    pesadelo.
-   **Poderes:**
    -   Atravessar paredes e obstáculos.
    -   Criar tentáculos.
    -   Infectar jogadores.
    -   Transformar inimigos.
    -   Controlar temporariamente personagens infectados.
    -   Criar clones ou manifestações.
-   **Fase:** Castelo do Rei do Pesadelo.

### 4.3 Experimento Caixa 2 --- O Experimento Infectado

-   **Origem:** Experimento Caixa infectado pelo Rei do Pesadelo.
-   **Porte:** terceiro maior vilão.
-   **Visual:** caixa gigante com boca grande na barriga.
-   **Perfil:** inteligente e agressivo.
-   **Ataques:**
    -   Mordida.
    -   Raios.
    -   Invocação de criaturas.
    -   Ataque de área.
-   **Fase:** Laboratório Perdido.

------------------------------------------------------------------------

## 5. Estrutura das fases

O jogo é planejado para seis fases principais.

### Fase 1 --- Floresta dos Amigos

-   **Função:** tutorial.
-   **Ambiente:** floresta colorida, árvores, cogumelos, plataformas e
    criaturas.
-   **Objetivos:** aprender movimentação, pulo, ataque, coleta e
    combate.
-   **Chefão:** Guardião da Floresta infectado.

### Fase 2 --- Planeta Guizinho

-   **Ambiente:** planeta alienígena com paisagens coloridas, cristais e
    áreas contaminadas.
-   **História:** resgate de TV Rambon e encontro com o irmão de
    Guizinho.
-   **Chefão:** Monstro de Cristal.

### Fase 3 --- Laboratório Perdido

-   **Ambiente:** laboratório abandonado e fábrica de experimentos.
-   **História:** Experimento Caixa investiga a origem da infecção.
-   **Chefão:** Experimento Caixa 2.

### Fase 4 --- Circo do Ioro

-   **Ambiente:** circo cartunesco, brinquedos, armadilhas e plataformas
    móveis.
-   **Chefão:** Ioro.

### Fase 5 --- Floresta do Pesadelo

-   **Ambiente:** floresta contaminada, cristais escuros e inimigos mais
    fortes.
-   **Objetivo:** aprender e dominar mecânicas necessárias para a
    batalha final.
-   **Chefão:** Guardião da Infecção.

### Fase 6 --- Castelo do Rei do Pesadelo

-   **Ambiente:** castelo sombrio, plataformas flutuantes e núcleo da
    infecção.
-   **Objetivo:** destruir o núcleo e salvar o planeta.
-   **Chefão final:** Rei do Pesadelo.

### Estrutura padrão de uma fase

1.  Entrada e apresentação rápida da missão.
2.  Exploração e coleta.
3.  Desafio de plataforma, obstáculo ou quebra-cabeça.
4.  Combate contra grupos de inimigos.
5.  Checkpoint.
6.  Preparação e caminho para o chefão.
7.  Batalha contra o chefão.
8.  Recompensa e desbloqueio da próxima fase.

### Duração estimada

-   Tutorial: 5 minutos.
-   Fases normais: 8--12 minutos.
-   Chefões: 3--5 minutos.
-   Jogo completo: aproximadamente 60--90 minutos na primeira versão.

------------------------------------------------------------------------

## 6. Jogabilidade e controles

### Computador

  Tecla        Ação
  ------------ ---------------------
  W, A, S, D   Movimentar
  Espaço       Pular
  J            Atacar
  K            Habilidade especial
  Shift        Corrida
  Esc          Pausar

### Celular e tablet

-   Joystick virtual para movimentação em qualquer direção.
-   Botão de pulo grande e fácil de alcançar.
-   Botão de ataque.
-   Botão de habilidade especial.
-   Interface responsiva para telas pequenas.

### Câmera

-   Terceira pessoa.
-   Acompanha o personagem automaticamente.
-   Evitar controles complexos de câmera na primeira versão.
-   Ajustar distância e enquadramento para computador e dispositivos
    móveis.

------------------------------------------------------------------------

## 7. Combate

### Sistema de vida

-   Cada personagem começa com 3 corações.
-   Ataques inimigos normalmente removem 1 coração.
-   Vida recuperada por itens.
-   Checkpoints frequentes.
-   Derrota deve ser pouco frustrante.

### Itens

  Item               Efeito
  ------------------ -------------------------
  Coração            Recupera vida
  Estrela            Pontuação
  Cristal colorido   Energia
  Escudo             Proteção temporária
  Moeda              Desbloqueios cosméticos
  Antivírus          Remove infecção

### Infecção

-   Ataques de gosma aumentam uma barra de infecção.
-   Efeitos visuais indicam o nível de contaminação.
-   Em níveis mais altos, pode haver efeitos temporários nos controles.
-   Ao atingir 100%, o personagem pode ser controlado pelo vilão por
    alguns segundos.
-   A infecção deve ser reversível e divertida, sem eliminar
    permanentemente o jogador.

------------------------------------------------------------------------

## 8. Multiplayer

### Prioridade de desenvolvimento

1.  Single-player.
2.  Multiplayer local.
3.  Multiplayer online.

### Multiplayer cooperativo

-   Jogadores entram na mesma fase.
-   Compartilham a missão.
-   Podem reviver amigos.
-   Combinam habilidades.
-   Enfrentam chefões juntos.

### Exemplos de cooperação

-   TV Rambon ilumina inimigos.
-   Mr. Fun BOT ataca inimigos iluminados.
-   Experimento Caixa desativa escudos.
-   Guizinho ataca rapidamente.

### Multiplayer local

-   Dois jogadores no mesmo computador.
-   Teclado dividido ou controles.
-   Deve funcionar offline.

### Multiplayer online --- proposta futura

-   Criar sala.
-   Entrar por código.
-   Sincronizar jogadores, inimigos e eventos.
-   Sistema de lobby e seleção de personagem.

Tecnologias a avaliar: - Nakama. - WebSocket com servidor próprio. -
Colyseus.

Multiplayer online exige conexão e infraestrutura. O jogo individual e
multiplayer local devem funcionar offline.

------------------------------------------------------------------------

## 9. Direção de arte

### Estilo visual

-   3D estilizado e cartunesco.
-   Low-poly.
-   Cores fortes.
-   Personagens com formas exageradas.
-   Cenários vivos e legíveis.
-   Animações simples.
-   Efeitos de partículas.

### Vantagens do low-poly

-   Menor consumo de recursos.
-   Melhor desempenho em celulares.
-   Menor tamanho de download.
-   Desenvolvimento mais rápido.
-   Facilidade para publicar na web.

### Referências visuais

-   Plataformas 3D coloridas.
-   Florestas mágicas.
-   Planetas alienígenas.
-   Laboratórios futuristas.
-   Circos cartunescos.
-   Reinos de pesadelo com cores e formas legíveis.

------------------------------------------------------------------------

## 10. Tecnologia recomendada

### Godot Engine 4

**Recomendação principal** para o jogo completo.

Benefícios: - Ferramentas visuais para cenários. - Personagens 3D. -
Animações. - Colisões. - Combate. - Interface. - Menus. - Gerenciamento
de fases. - Exportação Web. - Possibilidade de versões desktop.

### Alternativas

-   **Three.js:** bom para jogos diretamente no navegador com JavaScript
    e integração HTML.
-   **Unity:** poderoso, porém pode ser mais complexo e pesado para este
    projeto.

### Estratégia de tecnologia

-   Godot 4 para desenvolvimento.
-   Exportação Web para navegador.
-   PWA para instalação e offline.
-   Versão desktop opcional futuramente.
-   Assets leves, texturas compactas e shaders simples.

------------------------------------------------------------------------

## 11. Arquitetura e organização do projeto

``` text
Guizinho-game/
├── project/
│   ├── scenes/
│   │   ├── main/
│   │   │   ├── main_menu
│   │   │   └── game
│   │   ├── levels/
│   │   │   ├── level_01_forest
│   │   │   ├── level_02_planet
│   │   │   ├── level_03_lab
│   │   │   ├── level_04_circus
│   │   │   ├── level_05_nightmare
│   │   │   └── level_06_castle
│   │   ├── characters/
│   │   │   ├── guizinho
│   │   │   ├── tv_rambon
│   │   │   ├── experimento_caixa
│   │   │   └── funbot
│   │   ├── enemies/
│   │   ├── bosses/
│   │   ├── objects/
│   │   └── interface/
│   ├── scripts/
│   │   ├── player/
│   │   ├── combat/
│   │   ├── enemies/
│   │   ├── bosses/
│   │   ├── levels/
│   │   ├── multiplayer/
│   │   ├── ui/
│   │   ├── audio/
│   │   └── save_system/
│   ├── assets/
│   │   ├── models/
│   │   ├── textures/
│   │   ├── animations/
│   │   ├── sounds/
│   │   ├── music/
│   │   └── fonts/
│   ├── data/
│   │   ├── characters/
│   │   ├── levels/
│   │   ├── enemies/
│   │   └── settings/
│   └── export/
│       ├── web/
│       └── desktop/
├── documentation/
│   ├── game_design_document
│   ├── characters
│   ├── levels
│   ├── art_style
│   └── development_roadmap
└── README.md
```

A estrutura permite que cada fase seja independente, reutilizando
personagens, controles, inimigos, sistema de vida, interface e áudio.

------------------------------------------------------------------------

## 12. Sistemas de jogo

### Player Controller

-   Movimentação.
-   Pulo.
-   Corrida.
-   Câmera.
-   Controles mobile.

### Combat System

-   Ataque básico.
-   Habilidades.
-   Dano.
-   Inimigos.
-   Chefões.

### Health System

-   Vida.
-   Corações.
-   Cura.
-   Checkpoints.

### Level Manager

-   Carregamento de fases.
-   Objetivos.
-   Desbloqueios.
-   Transições.

### Audio Manager

-   Música.
-   Efeitos.
-   Controle de volume.

### Save System

-   Progresso.
-   Fases liberadas.
-   Personagens.
-   Configurações.

### Ordem de implementação

1.  Movimentação.
2.  Câmera.
3.  Colisões.
4.  Pulo.
5.  Ataque básico.
6.  Inimigos.
7.  Vida e dano.
8.  Itens.
9.  Chefão.
10. Interface.
11. Menus.
12. Salvamento.
13. Áudio.
14. Multiplayer.
15. Exportação.

------------------------------------------------------------------------

## 13. Menu principal

### Opções

-   Novo jogo.
-   Continuar.
-   Multiplayer.
-   Personagens.
-   Configurações.

### Configurações

-   Música.
-   Efeitos sonoros.
-   Sensibilidade da câmera.
-   Qualidade gráfica.
-   Controles.
-   Idioma.

### Seleção de personagem

-   Mostrar os quatro personagens.
-   Animação.
-   Descrição.
-   Habilidade.
-   Indicadores de atributos.

------------------------------------------------------------------------

## 14. Progressão e recompensas

### Sistema de estrelas

Cada fase pode ter três estrelas: 1. Completar a fase. 2. Encontrar
todos os cristais. 3. Completar um desafio especial.

### Desbloqueios

-   Novas fases.
-   Skins.
-   Cores.
-   Efeitos de ataque.
-   Emotes.
-   Animações engraçadas.

Não é recomendado implementar compras dentro do jogo. O objetivo é uma
experiência infantil, simples e divertida.

------------------------------------------------------------------------

## 15. Trilha sonora e áudio

A música deve ser simples, alegre, aventureira e com elementos de
mistério. Preferência por loops originais, sintetizadores e instrumentos
leves.

### Proposta musical

-   **Menu principal:** melodia alegre, curta, sintetizador e percussão
    leve.
-   **Floresta dos Amigos:** flautas, xilofone, baixo suave e sons de
    natureza.
-   **Combate:** batida rápida, sintetizadores e percussão arcade.
-   **Chefão:** melodia intensa, graves e ritmo acelerado.
-   **Rei do Pesadelo:** sons misteriosos, notas graves, efeitos de
    gosma e sintetizadores.

### Efeitos sonoros

-   Pulo.
-   Queda.
-   Ataque.
-   Acerto.
-   Dano.
-   Coleta de moedas.
-   Coleta de cristais.
-   Coração.
-   Habilidade especial.
-   Portal.
-   Inimigo derrotado.
-   Chefão entrando.
-   Chefão derrotado.
-   Infecção.
-   Desinfecção.
-   Botões de menu.

Preferir OGG para músicas e arquivos compactos para reduzir o tamanho do
jogo.

------------------------------------------------------------------------

## 16. Publicação e modo offline

### Online

Possíveis plataformas: - itch.io. - GitHub Pages. - Cloudflare Pages. -
Servidor próprio.

O jogador acessa o link e joga no navegador.

### Offline / PWA

Após baixar os recursos: - Instalar como aplicativo. - Abrir sem
interface do navegador. - Jogar offline. - Salvar progresso localmente.

**Limitação:** multiplayer online exige conexão. Single-player e
multiplayer local podem funcionar offline.

------------------------------------------------------------------------

## 17. MVP --- primeira versão jogável

### Guizinho: Demo da Floresta

Objetivo: ter uma versão funcional e publicável antes de produzir o jogo
completo.

Checklist: - \[ \] Menu principal. - \[ \] Um cenário 3D. - \[ \]
Guizinho jogável. - \[ \] Movimentação. - \[ \] Pulo. - \[ \] Câmera. -
\[ \] Ataque. - \[ \] Três tipos de inimigos. - \[ \] Sistema de vida. -
\[ \] Cristais coletáveis. - \[ \] Um checkpoint. - \[ \] Um chefão. -
\[ \] Música. - \[ \] Efeitos sonoros. - \[ \] Tela de vitória. - \[ \]
Tela de derrota. - \[ \] Controles para celular. - \[ \] Exportação para
navegador.

### Primeiro chefão --- Guardião da Floresta

Ataques: 1. Golpe no chão. 2. Investida. 3. Lançamento de bolas de
energia.

Após três ciclos de ataques, fica vulnerável.

A primeira fase servirá para testar todos os sistemas principais.

------------------------------------------------------------------------

## 18. Roadmap de desenvolvimento

### Fase 1 --- Planejamento

-   Definir universo.
-   Documentar personagens.
-   Definir controles.
-   Definir estilo visual.
-   Criar GDD.

### Fase 2 --- Protótipo

-   Criar projeto.
-   Criar cenário simples.
-   Criar personagem provisório.
-   Implementar movimentação.
-   Implementar câmera.
-   Implementar pulo.
-   Testar teclado e celular.

### Fase 3 --- Gameplay

-   Implementar combate.
-   Criar inimigo básico.
-   Criar vida.
-   Criar coleta.
-   Criar checkpoints.
-   Criar vitória e derrota.

### Fase 4 --- Primeira fase completa

-   Criar floresta.
-   Criar obstáculos.
-   Criar missão.
-   Criar inimigos.
-   Criar chefão.
-   Criar recompensa.

### Fase 5 --- Personagens

-   Guizinho.
-   TV Rambon.
-   Experimento Caixa.
-   Mr. Fun BOT.
-   Habilidades exclusivas.

### Fase 6 --- Conteúdo

-   Demais fases.
-   Vilões.
-   Animações.
-   História.
-   Diálogos.

### Fase 7 --- Multiplayer

-   Lobby.
-   Conexão.
-   Sincronização.
-   Cooperação.

### Fase 8 --- Áudio

-   Trilha.
-   Sons de personagens.
-   Sons de ataque.
-   Ambiente.

### Fase 9 --- Testes

-   Navegadores.
-   Celular.
-   Tablet.
-   Multiplayer.
-   Performance.
-   Correção de bugs.

### Fase 10 --- Publicação

-   Exportação Web.
-   Página do jogo.
-   Ícone.
-   Tela inicial.
-   Publicação.

------------------------------------------------------------------------

## 19. Sprints sugeridas

### Sprint 1 --- Protótipo jogável

1.  Instalar e configurar Godot.
2.  Criar projeto Guizinho.
3.  Criar cenário de teste com chão, paredes e plataformas.
4.  Implementar personagem provisório.
5.  Implementar movimentação em terceira pessoa.
6.  Implementar pulo.
7.  Implementar câmera.
8.  Implementar ataque básico.
9.  Adicionar inimigo simples.
10. Testar no computador e navegador.

**Resultado esperado:** personagem andando, pulando, atacando e
enfrentando um inimigo em um cenário 3D.

### Sprint 2 --- Primeira fase

-   Criar Floresta dos Amigos.
-   Adicionar árvores, pedras, plataformas e obstáculos.
-   Adicionar cristais.
-   Criar missão.
-   Criar checkpoint.
-   Criar Guardião da Floresta.
-   Criar tela de vitória.

### Sprint 3 --- Guizinho definitivo

-   Modelo 3D.
-   Texturas.
-   Animação idle.
-   Corrida.
-   Pulo.
-   Ataque.
-   Dano.
-   Habilidade especial.

### Sprint 4 --- Demo pública

-   Menu.
-   Música.
-   Sons.
-   Configurações.
-   Exportação Web.
-   Testes mobile.
-   Publicação.

------------------------------------------------------------------------

## 20. Cronograma estimado

Estimativa de planejamento para uma pessoa com apoio de ferramentas de
IA e assets simples. Não é garantia de prazo.

  Etapa                         Estimativa
  --------------------------- ------------
  Planejamento e documentos      2--4 dias
  Protótipo de movimentação      3--7 dias
  Sistema de combate             4--7 dias
  Primeira fase                 7--14 dias
  Personagens                   7--14 dias
  Chefão                         4--7 dias
  Interface e menus              3--7 dias
  Áudio                          2--4 dias
  Testes e otimização           5--10 dias
  Publicação da demo             1--3 dias

A criação de modelos 3D e animações próprias pode ser uma das partes
mais demoradas.

------------------------------------------------------------------------

## 21. Decisões de design

1.  Controles simples, no máximo quatro ações principais.
2.  Câmera amigável e automática.
3.  Fases curtas e objetivos claros.
4.  Chefões com padrões aprendíveis.
5.  Dificuldade progressiva.
6.  Personagens diferentes, mas todos capazes de completar as fases.
7.  Checkpoints frequentes.
8.  Visual leve.
9.  Áudio original.
10. Arquitetura expansível.

------------------------------------------------------------------------

## 22. Próximos passos

A primeira meta é criar uma demo que já seja divertida. Não começar
pelos seis mundos nem pelo multiplayer.

### Próxima etapa prática

1.  Instalar o Godot 4.
2.  Criar o projeto inicial.
3.  Organizar as pastas.
4.  Criar a cena principal.
5.  Criar personagem provisório.
6.  Implementar câmera e controles.
7.  Construir o cenário de teste.
8.  Implementar pulo e ataque.
9.  Criar o primeiro inimigo.
10. Testar e iterar.

Quando movimentação, câmera, combate e primeira fase estiverem
funcionando, será muito mais fácil adicionar TV Rambon, Experimento
Caixa, Mr. Fun BOT, Ioro e o Rei do Pesadelo.

------------------------------------------------------------------------

## 23. Resumo executivo

**Nome provisório:** Guizinho: A Invasão do Pesadelo

**Visão:** aventura arcade 3D colorida, leve e acessível, com
personagens carismáticos, exploração, combate simples e chefões.

**Público:** crianças de 10 a 12 anos, acessível a todas as idades.

**Plataforma:** navegador, computador, celular e tablet; possibilidade
de PWA offline e versão desktop.

**Tecnologia proposta:** Godot 4.

**Primeira entrega:** Demo da Floresta dos Amigos, com Guizinho,
movimentação, câmera, combate, inimigos, checkpoint e um chefão.

**Expansão futura:** quatro personagens jogáveis, seis fases, vilões,
multiplayer local e online.

**Princípio de desenvolvimento:** construir uma base pequena, funcional
e divertida; testar; e expandir de forma modular.
