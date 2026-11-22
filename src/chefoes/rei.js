// Chefão final: o Rei do Pesadelo (gosma misteriosa com coroa, muitos olhos e tentáculos).
// Ataques: mergulho (atravessa o chão e sai embaixo do herói) → tentáculos (linhas que brotam) → olhar (raios giratórios)
// → chuva de pesadelos (gosma que infecta) → exército (sombras e espinhosos). Depois o NÚCLEO fica exposto.
// 20 de vida, 5 golpes por cansaço = 4 ciclos; a cada ciclo muda de cor e fica mais rápido.
import * as THREE from 'three';
import { som } from '../audio.js';
import { ChefaoBase } from './base.js';
import { Inimigo } from '../inimigo.js';
import { Ondas, Quedas, Brotos, Feixe, criarTontura } from './efeitos.js';

const CORES_FASE = [0x5a2a9a, 0x82288f, 0xa0206a, 0xb3182e]; // vai ficando mais furioso
const COR = { limpo: 0x8fe0ff, coroa: 0xffd84a, olho: 0xc6ff3d, olhoBravo: 0xff2a2a, olhoLimpo: 0xffffff, nucleo: 0xff3bd0, nucleoVulneravel: 0xffe14a, nucleoLimpo: 0x7dfff0 };

function criarModelo() {
  const grupo = new THREE.Group();
  const corpo = new THREE.Group();
  grupo.add(corpo);
  const matGosma = new THREE.MeshLambertMaterial({ color: CORES_FASE[0], emissive: 0x12042a, flatShading: true, transparent: true, opacity: 0.94 });
  const matCoroa = new THREE.MeshLambertMaterial({ color: COR.coroa, emissive: 0x4a3400, flatShading: true });
  const matJoia = new THREE.MeshBasicMaterial({ color: 0xff3b6b });
  const matOlho = new THREE.MeshBasicMaterial({ color: COR.olho });
  const matPupila = new THREE.MeshBasicMaterial({ color: 0x0a0010 });
  const matDente = new THREE.MeshLambertMaterial({ color: 0xfff6e0, flatShading: true });
  const matNucleo = new THREE.MeshBasicMaterial({ color: COR.nucleo });
  const matManto = new THREE.MeshLambertMaterial({ color: 0x7a0f3a, flatShading: true, side: THREE.DoubleSide });
  const parte = (geo, mat, x, y, z, pai = corpo) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    pai.add(m);
    return m;
  };
  // Corpo de gosma em camadas
  parte(new THREE.CylinderGeometry(1.3, 2.1, 1.6, 12), matGosma, 0, 0.8, 0);
  parte(new THREE.SphereGeometry(1.55, 14, 10), matGosma, 0, 2.2, 0);
  parte(new THREE.SphereGeometry(1.2, 14, 10), matGosma, 0, 3.8, 0);
  const gotas = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    gotas.push(parte(new THREE.SphereGeometry(0.55, 7, 5), matGosma, Math.cos(a) * 1.95, 0.3, Math.sin(a) * 1.95));
  }
  // Manto real
  const manto = parte(new THREE.CylinderGeometry(1.35, 2.3, 3.2, 10, 1, true, Math.PI * 0.62, Math.PI * 0.76), matManto, 0, 1.75, -0.1);
  manto.rotation.y = 0;
  for (let i = 0; i < 7; i++) { // gola
    const a = Math.PI * 0.62 + (i / 6) * Math.PI * 0.76;
    parte(new THREE.SphereGeometry(0.28, 6, 5), matDente, Math.sin(a) * 1.4, 3.35, Math.cos(a) * 1.4 - 0.1);
  }
  // Coroa
  const coroa = new THREE.Group();
  coroa.position.y = 4.85;
  corpo.add(coroa);
  parte(new THREE.CylinderGeometry(0.85, 0.78, 0.4, 10), matCoroa, 0, 0, 0, coroa);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    parte(new THREE.ConeGeometry(0.2, 0.7, 4), matCoroa, Math.sin(a) * 0.72, 0.5, Math.cos(a) * 0.72, coroa);
    parte(new THREE.SphereGeometry(0.1, 6, 5), matJoia, Math.sin(a) * 0.82, 0, Math.cos(a) * 0.82, coroa);
  }
  // Muitos olhos e bocarra
  const olhos = [[-0.5, 4.1, 0.98, 0.32], [0.5, 4.1, 0.98, 0.32], [0, 4.5, 0.9, 0.2], [-0.95, 3.6, 0.65, 0.18], [0.95, 3.6, 0.65, 0.18], [-1.1, 2.6, 0.95, 0.2], [1.15, 2.3, 0.9, 0.24], [-0.9, 1.4, 1.35, 0.17], [0.95, 1.2, 1.4, 0.2]].map(([x, y, z, r]) => {
    const o = parte(new THREE.SphereGeometry(r, 10, 8), matOlho, x, y, z);
    parte(new THREE.SphereGeometry(r * 0.5, 7, 5), matPupila, 0, 0, r * 0.75, o);
    return o;
  });
  const boca = parte(new THREE.SphereGeometry(0.6, 10, 7), matPupila, 0, 3.4, 0.82);
  boca.scale.set(1.1, 0.5, 0.6);
  for (let i = 0; i < 7; i++) {
    const dx = (i - 3) * 0.17;
    parte(new THREE.ConeGeometry(0.08, 0.28, 4), matDente, dx, 3.58 - Math.abs(i - 3) * 0.02, 1.12).rotation.x = Math.PI;
    parte(new THREE.ConeGeometry(0.08, 0.24, 4), matDente, dx, 3.22 + Math.abs(i - 3) * 0.02, 1.12);
  }
  const nucleo = parte(new THREE.IcosahedronGeometry(0.5, 0), matNucleo, 0, 2.15, 1.45);
  // Seis tentáculos
  const tentaculos = [];
  for (let t = 0; t < 6; t++) {
    const a = (t / 6) * Math.PI * 2 + Math.PI / 6;
    const gomos = [];
    let pai = corpo;
    for (let i = 0; i < 6; i++) {
      const g = new THREE.Group();
      if (i === 0) {
        g.position.set(Math.sin(a) * 1.3, 2.4, Math.cos(a) * 1.3);
        g.rotation.order = 'YXZ';
        g.rotation.y = a;
      } else g.position.y = 0.55;
      parte(new THREE.CylinderGeometry(0.3 - i * 0.045, 0.35 - i * 0.045, 0.62, 6), matGosma, 0, 0.28, 0, g);
      pai.add(g);
      pai = g;
      gomos.push(g);
    }
    tentaculos.push(gomos);
  }
  const tontura = criarTontura(corpo, 6.2, 1.3);
  return { grupo, corpo, coroa, olhos, gotas, boca, nucleo, tentaculos, manto, tontura, matGosma, matOlho, matNucleo, matManto };
}

