// Criaturas contaminadas. Tipos da floresta (os outros estão em src/inimigos/):
//  gosma      = gosma roxa que persegue (2 de vida)
//  saltitante = gosminha verde que pula na sua direção (1 de vida, rápida)
//  cuspidor   = cogumelo contaminado parado que cospe bolas de gosma (3 de vida)
import * as THREE from 'three';
import { GRAVIDADE, moverComColisao } from './fisica.js';
import { som } from './audio.js';
import { matLambert, olhos, manchas } from './inimigos/comum.js';
import { TIPOS_AGUA } from './inimigos/agua.js';
import { TIPOS_LABORATORIO } from './inimigos/laboratorio.js';

const DISTANCIA_VISAO = 10;
const DISTANCIA_MAX_CASA = 16; // não se afasta demais de onde nasceu
const TEMPO_RENASCER = 10;

function modeloGosma() {
  const grupo = new THREE.Group();
  const material = matLambert(0x7a3cff);
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), material);
  corpo.scale.set(1, 0.75, 1);
  corpo.position.y = 0.45;
  corpo.castShadow = true;
  grupo.add(corpo);
  manchas(corpo, [[0.3, 0.25, -0.4], [-0.4, 0.2, -0.2], [0, 0.55, -0.3]], 0x2a0b5c, 0.14);
  olhos(corpo, 0.2, 0.48, 0.2, 0.13);
  return { grupo, corpo, material, escalaY: 0.75 };
}

function modeloSaltitante() {
  const grupo = new THREE.Group();
  const material = matLambert(0x7ddc3a);
  const corpo = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 1), material);
  corpo.position.y = 0.38;
  corpo.castShadow = true;
  grupo.add(corpo);
  manchas(corpo, [[0.2, 0.25, -0.25], [-0.25, 0.1, -0.2]], 0x6a2bb8, 0.1);
  olhos(corpo, 0.12, 0.33, 0.14, 0.1, 0xff4df0);
  return { grupo, corpo, material, escalaY: 1 };
}

function modeloCuspidor() {
  const grupo = new THREE.Group();
  const caule = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.38, 0.8, 8), new THREE.MeshLambertMaterial({ color: 0xe8dcc0, flatShading: true }));
  caule.position.y = 0.4;
  caule.castShadow = true;
  olhos(caule, 0.1, 0.3, 0.13, 0.09, 0xff3b3b);
  const material = matLambert(0x8b2fc9);
  const corpo = new THREE.Mesh(new THREE.SphereGeometry(0.7, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2), material);
  corpo.position.y = 0.75;
  corpo.castShadow = true;
  manchas(corpo, [[0.3, 0.45, 0.3], [-0.35, 0.4, 0.1], [0, 0.6, -0.3], [0.1, 0.3, 0.55]], 0xc6ff3d, 0.1);
  grupo.add(caule, corpo);
  return { grupo, corpo, material, escalaY: 1 };
}

/**
 * Cada tipo: vida, raio, altura, pontos, cor, modelo() e, nos tipos novos:
 *   agir(ini, dt, ctx) = movimento/ataque    animar(ini, dt) = visual
 *   voa = sem gravidade   fixo = não é empurrado   semGiro = o próprio agir() controla o ângulo
 *   visao / visaoY = distância em que enxerga o herói
 */
const TIPOS = {
  ...TIPOS_AGUA,
  ...TIPOS_LABORATORIO,
  gosma: { vida: 2, raio: 0.6, altura: 0.9, pontos: 50, modelo: modeloGosma, cor: 0x7a3cff },
  saltitante: { vida: 1, raio: 0.4, altura: 0.75, pontos: 30, modelo: modeloSaltitante, cor: 0x7ddc3a },
  cuspidor: { vida: 3, raio: 0.65, altura: 1.4, pontos: 80, modelo: modeloCuspidor, cor: 0x8b2fc9 },
};

