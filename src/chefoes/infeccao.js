// Chefão da Floresta do Pesadelo: Guardião da Infecção (gosma gigante com casca de árvore e cristais escuros).
// Ataques: salto esmagador (sombra de aviso + onda) → tentáculos (brotam em volta) → cuspe de gosma (deixa poças
// que infectam) → enxame (gosminhas). 15 de vida, 5 golpes por cansaço = 3 ciclos.
import * as THREE from 'three';
import { som } from '../audio.js';
import { ChefaoBase } from './base.js';
import { Inimigo } from '../inimigo.js';
import { Ondas, Quedas, Brotos, criarTontura } from './efeitos.js';

const COR = {
  gosma: 0x6a2bb8, gosmaLimpa: 0x5ad16a,
  casca: 0x3a2a24, cascaLimpa: 0x8b5a2b,
  olho: 0xc6ff3d, olhoBravo: 0xff2a2a, olhoLimpo: 0xffffff,
  nucleo: 0xff3bd0, nucleoVulneravel: 0xffe14a, nucleoLimpo: 0x7dfff0,
};

function criarModelo() {
  const grupo = new THREE.Group();
  const corpo = new THREE.Group();
  grupo.add(corpo);
  const matGosma = new THREE.MeshLambertMaterial({ color: COR.gosma, flatShading: true, transparent: true, opacity: 0.92 });
  const matCasca = new THREE.MeshLambertMaterial({ color: COR.casca, flatShading: true });
  const matCristal = new THREE.MeshLambertMaterial({ color: 0x2a0b4c, emissive: 0x5a1d9e, flatShading: true });
  const matOlho = new THREE.MeshBasicMaterial({ color: COR.olho });
  const matPupila = new THREE.MeshBasicMaterial({ color: 0x0a0010 });
  const matNucleo = new THREE.MeshBasicMaterial({ color: COR.nucleo });
  const parte = (geo, mat, x, y, z, pai = corpo) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    pai.add(m);
    return m;
  };
  const massa = parte(new THREE.SphereGeometry(1.9, 14, 10), matGosma, 0, 1.6, 0);
  massa.scale.set(1.1, 0.9, 1);
  parte(new THREE.SphereGeometry(1.2, 12, 8), matGosma, 0, 3.1, 0);
  for (let i = 0; i < 8; i++) { // barra de gosma no chão
    const a = (i / 8) * Math.PI * 2;
    parte(new THREE.SphereGeometry(0.65, 8, 6), matGosma, Math.cos(a) * 1.7, 0.35, Math.sin(a) * 1.6).scale.y = 0.6;
  }
  // Placas de casca de árvore e galhos (restos do antigo guardião)
  for (const [x, y, z, ry, rz] of [[-1.6, 2.2, 0.6, -0.9, 0.3], [1.6, 2.2, 0.6, 0.9, -0.3], [-1.3, 1.2, 1.2, -0.6, 0.1], [1.3, 1.2, 1.2, 0.6, -0.1], [0, 2, -1.8, 3.1, 0]]) {
    const p = parte(new THREE.BoxGeometry(1, 1.3, 0.25), matCasca, x, y, z);
    p.rotation.set(-0.2, ry, rz);
  }
  for (const s of [-1, 1]) {
    const galho = parte(new THREE.CylinderGeometry(0.1, 0.2, 1.6, 5), matCasca, s * 0.9, 4.2, -0.1);
    galho.rotation.z = -s * 0.6;
    const g2 = parte(new THREE.CylinderGeometry(0.06, 0.11, 0.8, 5), matCasca, s * 1.5, 4.7, -0.1);
    g2.rotation.z = s * 0.5;
  }
  for (const [x, z, h] of [[0, 0, 1.4], [-0.5, 0.2, 0.9], [0.5, 0.2, 0.9], [0, -0.5, 1]]) parte(new THREE.ConeGeometry(0.25, h, 5), matCristal, x, 4.1 + h / 2, z); // coroa de cristais
  const olhos = [[0, 3.35, 1.1, 0.4], [-0.75, 3, 0.95, 0.26], [0.75, 3, 0.95, 0.26]].map(([x, y, z, r]) => {
    const o = parte(new THREE.SphereGeometry(r, 10, 8), matOlho, x, y, z);
    parte(new THREE.SphereGeometry(r * 0.5, 7, 5), matPupila, 0, 0, r * 0.75, o);
    return o;
  });
  parte(new THREE.TorusGeometry(0.6, 0.12, 6, 12, Math.PI), matPupila, 0, 2.35, 1.45).rotation.z = Math.PI;
  const nucleo = parte(new THREE.IcosahedronGeometry(0.42, 0), matNucleo, 0, 1.5, 1.85);
  // Braços-tentáculo
  const braco = (lado) => {
    const gomos = [];
    let pai = corpo;
    for (let i = 0; i < 5; i++) {
      const g = new THREE.Group();
      if (i === 0) g.position.set(lado * 1.7, 2.1, 0.2); else g.position.y = -0.55;
      parte(new THREE.CylinderGeometry(0.36 - i * 0.05, 0.31 - i * 0.05, 0.65, 7), matGosma, 0, -0.28, 0, g);
      pai.add(g);
      pai = g;
      gomos.push(g);
    }
    return gomos;
  };
  const bracos = [braco(-1), braco(1)];
  const tontura = criarTontura(corpo, 5.6, 1.2);
  return { grupo, corpo, massa, olhos, bracos, nucleo, tontura, matGosma, matCasca, matOlho, matNucleo, matCristal };
}