export class ReiPesadelo extends ChefaoBase {
  constructor(cena, centro, particulas, opcoes) {
    super(cena, centro, particulas, opcoes, {
      nome: 'Rei do Pesadelo',
      vida: 20, danoPorCansaco: 5, tempoVulneravel: 6.5,
      raioArena: 10.2, meiaArena: 13, raio: 1.9, altura: 5.2, alturaCentro: 2.3,
      pontos: 3000, cor: 0x4a1060,
      ataques: ['mergulho', 'tentaculos', 'olhar', 'chuva', 'exercito'],
      dicas: {
        mergulho: 'Ele atravessa o chão! Fuja da sombra e PULE a onda!',
        tentaculos: 'Tentáculos gigantes! Saia das linhas!',
        olhar: 'O olhar do pesadelo! PULE os raios!',
        chuva: 'Chuva de gosma: não deixe infectar você!',
        exercito: 'Ele chamou o exército do pesadelo!',
      },
      textos: {
        acordou: 'EU SOU O REI DO PESADELO! Ninguém vai acordar!',
        vulneravel: 'O NÚCLEO está exposto! Ataque com tudo!',
        derrotado: 'O núcleo foi destruído! O pesadelo ACABOU!',
      },
    });
  }

  _criarModelo() {
    this.m = criarModelo();
    this.modelo = this.m.grupo;
    const lambert = (cor, emissive = 0) => new THREE.MeshLambertMaterial({ color: cor, emissive, flatShading: true });
    this.ondas = new Ondas(this.cena, { cor: 0xff6bd0, quantidade: 6, alcance: 13 });
    this.brotos = new Brotos(this.cena, {
      geometria: new THREE.ConeGeometry(0.55, 3, 7), material: lambert(0x4a1060, 0x1a0430),
      altura: 3, raio: 0.95, aviso: 0.65, duracao: 0.9, balanca: 0.2, quantidade: 56,
    });
    this.gosmas = new Quedas(this.cena, this.particulas, {
      geometria: new THREE.IcosahedronGeometry(0.55, 1), material: lambert(0xb04dff, 0x3a0a6a),
      raio: 1.5, tempo: 1.15, corExplosao: 0xb04dff, quantidade: 22,
    });
    this.gosmas.aoCair = (x, y, z) => this._novaPoca(x, y, z);
    this.feixes = [0, 1, 2, 3].map(() => new Feixe(this.cena, { cor: 0xff3bd0, comprimento: 15, largura: 0.55 }));
    const plano = (geo, cor, opacity) => {
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      m.visible = false;
      this.cena.add(m);
      return m;
    };
    this.sombra = plano(new THREE.CircleGeometry(2.3, 24), 0x1a0030, 0.75);
    this.pocas = Array.from({ length: 14 }, () => ({ malha: plano(new THREE.CircleGeometry(1.4, 16), 0xb04dff, 0.55), vida: 0 }));
    this.reserva = [
      ...Array.from({ length: 3 }, () => new Inimigo(this.cena, 'sombra', this.centroArena, { invocado: true })),
      ...Array.from({ length: 3 }, () => new Inimigo(this.cena, 'espinhoso', this.centroArena, { invocado: true })),
    ];
  }

