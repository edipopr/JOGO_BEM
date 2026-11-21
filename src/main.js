// Ponto de entrada: cria a cena, as telas e roda o loop do jogo.
import * as THREE from 'three';
import { Entrada, ehToque } from './entrada.js';
import { CameraSeguidora } from './camera.js';
import { Jogador } from './jogador.js';
import { GerenciadorInimigos } from './inimigo.js';
import { Particulas } from './particulas.js';
import { GerenciadorItens, Checkpoints, Portal } from './itens.js';
import { criarFaseTeste } from './fase.js';
import { configurarApp } from './pwa.js';

configurarApp();

const PONTOS = { cristal: 10, estrela: 100, inimigo: 50 };

// ----- Cena -----
const container = document.getElementById('jogo');
const renderizador = new THREE.WebGLRenderer({ antialias: true });
renderizador.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderizador.domElement);

const cena = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

const fase = criarFaseTeste(cena);
const entrada = new Entrada(container);
const jogador = new Jogador(cena, fase.pontoInicial);
const inimigos = new GerenciadorInimigos(cena, fase.inimigos);
const itens = new GerenciadorItens(cena, fase.itens);
const checkpoints = new Checkpoints(cena, fase.checkpoints);
const portal = new Portal(cena, fase.portal);
const particulas = new Particulas(cena);
const cameraSeguidora = new CameraSeguidora(camera);
cameraSeguidora.atualizar(jogador.posicao, 0, true);

// ----- Elementos da interface -----
const $ = (id) => document.getElementById(id);
const telas = { inicial: $('tela-inicial'), vitoria: $('tela-vitoria'), derrota: $('tela-derrota') };
const hud = $('hud');
const controlesToque = $('controles-toque');
$('dica').textContent = ehToque
  ? 'Joystick: mover (empurre até o fim para correr) · Arraste a tela: girar câmera'
  : 'WASD: mover · Espaço: pular · J: atacar · Shift: correr · Arraste o mouse: girar câmera';

// ----- Estado da partida -----
// estado: 'inicio' | 'jogando' | 'caindo' (animação de derrota) | 'vitoria' | 'derrota'
let estado = 'inicio';
let tempoAnimacao = 0;
let tempoMensagem = 0;
const partida = { cristais: 0, estrelas: 0, pontos: 0, tempo: 0 };
const totalCristais = itens.total('cristal');
const totalEstrelas = itens.total('estrela');

function mostrarTela(nome) {
  for (const [chave, el] of Object.entries(telas)) el.classList.toggle('oculto', chave !== nome);
  const emJogo = nome === null;
  hud.classList.toggle('oculto', !emJogo);
  controlesToque.classList.toggle('oculto', !(emJogo && ehToque));
}

function mostrarMensagem(texto, segundos = 1.5) {
  $('mensagem').textContent = texto;
  $('mensagem').classList.remove('oculto');
  tempoMensagem = segundos;
}

function pulsar(el) {
  el.classList.remove('pulsar');
  void el.offsetWidth; // reinicia a animação
  el.classList.add('pulsar');
}

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
  $('pontos').textContent = `${partida.pontos + inimigos.derrotados * PONTOS.inimigo} pts`;
}

function comecarPartida(voltarAoInicio) {
  if (voltarAoInicio) {
    Object.assign(partida, { cristais: 0, estrelas: 0, pontos: 0, tempo: 0 });
    itens.reiniciar();
    checkpoints.reiniciar();
    inimigos.reiniciar();
  }
  jogador.reiniciar(voltarAoInicio);
  cameraSeguidora.atualizar(jogador.posicao, 0, true);
  entrada.consumirPulo();
  entrada.consumirAtaque();
  estado = 'jogando';
  mostrarTela(null);
}

function aoColetar(tipo) {
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
}

function aoAtivarCheckpoint(posicao) {
  jogador.pontoRenascer.copy(posicao);
  mostrarMensagem('Checkpoint!', 1.5);
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
  const min = Math.floor(partida.tempo / 60), seg = Math.floor(partida.tempo % 60);
  const total = partida.pontos + inimigos.derrotados * PONTOS.inimigo;
  $('resumo').innerHTML = `
    <span>Gosmas derrotadas</span><b>${inimigos.derrotados}</b>
    <span>Tempo</span><b>${min}:${String(seg).padStart(2, '0')}</b>
    <span>Pontos</span><b>${total}</b>`;
  mostrarTela('vitoria');
}

$('btn-jogar').addEventListener('click', () => {
  comecarPartida(true);
  setTimeout(() => $('dica').classList.add('oculto'), 8000);
});
$('btn-de-novo').addEventListener('click', () => comecarPartida(true));
$('btn-tentar').addEventListener('click', () => comecarPartida(false));
$('btn-recomecar').addEventListener('click', () => comecarPartida(true));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth, window.innerHeight);
});

// ----- Loop principal -----
const relogio = new THREE.Clock();
function quadro() {
  const dt = Math.min(relogio.getDelta(), 0.05);

  if (estado === 'jogando' || estado === 'caindo') {
    const giro = entrada.consumirGiro();
    cameraSeguidora.aplicarGiro(giro.x, giro.y);

    if (estado === 'jogando') {
      partida.tempo += dt;
      jogador.atualizar(dt, entrada, cameraSeguidora.eixos(), fase.caixas);
      itens.atualizar(dt, jogador, particulas, aoColetar);
      checkpoints.atualizar(dt, jogador, particulas, aoAtivarCheckpoint);
      if (portal.atualizar(dt, jogador)) {
        particulas.explosao(jogador.posicao.clone().setY(jogador.posicao.y + 1), 0x5ad1ff, 30, 7);
        vencer();
      } else if (jogador.vida <= 0) {
        estado = 'caindo';
        tempoAnimacao = 1.2;
        jogador.modelo.visible = false;
        particulas.explosao(jogador.posicao.clone().setY(jogador.posicao.y + 0.8), 0x4cd137, 24, 6);
      }
    } else {
      tempoAnimacao -= dt;
      if (tempoAnimacao <= 0) {
        estado = 'derrota';
        mostrarTela('derrota');
      }
    }
    inimigos.atualizar(dt, jogador, fase.caixas, particulas);
    atualizarHud();

    if (tempoMensagem > 0) {
      tempoMensagem -= dt;
      if (tempoMensagem <= 0) $('mensagem').classList.add('oculto');
    }
  } else {
    // Telas: o cenário continua vivo ao fundo
    cameraSeguidora.angulo += dt * 0.15;
    portal.atualizar(dt, { posicao: new THREE.Vector3(0, -999, 0) });
  }
  particulas.atualizar(dt);
  cameraSeguidora.atualizar(jogador.posicao, dt);
  renderizador.render(cena, camera);
  requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
