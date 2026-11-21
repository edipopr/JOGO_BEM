// Cenário de teste: chão, plataformas, escadas, árvores e cogumelos.
import * as THREE from 'three';

// Gerador aleatório com semente (cenário sempre igual)
function aleatorio(semente) {
  return () => {
    semente = (semente * 16807) % 2147483647;
    return (semente - 1) / 2147483646;
  };
}

export function criarFaseTeste(cena) {
  const caixas = [];
  const sorte = aleatorio(42);
  const mat = (cor) => new THREE.MeshLambertMaterial({ color: cor, flatShading: true });

  /** Caixa sólida. (x, z) = centro; topo = altura da face de cima. */
  function bloco(x, z, topo, larg, prof, alt, cor) {
    const malha = new THREE.Mesh(new THREE.BoxGeometry(larg, alt, prof), mat(cor));
    malha.position.set(x, topo - alt / 2, z);
    malha.castShadow = true;
    malha.receiveShadow = true;
    cena.add(malha);
    caixas.push(new THREE.Box3().setFromObject(malha));
    return malha;
  }

  // ----- Luz e céu -----
  cena.background = new THREE.Color(0x7ec8ff);
  cena.fog = new THREE.Fog(0x7ec8ff, 45, 110);
  cena.add(new THREE.HemisphereLight(0xffffff, 0x4a7a3a, 1.1));
  const sol = new THREE.DirectionalLight(0xfff2d6, 1.6);
  sol.position.set(20, 35, 15);
  sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024);
  Object.assign(sol.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 1, far: 100 });
  cena.add(sol);

  // ----- Chão (ilha) -----
  bloco(0, 0, 0, 60, 60, 2, 0x6fd14f);

  // ----- Escada até uma plataforma alta -----
  for (let i = 0; i < 5; i++) {
    bloco(-8, -18 - i * 1.6, 0.6 * (i + 1), 3, 1.6, 0.6 * (i + 1), 0xc9a36b);
  }
  bloco(-8, -28.5, 3, 6, 4, 3, 0xb08550); // mirante na borda da ilha

  // ----- Plataformas flutuantes sobre o vazio (o chão termina em z = -30) -----
  const cores = [0xff6b9d, 0xffd84a, 0x5ad1ff, 0xb07dff];
  const flutuantes = [[-3, -34, 3.5], [2, -38, 4.5], [7, -41, 5.5], [12, -38, 6.5]];
  flutuantes.forEach(([x, z, t], i) => bloco(x, z, t, 3, 3, 0.6, cores[i % cores.length]));
  bloco(17, -33, 6.5, 6, 6, 1, 0x8a6bd1); // plataforma de chegada

  // Ilhinha flutuante mais abaixo (onde fica o portal de saída)
  bloco(17, -42, 0, 10, 8, 2, 0x5ec24a);

  // ----- Obstáculos variados -----
  bloco(10, 6, 1, 4, 4, 1, 0xff8a1f);
  bloco(13, 9, 2, 3, 3, 2, 0xff6b9d);
  bloco(16, 12, 3, 3, 3, 3, 0x5ad1ff);
  bloco(-14, 10, 1.5, 8, 1, 1.5, 0x9b9b9b); // muro baixo

  // ----- Árvores -----
  const posicoesArvores = [];
  while (posicoesArvores.length < 18) {
    const x = (sorte() - 0.5) * 54, z = (sorte() - 0.5) * 54;
    if (Math.hypot(x, z) < 6) continue; // longe do ponto inicial
    if (x > -12 && x < -4 && z < -4) continue; // não bloquear a escada
    if (x > 7 && x < 19 && z > 3 && z < 15) continue;
    if (x < -20 && z > 20) continue; // canto da estrela escondida
    posicoesArvores.push([x, z]);
  }
  for (const [x, z] of posicoesArvores) {
    const altTronco = 1.6 + sorte() * 1.2;
    bloco(x, z, altTronco, 0.7, 0.7, altTronco, 0x8b5a2b);
    const copa = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.4 + sorte() * 0.6, 0),
      mat(sorte() > 0.5 ? 0x2fa84f : 0x3cc45a),
    );
    copa.position.set(x, altTronco + 1, z);
    copa.castShadow = true;
    cena.add(copa);
  }

  // ----- Cogumelos (decoração) -----
  for (let i = 0; i < 14; i++) {
    const x = (sorte() - 0.5) * 50, z = (sorte() - 0.5) * 50;
    if (Math.hypot(x, z) < 4) continue;
    const grupo = new THREE.Group();
    const caule = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 0.4, 6), mat(0xfff3d6));
    caule.position.y = 0.2;
    const chapeu = new THREE.Mesh(
      new THREE.SphereGeometry(0.35, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2),
      mat(sorte() > 0.5 ? 0xff3b3b : 0xb07dff),
    );
    chapeu.position.y = 0.38;
    grupo.add(caule, chapeu);
    grupo.position.set(x, 0, z);
    cena.add(grupo);
  }

  // ----- Onde nascem as criaturas contaminadas -----
  const inimigos = [
    [7, 0, -9], [-7, 0, 9], [12, 0, -20], [-16, 0, -4], [18, 0, 2],
    [-6.5, 3, -27.5], // no mirante
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));

  // ----- Itens (y = altura do chão onde o item flutua) -----
  const cristais = [
    [0, 0, -5], [4, 0, -4], [-4, 0, 4], [10, 1, 6], [13, 2, 9], [-14, 1.5, 10], [-10, 0, 10],
    [8, 0, -14], [15, 0, -8], [-20, 0, -15], [22, 0, 20], [-22, 0, 22],
    [-8, 0.6, -18], [-8, 1.8, -21.2], [-8, 3, -24.4], // escada
    [-3, 3.5, -34], [2, 4.5, -38], [7, 5.5, -41], // plataformas flutuantes
    [15, 6.5, -31], [14, 0, -40], [20, 0, -40], // chegada e ilhinha
  ];
  const estrelas = [
    [16, 3, 12],     // no topo dos blocos coloridos
    [-25, 0, 25],    // escondida no canto da floresta
    [12, 6.5, -38],  // na última plataforma flutuante
  ];
  const coracoes = [[-6, 0, -12], [19, 6.5, -35]];
  const itens = [
    ...cristais.map(([x, y, z]) => ({ tipo: 'cristal', x, y, z })),
    ...estrelas.map(([x, y, z]) => ({ tipo: 'estrela', x, y, z })),
    ...coracoes.map(([x, y, z]) => ({ tipo: 'coracao', x, y, z })),
  ];

  const checkpoints = [[-9.5, 3, -29.5], [17, 6.5, -33]].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const portal = new THREE.Vector3(17, 0, -43);

  return { caixas, inimigos, itens, checkpoints, portal, pontoInicial: new THREE.Vector3(0, 0, 0) };
}
