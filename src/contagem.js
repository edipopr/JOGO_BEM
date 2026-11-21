// Contagem online ANÔNIMA: quantos aparelhos jogaram e quantas partidas.
// Cada aparelho recebe um código aleatório (nada pessoal: sem nome, e-mail ou localização).
// Envia pela API REST do Firebase (sem biblioteca). Sem internet ou sem URL_BANCO: não faz nada.
//
// Estrutura no banco:
//   aparelhos/<id>  = { primeiraVez, ultimaVez, plataforma, instalado, partidas, tentativas, vitorias, derrotas, segundos }
//   dias/<aaaa-mm-dd>/<id> = partidas iniciadas naquele dia
//   partidas/<auto> = { aparelho, heroi, resultado, segundos, pontos, cristais, estrelas, data }
import { URL_BANCO } from './config-online.js';
import { ehToque } from './entrada.js';

const CHAVE_ID = 'guizinho.aparelho';
const CHAVE_PRIMEIRA = 'guizinho.primeiraVez';
const AGORA = { '.sv': 'timestamp' };
const somar = (n = 1) => ({ '.sv': { increment: n } });

function lerOuCriar(chave, criar) {
  try {
    let valor = localStorage.getItem(chave);
    if (!valor) { valor = String(criar()); localStorage.setItem(chave, valor); }
    return valor;
  } catch { return String(criar()); }
}

const novoId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);

function hoje() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

class Contagem {
  constructor() {
    // localhost = testes no PC (não conta); celular na rede de casa (192.168...) e o site contam normalmente
    this.ligada = !!URL_BANCO && !['localhost', '127.0.0.1'].includes(location.hostname);
    this.id = lerOuCriar(CHAVE_ID, novoId).replace(/[^a-zA-Z0-9-]/g, '').slice(0, 36);
    this.primeiraVez = Number(lerOuCriar(CHAVE_PRIMEIRA, () => Date.now()));
  }

  _enviar(metodo, caminho, dados) {
    if (!this.ligada) return;
    try {
      fetch(`${URL_BANCO.replace(/\/$/, '')}/${caminho}.json`, {
        method: metodo, body: JSON.stringify(dados), keepalive: true,
      }).catch(() => { /* sem internet: tudo bem */ });
    } catch { /* tudo bem */ }
  }

  _aparelho(extra) {
    const instalado = window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
    this._enviar('PATCH', `aparelhos/${this.id}`, {
      primeiraVez: this.primeiraVez, ultimaVez: AGORA,
      plataforma: ehToque ? 'celular' : 'computador', instalado: !!instalado,
      ...extra,
    });
  }

  comecou() {
    this._aparelho({ partidas: somar() });
    this._enviar('PATCH', `dias/${hoje()}`, { [this.id]: somar() });
  }

  tentouDeNovo() {
    this._aparelho({ tentativas: somar() });
  }

  terminou(resultado, { heroi, segundos, segundosNovos, pontos, cristais = 0, estrelas = 0 }) {
    const vitoria = resultado === 'vitoria';
    this._aparelho({ [vitoria ? 'vitorias' : 'derrotas']: somar(), segundos: somar(Math.round(segundosNovos)) });
    this._enviar('POST', 'partidas', {
      aparelho: this.id, heroi, resultado, segundos: Math.round(segundos), pontos, cristais, estrelas, data: AGORA,
    });
  }
}

export const contagem = new Contagem();
