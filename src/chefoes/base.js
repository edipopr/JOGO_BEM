// Base comum dos chefões. Cada chefão (guardiao.js, cristal.js) define o modelo, os ataques e o visual.
//
// Fluxo: dorme no meio da arena → acorda quando o herói chega perto (raízes/cristais fecham a entrada)
// → faz os ataques em sequência → fica CANSADO (vulnerável): só aí leva dano, no máximo
// "danoPorCansaco" golpes por vez → levanta mais rápido e repete → com vida 0 é purificado.
//
// Para o combate, o chefão se comporta como um inimigo do GerenciadorInimigos
// (ativo, posicao, raio, altura, centro(), receberDano(), bloquear(), tempoAtordoado, cfg, empurrao).
//
// A subclasse implementa:
//   _criarModelo()            → this.modelo (THREE.Group) e o que mais precisar
//   _ataque_<nome>(dt, c)     → um método por ataque da lista cfg.ataques (c = contexto do quadro)
//   _visualNormal() / _visualPurificado() / _purificando(dt) / _atualizarVisual(dt)
//   _limparAtaques() e _atualizarEfeitos(dt, jogador) (opcionais)
import * as THREE from 'three';
import { GRAVIDADE, moverComColisao } from '../fisica.js';
import { som } from '../audio.js';

export class ChefaoBase {
  /**
   * centro = ponto no chão, no meio da arena.
   * opcoes = { barreira: { malha, caixa } que fecha a arena durante a luta, caixas: sólidos da fase }
   * cfg = { nome, vida, danoPorCansaco, tempoVulneravel, raioArena, raio, altura, alturaCentro,
   *         pontos, cor, empurrao, ataques: [...], dicas: { ataque: texto }, textos: { acordou, vulneravel, derrotado } }
   */
  constructor(cena, centro, particulas, { barreira = null, caixas = [] } = {}, cfg) {
    this.cena = cena;
    this.barreira = barreira;
    this.caixas = caixas;
    this.centroArena = centro.clone();
    this.particulas = particulas;
    this.c = cfg;
    this.nome = cfg.nome;
    this.textos = cfg.textos;
    this.raio = cfg.raio;
    this.altura = cfg.altura;
    this.vidaMax = cfg.vida;
    this.cfg = { cor: cfg.cor, pontos: cfg.pontos };
    this.empurrao = cfg.empurrao ?? 5; // empurrão pequeno: não joga o herói para fora da arena
    this.posicao = new THREE.Vector3();
    this.velocidade = new THREE.Vector3();
    this._centro = new THREE.Vector3();
    this._direcao = new THREE.Vector3();
    this.tempo = 0;
    /** main.js troca por uma função que recebe os eventos: 'acordou', 'dica', 'vulneravel', 'derrotado'. */
    this.avisar = () => {};
    this._criarModelo();
    cena.add(this.modelo);
    this.renascer();
  }

  // ---------- Começo / reinício ----------
  /** Volta tudo ao começo (recomeçar a fase). */
  renascer() {
    this.derrotado = false;
    this.dicasVistas = new Set();
    this.reiniciarLuta();
  }

  /** Volta a dormir no centro com vida cheia (herói caiu/tentou de novo). Nada muda se já foi derrotado. */
  reiniciarLuta() {
    if (this.derrotado) return;
    this.ativo = true;
    this.vida = this.vidaMax;
    this.cansacos = 0;
    this.posicao.copy(this.centroArena);
    this.velocidade.set(0, 0, 0);
    this.angulo = 0;
    this._mudar('dormindo');
    this.indiceAtaque = 0;
    this.danoNoCansaco = 0;
    this.tempoImune = 0;
    this.tempoBrilho = 0;
    this._limparAtaques();
    this._visualNormal();
    this._fecharArena(false);
    this._posicionarModelo();
  }

  /** Já começa purificado (partida salva depois de derrotá-lo). */
  purificarDireto() {
    this.derrotado = true;
    this.ativo = false;
    this.vida = 0;
    this.posicao.copy(this.centroArena);
    this._mudar('purificado');
    this._limparAtaques();
    this._fecharArena(false);
    this._visualPurificado();
    this._posicionarModelo();
  }

  /** Coloca o modelo onde o chefão está (antes da luta ele ainda não foi atualizado). */
  _posicionarModelo() {
    this.modelo.position.copy(this.posicao);
    this.modelo.rotation.y = this.angulo;
  }

  /** Barreira sobe e fecha a entrada (true) ou some (false). */
  _fecharArena(fechar) {
    const b = this.barreira;
    if (!b) return;
    const i = this.caixas.indexOf(b.caixa);
    if (fechar && i < 0) this.caixas.push(b.caixa);
    if (!fechar && i >= 0) this.caixas.splice(i, 1);
    b.malha.visible = fechar;
    if (fechar) b.malha.scale.y = 0.01; // cresce em atualizar()
  }

  // ---------- Interface de combate ----------
  get acordado() { return this.ativo && this.estado !== 'dormindo'; }
  /** > 0 = encostar nele não machuca. */
  get tempoAtordoado() { return !this.ativo || this.estado === 'dormindo' || this.estado === 'vulneravel' ? 1 : 0; }

