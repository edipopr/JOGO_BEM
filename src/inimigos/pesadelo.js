// Criaturas do pesadelo (Floresta do Pesadelo e Castelo):
//  sombra    = fantasma quase invisível que aparece para atacar
//  olho      = olho voador com asas que atira em leque
//  espinhoso = bola de espinhos que rola em investidas
//  tentaculo = tentáculo que brota do chão e dá chicotadas
//  cavaleiro = armadura possuída com espadão
import * as THREE from 'three';
import { som } from '../audio.js';
import { matLambert, matBasico, parte, olhos, voarPara, rondar, andarPara, virarPara } from './comum.js';

// ---------- Sombra ----------
function modeloSombra() {
  const grupo = new THREE.Group();
  const material = matLambert(0x3a1a5a, { transparent: true, opacity: 0.9 });
  const corpo = new THREE.Group();
  grupo.add(corpo);
  parte(new THREE.SphereGeometry(0.5, 9, 7), material, 0, 1.15, 0, corpo);
  parte(new THREE.CylinderGeometry(0.5, 0.75, 0.9, 9), material, 0, 0.65, 0, corpo);
  const barra = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = parte(new THREE.ConeGeometry(0.2, 0.5, 5), material, Math.cos(a) * 0.5, 0.05, Math.sin(a) * 0.5, corpo, false);
    p.rotation.x = Math.PI;
    barra.push(p);
  }
  olhos(corpo, 1.2, 0.42, 0.18, 0.12, 0xff3b6b);
  const boca = parte(new THREE.SphereGeometry(0.16, 7, 5), matBasico(0x0a0010), 0, 0.9, 0.46, corpo, false);
  for (const s of [-1, 1]) parte(new THREE.ConeGeometry(0.14, 0.6, 5), material, s * 0.6, 0.8, 0.25, corpo).rotation.set(-1.2, 0, s * 0.5);
  return { grupo, corpo, material, barra, boca };
}

function agirSombra(ini, dt, c) {
  ini.tempoAcao -= dt;
  const j = c.jogador.posicao;
  if (!c.vendo) { ini.bote = 0; rondar(ini, dt, 3, 1.4); return; }
  virarPara(ini, c.dx, c.dz, dt, 6);
  if (ini.bote > 0) {
    ini.bote -= dt;
  } else if (ini.tempoAcao <= 0 && c.dist < 5.5) { // aparece e dá o bote
    ini.tempoAcao = 2.8;
    ini.bote = 0.6;
    ini.velocidade.set(c.dx / c.dist * 7, (j.y - ini.posicao.y) * 1.2, c.dz / c.dist * 7);
    som.efeito('fantasma');
  } else {
    voarPara(ini, j.x - c.dx / c.dist * 3.5, j.y + 0.3 + Math.sin(ini.tempo * 2) * 0.25, j.z - c.dz / c.dist * 3.5, 2.4, dt, 2.5);
  }
}

function animarSombra(ini) {
  const visivel = ini.bote > 0 || ini.tempoAcao < 0.8 || ini.tempoBrilho > 0;
  const m = ini.m;
  m.material.opacity += ((visivel ? 0.92 : 0.3) - m.material.opacity) * 0.15;
  m.corpo.position.y = Math.sin(ini.tempo * 3) * 0.12;
  m.barra.forEach((p, i) => { p.scale.y = 1 + Math.sin(ini.tempo * 6 + i) * 0.3; });
  m.boca.scale.setScalar(ini.bote > 0 ? 1.8 : 1);
  ini.emissivoBase = visivel ? 0x2a0a3a : 0x000000;
}

// ---------- Olho voador ----------
function modeloOlho() {
  const grupo = new THREE.Group();
  const material = matLambert(0xf0e6ee);
  const asaMat = matLambert(0x5a1d7a), iris = matBasico(0xc6ff3d), pupila = matBasico(0x0a0010);
  const corpo = parte(new THREE.SphereGeometry(0.5, 11, 8), material, 0, 0.6, 0, grupo);
  parte(new THREE.SphereGeometry(0.27, 9, 7), iris, 0, 0, 0.32, corpo, false);
  const pup = parte(new THREE.SphereGeometry(0.14, 8, 6), pupila, 0, 0, 0.5, corpo, false);
  for (let i = 0; i < 5; i++) { // nervos
    const n = parte(new THREE.ConeGeometry(0.07, 0.5, 4), asaMat, (i - 2) * 0.13, -0.15 + Math.abs(i - 2) * 0.05, -0.6, corpo, false);
    n.rotation.x = -Math.PI / 2 - 0.3;
  }
  const asas = [-1, 1].map((s) => {
    const a = new THREE.Group();
    a.position.set(s * 0.42, 0.15, -0.1);
    const m = parte(new THREE.ConeGeometry(0.42, 1.1, 4), asaMat, s * 0.5, 0.1, 0, a);
    m.rotation.z = -s * Math.PI / 2;
    m.scale.z = 0.12;
    corpo.add(a);
    return a;
  });
  return { grupo, corpo, material, asas, pup };
}

