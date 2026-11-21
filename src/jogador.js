// Jogador: usa o personagem escolhido (personagens.js) para movimento, pulo, ataque e vida.
import * as THREE from 'three';
import { GRAVIDADE, moverComColisao } from './fisica.js';
import { PERSONAGENS } from './personagens.js';
import { som } from './audio.js';

const TEMPO_COYOTE = 0.1;  // ainda pode pular logo após sair da borda
const BUFFER_PULO = 0.12;  // pulo apertado um pouco antes de tocar o chão
const ACELERACAO = 40;
const VIDA_MAX = 5;
const TEMPO_INVENCIVEL = 1.5;
const FORCA_TRAMPOLIM = 21;

// Tempos (s) e alcance de cada tipo de ataque. Golpe ativo entre "inicio" e "fim".
// mira = distância da mira automática (vira para o inimigo mais próximo ao atacar; 0 = sem mira).
const ATAQUES = {
  soco: { duracao: 0.3, recarga: 0.35, inicio: 0.04, fim: 0.24, alcance: 1.1, raio: 1.4, passo: 3, mira: 4 },
  onda: { duracao: 0.45, recarga: 0.7, inicio: 0.08, fim: 0.32, alcance: 0, raio: 3.3, passo: 0, mira: 0 },
  raio: { duracao: 0.3, recarga: 0.4, inicio: 0.04, fim: 0.24, alcance: 2.4, raio: 1.6, passo: 1, mira: 6 },
  projetil: { duracao: 0.25, recarga: 0.45, disparo: 0.06, passo: -1.5, mira: 15 },
};

function criarEfeitos() {
  const grupo = new THREE.Group();
  const esfera = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.3, 1),
    new THREE.MeshBasicMaterial({ color: 0xffe14a, transparent: true, opacity: 0.85 }),
  );
  const anel = new THREE.Mesh(
    new THREE.TorusGeometry(1, 0.1, 6, 24),
    new THREE.MeshBasicMaterial({ color: 0xff6bff, transparent: true, opacity: 0.8 }),
  );
  anel.rotation.x = Math.PI / 2;
  const feixe = new THREE.Mesh(
    new THREE.BoxGeometry(0.14, 0.14, 3.6),
    new THREE.MeshBasicMaterial({ color: 0x7df9ff, transparent: true, opacity: 0.9 }),
  );
  const clarao = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.22, 0),
    new THREE.MeshBasicMaterial({ color: 0xffb02e }),
  );
  for (const m of [esfera, anel, feixe, clarao]) { m.visible = false; grupo.add(m); }
  return { grupo, esfera, anel, feixe, clarao };
}

export class Jogador {
  constructor(cena, pontoInicial, idPersonagem = 'guizinho') {
    this.cena = cena;
    this.efeitos = criarEfeitos();
    cena.add(this.efeitos.grupo);

    this.raio = 0.45;
    this.vidaMax = VIDA_MAX;
    this.posicao = new THREE.Vector3();
    this.velocidade = new THREE.Vector3();
    this.apoio = null;          // caixa em que está pisando (plataformas móveis/trampolim)
    this.atingidos = new Set(); // inimigos já acertados no golpe atual
    this._area = { x: 0, y: 0, z: 0, raio: 0, dano: 1 };
    this.tempoVisual = 0;
    this.pontoInicial = pontoInicial.clone();
    this.pontoRenascer = pontoInicial.clone(); // muda ao tocar num checkpoint
    this.definirPersonagem(idPersonagem);
    this.reiniciar(true);
  }

