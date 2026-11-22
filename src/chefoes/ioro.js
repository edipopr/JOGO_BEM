// Chefão do Mar do Pesadelo: Ioro, o Palhaço Caótico (mãos e pés gigantes, 4 braços).
// Ataques: pancada no chão (ondas — pule) → bolas explosivas (saia dos círculos) → giro dos quatro braços
// (fuja dele) → corrida descontrolada (ricocheteia na arena). Depois escorrega e fica tonto.
// 15 de vida, 5 golpes por cansaço = 3 ciclos.
import * as THREE from 'three';
import { som } from '../audio.js';
import { ChefaoBase } from './base.js';
import { Ondas, Quedas, criarTontura } from './efeitos.js';

const COR = {
  traje: 0x5a1d7a, trajeLimpo: 0xff4d4d,
  detalhe: 0x9dff3d, detalheLimpo: 0xffd84a,
  cabelo: 0xff5a1f, cabeloLimpo: 0x5ad1ff,
  olho: 0xfff23d, olhoBravo: 0xff2a2a, olhoLimpo: 0xffffff,
  nucleo: 0xb04dff, nucleoVulneravel: 0xffe14a, nucleoLimpo: 0x7dfff0,
};
const RAIO_GIRO = 3.5;

function criarModelo() {
  const grupo = new THREE.Group();
  const corpo = new THREE.Group();
  grupo.add(corpo);
  const lambert = (cor) => new THREE.MeshLambertMaterial({ color: cor, flatShading: true });
  const matTraje = lambert(COR.traje), matDetalhe = lambert(COR.detalhe), matCabelo = lambert(COR.cabelo);
  const matPele = lambert(0xf4eee6), matLuva = lambert(0xffffff), matVermelho = lambert(0xff2a3b), matEscuro = lambert(0x1a0f24);
  const matOlho = new THREE.MeshBasicMaterial({ color: COR.olho });
  const matNucleo = new THREE.MeshBasicMaterial({ color: COR.nucleo });
  const parte = (geo, mat, x, y, z, pai = corpo) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    pai.add(m);
    return m;
  };
  // Pernas com calça listrada e pés gigantes
  const pernas = [-1, 1].map((s) => {
    const g = new THREE.Group();
    g.position.set(s * 0.6, 1.35, 0);
    parte(new THREE.CylinderGeometry(0.42, 0.5, 0.55, 8), matTraje, 0, -0.2, 0, g);
    parte(new THREE.CylinderGeometry(0.5, 0.45, 0.5, 8), matDetalhe, 0, -0.7, 0, g);
    const pe = parte(new THREE.SphereGeometry(0.75, 9, 6), matVermelho, 0, -1.05, 0.45, g);
    pe.scale.set(0.85, 0.5, 1.45);
    parte(new THREE.BoxGeometry(1.1, 0.16, 2), matEscuro, 0, -1.27, 0.45, g);
    grupo.add(g);
    return g;
  });
  // Barriga em bolinhas, gola e núcleo do pesadelo no peito
  parte(new THREE.CylinderGeometry(1.05, 0.75, 1.1, 10), matTraje, 0, 2.9, 0);
  const barriga = parte(new THREE.SphereGeometry(1.15, 12, 9), matTraje, 0, 2.05, 0.05);
  barriga.scale.set(1.05, 0.95, 0.95);
  for (const [x, y, z] of [[-0.55, 1.75, 0.9], [0.6, 1.6, 0.85], [0, 1.45, 1], [-0.95, 2.2, 0.45], [0.98, 2.2, 0.4]]) {
    parte(new THREE.SphereGeometry(0.2, 7, 5), matDetalhe, x, y, z).scale.z = 0.5;
  }
  const nucleo = parte(new THREE.IcosahedronGeometry(0.36, 0), matNucleo, 0, 2.5, 1.02);
  for (let i = 0; i < 12; i++) { // gola de babados
    const a = (i / 12) * Math.PI * 2;
    parte(new THREE.SphereGeometry(0.32, 6, 4), i % 2 ? matDetalhe : matLuva, Math.sin(a) * 0.85, 3.5, Math.cos(a) * 0.85).scale.y = 0.55;
  }
  // Cabeça de palhaço
  const cabeca = new THREE.Group();
  cabeca.position.y = 3.55;
  corpo.add(cabeca);
  parte(new THREE.IcosahedronGeometry(0.85, 1), matPele, 0, 0.75, 0, cabeca);
  parte(new THREE.SphereGeometry(0.26, 9, 7), matVermelho, 0, 0.72, 0.88, cabeca); // nariz
  for (const s of [-1, 1]) {
    parte(new THREE.SphereGeometry(0.22, 8, 6), matEscuro, s * 0.34, 0.98, 0.66, cabeca).scale.set(1, 1.35, 0.5);
    parte(new THREE.SphereGeometry(0.13, 8, 6), matOlho, s * 0.34, 0.97, 0.77, cabeca);
    parte(new THREE.ConeGeometry(0.08, 0.35, 4), matCabelo, s * 0.34, 0.55, 0.72, cabeca).rotation.x = Math.PI; // pintura dos olhos
    for (const [y, r] of [[1.05, 0.42], [0.72, 0.36], [1.3, 0.3]]) parte(new THREE.IcosahedronGeometry(r, 0), matCabelo, s * 0.95, y, -0.1, cabeca);
  }
  // Sorriso enorme com dentes
  const boca = parte(new THREE.TorusGeometry(0.46, 0.11, 6, 14, Math.PI), matVermelho, 0, 0.5, 0.62, cabeca);
  boca.rotation.z = Math.PI;
  for (let i = 0; i < 6; i++) parte(new THREE.ConeGeometry(0.07, 0.18, 4), matLuva, -0.3 + i * 0.12, 0.33 - Math.cos((i - 2.5) * 0.5) * 0.12, 0.74, cabeca).rotation.x = Math.PI;
  const chapeu = parte(new THREE.ConeGeometry(0.42, 0.95, 8), matTraje, 0.25, 1.85, 0, cabeca);
  chapeu.rotation.z = -0.25;
  parte(new THREE.SphereGeometry(0.16, 7, 5), matDetalhe, 0.37, 2.36, 0, cabeca);
  // Quatro braços com mãos gigantes
  const braco = (lado, y) => {
    const g = new THREE.Group();
    g.position.set(lado * 1.05, y, 0);
    parte(new THREE.SphereGeometry(0.4, 8, 6), matDetalhe, 0, 0, 0, g);
    parte(new THREE.CylinderGeometry(0.25, 0.32, 1.3, 8), matTraje, 0, -0.75, 0, g);
    parte(new THREE.CylinderGeometry(0.42, 0.42, 0.22, 8), matDetalhe, 0, -1.4, 0, g);
    const mao = parte(new THREE.IcosahedronGeometry(0.62, 1), matLuva, 0, -1.9, 0, g);
    for (const dx of [-0.36, 0, 0.36]) parte(new THREE.SphereGeometry(0.22, 6, 5), matLuva, dx, -0.42, 0.25, mao);
    parte(new THREE.SphereGeometry(0.2, 6, 5), matLuva, -lado * 0.55, -0.05, 0.25, mao);
    corpo.add(g);
    return g;
  };
  const bracos = [braco(-1, 3.2), braco(1, 3.2), braco(-1, 2.35), braco(1, 2.35)];
  const tontura = criarTontura(corpo, 6.1, 1.1);
  return { grupo, corpo, cabeca, pernas, bracos, nucleo, tontura, matTraje, matDetalhe, matCabelo, matOlho, matNucleo, matPele };
}