export class GuardiaoInfeccao extends ChefaoBase {
  constructor(cena, centro, particulas, opcoes) {
    super(cena, centro, particulas, opcoes, {
      nome: 'Guardião da Infecção',
      vida: 15, danoPorCansaco: 5, tempoVulneravel: 6,
      raioArena: 9, raio: 1.9, altura: 4.6, alturaCentro: 2,
      pontos: 1500, cor: 0x6a2bb8,
      ataques: ['salto', 'tentaculos', 'gosma', 'enxame'],
      dicas: {
        salto: 'Ele vai cair em cima de você! Fuja da sombra e pule a onda!',
        tentaculos: 'Tentáculos! Não fique parado!',
        gosma: 'As poças de gosma INFECTAM! Não pise nelas!',
        enxame: 'Um enxame de gosminhas! Cuidado com a infecção!',
      },
      textos: {
        acordou: 'O Guardião da Infecção tomou conta da floresta!',
        vulneravel: 'A gosma derreteu! Ataque o coração!',
        derrotado: 'A floresta está curada! O castelo fica logo ali!',
      },
    });
  }

  _criarModelo() {
    this.m = criarModelo();
    this.modelo = this.m.grupo;
    this.ondas = new Ondas(this.cena, { cor: 0xb04dff });
    this.brotos = new Brotos(this.cena, {
      geometria: new THREE.ConeGeometry(0.5, 2.8, 7), material: new THREE.MeshLambertMaterial({ color: 0x7a3cff, flatShading: true }),
      altura: 2.8, raio: 0.95, aviso: 0.6, duracao: 0.9, balanca: 0.2, quantidade: 36,
    });
    this.cuspes = new Quedas(this.cena, this.particulas, {
      geometria: new THREE.IcosahedronGeometry(0.5, 1), material: new THREE.MeshLambertMaterial({ color: 0x9dff3d, emissive: 0x2a5a0a, flatShading: true }),
      raio: 1.5, tempo: 1.2, arco: 5, corExplosao: 0x9dff3d, corAviso: 0x9dff3d, quantidade: 14,
    });
    this.cuspes.aoCair = (x, y, z) => this._novaPoca(x, y, z);
    this.sombra = new THREE.Mesh(new THREE.CircleGeometry(2.4, 24), new THREE.MeshBasicMaterial({ color: 0xff3b6b, transparent: true, opacity: 0.4, depthWrite: false }));
    this.sombra.rotation.x = -Math.PI / 2;
    this.sombra.visible = false;
    this.cena.add(this.sombra);
    const matPoca = new THREE.MeshBasicMaterial({ color: 0x9dff3d, transparent: true, opacity: 0.6, depthWrite: false });
    this.pocas = Array.from({ length: 12 }, () => {
      const malha = new THREE.Mesh(new THREE.CircleGeometry(1.5, 16), matPoca);
      malha.rotation.x = -Math.PI / 2;
      malha.visible = false;
      this.cena.add(malha);
      return { malha, vida: 0 };
    });
    this.reserva = Array.from({ length: 5 }, () => new Inimigo(this.cena, 'saltitante', this.centroArena, { invocado: true }));
  }

  _novaPoca(x, y, z) {
    const p = this.pocas.find((q) => q.vida <= 0);
    if (!p) return;
    p.vida = 7;
    p.malha.position.set(x, y + 0.05, z);
    p.malha.visible = true;
  }

  _pintar(limpo) {
    this.m.matGosma.color.setHex(limpo ? COR.gosmaLimpa : COR.gosma);
    this.m.matCasca.color.setHex(limpo ? COR.cascaLimpa : COR.casca);
    this.m.matOlho.color.setHex(limpo ? COR.olhoLimpo : COR.olho);
    this.m.matCristal.color.setHex(limpo ? 0x5ad1ff : 0x2a0b4c);
  }
  _visualNormal() { this._pintar(false); }
  _visualPurificado() { this._pintar(true); }

