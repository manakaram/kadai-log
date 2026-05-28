const CACHE_NAME = 'kadai-log-v1';
const ASSETS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});

// Handle scheduled notification checks
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_CHECK') {
    checkAndNotify(e.data.tasks);
  }
});

function checkAndNotify(tasks) {
  if (!tasks) return;
  const now = new Date();
  const urgent = tasks.filter(t => {
    if (t.done) return false;
    const due = new Date(t.dueDate);
    const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    return days <= 1 && days >= 0;
  });

  if (urgent.length > 0) {
    self.registration.showNotification('📚 課題の締め切りが近づいています', {
      body: urgent.map(t => `・${t.text}`).join('\n'),
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'kadai-reminder',
      renotify: true,
      actions: [{ action: 'open', title: 'アプリを開く' }]
    });
  }
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.openWindow('/'));
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', e => {
  if (e.tag === 'kadai-check') {
    e.waitUntil(
      self.clients.matchAll().then(clients => {
        // Get tasks from all clients
        clients.forEach(client => client.postMessage({ type: 'GET_TASKS' }));
      })
    );
  }
});