  definirPersonagem(id) {
    if (this.modelo) this.cena.remove(this.modelo);
    this.id = PERSONAGENS[id] ? id : 'guizinho';
    const p = PERSONAGENS[this.id];
    this.personagem = p;
    const m = p.criarModelo();
    this.modelo = m.grupo;
    this.bracos = [m.bracoE, m.bracoD];
    this.bracoFixo = !!m.bracoFixo;
    this.animarModelo = m.animar || null;
    this.posBracoD = m.bracoD.position.clone();
    this.rotZBracos = [m.bracoE.rotation.z, m.bracoD.rotation.z];
    this.cena.add(this.modelo);

    // Atributos 1–5 viram números do jogo
    this.altura = p.altura;
    this.vMax = 3 + p.velocidade * 0.75;          // 4 → 6
    this.forcaPulo = 9 + p.pulo * 0.75;           // 4 → 12
    this.dano = p.forca >= 4 ? 2 : 1;
    this.ataque = ATAQUES[p.ataque];
    this.tipoAtaque = p.ataque;
    this.pontoMao = new THREE.Vector3(...p.pontoMao);
    if (this.posicao) this.modelo.position.copy(this.posicao);
  }

  /** Vida cheia; volta ao último checkpoint, ou ao início da fase se voltarAoInicio. */
  reiniciar(voltarAoInicio = false) {
    if (voltarAoInicio) this.pontoRenascer.copy(this.pontoInicial);
    this.vida = VIDA_MAX;
    this.renascer();
    this.modelo.visible = true;
  }

  curar() {
    this.vida = Math.min(VIDA_MAX, this.vida + 1);
  }

  /** Volta ao ponto de renascimento (mantém a vida). */
  renascer() {
    this.posicao.copy(this.pontoRenascer);
    this.velocidade.set(0, 0, 0);
    this.noChao = false;
    this.apoio = null;
    this.tempoForaDoChao = 0;
    this.tempoPulo = 99;
    this.tempoAtaque = 99;
    this.disparou = true;
    this.angulo = Math.PI; // de costas para a câmera, olhando para o caminho (-Z)
    this.tempoAnimacao = 0;
    this.tempoInvencivel = 1;
  }

  /** Área do golpe corpo a corpo ativo, ou null. */
  areaGolpe() {
    const a = this.ataque;
    if (this.tipoAtaque === 'projetil' || this.tempoAtaque < a.inicio || this.tempoAtaque > a.fim) return null;
    const r = this._area;
    r.x = this.posicao.x + Math.sin(this.angulo) * a.alcance;
    r.y = this.posicao.y + 0.8;
    r.z = this.posicao.z + Math.cos(this.angulo) * a.alcance;
    r.raio = a.raio;
    r.dano = this.dano;
    return r;
  }

  /**
   * Mira automática: o inimigo ativo mais próximo à frente (até ~75° para cada lado)
   * dentro do alcance do ataque. this.alvos() é definido pelo main (inimigos + chefão).
   */
  _mirar() {
    const alcance = this.ataque.mira;
    if (!alcance || !this.alvos) return null;
    const fx = Math.sin(this.angulo), fz = Math.cos(this.angulo);
    let melhor = null, melhorNota = Infinity;
    for (const alvo of this.alvos()) {
      if (!alvo.ativo) continue;
      const c = alvo.centro();
      const dx = c.x - this.posicao.x, dz = c.z - this.posicao.z;
      const dist = Math.hypot(dx, dz) - (alvo.raio || 0);
      if (dist > alcance || Math.abs(c.y - (this.posicao.y + 0.8)) > 3.5) continue;
      const cosAng = dist > 0.5 ? (dx * fx + dz * fz) / Math.hypot(dx, dz) : 1;
      if (cosAng < 0.25) continue;
      const nota = dist * (2 - cosAng); // prefere perto e bem à frente
      if (nota < melhorNota) { melhorNota = nota; melhor = alvo; }
    }
    return melhor;
  }

  /** Converte um ponto local do personagem (x, y, z) para o mundo. */
  pontoNoMundo(local, destino = new THREE.Vector3()) {
    const s = Math.sin(this.angulo), c = Math.cos(this.angulo);
    return destino.set(
      this.posicao.x + local.x * c + local.z * s,
      this.posicao.y + local.y,
      this.posicao.z - local.x * s + local.z * c,
    );
  }

