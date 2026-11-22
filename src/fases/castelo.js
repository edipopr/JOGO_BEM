// Fase 6 (final): Castelo do Rei do Pesadelo.
// Caminho (sentido -Z): Ponte Levadiça → Salão das Armaduras → Escadaria (sobe a y 6) → Galeria dos Pêndulos
// → Torres Flutuantes → Salão dos Tentáculos (y 11,2) → Subida → Sala do Trono (y 14).
// Chefão final: Rei do Pesadelo (src/chefoes/rei.js).
import * as THREE from 'three';
import { ConstrutorFase } from './construtor.js';
import { ReiPesadelo } from '../chefoes/rei.js';

export function criarCastelo(cena) {
  const f = new ConstrutorFase(cena, 66);
  f.luzes({
    ceu: 0x1a0a22, nevoa: [18, 85],
    hemi: [0xd9b8ff, 0x3a2030, 1.05],
    sol: [0xffc8e0, 0.8],
    lanterna: { cor: 0xffe0c0, intensidade: 18, distancia: 16 },
  });
  f.lua(-34, 50, -90, 6, 0xff3b5a);
  f.esporos(-22, 22, -165, 12, -4, 20, 120);
  const PEDRA = 0x5a4a66, PEDRA2 = 0x4a3a56, ESCURO = 0x241a2c, TAPETE = 0xa01540, OURO = 0xffd84a;
  const piso = (x, z, topo, larg, prof, o = {}) => f.ilha(x, z, topo, larg, prof, { grama: PEDRA, terra: ESCURO, alt: 8, ...o });
  const tapete = (x, z, topo, larg, prof) => {
    f.malha(new THREE.BoxGeometry(larg, 0.04, prof), TAPETE, x, topo + 0.02, z, false);
    for (const s of [-1, 1]) f.malha(new THREE.BoxGeometry(0.15, 0.05, prof), OURO, x + s * larg / 2, topo + 0.025, z, false);
  };
  const torre = (x, z, base, alt, r = 2.4) => {
    f.malha(new THREE.CylinderGeometry(r, r * 1.1, alt, 8), PEDRA2, x, base + alt / 2, z, false);
    f.malha(new THREE.ConeGeometry(r * 1.4, r * 2.4, 8), 0x6a0f3a, x, base + alt + r * 1.2, z, false);
    f.malha(new THREE.BoxGeometry(0.8, 1.6, 0.2), 0xff6bd0, x, base + alt * 0.75, z + r, false);
  };

  // ---------- A. Ponte levadiça ----------
  piso(0, -2, 0, 11, 26, { grama: 0x6a4a3a, alt: 2 });
  for (let z = 9; z > -14; z -= 2) f.malha(new THREE.BoxGeometry(11, 0.05, 0.15), 0x3a2a20, 0, 0.02, z, false);
  for (const s of [-1, 1]) {
    f.bloco(s * 5.3, -2, 1, 0.4, 26, 1, 0x4a3226);
    for (const z of [9, 1, -7]) f.tocha(s * 5.3, 1.3, z);
    torre(s * 9.5, -17, -8, 22, 3);
  }
  // Muralha e portão
  for (const s of [-1, 1]) f.bloco(s * 8, -16.2, 7, 9, 1.6, 8, PEDRA2);
  f.bloco(0, -16.2, 8.4, 8, 1.6, 2.6, PEDRA2);
  for (let i = -5; i <= 5; i++) f.malha(new THREE.BoxGeometry(1.2, 1, 1.6), PEDRA2, i * 2.2, i > -2 && i < 2 ? 8.9 : 7.5, -16.2);
  for (const x of [-2.4, -1.2, 0, 1.2, 2.4]) f.malha(new THREE.ConeGeometry(0.18, 1, 5), 0x222230, x, 5.4, -16.2, false).rotation.x = Math.PI; // grade levantada

  // ---------- B. Salão das Armaduras ----------
  piso(0, -30, 0, 24, 30);
  tapete(0, -30, 0, 4, 29);
  for (const z of [-21, -28, -35, -42]) for (const s of [-1, 1]) {
    f.coluna(s * 6, z, 0, 5, PEDRA2);
    f.tocha(s * 5.3, 2.6, z);
  }
  for (const s of [-1, 1]) f.bloco(s * 11.7, -30, 3, 0.6, 30, 3, PEDRA2);
  f.poca(-4, -38, 0, 1.6);
  f.poca(4.5, -25, 0, 1.5);

  // ---------- C. Escadaria ----------
  for (let i = 1; i <= 6; i++) f.bloco(0, -44 - i * 1.7, i, 8, 1.7, 3 + i, i % 2 ? PEDRA : PEDRA2);
  for (let i = 1; i <= 6; i++) f.malha(new THREE.BoxGeometry(3, 0.04, 1.7), TAPETE, 0, i + 0.02, -44 - i * 1.7, false);

  // ---------- D. Galeria dos Pêndulos (y 6) ----------
  piso(0, -66, 6, 7, 22);
  tapete(0, -66, 6, 2.4, 22);
  f.pendulo(0, -60, 6, { amplitude: 3.6, velocidade: 1.7 });
  f.pendulo(0, -65.5, 6, { amplitude: 3.6, velocidade: 1.9, fase: 1.5 });
  f.pendulo(0, -71, 6, { amplitude: 3.6, velocidade: 2.1, fase: 3 });
  for (const s of [-1, 1]) for (const z of [-57, -75]) f.tocha(s * 3.1, 6.6, z);

  // ---------- E. Torres Flutuantes ----------
  f.bloco(0, -80.2, 6.8, 3.8, 3.8, 1, PEDRA);
  f.plataformaMovel(0, -84.9, 7.4, 3.4, 3.4, 0xb3124a, { eixo: 'x', amplitude: 3, velocidade: 1.1 });
  f.bloco(1.5, -89.6, 8.2, 3.6, 3.6, 1, PEDRA);
  f.plataformaMovel(0.5, -94.1, 9.8, 3.4, 3.4, 0xb3124a, { eixo: 'y', amplitude: 1.6, velocidade: 1 });
  for (const [x, z] of [[-9, -82], [10, -88], [-10, -95]]) torre(x, z, -14, 24, 2.2);
  f.trampolim(5.6, -89.6, 7.2, 0xff6bd0);
  f.bloco(5.6, -89.6, 7.2, 2.6, 2.6, 0.8, PEDRA2);
  f.bloco(8.2, -94.5, 13, 3, 3, 0.6, OURO);            // torre secreta

  // ---------- F. Salão dos Tentáculos (y 11,2) ----------
  piso(0, -109, 11.2, 24, 26, { alt: 14 });
  tapete(0, -109, 11.2, 4, 26);
  for (const z of [-100, -109, -118]) for (const s of [-1, 1]) { f.coluna(s * 7, z, 11.2, 5, PEDRA2); f.tocha(s * 6.3, 13.8, z); }
  for (const [x, z, r] of [[-4, -103, 1.6], [4, -108, 1.8], [-3.5, -114, 1.7]]) f.poca(x, z, 11.2, r);
  for (const [x, z] of [[-10, -99], [10, -112], [-10, -119]]) f.cristais(x, z, 11.2, 1.2, 0xff3bd0);
  for (const s of [-1, 1]) f.bloco(s * 11.7, -109, 13.2, 0.6, 26, 2, PEDRA2);

  // ---------- G. Subida ----------
  f.bloco(-2, -124, 12.2, 3, 3, 1.4, PEDRA);
  f.bloco(1, -127.2, 13.2, 3, 3, 1, PEDRA2);

  // ---------- H. Sala do Trono ----------
  const { arena, barreira } = f.arenaChefao(0, -142.4, 14, 26, {
    piso: 0x3a2a48, terra: 0x1a1020, corMureta: 0x5a2a4a, altura: 18,
    criarParte: (i) => new THREE.Mesh(new THREE.ConeGeometry(0.3, 2.9, 5), new THREE.MeshLambertMaterial({ color: 0x8a1f5a, emissive: 0x3a0a2a, flatShading: true, transparent: true, opacity: 0.8 })),
  });
  for (const [r, cor] of [[11, OURO], [5, TAPETE], [1.6, OURO]]) f.malha(new THREE.RingGeometry(r - 0.3, r, 44), cor, 0, 14.03, -142.4, false).rotation.x = -Math.PI / 2;
  // Trono
  f.bloco(0, -153.6, 15, 5, 2, 1, PEDRA2);
  f.bloco(0, -154.2, 19.5, 3, 0.7, 5, 0x6a0f3a);
  for (const s of [-1, 1]) { f.malha(new THREE.ConeGeometry(0.35, 1.4, 5), OURO, s * 1.3, 20.2, -154.2); f.bloco(s * 1.4, -153.4, 16.2, 0.5, 1.6, 1.2, OURO); }
  f.malha(new THREE.OctahedronGeometry(0.6, 0), 0xff3bd0, 0, 20.4, -154.2);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    f.coluna(Math.sin(a) * 11.4, -142.4 + Math.cos(a) * 11.4, 14, 5, PEDRA2);
    f.tocha(Math.sin(a) * 10.7, 17, -142.4 + Math.cos(a) * 10.7);
  }
  for (const [x, z] of [[-18, -135], [18, -135], [-18, -152], [18, -152]]) torre(x, z, -6, 34, 3);

  // ---------- Inimigos ----------
  const inimigos = [
    ['sombra', -2, 0.8, -8],
    ['cavaleiro', -3.5, 0, -24], ['olho', 4, 2, -28], ['cavaleiro', 3.5, 0, -33], ['espinhoso', -8.5, 0, -34], ['sombra', 8, 0.6, -38], ['cavaleiro', 0, 0, -41],
    ['olho', 0, 8, -68],
    ['sombra', 2, 9.5, -91],
    ['tentaculo', -4.5, 11.2, -100], ['cavaleiro', 4, 11.2, -103], ['tentaculo', 4.5, 11.2, -114], ['olho', -4, 13.2, -108], ['espinhoso', -8.8, 11.2, -113], ['cavaleiro', -2, 11.2, -118], ['sombra', 8.5, 11.8, -118],
  ].map(([tipo, x, y, z]) => ({ tipo, x, y, z }));

  // ---------- Itens ----------
  const cristais = [
    [0, 0, 0], [3, 0, -5], [-3, 0, -11], [0, 0, -16.2],
    [0, 0, -22], [-8.5, 0, -24], [8.5, 0, -30], [0, 0, -36], [-8.5, 0, -42],
    [0, 2, -47.4], [0, 4, -50.8],
    [0, 6, -57], [0, 6, -62.8], [0, 6, -68.2], [0, 6, -74],
    [0, 6.8, -80.2], [0, 8, -84.9], [1.5, 8.2, -89.6], [0.5, 10.4, -94.1],
    [0, 11.2, -99], [9, 11.2, -104], [0, 11.2, -108], [-9, 11.2, -110], [0, 11.2, -116],
    [-2, 12.2, -124], [1, 13.2, -127.2],
    [-7, 14, -138], [7, 14, -138],
  ];
  const estrelas = [
    [10, 0, -43.5],      // canto do Salão das Armaduras
    [8.2, 13, -94.5],    // torre secreta (trampolim)
    [10, 11.2, -120.5],  // canto do Salão dos Tentáculos
  ];
  const coracoes = [[8.8, 0, -20], [0, 6, -76], [-9.5, 11.2, -104], [9, 11.2, -98], [9, 14, -133], [-9, 14, -133], [9, 14, -150]];
  const antivirus = [[-8.5, 0, -30], [0, 11.2, -104], [8.8, 11.2, -109], [-9, 14, -150], [0, 14, -132], [10, 14, -142]];
  const itens = [
    ...cristais.map(([x, y, z]) => ({ tipo: 'cristal', x, y, z })),
    ...estrelas.map(([x, y, z]) => ({ tipo: 'estrela', x, y, z })),
    ...coracoes.map(([x, y, z]) => ({ tipo: 'coracao', x, y, z })),
    ...antivirus.map(([x, y, z]) => ({ tipo: 'antivirus', x, y, z })),
  ];

  const checkpoints = [[2.8, 0, -18.5], [2.5, 6, -57], [2.5, 11.2, -98], [2.5, 11.2, -119], [0, 14, -131.5]].map(([x, y, z]) => new THREE.Vector3(x, y, z));

  const avisos = [
    { x: 0, y: 0, z: 3, raio: 2.5, texto: 'O Castelo do Rei do Pesadelo! É agora: salve o universo!' },
    { x: 0, y: 0, z: -19, raio: 3, texto: 'Salão das Armaduras: espere a espada bater e ataque!' },
    { x: 0, y: 6, z: -56.5, raio: 2.5, texto: 'Pêndulos! Passe quando a bola estiver do outro lado!' },
    { x: 0, y: 6, z: -76, raio: 2.5, texto: 'Torres Flutuantes: não olhe para baixo!' },
    { x: 0, y: 11.2, z: -98, raio: 3, texto: 'A infecção é forte aqui. Pegue os antivírus!' },
    { x: 0, y: 14, z: -131.5, raio: 3, texto: 'A Sala do Trono... o Rei do Pesadelo espera por você!' },
  ];

  return {
    id: 'castelo',
    nome: 'Castelo do Pesadelo',
    caixas: f.caixas,
    trampolins: f.trampolins,
    correntes: f.correntes,
    infeccao: true,
    longe: 105,
    inimigos, itens, checkpoints, avisos,
    portal: new THREE.Vector3(0, 14, -149.5),
    arena,
    barreira,
    pontoInicial: new THREE.Vector3(0, 0, 6),
    criarChefao: (cenaFase, particulas, fase) =>
      new ReiPesadelo(cenaFase, fase.arena, particulas, { barreira: fase.barreira, caixas: fase.caixas }),
    musicaChefao: 'chefaoRei',
    atualizar: (dt, corpos, foco) => f.atualizar(dt, corpos, foco),
    perigos: (dt, jogador) => f.atualizarPerigos(dt, jogador),
    musicaEm: () => 'castelo',
  };
}