  _purificando(dt) {
    if (Math.random() < dt * 14) this.particulas.explosao(this.centro().clone().setY(this.posicao.y + 1 + Math.random() * 3), 0x7dff5a, 4, 5);
    this.m.matGosma.color.lerpColors(new THREE.Color(COR.gosma), new THREE.Color(COR.gosmaLimpa), Math.min(1, this.t / 2.5));
  }

  _limparAtaques() {
    this.ondas.limpar();
    this.brotos.limpar();
    this.cuspes.limpar();
    this.sombra.visible = false;
    for (const p of this.pocas) { p.vida = 0; p.malha.visible = false; }
    for (const i of this.reserva) i.dispensar();
  }

  _comecarAtaque() {
    this.saltos = 2 + Math.min(1, this.cansacos);
    this.rajadas = 3 + Math.min(1, this.cansacos);
  }

  // ---------- Ataques ----------
  _ataque_salto(dt, { jogador, dx, dz, rapido }) {
    const p = this.posicao, c = this.centroArena, j = jogador.posicao;
    if (this.etapa === 0) { // encolhe
      this._virarPara(dx, dz, dt, 6);
      if (this.t > 0.7 / rapido) {
        this.etapa = 1; this.t = 0;
        this.velocidade.y = 17; // ~4,5 m de altura, ~1 s no ar
        let x = j.x, z = j.z;
        const d = Math.hypot(x - c.x, z - c.z);
        if (d > 8.5) { x = c.x + (x - c.x) / d * 8.5; z = c.z + (z - c.z) / d * 8.5; }
        this.alvo = { x, z };
        this.sombra.position.set(x, c.y + 0.07, z);
        this.sombra.visible = true;
        som.efeito('chefao_investida');
      }
    } else if (this.etapa === 1) { // no ar
      this.vx = (this.alvo.x - p.x) * 3.4; this.vz = (this.alvo.z - p.z) * 3.4;
      if (this.t > 0.3 && p.y <= c.y + 0.05) {
        this.etapa = 2; this.t = 0;
        this.sombra.visible = false;
        som.efeito('chefao_golpe');
        this.ondas.soltar(p.x, c.y, p.z);
        this.particulas.explosao(p.clone().setY(c.y + 0.3), 0xb04dff, 20, 7);
      }
    } else if (this.t > 0.9) {
      this.saltos--;
      if (this.saltos > 0) { this.etapa = 0; this.t = 0.2; }
      else this._proximoAtaque();
    }
  }

  _ataque_tentaculos(dt, { jogador, dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 4);
    const c = this.centroArena, j = jogador.posicao;
    if (this.rajadas > 0 && this.t > 1.05 / rapido) {
      this.t = 0;
      this.rajadas--;
      som.efeito('chefao_bolas');
      const dentro = (x, z) => Math.hypot(x - c.x, z - c.z) < 10.8;
      this.brotos.brotar(j.x, c.y, j.z);
      const n = 5 + Math.min(2, this.cansacos);
      const giro = Math.random() * 6;
      for (let i = 0; i < n; i++) { // anel em volta do herói, com um vão
        const a = giro + (i / (n + 1)) * Math.PI * 2;
        const x = j.x + Math.cos(a) * 2.6, z = j.z + Math.sin(a) * 2.6;
        if (dentro(x, z)) this.brotos.brotar(x, c.y, z, 0.15);
      }
    } else if (this.rajadas === 0 && this.t > 1.8) {
      this._proximoAtaque();
    }
  }

  _ataque_gosma(dt, { jogador, dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 6);
    const c = this.centroArena, j = jogador.posicao;
    if (this.rajadas > 0 && this.t > 1 / rapido) {
      this.t = 0;
      this.rajadas--;
      som.efeito('cuspe');
      const origem = this.posicao.clone();
      origem.y += 3;
      for (let i = 0; i < 3; i++) {
        let x = j.x, z = j.z;
        if (i > 0) { const a = Math.random() * Math.PI * 2; x += Math.cos(a) * 3.6; z += Math.sin(a) * 3.6; }
        const d = Math.hypot(x - c.x, z - c.z);
        if (d > 10.5) { x = c.x + (x - c.x) / d * 10.5; z = c.z + (z - c.z) / d * 10.5; }
        this.cuspes.lancar(x, c.y, z, origem);
      }
    } else if (this.rajadas === 0 && this.t > 1.7) {
      this._proximoAtaque();
    }
  }

