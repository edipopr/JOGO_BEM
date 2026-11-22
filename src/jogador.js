// Jogador: usa o personagem escolhido (personagens.js) para movimento, pulo, ataque e vida.
import * as THREE from 'three';
import { GRAVIDADE, moverComColisao } from './fisica.js';
import { PERSONAGENS } from './personagens.js';
import { punhoRobotico } from './modelos.js';
import { som } from './audio.js';

const TEMPO_COYOTE = 0.1;  // ainda pode pular logo após sair da borda
const BUFFER_PULO = 0.12;  // pulo apertado um pouco antes de tocar o chão
const ACELERACAO = 40;
const VIDA_MAX = 5;
const TEMPO_INVENCIVEL = 1.5;
const FORCA_TRAMPOLIM = 21;
const QUEDA_MAX = -40;
const TEMPO_INFECTADO = 4;

// Debaixo d'água (fase.agua): gravidade menor e "braçadas" no meio da água com o botão de pulo
const FORCA_BRACADA = 6.4;
const TEMPO_BRACADA = 0.32;

// Tempos (s) e alcance de cada tipo de ataque. Golpe ativo entre "inicio" e "fim".
// mira = distância da mira automática (vira para o inimigo mais próximo ao atacar; 0 = sem mira).
const ATAQUES = {
  soco: { duracao: 0.3, recarga: 0.35, inicio: 0.04, fim: 0.24, alcance: 1.1, raio: 1.4, passo: 3, mira: 4 },
  onda: { duracao: 0.45, recarga: 0.7, inicio: 0.08, fim: 0.32, alcance: 0, raio: 3.3, passo: 0, mira: 0 },
  raio: { duracao: 0.3, recarga: 0.4, inicio: 0.04, fim: 0.24, alcance: 2.4, raio: 1.6, passo: 1, mira: 6 },
  projetil: { duracao: 0.25, recarga: 0.45, disparo: 0.06, passo: -1.5, mira: 15 },
  bracada: { duracao: 0.4, recarga: 0.6, inicio: 0.1, fim: 0.34, alcance: 1.5, raio: 2, passo: 3, mira: 5 },
  // vaiEVolta: o golpe anda do corpo até o alcance e volta (punho da Nina)
  foguete: { duracao: 0.5, recarga: 0.55, inicio: 0.04, fim: 0.46, alcance: 4.6, raio: 1.1, passo: 0.5, mira: 6.5, vaiEVolta: true },
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
  const arco = new THREE.Mesh(
    new THREE.TorusGeometry(1.7, 0.16, 6, 20, Math.PI),
    new THREE.MeshBasicMaterial({ color: 0xd9b3ff, transparent: true, opacity: 0.8 }),
  );
  arco.rotation.x = Math.PI / 2; // deitado, meia-volta à frente do herói
  // Punho-foguete: dedos para a frente (+Z), cabo e chama atrás
  const punho = new THREE.Group();
  const mao = punhoRobotico();
  mao.rotation.x = -Math.PI / 2;
  mao.scale.setScalar(1.25);
  const chama = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 8), new THREE.MeshBasicMaterial({ color: 0xffa52e, transparent: true, opacity: 0.9 }));
  chama.rotation.x = -Math.PI / 2;
  chama.position.z = -0.45;
  punho.add(mao, chama);
  const cabo = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 1), new THREE.MeshBasicMaterial({ color: 0x2bb8ad }));
  for (const m of [esfera, anel, feixe, clarao, arco, punho, cabo]) { m.visible = false; grupo.add(m); }
  return { grupo, esfera, anel, feixe, clarao, arco, punho, chama, cabo };
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

  /** Passa o herói para a cena de outra fase. */
  mudarCena(cena, pontoInicial) {
    this.cena.remove(this.modelo, this.efeitos.grupo);
    this.cena = cena;
    cena.add(this.modelo, this.efeitos.grupo);
    this.pontoInicial.copy(pontoInicial);
    this.pontoRenascer.copy(pontoInicial);
  }

  definirPersonagem(id) {
    if (this.modelo) this.cena.remove(this.modelo);
    this.id = PERSONAGENS[id] ? id : 'guizinho';
    const p = PERSONAGENS[this.id];
    this.personagem = p;
    const m = p.criarModelo();
    this.modelo = m.grupo;
    this.modelo.rotation.order = 'YXZ';
    this.bracos = [m.bracoE, m.bracoD];
    this.pernas = [m.pernaE, m.pernaD];
    this.cabeca = m.cabeca;
    this.yCabeca = m.cabeca.position.y;
    this.piscam = m.piscam || [];
    this.bracoFixo = !!m.bracoFixo;
    this.maoD = m.maoD || null; // some enquanto o punho-foguete está no ar
    this.animarModelo = m.animar || null;
    this.posBracoD = m.bracoD.position.clone();
    this.rotZBracos = [m.bracoE.rotation.z, m.bracoD.rotation.z];
    this.cena.add(this.modelo);

    // Atributos 1–5 viram números do jogo
    this.altura = p.altura;
    this.vMax = 3 + p.velocidade * 0.75;          // 4 → 6
    this.forcaPulo = 9 + p.pulo * 0.75;           // 4 → 12
    this.dano = p.forca >= 5 ? 3 : p.forca >= 4 ? 2 : 1;
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
    this.vida = Math.min(this.vidaMax, this.vida + 1);
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
    this.tempoDash = 0;
    this.tempoEscudo = 0;
    this.tempoGiro = 0;
    this.tempoIma = 0;
    this.bracadas = 0;        // braçadas que ainda pode dar antes de tocar o chão (fases na água)
    this.tempoBracada = 99;
    this.amassado = 0;
    this.infeccao = 0;        // 0–100 (fases com fase.infeccao)
    this.tempoInfectado = 0;  // > 0 = controles invertidos pelo Rei do Pesadelo
    this.tempoSemInfeccao = 0;
  }

  /** Aumenta a infecção (só nas fases contaminadas). Ao chegar a 100, os controles se invertem por 4 s. */
  infectar(quanto) {
    if (!this.faseInfectada || this.tempoInfectado > 0 || this.vida <= 0 || this.protegido) return;
    this.infeccao += quanto;
    this.tempoSemInfeccao = 0;
    if (this.infeccao >= 100) {
      this.infeccao = 100;
      this.tempoInfectado = TEMPO_INFECTADO;
      som.efeito('infeccao');
      this.aoInfectar?.();
    }
  }

  /** Antivírus: limpa tudo. */
  curarInfeccao() {
    this.infeccao = 0;
    this.tempoInfectado = 0;
  }

  _atualizarInfeccao(dt) {
    if (!this.faseInfectada) { this.infeccao = 0; this.tempoInfectado = 0; return; }
    if (this.tempoInfectado > 0) {
      this.tempoInfectado -= dt;
      if (this.tempoInfectado <= 0) this.infeccao = 30;
      return;
    }
    this.tempoSemInfeccao += dt;
    if (this.tempoSemInfeccao > 3) this.infeccao = Math.max(0, this.infeccao - 4 * dt);
  }

  /** Dash de energia: corre reto e rápido por alguns instantes, protegido. */
  iniciarDash(dirX, dirZ, velocidade, duracao) {
    this.tempoDash = duracao;
    this.dash = { x: dirX * velocidade, z: dirZ * velocidade };
    this.angulo = Math.atan2(dirX, dirZ);
  }

  /** Protegido pelo dash, pelo campo tecnológico, pelo giro gigante ou pelo superímã. */
  get protegido() { return this.tempoDash > 0 || this.tempoEscudo > 0 || this.tempoGiro > 0 || this.tempoIma > 0; }

  /** Área do golpe corpo a corpo ativo, ou null. */
  areaGolpe() {
    const a = this.ataque;
    if (this.tipoAtaque === 'projetil' || this.tempoAtaque < a.inicio || this.tempoAtaque > a.fim) return null;
    const r = this._area;
    const alcance = a.vaiEVolta ? this._alcancePunho() : a.alcance;
    r.x = this.posicao.x + Math.sin(this.angulo) * alcance;
    r.y = this.posicao.y + 0.8;
    r.z = this.posicao.z + Math.cos(this.angulo) * alcance;
    r.raio = a.raio;
    r.dano = this.dano;
    return r;
  }

  /** Distância do punho-foguete até a heroína neste instante (sai, vai até o alcance e volta). */
  _alcancePunho() {
    const t = Math.min(1, this.tempoAtaque / this.ataque.duracao);
    return this.pontoMao.z + Math.sin(t * Math.PI) * (this.ataque.alcance - this.pontoMao.z);
  }

  /**
   * Mira automática: o inimigo ativo mais próximo à frente (até ~75° para cada lado)
   * dentro do alcance do ataque. this.alvos() é definido pelo main (inimigos + chefão).
   */
  _mirar() {
    return this.mirarAlvo(this.ataque.mira);
  }

  /** Alvo mais próximo à frente dentro do alcance (também usado pelo tiro de canhão). */
  mirarAlvo(alcance) {
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
    if (this.tempoInvencivel > 0 || this.vida <= 0 || this.protegido) return false;
    this.vida--;
    this.infectar(20);
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
    this.nadou = false;
    const agua = fase.agua;
    this.naAgua = !!agua;

    // ----- Direção relativa à câmera -----
    this.faseInfectada = !!fase.infeccao;
    this._atualizarInfeccao(dt);
    const dir = entrada.direcao();
    if (this.tempoInfectado > 0) { dir.x *= -1; dir.y *= -1; } // infectado: anda ao contrário
    const mx = eixos.frente.x * dir.y + eixos.direita.x * dir.x;
    const mz = eixos.frente.z * dir.y + eixos.direita.z * dir.x;
    const vMax = (entrada.correndo() ? this.vMax * 1.65 : this.vMax) * (agua ? 0.9 : 1);
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
    this.tempoBracada += dt;
    if (this.noChao && agua) this.bracadas = agua.bracadas;
    if (this.tempoPulo < BUFFER_PULO && this.tempoForaDoChao < TEMPO_COYOTE) {
      this.velocidade.y = this.forcaPulo * (agua ? 0.72 : 1);
      som.efeito(agua ? 'nado' : 'pulo');
      this.tempoPulo = 99;
      this.tempoForaDoChao = 99;
      this.tempoBracada = 0;
    } else if (agua && this.tempoPulo < BUFFER_PULO && this.bracadas > 0 && this.tempoBracada > TEMPO_BRACADA) {
      this.velocidade.y = Math.max(this.velocidade.y, FORCA_BRACADA); // braçada: nada para cima
      this.bracadas--;
      this.tempoPulo = 99;
      this.tempoBracada = 0;
      this.nadou = true;
      som.efeito('nado');
    }
    this.velocidade.y = Math.max(this.velocidade.y + GRAVIDADE * (agua ? agua.gravidade : 1) * dt, agua ? agua.quedaMax : QUEDA_MAX);
    // Correntes (colunas de bolhas/ar) que empurram para cima
    for (const c of fase.correntes || []) {
      if (!c.caixa.containsPoint(this.posicao)) continue;
      this.velocidade.y += (c.forca - this.velocidade.y) * Math.min(1, 6 * dt);
      if (agua) this.bracadas = agua.bracadas;
    }
    if (this.tempoDash > 0) { // dash: ignora gravidade e controle
      this.tempoDash -= dt;
      this.velocidade.set(this.dash.x, 0, this.dash.z);
      if (this.tempoDash <= 0) { this.velocidade.x *= 0.3; this.velocidade.z *= 0.3; }
    }

    // ----- Movimento + colisão -----
    const vyAntes = this.velocidade.y, noChaoAntes = this.noChao;
    this.noChao = moverComColisao(this, fase.caixas, dt);
    if (this.noChao && !noChaoAntes && vyAntes < -6) this.amassado = Math.min(0.28, -vyAntes * 0.014); // aterrissou
    if (this.noChao && fase.trampolins.has(this.apoio)) {
      this.velocidade.y = FORCA_TRAMPOLIM;
      this.noChao = false;
      this.quicou = true;
      som.efeito('quique');
    }

    // Caiu no vazio: perde 1 coração e volta ao checkpoint
    if (this.posicao.y < (fase.limiteQueda ?? -25)) {
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
    const ritmo = Math.min(1, vHoriz / 6);
    const balanco = this.noChao ? Math.sin(this.tempoAnimacao) * ritmo : 0;
    const girando = this.tempoGiro > 0;
    const nadando = this.naAgua && !this.noChao;
    const k = Math.min(1, 14 * dt);
    const ir = (obj, eixo, valor, vel = k) => { obj.rotation[eixo] += (valor - obj.rotation[eixo]) * vel; };

    // Pernas: andam no chão, encolhem no pulo, batem na água
    const [pernaE, pernaD] = this.pernas;
    if (this.noChao) {
      ir(pernaE, 'x', -balanco * 0.9);
      ir(pernaD, 'x', balanco * 0.9);
    } else if (nadando) {
      const chute = Math.sin(this.tempoVisual * 9) * 0.5;
      ir(pernaE, 'x', 0.3 + chute);
      ir(pernaD, 'x', 0.3 - chute);
    } else {
      const subindo = this.velocidade.y > 0;
      ir(pernaE, 'x', subindo ? -0.7 : -0.25);
      ir(pernaD, 'x', subindo ? 0.45 : 0.3);
    }

    // Braços
    const [bracoE, bracoD] = this.bracos;
    const [zE, zD] = this.rotZBracos;
    const respira = Math.sin(this.tempoVisual * 2.2) * 0.04;
    bracoD.position.copy(this.posBracoD);
    let xE = balanco * 0.9, xD = -balanco * 0.9, rzE = zE - respira, rzD = zD + respira;
    if (!this.noChao) { // no ar: braços abertos; na água: remada
      const remada = nadando ? Math.max(0, 1 - this.tempoBracada / 0.45) : 0;
      xE = xD = nadando ? -0.5 + remada * 1.1 : 0;
      rzE = nadando ? -1 + remada * 0.8 : -1.1;
      rzD = -rzE;
    }
    if (girando) { xE = xD = 0; rzE = -1.5; rzD = 1.5; }
    const puxando = this.tempoIma > 0;
    if (puxando) { xD = -2.7; rzD = 0.1; rzE = -0.7; } // superímã: braço robótico para o alto
    if (atacando) {
      if (this.tipoAtaque === 'onda') {
        xE = xD = 0; rzE = -1.7; rzD = 1.7; // braços abertos para os lados
      } else if (this.tipoAtaque === 'projetil') {
        bracoD.position.z = this.posBracoD.z - Math.sin(t * Math.PI) * 0.18; // coice do canhão
      } else if (this.tipoAtaque === 'bracada') { // os dois braços varrem de fora para dentro
        xE = xD = -1.45;
        rzE = t < 0.25 ? -1 : -1 + (t - 0.25) * 1.9;
        rzD = -rzE;
      } else if (this.tipoAtaque === 'foguete') { // braço esticado enquanto o punho voa
        xD = -Math.PI / 2; rzD = 0;
      } else {
        xD = -Math.PI / 2; rzD = 0;
        bracoD.position.z = this.posBracoD.z + Math.sin(t * Math.PI) * 0.3;
      }
    }
    const kb = atacando || girando || puxando ? Math.min(1, 32 * dt) : k;
    ir(bracoE, 'x', xE, kb);
    ir(bracoE, 'z', rzE, kb);
    if (!this.bracoFixo) {
      ir(bracoD, 'x', xD, kb);
      ir(bracoD, 'z', rzD, kb);
    }

    // Cabeça (respira) e olhos (piscam de vez em quando)
    this.cabeca.position.y = this.yCabeca + respira * 0.6 + Math.abs(balanco) * 0.03;
    this.cabeca.rotation.z = balanco * 0.06;
    const piscando = this.tempoVisual % 3.4 < 0.12;
    for (const o of this.piscam) o.scale.y = piscando ? 0.15 : 1;
    // Efeitos do ataque
    const e = this.efeitos;
    e.grupo.position.copy(this.posicao);
    e.grupo.rotation.y = this.angulo;
    e.esfera.visible = atacando && this.tipoAtaque === 'soco';
    e.anel.visible = atacando && this.tipoAtaque === 'onda';
    e.feixe.visible = atacando && this.tipoAtaque === 'raio' && t < 0.8;
    e.clarao.visible = atacando && this.tipoAtaque === 'projetil' && t < 0.5;
    e.arco.visible = (atacando && this.tipoAtaque === 'bracada') || girando;
    const pm = this.pontoMao;
    const voando = atacando && this.tipoAtaque === 'foguete';
    e.punho.visible = e.cabo.visible = voando;
    if (this.maoD) this.maoD.visible = !voando;
    if (voando) {
      const z = this._alcancePunho();
      const x = pm.x * (1 - Math.sin(t * Math.PI) * 0.8); // converge para o meio (onde está a mira)
      e.punho.position.set(x, pm.y, z);
      e.punho.rotation.z = this.tempoVisual * 14;
      e.chama.visible = t < 0.5;
      e.chama.scale.setScalar(0.7 + Math.random() * 0.6);
      e.cabo.position.set((pm.x + x) / 2, pm.y, (pm.z + z) / 2);
      e.cabo.scale.z = Math.max(0.05, z - pm.z);
      e.cabo.rotation.y = Math.atan2(x - pm.x, Math.max(0.1, z - pm.z));
    }
    if (e.arco.visible) {
      e.arco.position.set(0, 0.9, 0);
      e.arco.scale.setScalar(girando ? 1.35 : 0.8 + t * 0.6);
      e.arco.rotation.z = girando ? this.tempoVisual * 20 : 0;
      e.arco.material.opacity = girando ? 0.7 : 0.9 * (1 - t);
    }
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
    this.modelo.position.y += this.noChao ? Math.abs(balanco) * 0.08 : 0;
    this.modelo.rotation.y = this.angulo + (girando ? this.tempoVisual * 22 : 0);
    // Inclina para a frente ao correr/nadar, "amassa" ao cair no chão e estica no pulo
    const inclina = girando ? 0 : nadando ? 0.35 + ritmo * 0.45 : ritmo * 0.14;
    ir(this.modelo, 'x', inclina, Math.min(1, 8 * dt));
    this.amassado = Math.max(0, this.amassado - dt * 1.4);
    const estica = !this.noChao && !nadando ? THREE.MathUtils.clamp(this.velocidade.y * 0.008, -0.05, 0.09) : 0;
    const ey = 1 - this.amassado + estica;
    this.modelo.scale.set(1 / Math.sqrt(ey), ey, 1 / Math.sqrt(ey));
    // Pisca enquanto está invencível
    this.modelo.visible = this.tempoInvencivel <= 0 || Math.floor(this.tempoInvencivel * 12) % 2 === 0;
  }
}
