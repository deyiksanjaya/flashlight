// Nama cache unik. Ubah nama ini setiap kali Anda memperbarui file-file di dalam cache
// agar service worker mengunduh versi yang baru.
const CACHE_NAME = 'nocturnal-v1';

// Daftar file dan sumber daya yang akan disimpan di cache saat instalasi.
const URLS_TO_CACHE = [
  '/', // Mewakili file HTML utama (index.html atau controller.html)
  './control/manifest.json',
  './control/icon.png', // Ikon yang direferensikan di manifest.json
  
  // Aset dari CDN (opsional tapi sangat direkomendasikan untuk performa offline)
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js',
  'https://img.icons8.com/pastel-glyph/64/shutdown--v1.png'
];

// Event 'install': Dipicu saat service worker pertama kali diinstal.
// Di sini kita membuka cache dan menyimpan semua aset yang diperlukan.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Menginstal...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache dibuka, menyimpan aset...');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker: Semua aset berhasil disimpan di cache.');
        return self.skipWaiting(); // Memaksa service worker baru untuk aktif
      })
  );
});

// Event 'activate': Dipicu setelah instalasi selesai dan service worker aktif.
// Di sini kita membersihkan cache lama agar tidak menumpuk.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Mengaktifkan...');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Jika nama cache tidak cocok dengan yang sekarang, hapus.
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Siap mengontrol klien.');
        return self.clients.claim(); // Mengambil alih kontrol halaman yang terbuka
    })
  );
});

// Event 'fetch': Dipicu setiap kali aplikasi membuat permintaan jaringan (misalnya, gambar, skrip).
// Di sini kita menerapkan strategi "Cache First": coba ambil dari cache dulu, jika gagal baru ke jaringan.
self.addEventListener('fetch', (event) => {
  // Kita hanya menerapkan strategi cache untuk permintaan GET.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Strategi Cache First
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Jika respons ditemukan di cache, kembalikan dari cache.
        if (response) {
          console.log('Service Worker: Mengambil dari cache:', event.request.url);
          return response;
        }
        
        // Jika tidak ada di cache, coba ambil dari jaringan.
        console.log('Service Worker: Mengambil dari jaringan:', event.request.url);
        return fetch(event.request);
      })
  );
});