  _novaPoca(x, y, z) {
    const p = this.pocas.find((q) => q.vida <= 0);
    if (!p) return;
    p.vida = 5;
    p.malha.position.set(x, y + 0.05, z);
    p.malha.visible = true;
  }

  _visualNormal() {
    this.m.matGosma.color.setHex(CORES_FASE[Math.min(3, this.cansacos || 0)]);
    this.m.matOlho.color.setHex(COR.olho);
    this.m.coroa.visible = true;
    this.m.corpo.scale.setScalar(1);
  }

  _visualPurificado() {
    this.m.matGosma.color.setHex(COR.limpo);
    this.m.matOlho.color.setHex(COR.olhoLimpo);
    this.m.coroa.visible = false;
    this.m.corpo.scale.setScalar(0.45); // vira uma gosminha fofa
  }

  _purificando(dt) {
    if (Math.random() < dt * 20) this.particulas.explosao(this.centro().clone().setY(this.posicao.y + Math.random() * 5), [0xff6bd0, 0xffd84a, 0x5ad1ff][Math.floor(Math.random() * 3)], 6, 7);
    const k = Math.min(1, this.t / 2.5);
    this.m.matGosma.color.lerpColors(new THREE.Color(CORES_FASE[3]), new THREE.Color(COR.limpo), k);
    this.m.corpo.scale.setScalar(1 - k * 0.55);
  }

  _limparAtaques() {
    this.ondas.limpar();
    this.brotos.limpar();
    this.gosmas.limpar();
    for (const f of this.feixes) f.limpar();
    this.sombra.visible = false;
    for (const p of this.pocas) { p.vida = 0; p.malha.visible = false; }
    for (const i of this.reserva) i.dispensar();
    this.afundado = 0;
  }

