// Ponto de entrada: cria a cena, as telas e roda o loop do jogo.
import * as THREE from 'three';
import { Entrada, ehToque } from './entrada.js';
import { CameraSeguidora } from './camera.js';
import { Jogador } from './jogador.js';
import { PERSONAGENS } from './personagens.js';
import { GerenciadorInimigos } from './inimigo.js';
import { Particulas } from './particulas.js';
import { Projeteis } from './projeteis.js';
import { GerenciadorItens, Checkpoints, Portal } from './itens.js';
import { criarFlorestaDosAmigos } from './fases/floresta.js';
import { configurarApp } from './pwa.js';
import { VERSAO } from './versao.js';
import { som } from './audio.js';
import { estatisticas } from './estatisticas.js';
import { contagem } from './contagem.js';
import { Chefao } from './chefao.js';
import { configuracoes } from './configuracoes.js';
import { salvamento } from './salvamento.js';

// Atualização automática: só recarrega sozinho fora de uma partida
configurarApp({ podeRecarregar: () => !['jogando', 'caindo', 'pausado'].includes(estado) });
document.getElementById('versao').textContent = VERSAO;

const PONTOS = { cristal: 10, estrela: 100 };
const FASE_ID = 'floresta'; // chave da fase no salvamento
const CHAVE_PERSONAGEM = 'guizinho.personagem';

function lerPersonagemSalvo() {
  try { return localStorage.getItem(CHAVE_PERSONAGEM) || 'guizinho'; } catch { return 'guizinho'; }
}
function salvarPersonagem(id) {
  try { localStorage.setItem(CHAVE_PERSONAGEM, id); } catch { /* sem armazenamento: tudo bem */ }
}

// ----- Cena -----
const container = document.getElementById('jogo');
const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderizador.domElement);

const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 220);
/** Celular em pé: abre mais o campo de visão para os monstros não ficarem tão "em cima". */
function ajustarCamera() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.fov = camera.aspect < 1 ? 80 : 60;
  camera.updateProjectionMatrix();
}
ajustarCamera();

const fase = criarFlorestaDosAmigos(cena);
const entrada = new Entrada(container);
const jogador = new Jogador(cena, fase.pontoInicial, lerPersonagemSalvo());
const inimigos = new GerenciadorInimigos(cena, fase.inimigos);
const itens = new GerenciadorItens(cena, fase.itens);
const checkpoints = new Checkpoints(cena, fase.checkpoints);
const portal = new Portal(cena, fase.portal);
const particulas = new Particulas(cena);
const projeteis = new Projeteis(cena);
const cameraSeguidora = new CameraSeguidora(camera);
const chefao = new Chefao(cena, fase.arena, particulas, { barreira: fase.barreira, caixas: fase.caixas });
inimigos.adicionar(chefao); // entra no combate como um inimigo (golpes, projéteis, mira)
portal.abrir(false);         // o portal só abre quando o chefão for derrotado
const corpos = [jogador, ...inimigos.lista]; // carregados pelas plataformas móveis
jogador.alvos = () => inimigos.lista; // para a mira automática
cameraSeguidora.atualizar(jogador.posicao, 0, true);

// ----- Elementos da interface -----
const $ = (id) => document.getElementById(id);
const telas = {
  inicial: $('tela-inicial'), selecao: $('tela-selecao'), vitoria: $('tela-vitoria'), derrota: $('tela-derrota'),
  painel: $('tela-painel'), pausa: $('tela-pausa'), config: $('tela-config'),
};
const hud = $('hud');
const controlesToque = $('controles-toque');
$('dica').textContent = ehToque
  ? 'Joystick: mover (empurre até o fim para correr) · Arraste a tela: girar câmera'
  : 'WASD: mover · Espaço: pular · J: atacar · Shift: correr · Arraste o mouse: girar câmera';

// ----- Estado da partida -----
// estado: 'inicio' | 'selecao' | 'jogando' | 'pausado' | 'caindo' (animação de derrota) | 'vitoria' | 'derrota'
let estado = 'inicio';
let tempoAnimacao = 0;
let tempoMensagem = 0;
const partida = { cristais: 0, estrelas: 0, pontos: 0, tempo: 0 };
const registrado = { tempo: 0, inimigos: 0 }; // o que já foi contado no painel nesta partida

