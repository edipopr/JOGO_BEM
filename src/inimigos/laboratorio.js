// Criaturas do Laboratório Perdido:
//  drone    = robozinho voador que mantém distância e atira laser
//  caixinha = caixa disfarçada: parece uma caixa comum até você chegar perto... e morde!
//  robo     = robô-tanque que anda devagar e dispara rajadas de 3 tiros
import * as THREE from 'three';
import { som } from '../audio.js';
import { matLambert, matBasico, parte, olhos, voarPara, rondar, andarPara, virarPara } from './comum.js';

// ---------- Drone ----------
function modeloDrone() {
  const grupo = new THREE.Group();
  const material = matLambert(0x8fa3b8);
  const escuro = matLambert(0x2b3440), olho = matBasico(0xff2a2a);
  const corpo = parte(new THREE.SphereGeometry(0.42, 9, 7), material, 0, 0.45, 0, grupo);
  parte(new THREE.TorusGeometry(0.44, 0.08, 6, 16), escuro, 0, 0, 0, corpo).rotation.x = Math.PI / 2;
  parte(new THREE.SphereGeometry(0.17, 8, 6), olho, 0, 0.02, 0.34, corpo, false);
  const helices = [-1, 1].map((s) => {
    parte(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 5), escuro, s * 0.5, 0.2, 0, corpo).rotation.z = s * -0.6;
    return parte(new THREE.BoxGeometry(0.75, 0.03, 0.1), escuro, s * 0.62, 0.4, 0, corpo, false);
  });
  parte(new THREE.CylinderGeometry(0.07, 0.07, 0.3, 6), escuro, 0, -0.3, 0.25, corpo).rotation.x = Math.PI / 2;
  return { grupo, corpo, material, helices, olho };
}

function agirDrone(ini, dt, c) {
  ini.tempoAcao -= dt;
  if (!c.vendo) { rondar(ini, dt, 2, 1.5); return; }
  const j = c.jogador.posicao;
  virarPara(ini, c.dx, c.dz, dt, 8);
  // fica a ~5 m do herói, girando devagar em volta dele
  const a = Math.atan2(-c.dx, -c.dz) + 0.5;
  voarPara(ini, j.x + Math.sin(a) * 5, j.y + 1.5 + Math.sin(ini.tempo * 2) * 0.2, j.z + Math.cos(a) * 5, 2.6, dt, 3);
  if (ini.tempoAcao <= 0) {
    ini.tempoAcao = 2.4 + Math.random() * 0.5;
    const origem = ini.centro().clone();
    const alvo = new THREE.Vector3(j.x, j.y + c.jogador.altura * 0.5, j.z);
    som.efeito('choque');
    c.projeteis.disparar({ origem, direcao: alvo.sub(origem), velocidade: 9, dono: 'inimigo', cor: 0xff3b3b, raio: 0.18, duracao: 2 });
  }
}

function animarDrone(ini, dt) {
  for (const h of ini.m.helices) h.rotation.y += dt * 30;
  ini.m.corpo.rotation.z = Math.sin(ini.tempo * 3) * 0.1;
  ini.m.olho.color.setHex(ini.tempoAcao < 0.5 ? 0xffffff : 0xff2a2a); // pisca antes de atirar
}

// ---------- Caixinha ----------
function modeloCaixinha() {
  const grupo = new THREE.Group();
  const material = matLambert(0xb98a4a);
  const corpo = new THREE.Group();
  grupo.add(corpo);
  parte(new THREE.BoxGeometry(0.95, 0.5, 0.95), material, 0, 0.25, 0, corpo);
  parte(new THREE.BoxGeometry(0.97, 0.06, 0.2), matLambert(0x8a6230), 0, 0.4, 0, corpo, false);
  const tampa = new THREE.Group();
  tampa.position.set(0, 0.5, -0.47);
  corpo.add(tampa);
  const cima = parte(new THREE.BoxGeometry(0.95, 0.4, 0.95), material, 0, 0.2, 0.47, tampa);
  olhos(cima, 0.02, 0.48, 0.2, 0.13, 0xff3b6b);
  const dente = matBasico(0xffffff);
  for (let i = 0; i < 5; i++) {
    parte(new THREE.ConeGeometry(0.07, 0.2, 4), dente, -0.34 + i * 0.17, -0.2, 0.44, cima, false).rotation.x = Math.PI;
    parte(new THREE.ConeGeometry(0.07, 0.2, 4), dente, -0.25 + i * 0.14, 0.56, 0.42, corpo, false);
  }
  return { grupo, corpo, material, tampa, cima };
}

function agirCaixinha(ini, dt, c) {
  const v = ini.velocidade;
  if (!ini.revelada && (c.dist < 4.5 && c.dy < 2.5 || ini.vida < ini.cfg.vida || ini.invocado)) { // surpresa!
    ini.revelada = true;
    ini.tempoAcao = 0.5;
    som.efeito('cuspe');
  }
  if (!ini.revelada) { v.x *= 0.8; v.z *= 0.8; return; }
  if (!c.vendo && c.distCasa < 1 && !ini.invocado && c.dist > 12) { ini.revelada = false; return; }
  if (!ini.noChao) return;
  v.x *= 0.8; v.z *= 0.8;
  virarPara(ini, c.dx, c.dz, dt, 8);
  ini.tempoAcao -= dt;
  if (ini.tempoAcao > 0) return;
  ini.tempoAcao = 0.7 + Math.random() * 0.4;
  const casa = !c.vendo && !ini.invocado;
  const dx = casa ? ini.casa.x - ini.posicao.x : c.dx, dz = casa ? ini.casa.z - ini.posicao.z : c.dz, d = Math.hypot(dx, dz) || 1;
  v.set(dx / d * 4.6, 6.5, dz / d * 4.6);
}