  _comecarAtaque() {
    this.mergulhos = 2 + Math.min(2, this.cansacos);
    this.rajadas = 3 + Math.min(1, this.cansacos);
    this.afundado = 0;
    for (const f of this.feixes) f.limpar();
  }

  /** Enquanto está dentro do chão, encostar nele não machuca. */
  get tempoAtordoado() { return this.afundado > 0.5 ? 1 : super.tempoAtordoado; }

  // ---------- Ataques ----------
  /** Afunda no chão, a sombra persegue o herói e ele sai lá embaixo com uma onda. */
  _ataque_mergulho(dt, { jogador, dx, dz, dist, rapido }) {
    const p = this.posicao, c = this.centroArena, j = jogador.posicao;
    if (this.etapa === 0) { // afunda
      this.afundado = Math.min(1, this.t / 0.6);
      if (this.t > 0.6) { this.etapa = 1; this.t = 0; som.efeito('fantasma'); this.sombra.visible = true; }
    } else if (this.etapa === 1) { // a sombra persegue
      this.afundado = 1;
      const v = 6.2 * rapido;
      if (dist > 0.3) { this.vx = dx / dist * v; this.vz = dz / dist * v; }
      if (this.t > 1.5 / rapido || dist < 0.6) { this.etapa = 2; this.t = 0; }
    } else if (this.etapa === 2) { // para: aviso!
      this.sombra.material.opacity = 0.5 + Math.sin(this.tempo * 30) * 0.35;
      if (this.t > 0.6) {
        this.etapa = 3; this.t = 0;
        this.afundado = 0;
        this.sombra.visible = false;
        this.sombra.material.opacity = 0.75;
        som.efeito('chefao_golpe');
        this.particulas.explosao(p.clone().setY(c.y + 0.4), 0xff6bd0, 22, 8);
        this.ondas.soltar(p.x, c.y, p.z);
        if (dist < 2.5 && j.y < c.y + 2.5) jogador.levarDano(p.x, p.z, 7);
      }
    } else if (this.t > 0.8) {
      this._virarPara(dx, dz, dt, 10);
      this.mergulhos--;
      if (this.mergulhos > 0) { this.etapa = 0; this.t = 0; }
      else this._proximoAtaque();
    }
    this.sombra.position.set(p.x, c.y + 0.07, p.z);
  }

  /** Linhas de tentáculos em cruz/estrela que giram a cada rajada, e um embaixo do herói. */
  _ataque_tentaculos(dt, { jogador, dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 5);
    const c = this.centroArena, p = this.posicao, j = jogador.posicao;
    if (this.rajadas > 0 && this.t > 1.35 / rapido) {
      this.t = 0;
      this.rajadas--;
      som.efeito('chefao_golpe');
      const base = Math.atan2(dx, dz) + (this.rajadas % 2 ? 0 : Math.PI / 4);
      const linhas = 3 + Math.min(2, this.cansacos);
      for (let l = 0; l < linhas; l++) {
        const a = base + (l / linhas) * Math.PI * 2;
        for (let i = 0; i < 6; i++) {
          const x = p.x + Math.sin(a) * (2.6 + i * 1.6), z = p.z + Math.cos(a) * (2.6 + i * 1.6);
          if (Math.hypot(x - c.x, z - c.z) < 12) this.brotos.brotar(x, c.y, z, i * 0.09);
        }
      }
      this.brotos.brotar(j.x, c.y, j.z, 0.1);
    } else if (this.rajadas === 0 && this.t > 2) {
      this._proximoAtaque();
    }
  }