  _ataque_enxame(dt, { dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 4);
    if (this.etapa === 0 && this.t > 1 / rapido) {
      this.etapa = 1; this.t = 0;
      som.efeito('chefao_rugido');
      const n = 3 + Math.min(2, this.cansacos), c = this.centroArena;
      for (let i = 0; i < n; i++) {
        const a = this.angulo + (i - (n - 1) / 2) * 0.8;
        const x = c.x + Math.sin(a) * 6.5, z = c.z + Math.cos(a) * 6.5;
        if (this.reserva[i].invocar(x, c.y + 1, z)) this.particulas.explosao(new THREE.Vector3(x, c.y + 0.6, z), 0x7ddc3a, 12, 5);
      }
    } else if (this.etapa === 1 && this.t > 2.4) {
      this._proximoAtaque();
    }
  }

  // ---------- Visual ----------
  _atualizarEfeitos(dt, jogador) {
    this.ondas.atualizar(dt, jogador, this.tempo);
    this.brotos.atualizar(dt, jogador, this.tempo);
    this.cuspes.atualizar(dt, jogador, this.tempo);
    if (this.estado !== 'salto') this.sombra.visible = false;
    const j = jogador.posicao;
    for (const p of this.pocas) {
      if (p.vida <= 0) continue;
      p.vida -= dt;
      p.malha.scale.setScalar(Math.min(1, p.vida, (7 - p.vida) * 4 + 0.1));
      p.malha.visible = p.vida > 0;
      const m = p.malha.position;
      if (Math.hypot(j.x - m.x, j.z - m.z) < 1.4 && Math.abs(j.y - m.y) < 0.5) jogador.infectar(32 * dt);
    }
  }

  _atualizarVisual(dt) {
    const m = this.m, t = this.tempo;
    const k = Math.min(1, 9 * dt);
    let achata = 1 + Math.sin(t * 2.2) * 0.03, inclina = 0, bracoX = Math.sin(t * 2) * 0.1, bracoZ = 0.28;
    let olho = this.derrotado ? COR.olhoLimpo : COR.olho;
    switch (this.estado) {
      case 'dormindo': achata = 0.72; break;
      case 'acordando': achata = this.t > 0.6 ? 1.1 + Math.sin(t * 22) * 0.05 : 0.75; bracoX = -0.6; bracoZ = 0.5; break;
      case 'salto': achata = this.etapa === 0 ? 0.65 : this.etapa === 1 ? 1.2 : this.t < 0.25 ? 0.6 : 1; olho = COR.olhoBravo; bracoZ = this.etapa === 1 ? 0.55 : 0.2; break;
      case 'tentaculos': bracoX = -0.55 + Math.sin(t * 9) * 0.15; olho = COR.olhoBravo; break;
      case 'gosma': achata = 1 + Math.sin(this.t * 7) * 0.08; inclina = this.t < 0.25 ? 0.25 : -0.12; olho = COR.olhoBravo; break;
      case 'enxame': achata = 1 + Math.sin(t * 16) * 0.06; bracoX = -0.6; bracoZ = 0.5; break;
      case 'vulneravel': achata = 0.62; inclina = 0.1; bracoZ = 0.5; break;
      case 'levantando': achata = 0.62 + 0.38 * Math.min(1, this.t); break;
      case 'purificando': achata = 1 + Math.sin(t * 25) * 0.04; break;
      case 'purificado': achata = 1 + Math.sin(t * 5) * 0.06; bracoX = -0.4 + Math.sin(t * 5) * 0.15; break;
      default: break;
    }
    const s = m.corpo.scale;
    s.y += (achata - s.y) * k;
    s.x = s.z = 1 / Math.sqrt(s.y);
    m.corpo.rotation.x += (inclina - m.corpo.rotation.x) * k;
    m.bracos.forEach((gomos, lado) => gomos.forEach((g, i) => {
      g.rotation.x += (bracoX - g.rotation.x) * k;
      const z = (lado ? 1 : -1) * (i === 0 ? bracoZ * 2 : -0.12) + Math.sin(t * 3 + i + lado) * 0.08;
      g.rotation.z += (z - g.rotation.z) * k;
    }));
    if (!this.derrotado) m.matOlho.color.setHex(olho);

    const vulneravel = this.estado === 'vulneravel';
    m.matNucleo.color.setHex(this.derrotado ? COR.nucleoLimpo : vulneravel ? COR.nucleoVulneravel : COR.nucleo);
    m.nucleo.scale.setScalar(vulneravel ? 1.6 + Math.sin(t * 10) * 0.3 : 1);
    m.nucleo.rotation.y += dt * 2;
    m.tontura.visible = vulneravel;
    m.tontura.rotation.y += dt * 4;
    m.matGosma.emissive.setHex(this.tempoBrilho > 0 ? 0xffffff : this.derrotado ? 0x0a2a0a : 0x1a0530);
    this.modelo.position.copy(this.posicao);
    this.modelo.rotation.y = this.angulo;
  }
}