  /** Leva dano vindo da posição (x, z), com um empurrão. Retorna true se o dano foi aplicado. */
  levarDano(origemX, origemZ, empurrao = 8) {
    if (this.tempoInvencivel > 0 || this.vida <= 0) return false;
    this.vida--;
    this.tempoInvencivel = TEMPO_INVENCIVEL;
    som.efeito('dano');
    const dx = this.posicao.x - origemX, dz = this.posicao.z - origemZ;
    const d = Math.hypot(dx, dz) || 1;
    this.velocidade.set(dx / d * empurrao, 4 + empurrao * 0.4, dz / d * empurrao);
    this.noChao = false;
    return true;
  }

  atualizar(dt, entrada, eixos, fase, projeteis) {
    this.tempoInvencivel = Math.max(0, this.tempoInvencivel - dt);
    const empurrado = this.tempoInvencivel > TEMPO_INVENCIVEL - 0.3; // sem controle logo após levar dano
    this.quicou = false;

    // ----- Direção relativa à câmera -----
    const dir = entrada.direcao();
    const mx = eixos.frente.x * dir.y + eixos.direita.x * dir.x;
    const mz = eixos.frente.z * dir.y + eixos.direita.z * dir.x;
    const vMax = entrada.correndo() ? this.vMax * 1.65 : this.vMax;
    if (!empurrado) {
      const passo = ACELERACAO * dt * (this.noChao ? 1 : 0.6);
      this.velocidade.x += THREE.MathUtils.clamp(mx * vMax - this.velocidade.x, -passo, passo);
      this.velocidade.z += THREE.MathUtils.clamp(mz * vMax - this.velocidade.z, -passo, passo);
    }

    // ----- Ataque -----
    this.tempoAtaque += dt;
    if (entrada.consumirAtaque() && this.tempoAtaque > this.ataque.recarga) {
      this.tempoAtaque = 0;
      this.disparou = false;
      this.atingidos.clear();
      som.efeito('ataque_' + this.tipoAtaque);
      if (Math.hypot(mx, mz) > 0.2) this.angulo = Math.atan2(mx, mz);
      this.alvoMira = this._mirar();
      if (this.alvoMira) {
        const c = this.alvoMira.centro();
        this.angulo = Math.atan2(c.x - this.posicao.x, c.z - this.posicao.z);
      }
      this.velocidade.x += Math.sin(this.angulo) * this.ataque.passo;
      this.velocidade.z += Math.cos(this.angulo) * this.ataque.passo;
    }
    if (this.tipoAtaque === 'projetil' && !this.disparou && this.tempoAtaque >= this.ataque.disparo) {
      this.disparou = true;
      const origem = this.pontoNoMundo(this.pontoMao);
      const direcao = new THREE.Vector3(Math.sin(this.angulo), 0, Math.cos(this.angulo));
      if (this.alvoMira?.ativo) direcao.copy(this.alvoMira.centro()).sub(origem); // mira também na altura
      projeteis.disparar({
        origem, direcao,
        velocidade: 16, dono: 'jogador', cor: 0xffb02e, raio: 0.22, dano: this.dano, duracao: 0.9,
      });
    }

    // ----- Pulo -----
    if (entrada.consumirPulo()) this.tempoPulo = 0;
    else this.tempoPulo += dt;
    this.tempoForaDoChao = this.noChao ? 0 : this.tempoForaDoChao + dt;
    if (this.tempoPulo < BUFFER_PULO && this.tempoForaDoChao < TEMPO_COYOTE) {
      this.velocidade.y = this.forcaPulo;
      som.efeito('pulo');
      this.tempoPulo = 99;
      this.tempoForaDoChao = 99;
    }
    this.velocidade.y = Math.max(this.velocidade.y + GRAVIDADE * dt, -40);

    // ----- Movimento + colisão -----
    this.noChao = moverComColisao(this, fase.caixas, dt);
    if (this.noChao && fase.trampolins.has(this.apoio)) {
      this.velocidade.y = FORCA_TRAMPOLIM;
      this.noChao = false;
      this.quicou = true;
      som.efeito('quique');
    }

    // Caiu no vazio: perde 1 coração e volta ao checkpoint
    if (this.posicao.y < -25) {
      this.vida--;
      if (this.vida > 0) this.renascer();
    }

    this._atualizarVisual(dt);
  }

