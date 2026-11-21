// Ponto de entrada: cria a cena, as telas e roda o loop do jogo.
import * as THREE from 'three';
import { Entrada, ehToque } from './entrada.js';
import { CameraSeguidora } from './camera.js';
import { Jogador } from './jogador.js';
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
const cameraSeguidora = new CameraSeguidora(camera);
cameraSeguidora.atualizar(jogador.posicao, 0, true);

// ----- Telas e HUD -----
const telaInicial = document.getElementById('tela-inicial');
const hud = document.getElementById('hud');
const controlesToque = document.getElementById('controles-toque');
document.getElementById('dica').textContent = ehToque
  ? 'Joystick: mover (empurre até o fim para correr) · Arraste a tela: girar câmera'
  : 'WASD: mover · Espaço: pular · Shift: correr · Arraste o mouse: girar câmera';

let jogando = false;
document.getElementById('btn-jogar').addEventListener('click', () => {
  jogando = true;
  telaInicial.classList.add('oculto');
  hud.classList.remove('oculto');
  if (ehToque) controlesToque.classList.remove('oculto');
  entrada.consumirPulo();
  setTimeout(() => document.getElementById('dica').classList.add('oculto'), 8000);
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
    jogador.atualizar(dt, entrada, cameraSeguidora.eixos(), fase.caixas);
  } else {
    cameraSeguidora.angulo += dt * 0.15; // câmera girando devagar na tela inicial
  }
  cameraSeguidora.atualizar(jogador.posicao, dt);
  renderizador.render(cena, camera);
  requestAnimationFrame(quadro);
}
requestAnimationFrame(quadro);