export class Ioro extends ChefaoBase {
  constructor(cena, centro, particulas, opcoes) {
    super(cena, centro, particulas, opcoes, {
      nome: 'Ioro, o Palhaço Caótico',
      vida: 15, danoPorCansaco: 5, tempoVulneravel: 6,
      raioArena: 9.8, meiaArena: 12.8, raio: 1.6, altura: 5.4, alturaCentro: 2.4,
      pontos: 1000, cor: 0xff4d4d,
      ataques: ['pancada', 'bombas', 'giro', 'corrida'],
      dicas: {
        pancada: 'Pancada de quatro mãos! PULE as ondas!',
        bombas: 'Bolas explosivas! Saia dos círculos!',
        giro: 'Giro dos quatro braços! Corra para longe!',
        corrida: 'Corrida maluca! Desvie até ele escorregar!',
      },
      textos: {
        acordou: 'HAHAHA! Ioro, o Palhaço Caótico, quer brincar!',
        vulneravel: 'Ioro escorregou! Ataque agora!',
        derrotado: 'Ioro foi libertado do pesadelo! O caminho do castelo se abriu!',
      },
    });
  }

  _criarModelo() {
    this.m = criarModelo();
    this.modelo = this.m.grupo;
    this.giroVisual = 0;
    this.ondas = new Ondas(this.cena, { cor: 0xff9dff, quantidade: 5 });
    this.bombas = new Quedas(this.cena, this.particulas, {
      geometria: new THREE.IcosahedronGeometry(0.55, 1), material: new THREE.MeshLambertMaterial({ color: 0xff4d4d, emissive: 0x551111, flatShading: true }),
      raio: 1.8, tempo: 1.25, arco: 4.5, quantidade: 18, sonora: true,
    });
  }

