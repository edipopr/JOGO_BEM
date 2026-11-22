// Efeitos de ataque reaproveitados pelos chefões:
//  Ondas   = anéis de choque no chão (pule!)
//  Quedas  = coisas que caem do alto ou são arremessadas em arco, com círculo de aviso no chão
//  Brotos  = coisas que brotam do chão (espinhos, tentáculos), com aviso
//  Feixe   = raio comprido que sai do chefão (com linha de aviso antes)
import * as THREE from 'three';
import { som } from '../audio.js';

const GEO_AVISO = new THREE.RingGeometry(0.8, 1, 28);
const matAviso = (cor) => new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.6, side: THREE.DoubleSide, depthWrite: false });

export class Ondas {
  constructor(cena, { cor = 0xc6ff3d, quantidade = 4, velocidade = 7.5, alcance = 12 } = {}) {
    this.velocidade = velocidade;
    this.alcance = alcance;
    this.lista = Array.from({ length: quantidade }, () => {
      const malha = new THREE.Mesh(
        new THREE.TorusGeometry(1, 0.2, 6, 48),
        new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85 }),
      );
      malha.rotation.x = Math.PI / 2;
      malha.visible = false;
      cena.add(malha);
      return { malha, raio: 0, ativa: false, x: 0, y: 0, z: 0 };
    });
  }

  soltar(x, y, z) {
    const o = this.lista.find((q) => !q.ativa);
    if (!o) return;
    Object.assign(o, { ativa: true, raio: 1.2, x, y, z, acertou: false });
    o.malha.visible = true;
  }

  limpar() { for (const o of this.lista) { o.ativa = false; o.malha.visible = false; } }

  atualizar(dt, jogador, tempo) {
    const j = jogador.posicao;
    for (const o of this.lista) {
      if (!o.ativa) continue;
      o.raio += this.velocidade * dt;
      o.malha.position.set(o.x, o.y + 0.25, o.z);
      o.malha.scale.set(o.raio, o.raio, 1 + Math.sin(tempo * 30) * 0.3);
      o.malha.material.opacity = 0.85 * Math.min(1, (this.alcance - o.raio) / 3);
      // Machuca quem está no chão quando a onda passa — pulando, ela passa por baixo
      const d = Math.hypot(j.x - o.x, j.z - o.z);
      if (!o.acertou && Math.abs(d - o.raio) < 0.6 && j.y - o.y < 0.45 && Math.abs(j.y - o.y) < 2) {
        if (jogador.levarDano(o.x, o.z, 4)) o.acertou = true;
      }
      if (o.raio > this.alcance) { o.ativa = false; o.malha.visible = false; }
    }
  }
}

export class Quedas {
  constructor(cena, particulas, { geometria, material, quantidade = 16, corAviso = 0xff3b6b, corExplosao = 0xffb02e, raio = 1.4, tempo = 1.1, arco = 5, sonora = false }) {
    Object.assign(this, { particulas, corExplosao, raio, tempo, arco, sonora });
    this.mat = matAviso(corAviso);
    this.lista = Array.from({ length: quantidade }, () => {
      const aviso = new THREE.Mesh(GEO_AVISO, this.mat);
      aviso.rotation.x = -Math.PI / 2;
      aviso.scale.setScalar(raio);
      const malha = new THREE.Mesh(geometria, material);
      aviso.visible = malha.visible = false;
      cena.add(aviso, malha);
      return { aviso, malha, ativo: false, t: 0, x: 0, y: 0, z: 0, origem: new THREE.Vector3(), emArco: false };
    });
  }

  /** origem = de onde é arremessado (arco); sem origem, cai do alto. */
  lancar(x, y, z, origem = null) {
    const q = this.lista.find((o) => !o.ativo);
    if (!q) return;
    Object.assign(q, { ativo: true, t: 0, x, y, z, acertou: false, emArco: !!origem });
    if (origem) q.origem.copy(origem);
    q.aviso.position.set(x, y + 0.06, z);
    q.aviso.visible = true;
    q.malha.visible = !!origem;
    if (origem) q.malha.position.copy(origem);
  }

  limpar() { for (const q of this.lista) { q.ativo = false; q.aviso.visible = q.malha.visible = false; } }

  atualizar(dt, jogador, tempo) {
    const j = jogador.posicao;
    this.mat.opacity = 0.45 + Math.sin(tempo * 18) * 0.25;
    for (const q of this.lista) {
      if (!q.ativo) continue;
      q.t += dt;
      const k = Math.min(1, q.t / this.tempo);
      if (q.emArco) {
        q.malha.position.set(
          q.origem.x + (q.x - q.origem.x) * k,
          q.origem.y + (q.y + 0.4 - q.origem.y) * k + Math.sin(k * Math.PI) * this.arco,
          q.origem.z + (q.z - q.origem.z) * k,
        );
      } else if (q.t > this.tempo - 0.35) {
        q.malha.visible = true;
        q.malha.position.set(q.x, q.y + 0.6 + (1 - Math.min(1, (q.t - this.tempo + 0.35) / 0.35)) * 10, q.z);
      }
      q.malha.rotation.x += dt * 5;
      q.malha.rotation.y += dt * 7;
      if (q.t >= this.tempo && !q.acertou) {
        q.acertou = true;
        this.particulas.explosao(new THREE.Vector3(q.x, q.y + 0.5, q.z), this.corExplosao, 14, 6);
        if (this.sonora) som.efeito('explosao');
        if (Math.hypot(j.x - q.x, j.z - q.z) < this.raio + 0.1 && Math.abs(j.y - q.y) < 2.2) jogador.levarDano(q.x, q.z, 3);
        if (q.emArco) q.malha.visible = false;
      }
      if (q.t > this.tempo + (q.emArco ? 0.05 : 0.4)) { q.ativo = false; q.aviso.visible = q.malha.visible = false; }
    }
  }
}

