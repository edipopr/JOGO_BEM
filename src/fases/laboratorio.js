// Fase 4 do jogo: Laboratório Perdido (debaixo do castelo: fábrica abandonada de experimentos).
// Caminho (sentido -Z): Entrada → Corredor dos Lasers → Esteiras → Sala dos Tubos → Ventilador (sobe a y 8)
// → Depósito → Plataformas sobre o ácido → Linha de Montagem → Subida → Câmara do Experimento (y 12).
// Chefão: Experimento Caixa 2 (src/chefoes/caixa2.js).
import * as THREE from 'three';
import { ConstrutorFase } from './construtor.js';
import { ExperimentoCaixa2 } from '../chefoes/caixa2.js';

export function criarLaboratorio(cena) {
  const f = new ConstrutorFase(cena, 47);
  f.luzes({
    ceu: 0x16242c, nevoa: [20, 85],
    hemi: [0xbfe0e8, 0x24303a, 0.9],
    sol: [0xe6fff6, 0.9],
    lanterna: { cor: 0xdffcff, intensidade: 12, distancia: 14 },
  });
  const PISO = 0x6f828c, PISO2 = 0x5a6b74, METAL = 0x34424c;
  const sala = (x, z, topo, larg, prof, o = {}) => f.ilha(x, z, topo, larg, prof, { grama: PISO, terra: METAL, alt: 5, ...o });

  // ---------- A. Entrada ----------
  sala(0, 0, 0, 22, 22);
  f.faixaPerigo(0, -10.6, 0, 22);
  for (const [x, z] of [[-9, -6], [9, -6], [-9, 2], [9, 2]]) f.tubo(x, z, 0);
  for (const [x, z] of [[-9.5, 8], [9.5, 8], [-8, 9.6]]) f.caixote(x, z, 0);
  f.computador(5.5, 9.8, 0, Math.PI);
  f.computador(-4, 9.8, 0, Math.PI);

  // ---------- B. Corredor dos Lasers ----------
  sala(0, -25.5, 0, 10, 24);
  for (const z of [-18, -24, -30]) f.laser(0, z, 0, 9.4, { ligado: 1.5, desligado: 1.5, fase: z / 6 });
  for (const s of [-1, 1]) {
    f.bloco(s * 4.9, -25.5, 1.4, 0.3, 24, 1.4, PISO2);
    for (const z of [-18, -24, -30]) f.bloco(s * 4.6, z, 1.5, 0.5, 0.8, 1.5, 0xff8a1f);
  }

  // ---------- C. Esteiras rolantes ----------
  f.esteira(0, -44.2, 0, 4.4, 11, { vz: 1.8 });       // puxa para trás
  sala(0, -52.7, 0, 5, 4.6, { alt: 3 });
  f.esteira(-2.2, -60, 0, 4, 9, { vz: -2.4 });         // leva para a frente
  f.esteira(3, -60, 0, 4, 9, { vx: 1.6 });             // joga para o lado (cuidado!)

  // ---------- D. Sala dos Tubos ----------
  sala(0, -77, 0, 22, 24);
  for (const [x, z] of [[-9, -68], [9, -68], [-9, -75], [9, -75], [-9, -82], [9, -82]]) f.tubo(x, z, 0);
  for (const [x, z] of [[-5, -72], [5.5, -79], [-9.8, -87.5]]) f.caixote(x, z, 0);
  f.computador(0, -66.5, 0, 0);
  f.corrente(0, -91.2, -6, 10.4, 2.1, 14);             // ventilador gigante
  f.malha(new THREE.CylinderGeometry(2.1, 2.1, 0.4, 16), METAL, 0, -2.2, -91.2);

  // ---------- E. Depósito (y 8) ----------
  sala(0, -102.5, 8, 18, 18, { alt: 12 });
  for (const [x, z, n] of [[-6.5, -97, 2], [-7.8, -98.4, 1], [6.8, -108, 2], [7.8, -106.4, 1], [-7.5, -109, 1]]) for (let i = 0; i < n; i++) f.caixote(x, z, 8 + i * 1.1);
  f.trampolim(6.5, -97.5, 8, 0x5af0ff);
  f.bloco(6.5, -103, 13.6, 3, 3, 0.5, 0xffd84a);       // plataforma alta secreta

  // ---------- F. Plataformas sobre o ácido ----------
  const acido = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ color: 0x7dff3a, transparent: true, opacity: 0.75 }));
  acido.rotation.x = -Math.PI / 2;
  acido.position.set(0, -6, -121);
  cena.add(acido);
  f.bolhas(-12, 12, -133, -112, -6, -2, 40, 0xd6ff9d);
  f.plataformaMovel(0, -114.5, 8, 3.4, 3.4, 0xff8a1f, { eixo: 'x', amplitude: 3, velocidade: 1.1 });
  f.plataformaMovel(0, -119, 8, 3.4, 3.4, 0xff8a1f, { eixo: 'x', amplitude: 3, velocidade: 1.1, fase: Math.PI });
  f.plataformaMovel(0, -124, 8, 3.4, 3.4, 0xff8a1f, { eixo: 'z', amplitude: 1.9, velocidade: 1 });

  // ---------- G. Linha de Montagem ----------
  sala(0, -140, 8, 20, 22, { alt: 12 });
  f.laser(0, -135, 8, 12, { ligado: 1.3, desligado: 1.6 });
  f.laser(0, -145, 8, 12, { ligado: 1.3, desligado: 1.6, fase: 1.4 });
  for (const s of [-1, 1]) for (const z of [-135, -145]) f.bloco(s * 6.2, z, 9.5, 0.6, 0.8, 1.5, 0xff8a1f);
  for (const s of [-1, 1]) for (const z of [-135, -145]) f.bloco(s * 8.2, z, 10.5, 3.4, 0.5, 2.5, PISO2);
  for (const [x, z] of [[-8.5, -140], [8.5, -140]]) f.tubo(x, z, 8, 0xff3bd0);
  for (const [x, z] of [[-8.8, -149], [8.6, -131]]) f.caixote(x, z, 8);

  // ---------- H. Subida ----------
  f.bloco(-2, -153.4, 9.2, 3, 3, 1.2, 0xff8a1f);
  f.bloco(1.2, -156.6, 10.4, 3, 3, 0.8, PISO2);
  f.bloco(-1, -159.8, 11.6, 3, 3, 0.8, 0xff8a1f);

  // ---------- I. Câmara do Experimento ----------
  const { arena, barreira } = f.arenaChefao(0, -174, 12, 24, {
    piso: 0x4a5a64, terra: 0x232d34, corMureta: 0x3a4852,
    criarParte: (i) => new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 6), new THREE.MeshBasicMaterial({ color: 0xff3b5c, transparent: true, opacity: 0.8 })),
  });
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    f.tubo(Math.sin(a) * 10.6, -174 + Math.cos(a) * 10.6, 12, i % 2 ? 0xff3bd0 : 0x7dff3a);
  }
  for (const r of [9, 4]) f.malha(new THREE.RingGeometry(r - 0.25, r, 40), 0xffd84a, 0, 12.03, -174, false).rotation.x = -Math.PI / 2;

  // ---------- Inimigos ----------
  const inimigos = [
    ['caixinha', 6, 0, -4], ['drone', -5, 1.6, -5],
    ['drone', 0, 1.8, -34],
    ['robo', -4, 0, -71], ['caixinha', 4, 0, -74], ['drone', 5, 1.8, -80], ['caixinha', -6, 0, -83], ['robo', 5, 0, -86],
    ['caixinha', -3, 8, -99], ['drone', 3, 9.8, -104], ['robo', 0, 8, -107], ['caixinha', -6, 8, -105],
    ['drone', 0, 9.8, -119],
    ['robo', -5, 8, -139], ['caixinha', 4, 8, -138], ['drone', 3, 9.8, -141], ['caixinha', -3, 8, -148], ['robo', 6, 8, -148],
  ].map(([tipo, x, y, z]) => ({ tipo, x, y, z }));

  // ---------- Itens ----------
  const cristais = [
    [0, 0, -4], [5, 0, 3], [-5, 0, 3],
    [0, 0, -15], [0, 0, -21], [0, 0, -27], [0, 0, -33],
    [0, 0, -41], [0, 0, -46], [0, 0, -52.7], [-2.2, 0, -59], [3, 0, -61],
    [0, 0, -70], [-6, 0, -78], [6, 0, -83], [0, 0, -87],
    [0, 4, -91.2], [0, 8.5, -91.2],
    [-4, 8, -97], [4, 8, -101], [0, 8, -110],
    [0, 8.6, -114.5], [0, 8.6, -119], [0, 8.6, -124],
    [0, 8, -132], [-4, 8, -143],
    [1.2, 10.4, -156.6],
    [-6, 12, -170], [6, 12, -170],
  ];
  const estrelas = [
    [-9.6, 0, 9.8],       // atrás dos caixotes da entrada
    [6.5, 13.6, -103],    // plataforma alta do depósito (trampolim)
    [9, 8, -148.5],       // canto atrás da linha de montagem
  ];
  const coracoes = [[0, 0, -54], [-8, 8, -103], [0, 8, -149.5], [8, 12, -166], [-8, 12, -181]];
  const itens = [
    ...cristais.map(([x, y, z]) => ({ tipo: 'cristal', x, y, z })),
    ...estrelas.map(([x, y, z]) => ({ tipo: 'estrela', x, y, z })),
    ...coracoes.map(([x, y, z]) => ({ tipo: 'coracao', x, y, z })),
  ];

  const checkpoints = [[3, 0, -36], [3, 0, -67.5], [3, 8, -95], [-3, 8, -131], [0, 12, -164]].map(([x, y, z]) => new THREE.Vector3(x, y, z));

  const avisos = [
    { x: 0, y: 0, z: 2, raio: 2.5, texto: 'Laboratório Perdido! Aqui o Rei do Pesadelo fazia seus experimentos...' },
    { x: 0, y: 0, z: -14.5, raio: 3, texto: 'Lasers! Espere desligar ou PULE por cima!' },
    { x: 0, y: 0, z: -37, raio: 3, texto: 'A esteira puxa você para trás: corra!' },
    { x: 0, y: 0, z: -52.7, raio: 3, texto: 'Escolha bem a esteira: a da esquerda leva para a frente!' },
    { x: 0, y: 0, z: -68, raio: 4, texto: 'Desconfie das caixas... algumas mordem!' },
    { x: 0, y: 0, z: -87.5, raio: 3, texto: 'Pule no ventilador para subir!' },
    { x: 0, y: 8, z: -110.5, raio: 3, texto: 'Não caia no ácido!' },
    { x: 0, y: 12, z: -163.5, raio: 3.5, texto: 'A câmara do Experimento 2... que barulho de mastigar é esse?' },
  ];

  return {
    id: 'laboratorio',
    nome: 'Laboratório Perdido',
    caixas: f.caixas,
    trampolins: f.trampolins,
    correntes: f.correntes,
    longe: 105,
    inimigos, itens, checkpoints, avisos,
    portal: new THREE.Vector3(0, 12, -182),
    arena,
    barreira,
    pontoInicial: new THREE.Vector3(0, 0, 4),
    criarChefao: (cenaFase, particulas, fase) =>
      new ExperimentoCaixa2(cenaFase, fase.arena, particulas, { barreira: fase.barreira, caixas: fase.caixas }),
    musicaChefao: 'chefaoCaixa',
    atualizar: (dt, corpos, foco) => f.atualizar(dt, corpos, foco),
    perigos: (dt, jogador) => f.atualizarPerigos(dt, jogador),
    musicaEm: () => 'laboratorio',
  };
}