/** Registra no painel o fim (vitória) ou uma derrota da partida atual. */
function registrarFim(resultado) {
  estatisticas.terminou(resultado, {
    heroi: jogador.id, tempo: partida.tempo, pontos: pontosTotais(),
    tempoNovo: partida.tempo - registrado.tempo, inimigosNovos: inimigos.derrotados - registrado.inimigos,
  });
  contagem.terminou(resultado, {
    heroi: jogador.id, segundos: partida.tempo, segundosNovos: partida.tempo - registrado.tempo,
    pontos: pontosTotais(), cristais: partida.cristais, estrelas: partida.estrelas,
  });
  registrado.tempo = partida.tempo;
  registrado.inimigos = inimigos.derrotados;
}
const avisosVistos = new Set();
const totalCristais = itens.total('cristal');
const totalEstrelas = itens.total('estrela');

function mostrarTela(nome) {
  for (const [chave, el] of Object.entries(telas)) el.classList.toggle('oculto', chave !== nome);
  const emJogo = nome === null;
  hud.classList.toggle('oculto', !emJogo);
  controlesToque.classList.toggle('oculto', !(emJogo && ehToque));
  $('btn-pausa').classList.toggle('oculto', !emJogo);
  if (nome === 'inicial') atualizarMenu();
  // Música de cada tela (durante a partida a música depende da área — ver passo())
  if (['inicial', 'selecao', 'painel'].includes(nome)) som.musica('menu');
  else if (['vitoria', 'derrota', 'pausa'].includes(nome)) som.musica(null);
}

function mostrarMensagem(texto, segundos = 1.5) {
  $('mensagem').textContent = texto;
  $('mensagem').classList.remove('oculto');
  $('dica').classList.add('oculto'); // não sobrepor a dica de controles
  tempoMensagem = segundos;
}

function pulsar(el) {
  el.classList.remove('pulsar');
  void el.offsetWidth; // reinicia a animação
  el.classList.add('pulsar');
}

const pontosTotais = () => partida.pontos + inimigos.pontos;

let vidaMostrada = -1;
function atualizarHud() {
  if (jogador.vida !== vidaMostrada) {
    vidaMostrada = jogador.vida;
    $('coracoes').innerHTML = '';
    for (let i = 0; i < jogador.vidaMax; i++) {
      const c = document.createElement('span');
      c.className = 'coracao' + (i < jogador.vida ? '' : ' vazio');
      c.textContent = '♥';
      $('coracoes').appendChild(c);
    }
  }
  $('qtd-cristais').textContent = `${partida.cristais}/${totalCristais}`;
  $('qtd-estrelas').textContent = `${partida.estrelas}/${totalEstrelas}`;
  $('pontos').textContent = `${pontosTotais()} pts`;
  // Barra de vida do chefão: aparece quando ele acorda
  const barraVisivel = chefao.acordado;
  $('chefao-barra').classList.toggle('oculto', !barraVisivel);
  if (barraVisivel) {
    $('chefao-vida').style.width = `${(chefao.vida / chefao.vidaMax) * 100}%`;
    $('chefao-barra').classList.toggle('vulneravel', chefao.estado === 'vulneravel');
  }
}

// ----- Seleção de personagem -----
function montarCartoes() {
  const barra = (rotulo, valor) =>
    `<div class="atributo"><span>${rotulo}</span><div class="barra"><i style="width:${valor * 20}%"></i></div></div>`;
  $('cartoes').innerHTML = Object.entries(PERSONAGENS).map(([id, p]) => `
    <button class="cartao" data-id="${id}" style="--cor:${p.cor}">
      <strong>${p.nome}</strong>
      <small>${p.titulo}</small>
      ${barra('Velocidade', p.velocidade)}${barra('Força', p.forca)}${barra('Pulo', p.pulo)}
      <em>${p.nomeAtaque}</em>
    </button>`).join('');
  for (const el of $('cartoes').querySelectorAll('.cartao')) {
    el.addEventListener('click', () => escolherPersonagem(el.dataset.id));
  }
}

function escolherPersonagem(id) {
  jogador.definirPersonagem(id);
  salvarPersonagem(id);
  for (const el of $('cartoes').querySelectorAll('.cartao')) el.classList.toggle('escolhido', el.dataset.id === id);
  $('descricao-personagem').textContent = PERSONAGENS[jogador.id].descricao;
}

