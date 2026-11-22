// Fase 5 do jogo: Floresta do Pesadelo (tudo contaminado — aqui começa a INFECÇÃO).
// Caminho (sentido -Z): Clareira Morta → Raízes → Pântano da Infecção → Cogumelo-trampolim → Mirante (y 5,5)
// → Abismo das Sombras → Bosque dos Olhos → Ponte Quebrada → Planalto dos Cristais Escuros (y 9) → Arena (y 12).
// Chefão: Guardião da Infecção (src/chefoes/infeccao.js).
import * as THREE from 'three';
import { ConstrutorFase } from './construtor.js';
import { GuardiaoInfeccao } from '../chefoes/infeccao.js';

export function criarFlorestaPesadelo(cena) {
  const f = new ConstrutorFase(cena, 58);
  f.luzes({
    ceu: 0x1f0f30, nevoa: [16, 80],
    hemi: [0xc9a8f0, 0x3a2048, 1.15],
    sol: [0xd9a8ff, 0.8],
    lanterna: { cor: 0xffd9f4, intensidade: 18, distancia: 16 },
  });
  f.casteloAoLonge(0, -34, -240, 2.2, 0x08020f, 0xff3bd0);
  f.lua(38, 46, -70, 4, 0xff5a7a);
  const TERRA = 0x2a1a24, GRAMA = 0x4a2f5a, GRAMA2 = 0x3a2348;
  const ilha = (x, z, topo, larg, prof, o = {}) => f.ilha(x, z, topo, larg, prof, { grama: GRAMA, terra: TERRA, ...o });
  const mortas = (minX, maxX, minZ, maxZ, chao, n, evitar) => {
    for (let i = 0, t = 0; i < n && t < n * 20; t++) {
      const x = minX + f.sorte() * (maxX - minX), z = minZ + f.sorte() * (maxZ - minZ);
      if (evitar(x, z)) continue;
      f.arvoreMorta(x, z, chao);
      i++;
    }
  };
  f.esporos(-22, 22, -182, 12, -2, 16, 140);

  // ---------- A. Clareira Morta ----------
  ilha(0, 0, 0, 24, 24);
  mortas(-11, 11, -11, 11, 0, 9, (x, z) => Math.hypot(x, z) < 6 || (Math.abs(x) < 4 && z < 0) || (Math.abs(x) < 5 && z > 4) || Math.hypot(x + 9, z - 9) < 2.5);
  f.poca(-5, -6, 0, 1.6);
  f.poca(6, -3, 0, 1.4);
  f.cristais(8, 6, 0, 1.1, 0xff3b9d);

  // ---------- B. Raízes ----------
  for (const [x, z, y] of [[2, -15.5, 0], [-2, -20.5, 0.4], [1, -25.5, 0.8]]) ilha(x, z, y, 4.2, 4, { alt: 3, grama: 0x5a3f2f });

  // ---------- C. Pântano da Infecção ----------
  ilha(0, -42, 0, 22, 26, { grama: GRAMA2 });
  for (const [x, z, r] of [[-3, -34, 1.8], [4, -37, 2], [-6, -41, 2], [1, -44, 1.6], [7, -46, 1.8], [-4, -49, 1.9], [5, -51.5, 1.4]]) f.poca(x, z, 0, r);
  mortas(-10, 10, -54, -30, 0, 9, (x, z) => Math.abs(x) < 4 || Math.hypot(x - 9.5, z + 53) < 2);
  for (const [x, z] of [[-9, -36], [9, -42], [-8.5, -52]]) f.cogumeloBrilhante(x, z, 0, 0x9dff3d, 1.6);
  f.trampolim(0, -53.2, 0, 0x9dff3d);

  // ---------- D. Mirante (y 5,5) ----------
  ilha(0, -64.5, 5.5, 16, 16, { alt: 10 });
  mortas(-7, 7, -72, -57, 5.5, 4, (x) => Math.abs(x) < 3.5);
  f.cristais(-6, -60, 5.5, 1.2, 0xff3b9d);
  f.trampolim(6, -62, 5.5, 0xff3b9d);
  f.bloco(6, -67.5, 11, 3, 3, 0.5, 0x5a3f7a);            // galho secreto

  // ---------- E. Abismo das Sombras ----------
  f.plataformaMovel(0, -75.9, 5.5, 3.4, 3.4, 0x7a3cff, { eixo: 'x', amplitude: 3, velocidade: 1 });
  f.plataformaMovel(0, -80.4, 5.5, 3.4, 3.4, 0x7a3cff, { eixo: 'x', amplitude: 3, velocidade: 1, fase: Math.PI });
  f.plataformaMovel(0, -85, 5.5, 3.4, 3.4, 0xff3b9d, { eixo: 'y', amplitude: 1, velocidade: 1.1 });

  // ---------- F. Bosque dos Olhos (y 5,5) ----------
  ilha(0, -100, 5.5, 22, 24, { alt: 12, grama: GRAMA2 });
  mortas(-10, 10, -111, -89, 5.5, 11, (x, z) => Math.abs(x) < 3 || Math.hypot(x + 9.5, z + 110) < 2);
  for (const [x, z, r] of [[-3, -95, 1.4], [3, -101, 1.6], [-2, -107, 1.5]]) f.poca(x, z, 5.5, r);
  for (const [x, z] of [[-7, -94], [7.5, -99], [-8, -104], [8, -108]]) f.olhoDeArvore(x, z, 5.5);

  // ---------- G. Ponte Quebrada ----------
  for (const [x, z, y] of [[0, -115.2, 6.2], [1.5, -119, 7], [-1, -122.8, 7.8], [0.5, -126.2, 8.6]]) f.bloco(x, z, y, 3, 3, 0.7, 0x6a5a7a);

  // ---------- H. Planalto dos Cristais Escuros (y 9) ----------
  ilha(0, -138.5, 9, 18, 20, { alt: 14 });
  for (const [x, z] of [[-7, -131], [7, -134], [-7, -142], [7.5, -146], [5, -139]]) f.cristais(x, z, 9, 1.4, f.sorte() > 0.5 ? 0xff3b9d : 0x7a3cff);
  for (const [x, z, r] of [[-3.5, -134, 1.5], [3, -143, 1.7]]) f.poca(x, z, 9, r);

  // ---------- I. Subida ----------
  f.bloco(-2, -150.6, 10.2, 3, 3, 1.2, 0x5a3f7a);
  f.bloco(1, -153.8, 11.4, 3, 3, 0.8, 0x6a5a7a);

  // ---------- J. Arena da Infecção ----------
  const { arena, barreira } = f.arenaChefao(0, -167.6, 12, 24, {
    piso: 0x3a1f4a, terra: 0x1a0c20, corMureta: 0x4a2f5a,
    criarParte: (i) => {
      const t = new THREE.Mesh(new THREE.ConeGeometry(0.45, 2.8 + (i % 2) * 0.6, 6), new THREE.MeshLambertMaterial({ color: 0x7a3cff, emissive: 0x2a0b5c, flatShading: true, transparent: true, opacity: 0.75 }));
      t.rotation.z = i % 2 ? 0.15 : -0.15;
      return t;
    },
  });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    f.cristais(Math.sin(a) * 10.5, -167.6 + Math.cos(a) * 10.5, 12, 1.5, i % 2 ? 0xff3b9d : 0x9dff3d);
  }

  // ---------- Inimigos ----------
  const inimigos = [
    ['gosma', -4, 0, -7], ['espinhoso', 6, 0, -6],
    ['sombra', -1, 1, -21],
    ['gosma', -6, 0, -36], ['espinhoso', 5, 0, -41], ['tentaculo', -2, 0, -47], ['sombra', 6, 0.5, -49], ['cuspidor', -8, 0, -46],
    ['olho', 0, 7.5, -62], ['espinhoso', -3, 5.5, -68],
    ['sombra', 0, 6.5, -80],
    ['olho', -4, 7.5, -94], ['olho', 4, 7.5, -104], ['tentaculo', 4.5, 5.5, -96], ['espinhoso', -4, 5.5, -101], ['sombra', 6, 6, -108],
    ['tentaculo', -4, 9, -138], ['tentaculo', 4, 9, -134], ['olho', 0, 11, -141], ['espinhoso', 3, 9, -146], ['sombra', -4, 9.5, -145],
  ].map(([tipo, x, y, z]) => ({ tipo, x, y, z }));

  // ---------- Itens ----------
  const cristais = [
    [0, 0, -4], [4, 0, 4], [-6, 0, 2], [2, 0, -9],
    [2, 0, -15.5], [-2, 0.4, -20.5], [1, 0.8, -25.5],
    [0, 0, -32], [-5, 0, -37.5], [5, 0, -42], [-1, 0, -50], [0, 4, -53.2],
    [0, 5.5, -59], [-4, 5.5, -65], [3, 5.5, -70],
    [0, 6.1, -75.9], [0, 6.1, -80.4], [0, 6.6, -85],
    [0, 5.5, -91], [5, 5.5, -97], [-5, 5.5, -106], [0, 5.5, -110],
    [1.5, 7, -119], [-1, 7.8, -122.8],
    [0, 9, -133], [-5, 9, -140],
    [1, 11.4, -153.8],
    [-6, 12, -164], [6, 12, -164],
  ];
  const estrelas = [
    [-9, 0, 9],           // canto escuro da clareira
    [6, 11, -67.5],       // galho secreto do mirante
    [-9.5, 5.5, -110],    // canto do Bosque dos Olhos
  ];
  const coracoes = [[9.5, 0, -53], [0, 5.5, -64], [8, 5.5, -90], [7, 9, -130], [8, 12, -160], [-8, 12, -175]];
  const antivirus = [[0, 0, -40], [-4, 5.5, -70], [0, 5.5, -99], [-6, 9, -136], [0, 12, -175], [8, 12, -168]];
  const itens = [
    ...cristais.map(([x, y, z]) => ({ tipo: 'cristal', x, y, z })),
    ...estrelas.map(([x, y, z]) => ({ tipo: 'estrela', x, y, z })),
    ...coracoes.map(([x, y, z]) => ({ tipo: 'coracao', x, y, z })),
    ...antivirus.map(([x, y, z]) => ({ tipo: 'antivirus', x, y, z })),
  ];

  const checkpoints = [[3, 0, -30.5], [-3, 5.5, -59], [3, 5.5, -90], [-3, 9, -130.5], [0, 12, -157.6]].map(([x, y, z]) => new THREE.Vector3(x, y, z));

  const avisos = [
    { x: 0, y: 0, z: 2, raio: 2.5, texto: 'Floresta do Pesadelo! Cuidado: aqui você pode ser INFECTADO!' },
    { x: 0, y: 0, z: -6, raio: 3, texto: 'Golpes e poças enchem a barra roxa. Se encher, os controles se invertem!' },
    { x: 0, y: 0, z: -37, raio: 3, texto: 'O frasco verde é o ANTIVÍRUS: limpa toda a infecção!' },
    { x: 0, y: 0, z: -50, raio: 3, texto: 'Pule no cogumelo verde para subir!' },
    { x: 0, y: 5.5, z: -90, raio: 3, texto: 'Você sente que as árvores estão olhando...' },
    { x: 0, y: 9, z: -130, raio: 3.5, texto: 'Tentáculos! Espere eles baterem e ataque!' },
    { x: 0, y: 12, z: -157.5, raio: 3.5, texto: 'O coração da infecção bate aqui...' },
  ];

  return {
    id: 'pesadelo',
    nome: 'Floresta do Pesadelo',
    caixas: f.caixas,
    trampolins: f.trampolins,
    correntes: f.correntes,
    infeccao: true,
    longe: 95,
    inimigos, itens, checkpoints, avisos,
    portal: new THREE.Vector3(0, 12, -176),
    arena,
    barreira,
    pontoInicial: new THREE.Vector3(0, 0, 4),
    criarChefao: (cenaFase, particulas, fase) =>
      new GuardiaoInfeccao(cenaFase, fase.arena, particulas, { barreira: fase.barreira, caixas: fase.caixas }),
    musicaChefao: 'chefaoInfeccao',
    atualizar: (dt, corpos, foco) => f.atualizar(dt, corpos, foco),
    perigos: (dt, jogador) => f.atualizarPerigos(dt, jogador),
    musicaEm: () => 'pesadelo',
  };
}
