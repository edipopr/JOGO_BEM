// Guizinho: modelo provisório low-poly, movimento, pulo e colisão.
import * as THREE from 'three';

const RAIO = 0.45;
const ALTURA = 1.6;
const VELOCIDADE = 6;
const VELOCIDADE_CORRIDA = 10;
const GRAVIDADE = -32;
const FORCA_PULO = 12;
const TEMPO_COYOTE = 0.1;  // ainda pode pular logo após sair da borda
const BUFFER_PULO = 0.12;  // pulo apertado um pouco antes de tocar o chão
const ACELERACAO = 40;

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

  return { grupo, bracoE, bracoD };
}

export class Jogador {
  constructor(cena, pontoInicial) {
    const modelo = criarModeloGuizinho();
    this.modelo = modelo.grupo;
    this.bracos = [modelo.bracoE, modelo.bracoD];
    cena.add(this.modelo);

    this.posicao = new THREE.Vector3();
    this.velocidade = new THREE.Vector3();
    this.noChao = false;
    this.tempoForaDoChao = 0;
    this.tempoPulo = 99;
    this.angulo = 0;
    this.tempoAnimacao = 0;
    this.pontoInicial = pontoInicial.clone();
    this.renascer();
  }

  renascer() {
    this.posicao.copy(this.pontoInicial);
    this.velocidade.set(0, 0, 0);
  }

  atualizar(dt, entrada, eixos, caixas) {
    // ----- Direção relativa à câmera -----
    const dir = entrada.direcao();
    const mx = eixos.frente.x * dir.y + eixos.direita.x * dir.x;
    const mz = eixos.frente.z * dir.y + eixos.direita.z * dir.x;
    const vMax = entrada.correndo() ? VELOCIDADE_CORRIDA : VELOCIDADE;
    const alvoX = mx * vMax, alvoZ = mz * vMax;
    const passo = ACELERACAO * dt * (this.noChao ? 1 : 0.6);
    this.velocidade.x += THREE.MathUtils.clamp(alvoX - this.velocidade.x, -passo, passo);
    this.velocidade.z += THREE.MathUtils.clamp(alvoZ - this.velocidade.z, -passo, passo);

    // ----- Pulo -----
    if (entrada.consumirPulo()) this.tempoPulo = 0;
    else this.tempoPulo += dt;
    this.tempoForaDoChao = this.noChao ? 0 : this.tempoForaDoChao + dt;
    if (this.tempoPulo < BUFFER_PULO && this.tempoForaDoChao < TEMPO_COYOTE) {
      this.velocidade.y = FORCA_PULO;
      this.tempoPulo = 99;
      this.tempoForaDoChao = 99;
      this.noChao = false;
    }
    this.velocidade.y = Math.max(this.velocidade.y + GRAVIDADE * dt, -40);

    // ----- Movimento + colisão -----
    this.posicao.x += this.velocidade.x * dt;
    this.posicao.z += this.velocidade.z * dt;
    this._colisaoHorizontal(caixas);

    const yAnterior = this.posicao.y;
    this.posicao.y += this.velocidade.y * dt;
    this._colisaoVertical(caixas, yAnterior);

    if (this.posicao.y < -25) this.renascer();

    // ----- Visual -----
    const vHoriz = Math.hypot(this.velocidade.x, this.velocidade.z);
    if (vHoriz > 0.3) {
      const alvo = Math.atan2(this.velocidade.x, this.velocidade.z);
      let diff = alvo - this.angulo;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      this.angulo += diff * Math.min(1, 15 * dt);
    }
    this.tempoAnimacao += dt * vHoriz * 1.6;
    const balanco = this.noChao ? Math.sin(this.tempoAnimacao) * Math.min(1, vHoriz / 6) : 0;
    this.bracos[0].rotation.x = balanco * 0.8;
    this.bracos[1].rotation.x = -balanco * 0.8;
    this.modelo.position.copy(this.posicao);
    this.modelo.position.y += this.noChao ? Math.abs(balanco) * 0.06 : 0;
    this.modelo.rotation.y = this.angulo;
  }

  _colisaoHorizontal(caixas) {
    const p = this.posicao;
    for (const c of caixas) {
      // Só colide lateralmente se o corpo estiver na altura da caixa
      if (p.y >= c.max.y - 0.01 || p.y + ALTURA <= c.min.y) continue;
      const px = THREE.MathUtils.clamp(p.x, c.min.x, c.max.x);
      const pz = THREE.MathUtils.clamp(p.z, c.min.z, c.max.z);
      const dx = p.x - px, dz = p.z - pz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= RAIO * RAIO) continue;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        p.x = px + dx / d * RAIO;
        p.z = pz + dz / d * RAIO;
      } else {
        // Centro dentro da caixa: empurra pelo lado mais próximo
        const saidas = [
          [c.min.x - RAIO - p.x, 0], [c.max.x + RAIO - p.x, 0],
          [0, c.min.z - RAIO - p.z], [0, c.max.z + RAIO - p.z],
        ];
        saidas.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
        p.x += saidas[0][0]; p.z += saidas[0][1];
      }
    }
  }

  _colisaoVertical(caixas, yAnterior) {
    const p = this.posicao;
    const r = RAIO * 0.85; // um pouco menor para não "grudar" nas bordas
    this.noChao = false;
    for (const c of caixas) {
      if (p.x + r <= c.min.x || p.x - r >= c.max.x || p.z + r <= c.min.z || p.z - r >= c.max.z) continue;
      if (this.velocidade.y <= 0 && yAnterior >= c.max.y - 0.05 && p.y <= c.max.y) {
        p.y = c.max.y;
        this.velocidade.y = 0;
        this.noChao = true;
      } else if (this.velocidade.y > 0 && yAnterior + ALTURA <= c.min.y + 0.01 && p.y + ALTURA > c.min.y) {
        p.y = c.min.y - ALTURA;
        this.velocidade.y = 0;
      }
    }
  }
}
