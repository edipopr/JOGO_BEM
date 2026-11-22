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
  /**
   * Dia (padrão) ou noite: ceu/nevoa = cor e distâncias; hemi = [céu, chão, intensidade];
   * sol = [cor, intensidade] (à noite, a luz da lua); lanterna = luz que acompanha o herói.
   */
  luzes({ ceu = 0x7ec8ff, nevoa = [45, 110], hemi = [0xffffff, 0x4a7a3a, 1.1], sol: corSol = [0xfff2d6, 1.6], lanterna = null } = {}) {
    this.cena.background = new THREE.Color(ceu);
    this.cena.fog = new THREE.Fog(ceu, nevoa[0], nevoa[1]);
    this.cena.add(new THREE.HemisphereLight(...hemi));
    if (lanterna) {
      this.lanterna = new THREE.PointLight(lanterna.cor, lanterna.intensidade, lanterna.distancia, 1.2);
      this.cena.add(this.lanterna);
    }
    const sol = new THREE.DirectionalLight(...corSol);
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

  // ---------- Decoração da noite ----------
  /** Cogumelo que brilha no escuro. */
  cogumeloBrilhante(x, z, chao, cor = 0x5af0ff, tamanho = 1) {
    if (!this._matBrilho) this._matBrilho = new Map();
    if (!this._matBrilho.has(cor)) {
      this._matBrilho.set(cor, new THREE.MeshLambertMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.9, flatShading: true }));
    }
    const t = tamanho;
    this.malha(new THREE.CylinderGeometry(0.1 * t, 0.14 * t, 0.5 * t, 6), 0xd8d0ff, x, chao + 0.25 * t, z, false);
    const chapeu = new THREE.Mesh(new THREE.SphereGeometry(0.38 * t, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), this._matBrilho.get(cor));
    chapeu.position.set(x, chao + 0.48 * t, z);
    this.cena.add(chapeu);
  }

  /** Formação de cristais brilhantes (só decoração). */
  cristais(x, z, chao, escala = 1, cor = 0x9f6bff) {
    if (!this._matCristal) this._matCristal = new Map();
    if (!this._matCristal.has(cor)) {
      this._matCristal.set(cor, new THREE.MeshLambertMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.45, flatShading: true }));
    }
    for (let i = 0; i < 4; i++) {
      const alt = (0.8 + this.sorte() * 1.4) * escala;
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.22 * escala + this.sorte() * 0.15 * escala, alt, 5), this._matCristal.get(cor));
      c.position.set(x + (this.sorte() - 0.5) * 0.9 * escala, chao + alt / 2 - 0.05, z + (this.sorte() - 0.5) * 0.9 * escala);
      c.rotation.set((this.sorte() - 0.5) * 0.6, this.sorte() * 3, (this.sorte() - 0.5) * 0.6);
      c.castShadow = true;
      this.cena.add(c);
    }
  }

  /** Lua grande no céu (não recebe névoa). */
  lua(x, y, z, raio = 6) {
    const lua = new THREE.Mesh(new THREE.SphereGeometry(raio, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf4f1d0, fog: false }));
    lua.position.set(x, y, z);
    const halo = new THREE.Mesh(new THREE.SphereGeometry(raio * 1.5, 16, 12),
      new THREE.MeshBasicMaterial({ color: 0xb8c8ff, transparent: true, opacity: 0.15, fog: false }));
    halo.position.copy(lua.position);
    this.cena.add(lua, halo);
  }

  /** Vagalumes piscando numa área (pontinhos amarelos que flutuam). */
  vagalumes(minX, maxX, minZ, maxZ, chao, quantidade = 40) {
    const pos = new Float32Array(quantidade * 3);
    const base = [];
    for (let i = 0; i < quantidade; i++) {
      const b = { x: minX + this.sorte() * (maxX - minX), y: chao + 0.5 + this.sorte() * 3, z: minZ + this.sorte() * (maxZ - minZ), f: this.sorte() * 10 };
      base.push(b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pontos = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xfff27a, size: 0.18, transparent: true, opacity: 0.9, fog: false }));
    pontos.frustumCulled = false;
    this.cena.add(pontos);
    if (!this.enxames) this.enxames = [];
    this.enxames.push({ pontos, base });
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
    for (const { pontos, base } of this.enxames || []) {
      const pos = pontos.geometry.attributes.position;
      base.forEach((b, i) => {
        const t = this.tempo * 0.7 + b.f;
        pos.setXYZ(i, b.x + Math.sin(t) * 0.8, b.y + Math.sin(t * 1.7) * 0.4, b.z + Math.cos(t * 0.8) * 0.8);
      });
      pos.needsUpdate = true;
      pontos.material.opacity = 0.65 + Math.sin(this.tempo * 3) * 0.3;
    }
    if (this.lanterna && foco) this.lanterna.position.set(foco.x, foco.y + 3, foco.z + 1);
    if (this.sol && foco) {
      this.sol.position.set(foco.x + 15, foco.y + 30, foco.z + 12);
      this.sol.target.position.copy(foco);
    }
  }
}