  _ataque_olhar(dt, { dx, dz, rapido, andar }) {
    const p = this.posicao, c = this.centroArena;
    const n = 2 + Math.min(2, this.cansacos); // 2, 3, 4 raios
    if (this.etapa === 0) {
      andar(c.x, c.z, 5 * rapido);
      if (Math.hypot(p.x - c.x, p.z - c.z) < 1 || this.t > 2.5) { this.etapa = 1; this.t = 0; som.efeito('choque'); }
    } else if (this.etapa === 1) { // linhas finas de aviso
      for (let i = 0; i < n; i++) this.feixes[i].avisar();
      if (this.t > 1.2) {
        this.etapa = 2; this.t = 0;
        this.sentido = Math.random() < 0.5 ? 1 : -1;
        for (let i = 0; i < n; i++) this.feixes[i].ligar();
      }
    } else {
      // gira e, na metade, troca de lado
      const lado = this.t < 2.4 ? 1 : -1;
      this.angulo += this.sentido * lado * dt * 0.75 * rapido;
      if (Math.floor(this.t * 5) !== Math.floor((this.t - dt) * 5)) som.efeito('choque');
      if (this.t > 4.8) {
        for (const f of this.feixes) f.limpar();
        this._proximoAtaque();
        return;
      }
    }
    for (let i = 0; i < n; i++) this.feixes[i].posicionar(p.x, p.y + 0.6, p.z, this.angulo + (i / n) * Math.PI * 2);
  }

