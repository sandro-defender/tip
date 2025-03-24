// Импортируем библиотеки Workbox с CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Версия для управления кэшем
const VERSION = "v1.0.0";

// Включаем логирование в режиме разработки
workbox.setConfig({ debug: true });

// Используем стратегии из Workbox
const { strategies } = workbox;
const { StaleWhileRevalidate, NetworkFirst, CacheFirst } = strategies;
const { registerRoute } = workbox.routing;
const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

// Очищаем устаревшие кэши
cleanupOutdatedCaches();

// Список файлов для предварительного кэширования
const filesToPrecache = [
  { url: '/', revision: VERSION },
  { url: '/index.html', revision: VERSION },
  { url: '/manifest.json', revision: VERSION },
  { url: '/includes/menu.html', revision: VERSION },
  { url: '/includes/head.html', revision: VERSION },
  { url: '/salary.html', revision: VERSION }
];

// Предварительное кэширование
precacheAndRoute(filesToPrecache);

// Стратегия NetworkFirst для HTML запросов
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'pages-cache-' + VERSION,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
      }),
    ],
  })
);

// Стратегия StaleWhileRevalidate для JavaScript и CSS файлов
registerRoute(
  ({ request }) => 
    request.destination === 'script' || 
    request.destination === 'style',
  new StaleWhileRevalidate({
    cacheName: 'static-resources-' + VERSION,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
      }),
    ],
  })
);

// Стратегия CacheFirst для изображений
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache-' + VERSION,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 дней
      }),
    ],
  })
);

// Стратегия NetworkFirst для API запросов
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache-' + VERSION,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 1 * 24 * 60 * 60, // 1 день
      }),
    ],
  })
);

// Обработка сообщений от клиентов
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({ version: VERSION });
      });
    }).catch(err => console.error("[Service Worker] Ошибка при отправке версии:", err));
  }
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Обработка синхронизации
self.addEventListener('sync', event => {
  if (event.tag === 'syncData') {
    event.waitUntil(syncData());
  }
});

// Функция для синхронизации данных
async function syncData() {
  // Здесь логика синхронизации данных
  console.log('Выполняется фоновая синхронизация данных');
} 