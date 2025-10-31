// Simple Service Worker to handle missing resources
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Don't handle non-GET requests
  if (event.request.method !== 'GET') return;

  // Handle missing icons
  if (url.pathname.endsWith('icon-192x192.png')) {
    const transparentPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
    event.respondWith(
      fetch(transparentPng).then(response => {
        return new Response(response.body, {
          status: 200,
          headers: { 'Content-Type': 'image/png' }
        });
      })
    );
    return;
  }
  
  // Block Imgur requests
  if (url.hostname.includes('imgur.com')) {
    event.respondWith(new Response(null, { status: 204 }));
    return;
  }
  
  // Let the browser handle other requests
  return;
});

// Install event
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});