  _pintar(limpo) {
    this.m.matTraje.color.setHex(limpo ? COR.trajeLimpo : COR.traje);
    this.m.matDetalhe.color.setHex(limpo ? COR.detalheLimpo : COR.detalhe);
    this.m.matCabelo.color.setHex(limpo ? COR.cabeloLimpo : COR.cabelo);
    this.m.matOlho.color.setHex(limpo ? COR.olhoLimpo : COR.olho);
  }
  _visualNormal() { this._pintar(false); }
  _visualPurificado() { this._pintar(true); }

  _purificando(dt) {
    if (Math.random() < dt * 14) this.particulas.explosao(this.centro().clone().setY(this.posicao.y + 1 + Math.random() * 4), 0xb04dff, 4, 5);
    const k = Math.min(1, this.t / 2.5);
    this.m.matTraje.color.lerpColors(new THREE.Color(COR.traje), new THREE.Color(COR.trajeLimpo), k);
    this.m.matDetalhe.color.lerpColors(new THREE.Color(COR.detalhe), new THREE.Color(COR.detalheLimpo), k);
  }

  _limparAtaques() {
    this.ondas.limpar();
    this.bombas.limpar();
  }

  _comecarAtaque(nome) {
    this.golpes = 2 + Math.min(1, this.cansacos);
    this.rajadas = 3;
    this.batidas = 3 + Math.min(2, this.cansacos);
    if (nome === 'giro' || nome === 'corrida') som.efeito('palhaco');
  }

  // ---------- Ataques ----------
  _ataque_pancada(dt, { jogador, dx, dz, dist, rapido, andar }) {
    const j = jogador.posicao;
    if (this.etapa === 0) { // chega perto
      if (dist > 4) andar(j.x, j.z, 3 * rapido);
      else this._virarPara(dx, dz, dt, 8);
      if (this.t > 1.8 || dist <= 4) { this.etapa = 1; this.t = 0; }
    } else if (this.etapa === 1) { // ergue os quatro braços
      this._virarPara(dx, dz, dt, 5);
      if (this.t > 0.85 / rapido) {
        this.etapa = 2; this.t = 0;
        this.golpes--;
        som.efeito('chefao_golpe');
        const x = this.posicao.x + Math.sin(this.angulo) * 2.4, z = this.posicao.z + Math.cos(this.angulo) * 2.4;
        this.particulas.explosao(new THREE.Vector3(x, this.posicao.y + 0.3, z), 0xffffff, 16, 6);
        this.ondas.soltar(x, this.posicao.y, z);
      }
    } else if (this.t > 0.75) {
      if (this.golpes > 0) { this.etapa = 1; this.t = 0.25; }
      else this._proximoAtaque();
    }
  }

