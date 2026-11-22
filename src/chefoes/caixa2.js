// Chefão do Laboratório Perdido: Experimento Caixa 2 (caixa gigante com uma bocarra na barriga).
// Ataques: mordida (botes) → raios (feixe que gira — pule ou corra) → invocação (caixinhas) → caixas caindo + pancada.
// 15 de vida, 5 golpes por cansaço = 3 ciclos.
import * as THREE from 'three';
import { som } from '../audio.js';
import { ChefaoBase } from './base.js';
import { Inimigo } from '../inimigo.js';
import { Ondas, Quedas, Feixe, criarTontura } from './efeitos.js';

const COR = {
  papelao: 0xa07860, papelaoLimpo: 0xc89b5a,
  gosma: 0x7a3cff, gosmaLimpa: 0xe0b878,
  olho: 0xc6ff3d, olhoBravo: 0xff2a2a, olhoLimpo: 0xffffff,
  nucleo: 0xff3bd0, nucleoVulneravel: 0xffe14a, nucleoLimpo: 0x7dfff0,
};

function criarModelo() {
  const grupo = new THREE.Group();
  const corpo = new THREE.Group();
  grupo.add(corpo);
  const lambert = (cor) => new THREE.MeshLambertMaterial({ color: cor, flatShading: true });
  const matCaixa = lambert(COR.papelao), matGosma = lambert(COR.gosma), matEscuro = lambert(0x24121f), matDente = lambert(0xfff6e0);
  const matOlho = new THREE.MeshBasicMaterial({ color: COR.olho });
  const matX = new THREE.MeshBasicMaterial({ color: 0xff2a2a });
  const matNucleo = new THREE.MeshBasicMaterial({ color: COR.nucleo });
  const parte = (geo, mat, x, y, z, pai = corpo) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    m.castShadow = true;
    pai.add(m);
    return m;
  };
  const pernas = [-0.8, 0.8].map((x) => {
    const g = new THREE.Group();
    g.position.set(x, 1.1, 0);
    parte(new THREE.CylinderGeometry(0.32, 0.42, 1, 7), matEscuro, 0, -0.5, 0, g);
    parte(new THREE.BoxGeometry(0.9, 0.3, 1.2), matCaixa, 0, -0.95, 0.2, g);
    grupo.add(g);
    return g;
  });
  // Corpo: caixa de baixo (mandíbula) e caixa de cima, com a bocarra no meio
  parte(new THREE.BoxGeometry(3, 1.1, 2.3), matCaixa, 0, 1.5, 0);
  parte(new THREE.BoxGeometry(2.7, 0.9, 1.9), matEscuro, 0, 2.2, -0.1);           // fundo da boca
  const cima = new THREE.Group();
  cima.position.set(0, 2.05, -1.1);
  corpo.add(cima);
  parte(new THREE.BoxGeometry(3, 2.1, 2.3), matCaixa, 0, 1.25, 1.1, cima);
  const nucleo = parte(new THREE.IcosahedronGeometry(0.42, 0), matNucleo, 0, 2.2, 0.55);  // coração dentro da boca
  for (let i = 0; i < 7; i++) {
    parte(new THREE.ConeGeometry(0.2, 0.55, 4), matDente, -1.25 + i * 0.42, 2.2, 1.05);
    parte(new THREE.ConeGeometry(0.2, 0.55, 4), matDente, -1.05 + i * 0.36, 0.05, 2.18, cima).rotation.x = Math.PI;
  }
  const lingua = parte(new THREE.BoxGeometry(0.9, 0.12, 1.4), lambert(0xff5a8a), 0, 2.1, 0.9);
  // Rosto: X vermelho e olho grande
  for (const r of [Math.PI / 4, -Math.PI / 4]) parte(new THREE.BoxGeometry(0.85, 0.2, 0.08), matX, -0.75, 1.55, 2.28, cima).rotation.z = r;
  const olho = parte(new THREE.SphereGeometry(0.52, 12, 9), matOlho, 0.7, 1.55, 2.1, cima);
  parte(new THREE.SphereGeometry(0.24, 8, 6), matEscuro, 0, 0, 0.38, olho);
  // Abas abertas e gosma escorrendo
  for (const s of [-1, 1]) {
    const aba = parte(new THREE.BoxGeometry(1.3, 0.1, 2.2), matCaixa, s * 1.95, 2.6, 1.1, cima);
    aba.rotation.z = s * 0.7;
  }
  const gosmas = [];
  for (const [x, y, z, alt] of [[-1.2, 2.2, 2.25, 0.8], [0.1, 2.2, 2.27, 0.6], [1.35, 2.1, 2.22, 1.1], [1.52, 2, 0.8, 1], [-1.52, 2.05, 1.5, 0.9]]) {
    const g = parte(new THREE.CylinderGeometry(0.2, 0.28, alt, 6), matGosma, x, y - alt / 2 + 0.15, z, cima);
    parte(new THREE.SphereGeometry(0.28, 7, 5), matGosma, 0, -alt / 2, 0, g);
    gosmas.push(g);
  }
  parte(new THREE.BoxGeometry(2.4, 0.2, 1.7), matGosma, 0, 2.32, 1.1, cima);
  const braco = (lado) => {
    const g = new THREE.Group();
    g.position.set(lado * 1.65, 2.6, 0);
    parte(new THREE.CylinderGeometry(0.2, 0.24, 1.5, 7), matEscuro, 0, -0.75, 0, g);
    const mao = parte(new THREE.BoxGeometry(0.75, 0.6, 0.75), matCaixa, 0, -1.65, 0, g);
    for (const dx of [-0.25, 0, 0.25]) parte(new THREE.ConeGeometry(0.12, 0.45, 4), matDente, dx, -0.4, 0.2, mao).rotation.x = Math.PI;
    corpo.add(g);
    return g;
  };
  const bracos = [braco(-1), braco(1)];
  const tontura = criarTontura(corpo, 5.4, 1.4);
  return { grupo, corpo, cima, lingua, pernas, bracos, nucleo, gosmas, tontura, matCaixa, matGosma, matOlho, matNucleo };
}

