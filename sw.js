// ===================================================================
// SERVICE WORKER - UEW E-CAMPUS (offline / 2G operation)
// -------------------------------------------------------------------
// Role: cache the application (pages, CSS, JS, logos, Firebase SDK)
// so that it opens INSTANTLY, without a network or on a 2G connection.
// The DATA (lectures, scores, messages...) is handled by Firestore
// (local IndexedDB cache, see firebase-config.js).
//
// >>> Each time a deployment changes a file, change VERSION below
// >>> (e.g. 'uew-v2') so that phones pick up the update.
// ===================================================================
const VERSION = 'uew-v2';
const CACHE_APP = 'uew-ecampus-app-' + VERSION;
const CACHE_CDN = 'uew-ecampus-cdn-v1'; // versioned URLs: kept as they are

const FICHIERS_APP = [
    './', 'index.html', 'student.html', 'lecturer.html', 'admin.html', 'daas.html',
    'exams.html', 'registration.html',
    'style.css', 'script.js', 'offline.js', 'firebase-config.js',
    'logo.png', 'logo-icon.png', 'icon-192.png', 'icon-512.png',
    'manifest.webmanifest'
];

// External libraries loaded by the pages (must stay identical
// to the <script src> tags of the HTML files).
const FICHIERS_CDN = [
    'https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js',
    'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js',
    'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js',
    'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
];
const HOTES_CDN = ['www.gstatic.com', 'cdnjs.cloudflare.com'];

self.addEventListener('install', (event) => {
    event.waitUntil((async () => {
        const app = await caches.open(CACHE_APP);
        // Un fichier manquant ne doit pas faire échouer toute l'installation
        await Promise.all(FICHIERS_APP.map(f => app.add(new Request(f, { cache: 'reload' })).catch(() => {})));
        const cdn = await caches.open(CACHE_CDN);
        await Promise.all(FICHIERS_CDN.map(async (url) => {
            if (await cdn.match(url)) return;
            try { await cdn.add(new Request(url, { mode: 'cors' })); } catch (e) { /* sera mis en cache à la 1re utilisation */ }
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const noms = await caches.keys();
        await Promise.all(noms
            .filter(n => n.startsWith('uew-ecampus-app-') && n !== CACHE_APP)
            .map(n => caches.delete(n)));
        await self.clients.claim();
    })());
});

// Stratégie "cache d'abord, mise à jour en arrière-plan" : réponse
// immédiate (idéal en 2G), et le cache se rafraîchit pour la visite suivante.
async function cacheEtMiseAJour(request, nomCache, ignorerRecherche) {
    const cache = await caches.open(nomCache);
    const enCache = await cache.match(request, { ignoreSearch: !!ignorerRecherche });
    const reseau = fetch(request).then((rep) => {
        if (rep && (rep.ok || rep.type === 'opaque')) cache.put(request, rep.clone());
        return rep;
    }).catch(() => null);
    if (enCache) { reseau.catch(() => {}); return enCache; }
    const rep = await reseau;
    return rep || Response.error();
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);

    // Bibliothèques externes versionnées : cache d'abord
    if (HOTES_CDN.includes(url.hostname)) {
        event.respondWith((async () => {
            const cache = await caches.open(CACHE_CDN);
            const enCache = await cache.match(req);
            if (enCache) return enCache;
            try {
                const rep = await fetch(req);
                if (rep && (rep.ok || rep.type === 'opaque')) cache.put(req, rep.clone());
                return rep;
            } catch (e) { return Response.error(); }
        })());
        return;
    }

    // Tout le reste d'un autre domaine (Firestore, Auth, Jitsi...) : on ne touche pas
    if (url.origin !== self.location.origin) return;

    // Pages de l'application
    if (req.mode === 'navigate') {
        event.respondWith((async () => {
            const rep = await cacheEtMiseAJour(req, CACHE_APP, true);
            if (rep && rep.type !== 'error') return rep;
            const secours = await caches.match('index.html');
            return secours || Response.error();
        })());
        return;
    }

    // Fichiers statiques (css, js, images, manifest)
    event.respondWith(cacheEtMiseAJour(req, CACHE_APP, false));
});
