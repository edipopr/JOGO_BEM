// Projéteis: tiro explosivo do Mr. Fun BOT e bolas de gosma dos cogumelos cuspidores.
import * as THREE from 'three';
import { som } from './audio.js';

const RAIO_EXPLOSAO = 1.7;

export class Projeteis {
  constructor(cena) {
    this.cena = cena;
    this.lista = [];
    this.geometria = new THREE.IcosahedronGeometry(1, 1);
    this.materiais = new Map();
  }

  /** dono: 'jogador' (explode e acerta inimigos) ou 'inimigo' (machuca o jogador). */
  disparar({ origem, direcao, velocidade, dono, cor, raio = 0.25, dano = 1, duracao = 3 }) {
    let material = this.materiais.get(cor);
    if (!material) {
      material = new THREE.MeshBasicMaterial({ color: cor });
      this.materiais.set(cor, material);
    }
    const malha = new THREE.Mesh(this.geometria, material);
    malha.scale.setScalar(raio);
    malha.position.copy(origem);
    this.cena.add(malha);
    this.lista.push({
      malha, dono, raio, dano, cor, vida: duracao,
      vel: direcao.clone().normalize().multiplyScalar(velocidade),
    });
  }

  limpar() {
    for (const p of this.lista) this.cena.remove(p.malha);
    this.lista.length = 0;
  }

  atualizar(dt, jogador, inimigos, caixas, particulas) {
    for (let i = this.lista.length - 1; i >= 0; i--) {
      const p = this.lista[i];
      const pos = p.malha.position;
      pos.addScaledVector(p.vel, dt);
      p.malha.rotation.y += dt * 10;
      p.vida -= dt;

      let fim = p.vida <= 0 || caixas.some((c) => c.containsPoint(pos));
      if (!fim && p.dono === 'inimigo') {
        const dx = pos.x - jogador.posicao.x, dz = pos.z - jogador.posicao.z;
        const dy = pos.y - (jogador.posicao.y + jogador.altura / 2);
        if (Math.hypot(dx, dz) < p.raio + jogador.raio && Math.abs(dy) < jogador.altura / 2 + p.raio) {
          jogador.levarDano(pos.x - p.vel.x, pos.z - p.vel.z, 3); // empurrão leve (não derruba da borda)
          fim = true;
        }
      } else if (!fim && p.dono === 'jogador') {
        fim = inimigos.lista.some((ini) => ini.ativo &&
          pos.distanceTo(ini.centro()) < p.raio + ini.raio + 0.1);
      }

      if (fim) {
        if (p.dono === 'jogador') {
          inimigos.acertarArea(pos, RAIO_EXPLOSAO, p.dano, particulas);
          som.efeito('explosao');
          particulas.explosao(pos, p.cor, 14, 5);
        } else {
          particulas.explosao(pos, p.cor, 8, 3);
        }
        this.cena.remove(p.malha);
        this.lista.splice(i, 1);
      }
    }
  }
}