function agirOlho(ini, dt, c) {
  ini.tempoAcao -= dt;
  if (!c.vendo) { rondar(ini, dt, 2.4, 1.6); return; }
  const j = c.jogador.posicao;
  virarPara(ini, c.dx, c.dz, dt, 8);
  const a = Math.atan2(-c.dx, -c.dz) + Math.sin(ini.tempo * 0.5) * 0.8;
  voarPara(ini, j.x + Math.sin(a) * 5.5, j.y + 1.4 + Math.sin(ini.tempo * 2.5) * 0.35, j.z + Math.cos(a) * 5.5, 2.8, dt, 3);
  if (ini.tempoAcao <= 0) {
    ini.tempoAcao = 2.7 + Math.random() * 0.5;
    const origem = ini.centro().clone();
    const base = Math.atan2(c.dx, c.dz);
    const subida = (j.y + 0.8 - origem.y) / Math.max(1.5, c.dist);
    som.efeito('cuspe');
    for (const d of [-0.25, 0, 0.25]) {
      c.projeteis.disparar({
        origem, direcao: new THREE.Vector3(Math.sin(base + d), subida, Math.cos(base + d)),
        velocidade: 7.5, dono: 'inimigo', cor: 0xb04dff, raio: 0.24, duracao: 2.2,
      });
    }
  }
}

function animarOlho(ini) {
  const m = ini.m, b = Math.sin(ini.tempo * 14) * 0.6;
  m.asas[0].rotation.z = -b;
  m.asas[1].rotation.z = b;
  m.pup.scale.setScalar(ini.tempoAcao < 0.6 ? 0.5 : 1); // a pupila fecha antes de atirar
  ini.emissivoBase = ini.tempoAcao < 0.4 ? 0x7a1010 : 0x000000;
}

// ---------- Espinhoso ----------
function modeloEspinhoso() {
  const grupo = new THREE.Group();
  const material = matLambert(0x4a1d6a);
  const espinho = matLambert(0xc6ff3d);
  const corpo = parte(new THREE.IcosahedronGeometry(0.6, 1), material, 0, 0.65, 0, grupo);
  const dir = new THREE.Vector3(), cima = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 16; i++) {
    const y = 1 - (i / 15) * 2, r = Math.sqrt(Math.max(0, 1 - y * y)), a = i * 2.4;
    dir.set(Math.cos(a) * r, y, Math.sin(a) * r);
    const e = parte(new THREE.ConeGeometry(0.1, 0.34, 4), espinho, dir.x * 0.7, dir.y * 0.7, dir.z * 0.7, corpo, false);
    e.quaternion.setFromUnitVectors(cima, dir);
  }
  olhos(corpo, 0.1, 0.5, 0.2, 0.12, 0xff3b3b);
  return { grupo, corpo, material };
}

function agirEspinhoso(ini, dt, c) {
  ini.tempoAcao -= dt;
  if (ini.investida > 0) { // rolando
    ini.investida -= dt;
    ini.velocidade.x = ini.dirX * 8; ini.velocidade.z = ini.dirZ * 8;
    return;
  }
  if (!c.vendo) {
    const a = ini.tempo * 0.4;
    andarPara(ini, ini.casa.x + Math.cos(a) * 2, ini.casa.z + Math.sin(a) * 2, 1, dt);
    return;
  }
  ini.velocidade.x *= 0.85; ini.velocidade.z *= 0.85;
  virarPara(ini, c.dx, c.dz, dt, 8);
  if (ini.tempoAcao <= 0) {
    ini.tempoAcao = 2.4;
    ini.investida = 1;
    ini.dirX = c.dx / c.dist; ini.dirZ = c.dz / c.dist;
    som.efeito('chefao_investida');
  }
}

function animarEspinhoso(ini, dt) {
  const m = ini.m, v = Math.hypot(ini.velocidade.x, ini.velocidade.z);
  if (ini.investida > 0) m.corpo.rotation.x += dt * 16;
  else {
    m.corpo.rotation.x += (0 - (m.corpo.rotation.x % (Math.PI * 2))) * 0.2;
    if (ini.tempoAcao < 0.6) m.corpo.position.x = Math.sin(ini.tempo * 50) * 0.06; // treme antes de rolar
    else m.corpo.position.x = 0;
  }
  m.corpo.position.y = 0.65 + (v > 1 ? Math.abs(Math.sin(ini.tempo * 9)) * 0.08 : 0);
}