/** modo 'jogar' = botão Começar; modo 'escolher' (menu Personagens) = botão Pronto, volta ao menu. */
function abrirSelecao(modo = 'jogar') {
  estado = 'selecao';
  $('btn-comecar').classList.toggle('oculto', modo !== 'jogar');
  $('btn-pronto').classList.toggle('oculto', modo === 'jogar');
  jogador.reiniciar(true);
  escolherPersonagem(jogador.id);
  cameraSeguidora.distancia = 6;
  cameraSeguidora.inclinacao = 0.08;
  cameraSeguidora.alturaAlvo = -0.3; // olha abaixo do herói para ele aparecer acima dos cartões
  cameraSeguidora.angulo = 0;
  mostrarTela('selecao');
}

// ----- Partida -----
/** Zera a fase (itens, checkpoints, inimigos, chefão, pontos). */
function zerarFase() {
  Object.assign(partida, { cristais: 0, estrelas: 0, pontos: 0, tempo: 0 });
  avisosVistos.clear();
  itens.reiniciar();
  checkpoints.reiniciar();
  inimigos.reiniciar();
  registrado.tempo = 0;
  registrado.inimigos = 0;
  tempoAbrirPortal = 0;
}

/** voltarAoInicio: true = partida nova do zero; false = "Tentar de novo" do último checkpoint. */
function comecarPartida(voltarAoInicio) {
  if (voltarAoInicio) {
    zerarFase();
    salvamento.apagarPartida();
    estatisticas.comecou(jogador.id);
    contagem.comecou();
    entrarNoJogo(fase.pontoInicial);
  } else {
    estatisticas.tentouDeNovo();
    contagem.tentouDeNovo();
    chefao.reiniciarLuta(); // chefão volta a dormir com vida cheia (se ainda não foi derrotado)
    entrarNoJogo(null);
  }
}

/** "Continuar" do menu: monta a fase como estava no salvamento e volta ao último checkpoint. */
function continuarPartida() {
  const s = salvamento.partida();
  if (!s) return;
  zerarFase();
  Object.assign(partida, { cristais: s.cristais, estrelas: s.estrelas, pontos: s.pontos, tempo: s.tempo });
  for (const i of s.avisos || []) if (fase.avisos[i]) avisosVistos.add(fase.avisos[i]);
  itens.restaurar(s.itens);
  checkpoints.restaurar(s.checkpoints, s.checkpoint);
  inimigos.pontos = s.pontosInimigos || 0;
  inimigos.derrotados = s.derrotados || 0;
  if (s.chefaoDerrotado) chefao.purificarDireto();
  registrado.tempo = partida.tempo;
  registrado.inimigos = inimigos.derrotados;
  estatisticas.comecou(jogador.id);
  contagem.comecou();
  entrarNoJogo(fase.checkpoints[s.checkpoint] || fase.pontoInicial);
  mostrarMensagem('Bem-vindo de volta!', 2);
}

/** Guarda a partida em andamento (para o botão Continuar). */
function salvarProgresso() {
  if (!['jogando', 'pausado', 'caindo', 'derrota'].includes(estado)) return;
  salvamento.salvarPartida({
    fase: FASE_ID,
    checkpoints: checkpoints.ativos(), checkpoint: checkpoints.ultimo,
    itens: itens.coletados(),
    cristais: partida.cristais, estrelas: partida.estrelas, pontos: partida.pontos, tempo: partida.tempo,
    pontosInimigos: inimigos.pontos, derrotados: inimigos.derrotados,
    chefaoDerrotado: chefao.derrotado,
    avisos: [...avisosVistos].map((a) => fase.avisos.indexOf(a)),
  });
}

/** Coloca o herói no jogo. pontoRenascer = onde aparecer (null = último checkpoint/renascimento). */
function entrarNoJogo(pontoRenascer) {
  if (pontoRenascer) jogador.pontoRenascer.copy(pontoRenascer);
  portal.abrir(chefao.derrotado);
  projeteis.limpar();
  jogador.reiniciar(false);
  cameraSeguidora.distancia = 9;
  cameraSeguidora.inclinacao = 0.45;
  cameraSeguidora.alturaAlvo = 1.3;
  cameraSeguidora.angulo = 0;
  cameraSeguidora.atualizar(jogador.posicao, 0, true);
  entrada.consumirPulo();
  entrada.consumirAtaque();
  estado = 'jogando';
  mostrarTela(null);
}

