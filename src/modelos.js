// Modelos low-poly dos 5 heróis, feitos com primitivas do Three.js.
// Cada modelo devolve: grupo, bracoE/bracoD e pernaE/pernaD (pivôs no ombro/quadril), cabeca e, se quiser:
// piscam (olhos que piscam), animar(t), bracoFixo (o braço direito não balança).
import * as THREE from 'three';

const mat = (cor) => new THREE.MeshLambertMaterial({ color: cor, flatShading: true });

function construtor() {
  const grupo = new THREE.Group();
  const parte = (geo, material, x, y, z, pai = grupo) => {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    pai.add(m);
    return m;
  };
  const pivo = (x, y, z, pai = grupo) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    pai.add(g);
    return g;
  };
  /** Perna com pivô no quadril; o pé fica em y = 0 quando o quadril está em y = altura. */
  const perna = (x, altura, raio, matPerna, matPe, { quadrada = false, pe = [0.26, 0.14, 0.4] } = {}) => {
    const g = pivo(x, altura, 0);
    const comp = altura - 0.06;
    parte(quadrada ? new THREE.BoxGeometry(raio * 2, comp, raio * 2) : new THREE.CylinderGeometry(raio, raio * 0.85, comp, 7), matPerna, 0, -comp / 2, 0, g);
    parte(new THREE.BoxGeometry(...pe), matPe, 0, -altura + pe[1] / 2, 0.07, g);
    return g;
  };
  /** Braço com pivô no ombro e mão na ponta. */
  const braco = (x, y, comp, raio, matBraco, matMao, { quadrado = false, mao = raio * 1.35 } = {}) => {
    const g = pivo(x, y, 0);
    parte(quadrado ? new THREE.BoxGeometry(raio * 2, comp, raio * 2) : new THREE.CylinderGeometry(raio * 0.9, raio, comp, 7), matBraco, 0, -comp / 2, 0, g);
    parte(quadrado ? new THREE.BoxGeometry(mao * 1.8, mao * 1.6, mao * 1.8) : new THREE.IcosahedronGeometry(mao, 1), matMao, 0, -comp - mao * 0.3, 0, g);
    return g;
  };
  const sorriso = (raio, espessura, material, x, y, z, pai) => {
    const s = parte(new THREE.TorusGeometry(raio, espessura, 5, 10, Math.PI), material, x, y, z, pai);
    s.rotation.z = Math.PI;
    s.castShadow = false;
    return s;
  };
  return { grupo, parte, pivo, perna, braco, sorriso };
}

