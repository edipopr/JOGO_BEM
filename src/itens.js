// Itens coletáveis (cristal, coração, estrela), checkpoints e portal de saída.
import * as THREE from 'three';

// ---------- Formas ----------
function formaCoracao() {
  const s = new THREE.Shape();
  s.moveTo(0, -0.35);
  s.bezierCurveTo(-0.1, -0.25, -0.45, -0.05, -0.45, 0.15);
  s.bezierCurveTo(-0.45, 0.38, -0.2, 0.45, 0, 0.28);
  s.bezierCurveTo(0.2, 0.45, 0.45, 0.38, 0.45, 0.15);
  s.bezierCurveTo(0.45, -0.05, 0.1, -0.25, 0, -0.35);
  return s;
}

function formaEstrela() {
  const s = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.2 : 0.48;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  return s;
}

function extrudar(forma) {
  const g = new THREE.ExtrudeGeometry(forma, {
    depth: 0.15, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1,
  });
  g.center();
  return g;
}

const matBrilhante = (cor) => new THREE.MeshLambertMaterial({ color: cor, emissive: cor, emissiveIntensity: 0.35, flatShading: true });

const GEOMETRIAS = {
  cristal: new THREE.OctahedronGeometry(0.32, 0),
  coracao: extrudar(formaCoracao()),
  estrela: extrudar(formaEstrela()),
};
const CORES_CRISTAL = [0x5ad1ff, 0xff6b9d, 0xb07dff, 0x7dff5a, 0xffd84a];
const MATERIAIS = {
  cristal: CORES_CRISTAL.map(matBrilhante),
  coracao: [matBrilhante(0xff3b5c)],
  estrela: [matBrilhante(0xffd84a)],
};
const COR_PARTICULA = { cristal: 0x5ad1ff, coracao: 0xff3b5c, estrela: 0xffd84a };
const ESCALA = { cristal: 1, coracao: 1, estrela: 1.3 };

// ---------- Itens ----------
export class GerenciadorItens {
  /** definicoes = [{ tipo: 'cristal'|'coracao'|'estrela', x, y, z }] — y = altura do chão */
  constructor(cena, definicoes) {
    this.lista = definicoes.map((d, i) => {
      const materiais = MATERIAIS[d.tipo];
      const malha = new THREE.Mesh(GEOMETRIAS[d.tipo], materiais[i % materiais.length]);
      malha.scale.setScalar(ESCALA[d.tipo]);
      malha.castShadow = true;
      cena.add(malha);
      return { tipo: d.tipo, base: new THREE.Vector3(d.x, d.y + 0.9, d.z), malha, ativo: true, fase: i * 0.7 };
    });
    this.tempo = 0;
    this.reiniciar();
  }

  total(tipo) {
    return this.lista.filter((i) => i.tipo === tipo).length;
  }

  reiniciar() {
    for (const item of this.lista) {
      item.ativo = true;
      item.malha.visible = true;
      item.malha.position.copy(item.base);
    }
  }

  /** Índices dos itens já coletados (para salvar). */
  coletados() {
    return this.lista.flatMap((item, i) => (item.ativo ? [] : [i]));
  }

  /** Esconde os itens já coletados numa partida salva. */
  restaurar(indices = []) {
    for (const i of indices) {
      const item = this.lista[i];
      if (item) { item.ativo = false; item.malha.visible = false; }
    }
  }

  /** aoColetar(tipo) é chamado quando o jogador pega um item. */
  atualizar(dt, jogador, particulas, aoColetar) {
    this.tempo += dt;
    const centro = jogador.posicao.y + 0.8;
    for (const item of this.lista) {
      if (!item.ativo) continue;
      item.malha.rotation.y += dt * 2.5;
      item.malha.position.y = item.base.y + Math.sin(this.tempo * 3 + item.fase) * 0.15;

      const dx = jogador.posicao.x - item.base.x, dz = jogador.posicao.z - item.base.z;
      const dy = centro - item.malha.position.y;
      if (dx * dx + dz * dz + dy * dy > 1.1 * 1.1) continue;
      if (item.tipo === 'coracao' && jogador.vida >= jogador.vidaMax) continue; // só pega se precisar

      item.ativo = false;
      item.malha.visible = false;
      particulas.explosao(item.malha.position, COR_PARTICULA[item.tipo], 12, 4);
      aoColetar(item.tipo);
    }
  }
}

