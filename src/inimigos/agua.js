// Monstros de água (fase Mar do Pesadelo):
//  peixe       = peixe-lanterna dentuço: nada atrás do herói e dá botes
//  aguaviva    = água-viva elétrica: flutua devagar e solta choques em volta (brilha antes)
//  caranguejo  = caranguejo blindado: anda de lado e dá investidas com as garras
//  baiacu      = baiacu espinhento: infla e solta espinhos para todos os lados
import * as THREE from 'three';
import { som } from '../audio.js';
import { matLambert, matBasico, parte, olhos, voarPara, rondar, andarPara, virarPara } from './comum.js';

// ---------- Peixe-lanterna ----------
function modeloPeixe() {
  const grupo = new THREE.Group();
  const material = matLambert(0x1f6f86);
  const barbatana = matLambert(0x7a3cff), dente = matBasico(0xf2fff8), luz = matBasico(0xfff27a);
  const corpo = parte(new THREE.SphereGeometry(0.55, 9, 7), material, 0, 0.55, 0, grupo);
  corpo.scale.set(0.8, 0.85, 1.15);
  olhos(corpo, 0.2, 0.42, 0.28, 0.14, 0xff4df0);
  parte(new THREE.BoxGeometry(0.62, 0.1, 0.16), matBasico(0x1a0522), 0, -0.16, 0.46, corpo, false); // bocarra
  for (let i = 0; i < 5; i++) {
    const d = parte(new THREE.ConeGeometry(0.055, 0.2, 4), dente, -0.24 + i * 0.12, -0.13 + (i % 2 ? -0.08 : 0.02), 0.53, corpo, false);
    d.rotation.x = i % 2 ? 0 : Math.PI;
  }
  const rabo = new THREE.Group();
  rabo.position.z = -0.5;
  corpo.add(rabo);
  for (const s of [-1, 1]) {
    const r = parte(new THREE.ConeGeometry(0.2, 0.55, 4), barbatana, 0, s * 0.2, -0.22, rabo);
    r.rotation.x = -Math.PI / 2 + s * 0.6;
    r.scale.x = 0.35;
  }
  const dorso = parte(new THREE.ConeGeometry(0.22, 0.5, 4), barbatana, 0, 0.58, -0.1, corpo);
  dorso.scale.x = 0.3;
  const haste = parte(new THREE.CylinderGeometry(0.025, 0.03, 0.6, 4), material, 0, 0.72, 0.4, corpo);
  haste.rotation.x = 0.9;
  const lampada = parte(new THREE.SphereGeometry(0.12, 8, 6), luz, 0, 0.88, 0.7, corpo, false);
  return { grupo, corpo, material, rabo, lampada };
}

function agirPeixe(ini, dt, c) {
  ini.tempoAcao -= dt;
  if (c.vendo) {
    const alvoY = c.jogador.posicao.y + 0.4;
    if (ini.bote > 0) { // bote: dispara reto
      ini.bote -= dt;
    } else if (ini.tempoAcao <= 0 && c.dist < 5) {
      ini.tempoAcao = 2.4;
      ini.bote = 0.45;
      ini.velocidade.set(c.dx / c.dist * 7.5, (alvoY - ini.posicao.y) * 1.5, c.dz / c.dist * 7.5);
      som.efeito('bolha');
    } else {
      voarPara(ini, c.jogador.posicao.x, alvoY, c.jogador.posicao.z, 2.8, dt, 3);
    }
  } else {
    ini.bote = 0;
    rondar(ini, dt, 2.8, 1.8);
  }
}

function animarPeixe(ini) {
  const m = ini.m, rapido = ini.bote > 0 ? 26 : 9;
  m.rabo.rotation.y = Math.sin(ini.tempo * rapido) * 0.6;
  m.corpo.rotation.y = Math.sin(ini.tempo * rapido + 1) * 0.08;
  m.corpo.rotation.x = THREE.MathUtils.clamp(-ini.velocidade.y * 0.1, -0.5, 0.5);
  m.lampada.scale.setScalar(1 + Math.sin(ini.tempo * 6) * 0.25);
}

