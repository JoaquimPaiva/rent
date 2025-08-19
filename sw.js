const CACHE_NAME = 'rent-a-car-v1.1.1';
const STATIC_CACHE = 'rent-a-car-static-v1.1.1';
const DYNAMIC_CACHE = 'rent-a-car-dynamic-v1.1.1';

// Arquivos estáticos para cache imediato
const STATIC_FILES = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/novo-aluguer.html',
  '/editar-aluguer.html',
  '/veiculos.html',
  '/historico.html',
  '/terminados.html',
  '/rececao-veiculo.html',
  '/logout.html',
  '/offline.html',
  '/manifest.json',
  '/css/styles.css',
  '/js/auth.js',
  '/js/contract.js',
  '/js/editarAluguer.js',
  '/js/firebase.js',
  '/js/historico.js',
  '/js/inputs.js',
  '/js/loading.js',
  '/js/novoAluguer.js',
  '/js/forms.js',
  '/js/notifications.js',
  '/js/cache.js',
  '/js/analytics.js',
  '/js/rececaoVeiculo.js',
  '/js/terminados.js',
  '/js/theme.js',
  '/js/utils.js',
  '/js/veiculos.js',
  '/img/car.svg',
  '/img/edit.svg',
  '/img/favicon.ico',
  '/img/Icon-16x16.png',
  '/img/Icon-32x32.png',
  '/img/Icon-72x72.png',
  '/img/Icon-96x96.png',
  '/img/Icon-128x128.png',
  '/img/Icon-144x144.png',
  '/img/Icon-152x152.png',
  '/img/Icon-180x180.png',
  '/img/Icon-192x192.png',
  '/img/Icon-384x384.png',
  '/img/Icon-512x512.png',
  '/img/more-horizontal.svg',
  '/img/x-circle.svg',
  '/img/icons8-google.svg'
];

// Arquivos externos para cache dinâmico
const EXTERNAL_FILES = [
  // Alinhar com as versões usadas nas páginas (compat 9.23.0)
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/9.23.0/firebase-storage-compat.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdn.jsdelivr.net/npm/signature_pad@4.1.7/dist/signature_pad.umd.min.js'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Cache estático instalado:', STATIC_CACHE);
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return caches.open(DYNAMIC_CACHE);
      })
      .then((cache) => {
        console.log('Cache dinâmico instalado:', DYNAMIC_CACHE);
        return cache.addAll(EXTERNAL_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Erro durante instalação do cache:', error);
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Removendo cache antigo:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker ativado e pronto');
        return self.clients.claim();
      })
      .catch((error) => {
        console.error('Erro durante ativação do Service Worker:', error);
      })
  );
});

// Intercepta requisições
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  
  // Ignorar requisições para APIs externas
  if (url.origin !== location.origin && !url.pathname.startsWith('/')) {
    return;
  }
  
  // Estratégia Cache First para arquivos estáticos
  if (STATIC_FILES.includes(url.pathname) || url.pathname === '/') {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(request);
        })
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
    return;
  }
  
  // Estratégia Network First para outros recursos
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Se a resposta foi bem-sucedida, cache-a
        if (response.ok && response.status === 200) {
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, responseClone);
          }).catch((error) => {
            console.warn('Erro ao guardar no cache:', error);
          });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tenta servir do cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          // Se não encontrou no cache, serve a página offline
          return caches.match('/offline.html');
        });
      })
  );
});

// Sincronização em background
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Nova notificação do Rent-a-Car',
      icon: '/img/Icon-192x192.png',
      badge: '/img/Icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'Ver',
          icon: '/img/car.svg'
        },
        {
          action: 'close',
          title: 'Fechar',
          icon: '/img/x-circle.svg'
        }
      ]
    };

    event.waitUntil(self.registration.showNotification(data.title || 'Rent-a-Car', options));
  }
});

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('./dashboard.html'));
  } else if (event.action === 'close') {
    // Apenas fechar a notificação
  } else {
    // Clique na notificação principal
    event.waitUntil(clients.openWindow('./dashboard.html'));
  }
});

// Função para sincronização em background
async function doBackgroundSync() {
  try {
    // Aqui pode implementar sincronização de dados offline
    console.log('Sincronização em background iniciada');
  } catch (error) {
    console.error('Erro durante sincronização em background:', error);
  }
}

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
