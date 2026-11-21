// Painel do jogo: conta as partidas jogadas neste aparelho (guardado no localStorage).
// Uma "partida" começa ao tocar em Começar / Jogar de novo / Recomeçar e termina em vitória ou derrota.
import { PERSONAGENS } from './personagens.js';

const CHAVE = 'guizinho.estatisticas';
const MAX_ULTIMAS = 10;

function novo() {
  return {
    partidas: 0, vitorias: 0, derrotas: 0, tentativas: 0,
    tempoTotal: 0, inimigos: 0, melhorPontos: 0, melhorTempo: null,
    porHeroi: {}, ultimas: [],
  };
}

function ler() {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE));
    return salvo ? { ...novo(), ...salvo } : novo();
  } catch { return novo(); }
}

class Estatisticas {
  constructor() { this.dados = ler(); }

  _salvar() {
    try { localStorage.setItem(CHAVE, JSON.stringify(this.dados)); } catch { /* sem armazenamento: tudo bem */ }
  }

  /** Partida nova (do início da fase). */
  comecou(heroi) {
    const d = this.dados;
    d.partidas++;
    d.porHeroi[heroi] = (d.porHeroi[heroi] || 0) + 1;
    this._salvar();
  }

  /** "Tentar de novo" (continua do checkpoint). */
  tentouDeNovo() { this.dados.tentativas++; this._salvar(); }

  /** Fim de partida (ou derrota antes de "Tentar de novo"). resultado = 'vitoria' | 'derrota'. */
  terminou(resultado, { heroi, tempo, pontos, tempoNovo, inimigosNovos }) {
    const d = this.dados;
    if (resultado === 'vitoria') {
      d.vitorias++;
      d.melhorPontos = Math.max(d.melhorPontos, pontos);
      if (d.melhorTempo === null || tempo < d.melhorTempo) d.melhorTempo = tempo;
    } else {
      d.derrotas++;
    }
    d.tempoTotal += tempoNovo; // só o tempo desde o último registro ("Tentar de novo" continua a partida)
    d.inimigos += inimigosNovos;
    d.ultimas.unshift({ resultado, heroi, tempo: Math.round(tempo), pontos, data: Date.now() });
    d.ultimas.length = Math.min(d.ultimas.length, MAX_ULTIMAS);
    this._salvar();
  }

  zerar() { this.dados = novo(); this._salvar(); }

  /** Preenche a tela do painel. */
  mostrar($) {
    const d = this.dados;
    const relogio = (s) => {
      s = Math.round(s);
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), seg = s % 60;
      return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}:${String(seg).padStart(2, '0')}`;
    };
    const numeros = [
      [d.partidas, 'Partidas jogadas'],
      [d.vitorias, 'Vitórias'],
      [d.derrotas, 'Derrotas'],
      [relogio(d.tempoTotal), 'Tempo jogado'],
      [d.inimigos, 'Inimigos derrotados'],
      [d.melhorPontos, 'Recorde de pontos'],
      [d.melhorTempo === null ? '—' : relogio(d.melhorTempo), 'Vitória mais rápida'],
      [d.tentativas, '"Tentar de novo"'],
    ];
    $('painel-numeros').innerHTML = numeros.map(([n, rotulo]) => `<div><b>${n}</b><span>${rotulo}</span></div>`).join('');

    const maior = Math.max(1, ...Object.values(d.porHeroi));
    $('painel-herois').innerHTML = Object.entries(PERSONAGENS).map(([id, p]) => {
      const n = d.porHeroi[id] || 0;
      return `<div class="atributo" style="--cor:${p.cor}"><span>${p.nome}</span>`
        + `<div class="barra"><i style="width:${(n / maior) * 100}%"></i></div><b>${n}</b></div>`;
    }).join('');

    $('painel-ultimas').innerHTML = d.ultimas.length
      ? d.ultimas.map((u) => {
        const data = new Date(u.data);
        const quando = `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')} `
          + `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`;
        const nome = PERSONAGENS[u.heroi]?.nome || u.heroi;
        const venceu = u.resultado === 'vitoria';
        return `<li><span>${quando} · ${nome}</span><span class="${venceu ? 'ok' : 'nao'}">`
          + `${venceu ? 'Vitória' : 'Derrota'} · ${relogio(u.tempo)} · ${u.pontos} pts</span></li>`;
      }).join('')
      : '<li><span>Nenhuma partida terminada ainda.</span></li>';
  }
}

export const estatisticas = new Estatisticas();