  _ataque_bombas(dt, { jogador, dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 5);
    if (this.rajadas > 0 && this.t > 1.15 / rapido) {
      this.t = 0;
      this.rajadas--;
      som.efeito('chefao_bolas');
      const c = this.centroArena, j = jogador.posicao;
      const n = 4 + Math.min(2, this.cansacos); // uma por mão (e mais, quando está bravo)
      for (let i = 0; i < n; i++) {
        const origem = this.posicao.clone();
        origem.x += (i % 2 ? 1.5 : -1.5); origem.y += i < 2 ? 4.5 : 3.2;
        let x = j.x, z = j.z; // a primeira vai no herói; as outras em volta
        if (i > 0) {
          const a = Math.random() * Math.PI * 2, r = 2.2 + Math.random() * 3.5;
          x += Math.cos(a) * r; z += Math.sin(a) * r;
        }
        const d = Math.hypot(x - c.x, z - c.z);
        if (d > 11) { x = c.x + (x - c.x) / d * 11; z = c.z + (z - c.z) / d * 11; }
        this.bombas.lancar(x, c.y, z, origem);
      }
    } else if (this.rajadas === 0 && this.t > 1.6) {
      this._proximoAtaque();
    }
  }

  _ataque_giro(dt, { jogador, dx, dz, dist, rapido, andar }) {
    const j = jogador.posicao;
    if (this.etapa === 0) { // abre os braços (aviso)
      this._virarPara(dx, dz, dt, 6);
      if (this.t > 1 / rapido) { this.etapa = 1; this.t = 0; }
    } else if (this.etapa === 1) { // gira perseguindo o herói
      andar(j.x, j.z, 3.5 * rapido);
      if (Math.random() < dt * 20) this.particulas.explosao(this.centro().clone(), 0xffffff, 2, 6);
      if (Math.floor(this.t * 4) !== Math.floor((this.t - dt) * 4)) som.efeito('chefao_investida');
      if (dist < RAIO_GIRO && j.y < this.posicao.y + 4) jogador.levarDano(this.posicao.x, this.posicao.z, 6);
      if (this.t > 3.4) { this.etapa = 2; this.t = 0; }
    } else if (this.t > 0.8) { // um pouco tonto
      this._proximoAtaque();
    }
  }

  _ataque_corrida(dt, { dx, dz, rapido }) {
    const p = this.posicao, c = this.centroArena;
    if (this.etapa === 0) { // bate os pés (aviso)
      this._virarPara(dx, dz, dt, 9);
      if (Math.random() < dt * 14) this.particulas.explosao(p.clone().setY(p.y + 0.2), 0xbfefff, 2, 3);
      if (this.t > 0.9 / rapido) {
        this.etapa = 1; this.t = 0;
        this._direcao.set(Math.sin(this.angulo), 0, Math.cos(this.angulo));
      }
    } else if (this.etapa === 1) { // corre e ricocheteia
      const v = 10 * rapido;
      this.vx = this._direcao.x * v; this.vz = this._direcao.z * v;
      this._virarPara(this._direcao.x, this._direcao.z, dt, 12);
      if (Math.random() < dt * 22) this.particulas.explosao(p.clone().setY(p.y + 0.2), 0xbfefff, 2, 3);
      if (this.t > 0.15 && Math.hypot(p.x - c.x, p.z - c.z) > this.c.raioArena - 0.3) {
        this.batidas--;
        som.efeito('chefao_golpe');
        this.particulas.explosao(this.centro().clone(), 0xffffff, 12, 5);
        if (this.batidas <= 0) { this.etapa = 2; this.t = 0; return; }
        // volta na direção do herói, meio torto
        const a = Math.atan2(dx, dz) + (Math.random() - 0.5) * 0.7;
        this._direcao.set(Math.sin(a), 0, Math.cos(a));
        this.t = 0;
      } else if (this.t > 2.5) { this.etapa = 2; this.t = 0; }
    } else if (this.t > 0.5) { // escorrega → cansado
      this._proximoAtaque();
    }
  }

  // ---------- Visual ----------
  _atualizarEfeitos(dt, jogador) {
    this.ondas.atualizar(dt, jogador, this.tempo);
    this.bombas.atualizar(dt, jogador, this.tempo);
  }