// ---------- Água-viva ----------
function modeloAguaviva() {
  const grupo = new THREE.Group();
  const material = matLambert(0xff6bd0, { transparent: true, opacity: 0.85 });
  const corpo = parte(new THREE.SphereGeometry(0.62, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), material, 0, 0.95, 0, grupo);
  parte(new THREE.SphereGeometry(0.3, 8, 6), matBasico(0xffd1f2), 0, 0.12, 0, corpo, false);
  olhos(corpo, 0.16, 0.5, 0.18, 0.11, 0x5af0ff);
  const tentaculos = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const t = new THREE.Group();
    t.position.set(Math.cos(a) * 0.38, 0.95, Math.sin(a) * 0.38);
    for (let j = 0; j < 3; j++) parte(new THREE.CylinderGeometry(0.06 - j * 0.015, 0.05 - j * 0.015, 0.34, 4), material, 0, -0.17 - j * 0.32, 0, t, false);
    grupo.add(t);
    tentaculos.push(t);
  }
  const choque = parte(new THREE.IcosahedronGeometry(1, 1), matBasico(0xffff7a, { wireframe: true, transparent: true, opacity: 0.8 }), 0, 0.7, 0, grupo, false);
  choque.visible = false;
  return { grupo, corpo, material, tentaculos, choque };
}

const RAIO_CHOQUE = 2.5;
function agirAguaviva(ini, dt, c) {
  ini.tempoAcao -= dt;
  const j = c.jogador.posicao;
  if (c.vendo) voarPara(ini, j.x, j.y + 0.5 + Math.sin(ini.tempo * 2) * 0.5, j.z, ini.tempoAcao < 0.7 ? 0.2 : 1.5, dt, 2);
  else voarPara(ini, ini.casa.x, ini.casa.y + Math.sin(ini.tempo * 0.9) * 1.1, ini.casa.z, 1, dt, 2);
  if (ini.tempoAcao <= 0) {
    ini.tempoAcao = 3 + Math.random() * 0.6;
    if (c.dist < 9) {
      ini.tempoChoque = 0.35;
      som.efeito('choque');
      const cy = ini.posicao.y + 0.7;
      if (Math.hypot(c.dx, c.dz) < RAIO_CHOQUE + 0.3 && Math.abs(j.y + 0.8 - cy) < 2.4) c.jogador.levarDano(ini.posicao.x, ini.posicao.z, 6);
    }
  }
}

function animarAguaviva(ini, dt) {
  const m = ini.m;
  const pulsa = Math.sin(ini.tempo * 4);
  m.corpo.scale.set(1 - pulsa * 0.08, 1 + pulsa * 0.14, 1 - pulsa * 0.08);
  m.tentaculos.forEach((t, i) => { t.rotation.x = Math.sin(ini.tempo * 3 + i) * 0.25; t.rotation.z = Math.cos(ini.tempo * 2.6 + i) * 0.25; });
  ini.tempoChoque = Math.max(0, (ini.tempoChoque || 0) - dt);
  const aviso = ini.tempoAcao < 0.7; // brilha antes do choque
  m.choque.visible = ini.tempoChoque > 0 || (aviso && Math.floor(ini.tempo * 14) % 2 === 0);
  m.choque.scale.setScalar(ini.tempoChoque > 0 ? RAIO_CHOQUE * (1 - ini.tempoChoque) + 0.6 : 0.9);
  m.choque.rotation.y += dt * 8;
  ini.emissivoBase = aviso ? 0x777700 : 0x2a0a20;
}

