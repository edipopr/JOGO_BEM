// Chefão da Floresta à Noite: o Monstro de Cristal (gigante de cristais contaminados).
// Ataques: chuva de cristais (saia dos círculos!) → linha de espinhos (pule ou saia da linha)
// → estilhaços (anéis de cristais em todas as direções — pule ou passe pelos vãos).
// Cansado, o escudo de cristais cai e o coração fica exposto. 12 de vida, 4 golpes por cansaço = 3 ciclos.
import * as THREE from 'three';
import { som } from '../audio.js';
import { ChefaoBase } from './base.js';

const COR = {
  cristal: 0x6a3fd0, cristalBrilho: 0x2a0b6c, cristalLimpo: 0x9fe8ff, brilhoLimpo: 0x1a6a8a,
  olho: 0xc6ff3d, olhoBravo: 0xff3b6b, olhoLimpo: 0xffffff,
  nucleo: 0xff3bd0, nucleoVulneravel: 0xffe14a, nucleoLimpo: 0x7dfff0,
  aviso: 0xff3b6b,
};

function criarModelo() {
  const grupo = new THREE.Group();
  const corpo = new THREE.Group();
  grupo.add(corpo);
  const matCristal = new THREE.MeshLambertMaterial({ color: COR.cristal, emissive: COR.cristalBrilho, flatShading: true });
  const matEscuro = new THREE.MeshLambertMaterial({ color: 0x2a1850, emissive: 0x100828, flatShading: true });
  const matOlho = new THREE.MeshBasicMaterial({ color: COR.olho });
  const matNucleo = new THREE.MeshBasicMaterial({ color: COR.nucleo });
  const parte = (geo, mat, x, y, z, pai = corpo) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    pai.add(m);
    return m;
  };
  // Pernas: pilares de cristal
  for (const x of [-0.6, 0.6]) {
    const perna = parte(new THREE.CylinderGeometry(0.28, 0.45, 1.4, 5), matEscuro, x, 0.7, 0, grupo);
    perna.rotation.y = 0.4;
  }
  // Tronco: grande octaedro esticado
  const tronco = parte(new THREE.OctahedronGeometry(1.25, 0), matCristal, 0, 2.3, 0);
  tronco.scale.set(1, 1.15, 0.8);
  const nucleo = parte(new THREE.IcosahedronGeometry(0.32, 0), matNucleo, 0, 2.2, 0.95);
  // Cabeça e olhos
  const cabeca = parte(new THREE.OctahedronGeometry(0.6, 0), matCristal, 0, 3.75, 0);
  cabeca.scale.set(1, 0.85, 0.9);
  parte(new THREE.BoxGeometry(0.18, 0.08, 0.05), matOlho, -0.2, 3.8, 0.47);
  parte(new THREE.BoxGeometry(0.18, 0.08, 0.05), matOlho, 0.2, 3.8, 0.47);
  // Pontas de cristal saindo das costas e ombros
  for (const [x, y, z, rz] of [[-0.9, 3.2, -0.3, 0.6], [0.9, 3.2, -0.3, -0.6], [0, 3.3, -0.6, 0], [-0.5, 2.8, -0.7, 0.3], [0.5, 2.8, -0.7, -0.3]]) {
    const ponta = parte(new THREE.ConeGeometry(0.22, 1.1, 4), matCristal, x, y, z);
    ponta.rotation.set(-0.5, 0, rz);
  }
  // Braços: cristais flutuantes (sem cotovelo)
  const braco = (lado) => {
    const pivo = new THREE.Group();
    pivo.position.set(lado * 1.5, 2.7, 0);
    corpo.add(pivo);
    const punho = parte(new THREE.OctahedronGeometry(0.55, 0), matCristal, 0, -0.9, 0, pivo);
    punho.scale.set(0.8, 1.4, 0.8);
    return pivo;
  };
  const bracoE = braco(-1), bracoD = braco(1);
  // Escudo: cristais girando em volta (somem quando ele cansa)
  const escudo = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const e = parte(new THREE.OctahedronGeometry(0.28, 0), matCristal, Math.cos(a) * 2.1, 0, Math.sin(a) * 2.1, escudo);
    e.scale.y = 1.6;
  }
  escudo.position.y = 2.3;
  corpo.add(escudo);
  // Estrelinhas de tontura
  const tontura = new THREE.Group();
  const matEstrela = new THREE.MeshBasicMaterial({ color: 0xffe14a });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const e = new THREE.Mesh(new THREE.OctahedronGeometry(0.2, 0), matEstrela);
    e.position.set(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9);
    tontura.add(e);
  }
  tontura.position.y = 4.6;
  tontura.visible = false;
  corpo.add(tontura);
  return { grupo, corpo, bracoE, bracoD, nucleo, escudo, tontura, matCristal, matOlho, matNucleo };
}