// ---------- Guizinho ----------
export function modeloGuizinho() {
  const { grupo, parte, pivo, perna, braco, sorriso } = construtor();
  const verde = mat(0x4cd137), laranja = mat(0xff8a1f), escuro = mat(0x2b2b2b), branco = mat(0xffffff), verdeEscuro = mat(0x2f9e2a);
  const pernaE = perna(-0.16, 0.5, 0.13, verde, laranja);
  const pernaD = perna(0.16, 0.5, 0.13, verde, laranja);
  parte(new THREE.CylinderGeometry(0.31, 0.35, 0.6, 9), laranja, 0, 0.8, 0);
  parte(new THREE.CylinderGeometry(0.355, 0.36, 0.1, 9), escuro, 0, 0.56, 0); // cinto
  parte(new THREE.BoxGeometry(0.14, 0.1, 0.06), mat(0xffd84a), 0, 0.56, 0.34);
  const emblema = parte(new THREE.OctahedronGeometry(0.11, 0), mat(0xffe14a), 0, 0.86, 0.31);
  emblema.scale.z = 0.4;
  const bracoE = braco(-0.4, 1.03, 0.42, 0.1, verde, laranja);
  const bracoD = braco(0.4, 1.03, 0.42, 0.1, verde, laranja);
  bracoE.rotation.z = -0.3; bracoD.rotation.z = 0.3;
  const cabeca = pivo(0, 1.12, 0);
  parte(new THREE.IcosahedronGeometry(0.35, 1), verde, 0, 0.25, 0, cabeca);
  parte(new THREE.BoxGeometry(0.64, 0.17, 0.22), escuro, 0, 0.29, 0.2, cabeca); // máscara
  for (const x of [-0.33, 0.33]) parte(new THREE.ConeGeometry(0.08, 0.2, 4), escuro, x, 0.33, 0.1, cabeca).rotation.z = x > 0 ? -1.2 : 1.2;
  const piscam = [-0.13, 0.13].map((x) => {
    const o = parte(new THREE.SphereGeometry(0.075, 8, 6), branco, x, 0.29, 0.3, cabeca);
    parte(new THREE.SphereGeometry(0.035, 6, 4), escuro, 0, 0, 0.055, o);
    return o;
  });
  sorriso(0.11, 0.022, verdeEscuro, 0, 0.16, 0.31, cabeca);
  for (let i = 0; i < 7; i++) { // cabelo espetado
    const a = (i - 3) * 0.3;
    const fio = parte(new THREE.ConeGeometry(0.1, 0.34 + (i % 2) * 0.1, 5), laranja, Math.sin(a) * 0.25, 0.53 + Math.cos(a) * 0.05, -0.06, cabeca);
    fio.rotation.set(-0.3, 0, -a * 0.9);
  }
  return { grupo, bracoE, bracoD, pernaE, pernaD, cabeca, piscam };
}

// ---------- Irmão do Guizinho (roxo e branco, braços gigantes) ----------
export function modeloIrmao() {
  const { grupo, parte, pivo, perna, sorriso } = construtor();
  const roxo = mat(0x8a3fd6), roxoEscuro = mat(0x5a2496), branco = mat(0xffffff), gelo = mat(0xe6ddff), escuro = mat(0x2b2b2b);
  const pernaE = perna(-0.18, 0.46, 0.15, roxoEscuro, branco, { pe: [0.3, 0.15, 0.42] });
  const pernaD = perna(0.18, 0.46, 0.15, roxoEscuro, branco, { pe: [0.3, 0.15, 0.42] });
  parte(new THREE.CylinderGeometry(0.46, 0.33, 0.68, 9), branco, 0, 0.82, 0);          // peito largo branco
  parte(new THREE.CylinderGeometry(0.35, 0.36, 0.12, 9), roxoEscuro, 0, 0.52, 0);       // cinto
  const faixa = parte(new THREE.BoxGeometry(0.2, 0.64, 0.06), roxo, 0, 0.84, 0.39);     // faixa roxa
  faixa.rotation.x = 0.16;
  parte(new THREE.OctahedronGeometry(0.1, 0), branco, 0, 0.92, 0.44).scale.z = 0.4;
  // Braços imensos: ombro, braço, pulseira e mão gigante com dedos
  const bracoGigante = (lado) => {
    const g = pivo(lado * 0.56, 1.1, 0);
    parte(new THREE.IcosahedronGeometry(0.25, 1), roxo, 0, 0, 0, g);
    parte(new THREE.CylinderGeometry(0.16, 0.25, 0.62, 8), roxo, 0, -0.36, 0, g);
    parte(new THREE.CylinderGeometry(0.27, 0.27, 0.12, 8), branco, 0, -0.64, 0, g);
    const mao = parte(new THREE.IcosahedronGeometry(0.33, 1), roxo, 0, -0.86, 0.02, g);
    for (const dx of [-0.2, 0, 0.2]) parte(new THREE.IcosahedronGeometry(0.13, 0), gelo, dx, -0.14, 0.24, mao);
    parte(new THREE.IcosahedronGeometry(0.12, 0), gelo, -lado * 0.3, 0.02, 0.12, mao);
    return g;
  };
  const bracoE = bracoGigante(-1), bracoD = bracoGigante(1);
  bracoE.rotation.z = -0.22; bracoD.rotation.z = 0.22;
  const cabeca = pivo(0, 1.14, 0);
  parte(new THREE.IcosahedronGeometry(0.34, 1), roxo, 0, 0.26, 0, cabeca);
  parte(new THREE.BoxGeometry(0.62, 0.17, 0.22), branco, 0, 0.3, 0.19, cabeca);         // máscara branca (a do Guizinho é preta)
  const piscam = [-0.13, 0.13].map((x) => {
    const o = parte(new THREE.SphereGeometry(0.075, 8, 6), escuro, x, 0.3, 0.28, cabeca);
    parte(new THREE.SphereGeometry(0.028, 6, 4), branco, 0.02, 0.025, 0.06, o);
    return o;
  });
  sorriso(0.13, 0.024, roxoEscuro, 0, 0.16, 0.29, cabeca);
  for (let i = 0; i < 7; i++) {
    const a = (i - 3) * 0.32;
    const fio = parte(new THREE.ConeGeometry(0.1, 0.32 + (i % 2) * 0.12, 5), i % 2 ? branco : gelo, Math.sin(a) * 0.25, 0.53 + Math.cos(a) * 0.05, -0.06, cabeca);
    fio.rotation.set(-0.35, 0, -a * 0.9);
  }
  return { grupo, bracoE, bracoD, pernaE, pernaD, cabeca, piscam };
}

