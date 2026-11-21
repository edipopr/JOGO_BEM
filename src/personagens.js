// Os 4 heróis jogáveis: atributos (GDD) e modelos low-poly feitos com primitivas.
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
  return { grupo, parte };
}

// ---------- Guizinho ----------
function modeloGuizinho() {
  const { grupo, parte } = construtor();
  const verde = mat(0x4cd137), laranja = mat(0xff8a1f), escuro = mat(0x2b2b2b), branco = mat(0xffffff);
  parte(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 6), verde, -0.16, 0.25, 0);
  parte(new THREE.CylinderGeometry(0.13, 0.13, 0.5, 6), verde, 0.16, 0.25, 0);
  parte(new THREE.BoxGeometry(0.26, 0.14, 0.38), laranja, -0.16, 0.07, 0.06);
  parte(new THREE.BoxGeometry(0.26, 0.14, 0.38), laranja, 0.16, 0.07, 0.06);
  parte(new THREE.CylinderGeometry(0.32, 0.36, 0.6, 8), laranja, 0, 0.8, 0);
  const bracoE = parte(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6), verde, -0.45, 0.82, 0);
  const bracoD = parte(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 6), verde, 0.45, 0.82, 0);
  bracoE.rotation.z = 0.25; bracoD.rotation.z = -0.25;
  parte(new THREE.IcosahedronGeometry(0.34, 1), verde, 0, 1.36, 0);
  parte(new THREE.BoxGeometry(0.62, 0.16, 0.2), escuro, 0, 1.4, 0.2);
  parte(new THREE.SphereGeometry(0.06, 6, 4), branco, -0.12, 1.4, 0.31);
  parte(new THREE.SphereGeometry(0.06, 6, 4), branco, 0.12, 1.4, 0.31);
  for (let i = 0; i < 5; i++) {
    const a = (i - 2) * 0.35;
    const fio = parte(new THREE.ConeGeometry(0.1, 0.32, 5), laranja, Math.sin(a) * 0.2, 1.66, -0.05 + Math.cos(a) * 0.02);
    fio.rotation.z = -a * 0.8;
    fio.rotation.x = -0.3;
  }
  return { grupo, bracoE, bracoD };
}

// ---------- TV Rambon ----------
function modeloTvRambon() {
  const { grupo, parte } = construtor();
  const terno = mat(0x3b3f8f), cinza = mat(0x9aa3ad), escuro = mat(0x2b2b2b);
  parte(new THREE.BoxGeometry(0.24, 0.8, 0.26), escuro, -0.18, 0.4, 0);
  parte(new THREE.BoxGeometry(0.24, 0.8, 0.26), escuro, 0.18, 0.4, 0);
  parte(new THREE.BoxGeometry(0.78, 0.78, 0.46), terno, 0, 1.19, 0);
  const bracoE = parte(new THREE.BoxGeometry(0.2, 0.7, 0.2), terno, -0.5, 1.15, 0);
  const bracoD = parte(new THREE.BoxGeometry(0.2, 0.7, 0.2), terno, 0.5, 1.15, 0);
  parte(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 6), escuro, 0, 1.64, 0);
  parte(new THREE.BoxGeometry(0.9, 0.64, 0.52), cinza, 0, 2.02, 0);
  const matTela = new THREE.MeshBasicMaterial({ color: 0xff00ff });
  const tela = parte(new THREE.PlaneGeometry(0.7, 0.48), matTela, 0, 2.02, 0.265);
  tela.castShadow = false;
  parte(new THREE.BoxGeometry(0.1, 0.12, 0.02), escuro, -0.15, 2.07, 0.275);
  parte(new THREE.BoxGeometry(0.1, 0.12, 0.02), escuro, 0.15, 2.07, 0.275);
  parte(new THREE.BoxGeometry(0.26, 0.05, 0.02), escuro, 0, 1.92, 0.275);
  const ant1 = parte(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 4), escuro, -0.16, 2.5, 0);
  const ant2 = parte(new THREE.CylinderGeometry(0.02, 0.02, 0.42, 4), escuro, 0.16, 2.5, 0);
  ant1.rotation.z = 0.45; ant2.rotation.z = -0.45;
  // A tela muda de cor o tempo todo (poder colorido)
  const animar = (t) => matTela.color.setHSL((t * 0.2) % 1, 0.9, 0.55);
  return { grupo, bracoE, bracoD, animar };
}