export class MonstroCristal extends ChefaoBase {
  constructor(cena, centro, particulas, opcoes) {
    super(cena, centro, particulas, opcoes, {
      nome: 'Monstro de Cristal',
      vida: 12, danoPorCansaco: 4, tempoVulneravel: 5.5,
      raioArena: 9, raio: 1.5, altura: 4.6, alturaCentro: 2.2,
      pontos: 700, cor: 0x9f6bff,
      ataques: ['chuva', 'espinhos', 'estilhacos'],
      dicas: {
        chuva: 'Chuva de cristais! Saia dos círculos vermelhos!',
        espinhos: 'Espinhos no chão! Pule ou saia da linha!',
        estilhacos: 'Estilhaços! Pule ou passe pelos vãos!',
      },
      textos: {
        acordou: 'O Monstro de Cristal despertou!',
        vulneravel: 'O escudo caiu! Ataque o coração de cristal!',
        derrotado: 'O Monstro de Cristal foi purificado! O portal se abriu!',
      },
    });
  }

  _criarModelo() {
    this.m = criarModelo();
    this.modelo = this.m.grupo;
    const matAviso = new THREE.MeshBasicMaterial({ color: COR.aviso, transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false });
    const geoAviso = new THREE.RingGeometry(0.9, 1.3, 24);
    const geoQueda = new THREE.OctahedronGeometry(0.6, 0);
    const geoEspinho = new THREE.ConeGeometry(0.45, 1.8, 5);
    // Cristais da chuva: círculo de aviso no chão + cristal caindo
    this.quedas = Array.from({ length: 16 }, () => {
      const aviso = new THREE.Mesh(geoAviso, matAviso);
      aviso.rotation.x = -Math.PI / 2;
      const cristal = new THREE.Mesh(geoQueda, this.m.matCristal);
      cristal.scale.y = 1.8;
      aviso.visible = cristal.visible = false;
      this.cena.add(aviso, cristal);
      return { aviso, cristal, ativo: false, t: 0, x: 0, y: 0, z: 0 };
    });
    // Espinhos que brotam do chão
    this.espinhos = Array.from({ length: 40 }, () => {
      const aviso = new THREE.Mesh(geoAviso, matAviso);
      aviso.rotation.x = -Math.PI / 2;
      aviso.scale.setScalar(0.6);
      const malha = new THREE.Mesh(geoEspinho, this.m.matCristal);
      aviso.visible = malha.visible = false;
      this.cena.add(aviso, malha);
      return { aviso, malha, ativo: false, t: 0, x: 0, y: 0, z: 0 };
    });
  }

  _visualNormal() {
    this.m.matCristal.color.setHex(COR.cristal);
    this.m.matCristal.emissive.setHex(COR.cristalBrilho);
    this.m.matOlho.color.setHex(COR.olho);
    this.m.escudo.visible = true;
  }

  _visualPurificado() {
    this.m.matCristal.color.setHex(COR.cristalLimpo);
    this.m.matCristal.emissive.setHex(COR.brilhoLimpo);
    this.m.matOlho.color.setHex(COR.olhoLimpo);
    this.m.escudo.visible = false;
  }

  _purificando(dt) {
    const p = this.posicao;
    if (Math.random() < dt * 14) this.particulas.explosao(this.centro().clone().setY(p.y + 1.5 + Math.random() * 2.5), 0xb04dff, 4, 5);
    const k = Math.min(1, this.t / 2.5);
    this.m.matCristal.color.lerpColors(new THREE.Color(COR.cristal), new THREE.Color(COR.cristalLimpo), k);
    this.m.matCristal.emissive.lerpColors(new THREE.Color(COR.cristalBrilho), new THREE.Color(COR.brilhoLimpo), k);
  }

  _limparAtaques() {
    for (const q of this.quedas) { q.ativo = false; q.aviso.visible = q.cristal.visible = false; }
    for (const e of this.espinhos) { e.ativo = false; e.aviso.visible = e.malha.visible = false; }
  }

  _comecarAtaque() {
    this.ondasChuva = 2;
    this.aneis = 3 + Math.min(2, this.cansacos);
    this.giroAnel = 0;
  }

