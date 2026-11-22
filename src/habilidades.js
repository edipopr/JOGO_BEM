// Habilidades especiais (tecla K / botão "Poder"), uma por herói (GDD):
//  dash      = Guizinho: avança rápido, fica protegido e atropela inimigos no caminho
//  ondaCores = TV Rambon: onda colorida em volta — acerta, deixa tontos e apaga tiros inimigos
//  campo     = Experimento Caixa: escudo por 4 s — bloqueia dano e tiros, empurra quem encostar
//  canhao    = Mr. Fun BOT: bala de canhão grande, mira automática de longe, explosão enorme
//  giro      = Irmão do Guizinho: gira com os braços gigantes — protegido, acerta tudo em volta enquanto anda
import * as THREE from 'three';
import { som } from './audio.js';

export const HABILIDADES = {
  dash: { nome: 'Dash de energia', recarga: 2.5 },
  ondaCores: { nome: 'Onda de cores', recarga: 6 },
  campo: { nome: 'Campo tecnológico', recarga: 9, duracao: 4 },
  canhao: { nome: 'Tiro de canhão', recarga: 4 },
  giro: { nome: 'Giro gigante', recarga: 6, duracao: 1.6 },
};

const DURACAO_DASH = 0.24;
const VELOCIDADE_DASH = 26;
const RAIO_ONDA = 6.5;
const RAIO_GIRO = 2.7;