function aoColetar(tipo) {
  som.efeito(tipo); // 'cristal' | 'estrela' | 'coracao'
  if (tipo === 'cristal') {
    partida.cristais++;
    partida.pontos += PONTOS.cristal;
    pulsar($('qtd-cristais'));
    if (partida.cristais === totalCristais) mostrarMensagem('Todos os cristais!', 2);
  } else if (tipo === 'estrela') {
    partida.estrelas++;
    partida.pontos += PONTOS.estrela;
    pulsar($('qtd-estrelas'));
    mostrarMensagem(`Estrela escondida! (${partida.estrelas}/${totalEstrelas})`, 2);
  } else if (tipo === 'coracao') {
    jogador.curar();
    pulsar($('coracoes'));
  }
  salvarProgresso();
}

function aoAtivarCheckpoint(posicao) {
  jogador.pontoRenascer.copy(posicao);
  som.efeito('checkpoint');
  mostrarMensagem('Checkpoint!', 1.5);
  salvarProgresso();
}

let tempoAbrirPortal = 0;
// Eventos do chefão (chefao.js)
chefao.avisar = (evento, texto) => {
  if (evento === 'acordou') mostrarMensagem('O Guardião da Floresta acordou contaminado!', 2.5);
  else if (evento === 'dica') mostrarMensagem(texto, 2.5);
  else if (evento === 'vulneravel') mostrarMensagem('Ele cansou! Ataque o coração brilhante!', 2.5);
  else if (evento === 'derrotado') {
    mostrarMensagem('Você purificou o Guardião! O portal se abriu!', 4);
    tempoAbrirPortal = 2.6; // o portal aparece depois da purificação (ver passo())
    salvarProgresso();
  }
};

function verificarAvisos() {
  for (const a of fase.avisos) {
    if (avisosVistos.has(a)) continue;
    const dx = jogador.posicao.x - a.x, dz = jogador.posicao.z - a.z;
    if (Math.hypot(dx, dz) < a.raio && Math.abs(jogador.posicao.y - a.y) < 3) {
      avisosVistos.add(a);
      mostrarMensagem(a.texto, 3.5);
    }
  }
}

function vencer() {
  estado = 'vitoria';
  const metas = [
    ['Completar a fase', true],
    [`Coletar todos os cristais (${partida.cristais}/${totalCristais})`, partida.cristais === totalCristais],
    [`Encontrar as estrelas escondidas (${partida.estrelas}/${totalEstrelas})`, partida.estrelas === totalEstrelas],
  ];
  $('objetivos').innerHTML = metas.map(([texto, ok]) =>
    `<li class="${ok ? '' : 'falhou'}"><span class="estrela-meta">★</span>${texto}</li>`).join('');
  // Recordes da fase (salvos no aparelho) — a partida em andamento acabou
  const antes = salvamento.recordes(FASE_ID);
  salvamento.registrarVitoria(FASE_ID, {
    pontos: pontosTotais(), tempo: partida.tempo, estrelas: partida.estrelas, todosCristais: partida.cristais === totalCristais,
  });
  salvamento.apagarPartida();
  const novoRecorde = !antes || pontosTotais() > antes.melhorPontos;
  const min = Math.floor(partida.tempo / 60), seg = Math.floor(partida.tempo % 60);
  $('resumo').innerHTML = `
    <span>Herói</span><b>${jogador.personagem.nome}</b>
    <span>Inimigos derrotados</span><b>${inimigos.derrotados}</b>
    <span>Tempo</span><b>${min}:${String(seg).padStart(2, '0')}</b>
    <span>Pontos</span><b>${pontosTotais()}</b>
    ${novoRecorde ? '<span>🏆 Novo recorde!</span><b>' + pontosTotais() + '</b>' : `<span>Recorde</span><b>${antes.melhorPontos}</b>`}`;
  registrarFim('vitoria');
  mostrarTela('vitoria');
  som.efeito('vitoria');
}

