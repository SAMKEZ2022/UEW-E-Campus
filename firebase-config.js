// ===================================
// FIREBASE CONFIGURATION - UEW E-CAMPUS
// ===================================
// Configuration of the "uew-e-campus" Firebase project.
// In the Firebase console, remember to enable:
//  - Build > Firestore Database (create the database, production or test mode)
//  - Build > Authentication > Sign-in method > enable "Anonymous"
// See GUIDE_FIREBASE.md for the detailed step-by-step procedure.

const firebaseConfig = {
    apiKey: "AIzaSyAo6ll624Vx1j4ZRIJdLfn0_AEs1vxbaUI",
    authDomain: "uew-e-campus.firebaseapp.com",
    projectId: "uew-e-campus",
    storageBucket: "uew-e-campus.firebasestorage.app",
    messagingSenderId: "908807843950",
    appId: "1:908807843950:web:0f6f9f4a6b70670e51367f",
    measurementId: "G-895N4LHZBC"
};

// Initialisation ("compat" SDK loaded beforehand in the <head> of the HTML pages)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Enables local cache (lets the app keep showing the last known data even
// during a brief network outage)
db.enablePersistence().catch((err) => {
    console.warn("Offline persistence not enabled:", err.code);
});

// ---- ANONYMOUS AUTHENTICATION ----
// Required because the Firestore rules require "request.auth != null".
// This does not replace your role system (admin/lecturer/student/exams),
// which is still handled "by hand" via the Firestore "users" collection as before.
// You just need to enable "Anonymous" in Firebase Console > Authentication > Sign-in method.
const authReadyPromise = new Promise((resolve, reject) => {
    auth.onAuthStateChanged((user) => {
        if (user) resolve(user);
    });
    auth.signInAnonymously().catch((err) => {
        console.error("Anonymous authentication failed:", err);
        reject(err);
    });
});