export class Habilidades {
  constructor(cena) {
    this.grupo = new THREE.Group();
    cena.add(this.grupo);
    // Onda de cores (anel no chão)
    this.onda = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1, 48),
      new THREE.MeshBasicMaterial({ color: 0xff6bff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
    );
    this.onda.rotation.x = -Math.PI / 2;
    // Escudo do campo tecnológico (bolha)
    this.escudo = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.25, 1),
      new THREE.MeshBasicMaterial({ color: 0x5af0ff, transparent: true, opacity: 0.28, wireframe: false }),
    );
    this.escudoGrade = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.28, 1),
      new THREE.MeshBasicMaterial({ color: 0xaffaff, wireframe: true, transparent: true, opacity: 0.6 }),
    );
    this.grupo.add(this.onda, this.escudo, this.escudoGrade);
    this.reiniciar();
  }

  reiniciar() {
    this.tempoRecarga = 0;
    this.raioOnda = -1;
    this.atingidos = new Set();
    this.tempoToque = 0;
    this.onda.visible = this.escudo.visible = this.escudoGrade.visible = false;
  }

  /** 0 = acabou de usar … 1 = pronta. */
  carga(jogador) {
    const h = HABILIDADES[jogador.personagem.habilidade];
    return h ? 1 - Math.min(1, this.tempoRecarga / h.recarga) : 0;
  }

  atualizar(dt, { jogador, entrada, eixos, inimigos, projeteis, particulas }) {
    const tipo = jogador.personagem.habilidade;
    const h = HABILIDADES[tipo];
    this.tempoRecarga = Math.max(0, this.tempoRecarga - dt);
    const pediu = entrada.consumirHabilidade();
    if (pediu && h && this.tempoRecarga <= 0 && jogador.vida > 0) {
      this.tempoRecarga = h.recarga;
      this.atingidos.clear();
      this[`_usar_${tipo}`](jogador, entrada, eixos, inimigos, projeteis, particulas);
    }
    this._continuar(dt, jogador, inimigos, projeteis, particulas);
  }

  // ---------- Começo de cada habilidade ----------
  _usar_dash(jogador, entrada, eixos) {
    const d = entrada.direcao();
    let x = eixos.frente.x * d.y + eixos.direita.x * d.x;
    let z = eixos.frente.z * d.y + eixos.direita.z * d.x;
    if (Math.hypot(x, z) < 0.2) { x = Math.sin(jogador.angulo); z = Math.cos(jogador.angulo); }
    const n = Math.hypot(x, z);
    jogador.iniciarDash(x / n, z / n, VELOCIDADE_DASH, DURACAO_DASH);
    som.efeito('hab_dash');
  }

  _usar_ondaCores(jogador, _e, _x, _i, projeteis, particulas) {
    this.raioOnda = 0.5;
    this.centroOnda = jogador.posicao.clone();
    this.onda.visible = true;
    projeteis.destruirInimigos(jogador.posicao, RAIO_ONDA, particulas);
    const centro = jogador.posicao.clone().setY(jogador.posicao.y + 1);
    for (const cor of [0xff4d4d, 0xffd84a, 0x4cd137, 0x5ad1ff, 0xb07dff]) particulas.explosao(centro, cor, 8, 9);
    som.efeito('hab_onda');
  }

  _usar_campo(jogador) {
    jogador.tempoEscudo = HABILIDADES.campo.duracao;
    som.efeito('hab_campo');
  }

  _usar_canhao(jogador, _e, _x, _i, projeteis) {
    const alvo = jogador.mirarAlvo(18);
    if (alvo) {
      const c = alvo.centro();
      jogador.angulo = Math.atan2(c.x - jogador.posicao.x, c.z - jogador.posicao.z);
    }
    const origem = jogador.pontoNoMundo(jogador.pontoMao);
    const direcao = alvo ? alvo.centro().clone().sub(origem) : new THREE.Vector3(Math.sin(jogador.angulo), 0, Math.cos(jogador.angulo));
    projeteis.disparar({
      origem, direcao, velocidade: 15, dono: 'jogador', cor: 0xff5a1f, raio: 0.5, dano: 3, duracao: 1.6, raioExplosao: 3.6,
    });
    jogador.velocidade.x -= Math.sin(jogador.angulo) * 5; // coice
    jogador.velocidade.z -= Math.cos(jogador.angulo) * 5;
    som.efeito('hab_canhao');
  }

  _usar_giro(jogador) {
    jogador.tempoGiro = HABILIDADES.giro.duracao;
    this.tempoGolpeGiro = 0;
    som.efeito('hab_giro');
  }

  // ---------- Efeitos que duram alguns quadros ----------
  _continuar(dt, jogador, inimigos, projeteis, particulas) {
    const p = jogador.posicao;

    // Dash: atropela quem estiver no caminho
    if (jogador.tempoDash > 0) {
      if (Math.random() < dt * 40) particulas.explosao(p.clone().setY(p.y + 0.8), 0xffe14a, 2, 2);
      for (const ini of inimigos.lista) {
        if (!ini.ativo || this.atingidos.has(ini)) continue;
        if (ini.centro().distanceTo(p.clone().setY(p.y + 0.8)) < ini.raio + 1.1) {
          this.atingidos.add(ini);
          inimigos.acertar(ini, 2, p.x, p.z, particulas);
        }
      }
    }

    // Giro gigante: acerta todos em volta a cada 0,35 s e rebate tiros
    if (jogador.tempoGiro > 0) {
      jogador.tempoGiro -= dt;
      const centro = p.clone().setY(p.y + 0.9);
      projeteis.destruirInimigos(centro, RAIO_GIRO, particulas);
      if (Math.random() < dt * 25) particulas.explosao(centro, 0xd9b3ff, 2, 4);
      this.tempoGolpeGiro -= dt;
      if (this.tempoGolpeGiro <= 0) {
        this.tempoGolpeGiro = 0.35;
        for (const ini of inimigos.lista) {
          if (ini.ativo && ini.centro().distanceTo(centro) < ini.raio + RAIO_GIRO) inimigos.acertar(ini, 1, p.x, p.z, particulas);
        }
      }
    }

    // Onda de cores: anel que cresce; acerta quem ele alcança e deixa tonto
    if (this.raioOnda >= 0) {
      this.raioOnda += dt * 16;
      const c = this.centroOnda;
      this.onda.position.set(c.x, c.y + 0.15, c.z);
      this.onda.scale.set(this.raioOnda, this.raioOnda, 1); // anel deitado no chão
      this.onda.material.color.setHSL((this.raioOnda / RAIO_ONDA) % 1, 1, 0.6);
      this.onda.material.opacity = 0.95 * (1 - (this.raioOnda / RAIO_ONDA) ** 3);
      for (const ini of inimigos.lista) {
        if (!ini.ativo || this.atingidos.has(ini)) continue;
        const d = Math.hypot(ini.posicao.x - c.x, ini.posicao.z - c.z) - ini.raio;
        if (d < this.raioOnda && Math.abs(ini.posicao.y - c.y) < 3) {
          this.atingidos.add(ini);
          inimigos.acertar(ini, 1, c.x, c.z, particulas);
          if (ini.ativo && !ini.bloquear) ini.tempoAtordoado = 2; // chefões não ficam tontos
        }
      }
      if (this.raioOnda > RAIO_ONDA) { this.raioOnda = -1; this.onda.visible = false; }
    }

    // Campo tecnológico: bolha em volta do herói
    const comEscudo = jogador.tempoEscudo > 0;
    this.escudo.visible = this.escudoGrade.visible = comEscudo;
    if (comEscudo) {
      jogador.tempoEscudo -= dt;
      const centro = p.clone().setY(p.y + jogador.altura / 2);
      this.escudo.position.copy(centro);
      this.escudoGrade.position.copy(centro);
      this.escudoGrade.rotation.y += dt * 1.5;
      const piscar = jogador.tempoEscudo < 1 && Math.floor(jogador.tempoEscudo * 10) % 2 === 0;
      this.escudo.material.opacity = piscar ? 0.08 : 0.28;
      const escala = Math.max(1, jogador.altura / 1.8);
      this.escudo.scale.setScalar(escala);
      this.escudoGrade.scale.setScalar(escala);
      projeteis.destruirInimigos(centro, 1.5 * escala, particulas);
      this.tempoToque -= dt;
      if (this.tempoToque <= 0) {
        for (const ini of inimigos.lista) {
          if (ini.ativo && ini.centro().distanceTo(centro) < ini.raio + 1.3 * escala) {
            inimigos.acertar(ini, 1, p.x, p.z, particulas);
            this.tempoToque = 0.6;
          }
        }
      }
    }
  }
}