// ----- Som -----
// O navegador só libera o áudio depois de um toque/clique/tecla
for (const evento of ['pointerdown', 'keydown']) {
  window.addEventListener(evento, () => som.iniciar(), { capture: true });
}
som.musica('menu');
function atualizarBotaoSom() {
  $('btn-som').textContent = som.mudo ? '🔇' : '🔊';
  $('btn-som').title = som.mudo ? 'Ligar o som' : 'Desligar o som';
}
atualizarBotaoSom();
$('btn-som').addEventListener('click', () => { som.alternarMudo(); atualizarBotaoSom(); });
// Clique em qualquer botão das telas
document.addEventListener('click', (e) => { if (e.target.closest('.tela button')) som.efeito('botao'); });

// ----- Celular deitado -----
/** Ao tocar em Jogar no celular: tela cheia + trava na horizontal (quando o aparelho deixa). */
async function prepararTelaCelular() {
  if (!ehToque) return;
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
    await screen.orientation?.lock?.('landscape');
  } catch { /* iPhone e alguns navegadores não deixam: o aviso "Gire o celular" orienta */ }
}
$('btn-girar-ignorar').addEventListener('click', () => document.body.classList.add('ignorar-orientacao'));

// ----- Menu principal -----
const relogioTexto = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function atualizarMenu() {
  const s = salvamento.partida();
  $('btn-continuar').classList.toggle('oculto', !s);
  $('btn-jogar').classList.toggle('secundario', !!s); // com jogo salvo, "Continuar" vira o botão principal
  if (s) {
    const onde = s.checkpoint >= 0 ? `checkpoint ${s.checkpoint + 1}` : 'início';
    $('info-continuar').textContent = `${fase.nome} · ${onde} · ◆ ${s.cristais}/${totalCristais} · ★ ${s.estrelas}/${totalEstrelas} · ${relogioTexto(s.tempo)}`;
  }
  const r = salvamento.recordes(FASE_ID);
  $('recorde-fase').classList.toggle('oculto', !r);
  if (r) {
    $('recorde-fase').innerHTML = `${fase.nome}: <b>✔ concluída</b> · ★ ${r.maxEstrelas}/${totalEstrelas}`
      + `${r.todosCristais ? ' · ◆ todos' : ''} · recorde <b>${r.melhorPontos} pts</b> · melhor tempo ${relogioTexto(r.melhorTempo)}`;
  }
}

function irParaMenu() {
  salvarProgresso();
  estado = 'inicio';
  mostrarTela('inicial');
}

// ----- Pausa -----
function pausar() {
  if (estado !== 'jogando') return;
  estado = 'pausado';
  salvarProgresso();
  mostrarTela('pausa');
}
function retomar() {
  if (estado !== 'pausado') return;
  estado = 'jogando';
  mostrarTela(null);
  entrada.consumirPulo();
  entrada.consumirAtaque();
}
// App foi para segundo plano (ligação, trocou de app...): pausa e salva
document.addEventListener('visibilitychange', () => { if (document.hidden) { pausar(); salvarProgresso(); } });
window.addEventListener('pagehide', salvarProgresso);

