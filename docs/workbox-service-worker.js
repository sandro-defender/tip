 // Workbox ბიბლიოთეკების CDN-დან იმპორტი
 importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.3.0/workbox-sw.js');

 // ვერსია კეშის მართვისთვის
 const VERSION = "v0.0.5";
 //const VERSION = '__VERSION__';
 //const VERSION = `${new Date().toISOString()}`; 
 //const CACHE_NAME = `my-cache-${VERSION}`;
 
 // URL-მისამართების სია კეშიდან გამორიცხვისთვის
 const EXCLUDED_URLS = [
   'https://staff.you.ge/api/db.php',
   'https://static.cloudflareinsights.com',
   '/api/db.php',
   'db.php',
   'https://staff.you.ge/api/d1',
   '/api/d1',
   'api/d1',
   'google-analytics.com'
 ];
 
 // ჩართვა განვითარების რეჟიმში
 workbox.setConfig({ debug: false });
 
 // Workbox-ის სტრატეგიების გამოყენება
 const { strategies } = workbox;
 const { StaleWhileRevalidate, NetworkFirst, CacheFirst, NetworkOnly } = strategies;
 const { registerRoute } = workbox.routing;
 const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
 const { ExpirationPlugin } = workbox.expiration;
 const { CacheableResponsePlugin } = workbox.cacheableResponse;
 
 // მოძველებული კეშების გაწმენდა
 cleanupOutdatedCaches();
 
 // ფუნქცია ძველი კეშების შემოწმებისა და გაწმენდისთვის
 async function cleanupOldCaches() {
   try {
     const cacheNames = await caches.keys();
     const oldCaches = cacheNames.filter(name => {
       // შევამოწმებთ არის თუ არა კეში ძველი
       return name.startsWith('pages-cache-') || 
              name.startsWith('static-resources-') || 
              name.startsWith('images-cache-') || 
              name.startsWith('api-cache-');
     });
     
     await Promise.all(
       oldCaches.map(name => caches.delete(name))
     );
     console.log('ძველი კეშები გაწმენდილია');
   } catch (error) {
     console.error('შეცდომა ძველი კეშების გაწმენდისას:', error);
   }
 }
 
 // ფაილების სია წინასწარი კეშირებისთვის
 const filesToPrecache = [
   { url: '/manifest.json', revision: VERSION },
   { url: '/includes/menu.html', revision: VERSION },
   { url: '/includes/head.html', revision: VERSION },
   { url: '/js/install-helper.js', revision: VERSION },
   { url: '/tip', revision: VERSION },
   { url: '/statistics', revision: VERSION },
   { url: '/shift', revision: VERSION },
   { url: '/salary', revision: VERSION },
   { url: '/bar', revision: VERSION },
 
 
   // CDN-ფაილები
   { url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js', revision: '5.1.3' },
   { url: 'https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css', revision: '5.1.3' },
   { url: 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.0/font/bootstrap-icons.css', revision: '1.10.0' },
   { url: 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css', revision: '6.0.0' },
   { url: 'https://unpkg.com/leaflet@1.9.3/dist/leaflet.css', revision: '1.9.3' },
   { url: 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js', revision: '2.0.0' },
   { url: 'https://cdn.jsdelivr.net/npm/chart.js', revision: '1.0' },
   { url: 'https://cdn.jsdelivr.net/npm/chart.js/dist/chart.umd.min.js', revision: '3.9.1' },
   { url: 'https://git.you.ge/json/Particles-dark.json', revision: VERSION },
   { url: 'https://git.you.ge/json/Particles-light.json', revision: VERSION }
 ];
 
 // წინასწარი კეშირება
 precacheAndRoute(filesToPrecache);
 
 // Service Worker-ის დაყენების დამუშავება
 self.addEventListener('install', (event) => {
   // გამოვტოვებთ ლოდინს და ახალ Service Worker-ს დაუყოვნებლივ ვაქტივირებთ
   self.skipWaiting();
 });
 
 // Service Worker-ის აქტივაციის დამუშავება
 self.addEventListener('activate', (event) => {
   event.waitUntil(
     Promise.all([
       // ვაწმენდთ ძველ კეშებს
       cleanupOldCaches(),
       // ვითხოვთ კონტროლს ყველა კლიენტზე
       clients.claim()
     ])
   );
 });
 
 // მითითებული URL-ების კეშირებიდან გამორიცხვა (მკაცრად ქსელი, კეშის გარეშე)
 registerRoute(
   ({ url }) => EXCLUDED_URLS.some(excludedUrl => url.href.includes(excludedUrl)),
   new NetworkOnly()
 );
 
 // ნებისმიერი PHP-მოთხოვნა (მათ შორის /api/db.php) — მხოლოდ ქსელი, კეშის გარეშე
 registerRoute(
   ({ url }) => url.pathname.endsWith('.php') || url.pathname.includes('/api/db.php') || url.pathname.includes('/api/d1'),
   new NetworkOnly()
 );
 
 // განსაკუთრებული წესი db.php-სთვის - კეშიდან პრიორიტეტული გამორიცხვა
 registerRoute(
   ({ url, request }) => {
     // ვამოწმებთ db.php-ის სხვადასხვა ვარიანტებს
     const isDbPhp = url.pathname.includes('db.php') || 
                    url.href.includes('db.php') ||
                    url.search.includes('db.php');
     
     const isD1 = url.pathname.includes('/api/d1') || url.href.includes('/api/d1');
     
     // ვამოწმებთ რომ ეს API მოთხოვნაა ან POST/PUT/DELETE მოთხოვნა
     const isApiRequest = url.pathname.startsWith('/api/') || 
                         request.method !== 'GET' ||
                         request.headers.get('Content-Type')?.includes('application/json');
     
     return isDbPhp || isD1 || isApiRequest;
   },
   new NetworkOnly({
     // დამატებითი პარამეტრები კეშირების თავიდან ასაცილებლად
     plugins: [
       new CacheableResponsePlugin({
         statuses: [0, 200, 201, 400, 401, 403, 404, 500], // არ ვკეშირებთ არცერთ პასუხს
       }),
     ],
   })
 );
 
 // StaleWhileRevalidate სტრატეგია index.html-ისთვის (მაგ., / ან /index.html)
 registerRoute(
   ({ url, request }) => 
     (url.pathname === '/' || url.pathname === '/index.html') && 
     request.mode === 'navigate',
   new StaleWhileRevalidate({
     cacheName: 'index-html-cache-' + VERSION,
     plugins: [
       new CacheableResponsePlugin({
         statuses: [0, 200], // წარმატებული პასუხების და გაუმჭვირვალე პასუხების კეშირება
       }),
       new ExpirationPlugin({
         maxEntries: 5, // მხოლოდ რამდენიმე ჩანაწერი index.html-ისთვის
         maxAgeSeconds: 7 * 24 * 60 * 60, // 7 დღე
       }),
     ],
   })
 );
 
 // NetworkFirst სტრატეგია HTML მოთხოვნებისთვის
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
         maxAgeSeconds: 30 * 24 * 60 * 60, // 30 დღე
       }),
     ],
   })
 );
 
 // StaleWhileRevalidate სტრატეგია JavaScript და CSS ფაილებისთვის
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
         maxAgeSeconds: 30 * 24 * 60 * 60, // 30 დღე
       }),
     ],
   })
 );
 
 // CacheFirst სტრატეგია სურათებისთვის
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
         maxAgeSeconds: 30 * 24 * 60 * 60, // 30 დღე
       }),
     ],
   })
 );
 
 // NetworkFirst სტრატეგია API მოთხოვნებისთვის (db.php-ს გამორიცხვით)
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
         maxAgeSeconds: 1 * 24 * 60 * 60, // 1 დღე
       }),
     ],
   })
 );
 
 // ფუნქცია შეცდომების ლოგირებისთვის
 function logError(error, context) {
   console.error(`[Service Worker] შეცდომა ${context}-ში:`, error);
   // ვაგზავნით შეცდომას მონიტორინგის სისტემაში, თუ არსებობს
   if (self.reportError) {
     self.reportError(error);
   }
 }
 
 // კლიენტებისგან მიღებული შეტყობინებების დამუშავება
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
               logError(err, 'ვერსიის კლიენტზე გაგზავნა');
             }
           }
         });
       })
       .catch(err => logError(err, 'კლიენტების სიის მიღება'));
   }
   
   if (event.data?.type === 'SKIP_WAITING') {
     self.skipWaiting()
       .then(() => {
         // ვაცნობთ ყველა კლიენტს განახლების აუცილებლობის შესახებ
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
       .catch(err => logError(err, 'ლოდინის გამოტოვება'));
   }
 });
 
 // სინქრონიზაციის დამუშავება
 self.addEventListener('sync', event => {
   if (event.tag === 'syncData') {
     event.waitUntil(syncData().catch(err => logError(err, 'მონაცემების სინქრონიზაცია')));
   }
 });
 
 
 // ფუნქცია მონაცემების სინქრონიზაციისთვის
 async function syncData() {
   try {
     console.log('მონაცემების ფონური სინქრონიზაციის დაწყება');
     // აქ მონაცემების სინქრონიზაციის ლოგიკა
     await new Promise(resolve => setTimeout(resolve, 1000)); // მუშაობის იმიტაცია
     console.log('მონაცემების სინქრონიზაცია წარმატებით დასრულდა');
   } catch (error) {
     logError(error, 'syncData ფუნქცია');
     throw error; // ვაგდებთ შეცდომას შემდგომი დამუშავებისთვის მოვლენის დამმუშავებელში
   }
 } 
 