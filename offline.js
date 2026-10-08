// ===================================================================
// MODE HORS-LIGNE / 2G - ESGIS E-CAMPUS
// Chargé AVANT firebase-config.js et script.js sur toutes les pages.
//  1. Enregistre le service worker (application utilisable sans réseau)
//  2. Affiche l'état du réseau (bandeau) et détecte la connexion lente
//  3. Fournit des outils pour écrire "à la WhatsApp" : l'action est
//     enregistrée sur l'appareil immédiatement, puis envoyée dès que
//     le réseau est disponible.
// ===================================================================
(function () {
    'use strict';

    // ---------- 1. SERVICE WORKER ----------
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function () {
            navigator.serviceWorker.register('./sw.js').catch(function (err) {
                console.warn('Service worker not registered:', err);
            });
        });
    }

    // ---------- 2. ETAT DU RESEAU ----------
    function connexionLente() {
        var c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (!c) return false;
        return !!c.saveData || /(^|-)2g$/.test(c.effectiveType || '');
    }
    window.reseauLent = connexionLente;

    var bandeau = null;
    function creerBandeau() {
        if (bandeau || !document.body) return;
        bandeau = document.createElement('div');
        bandeau.id = 'bandeauReseau';
        bandeau.setAttribute('role', 'status');
        document.body.appendChild(bandeau);
    }
    function majBandeau() {
        creerBandeau();
        if (!bandeau) return;
        if (!navigator.onLine) {
            bandeau.className = 'reseau-hors-ligne visible';
            bandeau.textContent = 'Offline: you can keep working. Your actions are kept on this device and will be sent when the network returns.';
        } else if (connexionLente()) {
            bandeau.className = 'reseau-lent visible';
            bandeau.textContent = 'Slow connection (2G): data-saving mode on.';
        } else {
            bandeau.className = '';
            bandeau.textContent = '';
        }
        document.documentElement.classList.toggle('reseau-lent', connexionLente());
    }
    window.addEventListener('online', function () {
        majBandeau();
        afficherToast('Connection restored, syncing...');
        if (typeof db !== 'undefined' && db.waitForPendingWrites) {
            db.waitForPendingWrites().then(function () { afficherToast('Everything is synced ✓'); }).catch(function () {});
        }
    });
    window.addEventListener('offline', majBandeau);
    if (navigator.connection && navigator.connection.addEventListener) {
        navigator.connection.addEventListener('change', majBandeau);
    }
    document.addEventListener('DOMContentLoaded', majBandeau);

    // ---------- Petites notifications (toast) ----------
    var toastTimer = null;
    function afficherToast(message) {
        if (!document.body) return;
        var t = document.getElementById('toastEcampus');
        if (!t) {
            t = document.createElement('div');
            t.id = 'toastEcampus';
            t.setAttribute('role', 'status');
            document.body.appendChild(t);
        }
        t.textContent = message;
        t.className = 'visible';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(function () { t.className = ''; }, 4500);
    }
    window.afficherToast = afficherToast;

    // ---------- 3. ECRITURE "A LA WHATSAPP" ----------
    // Firestore garde déjà les écritures en attente dans IndexedDB quand le
    // réseau manque, MAIS la promesse ne se termine qu'après confirmation du
    // serveur : sans réseau, l'interface resterait bloquée. Cet utilitaire
    // rend la main tout de suite quand le réseau est absent/lent :
    //   -> 'envoye' : le serveur a confirmé
    //   -> 'file'   : enregistré sur l'appareil, sera envoyé automatiquement
    // Les erreurs détectées plus tard (ex : refus par les règles de sécurité)
    // sont signalées par une notification.
    window.ecrireEnFile = function (promesse, opts) {
        opts = opts || {};
        var delai = navigator.onLine ? (opts.delai || (connexionLente() ? 12000 : 5000)) : 0;
        return new Promise(function (resolve, reject) {
            var termine = false;
            var timer = setTimeout(function () {
                if (termine) return;
                termine = true;
                resolve('file');
            }, delai);
            promesse.then(function () {
                if (!termine) { termine = true; clearTimeout(timer); resolve('envoye'); }
                else afficherToast('Sent ✓');
            }, function (err) {
                if (!termine) { termine = true; clearTimeout(timer); reject(err); }
                else {
                    console.error('Pending write rejected:', err);
                    afficherToast('An action saved offline was rejected by the server.');
                }
            });
        });
    };

    // Message standard après une action mise en file
    window.messageFile = function (libelle) {
        return (libelle || 'Action') + ' saved on this device. It will be sent automatically as soon as the network returns.';
    };

    // ---------- Fichiers : compression des images avant envoi ----------
    // Les fichiers sont stockés dans Firestore (limite 1 Mo par document).
    // Une photo de téléphone (3-5 Mo) est donc réduite (max 1280 px, JPEG),
    // ce qui l'allège à ~100-250 Ko : indispensable en 2G.
    var LIMITE_OCTETS = 950 * 1024; // marge sous la limite de 1 Mo de Firestore
    window.LIMITE_FICHIER_OCTETS = LIMITE_OCTETS;

    function lireDataUrl(blob) {
        return new Promise(function (resolve, reject) {
            var r = new FileReader();
            r.onload = function () { resolve(r.result); };
            r.onerror = function () { reject(new Error('Unable to read the file')); };
            r.readAsDataURL(blob);
        });
    }

    function compresserImage(file, maxDim, qualite) {
        return new Promise(function (resolve, reject) {
            var url = URL.createObjectURL(file);
            var img = new Image();
            img.onload = function () {
                var ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
                var c = document.createElement('canvas');
                c.width = Math.round(img.width * ratio);
                c.height = Math.round(img.height * ratio);
                var ctx = c.getContext('2d');
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, c.width, c.height);
                ctx.drawImage(img, 0, 0, c.width, c.height);
                URL.revokeObjectURL(url);
                resolve(c.toDataURL('image/jpeg', qualite));
            };
            img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('Unreadable image')); };
            img.src = url;
        });
    }

    // Retourne un dataURL prêt à être stocké (image compressée si besoin)
    window.lireFichierPourEnvoi = async function (file) {
        var estImage = /^image\/(jpeg|png|webp)$/i.test(file.type);
        if (!estImage) return lireDataUrl(file);
        try {
            var dim = connexionLente() ? 1024 : 1280;
            var compresse = await compresserImage(file, dim, 0.7);
            var original = await (file.size < 120 * 1024 ? lireDataUrl(file) : Promise.resolve(null));
            return original && original.length < compresse.length ? original : compresse;
        } catch (e) {
            return lireDataUrl(file);
        }
    };

    // ---------- Installation sur l'écran d'accueil ----------
    var invitationInstall = null;
    window.addEventListener('beforeinstallprompt', function (e) {
        e.preventDefault();
        invitationInstall = e;
        var b = document.getElementById('btnInstallerApp');
        if (b) b.style.display = 'inline-block';
    });
    window.installerApplication = function () {
        if (!invitationInstall) return;
        invitationInstall.prompt();
        invitationInstall.userChoice.finally(function () { invitationInstall = null; });
        var b = document.getElementById('btnInstallerApp');
        if (b) b.style.display = 'none';
    };
    document.addEventListener('DOMContentLoaded', function () {
        if (!document.body || document.body.dataset.public === 'true') return;
        var b = document.createElement('button');
        b.id = 'btnInstallerApp';
        b.type = 'button';
        b.textContent = 'Install the app';
        b.style.display = invitationInstall ? 'inline-block' : 'none';
        b.addEventListener('click', window.installerApplication);
        document.body.appendChild(b);
    });
})();