// ----- Configurações -----
let voltarDaConfig = 'inicial';
function abrirConfig(origem) {
  voltarDaConfig = origem;
  mostrarTela('config');
}
function aplicarQualidade(qualidade) {
  const sombras = qualidade !== 'baixa';
  const tipo = qualidade === 'alta' ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  const nitidez = { alta: 2, media: 1.25, baixa: 1 }[qualidade] || 2;
  renderizador.setPixelRatio(Math.min(window.devicePixelRatio, nitidez));
  renderizador.setSize(window.innerWidth, window.innerHeight);
  if (renderizador.shadowMap.enabled !== sombras || renderizador.shadowMap.type !== tipo) {
    renderizador.shadowMap.enabled = sombras;
    renderizador.shadowMap.type = tipo;
    // os materiais precisam ser recompilados para ligar/desligar as sombras
    cena.traverse((o) => { for (const m of [].concat(o.material || [])) m.needsUpdate = true; });
  }
}
configuracoes.aoMudar((c) => {
  som.definirVolumes(c.musica / 100, c.efeitos / 100);
  cameraSeguidora.sensibilidade = c.sensibilidade / 100;
  cameraSeguidora.inverterY = c.inverterY;
  aplicarQualidade(c.qualidade);
  $('cfg-musica').value = c.musica; $('saida-musica').textContent = `${c.musica}%`;
  $('cfg-efeitos').value = c.efeitos; $('saida-efeitos').textContent = `${c.efeitos}%`;
  $('cfg-sensibilidade').value = c.sensibilidade; $('saida-sensibilidade').textContent = `${c.sensibilidade}%`;
  $('cfg-inverter').checked = c.inverterY;
  for (const b of $('cfg-qualidade').querySelectorAll('button')) b.classList.toggle('ativo', b.dataset.valor === c.qualidade);
});
for (const nome of ['musica', 'efeitos', 'sensibilidade']) {
  $(`cfg-${nome}`).addEventListener('input', (e) => configuracoes.definir(nome, Number(e.target.value)));
}
$('cfg-efeitos').addEventListener('change', () => som.efeito('cristal')); // amostra do volume
$('cfg-inverter').addEventListener('change', (e) => configuracoes.definir('inverterY', e.target.checked));
for (const b of $('cfg-qualidade').querySelectorAll('button')) {
  b.addEventListener('click', () => configuracoes.definir('qualidade', b.dataset.valor));
}
$('btn-config-voltar').addEventListener('click', () => mostrarTela(voltarDaConfig));
$('btn-apagar-progresso').addEventListener('click', () => {
  if (confirm('Apagar o jogo salvo e os recordes deste aparelho?')) {
    salvamento.apagarTudo();
    $('btn-apagar-progresso').textContent = 'Apagado ✔';
    setTimeout(() => { $('btn-apagar-progresso').textContent = 'Apagar progresso'; }, 2000);
  }
});

atualizarMenu(); // ao abrir o jogo

// ----- Botões -----
montarCartoes();
$('btn-jogar').addEventListener('click', () => {
  if (salvamento.partida() && !confirm('Começar um jogo novo? O jogo salvo será substituído.')) return;
  prepararTelaCelular();
  abrirSelecao('jogar');
});
$('btn-continuar').addEventListener('click', () => { prepararTelaCelular(); continuarPartida(); });
$('btn-personagens').addEventListener('click', () => abrirSelecao('escolher'));
$('btn-pronto').addEventListener('click', () => { estado = 'inicio'; mostrarTela('inicial'); });
$('btn-config').addEventListener('click', () => abrirConfig('inicial'));
$('btn-comecar').addEventListener('click', () => {
  comecarPartida(true);
  $('dica').classList.remove('oculto');
  setTimeout(() => $('dica').classList.add('oculto'), 8000);
});
$('btn-voltar').addEventListener('click', () => { estado = 'inicio'; mostrarTela('inicial'); });
$('btn-pausa').addEventListener('click', pausar);
$('btn-retomar').addEventListener('click', retomar);
$('btn-pausa-config').addEventListener('click', () => abrirConfig('pausa'));
$('btn-pausa-recomecar').addEventListener('click', () => {
  if (confirm('Recomeçar a fase do começo?')) comecarPartida(true);
});
$('btn-pausa-sair').addEventListener('click', irParaMenu);
$('btn-menu-vitoria').addEventListener('click', irParaMenu);
$('btn-menu-derrota').addEventListener('click', irParaMenu);
$('btn-painel').addEventListener('click', () => { estatisticas.mostrar($); mostrarTela('painel'); });
$('btn-painel-voltar').addEventListener('click', () => mostrarTela('inicial'));
$('btn-painel-zerar').addEventListener('click', () => {
  if (confirm('Zerar todas as estatísticas deste aparelho?')) { estatisticas.zerar(); estatisticas.mostrar($); }
});
$('btn-de-novo').addEventListener('click', () => comecarPartida(true));
$('btn-tentar').addEventListener('click', () => comecarPartida(false));
$('btn-recomecar').addEventListener('click', () => comecarPartida(true));
$('btn-trocar-vitoria').addEventListener('click', () => abrirSelecao());
$('btn-trocar-derrota').addEventListener('click', () => abrirSelecao());

window.addEventListener('resize', () => {
  ajustarCamera();
  renderizador.setSize(window.innerWidth, window.innerHeight);
});