export class Brotos {
  constructor(cena, { geometria, material, quantidade = 40, corAviso = 0xff3b6b, altura = 1.8, raio = 0.85, aviso = 0.45, duracao = 0.7, balanca = 0 }) {
    Object.assign(this, { altura, raio, aviso, duracao, balanca });
    this.mat = matAviso(corAviso);
    this.lista = Array.from({ length: quantidade }, () => {
      const anel = new THREE.Mesh(GEO_AVISO, this.mat);
      anel.rotation.x = -Math.PI / 2;
      anel.scale.setScalar(raio);
      const malha = new THREE.Mesh(geometria, material);
      anel.visible = malha.visible = false;
      cena.add(anel, malha);
      return { anel, malha, ativo: false, t: 0, x: 0, y: 0, z: 0 };
    });
  }

  brotar(x, y, z, atraso = 0) {
    const e = this.lista.find((o) => !o.ativo);
    if (!e) return;
    Object.assign(e, { ativo: true, t: -atraso, x, y, z, acertou: false });
    e.anel.position.set(x, y + 0.06, z);
    e.malha.rotation.y = x + z;
  }

  limpar() { for (const e of this.lista) { e.ativo = false; e.anel.visible = e.malha.visible = false; } }

  atualizar(dt, jogador, tempo) {
    const j = jogador.posicao;
    this.mat.opacity = 0.45 + Math.sin(tempo * 18) * 0.25;
    const fim = this.aviso + this.duracao;
    for (const e of this.lista) {
      if (!e.ativo) continue;
      e.t += dt;
      if (e.t < 0) continue; // ainda não chegou a vez dele
      e.anel.visible = e.t < fim;
      e.malha.visible = e.t >= this.aviso;
      if (e.t >= this.aviso) {
        const sobe = Math.min(1, (e.t - this.aviso) / 0.1);
        const k = sobe * (e.t > fim - 0.15 ? Math.max(0, (fim - e.t) / 0.15) : 1);
        e.malha.position.set(e.x, e.y + this.altura * (k - 0.5), e.z);
        if (this.balanca) { e.malha.rotation.x = Math.sin(tempo * 8 + e.x) * this.balanca; e.malha.rotation.z = Math.cos(tempo * 7 + e.z) * this.balanca; }
        if (!e.acertou && k > 0.5 && Math.hypot(j.x - e.x, j.z - e.z) < this.raio && j.y - e.y < this.altura * 0.75 && j.y - e.y > -1) {
          if (jogador.levarDano(e.x, e.z, 4)) e.acertou = true;
        }
      }
      if (e.t > fim) { e.ativo = false; e.anel.visible = e.malha.visible = false; }
    }
  }
}

/** Raio comprido e reto, girado pelo ângulo do chefão. ligar(false) = só a linha de aviso; ligar(true) = machuca. */
export class Feixe {
  constructor(cena, { cor = 0xff2a2a, comprimento = 14, largura = 0.5 } = {}) {
    this.comprimento = comprimento;
    this.largura = largura;
    const geo = new THREE.BoxGeometry(1, 1, comprimento);
    geo.translate(0, 0, comprimento / 2);
    this.malha = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cor, transparent: true, opacity: 0.85, depthWrite: false }));
    this.malha.visible = false;
    cena.add(this.malha);
    this.ligado = false;
  }

  posicionar(x, y, z, angulo) {
    this.malha.position.set(x, y, z);
    this.malha.rotation.y = angulo;
  }

  avisar() { this.malha.visible = true; this.ligado = false; }
  ligar() { this.malha.visible = true; this.ligado = true; }
  limpar() { this.malha.visible = false; this.ligado = false; }

  atualizar(dt, jogador, tempo) {
    if (!this.malha.visible) return;
    const l = this.ligado ? this.largura * (1 + Math.sin(tempo * 40) * 0.2) : 0.06;
    this.malha.scale.set(l, l, 1);
    this.malha.material.opacity = this.ligado ? 0.85 : 0.4 + Math.sin(tempo * 25) * 0.25;
    if (!this.ligado) return;
    const p = this.malha.position, j = jogador.posicao, a = this.malha.rotation.y;
    const dx = j.x - p.x, dz = j.z - p.z;
    const frente = dx * Math.sin(a) + dz * Math.cos(a);
    const lado = Math.abs(dx * Math.cos(a) - dz * Math.sin(a));
    // pulando por cima do raio ele passa por baixo
    if (frente > 0 && frente < this.comprimento && lado < this.largura / 2 + jogador.raio && j.y < p.y + 0.2 && j.y + jogador.altura > p.y - 0.2) {
      jogador.levarDano(j.x - Math.sin(a), j.z - Math.cos(a), 3);
    }
  }
}

/** Estrelinhas de tontura (chefão cansado). */
export function criarTontura(pai, y, raio = 1) {
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xffe14a });
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const e = new THREE.Mesh(new THREE.OctahedronGeometry(0.22, 0), mat);
    e.position.set(Math.cos(a) * raio, 0, Math.sin(a) * raio);
    g.add(e);
  }
  g.position.y = y;
  g.visible = false;
  pai.add(g);
  return g;
}
