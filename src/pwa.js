// Web app instalável: registra o service worker e mostra o botão "Instalar app".

export function configurarApp() {
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => { /* sem offline, mas o jogo funciona */ });
  }

  const instalado = window.matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches ||
    window.navigator.standalone === true;
  if (instalado) return;

  const botao = document.getElementById('btn-instalar');
  const dicaIos = document.getElementById('dica-ios');
  let pedido = null;

  // Android / Chrome / Edge: o navegador avisa que dá para instalar
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    pedido = e;
    botao.classList.remove('oculto');
  });
  botao.addEventListener('click', async () => {
    if (!pedido) return;
    pedido.prompt();
    await pedido.userChoice;
    pedido = null;
    botao.classList.add('oculto');
  });
  window.addEventListener('appinstalled', () => botao.classList.add('oculto'));

  // iPhone / iPad: não existe botão automático, então mostramos como fazer
  const ehIos = /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ehIos) dicaIos.classList.remove('oculto');
}