  // ---------- Ataques ----------
  /** Cristais caem em vários pontos — um deles sempre onde o herói está. */
  _ataque_chuva(dt, { jogador, dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 4);
    if (this.etapa === 0 && this.t > 0.9 / rapido) { // braços para cima, depois a chuva
      this.etapa = 1; this.t = 0;
      som.efeito('chefao_bolas');
      const n = 5 + Math.min(2, this.cansacos) * 2;
      const j = jogador.posicao, c = this.centroArena;
      this._cairCristal(j.x, j.z);
      for (let i = 1; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 1.5 + Math.random() * 7;
        this._cairCristal(c.x + Math.cos(a) * r, c.z + Math.sin(a) * r);
      }
    } else if (this.etapa === 1 && this.t > 1.6) {
      this.ondasChuva--;
      if (this.ondasChuva > 0) { this.etapa = 0; this.t = 0.3; }
      else this._proximoAtaque();
    }
  }

  _cairCristal(x, z) {
    const q = this.quedas.find((o) => !o.ativo);
    if (!q) return;
    Object.assign(q, { ativo: true, t: 0, x, y: this.centroArena.y, z, acertou: false });
    q.aviso.position.set(x, q.y + 0.06, z);
    q.aviso.visible = true;
    q.cristal.visible = false;
  }

  /** Linhas de espinhos que avançam do monstro na direção do herói. */
  _ataque_espinhos(dt, { dx, dz, rapido }) {
    if (this.etapa === 0) {
      this._virarPara(dx, dz, dt, 8);
      if (this.t > 0.8 / rapido) {
        this.etapa = 1; this.t = 0;
        som.efeito('chefao_golpe');
        const base = this.angulo;
        const linhas = this.cansacos >= 1 ? [-0.45, 0, 0.45] : [0];
        for (const desvio of linhas) {
          const a = base + desvio;
          for (let i = 0; i < 11; i++) {
            this._brotarEspinho(this.posicao.x + Math.sin(a) * (2 + i * 1.2), this.posicao.z + Math.cos(a) * (2 + i * 1.2), -i * 0.11);
          }
        }
      }
    } else if (this.t > 2.4) {
      this._proximoAtaque();
    }
  }

  _brotarEspinho(x, z, atraso) {
    const c = this.centroArena;
    if (Math.hypot(x - c.x, z - c.z) > 11) return; // fora da arena
    const e = this.espinhos.find((o) => !o.ativo);
    if (!e) return;
    Object.assign(e, { ativo: true, t: atraso, x, y: c.y, z, acertou: false });
    e.aviso.position.set(x, e.y + 0.06, z);
    e.malha.position.set(x, e.y - 1, z);
  }

  /** Gira e solta anéis de cristais para todos os lados. */
  _ataque_estilhacos(dt, { projeteis, dx, dz, rapido }) {
    if (this.etapa === 0) { // encolhe (aviso)
      this._virarPara(dx, dz, dt, 4);
      if (this.t > 0.9 / rapido) { this.etapa = 1; this.t = 0.5; }
    } else {
      this.angulo += dt * 6; // girando
      if (this.aneis > 0 && this.t > 0.75 / rapido) {
        this.t = 0;
        this.aneis--;
        som.efeito('chefao_bolas');
        const n = 10 + Math.min(2, this.cansacos) * 2;
        this.giroAnel += Math.PI / n; // cada anel deslocado: os vãos mudam de lugar
        const origem = this.posicao.clone().setY(this.posicao.y + 0.9);
        for (let i = 0; i < n; i++) {
          const a = this.giroAnel + (i / n) * Math.PI * 2;
          projeteis.disparar({
            origem, direcao: new THREE.Vector3(Math.sin(a), 0, Math.cos(a)),
            velocidade: 6.5, dono: 'inimigo', cor: 0xd08bff, raio: 0.32, duracao: 2.6,
          });
        }
      } else if (this.aneis === 0 && this.t > 1) {
        this._proximoAtaque();
      }
    }
  }