export class ExperimentoCaixa2 extends ChefaoBase {
  constructor(cena, centro, particulas, opcoes) {
    super(cena, centro, particulas, opcoes, {
      nome: 'Experimento Caixa 2',
      vida: 15, danoPorCansaco: 5, tempoVulneravel: 6,
      raioArena: 9, raio: 1.7, altura: 4.8, alturaCentro: 2.1,
      pontos: 1200, cor: 0x7a3cff,
      ataques: ['mordida', 'raios', 'invocar', 'caixas'],
      dicas: {
        mordida: 'Mordida! Corra para o lado quando ele abrir a boca!',
        raios: 'Raio giratório! PULE por cima ou corra em volta!',
        invocar: 'Ele chamou caixinhas mordedoras! Acabe com elas!',
        caixas: 'Chuva de caixas! Saia dos círculos e pule a onda!',
      },
      textos: {
        acordou: 'O Experimento Caixa 2 está com fome!',
        vulneravel: 'A boca travou aberta! Ataque agora!',
        derrotado: 'O Experimento Caixa 2 voltou ao normal! O portal se abriu!',
      },
    });
  }

  _criarModelo() {
    this.m = criarModelo();
    this.modelo = this.m.grupo;
    this.ondas = new Ondas(this.cena, { cor: 0xd08bff });
    this.quedas = new Quedas(this.cena, this.particulas, {
      geometria: new THREE.BoxGeometry(1.3, 1.3, 1.3), material: new THREE.MeshLambertMaterial({ color: 0xb98a4a, flatShading: true }),
      raio: 1.5, tempo: 1.15, corExplosao: 0xc89b5a, quantidade: 20, sonora: true,
    });
    this.feixes = [0, 1, 2].map(() => new Feixe(this.cena, { cor: 0xff2a4a, comprimento: 13, largura: 0.55 }));
    /** Caixinhas que ele invoca (o main coloca no GerenciadorInimigos). */
    this.reserva = Array.from({ length: 4 }, () => new Inimigo(this.cena, 'caixinha', this.centroArena, { invocado: true }));
  }

  _pintar(limpo) {
    this.m.matCaixa.color.setHex(limpo ? COR.papelaoLimpo : COR.papelao);
    this.m.matGosma.color.setHex(limpo ? COR.gosmaLimpa : COR.gosma);
    this.m.matOlho.color.setHex(limpo ? COR.olhoLimpo : COR.olho);
    for (const g of this.m.gosmas) g.visible = !limpo;
  }
  _visualNormal() { this._pintar(false); }
  _visualPurificado() { this._pintar(true); }

  _purificando(dt) {
    if (Math.random() < dt * 14) this.particulas.explosao(this.centro().clone().setY(this.posicao.y + 1 + Math.random() * 3), 0xb04dff, 4, 5);
    this.m.matCaixa.color.lerpColors(new THREE.Color(COR.papelao), new THREE.Color(COR.papelaoLimpo), Math.min(1, this.t / 2.5));
  }

  _limparAtaques() {
    this.ondas.limpar();
    this.quedas.limpar();
    for (const f of this.feixes) f.limpar();
    for (const c of this.reserva) c.dispensar();
  }

