// Criaturas contaminadas: gosmas roxas que vagam e perseguem o jogador.
import * as THREE from 'three';
import { GRAVIDADE, moverComColisao } from './fisica.js';

const VIDA = 2;
const VELOCIDADE_PERSEGUIR = 3.2;
const VELOCIDADE_VAGAR = 1.4;
const DISTANCIA_VISAO = 10;
const DISTANCIA_MAX_CASA = 16; // não se afasta demais de onde nasceu
const TEMPO_RENASCER = 8;
const COR_GOSMA = 0x7a3cff;

function criarModeloGosma() {
  const grupo = new THREE.Group();
  const material = new THREE.MeshLambertMaterial({ color: COR_GOSMA, flatShading: true, emissive: 0x000000 });
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), material);
  corpo.scale.set(1, 0.75, 1);
  corpo.position.y = 0.45;
  corpo.castShadow = true;
  grupo.add(corpo);

  // Manchas escuras da infecção
  const matMancha = new THREE.MeshLambertMaterial({ color: 0x2a0b5c, flatShading: true });
  for (const [x, y, z] of [[0.3, 0.25, -0.4], [-0.4, 0.2, -0.2], [0, 0.55, -0.3]]) {
    const mancha = new THREE.Mesh(new THREE.SphereGeometry(0.14, 5, 4), matMancha);
    mancha.position.set(x, y, z);
    corpo.add(mancha);
  }
  // Olhos brilhantes
  const matOlho = new THREE.MeshBasicMaterial({ color: 0xc6ff3d });
  const matPupila = new THREE.MeshBasicMaterial({ color: 0x111111 });
  for (const x of [-0.2, 0.2]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.13, 6, 5), matOlho);
    olho.position.set(x, 0.2, 0.48);
    const pupila = new THREE.Mesh(new THREE.SphereGeometry(0.06, 5, 4), matPupila);
    pupila.position.set(0, 0, 0.1);
    olho.add(pupila);
    corpo.add(olho);
  }
  return { grupo, corpo, material };
}

export class Inimigo {
  constructor(cena, pontoInicial) {
    const modelo = criarModeloGosma();
    this.modelo = modelo.grupo;
    this.corpo = modelo.corpo;
    this.material = modelo.material;
    cena.add(this.modelo);

    this.casa = pontoInicial.clone();
    this.posicao = new THREE.Vector3();
    this.velocidade = new THREE.Vector3();
    this.raio = 0.6;
    this.altura = 0.9;
    this.tempo = Math.random() * 10;
    this.renascer();
  }

  renascer() {
    this.ativo = true;
    this.vida = VIDA;
    this.posicao.copy(this.casa);
    this.velocidade.set(0, 0, 0);
    this.tempoAtordoado = 0;
    this.tempoBrilho = 0;
    this.tempoNovaDirecao = 0;
    this.direcaoVagar = { x: 0, z: 0 };
    this.angulo = 0;
    this.modelo.visible = true;
  }

  derrotar() {
    this.ativo = false;
    this.modelo.visible = false;
    this.tempoRenascer = TEMPO_RENASCER;
  }

  /** Recebe um golpe vindo da direção (dx, dz). Retorna true se foi derrotado. */
  receberDano(dx, dz) {
    this.vida--;
    this.tempoBrilho = 0.15;
    this.tempoAtordoado = 0.45;
    const d = Math.hypot(dx, dz) || 1;
    this.velocidade.set(dx / d * 9, 5, dz / d * 9);
    if (this.vida <= 0) {
      this.derrotar();
      return true;
    }
    return false;
  }

