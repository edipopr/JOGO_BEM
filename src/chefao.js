// Chefão da Floresta dos Amigos: o Guardião da Floresta (árvore gigante contaminada).
// Ciclo de ataques: golpe no chão (onda de choque — pule!) → investida → bolas de energia.
// Depois dos 3 ataques fica cansado (vulnerável): só aí leva dano, no máximo 3 golpes por vez.
// 9 de vida = 3 ciclos. A cada ciclo fica mais rápido. Derrotado, é purificado (fica verde).
//
// Para o combate, ele se comporta como um inimigo do GerenciadorInimigos
// (ativo, posicao, raio, altura, centro(), receberDano(), bloquear(), tempoAtordoado, cfg).
import * as THREE from 'three';
import { GRAVIDADE, moverComColisao } from './fisica.js';
import { som } from './audio.js';

const VIDA = 9;
const DANO_POR_CANSACO = 3;
const TEMPO_VULNERAVEL = 5.5;
const RAIO_ARENA = 9.3;        // fica dentro do círculo de pilares
const ATAQUES = ['golpe', 'investida', 'bolas'];
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

export class Chefao {
  /**
   * centro = ponto no chão, no meio da arena.
   * barreira = { malha, caixa } que fecha a entrada da arena durante a luta; caixas = sólidos da fase.
   */
  constructor(cena, centro, particulas, { barreira = null, caixas = [] } = {}) {
    this.barreira = barreira;
    this.caixas = caixas;
    this.cena = cena;
    this.centroArena = centro.clone();
    this.particulas = particulas;
    this.nome = 'Guardião da Floresta';
    this.m = criarModelo();
    this.modelo = this.m.grupo;
    cena.add(this.modelo);

    // Ondas de choque do golpe no chão (até 3 ao mesmo tempo)
    this.ondas = [0, 1, 2].map(() => {
      const malha = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.2, 6, 48),
        new THREE.MeshBasicMaterial({ color: 0xc6ff3d, transparent: true, opacity: 0.85 }),
      );
      malha.rotation.x = Math.PI / 2;
      malha.visible = false;
      cena.add(malha);
      return { malha, raio: 0, ativa: false, x: 0, y: 0, z: 0 };
    });

    this.raio = 1.4;
    this.altura = 4.4;
    this.cfg = { cor: 0x8b2fc9, pontos: 500 };
    this.empurrao = 5; // empurrão menor que o dos inimigos comuns: não joga o herói para fora da arena
    this.vidaMax = VIDA;
    this.posicao = new THREE.Vector3();
    this.velocidade = new THREE.Vector3();
    this._centro = new THREE.Vector3();
    this._direcao = new THREE.Vector3();
    this.tempo = 0;
    /** main.js troca por uma função que recebe os eventos: 'acordou', 'dica', 'vulneravel', 'derrotado'. */
    this.avisar = () => {};
    this.renascer();
  }

  /** Volta tudo ao começo (recomeçar a fase). */
  renascer() {
    this.derrotado = false;
    this.dicasVistas = new Set();
    this.reiniciarLuta();
  }

  /** Volta a dormir no centro com vida cheia (jogador caiu/tentou de novo). Não faz nada se já foi derrotado. */
  reiniciarLuta() {
    if (this.derrotado) return;
    this.ativo = true;
    this.vida = VIDA;
    this.cansacos = 0;
    this.posicao.copy(this.centroArena);
    this.velocidade.set(0, 0, 0);
    this.angulo = 0;
    this._mudar('dormindo');
    this.indiceAtaque = 0;
    this.danoNoCansaco = 0;
    this.tempoImune = 0;
    this.tempoBrilho = 0;
    for (const o of this.ondas) { o.ativa = false; o.malha.visible = false; }
    this.m.matCopa.color.setHex(COR.copaInfectada);
    this.m.matOlho.color.setHex(COR.olhoInfectado);
    for (const s of this.m.manchas) s.visible = true;
    this._fecharArena(false);
  }

  /** Raízes sobem e fecham a entrada (true) ou somem (false). */
  _fecharArena(fechar) {
    const b = this.barreira;
    if (!b) return;
    const i = this.caixas.indexOf(b.caixa);
    if (fechar && i < 0) this.caixas.push(b.caixa);
    if (!fechar && i >= 0) this.caixas.splice(i, 1);
    b.malha.visible = fechar;
    if (fechar) b.malha.scale.y = 0.01; // cresce em _atualizarVisual
  }

  get acordado() { return this.ativo && this.estado !== 'dormindo'; }
  /** Usado pelo GerenciadorInimigos: > 0 = encostar não machuca. */
  get tempoAtordoado() { return !this.ativo || this.estado === 'dormindo' || this.estado === 'vulneravel' ? 1 : 0; }

  centro() {
    return this._centro.set(this.posicao.x, this.posicao.y + 2.1, this.posicao.z);
  }

  /** Golpe do jogador quando ele NÃO pode levar dano. Retorna true se bloqueou. */
  bloquear() {
    if (this.estado === 'vulneravel') return this.tempoImune > 0;
    if (this.estado === 'dormindo') this._acordar();
    som.efeito('bloqueio');
    this.particulas.explosao(this.centro().clone(), 0xbbbbbb, 5, 3);
    if (!this.dicasVistas.has('bloqueio') && this.estado !== 'acordando') {
      this.dicasVistas.add('bloqueio');
      this.avisar('dica', 'Ele está protegido! Espere ele cansar para atacar.');
    }
    return true;
  }

  receberDano() {
    this.vida--;
    this.danoNoCansaco++;
    this.tempoImune = 0.45;
    this.tempoBrilho = 0.2;
    if (this.vida <= 0) {
      this._derrotar();
      return true;
    }
    som.efeito('chefao_dor');
    if (this.danoNoCansaco >= DANO_POR_CANSACO) this._mudar('levantando');
    return false;
  }

  // ---------- Estados ----------
  _mudar(estado) {
    this.estado = estado;
    this.t = 0;
    this.etapa = 0;
  }

  _acordar() {
    this._mudar('acordando');
    this._fecharArena(true);
    som.efeito('chefao_rugido');
    this.avisar('acordou');
  }

  _dica(chave, texto) {
    if (this.dicasVistas.has(chave)) return;
    this.dicasVistas.add(chave);
    this.avisar('dica', texto);
  }

  _proximoAtaque() {
    if (this.indiceAtaque >= ATAQUES.length) {
      this.indiceAtaque = 0;
      this.danoNoCansaco = 0;
      this._mudar('vulneravel');
      som.efeito('chefao_cansado');
      this.avisar('vulneravel');
      return;
    }
    this._mudar(ATAQUES[this.indiceAtaque++]);
    this.golpesRestantes = 1 + Math.min(2, this.cansacos); // 1, 2, 3 ondas por ciclo
    this.rajadas = 3;
    if (this.estado === 'golpe') this._dica('golpe', 'Golpe no chão! PULE a onda de choque!');
    if (this.estado === 'investida') this._dica('investida', 'Investida! Saia da frente dele!');
    if (this.estado === 'bolas') this._dica('bolas', 'Bolas de energia! Desvie correndo para o lado!');
  }

  _derrotar() {
    this.derrotado = true;
    this._fecharArena(false);
    this.ativo = false;
    this._mudar('purificando');
    for (const o of this.ondas) { o.ativa = false; o.malha.visible = false; }
    som.efeito('chefao_derrotado');
    this.avisar('derrotado');
  }

  // ---------- Ataques ----------
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

  // ---------- A cada quadro ----------
  atualizar(dt, jogador, caixas, projeteis) {
    this.tempo += dt;
    this.t += dt;
    this.tempoImune = Math.max(0, this.tempoImune - dt);
    this.tempoBrilho -= dt;
    const p = this.posicao, v = this.velocidade, c = this.centroArena, j = jogador.posicao;
    const dx = j.x - p.x, dz = j.z - p.z;
    const dist = Math.hypot(dx, dz) || 0.01;
    const naArena = jogador.vida > 0 && j.y > c.y - 1.5 && Math.abs(j.x - c.x) < 12.5 && Math.abs(j.z - c.z) < 12.5;
    const rapido = 1 + Math.min(2, this.cansacos) * 0.25; // fica mais rápido a cada ciclo
    let vx = 0, vz = 0;
    const andar = (alvoX, alvoZ, velocidade) => {
      const ax = alvoX - p.x, az = alvoZ - p.z, d = Math.hypot(ax, az);
      if (d < 0.3) return;
      vx = ax / d * velocidade; vz = az / d * velocidade;
      this._virarPara(ax, az, dt, 6);
    };

    // Jogador saiu da arena no meio da luta: volta ao centro e espera
    const lutando = ['golpe', 'investida', 'bolas'].includes(this.estado);
    if (lutando && !naArena) this._mudar('esperando');

    switch (this.estado) {
      case 'dormindo':
        if (naArena && dist < 9) this._acordar();
        break;

      case 'esperando':
        andar(c.x, c.z, 2.5);
        if (naArena) this._proximoAtaque();
        break;

      case 'acordando': // levanta devagar e ruge
        this._virarPara(dx, dz, dt, 3);
        if (this.t > 2.2) this._proximoAtaque();
        break;

      case 'golpe':
        if (this.etapa === 0) { // anda até perto do jogador
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
        break;

      case 'investida':
        if (this.etapa === 0) { // mira e bate o pé (aviso)
          this._virarPara(dx, dz, dt, 10);
          if (Math.random() < dt * 12) this.particulas.explosao(p.clone().setY(p.y + 0.2), 0x9b6a3c, 2, 2);
          if (this.t > 1.1 / rapido) {
            this.etapa = 1; this.t = 0;
            this._direcao.set(Math.sin(this.angulo), 0, Math.cos(this.angulo));
            som.efeito('chefao_investida');
          }
        } else if (this.etapa === 1) { // corre em linha reta
          vx = this._direcao.x * 12 * rapido; vz = this._direcao.z * 12 * rapido;
          if (Math.random() < dt * 20) this.particulas.explosao(p.clone().setY(p.y + 0.2), 0x9b6a3c, 2, 3);
          const foraDaArena = Math.hypot(p.x - c.x, p.z - c.z) > RAIO_ARENA - 0.2;
          if (this.t > 1.4 || foraDaArena) {
            this.etapa = 2; this.t = 0;
            som.efeito('chefao_golpe');
            this.particulas.explosao(this.centro().clone(), 0x9b6a3c, 12, 5);
          }
        } else if (this.t > 0.9) { // tonto da batida
          this.investidas = (this.investidas || 0) + 1;
          if (this.cansacos >= 1 && this.investidas % 2 === 1) { this.etapa = 0; this.t = 0; } // 2 investidas depois do 1º cansaço
          else this._proximoAtaque();
        }
        break;

      case 'bolas':
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
        break;

      case 'vulneravel':
        if (this.t > TEMPO_VULNERAVEL) this._mudar('levantando');
        break;

      case 'levantando':
        if (this.t > 1) {
          this.cansacos++;
          this.indiceAtaque = 0;
          this.investidas = 0;
          som.efeito('chefao_rugido');
          if (naArena) this._proximoAtaque();
          else this._mudar('esperando');
        }
        break;

      case 'purificando': // treme soltando a gosma e as folhas voltam a ficar verdes
        if (Math.random() < dt * 12) this.particulas.explosao(this.centro().clone().setY(p.y + 2 + Math.random() * 2), 0xb04dff, 4, 5);
        this.m.matCopa.color.lerpColors(new THREE.Color(COR.copaInfectada), new THREE.Color(COR.copaSaudavel), Math.min(1, this.t / 2.5));
        if (this.t > 2.5) {
          this.m.matOlho.color.setHex(COR.olhoSaudavel);
          for (const s of this.m.manchas) s.visible = false;
          this.particulas.explosao(this.centro().clone().setY(p.y + 4), 0x7dff5a, 30, 7);
          this._mudar('purificado');
        }
        break;

      default: break; // 'purificado': fica parado, feliz
    }

    v.x = vx; v.z = vz;
    v.y = Math.max(v.y + GRAVIDADE * dt, -40);
    moverComColisao(this, caixas, dt);
    // Nunca sai da arena
    const rx = p.x - c.x, rz = p.z - c.z, r = Math.hypot(rx, rz);
    if (r > RAIO_ARENA) { p.x = c.x + rx / r * RAIO_ARENA; p.z = c.z + rz / r * RAIO_ARENA; }
    if (p.y < c.y - 5) { p.copy(c); v.set(0, 0, 0); }

    this._atualizarOndas(dt, jogador);
    this._atualizarVisual(dt);
  }

  _virarPara(dx, dz, dt, velocidade) {
    const alvo = Math.atan2(dx, dz);
    const diff = Math.atan2(Math.sin(alvo - this.angulo), Math.cos(alvo - this.angulo));
    this.angulo += diff * Math.min(1, velocidade * dt);
  }

  _atualizarOndas(dt, jogador) {
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
    if (this.barreira?.malha.visible) {
      const s = this.barreira.malha.scale;
      s.y = Math.min(1, s.y + dt * 2.5);
    }
  }
}
