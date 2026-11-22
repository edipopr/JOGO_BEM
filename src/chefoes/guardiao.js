// Chefão da Floresta dos Amigos: o Guardião da Floresta (árvore gigante contaminada).
// Ataques: golpe no chão (onda de choque — pule!) → investida → bolas de energia.
// 9 de vida, 3 golpes por cansaço = 3 ciclos. Derrotado, é purificado (fica verde).
// O fluxo comum (acordar, cansar, levar dano, purificar) está em base.js.
import * as THREE from 'three';
import { som } from '../audio.js';
import { ChefaoBase } from './base.js';

const COR = {
  copaInfectada: 0x6a3f9a, copaSaudavel: 0x3cc45a,
  olhoInfectado: 0xc6ff3d, olhoBravo: 0xff3b3b, olhoSaudavel: 0xffffff,
  nucleo: 0xb04dff, nucleoVulneravel: 0xffe14a, nucleoSaudavel: 0x7dff5a,
};

function criarModelo() {
  const grupo = new THREE.Group();
  const corpo = new THREE.Group(); // parte de cima (inclina quando dorme/cansa)
  grupo.add(corpo);
  const lambert = (cor) => new THREE.MeshLambertMaterial({ color: cor, flatShading: true, emissive: 0x000000 });
  const matTronco = lambert(0x7a4a26), matCasca = lambert(0x5a3518), matCopa = lambert(COR.copaInfectada);
  const matMancha = lambert(0xc6ff3d);
  const matOlho = new THREE.MeshBasicMaterial({ color: COR.olhoInfectado });
  const matNucleo = new THREE.MeshBasicMaterial({ color: COR.nucleo });
  const parte = (geo, mat, x, y, z, pai = corpo) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    pai.add(m);
    return m;
  };

  // Pernas (raízes grossas)
  parte(new THREE.CylinderGeometry(0.32, 0.45, 1.2, 7), matCasca, -0.55, 0.6, 0, grupo);
  parte(new THREE.CylinderGeometry(0.32, 0.45, 1.2, 7), matCasca, 0.55, 0.6, 0, grupo);
  // Tronco, rosto e núcleo contaminado no peito
  parte(new THREE.CylinderGeometry(0.9, 1.1, 2.0, 9), matTronco, 0, 2.0, 0);
  parte(new THREE.SphereGeometry(0.14, 6, 5), matOlho, -0.33, 2.65, 0.82);
  parte(new THREE.SphereGeometry(0.14, 6, 5), matOlho, 0.33, 2.65, 0.82);
  const sobrancelhaE = parte(new THREE.BoxGeometry(0.4, 0.1, 0.12), matCasca, -0.33, 2.86, 0.85);
  const sobrancelhaD = parte(new THREE.BoxGeometry(0.4, 0.1, 0.12), matCasca, 0.33, 2.86, 0.85);
  sobrancelhaE.rotation.z = -0.35; sobrancelhaD.rotation.z = 0.35;
  parte(new THREE.BoxGeometry(0.6, 0.12, 0.1), matCasca, 0, 2.35, 0.88);
  const nucleo = parte(new THREE.IcosahedronGeometry(0.3, 0), matNucleo, 0, 1.7, 0.98);
  // Copa (folhas contaminadas com manchas)
  parte(new THREE.IcosahedronGeometry(1.6, 0), matCopa, 0, 3.9, -0.1);
  parte(new THREE.IcosahedronGeometry(0.9, 0), matCopa, -1.1, 3.5, 0.1);
  parte(new THREE.IcosahedronGeometry(0.9, 0), matCopa, 1.1, 3.6, -0.2);
  const manchas = [];
  for (const [x, y, z] of [[0.6, 4.5, 0.9], [-0.7, 4.1, 1.0], [1.4, 3.9, 0.5], [-0.2, 5.0, 0.3], [-1.5, 3.7, 0.6]]) {
    manchas.push(parte(new THREE.SphereGeometry(0.18, 5, 4), matMancha, x, y, z));
  }
  // Braços: pivô no ombro, galho pendurado e "punho" de madeira na ponta
  const braco = (lado) => {
    const pivo = new THREE.Group();
    pivo.position.set(lado * 1.15, 2.6, 0);
    corpo.add(pivo);
    parte(new THREE.CylinderGeometry(0.22, 0.28, 1.5, 6), matTronco, 0, -0.75, 0, pivo);
    parte(new THREE.IcosahedronGeometry(0.45, 0), matCasca, 0, -1.6, 0, pivo);
    pivo.rotation.z = lado * 0.25;
    return pivo;
  };
  const bracoE = braco(-1), bracoD = braco(1);
  // Estrelinhas de tontura (quando cansado)
  const tontura = new THREE.Group();
  const matEstrela = new THREE.MeshBasicMaterial({ color: 0xffe14a });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const e = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), matEstrela);
    e.position.set(Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1);
    tontura.add(e);
  }
  tontura.position.y = 5.4;
  tontura.visible = false;
  corpo.add(tontura);

  return { grupo, corpo, bracoE, bracoD, nucleo, tontura, manchas, matTronco, matCopa, matOlho, matNucleo };
}

