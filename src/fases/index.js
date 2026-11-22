// Lista das fases, na ordem do jogo. A fase seguinte libera quando a anterior é vencida.
import { criarFlorestaDosAmigos } from './floresta.js';
import { criarFlorestaNoite } from './noite.js';
import { criarMarPesadelo } from './mar.js';
import { criarLaboratorio } from './laboratorio.js';

export const FASES = [
  { id: 'floresta', nome: 'Floresta dos Amigos', criar: criarFlorestaDosAmigos },
  { id: 'noite', nome: 'Floresta à Noite', criar: criarFlorestaNoite },
  { id: 'mar', nome: 'Mar do Pesadelo', criar: criarMarPesadelo },
  { id: 'laboratorio', nome: 'Laboratório Perdido', criar: criarLaboratorio },
];

export const indiceFase = (id) => Math.max(0, FASES.findIndex((f) => f.id === id));
