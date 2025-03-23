const CACHE_NAME = "v0.5.4"; // Обнови версию при изменениях
const STATIC_CACHE_NAME = `${CACHE_NAME}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_NAME}-dynamic`;
const MAX_DYNAMIC_CACHE_ITEMS = 50;
const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/manifest.json",
    "/includes/menu.html",
    "/html/protected/tip.html",
    "/html/protected/statistics.html",
    "/html/allowed/salary.html"
];

// Функция для лимитирования размера динамического кэша
const limitCacheSize = async (cacheName, maxItems) => {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
        await cache.delete(keys[0]);
        limitCacheSize(cacheName, maxItems);
    }
};

// Обработка сообщений от клиентов
self.addEventListener("message", (event) => {
    if (event.data?.type === "GET_VERSION") {
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                client.postMessage({ version: CACHE_NAME });
            });
        }).catch(err => console.error("[Service Worker] Ошибка при отправке версии:", err));
    }
});

self.addEventListener("install", (event) => {
    console.log("[Service Worker] Установка...");
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then(async (cache) => {
            try {
                await cache.addAll(FILES_TO_CACHE);
                console.log("[Service Worker] Файлы успешно закэшированы.");
            } catch (error) {
                console.error("[Service Worker] Ошибка при кэшировании:", error);
            }
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("[Service Worker] Активация...");
    event.waitUntil(
        caches.keys().then((cacheNames) => 
            Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== STATIC_CACHE_NAME && cache !== DYNAMIC_CACHE_NAME) {
                        console.log("[Service Worker] Удаление старого кэша:", cache);
                        return caches.delete(cache);
                    }
                    return Promise.resolve();
                })
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    if (!event.request.url.startsWith("http")) {
        return; // Игнорируем запросы, которые не идут через HTTP/HTTPS
    }

    // Проверка на API запросы - применяем стратегию Network First
    const isApiRequest = event.request.url.includes('/api/');
    
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Клонируем ответ для сохранения в кэше
                    const responseClone = response.clone();
                    caches.open(STATIC_CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                    });
                    return response;
                })
                .catch(() => {
                    console.warn("[Service Worker] Ошибка сети, загрузка из кэша:", event.request.url);
                    return caches.match("/index.html") || caches.match("/offline.html");
                })
        );
    } else if (isApiRequest) {
        // Network First стратегия для API запросов
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    const responseClone = response.clone();
                    caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                        cache.put(event.request, responseClone);
                        limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_ITEMS);
                    });
                    return response;
                })
                .catch(() => {
                    return caches.match(event.request);
                })
        );
    } else {
        // Stale-While-Revalidate стратегия для статических ресурсов
        event.respondWith(
            caches.match(event.request).then(cachedResponse => {
                // Возвращаем кэш сразу, если есть
                const fetchPromise = fetch(event.request)
                    .then(networkResponse => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
                            return networkResponse;
                        }
                        
                        const responseClone = networkResponse.clone();
                        caches.open(DYNAMIC_CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                            limitCacheSize(DYNAMIC_CACHE_NAME, MAX_DYNAMIC_CACHE_ITEMS);
                        });
                        
                        return networkResponse;
                    })
                    .catch(error => {
                        console.error("[Service Worker] Ошибка загрузки ресурса:", event.request.url, error);
                        return new Response("404 - Ресурс не найден", { status: 404 });
                    });
                
                return cachedResponse || fetchPromise;
            })
        );
    }
});

// Периодическое обновление кэша
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-cache') {
        event.waitUntil(
            caches.open(STATIC_CACHE_NAME).then(cache => {
                return cache.addAll(FILES_TO_CACHE);
            })
        );
    }
});

// Обработка фоновой синхронизации
self.addEventListener('sync', event => {
    if (event.tag === 'sync-data') {
        event.waitUntil(
            // Здесь можно добавить логику для синхронизации данных с сервером
            console.log('[Service Worker] Выполнение фоновой синхронизации')
        );
    }
});

self.addEventListener('message', event => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            cacheNames.forEach(cacheName => {
                caches.delete(cacheName);
            });
        });
    }
});

self.addEventListener("message", (event) => {
    if (event.data.type === "RELOAD_ALL") {
        self.clients.matchAll().then((clients) => {
            clients.forEach((client) => client.navigate(client.url));
        });
    }
});
//---------------
self.addEventListener('push', function(event) {
    const options = {
        body: 'New data has been added!',
        icon: 'icon.png',
        badge: 'badge.png'
    };
    event.waitUntil(
        self.registration.showNotification('GitHub Update', options)
    );
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow('https://staff.you.ge') // Change to your URL
    );
});
self.addEventListener('push', function(event) {
    const data = event.data.json();
    const options = {
        body: data.body,
        icon: 'icon.png'
    };
    event.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});