export class Inimigo {
  /** invocado = criatura chamada por um chefão: começa guardada e não renasce sozinha. */
  constructor(cena, tipo, pontoInicial, { invocado = false } = {}) {
    this.invocado = invocado;
    this.tipo = TIPOS[tipo] ? tipo : 'gosma';
    this.cfg = TIPOS[this.tipo];
    const m = this.cfg.modelo();
    this.modelo = m.grupo;
    this.corpo = m.corpo;
    this.material = m.material;
    this.escalaY = m.escalaY;
    this.m = m; // peças do modelo (para animar)
    this.emissivoBase = 0x000000;
    cena.add(this.modelo);

    this.casa = pontoInicial.clone();
    this.posicao = new THREE.Vector3();
    this.velocidade = new THREE.Vector3();
    this._centro = new THREE.Vector3();
    this.raio = this.cfg.raio;
    this.altura = this.cfg.altura;
    this.tempo = Math.random() * 10;
    this.renascer();
  }

  renascer() {
    this.ativo = true;
    this.vida = this.cfg.vida;
    this.posicao.copy(this.casa);
    this.velocidade.set(0, 0, 0);
    this.noChao = false;
    this.tempoAtordoado = 0;
    this.tempoBrilho = 0;
    this.tempoAcao = 1 + Math.random();
    this.direcaoVagar = { x: 0, z: 0 };
    this.angulo = 0;
    this.bote = 0; this.investida = 0; this.tempoChoque = 0; this.revelada = false; this.tiros = 0; // usados pelos tipos de src/inimigos/
    this.modelo.visible = true;
    if (this.invocado) this.dispensar();
  }

  /** Guarda a criatura invocada (some sem ser derrotada). */
  dispensar() {
    this.ativo = false;
    this.modelo.visible = false;
    this.tempoRenascer = Infinity;
  }

  /** Chefão chama a criatura para (x, y, z). Retorna false se ela já está em jogo. */
  invocar(x, y, z) {
    if (this.ativo) return false;
    this.casa.set(x, y, z);
    this.invocado = false;
    this.renascer();
    this.invocado = true;
    return true;
  }

  centro() {
    return this._centro.set(this.posicao.x, this.posicao.y + this.altura / 2, this.posicao.z);
  }

  derrotar() {
    this.ativo = false;
    this.modelo.visible = false;
    this.tempoRenascer = this.invocado ? Infinity : TEMPO_RENASCER;
  }

  /** Recebe um golpe vindo da direção (dx, dz). Retorna true se foi derrotado. */
  receberDano(dano, dx, dz) {
    this.vida -= dano;
    this.tempoBrilho = 0.15;
    this.tempoAtordoado = 0.45;
    if (this.tipo !== 'cuspidor' && !this.cfg.fixo) { // o cogumelo tem raiz: não é empurrado
      const d = Math.hypot(dx, dz) || 1;
      this.velocidade.set(dx / d * 9, 5, dz / d * 9);
    }
    if (this.vida <= 0) {
      this.derrotar();
      return true;
    }
    return false;
  }

  atualizar(dt, jogador, caixas, projeteis) {
    if (!this.ativo) {
      this.tempoRenascer -= dt;
      if (this.tempoRenascer <= 0) this.renascer();
      return;
    }
    this.tempo += dt;
    const p = this.posicao, v = this.velocidade;
    const dx = jogador.posicao.x - p.x, dz = jogador.posicao.z - p.z;
    const dist = Math.hypot(dx, dz);
    const dy = Math.abs(jogador.posicao.y - p.y);
    const distCasa = Math.hypot(this.casa.x - p.x, this.casa.z - p.z);
    const vendo = dist < (this.cfg.visao ?? DISTANCIA_VISAO) && dy < (this.cfg.visaoY ?? 2.5) && distCasa < DISTANCIA_MAX_CASA && dist > 0.01 && jogador.vida > 0;

    if (this.tempoAtordoado > 0) {
      this.tempoAtordoado -= dt;
      v.x *= 0.92; v.z *= 0.92;
      if (this.cfg.voa) v.y *= 0.9;
    } else if (this.cfg.agir) {
      this.cfg.agir(this, dt, { jogador, projeteis, dx, dz, dist: dist || 0.01, dy, distCasa, vendo });
    } else if (this.tipo === 'gosma') {
      this._andarGosma(dt, vendo, dx, dz, dist, distCasa);
    } else if (this.tipo === 'saltitante') {
      this._saltar(dt, vendo, dx, dz, dist, distCasa);
    } else {
      this._cuspir(dt, jogador, dx, dz, dist, dy, projeteis);
    }
    if (!this.cfg.voa) v.y = Math.max(v.y + GRAVIDADE * dt, -40);

    this.noChao = moverComColisao(this, caixas, dt);
    if (p.y < -25) { this.derrotar(); return; }

    this._atualizarVisual(dt);
  }

