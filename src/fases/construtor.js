// Ferramentas para montar fases: ilhas, blocos, plataformas móveis, trampolins e decoração.
import * as THREE from 'three';

/** Gerador aleatório com semente (o cenário sai sempre igual). */
export function aleatorio(semente) {
  return () => {
    semente = (semente * 16807) % 2147483647;
    return (semente - 1) / 2147483646;
  };
}

export class ConstrutorFase {
  constructor(cena, semente = 1) {
    this.cena = cena;
    this.caixas = [];            // tudo que é sólido (THREE.Box3)
    this.plataformasMoveis = [];
    this.trampolins = new Set(); // caixas que fazem quicar
    this.sorte = aleatorio(semente);
    this.tempo = 0;
    this._materiais = new Map();
    this._delta = new THREE.Vector3();
  }

  material(cor) {
    if (!this._materiais.has(cor)) {
      this._materiais.set(cor, new THREE.MeshLambertMaterial({ color: cor, flatShading: true }));
    }
    return this._materiais.get(cor);
  }

  malha(geo, cor, x, y, z, sombra = true) {
    const m = new THREE.Mesh(geo, this.material(cor));
    m.position.set(x, y, z);
    m.castShadow = sombra;
    m.receiveShadow = true;
    this.cena.add(m);
    return m;
  }