// ---------- Checkpoints ----------
const MAT_MASTRO = new THREE.MeshLambertMaterial({ color: 0xdddddd, flatShading: true });
const MAT_BANDEIRA_OFF = new THREE.MeshLambertMaterial({ color: 0x8a8a8a, flatShading: true, side: THREE.DoubleSide });
const MAT_BANDEIRA_ON = new THREE.MeshLambertMaterial({ color: 0xff8a1f, emissive: 0xff8a1f, emissiveIntensity: 0.3, flatShading: true, side: THREE.DoubleSide });

export class Checkpoints {
  constructor(cena, posicoes) {
    this.lista = posicoes.map((p) => {
      const grupo = new THREE.Group();
      const mastro = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 2.4, 6), MAT_MASTRO);
      mastro.position.y = 1.2;
      mastro.castShadow = true;
      const bandeira = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.55, 3, 1), MAT_BANDEIRA_OFF);
      bandeira.position.set(0.46, 2.05, 0);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.2, 8), MAT_MASTRO);
      base.position.y = 0.1;
      grupo.add(mastro, bandeira, base);
      grupo.position.copy(p);
      cena.add(grupo);
      return { posicao: p.clone(), grupo, bandeira, ativo: false };
    });
    this.tempo = 0;
    this.ultimo = -1; // índice do último checkpoint tocado
  }

  /** Índices dos checkpoints ativos (para salvar). */
  ativos() {
    return this.lista.flatMap((c, i) => (c.ativo ? [i] : []));
  }

  /** Reacende checkpoints de uma partida salva. */
  restaurar(indices = [], ultimo = -1) {
    for (const i of indices) {
      const c = this.lista[i];
      if (c) { c.ativo = true; c.bandeira.material = MAT_BANDEIRA_ON; }
    }
    this.ultimo = ultimo;
  }

  reiniciar() {
    for (const c of this.lista) {
      c.ativo = false;
      c.bandeira.material = MAT_BANDEIRA_OFF;
    }
    this.ultimo = -1;
  }

  /** aoAtivar(posicao) é chamado quando o jogador toca um checkpoint novo. */
  atualizar(dt, jogador, particulas, aoAtivar) {
    this.tempo += dt;
    for (const c of this.lista) {
      c.bandeira.rotation.y = Math.sin(this.tempo * 4 + c.posicao.x) * (c.ativo ? 0.35 : 0.1);
      if (c.ativo) continue;
      const dx = jogador.posicao.x - c.posicao.x, dz = jogador.posicao.z - c.posicao.z;
      if (dx * dx + dz * dz < 1.6 * 1.6 && Math.abs(jogador.posicao.y - c.posicao.y) < 2) {
        c.ativo = true;
        c.bandeira.material = MAT_BANDEIRA_ON;
        this.ultimo = this.lista.indexOf(c);
        particulas.explosao(c.posicao.clone().setY(c.posicao.y + 2), 0xff8a1f, 18, 5);
        aoAtivar(c.posicao);
      }
    }
  }
}

// ---------- Portal de saída ----------
export class Portal {
  constructor(cena, posicao) {
    this.posicao = posicao.clone();
    this.grupo = new THREE.Group();
    this.anel = new THREE.Mesh(
      new THREE.TorusGeometry(1.3, 0.22, 8, 20),
      new THREE.MeshLambertMaterial({ color: 0xb07dff, emissive: 0x7a3cff, emissiveIntensity: 0.6, flatShading: true }),
    );
    this.miolo = new THREE.Mesh(
      new THREE.CircleGeometry(1.15, 20),
      new THREE.MeshBasicMaterial({ color: 0x5ad1ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    this.grupo.add(this.anel, this.miolo);
    this.grupo.position.set(posicao.x, posicao.y + 1.6, posicao.z);
    cena.add(this.grupo);
    this.tempo = 0;
    this.aberto = true;
  }

  /** Mostra ou esconde o portal (fechado até derrotar o chefão). */
  abrir(aberto = true) {
    this.aberto = aberto;
    this.grupo.visible = aberto;
  }

  /** Retorna true quando o jogador entra no portal. */
  atualizar(dt, jogador) {
    this.tempo += dt;
    if (!this.aberto) return false;
    this.grupo.rotation.y += dt * 0.8;
    this.anel.rotation.z += dt * 2;
    this.miolo.material.opacity = 0.45 + Math.sin(this.tempo * 4) * 0.15;
    const dx = jogador.posicao.x - this.posicao.x, dz = jogador.posicao.z - this.posicao.z;
    return dx * dx + dz * dz < 1.3 * 1.3 && Math.abs(jogador.posicao.y - this.posicao.y) < 2.5;
  }
}