  _atualizarVisual(dt) {
    const m = this.m, t = this.tempo;
    const k = Math.min(1, 9 * dt);
    const v = Math.hypot(this.velocidade.x, this.velocidade.z);
    // [x dos braços de cima, x dos de baixo, abertura (z)]
    let cima = Math.sin(t * 2) * 0.15, baixo = Math.sin(t * 2 + 1) * 0.15, abre = 0.45, inclina = 0, baixar = 0, deita = 0;
    let olho = this.derrotado ? COR.olhoLimpo : COR.olho;
    let girando = false;
    switch (this.estado) {
      case 'dormindo': inclina = 0.3; baixar = 0.25; abre = 0.2; break;
      case 'acordando': cima = baixo = this.t > 0.8 ? -2.6 + Math.sin(t * 18) * 0.2 : 0; inclina = this.t > 0.8 ? -0.15 : 0.2; abre = 0.8; break;
      case 'pancada':
        if (this.etapa === 1) { cima = -2.9; baixo = -2.3; inclina = -0.15; olho = COR.olhoBravo; }
        else if (this.etapa === 2) { cima = -0.7; baixo = -0.5; inclina = this.t < 0.4 ? 0.4 : 0.1; abre = 0.2; }
        break;
      case 'bombas': { // joga com os braços alternados
        const f = Math.sin(this.t * 7);
        cima = -1.9 + f * 0.9; baixo = -1.4 - f * 0.9; olho = COR.olhoBravo;
        break;
      }
      case 'giro':
        cima = baixo = 0; abre = 1.5; olho = COR.olhoBravo;
        girando = this.etapa === 1;
        if (this.etapa === 2) { inclina = Math.sin(t * 10) * 0.15; abre = 0.8; }
        break;
      case 'corrida':
        if (this.etapa === 1) { inclina = 0.3; cima = Math.sin(t * 16) * 1.4; baixo = -Math.sin(t * 16) * 1.4; abre = 0.9; }
        else if (this.etapa === 2) { deita = -0.6; abre = 1.3; }
        olho = COR.olhoBravo;
        break;
      case 'vulneravel': deita = -0.75; baixar = 0.8; abre = 1.35; break; // caiu sentado
      case 'levantando': deita = -0.75 * (1 - this.t); baixar = 0.8 * (1 - this.t); abre = 1; break;
      case 'purificando': inclina = Math.sin(t * 25) * 0.05; break;
      case 'purificado': cima = -2.6 + Math.sin(t * 6) * 0.3; abre = 0.9; break; // acena feliz
      default: break;
    }
    const ir = (o, eixo, valor) => { o.rotation[eixo] += (valor - o.rotation[eixo]) * k; };
    m.bracos.forEach((b, i) => {
      const lado = i % 2 ? 1 : -1;
      ir(b, 'x', i < 2 ? cima : baixo);
      ir(b, 'z', lado * (i < 2 ? abre : abre * 0.85 + 0.1));
    });
    ir(m.corpo, 'x', inclina + deita);
    m.corpo.position.y += (-baixar - m.corpo.position.y) * k;
    m.cabeca.rotation.z = Math.sin(t * (this.estado === 'acordando' ? 16 : 2.5)) * 0.12;
    const passo = v > 0.5 ? Math.sin(t * (v > 6 ? 18 : 9)) * 0.7 : 0;
    const senta = deita < -0.3 ? -1.3 : 0;
    ir(m.pernas[0], 'x', senta || passo);
    ir(m.pernas[1], 'x', senta || -passo);
    if (!this.derrotado) m.matOlho.color.setHex(olho);

    const vulneravel = this.estado === 'vulneravel';
    m.matNucleo.color.setHex(this.derrotado ? COR.nucleoLimpo : vulneravel ? COR.nucleoVulneravel : COR.nucleo);
    m.nucleo.scale.setScalar(vulneravel ? 1.5 + Math.sin(t * 10) * 0.3 : 1);
    m.nucleo.rotation.y += dt * 2;
    m.tontura.visible = vulneravel;
    m.tontura.rotation.y += dt * 4;
    const brilho = this.tempoBrilho > 0 ? 0xffffff : 0x000000;
    for (const mat of [m.matTraje, m.matDetalhe, m.matPele]) mat.emissive.setHex(brilho);

    if (girando) this.giroVisual += dt * 14;
    else this.giroVisual *= 1 - Math.min(1, 10 * dt);
    this.giroVisual %= Math.PI * 2;
    this.modelo.position.copy(this.posicao);
    if (v > 0.5) this.modelo.position.y += Math.abs(Math.sin(t * 9)) * 0.15;
    this.modelo.rotation.y = this.angulo + this.giroVisual;
  }
}