  _comecarAtaque() {
    this.botes = 2 + Math.min(1, this.cansacos);
    this.ondasCaixas = 2;
    for (const f of this.feixes) f.limpar();
  }

  // ---------- Ataques ----------
  _ataque_mordida(dt, { dx, dz, dist, rapido }) {
    const p = this.posicao, c = this.centroArena;
    if (this.etapa === 0) { // abre a bocarra e mira
      this._virarPara(dx, dz, dt, 9);
      if (this.t > 0.95 / rapido) {
        this.etapa = 1; this.t = 0;
        this._direcao.set(Math.sin(this.angulo), 0, Math.cos(this.angulo));
        this.distBote = Math.min(12, dist + 1.5);
        som.efeito('chefao_investida');
      }
    } else if (this.etapa === 1) { // bote
      const v = 13 * rapido;
      this.vx = this._direcao.x * v; this.vz = this._direcao.z * v;
      if (Math.random() < dt * 20) this.particulas.explosao(p.clone().setY(p.y + 0.2), 0xc89b5a, 2, 3);
      if (this.t * v > this.distBote || Math.hypot(p.x - c.x, p.z - c.z) > this.c.raioArena - 0.2) {
        this.etapa = 2; this.t = 0;
        som.efeito('chefao_golpe');
      }
    } else if (this.t > 0.7) {
      this.botes--;
      if (this.botes > 0) { this.etapa = 0; this.t = 0.2; }
      else this._proximoAtaque();
    }
  }

  _ataque_raios(dt, { dx, dz, rapido, andar }) {
    const p = this.posicao, c = this.centroArena;
    const n = 1 + Math.min(2, this.cansacos); // 1, 2, 3 raios
    if (this.etapa === 0) { // volta ao meio
      andar(c.x, c.z, 5 * rapido);
      if (Math.hypot(p.x - c.x, p.z - c.z) < 1 || this.t > 2) { this.etapa = 1; this.t = 0; som.efeito('choque'); }
    } else if (this.etapa === 1) { // mira (linha fina de aviso)
      this._virarPara(dx, dz, dt, 5);
      for (let i = 0; i < n; i++) this.feixes[i].avisar();
      if (this.t > 1.1) {
        this.etapa = 2; this.t = 0;
        this.sentido = Math.random() < 0.5 ? 1 : -1;
        for (let i = 0; i < n; i++) this.feixes[i].ligar();
      }
    } else { // gira com os raios ligados
      this.angulo += this.sentido * dt * (n > 1 ? 0.75 : 1.1) * rapido;
      if (Math.floor(this.t * 5) !== Math.floor((this.t - dt) * 5)) som.efeito('choque');
      if (this.t > 4.2) {
        for (const f of this.feixes) f.limpar();
        this._proximoAtaque();
        return;
      }
    }
    for (let i = 0; i < n; i++) this.feixes[i].posicionar(p.x, p.y + 0.6, p.z, this.angulo + (i / n) * Math.PI * 2);
  }

  _ataque_invocar(dt, { dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 4);
    if (this.etapa === 0 && this.t > 1 / rapido) {
      this.etapa = 1; this.t = 0;
      som.efeito('chefao_rugido');
      const n = 2 + Math.min(2, this.cansacos);
      const c = this.centroArena;
      for (let i = 0; i < n; i++) {
        const a = this.angulo + (i - (n - 1) / 2) * 0.9;
        const x = c.x + Math.sin(a) * 7, z = c.z + Math.cos(a) * 7;
        if (this.reserva[i].invocar(x, c.y + 0.1, z)) this.particulas.explosao(new THREE.Vector3(x, c.y + 0.6, z), 0xb04dff, 14, 5);
      }
    } else if (this.etapa === 1 && this.t > 2.6) {
      this._proximoAtaque();
    }
  }

