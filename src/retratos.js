// Retratos 3D dos heróis para os cartões da seleção: fotografa o modelo de cada um, uma única vez.
import * as THREE from 'three';

const TAMANHO = 192; // pixels

/** Devolve { id: imagem (data URL) }. Se o aparelho não conseguir, devolve o que deu (os cartões ficam só com o nome). */
export function criarRetratos(personagens) {
  const fotos = {};
  let renderizador;
  try {
    renderizador = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderizador.setSize(TAMANHO, TAMANHO, false);
    const cena = new THREE.Scene();
    cena.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 2.2));
    const sol = new THREE.DirectionalLight(0xffffff, 1.8);
    sol.position.set(-2, 3, 4);
    cena.add(sol);
    const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 30);
    const caixa = new THREE.Box3(), centro = new THREE.Vector3(), tamanho = new THREE.Vector3();

    for (const [id, p] of Object.entries(personagens)) {
      const m = p.criarModelo();
      m.animar?.(0.4);
      m.grupo.rotation.y = 0.3;
      cena.add(m.grupo);
      m.grupo.updateMatrixWorld(true);
      // Enquadra a cabeça e um pedaço do peito
      caixa.setFromObject(m.cabeca);
      caixa.getCenter(centro);
      caixa.getSize(tamanho);
      centro.y = caixa.max.y - Math.min(tamanho.y, 1) * 0.55;
      const distancia = Math.max(Math.min(tamanho.y, 1), tamanho.x) * 1.3 / (2 * Math.tan(THREE.MathUtils.degToRad(14)));
      camera.position.set(centro.x, centro.y + 0.1, centro.z + distancia);
      camera.lookAt(centro.x, centro.y, centro.z);
      renderizador.render(cena, camera);
      fotos[id] = renderizador.domElement.toDataURL('image/png');
      cena.remove(m.grupo);
      m.grupo.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    }
  } catch (erro) {
    console.warn('Retratos dos heróis indisponíveis:', erro);
  } finally {
    renderizador?.dispose();
    renderizador?.forceContextLoss(); // libera a memória de vídeo
  }
  return fotos;
}
