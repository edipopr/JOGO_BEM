// Fase 2 do jogo: Floresta à Noite.
// Caminho (sentido -Z): Clareira Enluarada → Pedras flutuantes → Bosque dos Vagalumes → Cogumelo-elevador
// → Planalto dos Cristais → Lago Escuro (plataformas móveis) → Bosque Sombrio → Subida → Arena de Cristal (y 12).
// Chefão: Monstro de Cristal (src/chefoes/cristal.js).
import * as THREE from 'three';
import { ConstrutorFase } from './construtor.js';
import { MonstroCristal } from '../chefoes/cristal.js';

export function criarFlorestaNoite(cena) {
  const f = new ConstrutorFase(cena, 21);
  f.luzes({
    ceu: 0x0b1238, nevoa: [28, 95],
    hemi: [0x6f86d8, 0x1c2a3a, 0.75],
    sol: [0xa9b8ff, 0.9],                       // luar
    lanterna: { cor: 0xffd9a0, intensidade: 30, distancia: 16 },
  });
  f.lua(-40, 60, -120, 7);
  const GRAMA = 0x2f6b4a, GRAMA_ESCURA = 0x24503d, TERRA = 0x4a3326;
  const corCogumelo = () => [0x5af0ff, 0xff6bd0, 0x9dff6b][Math.floor(f.sorte() * 3)];

  // ---------- A. Clareira Enluarada (início) ----------
  f.ilha(0, 0, 0, 24, 24, { grama: GRAMA, terra: TERRA });
  f.arvoresEm(-11, 11, -11, 11, 0, 12, (x, z) =>
    Math.hypot(x, z) < 6 || (Math.abs(x) < 4 && z < 0) || Math.hypot(x + 9.5, z - 9.5) < 2, { escura: true });
  for (let i = 0; i < 10; i++) f.cogumeloBrilhante((f.sorte() - 0.5) * 20, (f.sorte() - 0.5) * 20, 0, corCogumelo());
  f.vagalumes(-11, 11, -11, 11, 0, 30);

  // ---------- B. Pedras flutuantes ----------
  for (const [x, z] of [[0, -16], [2, -21.5], [-1, -27], [1.5, -32.5]]) {
    f.ilha(x, z, 0, 4, 4, { alt: 3, grama: GRAMA, terra: TERRA });
    f.cogumeloBrilhante(x + 1.3, z + 1.2, 0, corCogumelo(), 0.7);
  }

  // ---------- C. Bosque dos Vagalumes ----------
  f.ilha(0, -48, 0, 18, 22, { grama: GRAMA, terra: TERRA });
  f.arvoresEm(-8.5, 8.5, -58.5, -37.5, 0, 12, (x, z) => Math.abs(x) < 3 || (z < -55 && Math.abs(x) < 4), { escura: true });
  for (let i = 0; i < 8; i++) f.cogumeloBrilhante((f.sorte() - 0.5) * 16, -48 + (f.sorte() - 0.5) * 20, 0, corCogumelo(), 1.3);
  f.vagalumes(-9, 9, -59, -37, 0, 50);
  // cogumelo-elevador: sobe e desce entre o bosque (y 0) e o planalto (y 8)
  f.plataformaMovel(0, -62, 4, 3.2, 3.2, 0x5af0ff, { eixo: 'y', amplitude: 4, velocidade: 0.9, fase: -Math.PI / 2 });

  // ---------- D. Planalto dos Cristais (y 8) ----------
  f.ilha(0, -75, 8, 16, 20, { alt: 12, grama: GRAMA, terra: TERRA });
  f.arvoresEm(-7.5, 7.5, -84.5, -66, 8, 5, (x, z) => Math.abs(x) < 3.5 || Math.hypot(x + 6, z + 72) < 4.5, { escura: true });
  for (const [x, z] of [[6, -68], [-6.5, -82], [6.5, -83], [4, -77]]) f.cristais(x, z, 8, 1.1);
  f.trampolim(-6, -70, 8, 0x9f6bff);              // trampolim secreto...
  f.bloco(-6, -75, 14, 3, 3, 0.6, 0xc8d4ff);         // ...leva a uma nuvem com estrela
  f.vagalumes(-7, 7, -84, -66, 8, 25);

  // ---------- E. Lago Escuro (plataformas sobre o vazio) ----------
  f.plataformaMovel(0, -88, 8, 3.2, 3.2, 0xff6bd0, { eixo: 'x', amplitude: 3.5, velocidade: 1.1 });
  f.plataformaMovel(0, -92, 8, 3.2, 3.2, 0x5af0ff, { eixo: 'x', amplitude: 3.5, velocidade: 1.1, fase: Math.PI });
  f.plataformaMovel(0, -101, 8, 3.2, 3.2, 0x9dff6b, { eixo: 'z', amplitude: 5, velocidade: 0.8 });

  // ---------- F. Bosque Sombrio (contaminado) ----------
  f.ilha(0, -120, 8, 18, 22, { alt: 12, grama: GRAMA_ESCURA, terra: TERRA });
  f.arvoresEm(-8.5, 8.5, -130.5, -110, 8, 12, (x, z) => Math.abs(x) < 2.5 || (z < -126 && x > -5 && x < 4) || Math.hypot(x - 7.5, z + 129.5) < 1.5,
    { escura: true });
  f.arvore(-6.5, -114, 8, { infectada: true });
  f.arvore(6.5, -121, 8, { infectada: true });
  for (const [x, z] of [[-7, -125], [7, -116]]) f.cristais(x, z, 8, 0.9, 0x6a3fd0);
  f.vagalumes(-8, 8, -130, -110, 8, 20);

  // ---------- G. Subida até a arena ----------
  f.bloco(-2, -133.2, 9.2, 2.6, 2.6, 1.2, 0x6b6f8a);
  f.bloco(1, -136.2, 10.4, 2.6, 2.6, 0.8, 0x6b6f8a);
  f.bloco(-1, -139.2, 11.6, 2.6, 2.6, 0.8, 0x5a5d78);

  // ---------- H. Arena de Cristal (chefão; o portal só abre quando ele é purificado) ----------
  const ARENA = new THREE.Vector3(0, 12, -153);
  f.ilha(0, -153, 12, 24, 24, { alt: 14, grama: 0x3a4a7a, terra: 0x2a2440 });
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    f.cristais(Math.sin(a) * 10.3, -153 + Math.cos(a) * 10.3, 12, 1.6, i % 2 ? 0x9f6bff : 0x5af0ff);
  }
  const corMureta = 0x4a4e6a;
  f.bloco(0, -164.7, 13.2, 24, 0.6, 1.2, corMureta);
  f.bloco(-11.7, -153, 13.2, 0.6, 24, 1.2, corMureta);
  f.bloco(11.7, -153, 13.2, 0.6, 24, 1.2, corMureta);
  f.bloco(-8, -141.3, 13.2, 8, 0.6, 1.2, corMureta);   // entrada livre de x -4 a 2
  f.bloco(7, -141.3, 13.2, 10, 0.6, 1.2, corMureta);
  // Cristais que fecham a entrada durante a luta
  const paredeCristal = new THREE.Group();
  const matParede = new THREE.MeshLambertMaterial({ color: 0x9f6bff, emissive: 0x4a1a9a, flatShading: true, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 7; i++) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.6 + (i % 2) * 0.6, 5), matParede);
    c.position.set(-3.6 + i * 0.95, 1.3, 0);
    c.rotation.z = (i % 2 ? 0.12 : -0.12);
    paredeCristal.add(c);
  }
  paredeCristal.position.set(0, 12, -141.3);
  paredeCristal.visible = false;
  cena.add(paredeCristal);
  const barreira = {
    malha: paredeCristal,
    caixa: new THREE.Box3(new THREE.Vector3(-4, 12, -141.7), new THREE.Vector3(2, 15, -140.9)),
  };

  // ---------- Inimigos ----------
  const inimigos = [
    ['saltitante', 5, 0, -6],
    ['gosma', -5, 0, -43], ['saltitante', 4, 0, -46], ['gosma', 5, 0, -53], ['cuspidor', -6, 0, -55],
    ['cuspidor', 5, 8, -72], ['saltitante', -3, 8, -78], ['gosma', 3, 8, -81],
    ['gosma', -5, 8, -114], ['gosma', 5, 8, -122], ['saltitante', 0, 8, -118], ['cuspidor', -6, 8, -128], ['saltitante', 6, 8, -112],
  ].map(([tipo, x, y, z]) => ({ tipo, x, y, z }));

  // ---------- Itens ----------
  const cristais = [
    [0, 0, -4], [3, 0, -8], [-3, 0, -8], [7, 0, 5], [-7, 0, 3],
    [0, 0, -16], [2, 0, -21.5], [-1, 0, -27], [1.5, 0, -32.5],
    [0, 0, -40], [-3, 0, -47], [3, 0, -51], [0, 0, -56],
    [0, 5, -62],
    [0, 8, -68], [5, 8, -74], [-3, 8, -80],
    [0, 8.6, -88], [0, 8.6, -92], [0, 8.6, -101],
    [0, 8, -112], [-4, 8, -118], [4, 8, -124],
    [-2, 9.2, -133.2], [1, 10.4, -136.2],
    [-6, 12, -150], [6, 12, -150],
  ];
  const estrelas = [
    [-9.5, 0, 9.5],    // atrás das árvores da clareira
    [-6, 14, -75],     // na nuvem do trampolim secreto do planalto
    [7.5, 8, -129.5],  // no canto mais escuro do Bosque Sombrio
  ];
  const coracoes = [[-1, 0, -27], [0, 8, -108], [6, 12, -146], [-7, 12, -158]];
  const itens = [
    ...cristais.map(([x, y, z]) => ({ tipo: 'cristal', x, y, z })),
    ...estrelas.map(([x, y, z]) => ({ tipo: 'estrela', x, y, z })),
    ...coracoes.map(([x, y, z]) => ({ tipo: 'coracao', x, y, z })),
  ];

  const checkpoints = [[3, 0, -40], [2.5, 8, -67], [-3, 8, -111], [0.5, 12, -144]].map(([x, y, z]) => new THREE.Vector3(x, y, z));

  const avisos = [
    { x: 0, y: 0, z: -1, raio: 2.5, texto: 'Floresta à Noite! Siga os vagalumes e os cogumelos brilhantes.' },
    { x: 0, y: 0, z: -12, raio: 3, texto: 'Pule de pedra em pedra!' },
    { x: 0, y: 0, z: -57, raio: 3, texto: 'Suba no cogumelo-elevador e espere ele subir!' },
    { x: 0, y: 8, z: -84, raio: 3.5, texto: 'Lago Escuro: espere a plataforma chegar perto!' },
    { x: 0, y: 8, z: -110, raio: 3.5, texto: 'O Bosque Sombrio está contaminado... cuidado!' },
    { x: 0, y: 12, z: -143, raio: 4, texto: 'Arena de Cristal... algo enorme brilha no centro!' },
  ];

  return {
    id: 'noite',
    nome: 'Floresta à Noite',
    caixas: f.caixas,
    trampolins: f.trampolins,
    inimigos, itens, checkpoints, avisos,
    portal: new THREE.Vector3(0, 12, -160),
    arena: ARENA,
    barreira,
    pontoInicial: new THREE.Vector3(0, 0, 3),
    criarChefao: (cenaFase, particulas, fase) =>
      new MonstroCristal(cenaFase, fase.arena, particulas, { barreira: fase.barreira, caixas: fase.caixas }),
    musicaChefao: 'chefaoCristal',
    atualizar: (dt, corpos, foco) => f.atualizar(dt, corpos, foco),
    /** Música: noturna; mais tensa no Bosque Sombrio. */
    musicaEm: (p) => (p.z < -108 && p.z > -141 ? 'bosque' : 'noite'),
  };
}
