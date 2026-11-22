// Os 5 heróis jogáveis: atributos (GDD), ataque, habilidade e modelo (src/modelos.js).
import { modeloGuizinho, modeloIrmao, modeloTvRambon, modeloExperimentoCaixa, modeloFunBot } from './modelos.js';

/**
 * Atributos de 1 a 5 (do GDD). Ataques:
 *  soco     = golpe curto à frente      onda     = explosão de luz ao redor
 *  raio     = choque de alcance médio    projetil = tiro explosivo à distância
 *  bracada  = pancada larga com os braços gigantes
 */
export const PERSONAGENS = {
  guizinho: {
    nome: 'Guizinho', titulo: 'O Herói', cor: '#4cd137',
    descricao: 'Equilibrado, rápido e ótimo de pulo.',
    velocidade: 4, forca: 3, pulo: 4, altura: 1.6,
    ataque: 'soco', nomeAtaque: 'Soco energético', habilidade: 'dash', pontoMao: [0.4, 1.0, 0.85],
    criarModelo: modeloGuizinho,
  },
  tvRambon: {
    nome: 'TV Rambon', titulo: 'O Poder Colorido', cor: '#ff6bd0',
    descricao: 'O mais alto e forte. Ataca tudo ao redor.',
    velocidade: 2, forca: 4, pulo: 2, altura: 2.2,
    ataque: 'onda', nomeAtaque: 'Explosão de luz', habilidade: 'ondaCores', pontoMao: [0, 1.1, 0],
    criarModelo: modeloTvRambon,
  },
  experimentoCaixa: {
    nome: 'Experimento Caixa', titulo: 'O Cientista', cor: '#c89b5a',
    descricao: 'Esperto e falante. Choque de longo alcance.',
    velocidade: 3, forca: 2, pulo: 3, altura: 1.6,
    ataque: 'raio', nomeAtaque: 'Raio elétrico', habilidade: 'campo', pontoMao: [0.35, 0.95, 0.5],
    criarModelo: modeloExperimentoCaixa,
  },
  funBot: {
    nome: 'Mr. Fun BOT', titulo: 'O Robô', cor: '#3d7bd9',
    descricao: 'Ataca de longe com o canhão.',
    velocidade: 3, forca: 3, pulo: 3, altura: 1.8,
    ataque: 'projetil', nomeAtaque: 'Projétil explosivo', habilidade: 'canhao', pontoMao: [0.45, 0.95, 0.7],
    criarModelo: modeloFunBot,
  },
  irmao: {
    nome: 'Irmão do Guizinho', titulo: 'O Braço Forte', cor: '#b36bff',
    descricao: 'Braços gigantes! O mais forte de todos, mas pesado.',
    velocidade: 2, forca: 5, pulo: 3, altura: 1.75,
    ataque: 'bracada', nomeAtaque: 'Pancada gigante', habilidade: 'giro', pontoMao: [0, 0.9, 1.1],
    criarModelo: modeloIrmao,
  },
};