// ---------- Caranguejo ----------
function modeloCaranguejo() {
  const grupo = new THREE.Group();
  const material = matLambert(0xd9482b);
  const garra = matLambert(0xff7a4d), escuro = matLambert(0x5a1d14);
  const corpo = parte(new THREE.SphereGeometry(0.7, 9, 6), material, 0, 0.55, 0, grupo);
  corpo.scale.set(1.15, 0.6, 0.85);
  for (const [x, z] of [[0, 0], [-0.35, -0.15], [0.35, -0.15]]) parte(new THREE.ConeGeometry(0.13, 0.3, 5), escuro, x, 0.62, z, corpo);
  for (const x of [-0.2, 0.2]) parte(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 4), material, x, 0.95, 0.4, grupo);
  olhos(grupo, 1.18, 0.4, 0.2, 0.13, 0xfff27a);
  const pernas = [];
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const p = parte(new THREE.CylinderGeometry(0.06, 0.03, 0.6, 4), garra, s * 0.9, 0.3, -0.35 + i * 0.3, grupo);
    p.rotation.z = s * 0.6;
    pernas.push(p);
  }
  const garras = [-1, 1].map((s) => {
    const g = new THREE.Group();
    g.position.set(s * 0.75, 0.55, 0.5);
    parte(new THREE.SphereGeometry(0.3, 7, 5), garra, 0, 0, 0.25, g);
    for (const dy of [-0.12, 0.14]) {
      const ponta = parte(new THREE.ConeGeometry(0.13, 0.42, 4), garra, 0, dy, 0.58, g);
      ponta.rotation.x = Math.PI / 2 + dy * 1.6;
    }
    grupo.add(g);
    return g;
  });
  return { grupo, corpo, material, pernas, garras };
}

function agirCaranguejo(ini, dt, c) {
  ini.tempoAcao -= dt;
  if (!c.vendo) {
    ini.investida = 0;
    const a = ini.tempo * 0.5;
    andarPara(ini, ini.casa.x + Math.cos(a) * 2, ini.casa.z + Math.sin(a) * 2, 1.2, dt);
    return;
  }
  virarPara(ini, c.dx, c.dz, dt, ini.investida > 0 ? 0 : 8);
  if (ini.investida > 0) { // investida em linha reta
    ini.investida -= dt;
    ini.velocidade.x = Math.sin(ini.angulo) * 7.5;
    ini.velocidade.z = Math.cos(ini.angulo) * 7.5;
  } else if (ini.tempoAcao <= 0) {
    ini.tempoAcao = 2.3;
    ini.investida = 0.7;
  } else if (ini.tempoAcao < 0.6) { // prepara (para e levanta as garras)
    ini.velocidade.x *= 0.8; ini.velocidade.z *= 0.8;
  } else { // anda de lado em volta do herói
    const lado = Math.sin(ini.tempo * 0.7) > 0 ? 1 : -1;
    const px = -c.dz / c.dist * lado, pz = c.dx / c.dist * lado;
    const perto = c.dist > 5 ? 0.8 : 0;
    andarPara(ini, ini.posicao.x + (px + c.dx / c.dist * perto) * 3, ini.posicao.z + (pz + c.dz / c.dist * perto) * 3, 2.2, dt);
  }
}

function animarCaranguejo(ini) {
  const m = ini.m, v = Math.hypot(ini.velocidade.x, ini.velocidade.z);
  m.pernas.forEach((p, i) => { p.rotation.x = Math.sin(ini.tempo * 14 + i * 1.7) * Math.min(0.5, v * 0.2); });
  const ergue = ini.tempoAcao < 0.6 && !(ini.investida > 0) ? -0.8 : ini.investida > 0 ? 0 : -0.2;
  m.garras.forEach((g, i) => { g.rotation.x += (ergue + Math.sin(ini.tempo * 5 + i * 2) * 0.1 - g.rotation.x) * 0.2; });
}