export class Guardiao extends ChefaoBase {
  constructor(cena, centro, particulas, opcoes) {
    super(cena, centro, particulas, opcoes, {
      nome: 'Guardião da Floresta',
      vida: 9, danoPorCansaco: 3, tempoVulneravel: 5.5,
      raioArena: 9.3, // fica dentro do círculo de pilares
      raio: 1.4, altura: 4.4, alturaCentro: 2.1,
      pontos: 500, cor: 0x8b2fc9,
      ataques: ['golpe', 'investida', 'bolas'],
      dicas: {
        golpe: 'Golpe no chão! PULE a onda de choque!',
        investida: 'Investida! Saia da frente dele!',
        bolas: 'Bolas de energia! Desvie correndo para o lado!',
      },
      textos: {
        acordou: 'O Guardião da Floresta acordou contaminado!',
        vulneravel: 'Ele cansou! Ataque o coração brilhante!',
        derrotado: 'Você purificou o Guardião! O portal se abriu!',
      },
    });
  }

  _criarModelo() {
    this.m = criarModelo();
    this.modelo = this.m.grupo;
    // Ondas de choque do golpe no chão (até 3 ao mesmo tempo)
    this.ondas = [0, 1, 2].map(() => {
      const malha = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.2, 6, 48),
        new THREE.MeshBasicMaterial({ color: 0xc6ff3d, transparent: true, opacity: 0.85 }),
      );
      malha.rotation.x = Math.PI / 2;
      malha.visible = false;
      this.cena.add(malha);
      return { malha, raio: 0, ativa: false, x: 0, y: 0, z: 0 };
    });
  }

  _visualNormal() {
    this.m.matCopa.color.setHex(COR.copaInfectada);
    this.m.matOlho.color.setHex(COR.olhoInfectado);
    for (const s of this.m.manchas) s.visible = true;
  }

  _visualPurificado() {
    this.m.matCopa.color.setHex(COR.copaSaudavel);
    this.m.matOlho.color.setHex(COR.olhoSaudavel);
    for (const s of this.m.manchas) s.visible = false;
  }

  /** Treme soltando a gosma e as folhas voltam a ficar verdes. */
  _purificando(dt) {
    const p = this.posicao;
    if (Math.random() < dt * 12) this.particulas.explosao(this.centro().clone().setY(p.y + 2 + Math.random() * 2), 0xb04dff, 4, 5);
    this.m.matCopa.color.lerpColors(new THREE.Color(COR.copaInfectada), new THREE.Color(COR.copaSaudavel), Math.min(1, this.t / 2.5));
  }

  _limparAtaques() {
    for (const o of this.ondas) { o.ativa = false; o.malha.visible = false; }
  }

  _comecarAtaque() {
    this.golpesRestantes = 1 + Math.min(2, this.cansacos); // 1, 2, 3 ondas por ciclo
    this.rajadas = 3;
    this.investidas = 0;
  }

  // ---------- Ataques ----------
  _ataque_golpe(dt, { jogador, dx, dz, dist, rapido, andar }) {
    const j = jogador.posicao;
    if (this.etapa === 0) { // anda até perto do herói
      if (dist > 3.2) andar(j.x, j.z, 2.8 * rapido);
      else this._virarPara(dx, dz, dt, 8);
      if (this.t > 1.8 || dist <= 3.2) { this.etapa = 1; this.t = 0; }
    } else if (this.etapa === 1) { // ergue os braços (aviso)
      this._virarPara(dx, dz, dt, 4);
      if (this.t > 0.85 / rapido) { this.etapa = 2; this.t = 0; this._bater(); this.golpesRestantes--; }
    } else if (this.t > 0.7) { // depois do golpe
      if (this.golpesRestantes > 0) { this.etapa = 1; this.t = 0.3; }
      else this._proximoAtaque();
    }
  }

  _ataque_investida(dt, { dx, dz, rapido }) {
    const p = this.posicao, c = this.centroArena;
    if (this.etapa === 0) { // mira e bate o pé (aviso)
      this._virarPara(dx, dz, dt, 10);
      if (Math.random() < dt * 12) this.particulas.explosao(p.clone().setY(p.y + 0.2), 0x9b6a3c, 2, 2);
      if (this.t > 1.1 / rapido) {
        this.etapa = 1; this.t = 0;
        this._direcao.set(Math.sin(this.angulo), 0, Math.cos(this.angulo));
        som.efeito('chefao_investida');
      }
    } else if (this.etapa === 1) { // corre em linha reta
      this.vx = this._direcao.x * 12 * rapido; this.vz = this._direcao.z * 12 * rapido;
      if (Math.random() < dt * 20) this.particulas.explosao(p.clone().setY(p.y + 0.2), 0x9b6a3c, 2, 3);
      const foraDaArena = Math.hypot(p.x - c.x, p.z - c.z) > this.c.raioArena - 0.2;
      if (this.t > 1.4 || foraDaArena) {
        this.etapa = 2; this.t = 0;
        som.efeito('chefao_golpe');
        this.particulas.explosao(this.centro().clone(), 0x9b6a3c, 12, 5);
      }
    } else if (this.t > 0.9) { // tonto da batida
      this.investidas++;
      if (this.cansacos >= 1 && this.investidas % 2 === 1) { this.etapa = 0; this.t = 0; } // 2 investidas depois do 1º cansaço
      else this._proximoAtaque();
    }
  }

  _ataque_bolas(dt, { jogador, projeteis, dx, dz, rapido, andar }) {
    const p = this.posicao, c = this.centroArena;
    if (this.etapa === 0) { // volta para o meio da arena
      andar(c.x, c.z, 3.5 * rapido);
      if (Math.hypot(p.x - c.x, p.z - c.z) < 1 || this.t > 2) { this.etapa = 1; this.t = 0.4; }
    } else {
      this._virarPara(dx, dz, dt, 6);
      if (this.rajadas > 0 && this.t > 0.95 / rapido) {
        this.t = 0;
        this._disparar(projeteis, jogador);
        this.rajadas--;
      } else if (this.rajadas === 0 && this.t > 1) {
        this._proximoAtaque();
      }
    }
  }


  _bater() {
    som.efeito('chefao_golpe');
    const f = this._direcao.set(Math.sin(this.angulo), 0, Math.cos(this.angulo));
    const x = this.posicao.x + f.x * 1.6, z = this.posicao.z + f.z * 1.6;
    this.particulas.explosao(new THREE.Vector3(x, this.posicao.y + 0.2, z), 0x9b6a3c, 16, 6);
    const onda = this.ondas.find((o) => !o.ativa);
    if (!onda) return;
    Object.assign(onda, { ativa: true, raio: 1.2, x, y: this.posicao.y, z, acertou: false });
    onda.malha.visible = true;
  }

  _disparar(projeteis, jogador) {
    som.efeito('chefao_bolas');
    const n = 5 + Math.min(2, this.cansacos) * 2; // 5, 7, 9 bolas em leque
    const origem = new THREE.Vector3(
      this.posicao.x + Math.sin(this.angulo) * 1.3, this.posicao.y + 1.3, this.posicao.z + Math.cos(this.angulo) * 1.3);
    const alvoY = jogador.posicao.y + 0.8;
    const base = Math.atan2(jogador.posicao.x - origem.x, jogador.posicao.z - origem.z);
    const dist = Math.hypot(jogador.posicao.x - origem.x, jogador.posicao.z - origem.z) || 1;
    // Rajadas alternadas: às vezes uma bola vai direto no jogador, às vezes o vão fica no meio
    const desloc = this.rajadas % 2 === 0 ? 0.5 : 0;
    for (let i = 0; i < n; i++) {
      const a = base + (i - (n - 1) / 2 + desloc) * 0.2;
      projeteis.disparar({
        origem,
        direcao: new THREE.Vector3(Math.sin(a), (alvoY - origem.y) / dist, Math.cos(a)),
        velocidade: 7.5, dono: 'inimigo', cor: 0xc6ff3d, raio: 0.38, duracao: 3,
      });
    }
  }

  _atualizarEfeitos(dt, jogador) {
    const j = jogador.posicao;
    for (const o of this.ondas) {
      if (!o.ativa) continue;
      o.raio += 7.5 * dt;
      o.malha.position.set(o.x, o.y + 0.25, o.z);
      o.malha.scale.set(o.raio, o.raio, 1 + Math.sin(this.tempo * 30) * 0.3);
      o.malha.material.opacity = 0.85 * Math.min(1, (12 - o.raio) / 3);
      // Machuca quem está no chão quando a onda passa — pulando, ela passa por baixo
      const d = Math.hypot(j.x - o.x, j.z - o.z);
      if (!o.acertou && Math.abs(d - o.raio) < 0.6 && j.y - o.y < 0.45 && Math.abs(j.y - o.y) < 2) {
        if (jogador.levarDano(o.x, o.z, 4)) o.acertou = true;
      }
      if (o.raio > 12) { o.ativa = false; o.malha.visible = false; }
    }
  }

  _atualizarVisual(dt) {
    const m = this.m;
    const k = Math.min(1, 10 * dt);
    let bracoX = Math.sin(this.tempo * 2) * 0.1; // balanço parado
    let inclina = 0, baixar = 0;
    let olho = this.derrotado ? COR.olhoSaudavel : COR.olhoInfectado;
    const vHoriz = Math.hypot(this.velocidade.x, this.velocidade.z);
    if (vHoriz > 0.5) bracoX = Math.sin(this.tempo * 8) * 0.4;

    switch (this.estado) {
      case 'dormindo': inclina = 0.35; baixar = 0.3; break;
      case 'acordando': inclina = 0.35 * Math.max(0, 1 - this.t); bracoX = this.t > 1 ? -2.6 : 0; break;
      case 'golpe':
        if (this.etapa === 1) { bracoX = -2.8; olho = COR.olhoBravo; inclina = -0.15; }
        else if (this.etapa === 2) { bracoX = this.t < 0.35 ? -0.9 : 0; inclina = this.t < 0.35 ? 0.3 : 0; }
        break;
      case 'investida':
        if (this.etapa === 0) { bracoX = 0.7; olho = COR.olhoBravo; inclina = 0.25; }
        else if (this.etapa === 1) { bracoX = -1.4; inclina = 0.4; }
        else { inclina = -0.2; }
        break;
      case 'bolas': if (this.etapa === 1) { bracoX = this.t < 0.3 ? -1.6 : -0.8; olho = COR.olhoBravo; } break;
      case 'vulneravel': inclina = 0.45; baixar = 0.6; bracoX = 0.2; break;
      case 'levantando': inclina = 0.45 * (1 - this.t); baixar = 0.6 * (1 - this.t); break;
      case 'purificando': inclina = Math.sin(this.tempo * 25) * 0.05; break;
      default: break;
    }

    m.bracoE.rotation.x += (bracoX - m.bracoE.rotation.x) * k;
    m.bracoD.rotation.x += (bracoX - m.bracoD.rotation.x) * k;
    m.corpo.rotation.x += (inclina - m.corpo.rotation.x) * k;
    m.corpo.position.y += (-baixar - m.corpo.position.y) * k;
    if (!this.derrotado) m.matOlho.color.setHex(olho);

    // Núcleo: roxo; amarelo piscando quando cansado (é a hora de atacar!); verde quando purificado
    const vulneravel = this.estado === 'vulneravel';
    m.matNucleo.color.setHex(this.derrotado ? COR.nucleoSaudavel : vulneravel ? COR.nucleoVulneravel : COR.nucleo);
    m.nucleo.scale.setScalar(vulneravel ? 1.3 + Math.sin(this.tempo * 10) * 0.25 : 1);
    m.nucleo.rotation.y += dt * 2;
    m.tontura.visible = vulneravel;
    m.tontura.rotation.y += dt * 4;

    m.matTronco.emissive.setHex(this.tempoBrilho > 0 ? 0xffffff : 0x000000);
    m.matCopa.emissive.setHex(this.tempoBrilho > 0 ? 0x555555 : 0x000000);
    this.modelo.position.copy(this.posicao);
    if (vHoriz > 0.5) this.modelo.position.y += Math.abs(Math.sin(this.tempo * 8)) * 0.12;
    this.modelo.rotation.y = this.angulo;
  }
}
