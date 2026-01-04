const CACHE_NAME = 'sls-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// تثبيت Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('فتح ذاكرة التخزين المؤقت');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// تنشيط Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف ذاكرة قديمة:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// اعتراض الطلبات
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // إرجاع من ذاكرة التخزين المؤقت إذا كانت موجودة
        if (response) {
          return response;
        }
        // وإلا، جلب من الشبكة
        return fetch(event.request);
      })
      .catch(() => {
        // إذا فشل الاتصال، إرجاع الصفحة الرئيسية
        return caches.match('./index.html');
      })
  );
});

// معالجة الإشعارات
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'لديك مهمة جديدة!',
    icon: './icon-192.png',
    badge: './icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'open',
        title: 'فتح التطبيق'
      },
      {
        action: 'close',
        title: 'إغلاق'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Solo Leveling System', options)
  );
});

// معالجة النقر على الإشعار
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(windowClients => {
          // إذا كان التطبيق مفتوحاً، انتقل إليه
          for (let client of windowClients) {
            if (client.url.includes('github.io') && 'focus' in client) {
              return client.focus();
            }
          }
          // وإلا، افتح نافذة جديدة
          if (clients.openWindow) {
            return clients.openWindow('./index.html');
          }
        })
    );
  }
});
