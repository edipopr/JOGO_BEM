// Ponto de entrada: cria a cena, as telas e roda o loop do jogo.
import * as THREE from 'three';
import { Entrada, ehToque } from './entrada.js';
import { CameraSeguidora } from './camera.js';
import { Jogador } from './jogador.js';
import { GerenciadorInimigos } from './inimigo.js';
import { Particulas } from './particulas.js';
import { criarFaseTeste } from './fase.js';

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
const particulas = new Particulas(cena);
const cameraSeguidora = new CameraSeguidora(camera);
cameraSeguidora.atualizar(jogador.posicao, 0, true);

// ----- Telas e HUD -----
const telaInicial = document.getElementById('tela-inicial');
const hud = document.getElementById('hud');
const controlesToque = document.getElementById('controles-toque');
const elCoracoes = document.getElementById('coracoes');
const elMensagem = document.getElementById('mensagem');
const elDica = document.getElementById('dica');
elDica.textContent = ehToque
  ? 'Joystick: mover (empurre até o fim para correr) · Arraste a tela: girar câmera'
  : 'WASD: mover · Espaço: pular · J: atacar · Shift: correr · Arraste o mouse: girar câmera';

let vidaMostrada = -1;
function atualizarCoracoes() {
  if (jogador.vida === vidaMostrada) return;
  vidaMostrada = jogador.vida;
  elCoracoes.innerHTML = '';
  for (let i = 0; i < jogador.vidaMax; i++) {
    const c = document.createElement('span');
    c.className = 'coracao' + (i < jogador.vida ? '' : ' vazio');
    c.textContent = '♥';
    elCoracoes.appendChild(c);
  }
}

let tempoMensagem = 0;
function mostrarMensagem(texto, segundos) {
  elMensagem.textContent = texto;
  elMensagem.classList.remove('oculto');
  tempoMensagem = segundos;
}

let jogando = false;
let tempoDerrota = 0; // > 0 enquanto mostra "você foi derrotado"
document.getElementById('btn-jogar').addEventListener('click', () => {
  jogando = true;
  telaInicial.classList.add('oculto');
  hud.classList.remove('oculto');
  if (ehToque) controlesToque.classList.remove('oculto');
  entrada.consumirPulo();
  entrada.consumirAtaque();
  setTimeout(() => elDica.classList.add('oculto'), 8000);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderizador.setSize(window.innerWidth, window.innerHeight);
});

// ----- Loop principal -----
const relogio = new THREE.Clock();
function quadro() {
  const dt = Math.min(relogio.getDelta(), 0.05);
  if (jogando) {
    const giro = entrada.consumirGiro();
    cameraSeguidora.aplicarGiro(giro.x, giro.y);

    if (tempoDerrota > 0) {
      tempoDerrota -= dt;
      if (tempoDerrota <= 0) {
        jogador.reiniciar();
        jogador.modelo.visible = true;
      }
    } else {
      jogador.atualizar(dt, entrada, cameraSeguidora.eixos(), fase.caixas);
      if (jogador.vida <= 0) {
        // Derrota provisória (a tela de derrota completa vem na Fase 3)
        tempoDerrota = 2;
        jogador.modelo.visible = false;
        particulas.explosao(jogador.posicao.clone().setY(jogador.posicao.y + 0.8), 0x4cd137, 24, 6);
        mostrarMensagem('Você foi derrotado! Tentando de novo...', 2);
      }
    }
    inimigos.atualizar(dt, jogador, fase.caixas, particulas);
    particulas.atualizar(dt);
    atualizarCoracoes();

    if (tempoMensagem > 0) {
      tempoMensagem -= dt;
      if (tempoMensagem <= 0) elMensagem.classList.add('oculto');
    }
  } else {
    cameraSeguidora.angulo += dt * 0.15; // câmera girando devagar na tela inicial
  }
  cameraSeguidora.atualizar(jogador.posicao, dt);
  renderizador.render(cena, camera);
  requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
