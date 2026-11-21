// Guizinho: modelo provisório low-poly, movimento, pulo, ataque e vida.
import * as THREE from 'three';
import { GRAVIDADE, moverComColisao } from './fisica.js';

const VELOCIDADE = 6;
const VELOCIDADE_CORRIDA = 10;
const FORCA_PULO = 12;
const TEMPO_COYOTE = 0.1;  // ainda pode pular logo após sair da borda
const BUFFER_PULO = 0.12;  // pulo apertado um pouco antes de tocar o chão
const ACELERACAO = 40;
const VIDA_MAX = 3;
const TEMPO_INVENCIVEL = 1.5;
const DURACAO_ATAQUE = 0.3;
const RECARGA_ATAQUE = 0.4;

function criarModeloGuizinho() {
  const grupo = new THREE.Group();
  const mat = (cor) => new THREE.MeshLambertMaterial({ color: cor, flatShading: true });
  const verde = mat(0x4cd137);
  const laranja = mat(0xff8a1f);
  const escuro = mat(0x2b2b2b);
  const branco = mat(0xffffff);

  const parte = (geo, material, x, y, z) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    grupo.add(m);
    return m;
  };

  // Pernas e pés
  parte(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 6), verde, -0.16, 0.25, 0);
  parte(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 6), verde, 0.16, 0.25, 0);
  parte(new THREE.BoxGeometry(0.26, 0.14, 0.38), laranja, -0.16, 0.07, 0.06);
  parte(new THREE.BoxGeometry(0.26, 0.14, 0.38), laranja, 0.16, 0.07, 0.06);
  // Corpo (camisa laranja)
  parte(new THREE.CylinderGeometry(0.32, 0.36, 0.6, 8), laranja, 0, 0.8, 0);
  // Braços
  const bracoE = parte(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6), verde, -0.45, 0.82, 0);
  const bracoD = parte(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6), verde, 0.45, 0.82, 0);
  bracoE.rotation.z = 0.25; bracoD.rotation.z = -0.25;
  // Cabeça verde
  parte(new THREE.IcosahedronGeometry(0.34, 1), verde, 0, 1.36, 0);
  // Máscara (faixa escura sobre os olhos) e olhos
  parte(new THREE.BoxGeometry(0.62, 0.16, 0.2), escuro, 0, 1.4, 0.2);
  parte(new THREE.SphereGeometry(0.06, 6, 4), branco, -0.12, 1.4, 0.31);
  parte(new THREE.SphereGeometry(0.06, 6, 4), branco, 0.12, 1.4, 0.31);
  // Cabelo espetado
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.35;
    const fio = parte(new THREE.ConeGeometry(0.1, 0.32, 5), laranja,
      Math.sin(a) * 0.2, 1.66, -0.05 + Math.cos(a) * 0.02);
    fio.rotation.z = -a * 0.8;
    fio.rotation.x = -0.3;
  }

  // Brilho do soco energético (aparece só durante o ataque)
  const energia = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.3, 1),
    new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.85 }),
  );
  energia.position.set(0.3, 0.85, 0.85);
  energia.visible = false;
  grupo.add(energia);

  return { grupo, bracoE, bracoD, energia };
}

export class Jogador {
  constructor(cena, pontoInicial) {
    const modelo = criarModeloGuizinho();
    this.modelo = modelo.grupo;
    this.bracos = [modelo.bracoE, modelo.bracoD];
    this.energia = modelo.energia;
    cena.add(this.modelo);

    this.raio = 0.45;
    this.altura = 1.6;
    this.vidaMax = VIDA_MAX;
    this.posicao = new THREE.Vector3();
    this.velocidade = new THREE.Vector3();
    this.atingidos = new Set(); // inimigos já acertados no golpe atual
    this._pontoGolpe = new THREE.Vector3();
    this.pontoInicial = pontoInicial.clone();
    this.pontoRenascer = pontoInicial.clone(); // muda ao tocar num checkpoint
    this.reiniciar(true);
  }

  /** Vida cheia; volta ao último checkpoint, ou ao início da fase se voltarAoInicio. */
  reiniciar(voltarAoInicio = false) {
    if (voltarAoInicio) this.pontoRenascer.copy(this.pontoInicial);
    this.vida = VIDA_MAX;
    this.renascer();
    this.modelo.visible = true;
  }

  curar() {
    this.vida = Math.min(VIDA_MAX, this.vida + 1);
  }

  /** Volta ao ponto de renascimento (mantém a vida). */
  renascer() {
    this.posicao.copy(this.pontoRenascer);
    this.velocidade.set(0, 0, 0);
    this.noChao = false;
    this.tempoForaDoChao = 0;
    this.tempoPulo = 99;
    this.tempoAtaque = 99;
    this.angulo = 0;
    this.tempoAnimacao = 0;
    this.tempoInvencivel = 1;
  }

  golpeAtivo() {
    return this.tempoAtaque > 0.05 && this.tempoAtaque < 0.22;
  }

