// Física simples compartilhada: cilindro (raio, altura) contra caixas alinhadas aos eixos.
import * as THREE from 'three';

export const GRAVIDADE = -32;

/**
 * Move o corpo pela velocidade e resolve colisões.
 * corpo = { posicao: Vector3 (nos pés), velocidade: Vector3, raio, altura }
 * Retorna true se o corpo está apoiado no chão.
 */
export function moverComColisao(corpo, caixas, dt) {
  const p = corpo.posicao, v = corpo.velocidade;
  p.x += v.x * dt;
  p.z += v.z * dt;
  colisaoHorizontal(p, corpo.raio, corpo.altura, caixas);
  const yAnterior = p.y;
  p.y += v.y * dt;
  return colisaoVertical(p, v, corpo.raio, corpo.altura, caixas, yAnterior);
}

function colisaoHorizontal(p, raio, altura, caixas) {
  for (const c of caixas) {
    // Só colide lateralmente se o corpo estiver na altura da caixa
    if (p.y >= c.max.y - 0.01 || p.y + altura <= c.min.y) continue;
    const px = THREE.MathUtils.clamp(p.x, c.min.x, c.max.x);
    const pz = THREE.MathUtils.clamp(p.z, c.min.z, c.max.z);
    const dx = p.x - px, dz = p.z - pz;
    const d2 = dx * dx + dz * dz;
    if (d2 >= raio * raio) continue;
    if (d2 > 1e-8) {
      const d = Math.sqrt(d2);
      p.x = px + dx / d * raio;
      p.z = pz + dz / d * raio;
    } else {
      // Centro dentro da caixa: empurra pelo lado mais próximo
      const saidas = [
        [c.min.x - raio - p.x, 0], [c.max.x + raio - p.x, 0],
        [0, c.min.z - raio - p.z], [0, c.max.z + raio - p.z],
      ];
      saidas.sort((a, b) => Math.abs(a[0] + a[1]) - Math.abs(b[0] + b[1]));
      p.x += saidas[0][0];
      p.z += saidas[0][1];
    }
  }
}

function colisaoVertical(p, v, raio, altura, caixas, yAnterior) {
  const r = raio * 0.85; // um pouco menor para não "grudar" nas bordas
  let noChao = false;
  for (const c of caixas) {
    if (p.x + r <= c.min.x || p.x - r >= c.max.x || p.z + r <= c.min.z || p.z - r >= c.max.z) continue;
    if (v.y <= 0 && yAnterior >= c.max.y - 0.05 && p.y <= c.max.y) {
      p.y = c.max.y;
      v.y = 0;
      noChao = true;
    } else if (v.y > 0 && yAnterior + altura <= c.min.y + 0.01 && p.y + altura > c.min.y) {
      p.y = c.min.y - altura;
      v.y = 0;
    }
  }
  return noChao;
}