function animarCaixinha(ini) {
  const abre = ini.revelada ? -0.5 - Math.abs(Math.sin(ini.tempo * 8)) * 0.5 : 0;
  ini.m.tampa.rotation.x += (abre - ini.m.tampa.rotation.x) * 0.3;
  const e = ini.noChao ? 1 : 1.12;
  ini.m.corpo.scale.set(1 / Math.sqrt(e), e, 1 / Math.sqrt(e));
  for (const o of ini.m.cima.children) if (o.geometry.type === 'SphereGeometry') o.visible = !!ini.revelada;
}

// ---------- Robô-tanque ----------
function modeloRobo() {
  const grupo = new THREE.Group();
  const material = matLambert(0x5f7a3f);
  const escuro = matLambert(0x2b2b2b), visor = matBasico(0xffb02e);
  for (const s of [-1, 1]) {
    parte(new THREE.BoxGeometry(0.3, 0.4, 1.2), escuro, s * 0.5, 0.2, 0, grupo);
    for (let i = -1; i <= 1; i++) parte(new THREE.CylinderGeometry(0.16, 0.16, 0.34, 8), matLambert(0x777777), s * 0.5, 0.2, i * 0.4, grupo, false).rotation.z = Math.PI / 2;
  }
  const corpo = parte(new THREE.BoxGeometry(0.85, 0.65, 0.8), material, 0, 0.72, 0, grupo);
  parte(new THREE.BoxGeometry(0.6, 0.4, 0.55), material, 0, 0.52, 0, corpo);
  parte(new THREE.BoxGeometry(0.48, 0.14, 0.04), visor, 0, 0.55, 0.28, corpo, false);
  const canos = [-0.25, 0.25].map((x) => {
    const c = parte(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 7), escuro, x, 0.05, 0.6, corpo);
    c.rotation.x = Math.PI / 2;
    return c;
  });
  parte(new THREE.SphereGeometry(0.07, 6, 4), matBasico(0xff2a2a), 0, 0.85, 0, corpo, false);
  return { grupo, corpo, material, canos };
}

function agirRobo(ini, dt, c) {
  ini.tempoAcao -= dt;
  if (!c.vendo) {
    ini.tiros = 0;
    const a = ini.tempo * 0.4;
    andarPara(ini, ini.casa.x + Math.cos(a) * 2, ini.casa.z + Math.sin(a) * 2, 1, dt);
    const v = ini.velocidade;
    if (Math.hypot(v.x, v.z) > 0.2) virarPara(ini, v.x, v.z, dt, 4);
    return;
  }
  virarPara(ini, c.dx, c.dz, dt, 5);
  const perto = c.dist < 4 ? -1.2 : c.dist > 7 ? 1.6 : 0;
  andarPara(ini, ini.posicao.x + c.dx / c.dist * perto * 2, ini.posicao.z + c.dz / c.dist * perto * 2, Math.abs(perto), dt);
  if (ini.tempoAcao <= 0) {
    ini.tiros = (ini.tiros || 0) + 1;
    ini.tempoAcao = ini.tiros >= 3 ? 2.6 : 0.28; // rajada de 3
    if (ini.tiros >= 3) ini.tiros = 0;
    const lado = ini.tiros % 2 ? 0.25 : -0.25;
    const s = Math.sin(ini.angulo), co = Math.cos(ini.angulo);
    const origem = new THREE.Vector3(ini.posicao.x + s * 0.9 + co * lado, ini.posicao.y + 0.78, ini.posicao.z + co * 0.9 - s * lado);
    const alvo = new THREE.Vector3(c.jogador.posicao.x, c.jogador.posicao.y + 0.7, c.jogador.posicao.z);
    som.efeito('ataque_projetil');
    c.projeteis.disparar({ origem, direcao: alvo.sub(origem), velocidade: 8.5, dono: 'inimigo', cor: 0xffd84a, raio: 0.17, duracao: 1.8 });
  }
}

function animarRobo(ini) {
  ini.m.corpo.position.y = 0.72 + Math.sin(ini.tempo * 12) * 0.015;
  for (const c of ini.m.canos) c.position.z = 0.6 - (ini.tempoAcao > 0.2 && ini.tiros > 0 ? 0.08 : 0);
}

export const TIPOS_LABORATORIO = {
  drone: {
    vida: 2, raio: 0.5, altura: 0.9, pontos: 70, modelo: modeloDrone, cor: 0x8fa3b8, voa: true, visao: 13, visaoY: 6, semGiro: true,
    agir: agirDrone, animar: animarDrone,
  },
  caixinha: {
    vida: 2, raio: 0.55, altura: 1, pontos: 50, modelo: modeloCaixinha, cor: 0xb98a4a, visao: 11, semGiro: true,
    agir: agirCaixinha, animar: animarCaixinha,
  },
  robo: {
    vida: 4, raio: 0.75, altura: 1.5, pontos: 100, modelo: modeloRobo, cor: 0x5f7a3f, visao: 12, semGiro: true,
    agir: agirRobo, animar: animarRobo,
  },
};
