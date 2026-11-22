// Peças usadas pelos modelos e pelos movimentos dos inimigos.
import * as THREE from 'three';

export const matLambert = (cor, extra = {}) => new THREE.MeshLambertMaterial({ color: cor, flatShading: true, emissive: 0x000000, ...extra });
export const matBasico = (cor, extra = {}) => new THREE.MeshBasicMaterial({ color: cor, ...extra });

export function parte(geo, material, x, y, z, pai, sombra = true) {
  const m = new THREE.Mesh(geo, material);
  m.position.set(x, y, z);
  m.castShadow = sombra;
  pai.add(m);
  return m;
}

export function olhos(pai, y, z, separacao, tamanho, cor = 0xc6ff3d) {
  const matOlho = matBasico(cor);
  const matPupila = matBasico(0x111111);
  for (const x of [-separacao, separacao]) {
    const olho = parte(new THREE.SphereGeometry(tamanho, 6, 5), matOlho, x, y, z, pai, false);
    parte(new THREE.SphereGeometry(tamanho * 0.45, 5, 4), matPupila, 0, 0, tamanho * 0.75, olho, false);
  }
}

export function manchas(pai, lista, cor, tamanho) {
  const m = new THREE.MeshLambertMaterial({ color: cor, flatShading: true });
  for (const [x, y, z] of lista) parte(new THREE.SphereGeometry(tamanho, 5, 4), m, x, y, z, pai, false);
}

// ---------- Movimentos ----------
/** Voa/nada na direção de um ponto. */
export function voarPara(ini, x, y, z, velocidade, dt, resposta = 4) {
  const p = ini.posicao, v = ini.velocidade;
  const dx = x - p.x, dy = y - p.y, dz = z - p.z;
  const d = Math.hypot(dx, dy, dz) || 1;
  const f = Math.min(1, d / 0.8) * velocidade; // freia ao chegar
  const k = Math.min(1, resposta * dt);
  v.x += (dx / d * f - v.x) * k;
  v.y += (dy / d * f - v.y) * k;
  v.z += (dz / d * f - v.z) * k;
}

/** Fica passeando em círculos em volta de casa (nadando/voando). */
export function rondar(ini, dt, raio = 2.5, velocidade = 1.6) {
  const a = ini.tempo * 0.6 + ini.casa.x;
  voarPara(ini, ini.casa.x + Math.cos(a) * raio, ini.casa.y + Math.sin(ini.tempo * 1.3) * 0.4, ini.casa.z + Math.sin(a) * raio, velocidade, dt, 3);
}

/** Anda no chão para (x, z). */
export function andarPara(ini, x, z, velocidade, dt, resposta = 6) {
  const p = ini.posicao, v = ini.velocidade;
  const dx = x - p.x, dz = z - p.z, d = Math.hypot(dx, dz) || 1;
  const k = Math.min(1, resposta * dt), f = d < 0.2 ? 0 : velocidade;
  v.x += (dx / d * f - v.x) * k;
  v.z += (dz / d * f - v.z) * k;
}

/** Vira suavemente para a direção (dx, dz). */
export function virarPara(ini, dx, dz, dt, velocidade = 8) {
  const alvo = Math.atan2(dx, dz);
  const diff = Math.atan2(Math.sin(alvo - ini.angulo), Math.cos(alvo - ini.angulo));
  ini.angulo += diff * Math.min(1, velocidade * dt);
}
