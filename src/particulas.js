// Efeitos de partículas simples (cubinhos que explodem e somem).
import * as THREE from 'three';

export class Particulas {
  constructor(cena) {
    this.cena = cena;
    this.lista = [];
    this.geometria = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    this.materiais = new Map();
  }

  explosao(posicao, cor, quantidade = 16, forca = 5) {
    let material = this.materiais.get(cor);
    if (!material) {
      material = new THREE.MeshBasicMaterial({ color: cor });
      this.materiais.set(cor, material);
    }
    for (let i = 0; i < quantidade; i++) {
      const malha = new THREE.Mesh(this.geometria, material);
      malha.position.copy(posicao);
      const a = Math.random() * Math.PI * 2;
      const f = forca * (0.5 + Math.random() * 0.7);
      const vida = 0.5 + Math.random() * 0.4;
      this.lista.push({
        malha, vida, vidaInicial: vida,
        vel: new THREE.Vector3(Math.cos(a) * f, f * (0.6 + Math.random() * 0.8), Math.sin(a) * f),
      });
      this.cena.add(malha);
    }
  }

  atualizar(dt) {
    for (let i = this.lista.length - 1; i >= 0; i--) {
      const p = this.lista[i];
      p.vida -= dt;
      if (p.vida <= 0) {
        this.cena.remove(p.malha);
        this.lista.splice(i, 1);
        continue;
      }
      p.vel.y -= 15 * dt;
      p.malha.position.addScaledVector(p.vel, dt);
      p.malha.rotation.x += dt * 8;
      p.malha.rotation.y += dt * 6;
      p.malha.scale.setScalar(p.vida / p.vidaInicial);
    }
  }
}