  /** Centro da área do soco, um pouco à frente do Guizinho. */
  pontoGolpe() {
    return this._pontoGolpe.set(
      this.posicao.x + Math.sin(this.angulo) * 0.9,
      this.posicao.y + 0.8,
      this.posicao.z + Math.cos(this.angulo) * 0.9,
    );
  }

  /** Leva dano vindo da posição (x, z). Retorna true se o dano foi aplicado. */
  levarDano(origemX, origemZ) {
    if (this.tempoInvencivel > 0 || this.vida <= 0) return false;
    this.vida--;
    this.tempoInvencivel = TEMPO_INVENCIVEL;
    const dx = this.posicao.x - origemX, dz = this.posicao.z - origemZ;
    const d = Math.hypot(dx, dz) || 1;
    this.velocidade.set(dx / d * 8, 7, dz / d * 8);
    this.noChao = false;
    return true;
  }

  atualizar(dt, entrada, eixos, caixas) {
    this.tempoInvencivel = Math.max(0, this.tempoInvencivel - dt);
    const empurrado = this.tempoInvencivel > TEMPO_INVENCIVEL - 0.3; // sem controle logo após levar dano

    // ----- Direção relativa à câmera -----
    const dir = entrada.direcao();
    const mx = eixos.frente.x * dir.y + eixos.direita.x * dir.x;
    const mz = eixos.frente.z * dir.y + eixos.direita.z * dir.x;
    const vMax = entrada.correndo() ? VELOCIDADE_CORRIDA : VELOCIDADE;
    if (!empurrado) {
      const passo = ACELERACAO * dt * (this.noChao ? 1 : 0.6);
      this.velocidade.x += THREE.MathUtils.clamp(mx * vMax - this.velocidade.x, -passo, passo);
      this.velocidade.z += THREE.MathUtils.clamp(mz * vMax - this.velocidade.z, -passo, passo);
    }

    // ----- Ataque -----
    this.tempoAtaque += dt;
    if (entrada.consumirAtaque() && this.tempoAtaque > RECARGA_ATAQUE) {
      this.tempoAtaque = 0;
      this.atingidos.clear();
      // Vira na direção do joystick/teclas na hora do soco e dá um passinho à frente
      if (Math.hypot(mx, mz) > 0.2) this.angulo = Math.atan2(mx, mz);
      this.velocidade.x += Math.sin(this.angulo) * 3;
      this.velocidade.z += Math.cos(this.angulo) * 3;
    }

    // ----- Pulo -----
    if (entrada.consumirPulo()) this.tempoPulo = 0;
    else this.tempoPulo += dt;
    this.tempoForaDoChao = this.noChao ? 0 : this.tempoForaDoChao + dt;
    if (this.tempoPulo < BUFFER_PULO && this.tempoForaDoChao < TEMPO_COYOTE) {
      this.velocidade.y = FORCA_PULO;
      this.tempoPulo = 99;
      this.tempoForaDoChao = 99;
    }
    this.velocidade.y = Math.max(this.velocidade.y + GRAVIDADE * dt, -40);

    // ----- Movimento + colisão -----
    this.noChao = moverComColisao(this, caixas, dt);

    // Caiu no vazio: perde 1 coração e volta ao início
    if (this.posicao.y < -25) {
      this.vida--;
      if (this.vida > 0) this.renascer();
    }

    this._atualizarVisual(dt);
  }

  _atualizarVisual(dt) {
    const vHoriz = Math.hypot(this.velocidade.x, this.velocidade.z);
    const atacando = this.tempoAtaque < DURACAO_ATAQUE;
    if (vHoriz > 0.3 && !atacando) {
      const alvo = Math.atan2(this.velocidade.x, this.velocidade.z);
      const diff = Math.atan2(Math.sin(alvo - this.angulo), Math.cos(alvo - this.angulo));
      this.angulo += diff * Math.min(1, 15 * dt);
    }
    this.tempoAnimacao += dt * vHoriz * 1.6;
    const balanco = this.noChao ? Math.sin(this.tempoAnimacao) * Math.min(1, vHoriz / 6) : 0;
    const [bracoE, bracoD] = this.bracos;
    bracoE.rotation.x = balanco * 0.8;
    if (atacando) {
      // Soco: braço direito esticado para frente
      bracoD.rotation.x = Math.PI / 2;
      bracoD.position.z = 0.35;
      const t = this.tempoAtaque / DURACAO_ATAQUE;
      this.energia.visible = true;
      this.energia.scale.setScalar(0.6 + Math.sin(t * Math.PI) * 0.8);
      this.energia.rotation.y += dt * 20;
    } else {
      bracoD.rotation.x = -balanco * 0.8;
      bracoD.position.z = 0;
      this.energia.visible = false;
    }

    this.modelo.position.copy(this.posicao);
    this.modelo.position.y += this.noChao ? Math.abs(balanco) * 0.06 : 0;
    this.modelo.rotation.y = this.angulo;
    // Pisca enquanto está invencível
    this.modelo.visible = this.tempoInvencivel <= 0 || Math.floor(this.tempoInvencivel * 12) % 2 === 0;
  }
}