  _ataque_caixas(dt, { jogador, dx, dz, rapido }) {
    this._virarPara(dx, dz, dt, 4);
    const c = this.centroArena;
    if (this.etapa === 0 && this.t > 0.9 / rapido) { // pula e cai: onda + caixas
      this.etapa = 1; this.t = 0;
      this.velocidade.y = 11;
    } else if (this.etapa === 1 && this.t > 0.2 && this.posicao.y <= c.y + 0.05) {
      this.etapa = 2; this.t = 0;
      som.efeito('chefao_golpe');
      this.ondas.soltar(this.posicao.x, c.y, this.posicao.z);
      this.particulas.explosao(this.posicao.clone().setY(c.y + 0.3), 0xc89b5a, 18, 7);
      const j = jogador.posicao;
      this.quedas.lancar(j.x, c.y, j.z);
      const n = 5 + Math.min(2, this.cansacos) * 2;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, r = 2.5 + Math.random() * 7;
        this.quedas.lancar(c.x + Math.cos(a) * r, c.y, c.z + Math.sin(a) * r);
      }
    } else if (this.etapa === 2 && this.t > 1.7) {
      this.ondasCaixas--;
      if (this.ondasCaixas > 0) { this.etapa = 0; this.t = 0.3; }
      else this._proximoAtaque();
    }
  }

  // ---------- Visual ----------
  _atualizarEfeitos(dt, jogador) {
    this.ondas.atualizar(dt, jogador, this.tempo);
    this.quedas.atualizar(dt, jogador, this.tempo);
    if (this.estado !== 'raios') for (const f of this.feixes) f.limpar();
    for (const f of this.feixes) f.atualizar(dt, jogador, this.tempo);
  }

  _atualizarVisual(dt) {
    const m = this.m, t = this.tempo;
    const k = Math.min(1, 10 * dt);
    const v = Math.hypot(this.velocidade.x, this.velocidade.z);
    let boca = 0.08 + Math.sin(t * 2) * 0.04, bracoX = Math.sin(t * 2) * 0.15, bracoZ = 0.25, inclina = 0, baixar = 0;
    let olho = this.derrotado ? COR.olhoLimpo : COR.olho;
    switch (this.estado) {
      case 'dormindo': boca = 0; baixar = 0.9; break;
      case 'acordando': boca = this.t > 0.8 ? 0.6 + Math.sin(t * 20) * 0.15 : 0; baixar = Math.max(0, 0.9 - this.t * 1.2); bracoX = -1.5; bracoZ = 0.9; break;
      case 'mordida':
        boca = this.etapa === 2 ? 0 : 0.75; olho = COR.olhoBravo;
        inclina = this.etapa === 0 ? -0.2 : this.etapa === 1 ? 0.35 : 0.15; bracoX = this.etapa === 1 ? 0.9 : -0.6; bracoZ = 0.8;
        break;
      case 'raios': olho = COR.olhoBravo; boca = this.etapa === 2 ? 0.5 : 0.15; bracoZ = 1.2; break;
      case 'invocar': boca = this.etapa === 0 ? 0.2 : 0.7; bracoX = -2.6; bracoZ = 0.5; break;
      case 'caixas': bracoX = this.etapa === 0 ? -2.8 : 0.2; olho = COR.olhoBravo; baixar = this.etapa === 0 ? 0.5 : 0; break;
      case 'vulneravel': boca = 0.85; baixar = 0.9; inclina = 0.12; bracoZ = 0.9; bracoX = 0; break;
      case 'levantando': baixar = 0.9 * (1 - this.t); boca = 0.85 * (1 - this.t); break;
      case 'purificando': inclina = Math.sin(t * 25) * 0.05; break;
      case 'purificado': boca = 0.2 + Math.sin(t * 5) * 0.08; bracoX = -2.2 + Math.sin(t * 6) * 0.3; break;
      default: break;
    }
    const ir = (o, eixo, valor) => { o.rotation[eixo] += (valor - o.rotation[eixo]) * k; };
    ir(m.cima, 'x', -boca);
    m.bracos.forEach((b, i) => { ir(b, 'x', bracoX); ir(b, 'z', (i ? 1 : -1) * bracoZ); });
    ir(m.corpo, 'x', inclina);
    m.corpo.position.y += (-baixar - m.corpo.position.y) * k;
    const passo = v > 0.5 ? Math.sin(t * 12) * 0.6 : 0;
    ir(m.pernas[0], 'x', passo);
    ir(m.pernas[1], 'x', -passo);
    m.lingua.rotation.x = 0.15 + Math.sin(t * 6) * 0.1;
    if (!this.derrotado) m.matOlho.color.setHex(olho);

    const vulneravel = this.estado === 'vulneravel';
    m.matNucleo.color.setHex(this.derrotado ? COR.nucleoLimpo : vulneravel ? COR.nucleoVulneravel : COR.nucleo);
    m.nucleo.scale.setScalar(vulneravel ? 1.4 + Math.sin(t * 10) * 0.3 : 1);
    m.nucleo.rotation.y += dt * 2;
    m.tontura.visible = vulneravel;
    m.tontura.rotation.y += dt * 4;
    m.matCaixa.emissive.setHex(this.tempoBrilho > 0 ? 0xffffff : 0x000000);
    this.modelo.position.copy(this.posicao);
    this.modelo.rotation.y = this.angulo;
  }
}
