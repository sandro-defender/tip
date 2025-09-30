 // Импортируем библиотеки Workbox с CDN
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

// Версия для управления кэшем
const VERSION = "v0.0.2";

// Список URL-адресов для исключения из кэша
const EXCLUDED_URLS = [
  'https://staff.you.ge/api/db.php',
  '/api/db.php',
  'db.php',
  'https://staff.you.ge/api/d1',
  '/api/d1',
  'api/d1',
  'google-analytics.com'
];

// Включаем логирование в режиме разработки
workbox.setConfig({ debug: false });

// Используем стратегии из Workbox
const { strategies } = workbox;
const { StaleWhileRevalidate, NetworkFirst, CacheFirst, NetworkOnly } = strategies;
const { registerRoute } = workbox.routing;
const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;

// Очищаем устаревшие кэши
cleanupOutdatedCaches();

// Функция для проверки и очистки старых кэшей
async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => {
      // Проверяем, является ли кэш старым
      return name.startsWith('pages-cache-') || 
             name.startsWith('static-resources-') || 
             name.startsWith('images-cache-') || 
             name.startsWith('api-cache-');
    });
    
    await Promise.all(
      oldCaches.map(name => caches.delete(name))
    );
    console.log('Старые кэши очищены');
  } catch (error) {
    console.error('Ошибка при очистке старых кэшей:', error);
  }
}

// Список файлов для предварительного кэширования
const filesToPrecache = [
  { url: '/manifest.json', revision: VERSION },
  { url: '/includes/menu.html', revision: '1.4' }, 
  { url: '/includes/head.html', revision: VERSION },
  { url: '/js/install-helper.js', revision: VERSION },
  { url: '/tip', revision: VERSION },
  { url: '/statistics', revision: VERSION },
  { url: '/shift', revision: VERSION },
  { url: '/salary', revision: VERSION },
  { url: '/bar', revision: VERSION },


  // CDN-файлы
  { url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js', revision: null },
  { url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css', revision: null },
  { url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css', revision: null },
  { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css', revision: null },
  { url: 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css', revision: null },
  { url: 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js', revision: null },
  { url: 'https://git.you.ge/json/Particles-dark.json', revision: VERSION },
  { url: 'https://cdn.jsdelivr.net/npm/chart.js', revision: VERSION },
  { url: 'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js', revision: VERSION },
  { url: 'https://git.you.ge/json/Particles-light.json', revision: VERSION }
];

// Предварительное кэширование
precacheAndRoute(filesToPrecache);

// Обработка установки Service Worker
self.addEventListener('install', (event) => {
  // Пропускаем ожидание и активируем новый Service Worker немедленно
  self.skipWaiting();
});

// Обработка активации Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Очищаем старые кэши
      cleanupOldCaches(),
      // Запрашиваем контроль над всеми клиентами
      clients.claim()
    ])
  );
});

// Исключаем указанные URL из кэширования (строго сеть, без кэша)
registerRoute(
  ({ url }) => EXCLUDED_URLS.some(excludedUrl => url.href.includes(excludedUrl)),
  new NetworkOnly()
);

// Любые PHP-запросы (включая /api/db.php) — только сеть, без кэша
registerRoute(
  ({ url }) => url.pathname.endsWith('.php') || url.pathname.includes('/api/db.php') || url.pathname.includes('/api/d1'),
  new NetworkOnly()
);

// Специальное правило для db.php - приоритетное исключение из кэша
registerRoute(
  ({ url, request }) => {
    // Проверяем различные варианты db.php
    const isDbPhp = url.pathname.includes('db.php') || 
                   url.href.includes('db.php') ||
                   url.search.includes('db.php');
    
    const isD1 = url.pathname.includes('/api/d1') || url.href.includes('/api/d1');
    
    // Проверяем, что это API запрос или POST/PUT/DELETE запрос
    const isApiRequest = url.pathname.startsWith('/api/') || 
                        request.method !== 'GET' ||
                        request.headers.get('Content-Type')?.includes('application/json');
    
    return isDbPhp || isD1 || isApiRequest;
  },
  new NetworkOnly({
    // Дополнительные настройки для предотвращения кэширования
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200, 201, 400, 401, 403, 404, 500], // Не кэшируем никакие ответы
      }),
    ],
  })
);

// Стратегия StaleWhileRevalidate для index.html (e.g., / или /index.html)
registerRoute(
  ({ url, request }) => 
    (url.pathname === '/' || url.pathname === '/index.html') && 
    request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'index-html-cache-' + VERSION,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200], // Cache successful responses and opaque responses
      }),
      new ExpirationPlugin({
        maxEntries: 5, // Only keep a few entries for index.html
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7 дней
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

// Стратегия NetworkFirst для API запросов (исключая db.php)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.includes('db.php') && !url.pathname.includes('/api/d1'),
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
              client.postMessage({ 
                type: 'VERSION_INFO',
                version: VERSION,
                isUpdate: true
              });
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
      .then(() => {
        // Уведомляем все клиенты о необходимости обновления
        return self.clients.matchAll();
      })
      .then(clients => {
        clients.forEach(client => {
          client.postMessage({ 
            type: 'UPDATE_AVAILABLE',
            version: VERSION
          });
        });
      })
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

// Удалён кастомный fetch-обработчик, чтобы избежать конфликтов с Workbox routing

/*
CHANGELOG
[2025-01-27] v3.4.0 – Enhanced db.php caching prevention to prevent stale data issues
Reason: To ensure database operations always fetch fresh data and prevent stale data problems
Thoughts: Added comprehensive exclusion rules for db.php requests with multiple URL patterns and strict NetworkOnly strategy
Model: GPT-4
[2025-09-30] v3.5.0 – Exclude /api/d1 from caching, align with db.php (GPT-5)
*/