// ---------- TV Rambon ----------
export function modeloTvRambon() {
  const { grupo, parte, pivo, perna, braco } = construtor();
  const terno = mat(0x3b3f8f), cinza = mat(0x9aa3ad), escuro = mat(0x2b2b2b), branco = mat(0xf2f2f2);
  const pernaE = perna(-0.18, 0.82, 0.13, escuro, cinza, { quadrada: true, pe: [0.28, 0.14, 0.42] });
  const pernaD = perna(0.18, 0.82, 0.13, escuro, cinza, { quadrada: true, pe: [0.28, 0.14, 0.42] });
  parte(new THREE.BoxGeometry(0.78, 0.78, 0.46), terno, 0, 1.2, 0);
  parte(new THREE.BoxGeometry(0.24, 0.5, 0.02), branco, 0, 1.3, 0.235);   // camisa
  // Gravata colorida (arco-íris)
  [0xff4d4d, 0xffd84a, 0x4cd137, 0x5ad1ff].forEach((c, i) => parte(new THREE.BoxGeometry(0.11, 0.11, 0.03), mat(c), 0, 1.48 - i * 0.11, 0.25));
  const bracoE = braco(-0.5, 1.5, 0.6, 0.1, terno, branco, { quadrado: true, mao: 0.13 });
  const bracoD = braco(0.5, 1.5, 0.6, 0.1, terno, branco, { quadrado: true, mao: 0.13 });
  parte(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 6), escuro, 0, 1.65, 0);
  const cabeca = pivo(0, 1.7, 0);
  parte(new THREE.BoxGeometry(0.94, 0.66, 0.46), cinza, 0, 0.33, 0, cabeca);
  parte(new THREE.BoxGeometry(0.6, 0.46, 0.2), escuro, 0, 0.33, -0.3, cabeca); // traseira da TV
  const matTela = new THREE.MeshBasicMaterial({ color: 0xff00ff });
  const tela = parte(new THREE.PlaneGeometry(0.7, 0.48), matTela, -0.05, 0.33, 0.235, cabeca);
  tela.castShadow = false;
  for (const y of [0.45, 0.28]) parte(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 8), escuro, 0.39, y, 0.24, cabeca).rotation.x = Math.PI / 2; // botões
  const piscam = [-0.2, 0.1].map((x) => parte(new THREE.BoxGeometry(0.1, 0.14, 0.02), escuro, x, 0.39, 0.245, cabeca));
  parte(new THREE.BoxGeometry(0.26, 0.05, 0.02), escuro, -0.05, 0.22, 0.245, cabeca);
  for (const s of [-1, 1]) {
    const ant = parte(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 4), escuro, s * 0.16, 0.82, 0, cabeca);
    ant.rotation.z = -s * 0.45;
    parte(new THREE.SphereGeometry(0.05, 6, 4), mat(0xff4d4d), s * 0.25, 1.01, 0, cabeca);
  }
  // A tela muda de cor o tempo todo (poder colorido)
  const animar = (t) => matTela.color.setHSL((t * 0.2) % 1, 0.9, 0.55);
  return { grupo, bracoE, bracoD, pernaE, pernaD, cabeca, piscam, animar };
}

