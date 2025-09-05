const CACHE_NAME = 'jee-prep-2026-v1'
const urlsToCache = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      }
    )
  )
})

// Handle background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'revision-reminder') {
    event.waitUntil(
      // Check for due revision items and show notifications
      showRevisionReminders()
    )
  }
})

async function showRevisionReminders() {
  // This would integrate with your revision system
  // to check for items due for review
  const registration = await self.registration
  
  registration.showNotification('Revision Reminder', {
    body: 'You have items due for review!',
    icon: '/vite.svg',
    badge: '/vite.svg',
    actions: [
      {
        action: 'review',
        title: 'Review Now'
      },
      {
        action: 'later',
        title: 'Remind Later'
      }
    ]
  })
}