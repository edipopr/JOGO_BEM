// Salvamento local: a partida em andamento (para "Continuar") e os recordes de cada fase.
//   partida  = { fase, checkpoint, itens: [índices coletados], cristais, estrelas, pontos, tempo,
//                pontosInimigos, derrotados, chefaoDerrotado, avisos: [índices], data }
//   recordes = { <fase>: { concluida, melhorPontos, melhorTempo, maxEstrelas, todosCristais } }
const CHAVE_PARTIDA = 'guizinho.partidaSalva';
const CHAVE_RECORDES = 'guizinho.recordes';

function ler(chave, padrao) {
  try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; }
}
function gravar(chave, valor) {
  try {
    if (valor === null) localStorage.removeItem(chave);
    else localStorage.setItem(chave, JSON.stringify(valor));
  } catch { /* sem armazenamento: tudo bem */ }
}

export const salvamento = {
  partida() { return ler(CHAVE_PARTIDA, null); },
  salvarPartida(dados) { gravar(CHAVE_PARTIDA, { ...dados, data: Date.now() }); },
  apagarPartida() { gravar(CHAVE_PARTIDA, null); },

  recordes(fase) { return ler(CHAVE_RECORDES, {})[fase] || null; },
  /** Guarda o resultado de uma vitória, mantendo os melhores valores. */
  registrarVitoria(fase, { pontos, tempo, estrelas, todosCristais }) {
    const todos = ler(CHAVE_RECORDES, {});
    const r = todos[fase] || { concluida: false, melhorPontos: 0, melhorTempo: null, maxEstrelas: 0, todosCristais: false };
    r.concluida = true;
    r.melhorPontos = Math.max(r.melhorPontos, pontos);
    r.melhorTempo = r.melhorTempo === null ? tempo : Math.min(r.melhorTempo, tempo);
    r.maxEstrelas = Math.max(r.maxEstrelas, estrelas);
    r.todosCristais = r.todosCristais || todosCristais;
    todos[fase] = r;
    gravar(CHAVE_RECORDES, todos);
    return r;
  },

  apagarTudo() {
    gravar(CHAVE_PARTIDA, null);
    gravar(CHAVE_RECORDES, null);
  },
};