// ---------- Experimento Caixa ----------
export function modeloExperimentoCaixa() {
  const { grupo, parte, pivo, perna, braco } = construtor();
  const jaleco = mat(0xf2f2f2), papelao = mat(0xc89b5a), papelaoEscuro = mat(0xa87c42), escuro = mat(0x2b2b2b);
  const vermelho = mat(0xff2a2a), branco = mat(0xffffff);
  const pernaE = perna(-0.14, 0.46, 0.11, escuro, mat(0x6b4a2a));
  const pernaD = perna(0.14, 0.46, 0.11, escuro, mat(0x6b4a2a));
  parte(new THREE.CylinderGeometry(0.28, 0.38, 0.64, 9), jaleco, 0, 0.74, 0);
  parte(new THREE.BoxGeometry(0.03, 0.5, 0.04), escuro, 0, 0.74, 0.335);           // abertura do jaleco
  parte(new THREE.BoxGeometry(0.14, 0.12, 0.05), jaleco, -0.17, 0.86, 0.3);        // bolso com canetas
  [0xff4d4d, 0x3d7bd9].forEach((c, i) => parte(new THREE.BoxGeometry(0.03, 0.12, 0.03), mat(c), -0.2 + i * 0.06, 0.94, 0.31));
  const bracoE = braco(-0.36, 0.98, 0.42, 0.09, jaleco, papelao);
  const bracoD = braco(0.36, 0.98, 0.42, 0.09, jaleco, papelao);
  bracoE.rotation.z = -0.25; bracoD.rotation.z = 0.25;
  const cabeca = pivo(0, 1.04, 0);
  parte(new THREE.BoxGeometry(0.66, 0.6, 0.6), papelao, 0, 0.3, 0, cabeca);
  parte(new THREE.BoxGeometry(0.14, 0.02, 0.6), papelaoEscuro, 0, 0.61, 0, cabeca); // fita da caixa
  for (const s of [-1, 1]) { // abas abertas da caixa
    const aba = parte(new THREE.BoxGeometry(0.3, 0.03, 0.58), papelaoEscuro, s * 0.42, 0.66, 0, cabeca);
    aba.rotation.z = s * 0.6;
  }
  // Olho em X vermelho (esquerda) e olho grande (direita)
  const x1 = parte(new THREE.BoxGeometry(0.24, 0.055, 0.03), vermelho, -0.16, 0.37, 0.315, cabeca);
  const x2 = parte(new THREE.BoxGeometry(0.24, 0.055, 0.03), vermelho, -0.16, 0.37, 0.315, cabeca);
  x1.rotation.z = Math.PI / 4; x2.rotation.z = -Math.PI / 4;
  const olho = parte(new THREE.SphereGeometry(0.16, 10, 8), branco, 0.15, 0.37, 0.27, cabeca);
  parte(new THREE.SphereGeometry(0.075, 8, 6), escuro, 0, 0, 0.12, olho);
  parte(new THREE.BoxGeometry(0.24, 0.1, 0.02), escuro, 0, 0.13, 0.31, cabeca);    // boca falante
  parte(new THREE.BoxGeometry(0.2, 0.03, 0.03), branco, 0, 0.16, 0.31, cabeca);
  return { grupo, bracoE, bracoD, pernaE, pernaD, cabeca, piscam: [olho] };
}

