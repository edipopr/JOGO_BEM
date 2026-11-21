// Service worker: guarda o jogo no aparelho para funcionar offline e busca atualizações.
// VERSAO: trocar antes de cada commit com  sh ferramentas/nova_versao.sh
// Ao criar um arquivo novo em src/, adicione-o em ARQUIVOS.
const VERSAO = 'guizinho-2026-11-21-140902';
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const ARQUIVOS = [
  './', 'index.html', 'styles.css', 'manifest.webmanifest',
  'icones/icone-192.png', 'icones/icone-512.png', 'icones/apple-touch-icon.png',
  'src/main.js', 'src/pwa.js', 'src/versao.js', 'src/audio.js', 'src/entrada.js', 'src/camera.js', 'src/jogador.js',
  'src/fisica.js', 'src/inimigo.js', 'src/particulas.js', 'src/itens.js', 'src/personagens.js',
  'src/projeteis.js', 'src/fases/construtor.js', 'src/fases/floresta.js',
  THREE_URL,
];
const TEMPO_MAX_REDE = 5000; // internet lenta: depois disso usa a cópia guardada

self.addEventListener('install', (e) => {
  // cache: 'reload' = baixa do servidor de verdade (ignora cópias velhas do navegador)
  e.waitUntil(
    caches.open(VERSAO)
      .then((c) => c.addAll(ARQUIVOS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== VERSAO).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function buscarNaRede(url) {
  return new Promise((resolver, rejeitar) => {
    const relogio = setTimeout(() => rejeitar(new Error('demorou')), TEMPO_MAX_REDE);
    // no-cache = sempre confere com o servidor se o arquivo mudou
    fetch(url, { cache: 'no-cache', credentials: 'same-origin' })
      .then((r) => { clearTimeout(relogio); resolver(r); })
      .catch((erro) => { clearTimeout(relogio); rejeitar(erro); });
  });
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = e.request.url;

  // Three.js (versão fixa): usa o que está guardado
  if (url === THREE_URL) {
    e.respondWith(caches.match(url).then((r) => r || fetch(e.request)));
    return;
  }
  if (!url.startsWith(self.location.origin)) return;

  // Arquivos do jogo: tenta a internet primeiro (pega atualizações), senão usa o guardado
  e.respondWith(
    buscarNaRede(url)
      .then((resposta) => {
        if (resposta.ok) {
          const copia = resposta.clone();
          caches.open(VERSAO).then((c) => c.put(e.request, copia));
        }
        return resposta;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true })),
  );
});
