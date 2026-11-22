// Fase 3 do jogo: Mar do Pesadelo (tudo debaixo d'água escura; o castelo do Rei do Pesadelo aparece ao fundo).
// Caminho (sentido -Z): Praia Submersa → Corais → Floresta de Algas (y 2) → Coluna de bolhas → Navio Naufragado (y 10)
// → Abismo (tartarugas-pedra móveis) → Ruínas do Castelo (y 10) → Subida → Picadeiro Afundado (y 13).
// Chefão: Ioro (src/chefoes/ioro.js). Na água: gravidade menor e braçadas (pulo no meio da água).
import * as THREE from 'three';
import { ConstrutorFase } from './construtor.js';
import { Ioro } from '../chefoes/ioro.js';

export function criarMarPesadelo(cena) {
  const f = new ConstrutorFase(cena, 33);
  f.luzes({
    ceu: 0x052a3a, nevoa: [10, 72],
    hemi: [0x5fb8d0, 0x0a2a30, 0.85],
    sol: [0x8fd8ff, 0.8],
    lanterna: { cor: 0xbff4ff, intensidade: 22, distancia: 18 },
  });
  const AREIA = 0x5f7f78, AREIA_ESCURA = 0x3f5a60, ROCHA = 0x2a3f4a;
  const ilha = (x, z, topo, larg, prof, o = {}) => f.ilha(x, z, topo, larg, prof, { grama: AREIA, terra: ROCHA, alt: 6, ...o });
  f.casteloAoLonge(0, -60, -275, 2.6, 0x021018, 0xff3bd0);
  f.bolhas(-24, 24, -185, 14, -10, 26, 260);
  // Raios de luz vindo da superfície
  const matRaio = new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide });
  for (const [x, z] of [[-6, -4], [7, 3], [3, -45], [-7, -52], [5, -78], [-6, -128], [6, -166]]) {
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 3, 34, 8, 1, true), matRaio);
    r.position.set(x, 15, z);
    r.rotation.z = 0.25;
    cena.add(r);
  }
  const algas = (minX, maxX, minZ, maxZ, chao, n, evitar) => {
    for (let i = 0, t = 0; i < n && t < n * 20; t++) {
      const x = minX + f.sorte() * (maxX - minX), z = minZ + f.sorte() * (maxZ - minZ);
      if (evitar(x, z)) continue;
      f.alga(x, z, chao, 2.4 + f.sorte() * 3, f.sorte() > 0.5 ? 0x1f8f5a : 0x2a6f7a);
      i++;
    }
  };

  // ---------- A. Praia Submersa (início) ----------
  ilha(0, 0, 0, 24, 24);
  algas(-11, 11, -11, 11, 0, 9, (x, z) => Math.hypot(x, z) < 6 || (Math.abs(x) < 4 && z < 0));
  for (const [x, z] of [[-8, 6], [8, 7], [-9, -6], [7, -8]]) f.coral(x, z, 0, 1.4);
  for (const [x, z, t] of [[9.5, 0, 1.2], [-10, 1, 1], [5, 10, 0.8]]) f.pedra(x, z, 0, t);

  // ---------- B. Corais (aprender a nadar) ----------
  for (const [x, z, y] of [[0, -18.5, 1], [2.5, -27, 2]]) {
    ilha(x, z, y, 5, 5, { alt: 4 });
    f.coral(x + 1.7, z + 1.5, y, 1);
    f.coral(x - 1.7, z - 1.2, y, 0.8);
  }

  // ---------- C. Floresta de Algas (y 2) ----------
  ilha(0, -46, 2, 20, 24);
  algas(-9, 9, -57, -35, 2, 18, (x, z) => Math.abs(x) < 2.5 || (z < -54 && Math.abs(x) < 4) || Math.hypot(x - 8.5, z + 56) < 2);
  for (const [x, z] of [[-6, -38], [6, -44], [-7, -51]]) f.pedra(x, z, 2, 1.1);
  f.corrente(0, -62.3, -6, 12.2, 2.7, 7);          // coluna de bolhas até o navio

  // ---------- D. Navio Naufragado (y 10) ----------
  ilha(0, -77, 10, 20, 24, { alt: 14, grama: AREIA_ESCURA });
  const MADEIRA = 0x5a4232, MADEIRA2 = 0x453226;
  f.bloco(-7, -78, 12.6, 0.6, 14, 2.6, MADEIRA);   // casco aberto (entre por trás)
  f.bloco(-3, -78, 11.6, 0.6, 14, 1.6, MADEIRA2);
  f.bloco(-5, -85.2, 12.6, 4.6, 0.6, 2.6, MADEIRA);
  f.bloco(-5, -80, 12.9, 4.6, 5, 0.3, MADEIRA2);   // convés
  f.bloco(-5, -76, 18, 0.5, 0.5, 5.2, MADEIRA);    // mastro
  f.malha(new THREE.BoxGeometry(4, 0.3, 0.3), MADEIRA, -5, 16.4, -76);
  const vela = f.malha(new THREE.PlaneGeometry(3.4, 2.4), 0x8a9aa0, -5, 15, -75.9);
  vela.material = new THREE.MeshLambertMaterial({ color: 0x6a7f88, side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  for (const [x, z] of [[6, -68], [7, -84], [8, -75]]) f.coral(x, z, 10, 1.2);
  f.pedra(4, -86, 10, 1.1);
  f.bloco(6, -80, 10.9, 1.1, 0.9, 0.9, 0x8a5a2a);  // baú
  f.malha(new THREE.BoxGeometry(1.16, 0.3, 0.96), 0xffd84a, 6, 10.8, -80);

  // ---------- E. Abismo (plataformas móveis) ----------
  const tartaruga = (x, z, o) => f.plataformaMovel(x, z, 10, 3.8, 3.8, 0x3f8f6a, o);
  tartaruga(0, -95, { eixo: 'x', amplitude: 4, velocidade: 0.9 });
  tartaruga(0, -103, { eixo: 'x', amplitude: 4, velocidade: 0.9, fase: Math.PI });
  tartaruga(0, -111, { eixo: 'y', amplitude: 2, velocidade: 0.8 });

  // ---------- F. Ruínas do Castelo (y 10) ----------
  ilha(0, -130, 10, 22, 26, { alt: 14, grama: 0x3a4658, terra: 0x1f2a38 });
  const PEDRA = 0x5f6b86;
  for (const [x, z, alt] of [[-5, -121, 4.5], [5, -121, 3], [-5, -129, 2.2], [5, -129, 4.5], [-5, -137, 4.5], [5, -137, 3.4]]) f.coluna(x, z, 10, alt, PEDRA);
  f.bloco(-9, -133, 13, 0.8, 8, 3, PEDRA);
  f.bloco(9, -124, 12.4, 0.8, 6, 2.4, PEDRA);
  f.malha(new THREE.BoxGeometry(11, 0.9, 1.2), PEDRA, 0, 15, -121);            // arco do portão
  algas(-10, 10, -141, -119, 10, 8, (x) => Math.abs(x) < 7);
  for (const [x, z] of [[8, -139], [-8, -120]]) f.cristais(x, z, 10, 1, 0xff3bd0);

  // ---------- G. Subida até o picadeiro ----------
  f.bloco(-2, -146.5, 11.2, 3.4, 3.4, 1.4, 0x4a566e);
  f.bloco(2, -151.5, 12.4, 3.4, 3.4, 1.4, 0x4a566e);

  // ---------- H. Picadeiro Afundado (chefão Ioro) ----------
  const ARENA = new THREE.Vector3(0, 13, -170);
  ilha(0, -170, 13, 26, 26, { alt: 16, grama: 0x7a3f5a, terra: 0x2a1a30 });
  // anéis do picadeiro
  for (const [r, cor] of [[10.5, 0xffd84a], [6, 0xff4d4d], [2, 0xffd84a]]) {
    const anel = f.malha(new THREE.RingGeometry(r - 0.35, r, 40), cor, 0, 13.03, -170, false);
    anel.rotation.x = -Math.PI / 2;
  }
  // mastros listrados, bandeirinhas e bolas de circo
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const x = Math.sin(a) * 11.6, z = -170 + Math.cos(a) * 11.6;
    for (let j = 0; j < 5; j++) f.malha(new THREE.CylinderGeometry(0.3, 0.3, 1.1, 7), j % 2 ? 0xe8e0e0 : 0xff4d4d, x, 13.55 + j * 1.1, z);
    f.malha(new THREE.SphereGeometry(0.5, 8, 6), [0xffd84a, 0x5ad1ff, 0xff6bd0, 0x9dff6b][i % 4], x, 19, z);
  }
  for (const [x, z, r, cor] of [[10.8, -160, 0.8, 0x5ad1ff], [-10.9, -161, 0.7, 0xffd84a], [-11, -180, 0.9, 0xff6bd0]]) f.malha(new THREE.SphereGeometry(r, 9, 7), cor, x, 13 + r, z);
  const MURETA = 0x8a4a6a;
  f.bloco(0, -182.7, 14.2, 26, 0.6, 1.2, MURETA);
  f.bloco(-12.7, -170, 14.2, 0.6, 26, 1.2, MURETA);
  f.bloco(12.7, -170, 14.2, 0.6, 26, 1.2, MURETA);
  f.bloco(-8, -157.3, 14.2, 10, 0.6, 1.2, MURETA);   // entrada livre de x -3 a 3
  f.bloco(8, -157.3, 14.2, 10, 0.6, 1.2, MURETA);
  // paredes invisíveis: nadando não dá para sair da arena
  f.parede(0, -183.2, 13, 40, 28, 0.6);
  f.parede(-13.2, -170, 13, 40, 0.6, 26);
  f.parede(13.2, -170, 13, 40, 0.6, 26);
  f.parede(-8.2, -157, 13, 40, 10.4, 0.6);
  f.parede(8.2, -157, 13, 40, 10.4, 0.6);
  // Cortina de tentáculos-balão que fecha a entrada
  const cortina = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const cor = i % 2 ? 0xff4d4d : 0xffd84a;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.46, 2.4, 7), new THREE.MeshLambertMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.25, flatShading: true, transparent: true, opacity: 0.6 }));
    t.position.set(-2.85 + i * 0.95, 1.2, 0);
    cortina.add(t);
  }
  cortina.position.set(0, 13, -157.3);
  cortina.visible = false;
  cena.add(cortina);
  const barreira = {
    malha: cortina,
    caixa: new THREE.Box3(new THREE.Vector3(-3.2, 13, -157.7), new THREE.Vector3(3.2, 40, -156.9)),
  };

  // ---------- Inimigos ----------
  const inimigos = [
    ['peixe', 5, 1.2, -6],
    ['aguaviva', 2.5, 3.5, -27],
    ['caranguejo', 4, 2, -41], ['peixe', -5, 3.4, -44], ['aguaviva', 5, 4, -50], ['baiacu', -4, 3.2, -54],
    ['caranguejo', 4, 10, -72], ['peixe', -1, 11.5, -78], ['baiacu', 6, 11.4, -85], ['aguaviva', 2, 12, -82],
    ['aguaviva', 0, 12, -99], ['peixe', 2, 12, -107],
    ['caranguejo', -3, 10, -124], ['caranguejo', 4, 10, -133], ['peixe', 7, 12, -128], ['baiacu', 0, 12, -138], ['aguaviva', -7, 12.5, -127],
  ].map(([tipo, x, y, z]) => ({ tipo, x, y, z }));

  // ---------- Itens ----------
  const cristais = [
    [0, 0, -4], [4, 0, 4], [-5, 0, -8], [0, 2.4, -14.5],
    [0, 1, -18.5], [1.2, 4, -22.8], [2.5, 2, -27], [1, 4.4, -31],
    [0, 2, -38], [-5, 2, -42], [4, 2, -47], [0, 2, -53],
    [0, 4, -62.3], [0, 8, -62.3],
    [3, 10, -69], [-5, 12.9, -80], [7, 10, -77], [0, 10, -86],
    [0, 10.6, -95], [0, 10.6, -103], [0, 11.6, -111],
    [0, 10, -121], [-3, 10, -128], [3, 10, -135],
    [-2, 11.2, -146.5], [2, 12.4, -151.5],
    [-7, 13, -165], [7, 13, -165],
  ];
  const estrelas = [
    [8.5, 2, -56],     // atrás das algas
    [-5, 10, -81],     // dentro do casco do navio
    [0, 15.6, -121],   // em cima do arco do portão
  ];
  f.parede(0, -121, 14.6, 15.45, 11, 1.2);          // o arco é sólido (dá para subir nadando)
  const coracoes = [[2.5, 2, -25.6], [4, 10, -87], [-8, 10, -139], [8, 13, -160], [-8, 13, -178]];
  const itens = [
    ...cristais.map(([x, y, z]) => ({ tipo: 'cristal', x, y, z })),
    ...estrelas.map(([x, y, z]) => ({ tipo: 'estrela', x, y, z })),
    ...coracoes.map(([x, y, z]) => ({ tipo: 'coracao', x, y, z })),
  ];

  const checkpoints = [[2.5, 2, -36], [3.5, 10, -67], [2, 10, -119], [0, 13, -160]].map(([x, y, z]) => new THREE.Vector3(x, y, z));

  const avisos = [
    { x: 0, y: 0, z: 2, raio: 2.5, texto: 'Mar do Pesadelo! Na água você cai devagar. Veja: o castelo do Rei está lá no fundo...' },
    { x: 0, y: 0, z: -9, raio: 3, texto: 'Aperte PULAR de novo no meio da água para nadar (até 3 braçadas)!' },
    { x: 0, y: 2, z: -36, raio: 3, texto: 'Cuidado com os monstros de água: cada um ataca de um jeito!' },
    { x: 0, y: 2, z: -56, raio: 3, texto: 'Entre na coluna de bolhas: ela leva você para cima!' },
    { x: 0, y: 10, z: -87, raio: 3.5, texto: 'O Abismo: nade de pedra em pedra!' },
    { x: 0, y: 10, z: -118.5, raio: 3.5, texto: 'Ruínas do castelo... o Rei do Pesadelo está perto!' },
    { x: 0, y: 13, z: -159.5, raio: 3, texto: 'Um picadeiro afundado? Você ouve uma risada...' },
  ];

  return {
    id: 'mar',
    nome: 'Mar do Pesadelo',
    caixas: f.caixas,
    trampolins: f.trampolins,
    correntes: f.correntes,
    agua: { gravidade: 0.42, quedaMax: -6, bracadas: 3 },
    limiteQueda: -14,
    longe: 95,
    inimigos, itens, checkpoints, avisos,
    portal: new THREE.Vector3(0, 13, -179),
    arena: ARENA,
    barreira,
    pontoInicial: new THREE.Vector3(0, 0, 5),
    criarChefao: (cenaFase, particulas, fase) =>
      new Ioro(cenaFase, fase.arena, particulas, { barreira: fase.barreira, caixas: fase.caixas }),
    musicaChefao: 'chefaoIoro',
    atualizar: (dt, corpos, foco) => {
      f.atualizar(dt, corpos, foco);
      f.janelasCastelo.color.setHSL(0.86, 1, 0.5 + Math.sin(f.tempo * 2) * 0.12);
    },
    musicaEm: (p) => (p.z < -90 && p.z > -157 ? 'abismo' : 'mar'),
  };
}