// ---------- Baiacu ----------
function modeloBaiacu() {
  const grupo = new THREE.Group();
  const material = matLambert(0xe8b23a);
  const espinho = matLambert(0x6a2bb8);
  const corpo = parte(new THREE.IcosahedronGeometry(0.55, 1), material, 0, 0.6, 0, grupo);
  olhos(corpo, 0.16, 0.42, 0.22, 0.13, 0xffffff);
  parte(new THREE.TorusGeometry(0.11, 0.05, 5, 8), matLambert(0xff7aa8), 0, -0.1, 0.5, corpo, false); // biquinho
  const dir = new THREE.Vector3(), cima = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 18; i++) { // espinhos em espiral
    const y = 1 - (i / 17) * 2, r = Math.sqrt(1 - y * y), a = i * 2.4;
    dir.set(Math.cos(a) * r, y, Math.sin(a) * r);
    if (dir.z > 0.75) continue;
    const e = parte(new THREE.ConeGeometry(0.06, 0.28, 4), espinho, dir.x * 0.64, dir.y * 0.64, dir.z * 0.64, corpo, false);
    e.quaternion.setFromUnitVectors(cima, dir);
  }
  for (const s of [-1, 1]) {
    const b = parte(new THREE.ConeGeometry(0.16, 0.34, 4), espinho, s * 0.62, 0, 0, corpo);
    b.rotation.z = s * Math.PI / 2;
    b.scale.z = 0.3;
  }
  return { grupo, corpo, material };
}

function agirBaiacu(ini, dt, c) {
  rondar(ini, dt, 1.2, 0.9);
  const noAlcance = c.dist < 12 && c.dy < 5 && c.jogador.vida > 0;
  if (noAlcance) virarPara(ini, c.dx, c.dz, dt, 4);
  ini.tempoAcao -= dt;
  if (ini.tempoAcao > 0) return;
  ini.tempoAcao = 2.8;
  if (!noAlcance) return;
  som.efeito('cuspe');
  const origem = ini.centro().clone();
  const j = c.jogador.posicao;
  const base = Math.atan2(c.dx, c.dz);
  const subida = (j.y + 0.8 - origem.y) / Math.max(2, c.dist);
  for (let i = 0; i < 8; i++) {
    const a = base + (i / 8) * Math.PI * 2;
    c.projeteis.disparar({
      origem, direcao: new THREE.Vector3(Math.sin(a), subida, Math.cos(a)),
      velocidade: 6, dono: 'inimigo', cor: 0xd6a8ff, raio: 0.2, duracao: 2,
    });
  }
}

function animarBaiacu(ini) {
  const infla = ini.tempoAcao < 0.7 ? 1 + (0.7 - ini.tempoAcao) * 0.9 : 1 + Math.sin(ini.tempo * 3) * 0.04;
  ini.m.corpo.scale.setScalar(infla);
}

export const TIPOS_AGUA = {
  peixe: {
    vida: 2, raio: 0.6, altura: 1.1, pontos: 60, modelo: modeloPeixe, cor: 0x1f6f86, voa: true, visao: 11, visaoY: 5,
    agir: agirPeixe, animar: animarPeixe,
  },
  aguaviva: {
    vida: 2, raio: 0.6, altura: 1.5, pontos: 70, modelo: modeloAguaviva, cor: 0xff6bd0, voa: true, visao: 8, visaoY: 5, semGiro: true,
    agir: agirAguaviva, animar: animarAguaviva,
  },
  caranguejo: {
    vida: 4, raio: 0.8, altura: 1.1, pontos: 90, modelo: modeloCaranguejo, cor: 0xd9482b, visao: 10, semGiro: true,
    agir: agirCaranguejo, animar: animarCaranguejo,
  },
  baiacu: {
    vida: 3, raio: 0.65, altura: 1.2, pontos: 80, modelo: modeloBaiacu, cor: 0xe8b23a, voa: true, semGiro: true, fixo: true,
    agir: agirBaiacu, animar: animarBaiacu,
  },
};