  _ataque_chuva(dt, { jogador, dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 5);
    const c = this.centroArena, j = jogador.posicao;
    if (this.rajadas > 0 && this.t > 1.25 / rapido) {
      this.t = 0;
      this.rajadas--;
      som.efeito('chefao_bolas');
      this.gosmas.lancar(j.x, c.y, j.z);
      const n = 5 + Math.min(2, this.cansacos);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 8.5;
        this.gosmas.lancar(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r);
      }
    } else if (this.rajadas === 0 && this.t > 1.8) {
      this._proximoAtaque();
    }
  }

  _ataque_exercito(dt, { dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 4);
    if (this.etapa === 0 && this.t > 1 / rapido) {
      this.etapa = 1; this.t = 0;
      som.efeito('chefao_rugido');
      const n = 2 + Math.min(2, this.cansacos), c = this.centroArena;
      const ordem = [0, 3, 1, 4, 2, 5]; // alterna sombra / espinhoso
      for (let i = 0; i < n; i++) {
        const a = this.angulo + (i - (n - 1) / 2) * 0.9;
        const x = c.x + Math.sin(a) * 7.5, z = c.z + Math.cos(a) * 7.5;
        if (this.reserva[ordem[i]].invocar(x, c.y + 0.3, z)) this.particulas.explosao(new THREE.Vector3(x, c.y + 0.8, z), 0xff6bd0, 14, 5);
      }
    } else if (this.etapa === 1 && this.t > 3) {
      this._proximoAtaque();
    }
  }

  // ---------- Visual ----------
  _atualizarEfeitos(dt, jogador) {
    this.ondas.atualizar(dt, jogador, this.tempo);
    this.brotos.atualizar(dt, jogador, this.tempo);
    this.gosmas.atualizar(dt, jogador, this.tempo);
    if (this.estado !== 'olhar') for (const f of this.feixes) f.limpar();
    for (const f of this.feixes) f.atualizar(dt, jogador, this.tempo);
    if (this.estado !== 'mergulho') { this.sombra.visible = false; this.afundado = 0; }
    const j = jogador.posicao;
    for (const p of this.pocas) {
      if (p.vida <= 0) continue;
      p.vida -= dt;
      p.malha.scale.setScalar(Math.max(0.01, Math.min(1, p.vida, (5 - p.vida) * 4 + 0.1)));
      p.malha.visible = p.vida > 0;
      const m = p.malha.position;
      if (Math.hypot(j.x - m.x, j.z - m.z) < 1.3 && Math.abs(j.y - m.y) < 0.5) jogador.infectar(30 * dt);
    }
  }

  _atualizarVisual(dt) {
    const m = this.m, t = this.tempo;
    const k = Math.min(1, 8 * dt);
    let estica = 1 + Math.sin(t * 2) * 0.03, abre = 0.9, agita = 1, inclina = 0;
    let olho = this.derrotado ? COR.olhoLimpo : COR.olho;
    switch (this.estado) {
      case 'dormindo': estica = 0.75; abre = 1.7; agita = 0.3; break;
      case 'acordando': estica = this.t > 0.7 ? 1.12 + Math.sin(t * 20) * 0.04 : 0.8; abre = 0.5; agita = 2.5; olho = COR.olhoBravo; break;
      case 'mergulho': olho = COR.olhoBravo; agita = 2; break;
      case 'tentaculos': abre = 0.35; agita = 2.2; olho = COR.olhoBravo; break;
      case 'olhar': olho = COR.olhoBravo; abre = 1.3; break;
      case 'chuva': abre = 0.2; agita = 1.6; estica = 1 + Math.sin(t * 10) * 0.05; olho = COR.olhoBravo; break;
      case 'exercito': estica = 1 + Math.sin(t * 16) * 0.05; abre = 0.5; agita = 2.5; break;
      case 'vulneravel': estica = 0.72; abre = 1.9; agita = 0.4; inclina = 0.12; break;
      case 'levantando': estica = 0.72 + 0.28 * Math.min(1, this.t); abre = 1.4; break;
      case 'purificado': estica = 1 + Math.sin(t * 5) * 0.08; abre = 0.7; break;
      default: break;
    }
    if (!['purificando', 'purificado'].includes(this.estado)) {
      const s = m.corpo.scale;
      s.y += (estica - s.y) * k;
      s.x = s.z = 1 / Math.sqrt(s.y);
      m.matGosma.color.lerp(new THREE.Color(CORES_FASE[Math.min(3, this.cansacos)]), k * 0.3);
    } else if (this.estado === 'purificado') {
      m.corpo.scale.set(0.45 / Math.sqrt(estica), 0.45 * estica, 0.45 / Math.sqrt(estica));
    }
    m.corpo.rotation.x += (inclina - m.corpo.rotation.x) * k;
    m.tentaculos.forEach((gomos, i) => gomos.forEach((g, n) => {
      if (n === 0) g.rotation.x += (abre - g.rotation.x) * k;
      else g.rotation.x = Math.sin(t * 2.4 * Math.min(1.6, agita) + i * 1.3 + n * 0.7) * 0.22 * Math.min(1.5, agita) + 0.08;
    }));
    m.gotas.forEach((g, i) => g.scale.set(1, 0.6 + Math.sin(t * 3 + i) * 0.15, 1));
    m.coroa.rotation.z = Math.sin(t * 1.7) * 0.06;
    m.boca.scale.y = this.estado === 'acordando' ? 1 : 0.5 + Math.sin(t * 4) * 0.1;
    if (!this.derrotado) m.matOlho.color.setHex(olho);
    const pisca = t % 4 < 0.12 ? 0.1 : 1;
    for (const o of m.olhos) o.scale.y = pisca;

    const vulneravel = this.estado === 'vulneravel';
    m.matNucleo.color.setHex(this.derrotado ? COR.nucleoLimpo : vulneravel ? COR.nucleoVulneravel : COR.nucleo);
    m.nucleo.scale.setScalar(vulneravel ? 1.7 + Math.sin(t * 10) * 0.35 : 1);
    m.nucleo.rotation.y += dt * 2;
    m.tontura.visible = vulneravel;
    m.tontura.rotation.y += dt * 4;
    m.matGosma.emissive.setHex(this.tempoBrilho > 0 ? 0xffffff : this.derrotado ? 0x0a2a3a : 0x12042a);
    this.modelo.position.copy(this.posicao);
    this.modelo.position.y -= (this.afundado || 0) * 5.8; // afunda no chão
    this.modelo.rotation.y = this.angulo;
  }
}
