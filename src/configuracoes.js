// Configurações do jogador (salvas no aparelho): volumes, câmera e qualidade gráfica.
import { ehToque } from './entrada.js';

const CHAVE = 'guizinho.configuracoes';

export const PADRAO = {
  musica: 100,        // 0–100 (100 = volume original do jogo)
  efeitos: 100,       // 0–100
  sensibilidade: 100, // 40–200 (%)
  inverterY: false,
  qualidade: ehToque ? 'media' : 'alta', // 'baixa' | 'media' | 'alta' (celular começa no médio)
};

class Configuracoes {
  constructor() {
    let salvo = {};
    try { salvo = JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { /* sem armazenamento */ }
    this.valores = { ...PADRAO, ...salvo };
    this.ouvintes = [];
  }

  get(nome) { return this.valores[nome]; }

  definir(nome, valor) {
    this.valores[nome] = valor;
    try { localStorage.setItem(CHAVE, JSON.stringify(this.valores)); } catch { /* tudo bem */ }
    for (const f of this.ouvintes) f(this.valores);
  }

  /** f(valores) é chamado agora e a cada mudança. */
  aoMudar(f) {
    this.ouvintes.push(f);
    f(this.valores);
  }
}

export const configuracoes = new Configuracoes();