// ---------- Mr. Fun BOT ----------
export function modeloFunBot() {
  const { grupo, parte, pivo, perna, braco } = construtor();
  const metal = mat(0xb8c4d0), azul = mat(0x3d7bd9), azulEscuro = mat(0x28549c), escuro = mat(0x2b2b2b);
  const ciano = new THREE.MeshBasicMaterial({ color: 0x5af0ff });
  const matLuz = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
  const pernaE = perna(-0.17, 0.55, 0.11, metal, azulEscuro, { quadrada: true, pe: [0.28, 0.16, 0.4] });
  const pernaD = perna(0.17, 0.55, 0.11, metal, azulEscuro, { quadrada: true, pe: [0.28, 0.16, 0.4] });
  parte(new THREE.BoxGeometry(0.64, 0.6, 0.44), azul, 0, 0.88, 0);
  parte(new THREE.BoxGeometry(0.36, 0.28, 0.04), escuro, 0, 0.94, 0.225);          // painel do peito
  const luzes = [0x4cd137, 0xffd84a, 0xff4d4d].map((c, i) =>
    parte(new THREE.BoxGeometry(0.07, 0.07, 0.02), new THREE.MeshBasicMaterial({ color: c }), -0.1 + i * 0.1, 0.94, 0.25));
  for (const s of [-1, 1]) parte(new THREE.IcosahedronGeometry(0.16, 0), azulEscuro, s * 0.4, 1.1, 0); // ombros
  const cabeca = pivo(0, 1.2, 0);
  parte(new THREE.BoxGeometry(0.6, 0.52, 0.48), metal, 0, 0.27, 0, cabeca);
  parte(new THREE.BoxGeometry(0.5, 0.2, 0.02), escuro, 0, 0.34, 0.235, cabeca);    // visor
  const piscam = [-0.12, 0.12].map((x) => parte(new THREE.BoxGeometry(0.13, 0.12, 0.02), ciano, x, 0.34, 0.25, cabeca));
  parte(new THREE.BoxGeometry(0.22, 0.14, 0.02), escuro, 0, 0.13, 0.245, cabeca);  // boca quadrada
  for (const x of [-0.05, 0.05]) parte(new THREE.BoxGeometry(0.02, 0.14, 0.025), metal, x, 0.13, 0.247, cabeca);
  for (const s of [-1, 1]) parte(new THREE.CylinderGeometry(0.1, 0.1, 0.08, 8), azul, s * 0.33, 0.28, 0, cabeca).rotation.z = Math.PI / 2; // "orelhas"
  parte(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 4), escuro, 0, 0.64, 0, cabeca);
  parte(new THREE.SphereGeometry(0.08, 8, 6), matLuz, 0, 0.78, 0, cabeca);
  const bracoE = braco(-0.44, 1.08, 0.4, 0.08, metal, azul, { quadrado: true, mao: 0.11 });
  // Canhão no braço direito (aponta para frente)
  const bracoD = pivo(0.45, 0.95, 0.1);
  const cano = parte(new THREE.CylinderGeometry(0.15, 0.12, 0.75, 10), escuro, 0, 0, 0.15, bracoD);
  cano.rotation.x = Math.PI / 2;
  for (const z of [-0.12, 0.42]) parte(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 10), azul, 0, 0, z, bracoD).rotation.x = Math.PI / 2;
  parte(new THREE.CylinderGeometry(0.1, 0.1, 0.02, 10), ciano, 0, 0, 0.53, bracoD).rotation.x = Math.PI / 2;
  const animar = (t) => {
    matLuz.color.setHex(Math.sin(t * 5) > 0 ? 0xff3b3b : 0x7a1010);
    luzes.forEach((l, i) => { l.visible = Math.floor(t * 3) % 3 !== i; });
  };
  return { grupo, bracoE, bracoD, pernaE, pernaD, cabeca, piscam, animar, bracoFixo: true };
}