// ---------- Experimento Caixa ----------
function modeloExperimentoCaixa() {
  const { grupo, parte } = construtor();
  const jaleco = mat(0xf2f2f2), papelao = mat(0xc89b5a), escuro = mat(0x2b2b2b);
  const vermelho = mat(0xff2a2a), branco = mat(0xffffff);
  parte(new THREE.CylinderGeometry(0.11, 0.11, 0.45, 6), escuro, -0.14, 0.225, 0);
  parte(new THREE.CylinderGeometry(0.11, 0.11, 0.45, 6), escuro, 0.14, 0.225, 0);
  parte(new THREE.CylinderGeometry(0.28, 0.36, 0.6, 8), jaleco, 0, 0.74, 0);
  const bracoE = parte(new THREE.CylinderGeometry(0.09, 0.09, 0.48, 6), jaleco, -0.4, 0.74, 0);
  const bracoD = parte(new THREE.CylinderGeometry(0.09, 0.09, 0.48, 6), jaleco, 0.4, 0.74, 0);
  bracoE.rotation.z = 0.2; bracoD.rotation.z = -0.2;
  parte(new THREE.BoxGeometry(0.64, 0.6, 0.6), papelao, 0, 1.33, 0);
  // Olho em X vermelho (esquerda) e olho grande (direita)
  const x1 = parte(new THREE.BoxGeometry(0.24, 0.05, 0.02), vermelho, -0.15, 1.4, 0.31);
  const x2 = parte(new THREE.BoxGeometry(0.24, 0.05, 0.02), vermelho, -0.15, 1.4, 0.31);
  x1.rotation.z = Math.PI / 4; x2.rotation.z = -Math.PI / 4;
  parte(new THREE.SphereGeometry(0.15, 8, 6), branco, 0.14, 1.4, 0.28);
  parte(new THREE.SphereGeometry(0.07, 6, 4), escuro, 0.14, 1.4, 0.41);
  parte(new THREE.BoxGeometry(0.22, 0.04, 0.02), escuro, 0, 1.18, 0.31);
  return { grupo, bracoE, bracoD };
}

// ---------- Mr. Fun BOT ----------
function modeloFunBot() {
  const { grupo, parte } = construtor();
  const metal = mat(0xb8c4d0), azul = mat(0x3d7bd9), escuro = mat(0x2b2b2b);
  const ciano = new THREE.MeshBasicMaterial({ color: 0x5af0ff });
  parte(new THREE.BoxGeometry(0.22, 0.55, 0.24), metal, -0.16, 0.275, 0);
  parte(new THREE.BoxGeometry(0.22, 0.55, 0.24), metal, 0.16, 0.275, 0);
  parte(new THREE.BoxGeometry(0.62, 0.6, 0.42), azul, 0, 0.88, 0);
  parte(new THREE.BoxGeometry(0.56, 0.5, 0.46), metal, 0, 1.46, 0);
  parte(new THREE.BoxGeometry(0.12, 0.1, 0.02), ciano, -0.12, 1.53, 0.235);
  parte(new THREE.BoxGeometry(0.12, 0.1, 0.02), ciano, 0.12, 1.53, 0.235);
  parte(new THREE.BoxGeometry(0.16, 0.12, 0.02), escuro, 0, 1.35, 0.235); // boca quadrada
  parte(new THREE.CylinderGeometry(0.025, 0.025, 0.25, 4), escuro, 0, 1.83, 0);
  parte(new THREE.SphereGeometry(0.07, 6, 4), mat(0xff3b3b), 0, 1.97, 0);
  const bracoE = parte(new THREE.BoxGeometry(0.16, 0.5, 0.16), metal, -0.42, 0.86, 0);
  // Canhão no braço direito (aponta para frente)
  const bracoD = parte(new THREE.CylinderGeometry(0.14, 0.12, 0.75, 8), escuro, 0.45, 0.92, 0.22);
  bracoD.rotation.x = Math.PI / 2;
  parte(new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8), azul, 0, -0.36, 0, bracoD);
  return { grupo, bracoE, bracoD, bracoFixo: true };
}

/**
 * Atributos de 1 a 5 (do GDD). Ataques:
 *  soco     = golpe curto à frente      onda     = explosão de luz ao redor
 *  raio     = choque de alcance médio    projetil = tiro explosivo à distância
 */
export const PERSONAGENS = {
  guizinho: {
    nome: 'Guizinho', titulo: 'O Herói', cor: '#4cd137',
    descricao: 'Equilibrado, rápido e ótimo de pulo.',
    velocidade: 4, forca: 3, pulo: 4, altura: 1.6,
    ataque: 'soco', nomeAtaque: 'Soco energético', pontoMao: [0.3, 0.85, 0.85],
    criarModelo: modeloGuizinho,
  },
  tvRambon: {
    nome: 'TV Rambon', titulo: 'O Poder Colorido', cor: '#b07dff',
    descricao: 'O mais alto e forte. Ataca tudo ao redor.',
    velocidade: 2, forca: 4, pulo: 2, altura: 2.2,
    ataque: 'onda', nomeAtaque: 'Explosão de luz', pontoMao: [0, 1.1, 0],
    criarModelo: modeloTvRambon,
  },
  experimentoCaixa: {
    nome: 'Experimento Caixa', titulo: 'O Cientista', cor: '#c89b5a',
    descricao: 'Esperto e falante. Choque de longo alcance.',
    velocidade: 3, forca: 2, pulo: 3, altura: 1.6,
    ataque: 'raio', nomeAtaque: 'Raio elétrico', pontoMao: [0.35, 0.8, 0.4],
    criarModelo: modeloExperimentoCaixa,
  },
  funBot: {
    nome: 'Mr. Fun BOT', titulo: 'O Robô', cor: '#3d7bd9',
    descricao: 'Ataca de longe com o canhão.',
    velocidade: 3, forca: 3, pulo: 3, altura: 1.8,
    ataque: 'projetil', nomeAtaque: 'Projétil explosivo', pontoMao: [0.45, 0.92, 0.65],
    criarModelo: modeloFunBot,
  },
};
