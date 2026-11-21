// Web app instalável: service worker, atualização automática e botão "Instalar app".

/**
 * podeRecarregar(): true quando dá para recarregar sem atrapalhar (fora de uma partida).
 */
export function configurarApp({ podeRecarregar = () => true } = {}) {
  configurarAtualizacao(podeRecarregar);
  configurarInstalacao();
}

function configurarAtualizacao(podeRecarregar) {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const jaTinhaVersao = !!navigator.serviceWorker.controller; // false na 1ª instalação
  const aviso = document.getElementById('aviso-atualizacao');
  let recarregando = false;

  const recarregar = () => {
    if (recarregando) return;
    recarregando = true;
    location.reload();
  };
  aviso.addEventListener('click', recarregar);

  // Uma versão nova assumiu o controle: recarrega (ou avisa, se estiver jogando)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!jaTinhaVersao) return;
    if (podeRecarregar()) recarregar();
    else aviso.classList.remove('oculto');
  });

  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' })
    .then((registro) => {
      // Procura atualização ao voltar para o app e a cada 5 minutos
      const procurar = () => registro.update().catch(() => { /* sem internet */ });
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') procurar();
      });
      setInterval(procurar, 5 * 60 * 1000);
    })
    .catch(() => { /* sem offline, mas o jogo funciona */ });
}

function configurarInstalacao() {
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
