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

configurarApp();

const PONTOS = { cristal: 10, estrela: 100 };
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
const corpos = [jogador, ...inimigos.lista]; // carregados pelas plataformas móveis
cameraSeguidora.atualizar(jogador.posicao, 0, true);

// ----- Elementos da interface -----
const $ = (id) => document.getElementById(id);
const telas = {
  inicial: $('tela-inicial'), selecao: $('tela-selecao'), vitoria: $('tela-vitoria'), derrota: $('tela-derrota'),
};
const hud = $('hud');
const controlesToque = $('controles-toque');
$('dica').textContent = ehToque
  ? 'Joystick: mover (empurre até o fim para correr) · Arraste a tela: girar câmera'
  : 'WASD: mover · Espaço: pular · J: atacar · Shift: correr · Arraste o mouse: girar câmera';

// ----- Estado da partida -----
// estado: 'inicio' | 'selecao' | 'jogando' | 'caindo' (animação de derrota) | 'vitoria' | 'derrota'
let estado = 'inicio';
let tempoAnimacao = 0;
let tempoMensagem = 0;
const partida = { cristais: 0, estrelas: 0, pontos: 0, tempo: 0 };
const avisosVistos = new Set();
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

function abrirSelecao() {
  estado = 'selecao';
  jogador.reiniciar(true);
  escolherPersonagem(jogador.id);
  cameraSeguidora.distancia = 6;
  cameraSeguidora.inclinacao = 0.08;
  cameraSeguidora.alturaAlvo = -0.3; // olha abaixo do herói para ele aparecer acima dos cartões
  cameraSeguidora.angulo = 0;
  mostrarTela('selecao');
}

// ----- Partida -----
function comecarPartida(voltarAoInicio) {
  if (voltarAoInicio) {
    Object.assign(partida, { cristais: 0, estrelas: 0, pontos: 0, tempo: 0 });
    avisosVistos.clear();
    itens.reiniciar();
    checkpoints.reiniciar();
    inimigos.reiniciar();
  }
  projeteis.limpar();
  jogador.reiniciar(voltarAoInicio);
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
  const min = Math.floor(partida.tempo / 60), seg = Math.floor(partida.tempo % 60);
  $('resumo').innerHTML = `
    <span>Herói</span><b>${jogador.personagem.nome}</b>
    <span>Inimigos derrotados</span><b>${inimigos.derrotados}</b>
    <span>Tempo</span><b>${min}:${String(seg).padStart(2, '0')}</b>
    <span>Pontos</span><b>${pontosTotais()}</b>`;
  mostrarTela('vitoria');
}

montarCartoes();
$('btn-jogar').addEventListener('click', () => abrirSelecao());
$('btn-comecar').addEventListener('click', () => {
  comecarPartida(true);
  $('dica').classList.remove('oculto');
  setTimeout(() => $('dica').classList.add('oculto'), 8000);
});
$('btn-voltar').addEventListener('click', () => { estado = 'inicio'; mostrarTela('inicial'); });
$('btn-de-novo').addEventListener('click', () => comecarPartida(true));
$('btn-tentar').addEventListener('click', () => comecarPartida(false));
$('btn-recomecar').addEventListener('click', () => comecarPartida(true));
$('btn-trocar-vitoria').addEventListener('click', () => abrirSelecao());
$('btn-trocar-derrota').addEventListener('click', () => abrirSelecao());

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth, window.innerHeight);
});

// Gancho para testes automáticos (teste.html) e depuração no console
window.guizinhoDebug = { jogador, inimigos, fase, passo: (dt, desenhar = false) => passo(dt, desenhar), get estado() { return estado; } };

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
  fase.atualizar(dt, corpos, jogador.posicao);

  if (estado === 'jogando' || estado === 'caindo') {
    const giro = entrada.consumirGiro();
    cameraSeguidora.aplicarGiro(giro.x, giro.y);

    if (estado === 'jogando') {
      partida.tempo += dt;
      jogador.atualizar(dt, entrada, cameraSeguidora.eixos(), fase, projeteis);
      if (jogador.quicou) particulas.explosao(jogador.posicao, 0xff6b9d, 10, 4);
      itens.atualizar(dt, jogador, particulas, aoColetar);
      checkpoints.atualizar(dt, jogador, particulas, aoAtivarCheckpoint);
      verificarAvisos();
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
