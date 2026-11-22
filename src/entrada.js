// Entrada do jogador: teclado, mouse e toque (joystick virtual).

export const ehToque = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;

export class Entrada {
  constructor(elementoJogo) {
    this.teclas = new Set();
    this.joystick = { x: 0, y: 0 };
    this.puloPedido = false;
    this.ataquePedido = false;
    this.giro = { x: 0, y: 0 }; // arrasto acumulado para a câmera

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') {
        if (!e.repeat) this.puloPedido = true;
        e.preventDefault();
      }
      if (e.code === 'KeyJ' && !e.repeat) this.ataquePedido = true;
      if (e.code === 'KeyK' && !e.repeat) this.habilidadePedida = true;
      if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) this.pausaPedida = true;
      this.teclas.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.teclas.delete(e.code));
    window.addEventListener('blur', () => this.teclas.clear());

    this._configurarArrastoCamera(elementoJogo);
    this._configurarJoystick();
    this._configurarBotoes();
  }

  /** Direção desejada: x = direita, y = frente. Comprimento máximo 1. */
  direcao() {
    const t = this.teclas;
    let x = 0, y = 0;
    if (t.has('KeyW') || t.has('ArrowUp')) y += 1;
    if (t.has('KeyS') || t.has('ArrowDown')) y -= 1;
    if (t.has('KeyD') || t.has('ArrowRight')) x += 1;
    if (t.has('KeyA') || t.has('ArrowLeft')) x -= 1;
    x += this.joystick.x;
    y += this.joystick.y;
    const tamanho = Math.hypot(x, y);
    if (tamanho > 1) { x /= tamanho; y /= tamanho; }
    return { x, y };
  }

  correndo() {
    return this.teclas.has('ShiftLeft') || this.teclas.has('ShiftRight') ||
      Math.hypot(this.joystick.x, this.joystick.y) > 0.92;
  }

  consumirPulo() {
    const p = this.puloPedido;
    this.puloPedido = false;
    return p;
  }

  consumirAtaque() {
    const a = this.ataquePedido;
    this.ataquePedido = false;
    return a;
  }

  consumirHabilidade() {
    const h = !!this.habilidadePedida;
    this.habilidadePedida = false;
    return h;
  }

  consumirPausa() {
    const p = !!this.pausaPedida;
    this.pausaPedida = false;
    return p;
  }

  consumirGiro() {
    const g = { ...this.giro };
    this.giro.x = 0; this.giro.y = 0;
    return g;
  }

  _configurarArrastoCamera(el) {
    let id = null, ultX = 0, ultY = 0;
    el.addEventListener('pointerdown', (e) => {
      if (id !== null) return;
      id = e.pointerId; ultX = e.clientX; ultY = e.clientY;
      el.setPointerCapture(id);
    });
    el.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      this.giro.x += e.clientX - ultX;
      this.giro.y += e.clientY - ultY;
      ultX = e.clientX; ultY = e.clientY;
    });
    const soltar = (e) => { if (e.pointerId === id) id = null; };
    el.addEventListener('pointerup', soltar);
    el.addEventListener('pointercancel', soltar);
  }

  _configurarJoystick() {
    const base = document.getElementById('joystick');
    const pino = document.getElementById('joystick-pino');
    const raio = 50;
    let id = null;

    const mover = (e) => {
      const r = base.getBoundingClientRect();
      let dx = e.clientX - (r.left + r.width / 2);
      let dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy);
      if (d > raio) { dx = dx / d * raio; dy = dy / d * raio; }
      pino.style.transform = `translate(${dx}px, ${dy}px)`;
      this.joystick.x = dx / raio;
      this.joystick.y = -dy / raio;
    };
    base.addEventListener('pointerdown', (e) => {
      id = e.pointerId;
      base.setPointerCapture(id);
      mover(e);
    });
    base.addEventListener('pointermove', (e) => { if (e.pointerId === id) mover(e); });
    const soltar = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      this.joystick.x = 0; this.joystick.y = 0;
      pino.style.transform = '';
    };
    base.addEventListener('pointerup', soltar);
    base.addEventListener('pointercancel', soltar);
  }

  _configurarBotoes() {
    document.getElementById('btn-pular').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.puloPedido = true;
    });
    document.getElementById('btn-atacar').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.ataquePedido = true;
    });
    document.getElementById('btn-poder').addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.habilidadePedida = true;
    });
  }
}
