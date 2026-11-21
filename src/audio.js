// Áudio do jogo, todo sintetizado com Web Audio (sem arquivos): efeitos sonoros e trilha.
// Uso: som.efeito('pulo'); som.musica('floresta'); som.alternarMudo().
// Antes do primeiro toque/clique o navegador não deixa tocar som — som.iniciar() é chamado nesse momento.

const CHAVE_MUDO = 'guizinho.mudo';

// ---------- Notas ----------
const SEMITONS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freq(nota) {
  const m = /^([A-G])(#?)(\d)$/.exec(nota);
  const midi = (Number(m[3]) + 1) * 12 + SEMITONS[m[1]] + (m[2] ? 1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}
/** "C5 . E5 | G5 ..." → lista de notas por colcheia ('.' = pausa). */
const padrao = (texto) => texto.split(/\s+/).filter((t) => t && t !== '|');

// ---------- Músicas (cada passo = 1 colcheia) ----------
const MUSICAS = {
  menu: {
    bpm: 104, volume: 0.5,
    melodia: padrao(`C5 . E5 G5 . E5 C5 . | D5 . F5 A5 . F5 D5 . | E5 . G5 C6 . G5 E5 . | D5 . B4 G4 . . . .`),
    baixo: padrao(`C3 . . . G2 . . . | D3 . . . A2 . . . | C3 . . . G2 . . . | G2 . . . G2 . . .`),
    bateria: padrao(`k . h . s . h . | k . h . s . h h`),
  },
  floresta: {
    bpm: 126, volume: 0.45,
    melodia: padrao(`E5 G5 C6 G5 E5 G5 D5 E5 | C5 E5 A5 E5 C5 E5 B4 C5 | A4 C5 F5 C5 A4 C5 E5 F5 | G5 . F5 . E5 . D5 .
                     E5 G5 C6 G5 E5 G5 D5 E5 | C5 E5 A5 E5 C5 E5 B4 C5 | A4 C5 F5 A5 G5 F5 E5 D5 | C5 . G4 . C5 . . .`),
    baixo: padrao(`C3 . G2 . C3 . G2 . | A2 . E2 . A2 . E2 . | F2 . C3 . F2 . C3 . | G2 . D3 . G2 . B2 .
                   C3 . G2 . C3 . G2 . | A2 . E2 . A2 . E2 . | F2 . C3 . G2 . D3 . | C3 . G2 . C3 . . .`),
    bateria: padrao(`k h s h k h s h | k h s h k k s h`),
  },
  bosque: {
    bpm: 96, volume: 0.45,
    melodia: padrao(`A4 . . C5 . . E5 . | D5 . . F5 . . E5 . | A4 . . C5 . . B4 . | G#4 . . . E4 . . .`),
    baixo: padrao(`A2 . . . A2 . . . | D2 . . . D2 . . . | F2 . . . F2 . . . | E2 . . . E2 . . .`),
    bateria: padrao(`k . . h k . s . | k . . h k . s h`),
  },
  // Chefão: rápida, tensa (menor), graves fortes
  chefao: {
    bpm: 152, volume: 0.5,
    melodia: padrao(`A4 . C5 A4 E5 . D5 C5 | B4 . D5 B4 E5 . D5 B4 | A4 . C5 A4 F5 . E5 D5 | E5 . G#4 . B4 . E5 .
                     A5 . G5 F5 E5 . D5 C5 | D5 . C5 B4 C5 . A4 . | F5 . E5 D5 C5 . B4 A4 | G#4 . B4 . E5 . . .`),
    baixo: padrao(`A2 A2 . A2 A2 . A2 . | G2 G2 . G2 G2 . G2 . | F2 F2 . F2 F2 . F2 . | E2 E2 . E2 E2 . E2 .
                   A2 A2 . A2 A2 . A2 . | D2 D2 . D2 D2 . D2 . | F2 F2 . F2 F2 . F2 . | E2 E2 . E2 E2 . E2 .`),
    bateria: padrao(`k h s h k k s h | k h s h k k s s`),
  },
};

class Audio {
  constructor() {
    this.ctx = null;
    this.mudo = false;
    try { this.mudo = localStorage.getItem(CHAVE_MUDO) === '1'; } catch { /* sem armazenamento */ }
    this.musicaAtual = null;
    this.ultimoEfeito = {};
  }

  /** Cria o áudio (precisa acontecer dentro de um toque/clique do jogador). */
  iniciar() {
    if (this.ctx) { this.ctx.resume?.(); return; }
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return;
    this.ctx = new Contexto();
    this.mestre = this.ctx.createGain();
    this.mestre.gain.value = this.mudo ? 0 : 0.8;
    this.mestre.connect(this.ctx.destination);
    this.canalMusica = this.ctx.createGain();
    this.canalMusica.gain.value = 0.35;
    this.canalMusica.connect(this.mestre);
    this.canalEfeitos = this.ctx.createGain();
    this.canalEfeitos.gain.value = 0.7;
    this.canalEfeitos.connect(this.mestre);

    // Ruído branco (para batidas, explosões e sopros)
    const n = this.ctx.sampleRate;
    this.ruido = this.ctx.createBuffer(1, n, n);
    const dados = this.ruido.getChannelData(0);
    for (let i = 0; i < n; i++) dados[i] = Math.random() * 2 - 1;

    setInterval(() => this._agendarMusica(), 25);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.ctx.suspend(); else this.ctx.resume();
    });
    if (this.pendente) this.musica(this.pendente);
  }

  alternarMudo() {
    this.mudo = !this.mudo;
    try { localStorage.setItem(CHAVE_MUDO, this.mudo ? '1' : '0'); } catch { /* tudo bem */ }
    if (this.mestre) this.mestre.gain.setTargetAtTime(this.mudo ? 0 : 0.8, this.ctx.currentTime, 0.05);
    return this.mudo;
  }

  // ---------- Peças básicas ----------
  _tom(f, inicio, duracao, { tipo = 'square', volume = 0.3, ate = null, destino = this.canalEfeitos, ataque = 0.005 } = {}) {
    const c = this.ctx;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(f, inicio);
    if (ate) osc.frequency.exponentialRampToValueAtTime(ate, inicio + duracao);
    g.gain.setValueAtTime(0.0001, inicio);
    g.gain.exponentialRampToValueAtTime(volume, inicio + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
    osc.connect(g).connect(destino);
    osc.start(inicio);
    osc.stop(inicio + duracao + 0.02);
  }

  _ruido(inicio, duracao, { volume = 0.3, filtro = 'lowpass', freqFiltro = 2000, ate = null, destino = this.canalEfeitos } = {}) {
    const c = this.ctx;
    const fonte = c.createBufferSource();
    fonte.buffer = this.ruido;
    const f = c.createBiquadFilter();
    f.type = filtro;
    f.frequency.setValueAtTime(freqFiltro, inicio);
    if (ate) f.frequency.exponentialRampToValueAtTime(ate, inicio + duracao);
    const g = c.createGain();
    g.gain.setValueAtTime(volume, inicio);
    g.gain.exponentialRampToValueAtTime(0.0001, inicio + duracao);
    fonte.connect(f).connect(g).connect(destino);
    fonte.start(inicio, Math.random() * 0.5);
    fonte.stop(inicio + duracao + 0.02);
  }

  _arpejo(notas, inicio, passo, opcoes) {
    notas.forEach((nota, i) => this._tom(freq(nota), inicio + i * passo, passo * 1.6, opcoes));
  }

  // ---------- Efeitos sonoros ----------
  efeito(nome) {
    if (!this.ctx || this.mudo) return;
    const t = this.ctx.currentTime;
    // Evita o mesmo som repetido no mesmo instante (ex.: vários inimigos atingidos)
    if (this.ultimoEfeito[nome] && t - this.ultimoEfeito[nome] < 0.04) return;
    this.ultimoEfeito[nome] = t;

    switch (nome) {
      case 'pulo': this._tom(300, t, 0.16, { ate: 700, volume: 0.15 }); break;
      case 'quique':
        this._tom(180, t, 0.35, { tipo: 'sine', ate: 900, volume: 0.35 });
        this._tom(360, t, 0.3, { tipo: 'triangle', ate: 1400, volume: 0.15 });
        break;
      case 'ataque_soco':
        this._ruido(t, 0.12, { volume: 0.35, freqFiltro: 3000, ate: 400 });
        this._tom(160, t, 0.12, { tipo: 'sine', ate: 60, volume: 0.4 });
        break;
      case 'ataque_onda':
        ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => this._tom(freq(n), t + i * 0.03, 0.45, { tipo: 'triangle', volume: 0.12, ate: freq(n) * 1.5 }));
        this._ruido(t, 0.4, { volume: 0.15, filtro: 'bandpass', freqFiltro: 800, ate: 4000 });
        break;
      case 'ataque_raio':
        for (let i = 0; i < 5; i++) this._tom(600 + Math.random() * 900, t + i * 0.04, 0.05, { tipo: 'sawtooth', volume: 0.1 });
        this._ruido(t, 0.22, { volume: 0.2, filtro: 'highpass', freqFiltro: 3000 });
        break;
      case 'ataque_projetil':
        this._tom(500, t, 0.18, { tipo: 'square', ate: 120, volume: 0.2 });
        this._ruido(t, 0.1, { volume: 0.25, freqFiltro: 1500 });
        break;
      case 'explosao':
        this._ruido(t, 0.45, { volume: 0.45, freqFiltro: 1800, ate: 100 });
        this._tom(120, t, 0.3, { tipo: 'sine', ate: 40, volume: 0.4 });
        break;
      case 'acerto': this._tom(900, t, 0.08, { tipo: 'square', ate: 400, volume: 0.12 }); break;
      case 'inimigo_derrotado':
        this._ruido(t, 0.2, { volume: 0.25, filtro: 'bandpass', freqFiltro: 1200, ate: 300 });
        this._arpejo(['G5', 'E5', 'C5'], t + 0.02, 0.05, { tipo: 'square', volume: 0.1 });
        break;
      case 'cuspe':
        this._tom(220, t, 0.18, { tipo: 'sine', ate: 90, volume: 0.25 });
        this._ruido(t, 0.12, { volume: 0.12, freqFiltro: 900 });
        break;
      case 'dano':
        this._tom(330, t, 0.3, { tipo: 'square', ate: 110, volume: 0.25 });
        this._tom(311, t, 0.3, { tipo: 'sawtooth', ate: 100, volume: 0.1 });
        break;
      case 'cristal': this._arpejo(['E6', 'B6'], t, 0.06, { tipo: 'sine', volume: 0.2 }); break;
      case 'estrela': this._arpejo(['C6', 'E6', 'G6', 'C7'], t, 0.07, { tipo: 'triangle', volume: 0.2 }); break;
      case 'coracao': this._arpejo(['A5', 'D6'], t, 0.1, { tipo: 'sine', volume: 0.25 }); break;
      case 'checkpoint': this._arpejo(['C5', 'E5', 'G5', 'C6'], t, 0.09, { tipo: 'square', volume: 0.12 }); break;
      case 'botao': this._tom(660, t, 0.07, { tipo: 'sine', volume: 0.15 }); break;
      case 'vitoria':
        this._arpejo(['C5', 'E5', 'G5', 'C6', 'G5', 'C6', 'E6'], t, 0.11, { tipo: 'square', volume: 0.14 });
        this._arpejo(['C3', 'G3', 'C4'], t, 0.26, { tipo: 'triangle', volume: 0.25 });
        break;
      case 'derrota':
        this._arpejo(['G4', 'F#4', 'F4', 'E4'], t, 0.22, { tipo: 'triangle', volume: 0.25 });
        break;
      // ----- Chefão -----
      case 'chefao_rugido':
        this._tom(110, t, 1.1, { tipo: 'sawtooth', ate: 55, volume: 0.3, ataque: 0.1 });
        this._tom(116, t, 1.1, { tipo: 'square', ate: 58, volume: 0.12, ataque: 0.1 });
        this._ruido(t, 1.0, { volume: 0.3, freqFiltro: 600, ate: 150 });
        break;
      case 'chefao_golpe':
        this._tom(90, t, 0.5, { tipo: 'sine', ate: 30, volume: 0.6 });
        this._ruido(t, 0.5, { volume: 0.5, freqFiltro: 900, ate: 60 });
        break;
      case 'chefao_investida':
        this._tom(150, t, 0.6, { tipo: 'sawtooth', ate: 300, volume: 0.2 });
        this._ruido(t, 0.6, { volume: 0.25, filtro: 'bandpass', freqFiltro: 400, ate: 1500 });
        break;
      case 'chefao_bolas':
        for (let i = 0; i < 3; i++) this._tom(500 - i * 80, t + i * 0.04, 0.25, { tipo: 'square', ate: 150, volume: 0.1 });
        break;
      case 'chefao_cansado':
        this._arpejo(['E5', 'C5', 'A4'], t, 0.14, { tipo: 'triangle', volume: 0.25 });
        this._arpejo(['E6', 'G6', 'E6', 'G6'], t + 0.45, 0.08, { tipo: 'sine', volume: 0.12 });
        break;
      case 'chefao_dor':
        this._tom(260, t, 0.3, { tipo: 'sawtooth', ate: 120, volume: 0.25 });
        this._ruido(t, 0.15, { volume: 0.2, freqFiltro: 2500 });
        break;
      case 'chefao_derrotado':
        this._tom(140, t, 1.4, { tipo: 'sawtooth', ate: 40, volume: 0.25, ataque: 0.05 });
        this._ruido(t, 1.2, { volume: 0.35, freqFiltro: 2000, ate: 100 });
        this._arpejo(['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'], t + 1.3, 0.1, { tipo: 'triangle', volume: 0.18 });
        break;
      case 'bloqueio': this._tom(1400, t, 0.12, { tipo: 'triangle', ate: 1100, volume: 0.15 }); break;
      case 'portal':
        this._arpejo(['G4', 'C5', 'E5', 'G5', 'C6'], t, 0.08, { tipo: 'sine', volume: 0.2 });
        this._ruido(t, 0.8, { volume: 0.12, filtro: 'bandpass', freqFiltro: 500, ate: 5000 });
        break;
      default: break;
    }
  }

  // ---------- Trilha sonora ----------
  /** Troca a música (null = silêncio). */
  musica(nome) {
    if (!this.ctx) { this.pendente = nome; return; }
    if (this.musicaAtual === nome) return;
    this.musicaAtual = nome;
    this.passo = 0;
    this.proximoPasso = this.ctx.currentTime + 0.1;
  }

  _agendarMusica() {
    const m = MUSICAS[this.musicaAtual];
    if (!m || !this.ctx || this.ctx.state !== 'running') return;
    const duracao = 60 / m.bpm / 2; // colcheia
    while (this.proximoPasso < this.ctx.currentTime + 0.15) {
      const t = this.proximoPasso;
      const i = this.passo;
      const nota = m.melodia[i % m.melodia.length];
      if (nota !== '.') this._tom(freq(nota), t, duracao * 1.8, { tipo: 'triangle', volume: 0.3 * m.volume, destino: this.canalMusica, ataque: 0.01 });
      const baixo = m.baixo[i % m.baixo.length];
      if (baixo !== '.') this._tom(freq(baixo), t, duracao * 1.9, { tipo: 'sine', volume: 0.55 * m.volume, destino: this.canalMusica, ataque: 0.01 });
      const batida = m.bateria[i % m.bateria.length];
      if (batida === 'k') this._tom(120, t, 0.15, { tipo: 'sine', ate: 45, volume: 0.6 * m.volume, destino: this.canalMusica });
      else if (batida === 's') this._ruido(t, 0.1, { volume: 0.22 * m.volume, filtro: 'bandpass', freqFiltro: 1800, destino: this.canalMusica });
      else if (batida === 'h') this._ruido(t, 0.03, { volume: 0.1 * m.volume, filtro: 'highpass', freqFiltro: 7000, destino: this.canalMusica });
      this.proximoPasso += duracao;
      this.passo++;
    }
  }
}

export const som = new Audio();