  _andarGosma(dt, vendo, dx, dz, dist, distCasa) {
    const p = this.posicao, v = this.velocidade;
    let alvoX = 0, alvoZ = 0;
    if (vendo) {
      alvoX = dx / dist * 3.2; alvoZ = dz / dist * 3.2;
    } else if (distCasa > 6) {
      alvoX = (this.casa.x - p.x) / distCasa * 1.4; alvoZ = (this.casa.z - p.z) / distCasa * 1.4;
    } else {
      this.tempoAcao -= dt;
      if (this.tempoAcao <= 0) {
        this.tempoAcao = 1.5 + Math.random() * 2;
        const a = Math.random() * Math.PI * 2;
        this.direcaoVagar = Math.random() < 0.35 ? { x: 0, z: 0 } : { x: Math.cos(a), z: Math.sin(a) };
      }
      alvoX = this.direcaoVagar.x * 1.4; alvoZ = this.direcaoVagar.z * 1.4;
    }
    const k = Math.min(1, 6 * dt);
    v.x += (alvoX - v.x) * k;
    v.z += (alvoZ - v.z) * k;
  }

  _saltar(dt, vendo, dx, dz, dist, distCasa) {
    const v = this.velocidade;
    if (!this.noChao) return; // no ar, mantém o pulo
    v.x *= 0.8; v.z *= 0.8;
    this.tempoAcao -= dt;
    if (this.tempoAcao > 0) return;
    this.tempoAcao = vendo ? 0.55 + Math.random() * 0.3 : 1 + Math.random();
    let dirX, dirZ, forca;
    if (vendo) {
      dirX = dx / dist; dirZ = dz / dist; forca = 4.5;
    } else if (distCasa > 5) {
      dirX = (this.casa.x - this.posicao.x) / distCasa; dirZ = (this.casa.z - this.posicao.z) / distCasa; forca = 2.5;
    } else {
      const a = Math.random() * Math.PI * 2;
      dirX = Math.cos(a); dirZ = Math.sin(a); forca = 2;
    }
    v.set(dirX * forca, 7.5, dirZ * forca);
  }

  _cuspir(dt, jogador, dx, dz, dist, dy, projeteis) {
    const v = this.velocidade;
    v.x *= 0.8; v.z *= 0.8;
    const noAlcance = dist < 13 && dy < 4 && jogador.vida > 0;
    if (noAlcance) this.angulo = Math.atan2(dx, dz);
    this.tempoAcao -= dt;
    if (this.tempoAcao <= 0) {
      this.tempoAcao = 2.2;
      if (!noAlcance) return;
      const origem = new THREE.Vector3(this.posicao.x + dx / dist * 0.6, this.posicao.y + 1.0, this.posicao.z + dz / dist * 0.6);
      const alvo = new THREE.Vector3(jogador.posicao.x, jogador.posicao.y + jogador.altura * 0.45, jogador.posicao.z);
      som.efeito('cuspe');
      projeteis.disparar({
        origem, direcao: alvo.sub(origem), velocidade: 8, dono: 'inimigo', cor: 0xb04dff, raio: 0.28, duracao: 2.5,
      });
    }
  }