  centro() {
    return this._centro.set(this.posicao.x, this.posicao.y + this.c.alturaCentro, this.posicao.z);
  }

  /** Golpe do herói quando ele NÃO pode levar dano. Retorna true se bloqueou. */
  bloquear() {
    if (this.estado === 'vulneravel') return this.tempoImune > 0;
    if (this.estado === 'dormindo') this._acordar();
    som.efeito('bloqueio');
    this.particulas.explosao(this.centro().clone(), 0xbbbbbb, 5, 3);
    if (this.estado !== 'acordando') this._dica('bloqueio', 'Ele está protegido! Espere ele cansar para atacar.');
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
    if (this.danoNoCansaco >= this.c.danoPorCansaco) this._mudar('levantando');
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
    this.avisar('acordou', this.textos.acordou);
  }

  _dica(chave, texto) {
    if (this.dicasVistas.has(chave)) return;
    this.dicasVistas.add(chave);
    this.avisar('dica', texto);
  }

  _proximoAtaque() {
    const ataques = this.c.ataques;
    if (this.indiceAtaque >= ataques.length) {
      this.indiceAtaque = 0;
      this.danoNoCansaco = 0;
      this._mudar('vulneravel');
      som.efeito('chefao_cansado');
      this.avisar('vulneravel', this.textos.vulneravel);
      return;
    }
    const nome = ataques[this.indiceAtaque++];
    this._mudar(nome);
    this._comecarAtaque(nome);
    if (this.c.dicas[nome]) this._dica(nome, this.c.dicas[nome]);
  }

  _derrotar() {
    this.derrotado = true;
    this.ativo = false;
    this._fecharArena(false);
    this._mudar('purificando');
    this._limparAtaques();
    som.efeito('chefao_derrotado');
    this.avisar('derrotado', this.textos.derrotado);
  }

  _virarPara(dx, dz, dt, velocidade) {
    const alvo = Math.atan2(dx, dz);
    const diff = Math.atan2(Math.sin(alvo - this.angulo), Math.cos(alvo - this.angulo));
    this.angulo += diff * Math.min(1, velocidade * dt);
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
    const meia = this.c.meiaArena ?? 12.5;
    const naArena = jogador.vida > 0 && j.y > c.y - 1.5 && Math.abs(j.x - c.x) < meia && Math.abs(j.z - c.z) < meia;
    this.vx = 0; this.vz = 0;
    // contexto do quadro para os ataques
    const ctx = {
      jogador, projeteis, dx, dz, dist,
      rapido: 1 + Math.min(2, this.cansacos) * 0.25, // fica mais rápido a cada ciclo
      andar: (alvoX, alvoZ, velocidade) => {
        const ax = alvoX - p.x, az = alvoZ - p.z, d = Math.hypot(ax, az);
        if (d < 0.3) return;
        this.vx = ax / d * velocidade; this.vz = az / d * velocidade;
        this._virarPara(ax, az, dt, 6);
      },
    };

    // Herói saiu da arena no meio da luta: volta ao centro e espera
    if (this.c.ataques.includes(this.estado) && !naArena) this._mudar('esperando');

    switch (this.estado) {
      case 'dormindo':
        if (naArena && dist < 9) this._acordar();
        break;
      case 'esperando':
        ctx.andar(c.x, c.z, 2.5);
        if (naArena) this._proximoAtaque();
        break;
      case 'acordando':
        this._virarPara(dx, dz, dt, 3);
        if (this.t > 2.2) this._proximoAtaque();
        break;
      case 'vulneravel':
        if (this.t > this.c.tempoVulneravel) this._mudar('levantando');
        break;
      case 'levantando':
        if (this.t > 1) {
          this.cansacos++;
          this.indiceAtaque = 0;
          som.efeito('chefao_rugido');
          if (naArena) this._proximoAtaque();
          else this._mudar('esperando');
        }
        break;
      case 'purificando':
        this._purificando(dt);
        if (this.t > 2.5) {
          this._visualPurificado();
          this.particulas.explosao(this.centro().clone().setY(p.y + this.altura), 0x7dff5a, 30, 7);
          this._mudar('purificado');
        }
        break;
      case 'purificado':
        break;
      default:
        this[`_ataque_${this.estado}`]?.(dt, ctx);
    }

    v.x = this.vx; v.z = this.vz;
    v.y = Math.max(v.y + GRAVIDADE * dt, -40);
    moverComColisao(this, caixas, dt);
    // Nunca sai da arena
    const rx = p.x - c.x, rz = p.z - c.z, r = Math.hypot(rx, rz), max = this.c.raioArena;
    if (r > max) { p.x = c.x + rx / r * max; p.z = c.z + rz / r * max; }
    if (p.y < c.y - 5) { p.copy(c); v.set(0, 0, 0); }

    this._atualizarEfeitos(dt, jogador);
    this._atualizarVisual(dt);
    // a barreira cresce do chão
    if (this.barreira?.malha.visible) {
      const s = this.barreira.malha.scale;
      s.y = Math.min(1, s.y + dt * 2.5);
    }
  }

  // ---------- Ganchos (a subclasse pode trocar) ----------
  _comecarAtaque() {}
  _limparAtaques() {}
  _atualizarEfeitos() {}
  _purificando() {}
}
