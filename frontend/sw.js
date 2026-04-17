/**
 * Service Worker для Delivery Manager PWA
 * Дозволяє працювати оффлайн та встановлюватися як додаток
 */

const CACHE_NAME = 'delivery-manager-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/style.css',
    '/js/app.js',
    '/js/api.js',
    '/js/offline.js',
    '/manifest.json',
    '/icons/icon-192.png',
    '/icons/icon-512.png'
];

// Установка Service Worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker встановлюється...');
    
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('💾 Кешування файлів...');
            return cache.addAll(urlsToCache);
        })
    );
    
    self.skipWaiting();
});

// Активація Service Worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker активується...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Видалення старого кешу:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    self.clients.claim();
});

// Перехоплення запитів
self.addEventListener('fetch', (event) => {
    // Для GET запитів
    if (event.request.method === 'GET') {
        // Для API запитів - спробувати мережу, потім кеш
        if (event.request.url.includes('/api/')) {
            event.respondWith(
                fetch(event.request)
                    .then((response) => {
                        // Кешувати успішні відповіді
                        if (response.ok) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, response);
                            });
                        }
                        return response;
                    })
                    .catch(() => {
                        // Якщо мережа недоступна, отримати з кешу
                        return caches.match(event.request);
                    })
            );
        } else {
            // Для статичних файлів - спробувати кеш, потім мережу
            event.respondWith(
                caches.match(event.request)
                    .then((response) => {
                        if (response) {
                            return response;
                        }
                        
                        return fetch(event.request)
                            .then((response) => {
                                // Не кешувати не-GET запити
                                if (!response || response.status !== 200 || response.type === 'error') {
                                    return response;
                                }
                                
                                const responseToCache = response.clone();
                                caches.open(CACHE_NAME).then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                                
                                return response;
                            });
                    })
                    .catch(() => {
                        // Офлайн fallback
                        return new Response(
                            'Додаток недоступний офлайн. Перевірте мережу.',
                            { status: 503, statusText: 'Service Unavailable' }
                        );
                    })
            );
        }
    } else {
        // Для POST, PUT, DELETE запитів - завжди мережа
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    return response;
                })
                .catch((error) => {
                    console.error('❌ Network request failed:', error);
                    return new Response(
                        JSON.stringify({ error: 'Не вдається обробити запит офлайн' }),
                        { 
                            status: 503, 
                            statusText: 'Service Unavailable',
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
    }
});

// Обробка push повідомлень
self.addEventListener('push', (event) => {
    const options = {
        body: event.data ? event.data.text() : 'Нове повідомлення',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'delivery-notification',
        requireInteraction: false
    };

    event.waitUntil(
        self.registration.showNotification('Delivery Manager', options)
    );
});

// Обробка кліку на повідомлення
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Спробувати знайти вже відкрите вікно
            for (let i = 0; i < clientList.length; i++) {
                if (clientList[i].url === '/' && 'focus' in clientList[i]) {
                    return clientList[i].focus();
                }
            }
            // Якщо немає - відкрити нове вікно
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