  // ---------- Efeitos ----------
  _atualizarEfeitos(dt, jogador) {
    const j = jogador.posicao;
    for (const q of this.quedas) {
      if (!q.ativo) continue;
      q.t += dt;
      const QUEDA = 1.1; // tempo de aviso antes do impacto
      q.aviso.material.opacity = 0.35 + Math.sin(this.tempo * 18) * 0.2;
      if (q.t > QUEDA - 0.35) { // cristal caindo
        q.cristal.visible = true;
        const k = Math.min(1, (q.t - (QUEDA - 0.35)) / 0.35);
        q.cristal.position.set(q.x, q.y + 0.9 + (1 - k) * 10, q.z);
        q.cristal.rotation.y += dt * 8;
      }
      if (q.t >= QUEDA && !q.acertou) {
        q.acertou = true;
        this.particulas.explosao(new THREE.Vector3(q.x, q.y + 0.5, q.z), 0xd08bff, 10, 5);
        if (Math.hypot(j.x - q.x, j.z - q.z) < 1.4 && Math.abs(j.y - q.y) < 2.2) jogador.levarDano(q.x, q.z, 3);
      }
      if (q.t > QUEDA + 0.5) { q.ativo = false; q.aviso.visible = q.cristal.visible = false; }
    }
    for (const e of this.espinhos) {
      if (!e.ativo) continue;
      e.t += dt;
      if (e.t < 0) continue; // ainda não chegou a vez dele
      const AVISO = 0.45, SUBIDO = 0.7;
      e.aviso.visible = e.t < AVISO + SUBIDO;
      e.malha.visible = e.t >= AVISO;
      if (e.t >= AVISO) {
        const k = Math.min(1, (e.t - AVISO) / 0.08) * (e.t > AVISO + SUBIDO - 0.15 ? Math.max(0, (AVISO + SUBIDO - e.t) / 0.15) : 1);
        e.malha.position.set(e.x, e.y - 0.9 + k * 1.8, e.z);
        if (!e.acertou && k > 0.5 && Math.hypot(j.x - e.x, j.z - e.z) < 0.85 && j.y - e.y < 1.3 && j.y - e.y > -1) {
          if (jogador.levarDano(e.x, e.z, 4)) e.acertou = true;
        }
      }
      if (e.t > AVISO + SUBIDO) { e.ativo = false; e.aviso.visible = e.malha.visible = false; }
    }
  }

  _atualizarVisual(dt) {
    const m = this.m;
    const k = Math.min(1, 8 * dt);
    let bracoX = Math.sin(this.tempo * 1.5) * 0.15, inclina = 0, baixar = 0;
    let olho = this.derrotado ? COR.olhoLimpo : COR.olho;
    switch (this.estado) {
      case 'dormindo': inclina = 0.3; baixar = 0.4; break;
      case 'acordando': inclina = 0.3 * Math.max(0, 1 - this.t); bracoX = this.t > 1 ? -2.8 : 0; break;
      case 'chuva': bracoX = this.etapa === 0 ? -2.9 : -0.4; olho = COR.olhoBravo; break;
      case 'espinhos': bracoX = this.etapa === 0 ? -2.2 : 0.3; inclina = this.etapa === 0 ? -0.1 : 0.25; olho = COR.olhoBravo; break;
      case 'estilhacos': bracoX = -1.57; baixar = this.etapa === 0 ? 0.4 : 0; olho = COR.olhoBravo; break;
      case 'vulneravel': inclina = 0.5; baixar = 0.9; bracoX = 0.3; break;
      case 'levantando': inclina = 0.5 * (1 - this.t); baixar = 0.9 * (1 - this.t); break;
      case 'purificando': inclina = Math.sin(this.tempo * 25) * 0.05; break;
      default: break;
    }
    // braços flutuam (balançam para os lados)
    m.bracoE.rotation.x += (bracoX - m.bracoE.rotation.x) * k;
    m.bracoD.rotation.x += (bracoX - m.bracoD.rotation.x) * k;
    m.bracoE.position.y = 2.7 + Math.sin(this.tempo * 3) * 0.1;
    m.bracoD.position.y = 2.7 + Math.cos(this.tempo * 3) * 0.1;
    m.corpo.rotation.x += (inclina - m.corpo.rotation.x) * k;
    m.corpo.position.y += (-baixar - m.corpo.position.y) * k;
    if (!this.derrotado) m.matOlho.color.setHex(olho);

    const vulneravel = this.estado === 'vulneravel';
    // escudo de cristais: gira enquanto protegido; cai quando cansa
    m.escudo.visible = !this.derrotado && !vulneravel && this.estado !== 'levantando';
    m.escudo.rotation.y += dt * (this.estado === 'estilhacos' ? 6 : 1.5);
    m.matNucleo.color.setHex(this.derrotado ? COR.nucleoLimpo : vulneravel ? COR.nucleoVulneravel : COR.nucleo);
    m.nucleo.scale.setScalar(vulneravel ? 1.4 + Math.sin(this.tempo * 10) * 0.3 : 1);
    m.nucleo.rotation.y += dt * 2;
    m.tontura.visible = vulneravel;
    m.tontura.rotation.y += dt * 4;
    if (this.estado === 'levantando' && this.t < dt * 1.5) { // escudo volta: brilho
      this.particulas.explosao(this.centro().clone(), 0xd08bff, 14, 5);
    }
    if (vulneravel && this.t < dt * 1.5) this.particulas.explosao(this.centro().clone(), 0x9f6bff, 18, 6); // escudo quebra

    m.matCristal.emissive.setHex(this.tempoBrilho > 0 ? 0xffffff : this.derrotado ? COR.brilhoLimpo : COR.cristalBrilho);
    this.modelo.position.copy(this.posicao);
    this.modelo.rotation.y = this.angulo;
  }
}
