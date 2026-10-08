// ===================================
// FIREBASE CONFIGURATION - UEW E-CAMPUS
// ===================================
// Configuration of your Firebase project "uew-e-campus".
// The web app configuration below is filled in and ready to use.
// In the Firebase console, remember to enable:
//  - Build > Firestore Database (create the database, production or test mode)
//  - Build > Authentication > Sign-in method > enable "Anonymous"
// See GUIDE_FIREBASE.md for the detailed step-by-step procedure.

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAo6ll624Vx1j4ZRIJdLfn0_AEs1vxbaUI",
    authDomain: "uew-e-campus.firebaseapp.com",
    projectId: "uew-e-campus",
    storageBucket: "uew-e-campus.firebasestorage.app",
    messagingSenderId: "908807843950",
    appId: "1:908807843950:web:0f6f9f4a6b70670e51367f",
    measurementId: "G-895N4LHZBC"
};

// Initialisation (the "compat" SDK is loaded beforehand in the <head> of the HTML pages)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// ---- OFFLINE / 2G MODE ----
//  - unlimited cacheSizeBytes: everything that has been read stays available offline
//  - experimentalAutoDetectLongPolling: automatically switches to a more tolerant
//    connection when the network (2G, operator proxy) blocks the usual real-time one
//  - synchronizeTabs: several open tabs share the same cache
// Writes made without network (messages, submissions, scores...) are kept in the
// phone's local database and sent automatically when the network returns.
db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    experimentalAutoDetectLongPolling: true,
    merge: true
});
db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
    console.warn("Offline persistence not enabled:", err.code);
});

// ---- ANONYMOUS AUTHENTICATION ----
// Required because the Firestore rules demand "request.auth != null".
// It does not replace your role system (admin/lecturer/student), which is still
// managed through the Firestore "users" collection as before.
// Just enable "Anonymous" in Firebase Console > Authentication > Sign-in method.
// Offline: the anonymous session already opened is read back from the device
// without network. Anonymous sign-in is only attempted on the very first launch.
const authReadyPromise = new Promise((resolve, reject) => {
    let termine = false;
    const unsub = auth.onAuthStateChanged((user) => {
        if (termine) return;
        if (user) {
            termine = true;
            unsub();
            resolve(user);
            return;
        }
        auth.signInAnonymously().catch((err) => {
            if (termine) return;
            termine = true;
            unsub();
            console.error("Anonymous authentication failed:", err);
            reject(err);
        });
    });
});