// ---------- Tentáculo ----------
function modeloTentaculo() {
  const grupo = new THREE.Group();
  const material = matLambert(0x5a1d7a);
  const ventosa = matLambert(0xff6bd0);
  const gomos = [];
  const corpo = new THREE.Group();
  grupo.add(corpo);
  let pai = corpo;
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    g.position.y = i === 0 ? 0 : 0.46;
    const r = 0.42 - i * 0.055;
    parte(new THREE.CylinderGeometry(r - 0.05, r, 0.5, 8), material, 0, 0.23, 0, g);
    parte(new THREE.SphereGeometry(0.1, 6, 4), ventosa, 0, 0.23, r, g, false);
    pai.add(g);
    pai = g;
    gomos.push(g);
  }
  parte(new THREE.ConeGeometry(0.14, 0.5, 7), material, 0, 0.6, 0, pai);
  parte(new THREE.TorusGeometry(0.6, 0.16, 6, 14), matLambert(0x1a0a24), 0, 0.06, 0, grupo, false).rotation.x = Math.PI / 2;
  return { grupo, corpo, material, gomos };
}

const ALCANCE_TENTACULO = 2.9;
function agirTentaculo(ini, dt, c) {
  ini.velocidade.x = ini.velocidade.z = 0;
  ini.fora = c.dist < 8 && c.dy < 4;
  virarPara(ini, c.dx, c.dz, dt, ini.bote > 0 ? 0 : 5);
  if (ini.bote > 0) {
    ini.bote -= dt;
    if (ini.bote < 0.25 && !ini.bateu) { // a chicotada acerta o chão
      ini.bateu = true;
      som.efeito('chefao_golpe');
      const frente = Math.sin(ini.angulo) * c.dx + Math.cos(ini.angulo) * c.dz;
      if (c.dist < ALCANCE_TENTACULO && frente > c.dist * 0.5 && c.dy < 1.2) c.jogador.levarDano(ini.posicao.x, ini.posicao.z, 7);
    }
    return;
  }
  if (!ini.fora) { ini.tempoAcao = 1; return; }
  ini.tempoAcao -= dt;
  if (ini.tempoAcao <= 0 && c.dist < ALCANCE_TENTACULO + 0.4) {
    ini.tempoAcao = 1.6;
    ini.bote = 0.85;
    ini.bateu = false;
  }
}

function animarTentaculo(ini, dt) {
  const m = ini.m;
  ini.altura = ini.fora ? 2.4 : 0.6;
  m.corpo.scale.y += ((ini.fora ? 1 : 0.12) - m.corpo.scale.y) * Math.min(1, 6 * dt);
  const b = ini.bote > 0 ? (ini.bote > 0.3 ? -0.18 : 0.42) : 0; // recua e bate
  m.gomos.forEach((g, i) => {
    const alvo = b + (ini.bote > 0 ? 0 : Math.sin(ini.tempo * 2.5 + i * 0.7) * 0.14);
    g.rotation.x += (alvo - g.rotation.x) * Math.min(1, (ini.bote > 0 && ini.bote < 0.3 ? 30 : 8) * dt);
    g.rotation.z = ini.bote > 0 ? 0 : Math.cos(ini.tempo * 2 + i) * 0.1;
  });
  ini.emissivoBase = ini.bote > 0.3 ? 0x4a0a2a : 0x000000;
}

// ---------- Cavaleiro ----------
function modeloCavaleiro() {
  const grupo = new THREE.Group();
  const material = matLambert(0x4a5068);
  const escuro = matLambert(0x23263a), fogo = matBasico(0xff3bd0), lamina = matLambert(0xb8c4e0);
  const corpo = new THREE.Group();
  grupo.add(corpo);
  const pernas = [-0.22, 0.22].map((x) => {
    const g = new THREE.Group();
    g.position.set(x, 0.75, 0);
    parte(new THREE.BoxGeometry(0.28, 0.75, 0.32), escuro, 0, -0.37, 0, g);
    corpo.add(g);
    return g;
  });
  parte(new THREE.CylinderGeometry(0.55, 0.4, 0.95, 8), material, 0, 1.2, 0, corpo);
  for (const s of [-1, 1]) parte(new THREE.IcosahedronGeometry(0.28, 0), escuro, s * 0.62, 1.6, 0, corpo);
  parte(new THREE.CylinderGeometry(0.32, 0.36, 0.5, 8), material, 0, 1.95, 0, corpo);
  parte(new THREE.BoxGeometry(0.46, 0.09, 0.06), fogo, 0, 1.98, 0.33, corpo, false);
  const pluma = parte(new THREE.ConeGeometry(0.12, 0.55, 6), matLambert(0xb3124a), 0, 2.45, -0.1, corpo);
  pluma.rotation.x = -0.4;
  const braco = new THREE.Group();
  braco.position.set(0.65, 1.5, 0.1);
  parte(new THREE.CylinderGeometry(0.12, 0.14, 0.7, 6), material, 0, -0.35, 0, braco);
  const espada = new THREE.Group();
  espada.position.y = -0.72;
  parte(new THREE.BoxGeometry(0.5, 0.1, 0.14), escuro, 0, 0, 0.15, espada);
  const l = parte(new THREE.BoxGeometry(0.22, 0.06, 1.7), lamina, 0, 0, 1.05, espada);
  l.scale.y = 1.2;
  braco.add(espada);
  corpo.add(braco);
  const escudo = parte(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 6), escuro, -0.68, 1.2, 0.3, corpo);
  escudo.rotation.x = Math.PI / 2;
  parte(new THREE.SphereGeometry(0.12, 6, 5), fogo, 0, 0.08, 0, escudo, false);
  return { grupo, corpo, material, pernas, braco };
}