  _atualizarVisual(dt) {
    const v = this.velocidade;
    const vHoriz = Math.hypot(v.x, v.z);
    if (vHoriz > 0.2 && this.tipo !== 'cuspidor' && !this.cfg.semGiro) {
      const alvo = Math.atan2(v.x, v.z);
      const diff = Math.atan2(Math.sin(alvo - this.angulo), Math.cos(alvo - this.angulo));
      this.angulo += diff * Math.min(1, 8 * dt);
    }
    const ey = this.escalaY;
    if (this.cfg.animar) {
      this.cfg.animar(this, dt);
    } else if (this.tipo === 'gosma') {
      const pulo = Math.sin(this.tempo * (vHoriz > 2 ? 14 : 7));
      this.corpo.scale.set(1 - pulo * 0.06, ey + pulo * 0.08, 1 - pulo * 0.06);
    } else if (this.tipo === 'saltitante') {
      const estica = this.noChao ? 0.85 + Math.sin(this.tempo * 20) * 0.05 : 1 + Math.min(0.3, Math.abs(v.y) * 0.03);
      this.corpo.scale.set(1 / Math.sqrt(estica), estica, 1 / Math.sqrt(estica));
    } else {
      // Cogumelo "infla" antes de cuspir
      const infla = this.tempoAcao < 0.4 ? 1 + (0.4 - this.tempoAcao) * 0.6 : 1;
      this.corpo.scale.set(infla, 1 / infla, infla);
    }
    this.tempoBrilho -= dt;
    this.material.emissive.setHex(this.tempoBrilho > 0 ? 0xffffff : this.emissivoBase);
    this.modelo.position.copy(this.posicao);
    this.modelo.rotation.y = this.angulo;
  }
}

/** Cria e atualiza todos os inimigos, e resolve o combate com o jogador. */
export class GerenciadorInimigos {
  /** definicoes = [{ tipo, x, y, z }] */
  constructor(cena, definicoes) {
    this.lista = definicoes.map((d) => new Inimigo(cena, d.tipo, new THREE.Vector3(d.x, d.y, d.z)));
    this.derrotados = 0;
    this.pontos = 0;
  }

  /** Coloca mais um "inimigo" no combate (ex.: o chefão). */
  adicionar(ini) {
    this.lista.push(ini);
  }

  reiniciar() {
    this.derrotados = 0;
    this.pontos = 0;
    for (const ini of this.lista) ini.renascer();
  }

  /** Aplica dano a um inimigo vindo da posição (deX, deZ). */
  acertar(ini, dano, deX, deZ, particulas) {
    if (ini.bloquear?.()) return false; // chefão protegido (só leva dano quando está cansado)
    const centro = ini.centro().clone();
    const derrotado = ini.receberDano(dano, ini.posicao.x - deX, ini.posicao.z - deZ);
    particulas.explosao(centro, 0xffd84a, 8, 4);
    som.efeito(derrotado ? 'inimigo_derrotado' : 'acerto');
    if (derrotado) {
      particulas.explosao(centro, ini.cfg.cor, 22, 6);
      this.derrotados++;
      this.pontos += ini.cfg.pontos;
    }
    return derrotado;
  }

  /** Dano em área (explosões). */
  acertarArea(centro, raio, dano, particulas) {
    for (const ini of this.lista) {
      if (ini.ativo && ini.centro().distanceTo(centro) < raio + ini.raio) {
        this.acertar(ini, dano, centro.x, centro.z, particulas);
      }
    }
  }

  atualizar(dt, jogador, caixas, particulas, projeteis) {
    const area = jogador.vida > 0 ? jogador.areaGolpe() : null;
    for (const ini of this.lista) {
      ini.atualizar(dt, jogador, caixas, projeteis);
      if (!ini.ativo) continue;
      const c = ini.centro();

      // Golpe corpo a corpo do jogador
      if (area && !jogador.atingidos.has(ini)) {
        const dx = c.x - area.x, dz = c.z - area.z, dy = c.y - area.y;
        if (Math.hypot(dx, dz) < area.raio + ini.raio && Math.abs(dy) < 2) {
          jogador.atingidos.add(ini);
          this.acertar(ini, area.dano, jogador.posicao.x, jogador.posicao.z, particulas);
          continue;
        }
      }

      // Encostar no inimigo machuca o jogador
      const dx = jogador.posicao.x - ini.posicao.x, dz = jogador.posicao.z - ini.posicao.z;
      const sobreposicaoY = jogador.posicao.y < ini.posicao.y + ini.altura && jogador.posicao.y + jogador.altura > ini.posicao.y;
      if (ini.tempoAtordoado <= 0 && sobreposicaoY && Math.hypot(dx, dz) < ini.raio + jogador.raio - 0.05) {
        jogador.levarDano(ini.posicao.x, ini.posicao.z, ini.empurrao ?? 8);
      }
    }
  }
}
