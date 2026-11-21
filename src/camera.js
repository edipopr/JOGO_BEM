// Câmera em terceira pessoa que segue o jogador suavemente.
import * as THREE from 'three';

export class CameraSeguidora {
  constructor(camera) {
    this.camera = camera;
    this.angulo = 0;        // giro horizontal (rad); 0 = câmera atrás em +Z
    this.inclinacao = 0.45; // giro vertical (rad)
    this.distancia = 9;
    this.alturaAlvo = 1.3;  // altura do ponto para onde a câmera olha (acima dos pés)
    this.alvo = new THREE.Vector3();
    this._desejada = new THREE.Vector3();
  }

  aplicarGiro(dx, dy) {
    this.angulo -= dx * 0.006;
    this.inclinacao = THREE.MathUtils.clamp(this.inclinacao + dy * 0.004, 0.1, 1.2);
  }

  /** Vetores frente/direita no plano do chão, relativos à câmera. */
  eixos() {
    const s = Math.sin(this.angulo), c = Math.cos(this.angulo);
    return { frente: { x: -s, z: -c }, direita: { x: c, z: -s } };
  }

  atualizar(posJogador, dt, instantaneo = false) {
    const alvoDesejado = this._desejada.set(posJogador.x, posJogador.y + this.alturaAlvo, posJogador.z);
    const k = instantaneo ? 1 : 1 - Math.exp(-10 * dt);
    this.alvo.lerp(alvoDesejado, k);

    const ci = Math.cos(this.inclinacao);
    const destino = new THREE.Vector3(
      this.alvo.x + Math.sin(this.angulo) * ci * this.distancia,
      this.alvo.y + Math.sin(this.inclinacao) * this.distancia,
      this.alvo.z + Math.cos(this.angulo) * ci * this.distancia,
    );
    this.camera.position.lerp(destino, instantaneo ? 1 : 1 - Math.exp(-8 * dt));
    this.camera.lookAt(this.alvo);
  }
}