// Gancho para testes automáticos (teste.html) e depuração no console
window.guizinhoDebug = { jogador, inimigos, chefao, portal, fase, som, contagem, salvamento, itens, checkpoints, passo: (dt, desenhar = false) => passo(dt, desenhar), get estado() { return estado; } };

// ----- Loop principal -----
const relogio = new THREE.Clock();
const LONGE = { posicao: new THREE.Vector3(0, -999, 0) };
let ultimoErro = '';
function quadro() {
  requestAnimationFrame(quadro);
  try {
    passo(Math.min(relogio.getDelta(), 0.05));
  } catch (erro) {
    // Mostra o erro na tela (ajuda a relatar problemas no celular) sem travar o jogo
    const texto = `Erro: ${erro.message}`;
    if (texto !== ultimoErro) {
      ultimoErro = texto;
      console.error(erro);
      $('erro').textContent = `${texto}\n${(erro.stack || '').split('\n').slice(1, 3).join('\n')}`;
      $('erro').classList.remove('oculto');
    }
  }
}

function passo(dt, desenhar = true) {
  const pediuPausa = entrada.consumirPausa(); // Esc ou P
  if (pediuPausa && estado === 'jogando') pausar();
  else if (pediuPausa && estado === 'pausado') { retomar(); return; }
  if (estado === 'pausado') { // tudo congelado: só desenha
    entrada.consumirGiro();
    if (desenhar) renderizador.render(cena, camera);
    return;
  }
  fase.atualizar(dt, corpos, jogador.posicao);

  if (estado === 'jogando' || estado === 'caindo') {
    const giro = entrada.consumirGiro();
    cameraSeguidora.aplicarGiro(giro.x, giro.y);

    if (estado === 'jogando') {
      partida.tempo += dt;
      // Trilha: alegre na floresta, misteriosa no Bosque Escuro (fase.musicaEm)
      som.musica(chefao.acordado ? 'chefao' : fase.musicaEm(jogador.posicao));
      jogador.atualizar(dt, entrada, cameraSeguidora.eixos(), fase, projeteis);
      if (jogador.quicou) particulas.explosao(jogador.posicao, 0xff6b9d, 10, 4);
      itens.atualizar(dt, jogador, particulas, aoColetar);
      checkpoints.atualizar(dt, jogador, particulas, aoAtivarCheckpoint);
      verificarAvisos();
      if (tempoAbrirPortal > 0) {
        tempoAbrirPortal -= dt;
        if (tempoAbrirPortal <= 0 && chefao.derrotado) {
          portal.abrir(true);
          som.efeito('portal');
          particulas.explosao(portal.posicao.clone().setY(portal.posicao.y + 1.6), 0x5ad1ff, 30, 6);
        }
      }
      if (portal.atualizar(dt, jogador)) {
        particulas.explosao(jogador.posicao.clone().setY(jogador.posicao.y + 1), 0x5ad1ff, 30, 7);
        vencer();
      } else if (jogador.vida <= 0) {
        estado = 'caindo';
        registrarFim('derrota');
        tempoAnimacao = 1.2;
        jogador.modelo.visible = false;
        som.musica(null);
        som.efeito('derrota');
        particulas.explosao(jogador.posicao.clone().setY(jogador.posicao.y + 0.8), 0x4cd137, 24, 6);
      }
    } else {
      tempoAnimacao -= dt;
      if (tempoAnimacao <= 0) {
        estado = 'derrota';
        mostrarTela('derrota');
      }
    }
    inimigos.atualizar(dt, jogador, fase.caixas, particulas, projeteis);
    projeteis.atualizar(dt, jogador, inimigos, fase.caixas, particulas);
    atualizarHud();

    if (tempoMensagem > 0) {
      tempoMensagem -= dt;
      if (tempoMensagem <= 0) $('mensagem').classList.add('oculto');
    }
  } else if (estado === 'selecao') {
    jogador.girarVitrine(dt);
  } else {
    // Telas: o cenário continua vivo ao fundo
    cameraSeguidora.angulo += dt * 0.15;
    portal.atualizar(dt, LONGE);
  }
  particulas.atualizar(dt);
  cameraSeguidora.atualizar(jogador.posicao, dt);
  if (desenhar) renderizador.render(cena, camera);
}
requestAnimationFrame(quadro);
