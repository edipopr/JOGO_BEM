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

  // ---------- Pesadelo ----------
  /** Poça de gosma: infecta quem pisa (fases com infeccao). */
  poca(x, z, chao, raio = 1.6) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(raio, 18), new THREE.MeshLambertMaterial({ color: 0x9dff3d, emissive: 0x4a8a0a, transparent: true, opacity: 0.75 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, chao + 0.04, z);
    this.cena.add(m);
    (this.pocas ||= []).push({ m, x, z, chao, raio });
  }

  /** Árvore seca e torta. */
  arvoreMorta(x, z, chao) {
    const s = this.sorte, cor = s() > 0.5 ? 0x3a2834 : 0x2c1f2e;
    const alt = 2.6 + s() * 1.6;
    const tronco = this.malha(new THREE.CylinderGeometry(0.16, 0.42, alt, 6), cor, x, chao + alt / 2, z);
    tronco.rotation.z = (s() - 0.5) * 0.3;
    this.caixas.push(new THREE.Box3(new THREE.Vector3(x - 0.35, chao, z - 0.35), new THREE.Vector3(x + 0.35, chao + alt, z + 0.35)));
    for (let i = 0; i < 4; i++) {
      const a = s() * 6.28, c = 0.9 + s() * 0.9;
      const g = this.malha(new THREE.ConeGeometry(0.1, c, 4), cor, x + Math.cos(a) * 0.5, chao + alt * (0.6 + i * 0.12), z + Math.sin(a) * 0.5);
      g.rotation.set(Math.sin(a) * 1, 0, -Math.cos(a) * 1);
    }
  }

  /** Árvore com um olho que brilha. */
  olhoDeArvore(x, z, chao) {
    this.arvoreMorta(x, z, chao);
    const o = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), new THREE.MeshBasicMaterial({ color: 0xc6ff3d }));
    o.position.set(x, chao + 1.6, z + 0.3);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), new THREE.MeshBasicMaterial({ color: 0x0a0010 }));
    p.position.z = 0.17;
    o.add(p);
    this.cena.add(o);
    (this.olhosArvore ||= []).push(o);
  }

  /** Esporos roxos flutuando. */
  esporos(minX, maxX, minZ, maxZ, minY, maxY, quantidade = 100) {
    this.bolhas(minX, maxX, minZ, maxZ, minY, maxY, quantidade, 0xd08bff);
  }

  /** Bola de ferro que balança (pêndulo) atravessando o caminho em x. */
  pendulo(x, z, chao, { amplitude = 3, velocidade = 1.8, fase = 0 } = {}) {
    const g = new THREE.Group();
    const corda = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 6, 5), this.material(0x2a2a36));
    corda.position.y = -3;
    const bola = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), this.material(0x3a3a4a));
    bola.position.y = -6;
    bola.castShadow = true;
    for (const [dx, dy, dz, rx, rz] of [[0.95, 0, 0, 0, -1.57], [-0.95, 0, 0, 0, 1.57], [0, -0.95, 0, 3.14, 0], [0, 0, 0.95, 1.57, 0], [0, 0, -0.95, -1.57, 0]]) {
      const e = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 5), this.material(0xb8c4e0));
      e.position.set(dx, dy, dz);
      e.rotation.set(rx, 0, rz);
      bola.add(e);
    }
    g.add(corda, bola);
    g.position.set(x, chao + 7, z);
    this.cena.add(g);
    (this.pendulos ||= []).push({ g, x, z, chao, amplitude, velocidade, fase });
  }

  /** Tocha com fogo roxo. */
  tocha(x, y, z) {
    this.malha(new THREE.CylinderGeometry(0.08, 0.12, 0.7, 5), 0x3a2a1a, x, y, z, false);
    const fogo = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 6), new THREE.MeshBasicMaterial({ color: 0xff6bd0 }));
    fogo.position.set(x, y + 0.6, z);
    this.cena.add(fogo);
    (this.fogos ||= []).push(fogo);
  }

  /** Lua grande no céu (não recebe névoa). */
  lua(x, y, z, raio = 6, cor = 0xf4f1d0) {
    const lua = new THREE.Mesh(new THREE.SphereGeometry(raio, 16, 12), new THREE.MeshBasicMaterial({ color: cor, fog: false }));
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

  // ---------- Debaixo d'água ----------
  /** Bolhas que sobem por toda a área (efeito de água). */
  bolhas(minX, maxX, minZ, maxZ, minY, maxY, quantidade = 120, cor = 0xbfefff) {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(quantidade * 3);
    const base = [];
    for (let i = 0; i < quantidade; i++) {
      base.push({
        x: minX + this.sorte() * (maxX - minX), z: minZ + this.sorte() * (maxZ - minZ),
        y: this.sorte() * (maxY - minY), v: 0.6 + this.sorte() * 1.4, f: this.sorte() * 10,
      });
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pontos = new THREE.Points(geo, new THREE.PointsMaterial({ color: cor, size: 0.14, transparent: true, opacity: 0.6 }));
    pontos.frustumCulled = false;
    this.cena.add(pontos);
    (this.subidas ||= []).push({ pontos, base, minY, altura: maxY - minY });
  }

  /** Coluna de bolhas que empurra o herói para cima, de yBase até yTopo. */
  corrente(x, z, yBase, yTopo, raio = 2, forca = 6.5) {
    (this.correntes ||= []).push({
      caixa: new THREE.Box3(new THREE.Vector3(x - raio, yBase, z - raio), new THREE.Vector3(x + raio, yTopo, z + raio)), forca,
    });
    const tubo = new THREE.Mesh(
      new THREE.CylinderGeometry(raio, raio * 0.8, yTopo - yBase, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x8fe8ff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }),
    );
    tubo.position.set(x, (yBase + yTopo) / 2, z);
    this.cena.add(tubo);
    this.bolhas(x - raio * 0.8, x + raio * 0.8, z - raio * 0.8, z + raio * 0.8, yBase, yTopo, 70, 0xffffff);
    const ultima = this.subidas[this.subidas.length - 1];
    for (const b of ultima.base) b.v *= 4;
  }

  /** Alga comprida que balança. */
  alga(x, z, chao, alt = 3, cor = 0x1f8f5a) {
    const g = new THREE.Group();
    const n = Math.max(3, Math.round(alt / 1.1));
    let pai = g;
    const partes = [];
    for (let i = 0; i < n; i++) {
      const p = new THREE.Group();
      p.position.y = i === 0 ? 0 : alt / n;
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.34 * (1 - i / n * 0.6), alt / n, 0.08), this.material(cor));
      m.position.y = alt / n / 2;
      p.add(m);
      pai.add(p);
      pai = p;
      partes.push(p);
    }
    g.position.set(x, chao, z);
    g.rotation.y = this.sorte() * 3;
    this.cena.add(g);
    (this.algas ||= []).push({ partes, f: this.sorte() * 10 });
  }

  /** Coral ramificado colorido. */
  coral(x, z, chao, escala = 1, cor = null) {
    const s = this.sorte;
    const c = cor ?? [0xff6b7a, 0xff9d4d, 0xd66bff, 0x4de0c8][Math.floor(s() * 4)];
    for (let i = 0; i < 5; i++) {
      const alt = (0.5 + s() * 0.9) * escala;
      const m = this.malha(new THREE.CylinderGeometry(0.07 * escala, 0.13 * escala, alt, 5), c, x + (s() - 0.5) * 0.6 * escala, chao + alt / 2, z + (s() - 0.5) * 0.6 * escala, false);
      m.rotation.set((s() - 0.5) * 0.9, 0, (s() - 0.5) * 0.9);
      this.malha(new THREE.IcosahedronGeometry(0.14 * escala, 0), c, m.position.x, chao + alt, m.position.z, false);
    }
  }

  /** Pedra irregular (só decoração). */
  pedra(x, z, chao, tamanho = 1, cor = 0x4a5a6a) {
    const m = this.malha(new THREE.DodecahedronGeometry(tamanho, 0), cor, x, chao + tamanho * 0.4, z);
    m.rotation.set(this.sorte() * 3, this.sorte() * 3, 0);
    m.scale.y = 0.7;
  }

  // ---------- Laboratório ----------
  /** Esteira rolante: empurra quem pisa (vx, vz em m/s). */
  esteira(x, z, topo, larg, prof, { vx = 0, vz = 0 } = {}) {
    const { caixa } = this.bloco(x, z, topo, larg, prof, 0.5, 0x2b333a);
    const faixas = [];
    const aoLongoZ = vz !== 0;
    const n = Math.round((aoLongoZ ? prof : larg) / 1.5);
    for (let i = 0; i < n; i++) {
      const geo = aoLongoZ ? new THREE.BoxGeometry(larg * 0.9, 0.04, 0.35) : new THREE.BoxGeometry(0.35, 0.04, prof * 0.9);
      const m = new THREE.Mesh(geo, this.material(0xffd84a));
      m.position.set(x, topo + 0.02, z);
      this.cena.add(m);
      faixas.push(m);
    }
    (this.esteiras ||= []).push({ caixa, vx, vz, faixas, x, z, comp: aoLongoZ ? prof : larg, aoLongoZ });
  }

  /** Laser atravessado no caminho (liga e desliga). Dá para pular por cima. */
  laser(x, z, chao, larg, { ligado = 1.5, desligado = 1.5, fase = 0 } = {}) {
    const mats = [0.35, 0.75].map((y) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(larg, 0.09, 0.09), new THREE.MeshBasicMaterial({ color: 0xff2a4a, transparent: true, opacity: 0.9 }));
      m.position.set(x, chao + y, z);
      this.cena.add(m);
      return m;
    });
    (this.lasers ||= []).push({ mats, x, z, chao, larg, ligado, desligado, fase });
  }

  /** Tubo de vidro com uma criatura dentro. */
  tubo(x, z, chao, cor = 0x7dff3a) {
    this.bloco(x, z, chao + 0.5, 1.8, 1.8, 0.5, 0x2b333a);
    this.malha(new THREE.CylinderGeometry(0.85, 0.85, 0.4, 10), 0x2b333a, x, chao + 3.4, z);
    const vidro = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.7, 10, 1, true),
      new THREE.MeshLambertMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.35, transparent: true, opacity: 0.35, depthWrite: false }));
    vidro.position.set(x, chao + 1.85, z);
    const bicho = new THREE.Mesh(new THREE.IcosahedronGeometry(0.4, 0), new THREE.MeshLambertMaterial({ color: 0x5a2a8a, flatShading: true }));
    bicho.position.set(x, chao + 1.7, z);
    this.cena.add(vidro, bicho);
    this.caixas.push(new THREE.Box3(new THREE.Vector3(x - 0.75, chao, z - 0.75), new THREE.Vector3(x + 0.75, chao + 3.6, z + 0.75)));
    (this.bichos ||= []).push({ bicho, y: chao + 1.7, f: x + z });
  }

  /** Caixa de papelão (sólida). */
  caixote(x, z, chao) {
    this.bloco(x, z, chao + 1.1, 1.1, 1.1, 1.1, 0xb98a4a);
    this.malha(new THREE.BoxGeometry(1.12, 0.08, 0.24), 0x8a6230, x, chao + 1.08, z, false);
  }

  computador(x, z, chao, giro = 0) {
    this.bloco(x, z, chao + 1, 2.2, 0.8, 1, 0x3a4852);
    const g = new THREE.Group();
    const tela = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 0.1), this.material(0x1a2228));
    tela.position.y = 1.6;
    const brilho = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ color: 0x3affb0 }));
    brilho.position.set(0, 1.6, 0.06);
    g.add(tela, brilho);
    g.position.set(x, chao, z);
    g.rotation.y = giro;
    this.cena.add(g);
  }

  /** Faixa listrada amarela e preta no chão (beirada). */
  faixaPerigo(x, z, chao, larg) {
    const n = Math.round(larg / 0.9);
    for (let i = 0; i < n; i++) this.malha(new THREE.BoxGeometry(0.9, 0.03, 0.5), i % 2 ? 0x222222 : 0xffd84a, x - larg / 2 + 0.45 + i * 0.9, chao + 0.015, z, false);
  }

  /** Lasers (e, nas fases infectadas, poças): machucam o herói. */
  atualizarPerigos(dt, jogador) {
    const j = jogador.posicao;
    this._atualizarPerigosPesadelo(dt, jogador);
    for (const l of this.lasers || []) {
      const t = (this.tempo + l.fase + 100) % (l.ligado + l.desligado);
      const ligado = t < l.ligado;
      const aviso = !ligado && t > l.ligado + l.desligado - 0.4; // pisca antes de ligar
      for (const m of l.mats) {
        m.visible = ligado || (aviso && Math.floor(this.tempo * 20) % 2 === 0);
        m.material.opacity = ligado ? 0.95 : 0.35;
      }
      if (ligado && Math.abs(j.z - l.z) < jogador.raio + 0.05 && Math.abs(j.x - l.x) < l.larg / 2 && j.y < l.chao + 0.75 && j.y > l.chao - 1) {
        jogador.levarDano(j.x, l.z + (j.z > l.z ? -1 : 1), 5);
      }
    }
  }

  // (continuação de atualizarPerigos) poças e pêndulos
  _atualizarPerigosPesadelo(dt, jogador) {
    const j = jogador.posicao;
    for (const p of this.pocas || []) {
      if (Math.hypot(j.x - p.x, j.z - p.z) < p.raio && Math.abs(j.y - p.chao) < 0.3) jogador.infectar(26 * dt);
    }
    for (const p of this.pendulos || []) {
      const ang = Math.sin(this.tempo * p.velocidade + p.fase) * Math.asin(Math.min(0.95, p.amplitude / 6));
      const bx = p.x + Math.sin(ang) * 6, by = p.chao + 7 - Math.cos(ang) * 6;
      if (Math.hypot(j.x - bx, j.z - p.z) < 1.1 + jogador.raio && Math.abs(j.y + 0.8 - by) < 1.7) jogador.levarDano(bx, p.z, 8);
    }
  }

  // ---------- Arena de chefão ----------
  /**
   * Arena quadrada com muretas, paredes invisíveis e uma barreira na entrada (x -3 a 3, lado +Z).
   * criarParte(i) = malha de cada pedaço da barreira.
   */
  arenaChefao(x, z, topo, lado, { piso, terra, corMureta, criarParte, altura = 14 }) {
    const m = lado / 2;
    this.ilha(x, z, topo, lado, lado, { alt: altura, grama: piso, terra });
    this.bloco(x, z - m + 0.3, topo + 1.2, lado, 0.6, 1.2, corMureta);
    this.bloco(x - m + 0.3, z, topo + 1.2, 0.6, lado, 1.2, corMureta);
    this.bloco(x + m - 0.3, z, topo + 1.2, 0.6, lado, 1.2, corMureta);
    const largMureta = m - 3;
    for (const s of [-1, 1]) this.bloco(x + s * (3 + largMureta / 2), z + m - 0.3, topo + 1.2, largMureta, 0.6, 1.2, corMureta);
    const alto = topo + 20;
    this.parede(x, z - m - 0.2, topo, alto, lado, 0.6);
    this.parede(x - m - 0.2, z, topo, alto, 0.6, lado);
    this.parede(x + m + 0.2, z, topo, alto, 0.6, lado);
    for (const s of [-1, 1]) this.parede(x + s * (3 + largMureta / 2), z + m + 0.2, topo, alto, largMureta, 0.6);
    const g = new THREE.Group();
    for (let i = 0; i < 7; i++) {
      const p = criarParte(i);
      p.position.x = -2.85 + i * 0.95;
      p.position.y += 1.3;
      g.add(p);
    }
    g.position.set(x, topo, z + m - 0.3);
    g.visible = false;
    this.cena.add(g);
    return {
      arena: new THREE.Vector3(x, topo, z),
      barreira: { malha: g, caixa: new THREE.Box3(new THREE.Vector3(x - 3.2, topo, z + m - 0.7), new THREE.Vector3(x + 3.2, alto, z + m + 0.1)) },
    };
  }

  /** Coluna de pedra (sólida); quebrada = mais baixa, com pedaço caído. */
  coluna(x, z, chao, alt = 4, cor = 0x7a86a0) {
    this.bloco(x, z, chao + 0.4, 1.5, 1.5, 0.4, cor);
    this.malha(new THREE.CylinderGeometry(0.5, 0.58, alt, 8), cor, x, chao + alt / 2 + 0.3, z);
    this.malha(new THREE.BoxGeometry(1.3, 0.35, 1.3), cor, x, chao + alt + 0.4, z);
    this.caixas.push(new THREE.Box3(new THREE.Vector3(x - 0.5, chao, z - 0.5), new THREE.Vector3(x + 0.5, chao + alt, z + 0.5)));
  }

  /** Parede invisível (não deixa sair da arena). */
  parede(x, z, yBase, yTopo, larg, prof) {
    this.caixas.push(new THREE.Box3(new THREE.Vector3(x - larg / 2, yBase, z - prof / 2), new THREE.Vector3(x + larg / 2, yTopo, z + prof / 2)));
  }

  /**
   * Silhueta do castelo do Rei do Pesadelo ao longe. Fica sempre a no máximo 80 m da câmera, encolhida na
   * proporção (parece distante e vai crescendo) — assim a fase pode usar uma distância de visão curta.
   */
  casteloAoLonge(x, y, z, escala = 1, cor = 0x0a0618, corJanela = 0xff3bd0) {
    const g = new THREE.Group();
    const mat = new THREE.MeshBasicMaterial({ color: cor, fog: false });
    const matJanela = new THREE.MeshBasicMaterial({ color: corJanela, fog: false });
    const bloco = (geo, px, py, pz, m = mat) => {
      const b = new THREE.Mesh(geo, m);
      b.position.set(px, py, pz);
      g.add(b);
    };
    bloco(new THREE.BoxGeometry(34, 16, 6), 0, 8, 0);
    for (const [px, alt, r] of [[-17, 26, 4], [17, 26, 4], [-8, 34, 3.4], [9, 31, 3.4], [0, 44, 4.5]]) {
      bloco(new THREE.CylinderGeometry(r, r * 1.1, alt, 7), px, alt / 2, 0);
      bloco(new THREE.ConeGeometry(r * 1.35, r * 3, 7), px, alt + r * 1.4, 0);
      bloco(new THREE.BoxGeometry(1, 2, 0.4), px, alt * 0.8, r * 1.05, matJanela);
      bloco(new THREE.BoxGeometry(0.8, 1.6, 0.4), px, alt * 0.55, r * 1.1, matJanela);
    }
    for (let i = -3; i <= 3; i++) bloco(new THREE.BoxGeometry(2.4, 2.5, 6), i * 4.6, 17, 0); // ameias
    g.position.set(x, y, z);
    g.scale.setScalar(escala);
    this.cena.add(g);
    this.janelasCastelo = matJanela;
    this.castelo = { g, base: new THREE.Vector3(x, y, z), escala };
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
    for (const { pontos, base, minY, altura } of this.subidas || []) {
      const pos = pontos.geometry.attributes.position;
      base.forEach((b, i) => {
        pos.setXYZ(i, b.x + Math.sin(this.tempo * 1.3 + b.f) * 0.3, minY + (b.y + this.tempo * b.v) % altura, b.z + Math.cos(this.tempo + b.f) * 0.3);
      });
      pos.needsUpdate = true;
    }
    for (const e of this.esteiras || []) {
      const v = e.aoLongoZ ? e.vz : e.vx;
      e.faixas.forEach((m, i) => {
        const d = (((i * 1.5 + this.tempo * v) % e.comp) + e.comp) % e.comp - e.comp / 2;
        if (e.aoLongoZ) m.position.z = e.z + d * 0.94; else m.position.x = e.x + d * 0.94;
      });
      for (const c of corpos) if (c.apoio === e.caixa) { c.posicao.x += e.vx * dt; c.posicao.z += e.vz * dt; }
    }
    for (const p of this.pendulos || []) p.g.rotation.z = Math.sin(this.tempo * p.velocidade + p.fase) * Math.asin(Math.min(0.95, p.amplitude / 6));
    for (const p of this.pocas || []) p.m.scale.setScalar(1 + Math.sin(this.tempo * 2 + p.x) * 0.05);
    for (const fogo of this.fogos || []) fogo.scale.set(1, 0.85 + Math.sin(this.tempo * 12 + fogo.position.x * 3 + fogo.position.z) * 0.25, 1);
    if (foco) for (const o of this.olhosArvore || []) o.lookAt(foco.x, foco.y + 1, foco.z);
    for (const b of this.bichos || []) {
      b.bicho.position.y = b.y + Math.sin(this.tempo * 1.5 + b.f) * 0.3;
      b.bicho.rotation.y += dt;
    }
    for (const { partes, f } of this.algas || []) {
      partes.forEach((p, i) => { p.rotation.z = Math.sin(this.tempo * 1.2 + f + i * 0.6) * 0.14; });
    }
    if (this.castelo && foco) {
      const { g, base, escala } = this.castelo;
      const k = Math.min(1, 80 / Math.max(1, foco.z - base.z));
      g.position.lerpVectors(foco, base, k);
      g.scale.setScalar(escala * k);
    }
    if (this.lanterna && foco) this.lanterna.position.set(foco.x, foco.y + 3, foco.z + 1);
    if (this.sol && foco) {
      this.sol.position.set(foco.x + 15, foco.y + 30, foco.z + 12);
      this.sol.target.position.copy(foco);
    }
  }
}
