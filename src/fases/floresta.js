// Fase 1 do jogo: Floresta dos Amigos (tutorial).
// Caminho: Clareira → Trilha dos Cogumelos → Planalto → Plataformas móveis → Bosque Escuro → Subida → Arena do Guardião.
// O jogo anda no sentido -Z (para "frente", longe da câmera inicial).
import * as THREE from 'three';
import { ConstrutorFase } from './construtor.js';

export function criarFlorestaDosAmigos(cena) {
  const f = new ConstrutorFase(cena, 7);
  f.luzes();

  // ---------- A. Clareira (início) ----------
  f.ilha(0, 0, 0, 30, 30);
  f.arvoresEm(-14, 14, -14, 14, 0, 16, (x, z) =>
    Math.hypot(x, z) < 7 || (Math.abs(x) < 4.5 && z < 0) || Math.hypot(x + 12.5, z - 12.5) < 2);
  for (let i = 0; i < 25; i++) f.flor((f.sorte() - 0.5) * 26, (f.sorte() - 0.5) * 26, 0);
  for (let i = 0; i < 8; i++) f.cogumelo((f.sorte() - 0.5) * 26, (f.sorte() - 0.5) * 26, 0);

  // ---------- B. Trilha dos Cogumelos ----------
  f.ilha(0, -30, 0, 9, 30);
  for (const z of [-17, -21, -26, -30, -34]) {
    f.arbusto(-3.8, z, 0);
    f.arbusto(3.8, z - 2, 0);
  }
  f.bloco(-1.5, -24, 0.8, 2, 1.2, 0.8, 0x9b9b9b); // pedras no caminho
  f.bloco(2, -31, 0.8, 1.6, 1.6, 0.8, 0x8a8a8a);
  f.trampolim(0, -41.5, 0); // para subir no planalto

  // ---------- C. Planalto ----------
  f.ilha(0, -55, 6, 20, 20, { alt: 10 });
  f.arvoresEm(-9.5, 9.5, -64.5, -46, 6, 6, (x, z) => Math.abs(x) < 3.5 || Math.hypot(x + 7, z + 52) < 4);
  f.trampolim(-7, -50.5, 6, 0xffd84a);                 // trampolim secreto...
  f.bloco(-7, -55.5, 12, 3, 3, 0.6, 0xffffff);          // ...leva a uma nuvem com estrela

  // ---------- D. Plataformas móveis sobre o vazio ----------
  f.plataformaMovel(0, -68, 6, 3.2, 3.2, 0xff6b9d, { eixo: 'x', amplitude: 4, velocidade: 1.1 });
  f.plataformaMovel(0, -72, 6, 3.2, 3.2, 0x5ad1ff, { eixo: 'x', amplitude: 4, velocidade: 1.1, fase: Math.PI });
  f.plataformaMovel(0, -81, 6, 3.2, 3.2, 0xffd84a, { eixo: 'z', amplitude: 5, velocidade: 0.8 });

  // ---------- E. Bosque Escuro (contaminado) ----------
  f.ilha(0, -100, 6, 18, 22, { alt: 10, grama: 0x3f8f45 });
  f.arvoresEm(-8.5, 8.5, -110.5, -90, 6, 12, (x, z) => Math.abs(x) < 2.5 || (z < -104 && x > -5 && x < 5) || Math.hypot(x - 7.5, z + 109.5) < 1.5,
    { escura: true });
  f.arvore(-7, -93, 6, { infectada: true });
  f.arvore(7, -101, 6, { infectada: true });

  // ---------- F. Subida até a arena ----------
  f.bloco(-3, -106, 7.2, 2.6, 2.6, 1.2, 0xc9a36b);
  f.bloco(1, -109.5, 8.4, 2.6, 2.6, 0.8, 0xc9a36b);
  f.bloco(-1, -113, 9.6, 2.6, 2.6, 0.8, 0xb08550);
  f.bloco(2, -116.5, 10.8, 2.6, 2.6, 0.8, 0xb08550);

  // ---------- G. Arena do Guardião ----------
  f.ilha(0, -131, 12, 24, 24, { alt: 14, grama: 0x5ec24a });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    f.bloco(Math.sin(a) * 10, -131 + Math.cos(a) * 10, 15, 1.2, 1.2, 3, 0x9b9b9b);
  }

  // ---------- Inimigos ----------
  const inimigos = [
    ['gosma', -6, 0, -6], ['gosma', 7, 0, -9],
    ['saltitante', 2, 0, -25], ['saltitante', -2, 0, -33],
    ['cuspidor', 6, 6, -51], ['gosma', -4, 6, -57], ['saltitante', 3, 6, -58],
    ['gosma', -5, 6, -97], ['gosma', 5, 6, -103], ['cuspidor', -6, 6, -108],
    ['saltitante', 0, 6, -100], ['saltitante', 6, 6, -94],
  ].map(([tipo, x, y, z]) => ({ tipo, x, y, z }));

  // ---------- Itens ----------
  const cristais = [
    [0, 0, -4], [3, 0, -7], [-3, 0, -7], [8, 0, 4], [-8, 0, 4], [10, 0, -8], [-10, 0, -8], [0, 0, 9],
    [0, 0, -18], [0, 0, -22], [-2.5, 0, -27], [2.5, 0, -32], [0, 0, -37],
    [0, 4, -43],
    [6, 6, -52], [-4, 6, -60], [6, 6, -62],
    [0, 6.6, -72], [0, 6.6, -80],
    [-6, 6, -95], [6, 6, -98], [-6, 6, -104], [4, 6, -106],
    [1, 8.4, -109.5], [2, 10.8, -116.5],
    [-6, 12, -128], [6, 12, -128],
  ];
  const estrelas = [
    [-12.5, 0, 12.5],   // atrás das árvores da clareira
    [-7, 12, -55.5],    // na nuvem do trampolim secreto
    [7.5, 6, -109.5],   // no canto mais escuro do bosque
  ];
  const coracoes = [[3, 0, -36], [0, 6, -91], [6, 12, -124]];
  const itens = [
    ...cristais.map(([x, y, z]) => ({ tipo: 'cristal', x, y, z })),
    ...estrelas.map(([x, y, z]) => ({ tipo: 'estrela', x, y, z })),
    ...coracoes.map(([x, y, z]) => ({ tipo: 'coracao', x, y, z })),
  ];

  const checkpoints = [[2.5, 6, -47.5], [-3, 6, -91], [0.5, 12, -123]].map(([x, y, z]) => new THREE.Vector3(x, y, z));

  // Mensagens que aparecem uma vez ao passar perto
  const avisos = [
    { x: 0, y: 0, z: -2, raio: 2.5, texto: 'Floresta dos Amigos! Siga a trilha e pegue os cristais.' },
    { x: 0, y: 0, z: -9, raio: 4, texto: 'Gosmas contaminadas! Ataque para derrotá-las.' },
    { x: 0, y: 0, z: -38, raio: 3, texto: 'Pule no cogumelo gigante para subir!' },
    { x: 0, y: 6, z: -63, raio: 3.5, texto: 'Plataformas móveis: espere a hora certa de pular!' },
    { x: 0, y: 6, z: -91, raio: 3.5, texto: 'O Bosque Escuro está contaminado... cuidado!' },
    { x: 0, y: 12, z: -121, raio: 4, texto: 'Arena do Guardião da Floresta. Ele chega em breve! Entre no portal.' },
  ];

  return {
    nome: 'Floresta dos Amigos',
    caixas: f.caixas,
    trampolins: f.trampolins,
    inimigos, itens, checkpoints, avisos,
    portal: new THREE.Vector3(0, 12, -137),
    pontoInicial: new THREE.Vector3(0, 0, 3),
    atualizar: (dt, corpos, foco) => f.atualizar(dt, corpos, foco),
    /** Música conforme a área: Bosque Escuro (z entre -88 e -118) é misterioso. */
    musicaEm: (p) => (p.z < -88 && p.z > -118 ? 'bosque' : 'floresta'),
  };
}