  atualizar(dt, jogador, caixas) {
    if (!this.ativo) {
      this.tempoRenascer -= dt;
      if (this.tempoRenascer <= 0) this.renascer();
      return;
    }
    this.tempo += dt;
    const p = this.posicao, v = this.velocidade;

    // ----- Decidir para onde ir -----
    let alvoX = 0, alvoZ = 0;
    if (this.tempoAtordoado > 0) {
      this.tempoAtordoado -= dt;
      alvoX = v.x * 0.9; alvoZ = v.z * 0.9; // desliza pelo empurrão
    } else {
      const dx = jogador.posicao.x - p.x, dz = jogador.posicao.z - p.z;
      const dist = Math.hypot(dx, dz);
      const dy = Math.abs(jogador.posicao.y - p.y);
      const distCasa = Math.hypot(this.casa.x - p.x, this.casa.z - p.z);
      if (dist < DISTANCIA_VISAO && dy < 2 && distCasa < DISTANCIA_MAX_CASA && dist > 0.01) {
        alvoX = dx / dist * VELOCIDADE_PERSEGUIR;
        alvoZ = dz / dist * VELOCIDADE_PERSEGUIR;
      } else if (distCasa > 6) {
        alvoX = (this.casa.x - p.x) / distCasa * VELOCIDADE_VAGAR;
        alvoZ = (this.casa.z - p.z) / distCasa * VELOCIDADE_VAGAR;
      } else {
        this.tempoNovaDirecao -= dt;
        if (this.tempoNovaDirecao <= 0) {
          this.tempoNovaDirecao = 1.5 + Math.random() * 2;
          const parado = Math.random() < 0.35;
          const a = Math.random() * Math.PI * 2;
          this.direcaoVagar = parado ? { x: 0, z: 0 } : { x: Math.cos(a), z: Math.sin(a) };
        }
        alvoX = this.direcaoVagar.x * VELOCIDADE_VAGAR;
        alvoZ = this.direcaoVagar.z * VELOCIDADE_VAGAR;
      }
    }
    const k = Math.min(1, 6 * dt);
    v.x += (alvoX - v.x) * k;
    v.z += (alvoZ - v.z) * k;
    v.y = Math.max(v.y + GRAVIDADE * dt, -40);

    moverComColisao(this, caixas, dt);
    if (p.y < -25) { this.derrotar(); return; }

    // ----- Visual -----
    const vHoriz = Math.hypot(v.x, v.z);
    if (vHoriz > 0.2) {
      const alvo = Math.atan2(v.x, v.z);
      let diff = Math.atan2(Math.sin(alvo - this.angulo), Math.cos(alvo - this.angulo));
      this.angulo += diff * Math.min(1, 8 * dt);
    }
    const pulo = Math.sin(this.tempo * (vHoriz > 2 ? 14 : 7));
    this.corpo.scale.set(1 - pulo * 0.06, 0.75 + pulo * 0.08, 1 - pulo * 0.06);
    this.tempoBrilho -= dt;
    this.material.emissive.setHex(this.tempoBrilho > 0 ? 0xffffff : 0x000000);
    this.modelo.position.copy(p);
    this.modelo.rotation.y = this.angulo;
  }
}

/** Cria e atualiza todos os inimigos, e resolve o combate com o jogador. */
export class GerenciadorInimigos {
  constructor(cena, pontos) {
    this.lista = pontos.map((p) => new Inimigo(cena, p));
    this.derrotados = 0;
  }

  reiniciar() {
    this.derrotados = 0;
    for (const ini of this.lista) ini.renascer();
  }

  atualizar(dt, jogador, caixas, particulas) {
    for (const ini of this.lista) {
      ini.atualizar(dt, jogador, caixas);
      if (!ini.ativo) continue;

      // Golpe do jogador acerta o inimigo?
      if (jogador.golpeAtivo() && !jogador.atingidos.has(ini)) {
        const g = jogador.pontoGolpe();
        const dx = ini.posicao.x - g.x, dz = ini.posicao.z - g.z;
        const dy = (ini.posicao.y + 0.45) - g.y;
        if (Math.hypot(dx, dz) < 1.0 + ini.raio && Math.abs(dy) < 1.2) {
          jogador.atingidos.add(ini);
          const centro = ini.posicao.clone().setY(ini.posicao.y + 0.5);
          const derrotado = ini.receberDano(ini.posicao.x - jogador.posicao.x, ini.posicao.z - jogador.posicao.z);
          particulas.explosao(centro, 0xffd84a, derrotado ? 6 : 8, 4);
          if (derrotado) {
            particulas.explosao(centro, 0x7a3cff, 22, 6);
            this.derrotados++;
          }
          continue;
        }
      }

      // Encostar no inimigo machuca o jogador
      const dx = jogador.posicao.x - ini.posicao.x, dz = jogador.posicao.z - ini.posicao.z;
      const sobreposicaoY = jogador.posicao.y < ini.posicao.y + ini.altura && jogador.posicao.y + 1.6 > ini.posicao.y;
      if (ini.tempoAtordoado <= 0 && sobreposicaoY && Math.hypot(dx, dz) < ini.raio + 0.4) {
        jogador.levarDano(ini.posicao.x, ini.posicao.z);
      }
    }
  }
}
