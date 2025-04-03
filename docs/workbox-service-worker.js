// Импортируем библиотеки Workbox с CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Версия для управления кэшем
const VERSION = "v2.0.0";

// Список URL-адресов для исключения из кэша
const EXCLUDED_URLS = [
  'waust.at/s.js',
  'google-analytics.com'
];

// Включаем логирование в режиме разработки
workbox.setConfig({ debug: false });

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
  { url: '/tip', revision: VERSION },
  { url: '/statistics', revision: VERSION },
  { url: '/shift', revision: VERSION },
  { url: '/salary', revision: VERSION }
];

// Предварительное кэширование
precacheAndRoute(filesToPrecache);

// Исключаем указанные URL из кэширования
registerRoute(
  ({ url }) => EXCLUDED_URLS.some(excludedUrl => url.href.includes(excludedUrl)),
  new NetworkFirst({
    cacheName: 'no-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

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

// Функция для логирования ошибок
function logError(error, context) {
  console.error(`[Service Worker] Ошибка в ${context}:`, error);
  // Отправляем ошибку в систему мониторинга, если она есть
  if (self.reportError) {
    self.reportError(error);
  }
}

// Обработка сообщений от клиентов
self.addEventListener('message', (event) => {
  if (event.data?.type === 'GET_VERSION') {
    self.clients.matchAll()
      .then(clients => {
        clients.forEach(client => {
          if (client && typeof client.postMessage === 'function') {
            try {
              client.postMessage({ version: VERSION });
            } catch (err) {
              logError(err, 'отправка версии клиенту');
            }
          }
        });
      })
      .catch(err => logError(err, 'получение списка клиентов'));
  }
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting()
      .catch(err => logError(err, 'пропуск ожидания'));
  }
});

// Обработка синхронизации
self.addEventListener('sync', event => {
  if (event.tag === 'syncData') {
    event.waitUntil(syncData().catch(err => logError(err, 'синхронизация данных')));
  }
});

// Функция для синхронизации данных
async function syncData() {
  try {
    console.log('Начало фоновой синхронизации данных');
    // Здесь логика синхронизации данных
    await new Promise(resolve => setTimeout(resolve, 1000)); // Имитация работы
    console.log('Синхронизация данных успешно завершена');
  } catch (error) {
    logError(error, 'функция syncData');
    throw error; // Пробрасываем ошибку дальше для обработки в обработчике события
  }
} 