function agirCavaleiro(ini, dt, c) {
  ini.tempoAcao -= dt;
  if (ini.bote > 0) { // golpe de espada
    ini.velocidade.x *= 0.8; ini.velocidade.z *= 0.8;
    ini.bote -= dt;
    if (ini.bote < 0.35 && !ini.bateu) {
      ini.bateu = true;
      som.efeito('chefao_golpe');
      const frente = Math.sin(ini.angulo) * c.dx + Math.cos(ini.angulo) * c.dz;
      if (c.dist < 2.8 && frente > c.dist * 0.45 && c.dy < 1.8) c.jogador.levarDano(ini.posicao.x, ini.posicao.z, 7);
    }
    return;
  }
  if (!c.vendo) {
    if (c.distCasa > 1) andarPara(ini, ini.casa.x, ini.casa.z, 1.4, dt);
    else { ini.velocidade.x *= 0.8; ini.velocidade.z *= 0.8; }
    const v = ini.velocidade;
    if (Math.hypot(v.x, v.z) > 0.3) virarPara(ini, v.x, v.z, dt, 5);
    return;
  }
  virarPara(ini, c.dx, c.dz, dt, 5);
  if (c.dist > 2.2) andarPara(ini, c.jogador.posicao.x, c.jogador.posicao.z, 2.4, dt);
  else { ini.velocidade.x *= 0.8; ini.velocidade.z *= 0.8; }
  if (c.dist < 2.6 && ini.tempoAcao <= 0) {
    ini.tempoAcao = 1.9;
    ini.bote = 0.95;
    ini.bateu = false;
  }
}

function animarCavaleiro(ini, dt) {
  const m = ini.m, v = Math.hypot(ini.velocidade.x, ini.velocidade.z);
  const passo = Math.sin(ini.tempo * 8) * Math.min(0.6, v * 0.3);
  m.pernas[0].rotation.x = passo;
  m.pernas[1].rotation.x = -passo;
  const alvo = ini.bote > 0.35 ? -2.7 : ini.bote > 0 ? -0.5 : -0.6 + Math.sin(ini.tempo * 2) * 0.05;
  m.braco.rotation.x += (alvo - m.braco.rotation.x) * Math.min(1, (ini.bote > 0 && ini.bote < 0.35 ? 30 : 8) * dt);
  ini.emissivoBase = ini.bote > 0.35 ? 0x3a0a2a : 0x000000;
}

export const TIPOS_PESADELO = {
  sombra: {
    vida: 2, raio: 0.6, altura: 1.6, pontos: 80, modelo: modeloSombra, cor: 0x3a1a5a, voa: true, visao: 11, visaoY: 4, semGiro: true,
    agir: agirSombra, animar: animarSombra,
  },
  olho: {
    vida: 2, raio: 0.55, altura: 1.1, pontos: 80, modelo: modeloOlho, cor: 0xf0e6ee, voa: true, visao: 13, visaoY: 6, semGiro: true,
    agir: agirOlho, animar: animarOlho,
  },
  espinhoso: {
    vida: 3, raio: 0.7, altura: 1.2, pontos: 90, modelo: modeloEspinhoso, cor: 0x4a1d6a, visao: 10, semGiro: true,
    agir: agirEspinhoso, animar: animarEspinhoso,
  },
  tentaculo: {
    vida: 3, raio: 0.6, altura: 2.4, pontos: 80, modelo: modeloTentaculo, cor: 0x5a1d7a, fixo: true, semGiro: true,
    agir: agirTentaculo, animar: animarTentaculo,
  },
  cavaleiro: {
    vida: 5, raio: 0.65, altura: 2.1, pontos: 130, modelo: modeloCavaleiro, cor: 0x4a5068, visao: 9, semGiro: true, peso: 0.4,
    agir: agirCavaleiro, animar: animarCavaleiro,
  },
};