  /** Só anima (tela de seleção): personagem de frente para a câmera, balançando. */
  girarVitrine(dt) {
    this.angulo = Math.sin(this.tempoVisual * 0.9) * 0.6;
    this.tempoAtaque = 99;
    this._atualizarVisual(dt);
  }

  _atualizarVisual(dt) {
    this.tempoVisual += dt;
    const vHoriz = Math.hypot(this.velocidade.x, this.velocidade.z);
    const a = this.ataque;
    const atacando = this.tempoAtaque < a.duracao;
    const t = atacando ? this.tempoAtaque / a.duracao : 0;
    if (vHoriz > 0.3 && !atacando) {
      const alvo = Math.atan2(this.velocidade.x, this.velocidade.z);
      const diff = Math.atan2(Math.sin(alvo - this.angulo), Math.cos(alvo - this.angulo));
      this.angulo += diff * Math.min(1, 15 * dt);
    }
    this.tempoAnimacao += dt * vHoriz * 1.6;
    const balanco = this.noChao ? Math.sin(this.tempoAnimacao) * Math.min(1, vHoriz / 6) : 0;

    // Braços
    const [bracoE, bracoD] = this.bracos;
    bracoE.rotation.x = balanco * 0.8;
    bracoE.rotation.z = this.rotZBracos[0];
    bracoD.rotation.z = this.rotZBracos[1];
    bracoD.position.copy(this.posBracoD);
    if (!this.bracoFixo) bracoD.rotation.x = -balanco * 0.8;
    if (atacando) {
      if (this.tipoAtaque === 'onda') {
        bracoE.rotation.x = bracoD.rotation.x = 0; // braços abertos para os lados
        bracoE.rotation.z = -1.2;
        bracoD.rotation.z = 1.2;
      } else if (this.tipoAtaque === 'projetil') {
        bracoD.position.z = this.posBracoD.z - Math.sin(t * Math.PI) * 0.15; // coice do canhão
      } else {
        bracoD.rotation.x = Math.PI / 2;
        bracoD.position.z = this.posBracoD.z + 0.35;
      }
    }

    // Efeitos do ataque
    const e = this.efeitos;
    e.grupo.position.copy(this.posicao);
    e.grupo.rotation.y = this.angulo;
    e.esfera.visible = atacando && this.tipoAtaque === 'soco';
    e.anel.visible = atacando && this.tipoAtaque === 'onda';
    e.feixe.visible = atacando && this.tipoAtaque === 'raio' && t < 0.8;
    e.clarao.visible = atacando && this.tipoAtaque === 'projetil' && t < 0.5;
    const pm = this.pontoMao;
    if (e.esfera.visible) {
      e.esfera.position.copy(pm);
      e.esfera.scale.setScalar(0.6 + Math.sin(t * Math.PI) * 0.8);
      e.esfera.rotation.y += dt * 20;
    }
    if (e.anel.visible) {
      e.anel.position.set(0, 0.9, 0);
      e.anel.scale.setScalar(0.4 + t * a.raio);
      e.anel.material.opacity = 0.9 * (1 - t);
      e.anel.material.color.setHSL((this.tempoVisual * 2) % 1, 1, 0.6);
    }
    if (e.feixe.visible) {
      e.feixe.position.set(pm.x, pm.y, pm.z + 1.8);
      const tremor = 0.6 + Math.random() * 0.8;
      e.feixe.scale.set(tremor, tremor, 1);
    }
    if (e.clarao.visible) {
      e.clarao.position.copy(pm);
      e.clarao.scale.setScalar(1 + t * 2);
    }

    if (this.animarModelo) this.animarModelo(this.tempoVisual);
    this.modelo.position.copy(this.posicao);
    this.modelo.position.y += this.noChao ? Math.abs(balanco) * 0.06 : 0;
    this.modelo.rotation.y = this.angulo;
    // Pisca enquanto está invencível
    this.modelo.visible = this.tempoInvencivel <= 0 || Math.floor(this.tempoInvencivel * 12) % 2 === 0;
  }
}