  // ---------- Céu e luz ----------
  luzes({ ceu = 0x7ec8ff, nevoa = [45, 110] } = {}) {
    this.cena.background = new THREE.Color(ceu);
    this.cena.fog = new THREE.Fog(ceu, nevoa[0], nevoa[1]);
    this.cena.add(new THREE.HemisphereLight(0xffffff, 0x4a7a3a, 1.1));
    const sol = new THREE.DirectionalLight(0xfff2d6, 1.6);
    sol.castShadow = true;
    sol.shadow.mapSize.set(1024, 1024);
    Object.assign(sol.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 100 });
    this.cena.add(sol, sol.target);
    this.sol = sol;
  }

  // ---------- Sólidos ----------
  /** Caixa sólida. (x, z) = centro; topo = altura da face de cima. */
  bloco(x, z, topo, larg, prof, alt, cor) {
    const m = this.malha(new THREE.BoxGeometry(larg, alt, prof), cor, x, topo - alt / 2, z);
    const caixa = new THREE.Box3().setFromObject(m);
    this.caixas.push(caixa);
    return { malha: m, caixa };
  }

  /** Ilha de terra com grama em cima. */
  ilha(x, z, topo, larg, prof, { alt = 4, grama = 0x6fd14f, terra = 0x9b6a3c } = {}) {
    this.malha(new THREE.BoxGeometry(larg, alt - 0.3, prof), terra, x, topo - 0.3 - (alt - 0.3) / 2, z, false);
    this.malha(new THREE.BoxGeometry(larg, 0.3, prof), grama, x, topo - 0.15, z, false);
    const caixa = new THREE.Box3(
      new THREE.Vector3(x - larg / 2, topo - alt, z - prof / 2),
      new THREE.Vector3(x + larg / 2, topo, z + prof / 2),
    );
    this.caixas.push(caixa);
    return caixa;
  }

  /** Plataforma que vai e volta. eixo 'x' ou 'z'; amplitude em metros; velocidade em rad/s. */
  plataformaMovel(x, z, topo, larg, prof, cor, { eixo = 'x', amplitude = 4, velocidade = 1, fase = 0 } = {}) {
    const { malha, caixa } = this.bloco(x, z, topo, larg, prof, 0.6, cor);
    this.plataformasMoveis.push({ malha, caixa, base: malha.position.clone(), eixo, amplitude, velocidade, fase });
  }

  /** Cogumelo gigante que faz quicar bem alto. topo = altura do chapéu. */
  trampolim(x, z, chao, cor = 0xff3b9d) {
    const topo = chao + 0.7;
    this.malha(new THREE.CylinderGeometry(0.35, 0.45, 0.6, 8), 0xfff3d6, x, chao + 0.3, z);
    const chapeu = this.malha(new THREE.SphereGeometry(1.2, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), cor, x, topo - 0.45, z);
    chapeu.scale.y = 0.4;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2;
      this.malha(new THREE.SphereGeometry(0.16, 6, 4), 0xffffff, x + Math.cos(a) * 0.7, topo - 0.12, z + Math.sin(a) * 0.7, false);
    }
    const caixa = new THREE.Box3(new THREE.Vector3(x - 1.1, topo - 0.7, z - 1.1), new THREE.Vector3(x + 1.1, topo, z + 1.1));
    this.caixas.push(caixa);
    this.trampolins.add(caixa);
  }

  // ---------- Decoração ----------
  arvore(x, z, chao, { escura = false, infectada = false } = {}) {
    const s = this.sorte;
    const altTronco = 1.6 + s() * 1.2;
    this.bloco(x, z, chao + altTronco, 0.7, 0.7, altTronco, escura ? 0x5a3a20 : 0x8b5a2b);
    const cores = infectada ? [0x6a3f9a, 0x4f2f7a] : escura ? [0x1f6b3a, 0x2a5a3f] : [0x2fa84f, 0x3cc45a];
    const copa = this.malha(new THREE.IcosahedronGeometry(1.4 + s() * 0.6, 0), cores[s() > 0.5 ? 1 : 0], x, chao + altTronco + 1, z);
    copa.rotation.y = s() * 3;
  }

  /** Espalha árvores num retângulo, pulando os pontos onde evitar(x, z) é verdadeiro. */
  arvoresEm(minX, maxX, minZ, maxZ, chao, quantidade, evitar = () => false, opcoes = {}) {
    let feitas = 0;
    for (let tentativas = 0; feitas < quantidade && tentativas < quantidade * 20; tentativas++) {
      const x = minX + this.sorte() * (maxX - minX), z = minZ + this.sorte() * (maxZ - minZ);
      if (evitar(x, z)) continue;
      this.arvore(x, z, chao, opcoes);
      feitas++;
    }
  }

  cogumelo(x, z, chao) {
    const s = this.sorte;
    this.malha(new THREE.CylinderGeometry(0.1, 0.14, 0.4, 6), 0xfff3d6, x, chao + 0.2, z, false);
    this.malha(new THREE.SphereGeometry(0.35, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), s() > 0.5 ? 0xff3b3b : 0xb07dff, x, chao + 0.38, z, false);
  }

  arbusto(x, z, chao) {
    const m = this.malha(new THREE.IcosahedronGeometry(0.6 + this.sorte() * 0.3, 0), 0x3cc45a, x, chao + 0.35, z);
    m.scale.y = 0.7;
  }

  flor(x, z, chao) {
    const cores = [0xff6b9d, 0xffd84a, 0xffffff, 0xb07dff];
    this.malha(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 4), 0x2fa84f, x, chao + 0.15, z, false);
    this.malha(new THREE.IcosahedronGeometry(0.09, 0), cores[Math.floor(this.sorte() * 4)], x, chao + 0.32, z, false);
  }

  // ---------- A cada quadro ----------
  /** Move as plataformas e carrega quem está em cima. foco = posição para a sombra seguir. */
  atualizar(dt, corpos, foco) {
    this.tempo += dt;
    for (const p of this.plataformasMoveis) {
      const desloc = Math.sin(this.tempo * p.velocidade + p.fase) * p.amplitude;
      const alvo = p.base[p.eixo] + desloc;
      this._delta.set(0, 0, 0);
      this._delta[p.eixo] = alvo - p.malha.position[p.eixo];
      p.malha.position.add(this._delta);
      p.caixa.translate(this._delta);
      for (const c of corpos) {
        if (c.apoio === p.caixa) c.posicao.add(this._delta);
      }
    }
    if (this.sol && foco) {
      this.sol.position.set(foco.x + 15, foco.y + 30, foco.z + 12);
      this.sol.target.position.copy(foco);
    }
  }
}
