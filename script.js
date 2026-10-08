// ===================================
// UEW E-CAMPUS PLATFORM - MAIN SCRIPT
// Version FIREBASE (temps réel) : les étudiants d'une filière reçoivent
// automatiquement le lien de la salle dès que leur professeur lance le Live.
// Prérequis : firebase-config.js chargé AVANT ce fichier (variable globale "db").
// ===================================

// ---- FACULTIES AND SCHOOLS ----
// Regroupent les filières dans les menus déroulants (via <optgroup>).
const POLES = {
    abse: "Faculty of Applied Behavioural Sciences in Education",
    sob: "School of Business",
    scms: "School of Communication and Media Studies",
    sca: "School of Creative Arts",
    selll: "School of Education and Life-Long Learning",
    fse: "Faculty of Science Education",
    fsse: "Faculty of Social Sciences Education",
    ffle: "Faculty of Foreign Languages Education",
    fgle: "Faculty of Ghanaian Languages Education",
    commun: "Common Courses"
};

// ---- DEPARTMENTS (called "filieres" in the code) AND FIXED VIRTUAL ROOMS ----
// Each department has 5 permanent Jitsi rooms (one per level), so several
// lectures of the same department can be live at the same time.
// "abbr" is the short name displayed everywhere (menus, cards, room titles);
// "libelle" is the full department name (tooltip / Excel export).
const FILIERES_DATA = [
    // -- Faculty of Applied Behavioural Sciences in Education --
    { key: "psychology_counselling", abbr: "Psychology & Counselling", libelle: "Psychology and Counselling", pole: "abse", couleur: "#0033A0" },
    { key: "special_education", abbr: "Special Education", libelle: "Special Education", pole: "abse", couleur: "#0033A0" },
    // -- School of Business --
    { key: "accounting_finance", abbr: "Accounting & Finance", libelle: "Accounting and Finance", pole: "sob", couleur: "#C8102E" },
    { key: "management_sciences", abbr: "Management Sciences", libelle: "Management Sciences", pole: "sob", couleur: "#C8102E" },
    { key: "marketing_scm", abbr: "Marketing & Supply Chain Mgt", libelle: "Marketing and Supply Chain Management", pole: "sob", couleur: "#C8102E" },
    // -- School of Communication and Media Studies --
    { key: "journalism_media", abbr: "Journalism & Media Studies", libelle: "Journalism and Media Studies", pole: "scms", couleur: "#1B6CA8" },
    { key: "strategic_communication", abbr: "Strategic Communication", libelle: "Strategic Communication", pole: "scms", couleur: "#1B6CA8" },
    { key: "development_communication", abbr: "Development Communication", libelle: "Development Communication", pole: "scms", couleur: "#1B6CA8" },
    // -- School of Creative Arts --
    { key: "graphic_design", abbr: "Graphic Design", libelle: "Graphic Design", pole: "sca", couleur: "#8E44AD" },
    { key: "theatre_arts", abbr: "Theatre Arts", libelle: "Theatre Arts", pole: "sca", couleur: "#8E44AD" },
    { key: "music_education", abbr: "Music Education", libelle: "Music Education", pole: "sca", couleur: "#8E44AD" },
    { key: "art_education", abbr: "Art Education", libelle: "Art Education", pole: "sca", couleur: "#8E44AD" },
    // -- School of Education and Life-Long Learning --
    { key: "basic_education", abbr: "Basic Education", libelle: "Basic Education", pole: "selll", couleur: "#16885A" },
    { key: "early_childhood", abbr: "Early Childhood Education", libelle: "Early Childhood Education", pole: "selll", couleur: "#16885A" },
    { key: "adult_continuing", abbr: "Adult & Continuing Education", libelle: "Adult and Continuing Education", pole: "selll", couleur: "#16885A" },
    // -- Faculty of Science Education --
    { key: "ict", abbr: "ICT", libelle: "Information and Communication Technology (ICT) Education", pole: "fse", couleur: "#2E86DE" },
    { key: "mathematics_education", abbr: "Mathematics Education", libelle: "Mathematics Education", pole: "fse", couleur: "#2E86DE" },
    { key: "integrated_science", abbr: "Integrated Science Education", libelle: "Integrated Science Education", pole: "fse", couleur: "#2E86DE" },
    // -- Faculty of Social Sciences Education --
    { key: "economics_education", abbr: "Economics Education", libelle: "Economics Education", pole: "fsse", couleur: "#D68910" },
    { key: "geography_education", abbr: "Geography Education", libelle: "Geography Education", pole: "fsse", couleur: "#D68910" },
    { key: "history_polsci", abbr: "History & Political Science Education", libelle: "History and Political Science Education", pole: "fsse", couleur: "#D68910" },
    { key: "social_studies", abbr: "Social Studies Education", libelle: "Social Studies Education", pole: "fsse", couleur: "#D68910" },
    // -- Faculty of Foreign Languages Education --
    { key: "english_education", abbr: "English Education", libelle: "English Education", pole: "ffle", couleur: "#B03A2E" },
    { key: "french_education", abbr: "French Education", libelle: "French Education", pole: "ffle", couleur: "#B03A2E" },
    // -- Faculty of Ghanaian Languages Education --
    { key: "ghanaian_languages", abbr: "Ghanaian Languages Education", libelle: "Ghanaian Languages Education", pole: "fgle", couleur: "#117A65" }
];

// Génère les 5 salles virtuelles fixes (une par niveau) d'une filière à
// partir de son nom court.
function genererSallesFiliere(abbr) {
    return {
        1: `${abbr} - Level 100 (Room 1)`,
        2: `${abbr} - Level 200 (Room 2)`,
        3: `${abbr} - Level 300 (Room 3)`,
        4: `${abbr} - Level 400 (Room 4)`,
        5: `${abbr} - Postgraduate (Room 5)`
    };
}

const FILIERES = {};
FILIERES_DATA.forEach(f => {
    FILIERES[f.key] = {
        nom: f.abbr,
        abbr: f.abbr,
        libelle: f.libelle,
        slug: slugify(f.abbr),
        pole: f.pole,
        couleur: f.couleur,
        salles: genererSallesFiliere(f.abbr)
    };
});
// "Tronc Commun" : pseudo-filière transversale (cf. plus bas), pas un vrai
// programme UEW, mais nécessaire pour les cours suivis par plusieurs filières.
FILIERES.tronc_commun = {
    nom: "Common Courses",
    abbr: "Common Courses",
    libelle: "Common Courses (lectures shared by several departments)",
    slug: "common-courses",
    pole: "commun",
    couleur: "#95A5A6",
    salles: genererSallesFiliere("Common Courses")
};

// ---- NIVEAUX (communs à toutes les filières) ----
// Un étudiant appartient à une filière ET à un niveau (1 à 5).
// Ces niveaux correspondent aux mêmes numéros que les salles des cours
// (c.salle) : ça permet de savoir quels étudiants suivent quel cours.
const NIVEAUX = {
    1: "Level 100",
    2: "Level 200",
    3: "Level 300",
    4: "Level 400",
    5: "Postgraduate"
};

function getNomNiveau(niveau) {
    return NIVEAUX[niveau] || `Level ${niveau}`;
}

// ---- SEMESTRES (S1 à S10) ----
// Le semestre s'ajoute au niveau, il ne le remplace pas : chaque niveau
// (L1/BTS1 à Master 2) est découpé en 2 semestres consécutifs, ce qui
// donne 10 semestres sur l'ensemble du cursus. Une matière/UE est donc
// désormais rattachée à la fois à un niveau (comme avant) ET à un semestre
// précis parmi les deux que compte ce niveau.
const NIVEAU_SEMESTRES = {
    1: [1, 2],
    2: [3, 4],
    3: [5, 6],
    4: [7, 8],
    5: [9, 10]
};

function getSemestresDuNiveau(niveau) {
    return NIVEAU_SEMESTRES[Number(niveau)] || [];
}

function getNomSemestre(semestre) {
    return semestre ? `Sem ${semestre}` : '—';
}

// ---- UNITÉS D'ENSEIGNEMENT (UE) ET CRÉDITS ECTS ----
// Les matières sont regroupées par UE (ex : "UE1 - Fondamentaux") : chaque
// matière porte le nom de son UE et son propre nombre de crédits ECTS.
// Une matière n'est validée (et ne rapporte ses crédits) que si sa note est
// ≥ 10/20 (règle inchangée, cf. getMention). Les fonctions ci-dessous
// regroupent une liste de matières/notes par UE et calculent les totaux de
// crédits (maximum possible et réellement acquis) pour un relevé/bulletin.
function regrouperParUe(lignes) {
    const groupes = [];
    const index = {};
    lignes.forEach(l => {
        const cle = l.ue && l.ue.trim() ? l.ue.trim() : 'No module';
        if (!(cle in index)) {
            index[cle] = { ue: cle, lignes: [] };
            groupes.push(index[cle]);
        }
        index[cle].lignes.push(l);
    });
    return groupes.map(g => {
        const creditsMax = g.lignes.reduce((s, l) => s + (Number(l.credits) || 0), 0);
        const creditsAcquis = g.lignes.reduce((s, l) => s + (l.note !== null && Number(l.note) >= NOTE_PASS ? (Number(l.credits) || 0) : 0), 0);
        return { ...g, creditsMax, creditsAcquis };
    });
}

// ---- RELEVÉS PAR SEMESTRE ----
// Un relevé de notes officiel se lit et se délivre SEMESTRE PAR SEMESTRE
// (S1, S2, ... S10), jamais niveau par niveau (un niveau = 2 semestres). Ce
// helper regroupe une liste de lignes de notes (chacune avec au moins
// nom/ue/credits/semestre/note) d'abord par semestre — dans l'ordre croissant
// — puis par UE au sein de chaque semestre (voir regrouperParUe), avec le
// sous-total de crédits ECTS de chaque semestre. Une ligne dont la matière ne
// portait pas encore de semestre au moment de la saisie (donnée antérieure à
// l'ajout de ce champ) est placée à part, en tout dernier, plutôt que
// mélangée à un semestre au hasard ou perdue silencieusement.
function regrouperParSemestre(lignes) {
    const parSemestre = {};
    lignes.forEach(l => {
        const semestre = l.semestre ? Number(l.semestre) : null;
        const cle = semestre !== null ? semestre : 'none';
        if (!parSemestre[cle]) parSemestre[cle] = { semestre, lignes: [] };
        parSemestre[cle].lignes.push(l);
    });
    const blocs = Object.values(parSemestre).sort((a, b) => {
        if (a.semestre === null) return 1;
        if (b.semestre === null) return -1;
        return a.semestre - b.semestre;
    });
    return blocs.map(bloc => {
        const groupesUe = regrouperParUe(bloc.lignes);
        const creditsMax = groupesUe.reduce((s, g) => s + g.creditsMax, 0);
        const creditsAcquis = groupesUe.reduce((s, g) => s + g.creditsAcquis, 0);
        return { semestre: bloc.semestre, groupesUe, creditsMax, creditsAcquis };
    });
}

// ---- BARÈME DES MENTIONS (notes sur 20) ----
// Utilisé côté étudiant (affichage de sa propre note) et côté service
// d'examen (aperçu en direct pendant la saisie).
// Grading scale (UEW style): score out of NOTE_MAX, pass mark NOTE_PASS.
const NOTE_MAX = 100;
const NOTE_PASS = 50;

function getMention(note) {
    const n = Number(note);
    if (note === '' || note === null || note === undefined || Number.isNaN(n)) {
        return { texte: 'Not graded', classe: 'mention-attente' };
    }
    if (n < NOTE_PASS) return { texte: 'F (Fail)', classe: 'mention-non-valide' };
    if (n < 55) return { texte: 'D (Pass)', classe: 'mention-passable' };
    if (n < 60) return { texte: 'D+ (Pass)', classe: 'mention-passable' };
    if (n < 65) return { texte: 'C (Satisfactory)', classe: 'mention-assez-bien' };
    if (n < 70) return { texte: 'C+ (Satisfactory)', classe: 'mention-assez-bien' };
    if (n < 75) return { texte: 'B (Good)', classe: 'mention-bien' };
    if (n < 80) return { texte: 'B+ (Very Good)', classe: 'mention-tres-bien' };
    return { texte: 'A (Excellent)', classe: 'mention-excellent' };
}

// Identifiant déterministe d'une note = matière + étudiant : une nouvelle
// saisie pour le même couple met simplement à jour le document existant
// (jamais de doublon), que ce soit via la saisie manuelle ou l'import Excel.
function idNote(matiereId, etudiantId) {
    return `${matiereId}_${etudiantId}`;
}

// ---- ANCIENS ÉTUDIANTS (reprise d'études / redoublement partiel) ----
// Un candidat qui a déjà fréquenté l'UEW sous un ANCIEN n° matricule (voir
// le formulaire d'inscription) ne doit pas repasser une matière qu'il a déjà
// validée (note >= 10/20) lors de son parcours précédent. On le détecte en
// recherchant, parmi TOUTES les notes jamais enregistrées (state.NOTES,
// tous cursus confondus), une note pour ce même ancien matricule et le même
// nom de matière (comparé sans tenir compte des accents/casse/espaces, via
// normaliserNomMatiere, car la matière est recréée chaque année avec un
// nouvel identifiant Firestore — seul le nom permet de faire le lien).
function matiereDejaValideeAvantReinscription(etudiant, nomMatiere) {
    if (!etudiant || !etudiant.ancienMatricule || !nomMatiere) return false;
    const cible = normaliserNomMatiere(nomMatiere);
    return state.NOTES.some(n =>
        (n.matricule || '').toLowerCase() === etudiant.ancienMatricule.toLowerCase() &&
        normaliserNomMatiere(n.matiereNom || '') === cible &&
        n.note !== '' && n.note != null && Number(n.note) >= NOTE_PASS
    );
}

function getNomFiliere(filiereId) {
    const filiere = FILIERES[filiereId];
    return filiere ? filiere.nom : `Department ${filiereId}`;
}

function nomSalle(filiereId, numeroSalle) {
    const filiere = FILIERES[filiereId];
    if (!filiere) return `Room ${numeroSalle}`;
    return filiere.salles[numeroSalle] || `Room ${numeroSalle}`;
}

function lienSalle(filiereId, numeroSalle) {
    return `https://meet.jit.si/UEW-${filiereId}-Room-${numeroSalle}`;
}

function slugify(texte) {
    return texte
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // enlève les accents
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function estLienJitsi(lien) {
    return typeof lien === 'string' && lien.includes('meet.jit.si/');
}

// ---- TRONC COMMUN : un cours "tronc commun" est suivi par plusieurs filières ----
// Pour un cours normal, seule la filière du cours (c.filiere) est concernée.
// Pour un cours de tronc commun, on ajoute une liste explicite de filières
// concernées (c.filieresConcernees) choisie par le prof/admin qui programme
// le cours : ce sont les étudiants de CES filières (au niveau du cours) qui
// doivent recevoir le lien, en plus des éventuels étudiants directement
// rattachés à la filière "tronc_commun".
function estFiliereTroncCommun(filiereId) {
    return filiereId === 'tronc_commun';
}

// Fonction centrale : détermine si un cours donné concerne un étudiant donné
// (même niveau ET (même filière OU filière listée dans les "filières concernées"
// d'un cours de tronc commun)). Utilisée partout où l'on filtre l'affichage,
// les notifications et le suivi de présence côté étudiant, pour garder une
// seule logique cohérente.
function coursConcerneEtudiant(cours, etudiant) {
    if (!cours || !etudiant || !etudiant.niveau) return false;
    if (Number(cours.salle) !== Number(etudiant.niveau)) return false;
    if (cours.filiere === etudiant.filiere) return true;
    if (estFiliereTroncCommun(cours.filiere) && Array.isArray(cours.filieresConcernees)) {
        return cours.filieresConcernees.includes(etudiant.filiere);
    }
    return false;
}

// Détermine si un professeur donné est autorisé à gérer un cours donné
// (le voir dans "Mes cours", lancer/couper son Live, lui envoyer un
// support). Règle : même filière obligatoirement, ET :
//  - si le cours n'est rattaché à aucune matière (créé "en saisie libre"
//    par l'admin) : géré par tous les profs de la filière (comportement
//    historique, notamment pour le Tronc Commun) ;
//  - si le cours est rattaché à une matière SANS professeur attribué :
//    géré par tous les profs de la filière, en attendant l'attribution ;
//  - si le cours est rattaché à une matière AVEC un professeur attribué :
//    géré UNIQUEMENT par ce professeur.
function coursGereParProf(cours, prof) {
    if (!cours || !prof) return false;
    if (cours.filiere !== prof.filiere) return false;
    if (!cours.matiereId) return true;
    const matiere = state.MATIERES.find(m => m.id === cours.matiereId);
    if (!matiere || !matiere.profId) return true;
    return matiere.profId === prof.id;
}

// Remplit une liste de cases à cocher avec toutes les filières "normales"
// (on exclut "tronc_commun" lui-même : ça n'aurait pas de sens de cocher
// "Tronc Commun" comme filière concernée par un cours de tronc commun).
// Les filières sont regroupées par pôle pour rester lisibles malgré leur nombre.
function remplirCheckboxFilieresConcernees(containerId, valeursCochees) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const cochees = new Set(valeursCochees || []);
    const cles = Object.keys(FILIERES).filter(key => !estFiliereTroncCommun(key));
    el.innerHTML = Object.keys(POLES)
        .filter(poleKey => poleKey !== 'commun')
        .map(poleKey => {
            const clesDuPole = cles.filter(key => FILIERES[key].pole === poleKey);
            if (clesDuPole.length === 0) return '';
            return `
                <p style="margin:10px 0 4px;font-weight:600;">${POLES[poleKey]}</p>
                ${clesDuPole.map(key => `
                    <label class="checkbox-item">
                        <input type="checkbox" value="${key}" ${cochees.has(key) ? 'checked' : ''}>
                        ${FILIERES[key].nom}
                    </label>
                `).join('')}
            `;
        }).join('');
}

// Lit les cases cochées d'un groupe rempli par remplirCheckboxFilieresConcernees.
function getFilieresConcerneesCochees(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return [];
    return Array.from(el.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

// ===================================
// ETAT LOCAL EN MEMOIRE
// Rempli automatiquement et en continu par les écouteurs Firestore (onSnapshot).
// Toutes les fonctions d'affichage lisent depuis cet "state" ; il est toujours
// à jour car Firestore pousse chaque changement en temps réel à tous les clients.
// ===================================

let state = {
    COURS: [],
    DEVOIRS: [],
    SUPPORTS: [],
    DEPOTS: [],
    USERS: [],
    PRESENCES: [],
    MATIERES: [],
    MESSAGES: [],
    INSCRIPTIONS: [],
    NOTES: []
};

let etatInitialCoursCharge = false;
let etatInitialMessagesCharge = false;

// Contact actuellement ouvert dans la messagerie (email), en mémoire locale uniquement.
let contactChatActif = null;

// ---- SEED (données de démo au tout premier lancement du projet Firebase) ----

// Les comptes de démonstration ont des mots de passe PUBLICS (visibles dans ce
// fichier et dans le guide) : ils ne sont donc créés qu'en local ou si l'URL
// de connexion contient explicitement ?demo=1. Sur un site en ligne, la
// première initialisation se fait avec ?setup=1 (un seul compte admin, mot de
// passe aléatoire affiché une seule fois) : voir initialiserPlateformeAdmin().
const MODE_DEMO = ['localhost', '127.0.0.1'].includes(location.hostname) || /[?&]demo=1/.test(location.search);
const MODE_SETUP = /[?&]setup=1/.test(location.search);

async function initialiserPlateformeAdmin() {
    const metaRef = db.collection('_meta').doc('init');
    const metaSnap = await metaRef.get();
    if (metaSnap.exists) {
        alert('The platform is already initialised. Log in with the administrator account.');
        return;
    }
    const motDePasse = chaineAleatoireSecurisee('ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789', 14);
    const email = 'admin@uew-ecampus.edu.gh';
    const batch = db.batch();
    batch.set(db.collection('users').doc(), { email, password: motDePasse, role: 'admin' });
    batch.set(metaRef, { seeded: true, mode: 'setup', date: new Date().toISOString() });
    await batch.commit();
    try { localStorage.setItem('ecampus_seed_ok', '1'); } catch (e) { /* ignoré */ }
    alert(`Platform initialised.\n\nAdministrator login: ${email}\nPassword: ${motDePasse}\n\nWrite this password down now: it will not be shown again. Then reload the page without "?setup=1".`);
}

async function seedDonneesInitialesSiNecessaire() {
    if (!MODE_DEMO) return; // jamais de comptes de démo à mot de passe public en ligne
    try { if (localStorage.getItem('ecampus_seed_ok') === '1') return; } catch (e) { /* ignoré */ }
    const metaRef = db.collection('_meta').doc('init');
    const metaSnap = await metaRef.get();
    if (metaSnap.exists) { // déjà initialisé, on ne touche à rien
        try { localStorage.setItem('ecampus_seed_ok', '1'); } catch (e) { /* ignoré */ }
        return;
    }

    const batch = db.batch();

    const coursInitiaux = [
        { titre: "Introduction to Educational Technology", date: "2026-10-26T14:00", filiere: "ict", salle: 1, lien: lienSalle("ict", 1), en_live: false },
        { titre: "Algebra and Number Theory", date: "2026-10-27T10:00", filiere: "mathematics_education", salle: 1, lien: lienSalle("mathematics_education", 1), en_live: false },
        { titre: "Foundations of Guidance and Counselling", date: "2026-10-28T09:00", filiere: "psychology_counselling", salle: 1, lien: lienSalle("psychology_counselling", 1), en_live: false },
        { titre: "Financial Accounting I", date: "2026-10-28T14:00", filiere: "accounting_finance", salle: 1, lien: lienSalle("accounting_finance", 1), en_live: false },
        { titre: "Principles of Marketing", date: "2026-10-29T09:00", filiere: "marketing_scm", salle: 1, lien: lienSalle("marketing_scm", 1), en_live: false }
    ];
    coursInitiaux.forEach(c => batch.set(db.collection('cours').doc(), c));

    const devoirsInitiaux = [
        { titre: "Lab 1 - Spreadsheet data analysis", desc: "Clean and analyse the dataset provided in class", filiere: "ict" },
        { titre: "Assignment 1 - Set theory", desc: "Complete exercises 1 to 5 on page 12", filiere: "mathematics_education" },
        { titre: "Case study - Counselling ethics", desc: "Submit a two-page reflective report", filiere: "psychology_counselling" },
        { titre: "Exercise - Reading a balance sheet", desc: "Analyse the documents provided in class", filiere: "accounting_finance" },
        { titre: "Project - Marketing plan", desc: "Design a marketing plan for a product of your choice", filiere: "marketing_scm" }
    ];
    devoirsInitiaux.forEach(d => batch.set(db.collection('devoirs').doc(), d));

    const usersInitiaux = [
        { email: "admin@uew-ecampus.edu.gh", password: "Uew2026#Admin", role: "admin" },
        { email: "daas@uew-ecampus.edu.gh", password: "Uew2026#Daas", role: "daas" },
        { email: "exams@uew-ecampus.edu.gh", password: "Uew2026#Exams", role: "exams" },
        { email: "lecturer.ict@uew-ecampus.edu.gh", password: "Uew2026#LecICT", role: "lecturer", filiere: "ict" },
        { email: "lecturer.accounting@uew-ecampus.edu.gh", password: "Uew2026#LecAcc", role: "lecturer", filiere: "accounting_finance" },
        { email: "lecturer.marketing@uew-ecampus.edu.gh", password: "Uew2026#LecMkt", role: "lecturer", filiere: "marketing_scm" },
        { email: "student.ict@uew-ecampus.edu.gh", password: "Uew2026#StuICT", role: "student", filiere: "ict", niveau: 1, nom: "Mensah", prenom: "Ama", matricule: "UEW-2026-0001" },
        { email: "student.accounting@uew-ecampus.edu.gh", password: "Uew2026#StuAcc", role: "student", filiere: "accounting_finance", niveau: 1, nom: "Boateng", prenom: "Kofi", matricule: "UEW-2026-0002" }
    ];
    usersInitiaux.forEach(u => batch.set(db.collection('users').doc(), u));

    batch.set(metaRef, { seeded: true, date: new Date().toISOString() });

    await batch.commit();
    try { localStorage.setItem('ecampus_seed_ok', '1'); } catch (e) { /* ignoré */ }
}

// ---- ECOUTE TEMPS REEL ----
// C'est le cœur du système : dès qu'un document "cours" change dans Firestore
// (ex: un prof passe en_live à true), Firestore notifie INSTANTANÉMENT tous les
// navigateurs connectés (prof, étudiants, admin) sans qu'ils aient à recharger.

function demarrerEcouteTempsReel() {
    db.collection('cours').onSnapshot((snap) => {
        const ancienCours = state.COURS;
        state.COURS = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (etatInitialCoursCharge) {
            notifierNouveauxLivePourEtudiant(ancienCours, state.COURS);
        }
        etatInitialCoursCharge = true;

        rafraichirVuesLieesAuxCours();
    }, (err) => console.error("Firestore listener error (cours) :", err));

    db.collection('devoirs').onSnapshot((snap) => {
        state.DEVOIRS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        rafraichirVuesLieesAuxDevoirs();
    }, (err) => console.error("Firestore listener error (devoirs) :", err));

    db.collection('supports').onSnapshot((snap) => {
        state.SUPPORTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        afficherSupportsProf();
        afficherSupportsEtudiant();
    }, (err) => console.error("Firestore listener error (supports) :", err));

    // Les dépôts (fichiers + notes) sont sensibles : un étudiant ne doit
    // JAMAIS recevoir dans son navigateur les copies/notes des autres, et un
    // prof ne doit voir que celles de sa propre filière. On restreint donc la
    // requête elle-même (pas juste l'affichage). Seul l'admin a besoin de
    // tout voir (pour l'export Excel des notes toutes filières confondues).
    if (currentUser.role === 'student') {
        db.collection('depots').where('etudiant', '==', currentUser.email).onSnapshot((snap) => {
            state.DEPOTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherDevoirsEtudiant();
        }, (err) => console.error("Firestore listener error (depots) :", err));
    } else if (currentUser.role === 'lecturer') {
        db.collection('depots').where('filiere', '==', currentUser.filiere).onSnapshot((snap) => {
            state.DEPOTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherDepotsProf();
            afficherDevoirsEtudiant();
        }, (err) => console.error("Firestore listener error (depots) :", err));
    } else {
        // Admin : accès complet, nécessaire pour l'export des notes par classe/matière
        db.collection('depots').onSnapshot((snap) => {
            state.DEPOTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherDepotsProf();
            afficherDevoirsEtudiant();
        }, (err) => console.error("Firestore listener error (depots) :", err));
    }

    db.collection('users').onSnapshot((snap) => {
        state.USERS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        afficherUsers();
        afficherStats();
        afficherClasseEtudiant();
        afficherCoursProf();
        afficherMatieresAdmin(); // la liste des profs assignables dépend de state.USERS
        afficherContactsChat(); // la liste des contacts de la messagerie dépend de state.USERS
    }, (err) => console.error("Firestore listener error (users) :", err));

    // ---- MATIERES ----
    // Créées par l'admin pour un niveau (et une filière) donnés, puis attribuées
    // à un professeur de cette filière. Sert de référentiel pour savoir "qui
    // enseigne quoi" ; utilisé aussi pour préremplir le formulaire de
    // programmation de cours côté prof.
    db.collection('matieres').onSnapshot((snap) => {
        state.MATIERES = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        afficherMatieresAdmin();
        afficherMatieresProf();
        remplirSelectMatieresAdmin();
        afficherStats();
        rafraichirVuesLieesAuxCours(); // l'attribution d'une matière peut changer qui gère quel cours
        afficherSupportsProf(); // idem pour les supports visibles/gérés par le prof
    }, (err) => console.error("Firestore listener error (matieres) :", err));

    // ---- INSCRIPTIONS EN LIGNE ----
    // Dossiers déposés par des candidats depuis la page publique
    // registration.html. Données d'état civil : depuis la réorganisation des
    // rôles, seule la DAAS (Direction des Affaires Académiques et de la
    // Scolarité) y accède et en assure la validation (ni l'admin, ni les
    // profs, ni les étudiants n'écoutent plus cette collection).
    if (currentUser.role === 'daas') {
        db.collection('inscriptions').onSnapshot((snap) => {
            state.INSCRIPTIONS = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(b.dateDemande || 0) - new Date(a.dateDemande || 0));
            afficherInscriptionsAdmin();
            afficherStats();
        }, (err) => console.error("Firestore listener error (inscriptions) :", err));
    }

    // ---- NOTES (par matière, saisies/importées par le Service d'Examen) ----
    // Un étudiant ne doit voir QUE ses propres notes : la requête elle-même
    // est restreinte à son email (même logique que pour les dépôts). Le
    // Service d'Examen et l'administration ont besoin de tout voir (pour
    // choisir n'importe quelle filière/niveau/matière à noter, ou pour
    // l'export global des bulletins).
    if (currentUser.role === 'student') {
        db.collection('notes').where('etudiant', '==', currentUser.email).onSnapshot((snap) => {
            state.NOTES = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherNotesEtudiant();
        }, (err) => console.error("Firestore listener error (notes) :", err));
    } else if (currentUser.role === 'exams' || currentUser.role === 'admin') {
        db.collection('notes').onSnapshot((snap) => {
            state.NOTES = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherFormulaireNotesExamen();
        }, (err) => console.error("Firestore listener error (notes) :", err));
    }

    // Temps de présence des étudiants dans les cours (pour le minuteur et le
    // suivi par l'enseignant). Voir "SUIVI DE PRESENCE" plus bas.
    db.collection('presences').onSnapshot((snap) => {
        state.PRESENCES = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        afficherClasseEtudiant();
        afficherCoursProf();
    }, (err) => console.error("Firestore listener error (presences) :", err));

    // ---- MESSAGERIE INSTANTANEE (Prof <-> Étudiant, Prof <-> Admin) ----
    // Seule la page possédant la messagerie écoute cette collection. On ne
    // récupère que les messages où l'utilisateur connecté est participant
    // (champ "participants" = tableau des 2 emails de la conversation),
    // jamais les conversations des autres.
    if (document.getElementById('chatContacts')) {
        db.collection('messages').where('participants', 'array-contains', currentUser.email).onSnapshot({ includeMetadataChanges: true }, (snap) => {
            const nouveauxIds = new Set(
                snap.docChanges().filter(c => c.type === 'added').map(c => c.doc.id)
            );
            const messagesPrecedents = state.MESSAGES;
            state.MESSAGES = snap.docs.map(d => ({ id: d.id, ...d.data(), _enAttente: d.metadata.hasPendingWrites })).sort((a, b) => new Date(a.date) - new Date(b.date));

            // Ne joue le son/notif que pour un message VRAIMENT nouveau reçu
            // (pas au premier chargement, pas pour mes propres messages).
            if (messagesPrecedents.length > 0 || etatInitialMessagesCharge) {
                state.MESSAGES
                    .filter(m => nouveauxIds.has(m.id) && m.from !== currentUser.email)
                    .forEach(m => {
                        jouerSonAlerte();
                        notifierNouveauMessage(m);
                    });
            }
            etatInitialMessagesCharge = true;

            afficherContactsChat();
            afficherMessagesChat();
        }, (err) => console.error("Firestore listener error (messages) :", err));
    }
}

function rafraichirVuesLieesAuxCours() {
    afficherCoursProf();
    afficherCoursEtudiant();
    afficherProchainsCours();
    afficherCoursAdmin();
    afficherStats();
    synchroniserPresenceEtudiant();
    remplirSelectCours('supportCours'); // corrige le select vide si les cours arrivent après le 1er rendu
}

function rafraichirVuesLieesAuxDevoirs() {
    afficherDevoirsAdmin();
    afficherDevoirsEtudiant();
    afficherStats();
    remplirSelectDevoir('depotDevoir');
}

// ---- SESSION (reste locale au navigateur, c'est normal : c'est juste "qui est connecté ici") ----

function getCurrentUser() {
    try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.error('Corrupted session, logging out.', err);
        localStorage.removeItem('currentUser');
        return null;
    }
}

const currentUser = getCurrentUser();

// Une page "publique" (attribut data-public="true" sur <body>) est accessible
// SANS être connecté : c'est le cas du portail d'inscription en ligne, destiné
// à des candidats qui n'ont évidemment pas encore de compte. Ces pages ne
// démarrent aucune écoute temps réel et n'accèdent qu'à la collection
// "inscriptions".
function estPagePublique() {
    return document.body && document.body.dataset.public === 'true';
}

(function guardPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const hasLoginForm = !!document.getElementById('loginForm');

    if (estPagePublique()) return; // portail d'inscription : aucune redirection

    if (!currentUser && !hasLoginForm) {
        window.location.href = 'index.html';
        return;
    }
    if (currentUser) {
        const expectedPage = `${currentUser.role}.html`;
        if (currentPage !== expectedPage) {
            window.location.href = expectedPage;
        }
    }
})();

async function logout() {
    let enAttente = false;
    if (navigator.onLine && typeof db !== 'undefined') {
        // Laisse 4 s aux envois en cours (réseau lent) avant de décider
        const tout = await Promise.race([
            db.waitForPendingWrites().then(() => true),
            new Promise(r => setTimeout(() => r(false), 4000))
        ]).catch(() => true);
        enAttente = !tout;
    }
    if (enAttente && !confirm("Some actions have not been sent yet (weak network). They will stay on this device and be sent the next time you open the app with a connection. Log out anyway?")) {
        return;
    }
    localStorage.removeItem('currentUser');
    // Appareil partagé : on efface les données hors-ligne de la session, sauf s'il reste des envois
    // en attente ou si l'appareil est hors-ligne (le compte resterait alors inutilisable).
    if (!enAttente && navigator.onLine && typeof db !== 'undefined') {
        try {
            await Promise.race([
                db.terminate().then(() => db.clearPersistence()),
                new Promise(r => setTimeout(r, 2500))
            ]);
        } catch (e) { /* tant pis, la déconnexion continue */ }
    }
    window.location.href = 'index.html';
}

// ===================================
// NAVIGATION PAR ONGLETS (Accueil / Tableau de bord / Mes cours)
// Purement de l'affichage : chaque page découpe son contenu en 3 blocs
// <section class="tab-page" data-tab="...">, un seul visible à la fois.
// Aucun élément n'est supprimé du DOM (juste caché) : toutes les écoutes
// Firestore et tous les formulaires continuent de fonctionner normalement
// même dans un onglet actuellement masqué.
// ===================================
function activerOnglet(nomOnglet) {
    document.querySelectorAll('.topnav-tab').forEach(t => t.classList.toggle('actif', t.dataset.tab === nomOnglet));
    document.querySelectorAll('.sidebar-nav-tab').forEach(t => t.classList.toggle('actif', t.dataset.tab === nomOnglet));
    document.querySelectorAll('.tab-page').forEach(p => p.classList.toggle('actif', p.dataset.tab === nomOnglet));
    try { localStorage.setItem('ongletActif_' + currentUser.role, nomOnglet); } catch (err) { /* stockage indisponible, tant pis */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================
// NOTIFICATIONS LIVE (étudiant)
// Ne notifie QUE les étudiants de la filière concernée par le cours lancé.
// ===================================

function jouerSonAlerte() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.6);
    } catch (err) {
        console.warn("Alert sound unavailable:", err);
    }
}

function demanderPermissionNotification() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function envoyerNotificationLive(cours) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notif = new Notification('Lecture is LIVE!', {
            body: `${cours.titre} has just started in ${nomSalle(cours.filiere, cours.salle)}. Join now.`
        });
        notif.onclick = () => {
            window.focus();
            const cible = document.getElementById(`live-cours-${cours.id}`);
            if (cible) cible.scrollIntoView({ behavior: 'smooth' });
        };
    }
}

// Ne concerne QUE les étudiants (une page avec #listeCours) et QUE leur propre filière + niveau
function notifierNouveauxLivePourEtudiant(ancienCours, nouveauCours) {
    if (!currentUser || currentUser.role !== 'student') return;
    if (!document.getElementById('listeCours')) return;
    if (!currentUser.niveau) return;

    const ancienIdsLive = new Set(ancienCours.filter(c => c.en_live).map(c => c.id));
    const nouveauxLiveConcernes = nouveauCours.filter(c =>
        c.en_live && coursConcerneEtudiant(c, currentUser) && !ancienIdsLive.has(c.id)
    );

    nouveauxLiveConcernes.forEach(c => {
        jouerSonAlerte();
        envoyerNotificationLive(c);
    });
}

// ===================================
// SUIVI DE PRESENCE (minuteur par étudiant)
// Pendant qu'un cours de sa filière est en Live, le navigateur de l'étudiant
// enregistre régulièrement le temps écoulé dans Firestore (collection
// "presences"). Ça permet :
//  - au professeur de voir combien de minutes chaque étudiant a passé
//    dans SON cours (afficherCoursProf) ;
//  - aux camarades de classe de voir un minuteur en direct à côté de
//    chaque nom (afficherClasseEtudiant).
// ===================================

// coursId -> { debut: Date, dernierFlush: Date }  (uniquement en mémoire locale)
let presencesEnCours = {};

function idPresence(coursId, email) {
    return `${coursId}_${slugify(email)}`;
}

async function majPresenceFirestore(coursId, enLigne, minutesAAjouter) {
    if (!currentUser) return;
    const ref = db.collection('presences').doc(idPresence(coursId, currentUser.email));
    try {
        await ref.set({
            coursId,
            etudiant: currentUser.email,
            filiere: currentUser.filiere,
            niveau: currentUser.niveau || null,
            enLigne,
            sessionDebut: enLigne ? new Date().toISOString() : null,
            minutesTotal: firebase.firestore.FieldValue.increment(minutesAAjouter || 0)
        }, { merge: true });
    } catch (err) {
        console.error("Error saving attendance:", err);
    }
}

// Enregistre le temps écoulé depuis le dernier "flush" dans Firestore.
// resterEnLigne=false quand le cours n'est plus en Live ou que la page se ferme.
function flushPresence(coursId, resterEnLigne) {
    const session = presencesEnCours[coursId];
    if (!session) return;
    const maintenant = new Date();
    const minutesEcoulees = (maintenant - session.dernierFlush) / 60000;
    session.dernierFlush = maintenant;
    majPresenceFirestore(coursId, resterEnLigne, minutesEcoulees);
}

// Appelée à chaque changement de la liste des cours : démarre/arrête le
// suivi selon les cours actuellement en Live pour la filière de l'étudiant.
function synchroniserPresenceEtudiant() {
    if (!currentUser || currentUser.role !== 'student') return;
    if (!document.getElementById('listeCours')) return; // page étudiant uniquement
    if (!currentUser.niveau) return; // pas de niveau connu = pas de cours concerné

    const coursLiveConcernes = state.COURS.filter(c => c.en_live && coursConcerneEtudiant(c, currentUser));
    const idsLive = new Set(coursLiveConcernes.map(c => c.id));

    coursLiveConcernes.forEach(c => {
        if (!presencesEnCours[c.id]) {
            const maintenant = new Date();
            presencesEnCours[c.id] = { debut: maintenant, dernierFlush: maintenant };
            majPresenceFirestore(c.id, true, 0); // crée/réactive le document de présence
        }
    });

    Object.keys(presencesEnCours).forEach(coursId => {
        if (!idsLive.has(coursId)) {
            flushPresence(coursId, false);
            delete presencesEnCours[coursId];
        }
    });
}

// Sauvegarde périodique (toutes les 30s) pour que profs/camarades voient
// un temps à jour même si l'étudiant reste connecté longtemps.
setInterval(() => {
    Object.keys(presencesEnCours).forEach(coursId => flushPresence(coursId, true));
}, 30000);

// Meilleure tentative de sauvegarde à la fermeture de la page/onglet.
window.addEventListener('beforeunload', () => {
    Object.keys(presencesEnCours).forEach(coursId => flushPresence(coursId, false));
});

// Rafraîchissement visuel du minuteur toutes les secondes (les données
// Firestore, elles, ne changent que toutes les 30s ou moins).
setInterval(() => {
    if (document.hidden) return; // onglet masqué : inutile (économise batterie et données)
    if (!state.COURS.some(c => c.en_live)) return; // aucun live : rien à rafraîchir
    afficherClasseEtudiant();
    afficherCoursProf();
}, 1000);

// Calcule le temps total (en secondes) représenté par un document de présence,
// en ajoutant le temps de la session en cours si l'étudiant est actuellement en ligne.
function calculerSecondesPresence(p) {
    let secondes = (p.minutesTotal || 0) * 60;
    if (p.enLigne && p.sessionDebut) {
        secondes += (Date.now() - new Date(p.sessionDebut).getTime()) / 1000;
    }
    return Math.max(0, Math.round(secondes));
}

// Formate un nombre de secondes en "1h 05min" ou "05:23" (façon minuteur).
function formatDuree(secondesTotales) {
    const s = Math.floor(secondesTotales);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ===================================
// EXPORT DES NOTES EN EXCEL (admin)
// Un fichier par classe (filière + niveau) : une ligne par étudiant
// (nom, prénom), une colonne par devoir/matière avec sa note.
// ===================================
function exporterNotesExcel() {
    const filiereSelect = document.getElementById('exportFiliere');
    const niveauSelect = document.getElementById('exportNiveau');
    const filiere = filiereSelect.value;
    const niveau = niveauSelect.value;

    if (!filiere || !niveau) {
        alert("Please choose a department and a level.");
        return;
    }

    const etudiantsClasse = state.USERS
        .filter(u => u.role === 'student' && u.filiere === filiere && Number(u.niveau) === Number(niveau))
        .sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email));

    if (etudiantsClasse.length === 0) {
        alert("No student found in this class.");
        return;
    }

    // Deux sources de notes distinctes, toutes deux exportées :
    // - les devoirs/TD notés directement par un professeur (via une copie déposée) ;
    // - les notes de matière saisies/importées par le Service d'Examen.
    const devoirsClasse = state.DEVOIRS.filter(d => d.filiere === filiere);
    const matieresClasse = state.MATIERES.filter(m => m.filiere === filiere && Number(m.niveau) === Number(niveau));

    if (typeof XLSX === 'undefined') {
        alert("The Excel export library could not be loaded (check your internet connection) — please try again.");
        return;
    }

    const entetes = ["Index No.", "Last name", "First name", "Email", ...devoirsClasse.map(d => d.titre), ...matieresClasse.map(m => `${m.nom} [${m.ue || 'No module'} - ${m.credits || 0} credit hours - ${getNomSemestre(m.semestre)}] (Examinations Office)`)];
    const lignes = etudiantsClasse.map(u => {
        const ligne = [u.matricule || '', u.nom || '(not provided)', u.prenom || '', u.email];
        devoirsClasse.forEach(d => {
            const depot = state.DEPOTS.find(dep => dep.devoirId === d.id && dep.etudiant === u.email);
            ligne.push(depot && depot.note !== '' && depot.note != null ? Number(depot.note) : '');
        });
        matieresClasse.forEach(m => {
            // Si l'étudiant a déjà validé cette matière lors d'un cursus
            // antérieur (ancien matricule), la cellule reste vide : il ne l'a
            // pas repassée cette année, même si une note existait par erreur.
            if (matiereDejaValideeAvantReinscription(u, m.nom)) {
                ligne.push('');
                return;
            }
            const noteDoc = state.NOTES.find(n => n.matiereId === m.id && n.etudiantId === u.id);
            ligne.push(noteDoc && noteDoc.note != null ? Number(noteDoc.note) : '');
        });
        return ligne;
    });

    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...lignes]);
    feuille['!cols'] = entetes.map((_, i) => ({ wch: i < 4 ? 18 : 22 }));

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Scores");

    const nomClasse = `${getNomFiliere(filiere)}_${getNomNiveau(niveau)}`.replace(/[\/\\?%*:|"<>\s]/g, '-');
    XLSX.writeFile(classeur, `Notes_${nomClasse}.xlsx`);
}

// ===================================
// FONCTIONS NOTES — Service d'Examen
// -----------------------------------
// Le Service d'Examen choisit une filière, un niveau, puis une matière
// (toutes les matières de cette classe, quel que soit le professeur à qui
// elles sont attribuées : le Service d'Examen n'est pas rattaché à une
// filière, il intervient sur l'ensemble de l'établissement). Il peut ensuite
// saisir les notes une à une, ou déposer un fichier Excel rempli en masse.
// Chaque note est stockée dans un document dont l'ID combine la matière et
// l'étudiant (voir idNote()), ce qui évite tout doublon en cas de re-saisie
// ou de ré-import.
// ===================================

function remplirSelectMatieresExamen() {
    const filiereSelect = document.getElementById('examenFiliere');
    const niveauSelect = document.getElementById('examenNiveau');
    const matiereSelect = document.getElementById('examenMatiere');
    if (!filiereSelect || !niveauSelect || !matiereSelect) return;

    const filiere = filiereSelect.value;
    const niveau = niveauSelect.value;
    const valeurActuelle = matiereSelect.value;

    if (!filiere || !niveau) {
        matiereSelect.innerHTML = '<option value="">-- Choose department and level --</option>';
        document.getElementById('zoneSaisieNotesExamen').innerHTML = '';
        return;
    }

    const matieresClasse = state.MATIERES.filter(m => m.filiere === filiere && Number(m.niveau) === Number(niveau));

    // Regroupées par UE (via <optgroup>) pour repérer d'un coup d'œil quelle
    // matière appartient à quelle UE pendant la saisie des notes.
    const groupesUe = regrouperParUe(matieresClasse.map(m => ({ ...m })));
    matiereSelect.innerHTML = '<option value="">-- Choose a course --</option>' +
        groupesUe.map(g => `<optgroup label="${escapeHtml(g.ue)} (${g.creditsMax} credit hours)">${
            g.lignes.map(m => `<option value="${m.id}">${escapeHtml(m.nom)} — ${getNomSemestre(m.semestre)}${m.profEmail ? ' (' + escapeHtml(m.profEmail) + ')' : ' (not assigned)'}</option>`).join('')
        }</optgroup>`).join('');

    const zone = document.getElementById('zoneSaisieNotesExamen');
    if (matieresClasse.length === 0) {
        zone.innerHTML = "<p>No course has been created by the administration for this department and level yet.</p>";
        return;
    }

    // Reste sur la même matière si elle existe toujours dans la nouvelle
    // liste (ex : la classe se met à jour mais l'admin n'a pas changé de
    // sélection), sinon on repart d'une sélection vide.
    if (valeurActuelle && matieresClasse.some(m => m.id === valeurActuelle)) {
        matiereSelect.value = valeurActuelle;
        afficherFormulaireNotesExamen();
    } else {
        zone.innerHTML = '';
    }
}

// Ré-affiche le tableau de saisie pour la matière actuellement sélectionnée
// (appelé à chaque changement de sélection ET à chaque mise à jour temps
// réel de state.NOTES/state.USERS, pour que la saisie d'un collègue ou une
// note fraîchement importée apparaisse immédiatement).
function afficherFormulaireNotesExamen() {
    const matiereSelect = document.getElementById('examenMatiere');
    const zone = document.getElementById('zoneSaisieNotesExamen');
    if (!matiereSelect || !zone) return;

    const matiereId = matiereSelect.value;
    if (!matiereId) return;

    const matiere = state.MATIERES.find(m => m.id === matiereId);
    if (!matiere) {
        zone.innerHTML = '<p>Course not found (it may have been deleted).</p>';
        return;
    }

    const etudiantsClasse = state.USERS
        .filter(u => u.role === 'student' && u.filiere === matiere.filiere && Number(u.niveau) === Number(matiere.niveau))
        .sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email));

    if (etudiantsClasse.length === 0) {
        zone.innerHTML = `<p>No student is currently registered in ${escapeHtml(getNomFiliere(matiere.filiere))} - ${escapeHtml(getNomNiveau(matiere.niveau))}.</p>`;
        return;
    }

    // Un ancien étudiant qui a déjà validé cette matière (même nom) lors d'un
    // cursus antérieur (identifié par son ANCIEN matricule) n'a pas à la
    // repasser : il n'apparaît donc pas dans la liste à noter.
    const etudiantsAExclure = etudiantsClasse.filter(u => matiereDejaValideeAvantReinscription(u, matiere.nom));
    const etudiantsANoter = etudiantsClasse.filter(u => !matiereDejaValideeAvantReinscription(u, matiere.nom));

    const messageExclusion = etudiantsAExclure.length > 0
        ? `<p class="info">${etudiantsAExclure.length} student(s) already graded and left out of the list: they already passed « ${escapeHtml(matiere.nom)} » in a previous programme (old index number) and do not need to retake it.</p>`
        : '';

    if (etudiantsANoter.length === 0) {
        zone.innerHTML = `${messageExclusion}<p>All students in this class have already passed this course.</p>`;
        return;
    }

    zone.innerHTML = `
        ${messageExclusion}
        <p>Module: <b>${escapeHtml(matiere.ue || 'No module')}</b> — <b>${matiere.credits || 0}</b> credit hour(s) — Semester <b>${getNomSemestre(matiere.semestre)}</b></p>
        <div class="card">
            <p><b>Quick import from an Excel file</b><br>
            Download the template (already filled in with the list and current scores of this
            class for this course), complete/correct the "Score" column, then upload it here.</p>
            <button type="button" onclick="telechargerModeleNotesExamen('${matiereId}')" class="btn-secondary">Download template (.xlsx)</button>
            <input type="file" id="fichierNotesExamen" accept=".xlsx,.xls,.csv">
            <button type="button" onclick="analyserFichierNotesExamen('${matiereId}')">Analyse file</button>
            <div id="apercuNotesImport"></div>
        </div>
        <table class="notes-table">
            <thead><tr><th>Index No.</th><th>Student</th><th>Score / ${NOTE_MAX}</th><th>Grade</th><th></th></tr></thead>
            <tbody>
            ${etudiantsANoter.map(u => {
                const noteDoc = state.NOTES.find(n => n.matiereId === matiereId && n.etudiantId === u.id);
                const valeur = noteDoc && noteDoc.note !== '' && noteDoc.note != null ? noteDoc.note : '';
                const mention = getMention(valeur);
                const cle = idNote(matiereId, u.id);
                return `<tr>
                    <td>${escapeHtml(u.matricule || '—')}</td>
                    <td>${escapeHtml(nomAffiche(u))}</td>
                    <td><input type="number" min="0" max="${NOTE_MAX}" step="0.5" id="noteInput_${cle}" value="${valeur}" oninput="previsualiserMentionExamen('${cle}', this.value)"></td>
                    <td><span class="mention-badge ${mention.classe}" id="noteMention_${cle}">${mention.texte}</span></td>
                    <td><button type="button" onclick="enregistrerNoteExamen('${matiereId}', '${u.id}', '${escapeHtml(u.email)}')">Save</button></td>
                </tr>`;
            }).join('')}
            </tbody>
        </table>`;
}

// Met à jour la pastille "Mention" en direct pendant la saisie, sans
// attendre l'enregistrement (juste un aperçu visuel local).
function previsualiserMentionExamen(cle, valeur) {
    const badge = document.getElementById(`noteMention_${cle}`);
    if (!badge) return;
    const mention = getMention(valeur);
    badge.className = `mention-badge ${mention.classe}`;
    badge.innerText = mention.texte;
}

async function enregistrerNoteExamen(matiereId, etudiantId, etudiantEmail) {
    const input = document.getElementById(`noteInput_${idNote(matiereId, etudiantId)}`);
    if (!input) return;
    const brut = input.value.trim();
    if (brut === '') {
        alert("Please enter a score before saving.");
        return;
    }
    const valeur = Number(brut);
    if (Number.isNaN(valeur) || valeur < 0 || valeur > NOTE_MAX) {
        alert(`The score must be a number between 0 and ${NOTE_MAX}.`);
        return;
    }
    const matiere = state.MATIERES.find(m => m.id === matiereId);
    const etudiant = state.USERS.find(u => u.id === etudiantId);
    try {
        const etat = await ecrireEnFile(db.collection('notes').doc(idNote(matiereId, etudiantId)).set({
            matiereId,
            matiereNom: matiere ? matiere.nom : '',
            matiereUe: matiere ? matiere.ue || '' : '',
            matiereCredits: matiere ? matiere.credits || 0 : 0,
            matiereSemestre: matiere ? matiere.semestre || null : null,
            filiere: matiere ? matiere.filiere : null,
            niveau: matiere ? matiere.niveau : null,
            etudiantId,
            etudiant: etudiantEmail,
            matricule: etudiant ? etudiant.matricule || '' : '',
            note: valeur,
            saisiPar: currentUser.email,
            dateMaj: new Date().toISOString()
        }, { merge: true }));
        if (etat === 'file') afficherToast(messageFile('Score'));
    } catch (err) {
        console.error(err);
        alert("Unable to save this score.");
    }
}

function telechargerModeleNotesExamen(matiereId) {
    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not be loaded (check your internet connection) — please try again.");
        return;
    }
    const matiere = state.MATIERES.find(m => m.id === matiereId);
    if (!matiere) return;

    const etudiantsClasse = state.USERS
        .filter(u => u.role === 'student' && u.filiere === matiere.filiere && Number(u.niveau) === Number(matiere.niveau))
        // Un ancien étudiant ayant déjà validé cette matière n'a pas à être
        // renoté : il est exclu du modèle, comme du tableau de saisie.
        .filter(u => !matiereDejaValideeAvantReinscription(u, matiere.nom))
        .sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email));
    const lignes = etudiantsClasse.map(u => {
        const noteDoc = state.NOTES.find(n => n.matiereId === matiereId && n.etudiantId === u.id);
        return [u.matricule || '', u.nom || '', u.prenom || '', noteDoc && noteDoc.note != null ? noteDoc.note : ''];
    });

    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...lignes]);
    feuille['!cols'] = entetes.map(() => ({ wch: 20 }));

    const feuilleInfos = XLSX.utils.aoa_to_sheet([
        ['Course', matiere.nom],
        ["Module", matiere.ue || 'No module'],
        ['Credit hours', matiere.credits || 0],
        ['Semester', getNomSemestre(matiere.semestre)],
        ['Department', getNomFiliere(matiere.filiere)],
        ['Level', getNomNiveau(matiere.niveau)],
        [],
        ['Do not change the "Index No." column or the order of the rows: it is the'],
        ['index number that identifies the student on re-import, not the row.'],
        [`The "Score" column must be a number between 0 and ${NOTE_MAX} (empty = no score).`]
    ]);

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Scores");
    XLSX.utils.book_append_sheet(classeur, feuilleInfos, "Info");

    const nomFichier = `Scores_Template_${matiere.nom}_${getNomFiliere(matiere.filiere)}_${getNomNiveau(matiere.niveau)}`.replace(/[\/\\?%*:|"<>\s]/g, '-');
    XLSX.writeFile(classeur, `${nomFichier}.xlsx`);
}

// ===================================
// RELEVÉS DE NOTES — Service d'Examen
// -----------------------------------
// Depuis la réorganisation des rôles, c'est le Service d'Examen qui imprime
// les relevés de notes officiels des étudiants (la DAAS, elle, valide les
// inscriptions). Le Service d'Examen choisit une filière puis un niveau : la
// liste des étudiants de cette classe apparaît, il choisit l'étudiant
// concerné et génère un relevé mettant bout à bout toutes les matières de sa
// classe (notées ou non), avec la moyenne générale calculée sur les seules
// matières déjà notées. Le relevé généré est ensuite envoyé à l'impression
// du navigateur (voir le bloc @media print de style.css : seul le document
// #releveImprimable est imprimé, le reste de l'interface est masqué).
// ===================================

function remplirSelectEtudiantsReleve() {
    const filiereSelect = document.getElementById('releveFiliere');
    const niveauSelect = document.getElementById('releveNiveau');
    const semestreSelect = document.getElementById('releveSemestre');
    const etudiantSelect = document.getElementById('releveEtudiant');
    if (!filiereSelect || !niveauSelect || !etudiantSelect) return;

    document.getElementById('zoneReleveExamen').innerHTML = '';

    const filiere = filiereSelect.value;
    const niveau = niveauSelect.value;

    // Le relevé étant désormais édité semestre par semestre, la liste des
    // semestres proposés dépend du niveau choisi (ex : niveau 3 -> S5, S6
    // uniquement).
    if (semestreSelect) remplirSelectSemestres('releveSemestre', niveau);

    if (!filiere || !niveau) {
        etudiantSelect.innerHTML = '<option value="">-- Choose department and level --</option>';
        return;
    }

    const etudiantsClasse = state.USERS
        .filter(u => u.role === 'student' && u.filiere === filiere && Number(u.niveau) === Number(niveau))
        .sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email));

    etudiantSelect.innerHTML = etudiantsClasse.length === 0
        ? '<option value="">-- No student in this class --</option>'
        : '<option value="">-- Choose a student --</option>' +
          etudiantsClasse.map(u => `<option value="${u.id}">${escapeHtml(nomAffiche(u))}${u.matricule ? ' — ' + escapeHtml(u.matricule) : ''}</option>`).join('');
}

// Construit et affiche le relevé de notes officiel d'un étudiant pour UN
// SEMESTRE PRÉCIS, prêt à être imprimé (bouton "Imprimer" -> window.print()).
// Le relevé est désormais toujours édité semestre par semestre (S1, S2, ...)
// et non plus niveau par niveau : un niveau regroupant 2 semestres, mélanger
// les deux dans un même document faussait la moyenne et les crédits ECTS
// affichés (voir NIVEAU_SEMESTRES / getSemestresDuNiveau).
function genererReleveExamen() {
    const etudiantSelect = document.getElementById('releveEtudiant');
    const semestreSelect = document.getElementById('releveSemestre');
    const zone = document.getElementById('zoneReleveExamen');
    if (!etudiantSelect || !zone) return;

    const etudiantId = etudiantSelect.value;
    if (!etudiantId) {
        alert("Please choose a student.");
        return;
    }
    const semestre = semestreSelect ? Number(semestreSelect.value) || null : null;
    if (!semestre) {
        alert("Please choose a semester: the transcript is issued semester by semester.");
        return;
    }
    const etudiant = state.USERS.find(u => u.id === etudiantId);
    if (!etudiant) {
        zone.innerHTML = '<p>Student not found (may have been deleted since).</p>';
        return;
    }

    const matieresClasse = state.MATIERES
        .filter(m => m.filiere === etudiant.filiere && Number(m.niveau) === Number(etudiant.niveau))
        // Seules les matières du semestre choisi figurent sur ce relevé.
        .filter(m => Number(m.semestre) === semestre)
        // Une matière déjà validée par cet étudiant lors d'un cursus antérieur
        // (ancien matricule) ne figure pas sur son relevé actuel : il ne l'a
        // pas repassée, elle n'a donc pas sa place dans ce cycle.
        .filter(m => !matiereDejaValideeAvantReinscription(etudiant, m.nom))
        .sort((a, b) => (a.nom || '').localeCompare(b.nom || ''));

    const lignesNotes = matieresClasse.map(m => {
        const noteDoc = state.NOTES.find(n => n.matiereId === m.id && n.etudiantId === etudiant.id);
        const note = noteDoc && noteDoc.note !== '' && noteDoc.note != null ? Number(noteDoc.note) : null;
        return { matiere: m.nom, ue: m.ue, credits: m.credits, semestre: m.semestre, note };
    });

    const notesChiffrees = lignesNotes.filter(l => l.note !== null);
    const moyenne = notesChiffrees.length > 0
        ? notesChiffrees.reduce((somme, l) => somme + l.note, 0) / notesChiffrees.length
        : null;
    const mentionGenerale = moyenne !== null ? getMention(moyenne) : { texte: 'Cannot be calculated', classe: 'mention-attente' };

    // Regroupement par UE (Unité d'Enseignement), au sein de ce seul
    // semestre : chaque UE affiche ses matières puis un sous-total de
    // crédits ECTS acquis (note ≥ 10/20 obligatoire sur CHAQUE matière,
    // règle inchangée) sur le total possible pour ce semestre.
    const groupesUe = regrouperParUe(lignesNotes.map(l => ({ nom: l.matiere, ue: l.ue, credits: l.credits, semestre: l.semestre, note: l.note })));
    const creditsTotalMax = groupesUe.reduce((s, g) => s + g.creditsMax, 0);
    const creditsTotalAcquis = groupesUe.reduce((s, g) => s + g.creditsAcquis, 0);

    const lignesTableau = groupesUe.map(g => `
        <tr class="ligne-ue"><td colspan="3"><b>${escapeHtml(g.ue)}</b> — ${g.creditsAcquis} / ${g.creditsMax} credit hour(s)</td></tr>
        ${g.lignes.map(l => `<tr>
            <td>${escapeHtml(l.nom)}</td>
            <td>${l.note !== null ? l.note : '—'}</td>
            <td>${l.note !== null ? getMention(l.note).texte : 'Not graded'}</td>
        </tr>`).join('')}
    `).join('') || `<tr><td colspan="3">No course has been created yet for this department, this level and ${getNomSemestre(semestre)}.</td></tr>`;

    zone.innerHTML = `
        <div class="releve-document" id="releveImprimable">
            <div class="releve-entete">
                <img src="./logo.png" alt="UEW logo" class="releve-logo">
                <div>
                    <h4>University of Education, Winneba</h4>
                    <p>Examinations Office — Official transcript — ${getNomSemestre(semestre)}</p>
                </div>
            </div>
            <table class="releve-identite">
                <tr><td><b>Full name</b></td><td>${escapeHtml(nomAffiche(etudiant))}</td></tr>
                <tr><td><b>Index No.</b></td><td>${escapeHtml(etudiant.matricule || '—')}</td></tr>
                <tr><td><b>Department</b></td><td>${escapeHtml(getNomFiliere(etudiant.filiere))}</td></tr>
                <tr><td><b>Level</b></td><td>${escapeHtml(getNomNiveau(etudiant.niveau))}</td></tr>
                <tr><td><b>Semester</b></td><td>${getNomSemestre(semestre)}</td></tr>
                <tr><td><b>Date issued</b></td><td>${new Date().toLocaleDateString('en-GB')}</td></tr>
            </table>
            <table class="notes-table">
                <thead><tr><th>Course (by module)</th><th>Score / ${NOTE_MAX}</th><th>Grade</th></tr></thead>
                <tbody>
                    ${lignesTableau}
                </tbody>
                <tfoot>
                    <tr><td><b>Total credit hours earned</b></td><td colspan="2"><b>${creditsTotalAcquis} / ${creditsTotalMax}</b></td></tr>
                    <tr><td><b>Semester average</b></td><td><b>${moyenne !== null ? moyenne.toFixed(2) : '—'}</b></td><td><b>${mentionGenerale.texte}</b></td></tr>
                </tfoot>
            </table>
            <p class="releve-signature">Issued on ${new Date().toLocaleDateString('en-GB')} — Stamp and signature of the Examinations Office</p>
        </div>
        <button type="button" class="no-print btn-success" onclick="window.print()">🖨️ Print this transcript</button>
    `;
}

let notesDetecteesImport = [];

// ===================================
// PARCOURS DE L'ÉTUDIANT — Service d'Examen
// -----------------------------------
// Reconstitue l'historique académique COMPLET d'un(e) étudiant(e), y compris
// les niveaux/notes obtenus sous un ANCIEN matricule si il/elle s'est
// réinscrit(e) (voir la chaîne "ancienMatricule" déjà utilisée par
// matiereDejaValideeAvantReinscription). Contrairement au relevé de notes
// (limité à la classe ACTUELLE), le parcours affiche TOUTES les notes
// jamais enregistrées sous l'un des matricules de cette personne, groupées
// par niveau puis par UE, plus son activité (présence en direct, devoirs
// déposés) sur son (ou ses) compte(s).
// ===================================

// Remonte la chaîne des comptes d'un(e) étudiant(e) : le compte actuel, puis
// (si ancienEtudiant) le compte retrouvé pour son ancienMatricule, et ainsi
// de suite tant qu'un compte correspondant existe encore en base. Protégé
// contre les boucles par le Set des matricules déjà visités.
function collecterComptesParcours(etudiant) {
    const comptes = [etudiant];
    const vus = new Set([(etudiant.matricule || '').toLowerCase()].filter(Boolean));
    let ancien = etudiant.ancienMatricule;
    while (ancien && !vus.has(ancien.toLowerCase())) {
        vus.add(ancien.toLowerCase());
        const compte = state.USERS.find(u => (u.matricule || '').toLowerCase() === ancien.toLowerCase());
        if (!compte) break;
        comptes.push(compte);
        ancien = compte.ancienMatricule;
    }
    return comptes;
}

// Tous les matricules de la chaîne, y compris le tout premier ancienMatricule
// même si le compte correspondant a depuis été supprimé (ses notes, elles,
// restent en base avec ce matricule en toutes lettres).
function collecterMatriculesParcours(etudiant) {
    const comptes = collecterComptesParcours(etudiant);
    const matricules = comptes.map(c => c.matricule).filter(Boolean);
    const dernier = comptes[comptes.length - 1];
    if (dernier && dernier.ancienMatricule && !matricules.some(m => m.toLowerCase() === dernier.ancienMatricule.toLowerCase())) {
        matricules.push(dernier.ancienMatricule);
    }
    return matricules;
}

function remplirSelectEtudiantsParcours() {
    const filiereSelect = document.getElementById('parcoursFiliere');
    const niveauSelect = document.getElementById('parcoursNiveau');
    const etudiantSelect = document.getElementById('parcoursEtudiant');
    if (!filiereSelect || !niveauSelect || !etudiantSelect) return;

    document.getElementById('zoneParcoursExamen').innerHTML = '';

    const filiere = filiereSelect.value;
    const niveau = niveauSelect.value;
    if (!filiere || !niveau) {
        etudiantSelect.innerHTML = '<option value="">-- Choose department and level --</option>';
        return;
    }

    const etudiantsClasse = state.USERS
        .filter(u => u.role === 'student' && u.filiere === filiere && Number(u.niveau) === Number(niveau))
        .sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email));

    etudiantSelect.innerHTML = etudiantsClasse.length === 0
        ? '<option value="">-- No student in this class --</option>'
        : '<option value="">-- Choose a student --</option>' +
          etudiantsClasse.map(u => `<option value="${u.id}">${escapeHtml(nomAffiche(u))}${u.matricule ? ' — ' + escapeHtml(u.matricule) : ''}</option>`).join('');
}

// Construit et affiche le parcours académique complet d'un(e) étudiant(e),
// prêt à être imprimé ou exporté en Excel.
function genererParcoursEtudiant() {
    const etudiantSelect = document.getElementById('parcoursEtudiant');
    const zone = document.getElementById('zoneParcoursExamen');
    if (!etudiantSelect || !zone) return;

    const etudiantId = etudiantSelect.value;
    if (!etudiantId) {
        alert("Please choose a student.");
        return;
    }
    const etudiant = state.USERS.find(u => u.id === etudiantId);
    if (!etudiant) {
        zone.innerHTML = '<p>Student not found (may have been deleted since).</p>';
        return;
    }

    const comptes = collecterComptesParcours(etudiant);
    const matricules = collecterMatriculesParcours(etudiant);
    const emails = comptes.map(c => c.email).filter(Boolean);

    // Toutes les notes jamais enregistrées sous l'un des matricules de cette
    // personne (cursus actuel + cursus antérieur(s) éventuel(s)).
    const notesParcours = state.NOTES.filter(n => matricules.some(m => (n.matricule || '').toLowerCase() === m.toLowerCase()));

    // Regroupement par SEMESTRE (issu du champ "matiereSemestre" enregistré
    // sur chaque note au moment de la saisie), du plus ancien au plus récent
    // — le parcours complet se lit désormais semestre par semestre comme
    // n'importe quel relevé, et non plus niveau par niveau (2 semestres
    // mélangés). Une note enregistrée avant l'ajout du semestre sur les
    // matières (matiereSemestre absent) est regroupée à part par niveau, en
    // toute fin de parcours, plutôt que perdue ou rattachée au hasard.
    const parSemestre = {};
    notesParcours.forEach(n => {
        const semestre = n.matiereSemestre ? Number(n.matiereSemestre) : null;
        const cle = semestre !== null ? `s${semestre}` : `niv${Number(n.niveau)}`;
        if (!parSemestre[cle]) parSemestre[cle] = { semestre, niveau: Number(n.niveau), filieres: new Set(), lignes: [] };
        parSemestre[cle].filieres.add(n.filiere);
        parSemestre[cle].lignes.push({
            nom: n.matiereNom, ue: n.matiereUe, credits: n.matiereCredits, semestre: n.matiereSemestre,
            note: n.note !== '' && n.note != null ? Number(n.note) : null
        });
    });
    const blocsTries = Object.values(parSemestre).sort((a, b) => {
        if (a.semestre !== null && b.semestre !== null) return a.semestre - b.semestre;
        if (a.semestre === null && b.semestre === null) return a.niveau - b.niveau;
        return a.semestre === null ? 1 : -1;
    });

    let creditsTotalMax = 0;
    let creditsTotalAcquis = 0;
    const blocsSemestres = blocsTries.map(bloc => {
        const groupesUe = regrouperParUe(bloc.lignes);
        const creditsBlocMax = groupesUe.reduce((s, g) => s + g.creditsMax, 0);
        const creditsBlocAcquis = groupesUe.reduce((s, g) => s + g.creditsAcquis, 0);
        creditsTotalMax += creditsBlocMax;
        creditsTotalAcquis += creditsBlocAcquis;

        const lignesTableau = groupesUe.map(g => `
            <tr class="ligne-ue"><td colspan="3"><b>${escapeHtml(g.ue)}</b> — ${g.creditsAcquis} / ${g.creditsMax} credit hour(s)</td></tr>
            ${g.lignes.map(l => `<tr>
                <td>${escapeHtml(l.nom)}</td>
                <td>${l.note !== null ? l.note : '—'}</td>
                <td>${l.note !== null ? getMention(l.note).texte : 'Not graded'}</td>
            </tr>`).join('')}
        `).join('');

        const titreBloc = bloc.semestre
            ? `${getNomSemestre(bloc.semestre)} (${getNomNiveau(bloc.niveau)})`
            : `${getNomNiveau(bloc.niveau)} — semester not set`;

        return `
            <h4 style="margin-top:20px;">${escapeHtml(titreBloc)} — ${[...bloc.filieres].map(f => escapeHtml(getNomFiliere(f))).join(', ')}
                <small>(${creditsBlocAcquis} / ${creditsBlocMax} credit hours)</small></h4>
            <table class="notes-table">
                <thead><tr><th>Course (by module)</th><th>Score / ${NOTE_MAX}</th><th>Grade</th></tr></thead>
                <tbody>${lignesTableau}</tbody>
            </table>`;
    }).join('') || '<p>No score has been recorded yet for this student.</p>';

    // Activité : présence cumulée en direct + nombre de devoirs déposés,
    // sur l'ensemble des comptes de la chaîne (utile si compte recréé).
    const secondesPresence = state.PRESENCES
        .filter(p => emails.includes(p.etudiant))
        .reduce((s, p) => s + calculerSecondesPresence(p), 0);
    const nbDevoirsDeposes = state.DEPOTS.filter(d => emails.includes(d.etudiant)).length;

    const matriculesAffiches = matricules.map(m => escapeHtml(m)).join(' → ');

    zone.innerHTML = `
        <div class="releve-document" id="parcoursImprimable">
            <div class="releve-entete">
                <img src="./logo.png" alt="UEW logo" class="releve-logo">
                <div>
                    <h4>University of Education, Winneba</h4>
                    <p>Examinations Office — Complete academic record</p>
                </div>
            </div>
            <table class="releve-identite">
                <tr><td><b>Full name</b></td><td>${escapeHtml(nomAffiche(etudiant))}</td></tr>
                <tr><td><b>Index No. (history)</b></td><td>${matriculesAffiches || '—'}</td></tr>
                <tr><td><b>Current department</b></td><td>${escapeHtml(getNomFiliere(etudiant.filiere))}</td></tr>
                <tr><td><b>Current level</b></td><td>${escapeHtml(getNomNiveau(etudiant.niveau))}</td></tr>
                <tr><td><b>Cumulative live attendance</b></td><td>${formatDuree(secondesPresence)}</td></tr>
                <tr><td><b>Assignments submitted</b></td><td>${nbDevoirsDeposes}</td></tr>
                <tr><td><b>Date issued</b></td><td>${new Date().toLocaleDateString('en-GB')}</td></tr>
            </table>

            ${blocsSemestres}

            <table class="notes-table" style="margin-top:16px;">
                <tfoot>
                    <tr><td><b>Total credit hours earned (all levels)</b></td><td><b>${creditsTotalAcquis} / ${creditsTotalMax}</b></td></tr>
                </tfoot>
            </table>
            <p class="releve-signature">Issued on ${new Date().toLocaleDateString('en-GB')} — Stamp and signature of the Examinations Office</p>
        </div>
        <button type="button" class="no-print btn-success" onclick="window.print()">🖨️ Print this record</button>
        <button type="button" class="no-print btn-secondary" onclick="exporterParcoursExcel('${etudiantId}')">📊 Export to Excel</button>
    `;
}

// Export Excel du parcours (une feuille "Identité", une feuille "Notes" avec
// toutes les matières groupées par niveau puis UE).
function exporterParcoursExcel(etudiantId) {
    if (typeof XLSX === 'undefined') {
        alert("The Excel export library could not be loaded (check your internet connection) — please try again.");
        return;
    }
    const etudiant = state.USERS.find(u => u.id === etudiantId);
    if (!etudiant) return;

    const comptes = collecterComptesParcours(etudiant);
    const matricules = collecterMatriculesParcours(etudiant);
    const emails = comptes.map(c => c.email).filter(Boolean);

    const notesParcours = state.NOTES.filter(n => matricules.some(m => (n.matricule || '').toLowerCase() === m.toLowerCase()));
    // Même logique de regroupement par semestre que l'affichage à l'écran
    // (genererParcoursEtudiant) : cohérence entre le document imprimé et le
    // fichier Excel exporté.
    const parSemestre = {};
    notesParcours.forEach(n => {
        const semestre = n.matiereSemestre ? Number(n.matiereSemestre) : null;
        const cle = semestre !== null ? `s${semestre}` : `niv${Number(n.niveau)}`;
        if (!parSemestre[cle]) parSemestre[cle] = { semestre, niveau: Number(n.niveau), lignes: [] };
        parSemestre[cle].lignes.push({
            nom: n.matiereNom, ue: n.matiereUe, credits: n.matiereCredits, semestre: n.matiereSemestre,
            note: n.note !== '' && n.note != null ? Number(n.note) : null
        });
    });
    const blocsTries = Object.values(parSemestre).sort((a, b) => {
        if (a.semestre !== null && b.semestre !== null) return a.semestre - b.semestre;
        if (a.semestre === null && b.semestre === null) return a.niveau - b.niveau;
        return a.semestre === null ? 1 : -1;
    });

    const secondesPresence = state.PRESENCES.filter(p => emails.includes(p.etudiant)).reduce((s, p) => s + calculerSecondesPresence(p), 0);
    const nbDevoirsDeposes = state.DEPOTS.filter(d => emails.includes(d.etudiant)).length;

    const feuilleIdentite = XLSX.utils.aoa_to_sheet([
        ['Last name', etudiant.nom || ''],
        ['First name', etudiant.prenom || ''],
        ['Index No.(s) (history)', matricules.join(' -> ')],
        ['Current department', getNomFiliere(etudiant.filiere)],
        ['Current level', getNomNiveau(etudiant.niveau)],
        ['Cumulative live attendance', formatDuree(secondesPresence)],
        ['Assignments submitted', nbDevoirsDeposes]
    ]);

    const lignesNotes = [['Semester', 'Level', 'Module', 'Course', 'Credit hours', `Score / ${NOTE_MAX}`, 'Grade']];
    let creditsTotalMax = 0, creditsTotalAcquis = 0;
    blocsTries.forEach(bloc => {
        const libelleSemestre = bloc.semestre ? getNomSemestre(bloc.semestre) : 'Not provided';
        const groupesUe = regrouperParUe(bloc.lignes);
        let creditsBlocMax = 0, creditsBlocAcquis = 0;
        groupesUe.forEach(g => {
            creditsBlocMax += g.creditsMax;
            creditsBlocAcquis += g.creditsAcquis;
            g.lignes.forEach(l => lignesNotes.push([
                libelleSemestre, getNomNiveau(bloc.niveau), g.ue, l.nom || '', l.credits || 0,
                l.note !== null ? l.note : '', l.note !== null ? getMention(l.note).texte : 'Not graded'
            ]));
        });
        lignesNotes.push(['', '', '', `Subtotal ${libelleSemestre}`, `${creditsBlocAcquis} / ${creditsBlocMax}`, '', '']);
        creditsTotalMax += creditsBlocMax;
        creditsTotalAcquis += creditsBlocAcquis;
    });
    lignesNotes.push([]);
    lignesNotes.push(['', '', '', 'TOTAL CREDIT HOURS EARNED', `${creditsTotalAcquis} / ${creditsTotalMax}`, '', '']);

    const feuilleNotes = XLSX.utils.aoa_to_sheet(lignesNotes);
    feuilleNotes['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 22 }, { wch: 32 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuilleIdentite, "Identity");
    XLSX.utils.book_append_sheet(classeur, feuilleNotes, "Academic record");

    const nomFichier = `Academic_Record_${etudiant.nom || etudiant.email}_${etudiant.prenom || ''}`.replace(/[\/\\?%*:|"<>\s]/g, '-');
    XLSX.writeFile(classeur, `${nomFichier}.xlsx`);
}


async function analyserFichierNotesExamen(matiereId) {
    const input = document.getElementById('fichierNotesExamen');
    const apercu = document.getElementById('apercuNotesImport');
    const matiere = state.MATIERES.find(m => m.id === matiereId);

    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not be loaded (check your internet connection) — please try again.");
        return;
    }
    if (!matiere) {
        apercu.innerHTML = "<p>Course not found.</p>";
        return;
    }
    if (!input.files || !input.files[0]) {
        alert("Choose an Excel (.xlsx) or CSV file to analyse.");
        return;
    }

    apercu.innerHTML = '<p>Reading file...</p>';

    try {
        const buffer = await input.files[0].arrayBuffer();
        const classeur = XLSX.read(buffer, { type: 'array' });
        const premiereFeuille = classeur.Sheets[classeur.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(premiereFeuille, { defval: '' });

        if (lignes.length === 0) {
            apercu.innerHTML = "<p>The file contains no usable row. Please use the template provided.</p>";
            return;
        }

        const lireColonne = (ligne, nomAttendu) => {
            const clef = Object.keys(ligne).find(k => nomAttendu.split('|').includes(normaliserEntete(k)));
            return clef !== undefined ? String(ligne[clef]).trim() : '';
        };

        const etudiantsClasse = state.USERS.filter(u => u.role === 'student' && u.filiere === matiere.filiere && Number(u.niveau) === Number(matiere.niveau));
        const parMatricule = new Map(etudiantsClasse.filter(u => u.matricule).map(u => [u.matricule.toLowerCase(), u]));

        notesDetecteesImport = lignes.map((ligne, index) => {
            const matricule = lireColonne(ligne, 'indexno|matricule');
            const noteBrute = lireColonne(ligne, 'score|note');
            const erreurs = [];

            if (!matricule) erreurs.push("missing index number");
            const etudiant = matricule ? parMatricule.get(matricule.toLowerCase()) : null;
            if (matricule && !etudiant) erreurs.push("unknown index number in this class");
            if (etudiant && matiereDejaValideeAvantReinscription(etudiant, matiere.nom)) {
                erreurs.push("this course has already been passed by this student (old index number): it does not need to be graded again");
            }

            let note = null;
            if (noteBrute !== '') {
                note = Number(noteBrute);
                if (Number.isNaN(note) || note < 0 || note > NOTE_MAX) erreurs.push(`invalid score (0 to ${NOTE_MAX})`);
            } else {
                erreurs.push("empty score");
            }

            return { ligneNum: index + 2, matricule, etudiant, note, erreurs };
        });

        const nbValides = notesDetecteesImport.filter(n => n.erreurs.length === 0).length;

        apercu.innerHTML = `
            <p>${notesDetecteesImport.length} row(s) read, of which <b>${nbValides} valid</b>. Rows with errors are greyed out: fix them in the file and re-analyse if needed.</p>
            <div class="checkbox-group">
                ${notesDetecteesImport.map((n, i) => {
                    const ok = n.erreurs.length === 0;
                    const details = ok
                        ? `${escapeHtml(nomAffiche(n.etudiant))} (${escapeHtml(n.matricule)}) — Score: ${n.note}/${NOTE_MAX} (${getMention(n.note).texte})`
                        : `Row ${n.ligneNum} (${n.matricule || 'missing index number'}) : ${n.erreurs.join(', ')}`;
                    return `<label><input type="checkbox" id="noteImport_${i}" ${ok ? 'checked' : 'disabled'}> ${details}</label>`;
                }).join('')}
            </div>
            <button type="button" onclick="importerNotesSelectionneesExamen('${matiereId}')" class="btn-success" ${nbValides === 0 ? 'disabled' : ''}>Save the selected scores (${nbValides})</button>
        `;
    } catch (err) {
        console.error(err);
        apercu.innerHTML = "<p>Unable to read this file. Make sure it is an Excel (.xlsx) or CSV file, preferably generated from the template.</p>";
    }
}

async function importerNotesSelectionneesExamen(matiereId) {
    const apercu = document.getElementById('apercuNotesImport');
    const matiere = state.MATIERES.find(m => m.id === matiereId);
    const aEnregistrer = notesDetecteesImport.filter((n, i) => {
        const cb = document.getElementById(`noteImport_${i}`);
        return cb && cb.checked && n.erreurs.length === 0;
    });

    if (aEnregistrer.length === 0) {
        alert("No valid score selected for saving.");
        return;
    }

    apercu.innerHTML = `<p>Saving (0 / ${aEnregistrer.length})...</p>`;

    try {
        const TAILLE_LOT = 400;
        const paquets = [];
        for (let i = 0; i < aEnregistrer.length; i += TAILLE_LOT) paquets.push(aEnregistrer.slice(i, i + TAILLE_LOT));

        let faites = 0;
        for (const paquet of paquets) {
            const batch = db.batch();
            paquet.forEach(n => {
                batch.set(db.collection('notes').doc(idNote(matiereId, n.etudiant.id)), {
                    matiereId,
                    matiereNom: matiere ? matiere.nom : '',
                    matiereUe: matiere ? matiere.ue || '' : '',
                    matiereCredits: matiere ? matiere.credits || 0 : 0,
                    matiereSemestre: matiere ? matiere.semestre || null : null,
                    filiere: matiere ? matiere.filiere : null,
                    niveau: matiere ? matiere.niveau : null,
                    etudiantId: n.etudiant.id,
                    etudiant: n.etudiant.email,
                    matricule: n.etudiant.matricule || '',
                    note: n.note,
                    saisiPar: currentUser.email,
                    dateMaj: new Date().toISOString()
                }, { merge: true });
            });
            await batch.commit();
            faites += paquet.length;
            apercu.innerHTML = `<p>Saving (${faites} / ${aEnregistrer.length})...</p>`;
        }

        apercu.innerHTML = `<p class="success">${aEnregistrer.length} score(s) saved successfully.</p>`;
        notesDetecteesImport = [];
        const fichierInput = document.getElementById('fichierNotesExamen');
        if (fichierInput) fichierInput.value = '';
    } catch (err) {
        console.error(err);
        alert("Unable to save some scores.");
    }
}

// ================= FONCTIONS NOTES (étudiant) =================
// L'étudiant ne voit QUE ses propres notes (la requête Firestore elle-même
// est déjà restreinte à son email, voir demarrerEcouteTempsReel).
function afficherNotesEtudiant() {
    const el = document.getElementById('listeNotesEtudiant');
    if (!el) return;
    // Sécurité supplémentaire : si une note existait malgré tout pour une
    // matière déjà validée lors d'un cursus antérieur (ancien matricule),
    // elle reste masquée ici aussi (voir matiereDejaValideeAvantReinscription).
    const mesNotes = [...state.NOTES]
        .filter(n => !matiereDejaValideeAvantReinscription(currentUser, n.matiereNom))
        .sort((a, b) => (a.matiereNom || '').localeCompare(b.matiereNom || ''));

    // Regroupées par SEMESTRE puis par UE, avec le total de crédits ECTS
    // acquis/possibles par UE et par semestre (une matière ne rapporte ses
    // crédits que si sa note est ≥ 10/20). Comme pour le relevé imprimé par
    // le Service d'Examen, les notes se lisent semestre par semestre.
    const blocsSemestres = regrouperParSemestre(mesNotes.map(n => ({
        nom: n.matiereNom, ue: n.matiereUe, credits: n.matiereCredits, semestre: n.matiereSemestre, note: n.note
    })));
    const creditsTotalMax = blocsSemestres.reduce((s, b) => s + b.creditsMax, 0);
    const creditsTotalAcquis = blocsSemestres.reduce((s, b) => s + b.creditsAcquis, 0);

    el.innerHTML = (blocsSemestres.map(bloc => `
        <h4 style="margin-top:20px;">${bloc.semestre ? escapeHtml(getNomSemestre(bloc.semestre)) : 'Semester not set'}
            <small>(${bloc.creditsAcquis} / ${bloc.creditsMax} credit hours)</small></h4>
        ${bloc.groupesUe.map(g => `
        <div class="card">
            <h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(g.ue)}</h4>
            <p>${g.creditsAcquis} / ${g.creditsMax} credit hour(s) earned</p>
            ${g.lignes.map(l => {
                const mention = getMention(l.note);
                return `<p>${escapeHtml(l.nom)} (${l.credits || 0} credit hours) — Score: <b>${l.note}/${NOTE_MAX}</b> — <span class="mention-badge ${mention.classe}">${mention.texte}</span></p>`;
            }).join('')}
        </div>`).join('')}
    `).join('') || '<p>No score available yet.</p>')
        + (blocsSemestres.length > 0 ? `<div class="card"><p><b>Total credit hours earned (all semesters): ${creditsTotalAcquis} / ${creditsTotalMax}</b></p></div>` : '');

    // Le bouton de téléchargement n'a de sens que s'il y a au moins une
    // note à mettre dans le bulletin (sinon un fichier vide serait généré).
    const btn = document.getElementById('btnTelechargerMesNotes');
    if (btn) btn.style.display = mesNotes.length > 0 ? 'inline-block' : 'none';
}

// Génère et télécharge, côté navigateur de l'étudiant, un bulletin Excel
// (.xlsx) reprenant SES notes (et uniquement les siennes : state.NOTES est
// déjà filtré par la requête Firestore sur son propre email). Permet à
// l'étudiant de conserver/imprimer un relevé, en plus de la simple
// consultation à l'écran.
function exporterMesNotesExcel() {
    if (typeof XLSX === 'undefined') {
        alert("The Excel export library could not be loaded (check your internet connection) — please try again.");
        return;
    }
    if (!currentUser) return;

    const mesNotes = [...state.NOTES]
        .filter(n => !matiereDejaValideeAvantReinscription(currentUser, n.matiereNom))
        .sort((a, b) => (a.matiereNom || '').localeCompare(b.matiereNom || ''));
    if (mesNotes.length === 0) {
        alert("No score available yet.");
        return;
    }

    // Regroupées par SEMESTRE puis par UE, avec une ligne de sous-total de
    // crédits ECTS après chaque UE et après chaque semestre (comme sur le
    // relevé imprimé par le Service d'Examen : ce bulletin se lit semestre
    // par semestre).
    const blocsSemestres = regrouperParSemestre(mesNotes.map(n => ({
        nom: n.matiereNom, ue: n.matiereUe, credits: n.matiereCredits, semestre: n.matiereSemestre, note: n.note
    })));
    const creditsTotalMax = blocsSemestres.reduce((s, b) => s + b.creditsMax, 0);
    const creditsTotalAcquis = blocsSemestres.reduce((s, b) => s + b.creditsAcquis, 0);

    const entetesIdentite = [
        ['Last name', currentUser.nom || ''],
        ['First name', currentUser.prenom || ''],
        ['Index No.', currentUser.matricule || ''],
        ['Department', getNomFiliere(currentUser.filiere)],
        ['Level', getNomNiveau(currentUser.niveau)],
        []
    ];
    const entetesNotes = ['Semester', 'Module', 'Course', 'Credit hours', `Score / ${NOTE_MAX}`, 'Grade'];
    const lignesNotes = [];
    blocsSemestres.forEach(bloc => {
        const libelleSemestre = bloc.semestre ? getNomSemestre(bloc.semestre) : 'Not provided';
        bloc.groupesUe.forEach(g => {
            g.lignes.forEach(l => lignesNotes.push([libelleSemestre, g.ue, l.nom || '', l.credits || 0, l.note, getMention(l.note).texte]));
            lignesNotes.push(['', '', `Subtotal ${g.ue}`, `${g.creditsAcquis} / ${g.creditsMax}`, '', '']);
        });
        lignesNotes.push(['', '', `TOTAL ${libelleSemestre}`, `${bloc.creditsAcquis} / ${bloc.creditsMax}`, '', '']);
        lignesNotes.push([]);
    });
    lignesNotes.push(['', '', 'TOTAL CREDIT HOURS EARNED (all semesters)', `${creditsTotalAcquis} / ${creditsTotalMax}`, '', '']);

    const feuille = XLSX.utils.aoa_to_sheet([...entetesIdentite, entetesNotes, ...lignesNotes]);
    feuille['!cols'] = [{ wch: 12 }, { wch: 22 }, { wch: 32 }, { wch: 14 }, { wch: 12 }, { wch: 16 }];

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "My Transcript");

    const nomFichier = `Transcript_${currentUser.nom || currentUser.email}_${currentUser.prenom || ''}`.replace(/[\/\\?%*:|"<>\s]/g, '-');
    XLSX.writeFile(classeur, `${nomFichier}.xlsx`);
}

// ===================================
// EXPORT DE LA LISTE DES ÉTUDIANTS INSCRITS (admin)
// -----------------------------------
// Contrairement à exporterNotesExcel() (qui exige une classe précise pour
// produire un bulletin), ici la filière et le niveau sont facultatifs :
// laisser "Toutes/Tous" permet de sortir la liste complète des inscrits,
// ou de croiser un seul des deux critères (ex : tous les niveaux d'une
// filière, ou un niveau donné toutes filières confondues).
// Le fichier contient une feuille "Étudiants" (liste nominative complète)
// et une feuille "Récapitulatif" (effectif par filière + niveau), utile
// pour un usage de type reporting/data.
// ===================================
function exporterListeEtudiants() {
    if (typeof XLSX === 'undefined') {
        alert("The Excel export library could not be loaded (check your internet connection) — please try again.");
        return;
    }

    const filiereSelect = document.getElementById('exportEtudiantsFiliere');
    const niveauSelect = document.getElementById('exportEtudiantsNiveau');
    const filiere = filiereSelect ? filiereSelect.value : '';
    const niveau = niveauSelect ? niveauSelect.value : '';

    const etudiants = state.USERS
        .filter(u => u.role === 'student')
        .filter(u => !filiere || u.filiere === filiere)
        .filter(u => !niveau || Number(u.niveau) === Number(niveau))
        .sort((a, b) => {
            const fA = getNomFiliere(a.filiere), fB = getNomFiliere(b.filiere);
            if (fA !== fB) return fA.localeCompare(fB);
            if (Number(a.niveau) !== Number(b.niveau)) return Number(a.niveau) - Number(b.niveau);
            return (a.nom || a.email).localeCompare(b.nom || b.email);
        });

    if (etudiants.length === 0) {
        alert("No registered student matches these criteria.");
        return;
    }

    // ---- Feuille 1 : liste nominative complète ----
    const entetes = [
        "Index No.", "Last name", "First name", "Department", "Level",
        "Email (login)", "Personal email", "Phone",
        "Gender", "Date of birth", "Place of birth", "Nationality",
        "Registration application no."
    ];
    const lignes = etudiants.map(u => [
        u.matricule || '',
        u.nom || '(not provided)',
        u.prenom || '',
        getNomFiliere(u.filiere),
        getNomNiveau(u.niveau),
        u.email || '',
        u.emailPersonnel || '',
        u.telephone || '',
        u.genre || '',
        u.dateNaissance || '',
        u.lieuNaissance || '',
        u.nationalite || '',
        u.numeroDossier || ''
    ]);

    const feuilleEtudiants = XLSX.utils.aoa_to_sheet([entetes, ...lignes]);
    feuilleEtudiants['!cols'] = entetes.map((_, i) => ({ wch: i < 5 ? 18 : 22 }));

    // ---- Feuille 2 : récapitulatif (effectif par filière + niveau) ----
    const effectifs = {};
    etudiants.forEach(u => {
        const cle = `${getNomFiliere(u.filiere)}|${getNomNiveau(u.niveau)}`;
        effectifs[cle] = (effectifs[cle] || 0) + 1;
    });
    const lignesRecap = Object.keys(effectifs)
        .sort()
        .map(cle => {
            const [nomFiliere, nomNiveau] = cle.split('|');
            return [nomFiliere, nomNiveau, effectifs[cle]];
        });
    lignesRecap.push(['Total', '', etudiants.length]);
    const feuilleRecap = XLSX.utils.aoa_to_sheet([["Department", "Level", "Headcount"], ...lignesRecap]);
    feuilleRecap['!cols'] = [{ wch: 22 }, { wch: 18 }, { wch: 12 }];

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuilleEtudiants, "Students");
    XLSX.utils.book_append_sheet(classeur, feuilleRecap, "Summary");

    const partieFiliere = filiere ? getNomFiliere(filiere) : 'All-departments';
    const partieNiveau = niveau ? getNomNiveau(niveau) : 'All-levels';
    const nomFichier = `Student_List_${partieFiliere}_${partieNiveau}`.replace(/[\/\\?%*:|"<>\s]/g, '-');
    XLSX.writeFile(classeur, `${nomFichier}.xlsx`);
}

// ===================================
// PLATEFORME D'INSCRIPTION EN LIGNE
// -----------------------------------
// Un candidat (qui n'a pas encore de compte) dépose son dossier depuis la page
// publique registration.html : état civil (nom, prénom, date et lieu de
// naissance, genre, nationalité, n° de pièce d'identité si elle existe),
// contact et vœu de formation (filière + niveau).
// Le dossier arrive dans la collection Firestore "inscriptions" avec le statut
// "en_attente". L'administrateur le traite depuis son espace :
//   - Valider  -> crée automatiquement le compte étudiant (email de connexion,
//                 mot de passe temporaire et n° matricule générés) ;
//   - Refuser  -> enregistre un motif, consultable par le candidat.
// Le candidat suit son dossier avec son n° de dossier + sa date de naissance
// (double vérification : le n° seul ne suffit pas à voir l'état civil).
// ===================================

const STATUTS_INSCRIPTION = {
    en_attente: "Pending review",
    validee: "Approved — account created",
    refusee: "Rejected"
};

const GENRES = {
    M: "Male",
    F: "Female",
    autre: "Other / not specified"
};

const TYPES_PIECE = {
    cni: "Ghana Card / National ID",
    passeport: "Passport",
    carte_consulaire: "Consular card",
    extrait_naissance: "Birth certificate",
    autre: "Other document"
};

// Tirage aléatoire cryptographique (crypto.getRandomValues) : Math.random()
// est prévisible et ne doit pas servir à fabriquer des mots de passe ni des
// numéros de dossier qui protègent des données personnelles.
function chaineAleatoireSecurisee(caracteres, longueur) {
    const tirages = new Uint32Array(longueur);
    crypto.getRandomValues(tirages);
    let resultat = '';
    for (let i = 0; i < longueur; i++) {
        // (biais du modulo négligeable : alphabets de 32 et 56 caractères)
        resultat += caracteres[tirages[i] % caracteres.length];
    }
    return resultat;
}

// Numéro de dossier lisible et unique : UEW-REG-2026-4F7K2P9X
// (l'année facilite le classement, le suffixe aléatoire empêche de deviner
// le numéro d'un autre candidat et donc de consulter son état civil).
function genererNumeroDossier() {
    const suffixe = chaineAleatoireSecurisee('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);
    return `UEW-REG-${new Date().getFullYear()}-${suffixe}`;
}

// Normalise un nom/prénom pour fabriquer un identifiant email
// ("Kossi N'Douffou" -> "kossindouffou").
function normaliserPourEmail(texte) {
    return String(texte || '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
}

function formaterDateFr(isoDate) {
    if (!isoDate) return '';
    const parties = String(isoDate).split('-');
    if (parties.length !== 3) return isoDate;
    return `${parties[2]}/${parties[1]}/${parties[0]}`;
}

// ---- Période d'inscription (ouverture/fermeture décidée par l'admin) ----
// Stockée dans le document Firestore "_config/inscriptions" : { dateDebut,
// dateFin } (deux dates au format "AAAA-MM-JJ", bornes incluses). Une date
// vide = pas de borne de ce côté (ouverte indéfiniment dans cette direction).
// Ce document est lu directement (get), jamais via une requête, et reste
// donc accessible à un visiteur non connecté sans exposer aucun dossier.
const MESSAGE_INSCRIPTION_FERMEE = "Sorry, we are unable to process your request! Please contact the administration to have registration reopened.";

async function chargerPeriodeInscription() {
    try {
        const snap = await db.collection('_config').doc('inscriptions').get();
        return snap.exists ? snap.data() : { dateDebut: '', dateFin: '' };
    } catch (err) {
        console.error("Error reading the registration period:", err);
        return { dateDebut: '', dateFin: '' };
    }
}

// Compare des dates "AAAA-MM-JJ" à la journée près (peu importe l'heure de
// la journée en cours) : le jour de la date de fin reste inclus.
function inscriptionEstOuverte(periode, maintenant) {
    const aujourdhui = (maintenant || new Date()).toISOString().slice(0, 10);
    if (periode.dateDebut && aujourdhui < periode.dateDebut) return false;
    if (periode.dateFin && aujourdhui > periode.dateFin) return false;
    return true;
}

function afficherEtatPeriodeInscription(periode) {
    const zone = document.getElementById('periodeInscriptionInfo');
    const form = document.getElementById('formInscription');
    if (!zone) return;

    const ouverte = inscriptionEstOuverte(periode);
    let bornes = '';
    if (periode.dateDebut && periode.dateFin) {
        bornes = `Open from ${formaterDateFr(periode.dateDebut)} au ${formaterDateFr(periode.dateFin)}.`;
    } else if (periode.dateDebut) {
        bornes = `Open from ${formaterDateFr(periode.dateDebut)}.`;
    } else if (periode.dateFin) {
        bornes = `Open until ${formaterDateFr(periode.dateFin)}.`;
    }

    if (ouverte) {
        zone.innerHTML = bornes ? `<p class="success">Registrations are open. ${escapeHtml(bornes)}</p>` : '';
        if (form) form.style.display = '';
    } else {
        zone.innerHTML = `<div class="card"><p class="warning">${escapeHtml(MESSAGE_INSCRIPTION_FERMEE)}</p>${bornes ? `<p><small>${escapeHtml(bornes)}</small></p>` : ''}</div>`;
        if (form) form.style.display = 'none';
    }
}

// ---- Page publique : dépôt du dossier + suivi ----

async function initialiserPageInscription() {
    remplirSelectFilieres('insFiliere');
    remplirSelectNiveaux('insNiveau');

    const periode = await chargerPeriodeInscription();
    afficherEtatPeriodeInscription(periode);

    const form = document.getElementById('formInscription');
    if (form) form.addEventListener('submit', (e) => soumettreInscription(e, periode));

    const formSuivi = document.getElementById('formSuiviInscription');
    if (formSuivi) formSuivi.addEventListener('submit', suivreInscription);
}

async function soumettreInscription(e, periode) {
    e.preventDefault();
    const form = e.target;
    const bouton = form.querySelector('button[type="submit"]');
    const zoneErreur = document.getElementById('inscriptionErreur');
    const val = (id) => (document.getElementById(id).value || '').trim();

    zoneErreur.innerText = '';

    // Double vérification de la période (le formulaire est déjà masqué si elle
    // est fermée, mais une page restée ouverte dans un onglet ne doit pas
    // pouvoir contourner la fermeture décidée entre-temps par l'admin).
    const periodeActuelle = await chargerPeriodeInscription();
    if (!inscriptionEstOuverte(periodeActuelle)) {
        afficherEtatPeriodeInscription(periodeActuelle);
        zoneErreur.innerText = MESSAGE_INSCRIPTION_FERMEE;
        return;
    }

    const dossier = {
        nom: val('insNom').toUpperCase(),
        prenom: val('insPrenom'),
        dateNaissance: val('insDateNaissance'),
        lieuNaissance: val('insLieuNaissance'),
        genre: val('insGenre'),
        nationalite: val('insNationalite'),
        typePiece: val('insTypePiece'),
        numeroPiece: val('insNumeroPiece'),
        email: val('insEmail').toLowerCase(),
        telephone: val('insTelephone'),
        filiere: val('insFiliere'),
        niveau: val('insNiveau') ? parseInt(val('insNiveau'), 10) : null,
        // Un ancien étudiant de l'UEW (reprise d'études, redoublement partiel,
        // changement de filière...) doit obligatoirement fournir son ANCIEN n°
        // matricule : c'est ce qui permettra, une fois son nouveau compte créé,
        // de ne plus lui présenter les matières qu'il a déjà validées.
        ancienEtudiant: (() => {
            const coche = document.querySelector('input[name="insTypeCandidat"]:checked');
            return !!coche && coche.value === 'ancien';
        })(),
        ancienMatricule: ''
    };
    if (dossier.ancienEtudiant) {
        dossier.ancienMatricule = val('insAncienMatricule').toUpperCase();
    }

    // Champs obligatoires (le n° de pièce d'identité reste facultatif :
    // beaucoup de candidats n'en possèdent pas encore au dépôt du dossier).
    const manquants = [];
    if (!dossier.nom) manquants.push('last name');
    if (!dossier.prenom) manquants.push('first name');
    if (!dossier.dateNaissance) manquants.push('date of birth');
    if (!dossier.lieuNaissance) manquants.push('place of birth');
    if (!dossier.genre) manquants.push('gender');
    if (!dossier.nationalite) manquants.push('nationality');
    if (!dossier.email) manquants.push('email');
    if (!dossier.telephone) manquants.push('phone number');
    if (!dossier.filiere) manquants.push('preferred department');
    if (!dossier.niveau) manquants.push('preferred level');
    if (dossier.ancienEtudiant && !dossier.ancienMatricule) manquants.push('your previous UEW index number');
    if (manquants.length) {
        zoneErreur.innerText = `Please fill in: ${manquants.join(', ')}.`;
        return;
    }

    // Contrôle de cohérence de la date de naissance (pas dans le futur,
    // et candidat d'au moins 14 ans : évite les fautes de frappe d'année).
    const naissance = new Date(dossier.dateNaissance);
    const aujourdhui = new Date();
    if (isNaN(naissance.getTime()) || naissance >= aujourdhui) {
        zoneErreur.innerText = "The date of birth entered is not valid.";
        return;
    }
    const age = (aujourdhui - naissance) / (365.25 * 24 * 3600 * 1000);
    if (age < 14 || age > 90) {
        zoneErreur.innerText = "Check the date of birth: the resulting age is unusual.";
        return;
    }

    // Si une pièce d'identité est déclarée, son type et son numéro vont de pair.
    if (dossier.numeroPiece && !dossier.typePiece) {
        zoneErreur.innerText = "Please specify the type of the ID document entered.";
        return;
    }
    if (!dossier.numeroPiece) {
        dossier.typePiece = '';
    }

    if (bouton) bouton.disabled = true;
    try {
        // Le n° de dossier sert d'identifiant du document Firestore. Conséquence
        // importante pour la confidentialité : le suivi en ligne se fait par
        // lecture DIRECTE d'un document précis (get), jamais par une requête
        // qui parcourrait la collection. Une page publique n'a donc aucune
        // raison de lire l'état civil des autres candidats.
        let numeroDossier;
        let tentatives = 0;
        do {
            numeroDossier = genererNumeroDossier();
            tentatives += 1;
            const existant = await db.collection('inscriptions').doc(numeroDossier).get();
            if (!existant.exists) break;
        } while (tentatives < 5);

        dossier.numeroDossier = numeroDossier;
        dossier.statut = 'en_attente';
        dossier.dateDemande = new Date().toISOString();

        await db.collection('inscriptions').doc(numeroDossier).set(dossier);

        form.reset();
        document.getElementById('inscriptionConfirmation').innerHTML = `
            <div class="card">
                <p class="success">Your registration application has been received.</p>
                <p>Your application number:</p>
                <p class="numero-dossier">${escapeHtml(dossier.numeroDossier)}</p>
                <p><b>Keep this number.</b> Together with your date of birth, it lets you
                follow the progress of your application below and, once it is approved,
                retrieve your UEW E-Campus login details.</p>
            </div>`;
        document.getElementById('inscriptionConfirmation').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error("Error while submitting the application:", err);
        zoneErreur.innerText = "Unable to send. Check your internet connection and try again.";
    } finally {
        if (bouton) bouton.disabled = false;
    }
}

async function suivreInscription(e) {
    e.preventDefault();
    const numero = (document.getElementById('suiviNumero').value || '').trim().toUpperCase();
    const dateNaissance = (document.getElementById('suiviDateNaissance').value || '').trim();
    const resultat = document.getElementById('suiviResultat');

    if (!numero || !dateNaissance) {
        resultat.innerHTML = '<p class="warning">Enter your application number and your date of birth.</p>';
        return;
    }

    resultat.innerHTML = '<p>Searching...</p>';
    try {
        const snap = await db.collection('inscriptions').doc(numero).get();
        // Le numéro seul ne suffit pas : la date de naissance doit correspondre.
        if (!snap.exists || snap.data().dateNaissance !== dateNaissance) {
            resultat.innerHTML = '<p class="warning">No application matches this number and date of birth.</p>';
            return;
        }

        const d = snap.data();
        let details = '';
        if (d.statut === 'validee') {
            details = `
                <p class="success">Congratulations, your registration has been approved.</p>
                <p>Your UEW E-Campus login details:</p>
                <ul>
                    <li><b>Email:</b> ${escapeHtml(d.emailConnexion || '')}</li>
                    <li><b>Temporary password:</b> ${escapeHtml(d.motDePasseProvisoire || '(provided by the administration)')}</li>
                    <li><b>Index No.:</b> ${escapeHtml(d.matricule || '')}</li>
                    <li><b>Class:</b> ${escapeHtml(getNomFiliere(d.filiere))} — ${escapeHtml(getNomNiveau(d.niveau))}</li>
                </ul>
                <p><a href="index.html">Log in to UEW E-Campus</a></p>`;
        } else if (d.statut === 'refusee') {
            details = `<p class="warning">Your application was not successful.</p>
                ${d.motifRefus ? `<p><b>Reason:</b> ${escapeHtml(d.motifRefus)}</p>` : ''}
                <p>You may contact the UEW administration for more information.</p>`;
        } else {
            details = `<p class="live">Your application is being reviewed by the administration.</p>
                <p>Please check this page regularly: your login details
                will appear here as soon as your application is approved.</p>`;
        }

        resultat.innerHTML = `
            <div class="card">
                <p><b>Application ${escapeHtml(d.numeroDossier)}</b> — submitted on ${escapeHtml(new Date(d.dateDemande).toLocaleDateString('en-GB'))}</p>
                <p>${escapeHtml(d.prenom)} ${escapeHtml(d.nom)} — preference: ${escapeHtml(getNomFiliere(d.filiere))} (${escapeHtml(getNomNiveau(d.niveau))})</p>
                <p><b>Status:</b> ${escapeHtml(STATUTS_INSCRIPTION[d.statut] || d.statut)}</p>
                ${details}
            </div>`;
    } catch (err) {
        console.error("Error while tracking the application:", err);
        resultat.innerHTML = '<p class="warning">Search failed. Check your internet connection and try again.</p>';
    }
}

// ---- Espace administrateur : traitement des dossiers ----

// Filtre courant de la liste des dossiers ('' = tous).
let filtreStatutInscription = 'en_attente';

function changerFiltreInscriptions(valeur) {
    filtreStatutInscription = valeur;
    afficherInscriptionsAdmin();
}

// Décompose une date "AAAA-MM-JJ" en {annee, mois, jour} (entiers), utilisé
// pour écrire les règles Firestore de la période sous une forme que les
// règles savent comparer (timestamp.date(annee, mois, jour)).
function decomposerDate(isoDate) {
    if (!isoDate) return null;
    const [annee, mois, jour] = isoDate.split('-').map(n => parseInt(n, 10));
    if (!annee || !mois || !jour) return null;
    return { annee, mois, jour };
}

// Charge la période actuelle dans le formulaire admin, à l'ouverture de
// l'onglet "Inscriptions en ligne".
async function chargerPeriodeInscriptionAdmin() {
    const champDebut = document.getElementById('periodeAdminDebut');
    const champFin = document.getElementById('periodeAdminFin');
    if (!champDebut || !champFin) return;
    const periode = await chargerPeriodeInscription();
    champDebut.value = periode.dateDebut || '';
    champFin.value = periode.dateFin || '';
    afficherStatutPeriodeAdmin(periode);
}

function afficherStatutPeriodeAdmin(periode) {
    const zone = document.getElementById('periodeAdminStatut');
    if (!zone) return;
    const ouverte = inscriptionEstOuverte(periode);
    zone.innerHTML = ouverte
        ? '<p class="success">Registrations are currently <b>open</b> for applicants.</p>'
        : `<p class="warning">Registrations are currently <b>closed</b>: applicants see the message "${escapeHtml(MESSAGE_INSCRIPTION_FERMEE)}".</p>`;
}

// Enregistre la période choisie par l'admin. Les dates sont facultatives
// indépendamment l'une de l'autre (ex : fixer seulement une date de fin pour
// une inscription déjà ouverte). Les composantes {annee, mois, jour} sont
// stockées à côté des chaînes affichables : c'est sur elles que les règles
// Firestore s'appuient pour refuser un dépôt hors période côté serveur.
async function enregistrerPeriodeInscription() {
    const dateDebut = document.getElementById('periodeAdminDebut').value || '';
    const dateFin = document.getElementById('periodeAdminFin').value || '';

    if (dateDebut && dateFin && dateDebut > dateFin) {
        alert("The start date must be on or before the end date.");
        return;
    }

    const debutDecompose = decomposerDate(dateDebut);
    const finDecompose = decomposerDate(dateFin);

    const config = {
        dateDebut,
        dateFin,
        debutAnnee: debutDecompose ? debutDecompose.annee : null,
        debutMois: debutDecompose ? debutDecompose.mois : null,
        debutJour: debutDecompose ? debutDecompose.jour : null,
        finAnnee: finDecompose ? finDecompose.annee : null,
        finMois: finDecompose ? finDecompose.mois : null,
        finJour: finDecompose ? finDecompose.jour : null
    };

    try {
        await db.collection('_config').doc('inscriptions').set(config);
        afficherStatutPeriodeAdmin(config);
        alert("Registration period saved.");
    } catch (err) {
        console.error("Error while saving the period:", err);
        alert("Saving failed.");
    }
}

function badgeStatut(statut) {
    return `<span class="badge badge-${escapeHtml(statut)}">${escapeHtml(STATUTS_INSCRIPTION[statut] || statut)}</span>`;
}

function afficherInscriptionsAdmin() {
    const el = document.getElementById('listeInscriptions');
    if (!el) return;

    const dossiers = state.INSCRIPTIONS.filter(i => !filtreStatutInscription || i.statut === filtreStatutInscription);

    const compteur = document.getElementById('compteurInscriptions');
    if (compteur) {
        const enAttente = state.INSCRIPTIONS.filter(i => i.statut === 'en_attente').length;
        compteur.innerHTML = `<b>${state.INSCRIPTIONS.length}</b> application(s) in total — <b>${enAttente}</b> pending review.`;
    }

    if (dossiers.length === 0) {
        el.innerHTML = '<p>No application for this filter.</p>';
        return;
    }

    // Détection des doublons : un candidat peut déposer deux fois le même
    // dossier (formulaire renvoyé, numéro de dossier égaré...). On signale les
    // dossiers partageant nom + prénom + date de naissance pour éviter de créer
    // deux comptes étudiants pour la même personne.
    const signature = (i) => `${normaliserPourEmail(i.nom)}|${normaliserPourEmail(i.prenom)}|${i.dateNaissance}`;
    const occurrences = {};
    state.INSCRIPTIONS.filter(i => i.statut !== 'refusee').forEach(i => {
        occurrences[signature(i)] = (occurrences[signature(i)] || 0) + 1;
    });

    el.innerHTML = dossiers.map(i => `
        <div class="card">
            ${occurrences[signature(i)] > 1 && i.statut !== 'refusee'
                ? '<p class="warning">Possible duplicate: another application has the same name and date of birth.</p>'
                : ''}
            <p><b>${escapeHtml(i.prenom)} ${escapeHtml(i.nom)}</b> — ${badgeStatut(i.statut)}<br>
            <small>Application ${escapeHtml(i.numeroDossier)} — submitted on ${escapeHtml(new Date(i.dateDemande).toLocaleString('en-GB'))}</small></p>
            <ul class="fiche-etat-civil">
                <li><b>Born on:</b> ${escapeHtml(formaterDateFr(i.dateNaissance))} in ${escapeHtml(i.lieuNaissance)}</li>
                <li><b>Gender:</b> ${escapeHtml(GENRES[i.genre] || i.genre)}</li>
                <li><b>Nationality:</b> ${escapeHtml(i.nationalite)}</li>
                <li><b>ID document:</b> ${i.numeroPiece ? escapeHtml((TYPES_PIECE[i.typePiece] || i.typePiece || 'ID document')) + ' n° ' + escapeHtml(i.numeroPiece) : '<i>not provided</i>'}</li>
                <li><b>Contact:</b> ${escapeHtml(i.email)} — ${escapeHtml(i.telephone)}</li>
                <li><b>Vœu :</b> ${escapeHtml(getNomFiliere(i.filiere))} — ${escapeHtml(getNomNiveau(i.niveau))}</li>
                <li><b>Applicant status:</b> ${i.ancienEtudiant ? `Returning student — Previous index number: <b>${escapeHtml(i.ancienMatricule || '—')}</b>` : 'New applicant'}</li>
                ${i.matricule ? `<li><b>Account created:</b> ${escapeHtml(i.emailConnexion)} — index no. ${escapeHtml(i.matricule)}</li>` : ''}
                ${i.motifRefus ? `<li><b>Reason for rejection:</b> ${escapeHtml(i.motifRefus)}</li>` : ''}
            </ul>
            ${i.statut === 'en_attente' ? `
                <div class="affectation-inscription">
                    <p><b>Final placement</b> (editable before approval):</p>
                    <select id="affFiliere-${i.id}"></select>
                    <select id="affNiveau-${i.id}"></select>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button type="button" class="btn-success" onclick="validerInscription('${i.id}')">Approve and create account</button>
                    <button type="button" class="btn-danger" onclick="refuserInscription('${i.id}')">Reject</button>
                </div>` : `
                <div style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button type="button" class="btn-secondary" onclick="supprimerInscription('${i.id}')">Delete application</button>
                </div>`}
        </div>`).join('');

    // Les listes déroulantes d'affectation sont remplies après l'insertion du
    // HTML, puis présélectionnées sur le vœu exprimé par le candidat.
    dossiers.filter(i => i.statut === 'en_attente').forEach(i => {
        remplirSelectFilieres(`affFiliere-${i.id}`);
        remplirSelectNiveaux(`affNiveau-${i.id}`);
        const selF = document.getElementById(`affFiliere-${i.id}`);
        const selN = document.getElementById(`affNiveau-${i.id}`);
        if (selF && i.filiere) selF.value = i.filiere;
        if (selN && i.niveau) selN.value = String(i.niveau);
    });
}

// Génère le prochain n° matricule libre de l'année : UEW-2026-0042.
// On balaie à la fois les comptes existants et les dossiers déjà validés
// (le compte vient d'être créé, la liste "users" peut ne pas encore être
// rafraîchie par Firestore au moment du clic suivant).
function genererMatriculeAuto() {
    const prefixe = `UEW-${new Date().getFullYear()}-`;
    const existants = [
        ...state.USERS.map(u => u.matricule),
        ...state.INSCRIPTIONS.map(i => i.matricule)
    ].filter(Boolean);

    let maxNumero = 0;
    existants.forEach(m => {
        if (String(m).startsWith(prefixe)) {
            const n = parseInt(String(m).slice(prefixe.length), 10);
            if (!isNaN(n) && n > maxNumero) maxNumero = n;
        }
    });

    let candidat;
    do {
        maxNumero += 1;
        candidat = prefixe + String(maxNumero).padStart(4, '0');
    } while (existants.some(m => String(m).toLowerCase() === candidat.toLowerCase()));
    return candidat;
}

// Email institutionnel de connexion : prenom.nom@uew-ecampus.edu.gh,
// suffixé (2, 3...) en cas d'homonymie.
function genererEmailEtudiant(prenom, nom) {
    const base = `${normaliserPourEmail(prenom)}.${normaliserPourEmail(nom)}`;
    const domaine = '@uew-ecampus.edu.gh';
    const prisEnCompte = [
        ...state.USERS.map(u => (u.email || '').toLowerCase()),
        ...state.INSCRIPTIONS.map(i => (i.emailConnexion || '').toLowerCase())
    ].filter(Boolean);

    let candidat = base + domaine;
    let suffixe = 1;
    while (prisEnCompte.includes(candidat.toLowerCase())) {
        suffixe += 1;
        candidat = `${base}${suffixe}${domaine}`;
    }
    return candidat;
}

async function validerInscription(id) {
    const dossier = state.INSCRIPTIONS.find(i => i.id === id);
    if (!dossier || dossier.statut !== 'en_attente') return;

    const selF = document.getElementById(`affFiliere-${id}`);
    const selN = document.getElementById(`affNiveau-${id}`);
    const filiere = selF ? selF.value : dossier.filiere;
    const niveau = selN && selN.value ? parseInt(selN.value, 10) : dossier.niveau;

    if (!filiere || !niveau) {
        alert("Choose the department and level of placement before approving.");
        return;
    }

    const emailConnexion = genererEmailEtudiant(dossier.prenom, dossier.nom);
    const matricule = genererMatriculeAuto();
    const motDePasse = genererMotDePasseAleatoire(10);

    const recapitulatif = `Approve the registration of ${dossier.prenom} ${dossier.nom} ?\n\n` +
        `Class: ${getNomFiliere(filiere)} — ${getNomNiveau(niveau)}\n` +
        `Login email: ${emailConnexion}\n` +
        `Temporary password: ${motDePasse}\n` +
        `Index No.: ${matricule}\n\n` +
        `The student account will be created immediately.`;
    if (!confirm(recapitulatif)) return;

    try {
        // 1. Création du compte étudiant (mêmes champs qu'une création manuelle,
        //    plus l'état civil issu du dossier d'inscription).
        const nouveauCompte = {
            email: emailConnexion,
            password: motDePasse,
            role: 'student',
            filiere,
            niveau,
            nom: dossier.nom,
            prenom: dossier.prenom,
            matricule,
            dateNaissance: dossier.dateNaissance,
            lieuNaissance: dossier.lieuNaissance,
            genre: dossier.genre,
            nationalite: dossier.nationalite,
            typePiece: dossier.typePiece || '',
            numeroPiece: dossier.numeroPiece || '',
            emailPersonnel: dossier.email,
            telephone: dossier.telephone,
            numeroDossier: dossier.numeroDossier
        };
        // Ancien étudiant : on reporte son ANCIEN matricule sur le nouveau
        // compte. C'est cette valeur qui permet ensuite de retrouver ses
        // notes passées (state.NOTES conserve le matricule de l'époque) et
        // de lui masquer les matières déjà validées (voir
        // matiereDejaValideeAvantReinscription, utilisée par le Service
        // d'Examen et sur son propre espace).
        if (dossier.ancienEtudiant && dossier.ancienMatricule) {
            nouveauCompte.ancienEtudiant = true;
            nouveauCompte.ancienMatricule = dossier.ancienMatricule;
        }
        await db.collection('users').add(nouveauCompte);

        // 2. Mise à jour du dossier : le candidat verra ses identifiants dans
        //    le suivi en ligne, sans avoir à se déplacer.
        await db.collection('inscriptions').doc(id).update({
            statut: 'validee',
            filiere,
            niveau,
            matricule,
            emailConnexion,
            motDePasseProvisoire: motDePasse,
            dateTraitement: new Date().toISOString(),
            traitePar: currentUser.email
        });

        alert(`Account created.\n\nEmail: ${emailConnexion}\nPassword: ${motDePasse}\nIndex No.: ${matricule}\n\nThese credentials are now visible to the applicant when tracking their application.`);
    } catch (err) {
        console.error("Error while approving the application:", err);
        alert("Approval failed. The account may not have been created: check the user list before trying again.");
    }
}

async function refuserInscription(id) {
    const dossier = state.INSCRIPTIONS.find(i => i.id === id);
    if (!dossier || dossier.statut !== 'en_attente') return;

    const motif = prompt(`Reason for rejecting the application of ${dossier.prenom} ${dossier.nom} (visible to the applicant):`, '');
    if (motif === null) return;
    if (!motif.trim()) {
        alert("Please give a reason: it will be shown to the applicant.");
        return;
    }

    try {
        await db.collection('inscriptions').doc(id).update({
            statut: 'refusee',
            motifRefus: motif.trim(),
            dateTraitement: new Date().toISOString(),
            traitePar: currentUser.email
        });
    } catch (err) {
        console.error("Error while rejecting the application:", err);
        alert("Saving the rejection failed.");
    }
}

async function supprimerInscription(id) {
    if (!confirm("Permanently delete this registration application? The applicant will no longer be able to track it online.")) return;
    try {
        await db.collection('inscriptions').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Unable to delete.");
    }
}

// Export Excel de tous les dossiers correspondant au filtre affiché :
// une ligne par candidat, avec l'état civil complet (utile pour le service
// scolarité et pour l'archivage réglementaire des inscriptions).
function exporterInscriptionsExcel() {
    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not be loaded (check your internet connection) — please try again.");
        return;
    }

    const dossiers = state.INSCRIPTIONS.filter(i => !filtreStatutInscription || i.statut === filtreStatutInscription);
    if (dossiers.length === 0) {
        alert("No application to export for this filter.");
        return;
    }

    const entetes = [
        'Application no.', 'Status', 'Application date', 'Last name', 'First name',
        'Date of birth', 'Place of birth', 'Gender', 'Nationality',
        'ID type', 'ID number', 'Contact email', 'Phone',
        'Department', 'Level', 'Returning student', 'Previous index number',
        'Assigned index number', 'Login email', 'Reason for rejection'
    ];
    const lignes = dossiers.map(i => [
        i.numeroDossier || '', STATUTS_INSCRIPTION[i.statut] || i.statut || '',
        i.dateDemande ? new Date(i.dateDemande).toLocaleString('en-GB') : '',
        i.nom || '', i.prenom || '', formaterDateFr(i.dateNaissance), i.lieuNaissance || '',
        GENRES[i.genre] || i.genre || '', i.nationalite || '',
        TYPES_PIECE[i.typePiece] || i.typePiece || '', i.numeroPiece || '',
        i.email || '', i.telephone || '',
        getNomFiliere(i.filiere), i.niveau ? getNomNiveau(i.niveau) : '',
        i.ancienEtudiant ? 'Yes' : 'No', i.ancienMatricule || '',
        i.matricule || '', i.emailConnexion || '', i.motifRefus || ''
    ]);

    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...lignes]);
    feuille['!cols'] = entetes.map(() => ({ wch: 22 }));
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Registrations");
    XLSX.writeFile(classeur, `Registrations_UEW_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.btn-logout').forEach(btn => btn.addEventListener('click', logout));

    // Attend que l'authentification anonyme Firebase soit prête avant de
    // toucher Firestore (les règles exigent request.auth != null).
    try {
        await authReadyPromise;
    } catch (err) {
        console.error(err);
        // Sans réseau, on continue quand même : l'application s'ouvre avec les
        // données déjà présentes sur l'appareil (cache Firestore).
        if (navigator.onLine) {
            alert("Unable to connect to the server. Check your internet connection and reload the page.");
            return;
        }
    }

    // ---------------- PORTAIL PUBLIC D'INSCRIPTION ----------------
    // Aucune session, aucune écoute temps réel : le candidat n'écrit que dans
    // la collection "inscriptions" et ne lit que son propre dossier.
    if (estPagePublique()) {
        initialiserPageInscription();
        return;
    }

    // ---------------- LOGIN ----------------
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        // Première mise en ligne : index.html?setup=1 crée le compte admin
        if (MODE_SETUP && !MODE_DEMO && navigator.onLine) {
            initialiserPlateformeAdmin().catch((err) => {
                console.error('Setup error:', err);
                alert('Initialisation failed. Check the Firestore rules and the Anonymous sign-in setting.');
            });
        }
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const errorEl = document.getElementById('error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');

            const emailValue = emailInput.value.trim().toLowerCase();
            const passwordValue = passwordInput.value;

            errorEl.innerText = '';
            if (submitBtn) submitBtn.disabled = true;

            try {
                const horsLigne = !navigator.onLine;
                if (!horsLigne) await seedDonneesInitialesSiNecessaire();

                // Hors-ligne : on lit uniquement le cache de l'appareil (comptes déjà consultés)
                const snap = await db.collection('users').where('email', '==', emailValue).limit(1).get(horsLigne ? { source: 'cache' } : {});

                if (snap.empty && horsLigne) {
                    errorEl.innerText = "Offline: this device does not know this account yet. Log in once while connected to the internet.";
                    return;
                }

                if (snap.empty || snap.docs[0].data().password !== passwordValue) {
                    errorEl.innerText = 'Incorrect email or password';
                    return;
                }

                const userDoc = snap.docs[0];
                const { password, ...safeUser } = userDoc.data();
                safeUser.id = userDoc.id;
                localStorage.setItem('currentUser', JSON.stringify(safeUser));
                window.location.href = safeUser.role + '.html';
            } catch (err) {
                console.error('Login error:', err);
                errorEl.innerText = "Unable to log in. Check your internet connection and try again.";
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
        return; // pas besoin d'écoute temps réel sur la page de login
    }

    // À partir d'ici, l'utilisateur est connecté : on démarre l'écoute temps réel
    demarrerEcouteTempsReel();

    // ---------------- MESSAGERIE INSTANTANEE ----------------
    const formChat = document.getElementById('formChat');
    if (formChat) {
        initialiserChatFlottant();
        demanderPermissionNotification();
        afficherContactsChat();
        afficherMessagesChat();
        formChat.addEventListener('submit', async (e) => {
            e.preventDefault();
            const chatInput = document.getElementById('chatInput');
            const texte = chatInput.value.trim();
            if (!texte) return;
            chatInput.value = '';
            chatInput.focus();
            await envoyerMessageChat(texte);
        });
    }

    // ---------------- NAVIGATION PAR ONGLETS (Accueil / Tableau de bord / Mes cours) ----------------
    const topnav = document.querySelector('.topnav');
    if (topnav) {
        topnav.querySelectorAll('.topnav-tab').forEach(tab => {
            tab.addEventListener('click', () => activerOnglet(tab.dataset.tab));
        });

        // Rouvre l'onglet consulté en dernier par cet utilisateur sur cet espace
        // (sinon "Accueil" reste actif par défaut, comme défini dans le HTML).
        let ongletMemorise = null;
        try { ongletMemorise = localStorage.getItem('ongletActif_' + currentUser.role); } catch (err) { /* stockage indisponible, tant pis */ }
        if (ongletMemorise && document.querySelector(`.topnav-tab[data-tab="${ongletMemorise}"]`)) {
            activerOnglet(ongletMemorise);
        }
    }

    // ---------------- ADMIN ----------------
    if (document.getElementById('listeUsers')) {
        chargerPeriodeInscriptionAdmin();

        const formAddUser = document.getElementById('formAddUser');
        formAddUser.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newEmail = document.getElementById('newEmail');
            const newPassword = document.getElementById('newPassword');
            const newRole = document.getElementById('newRole');
            const newFiliere = document.getElementById('newFiliere');
            const newNiveau = document.getElementById('newNiveau');
            const newNom = document.getElementById('newNom');
            const newPrenom = document.getElementById('newPrenom');
            const newMatricule = document.getElementById('newMatricule');

            const email = newEmail.value.trim().toLowerCase();
            if (!email || !newPassword.value || !newRole.value) {
                alert("Please fill in all fields.");
                return;
            }

            if (state.USERS.some(u => u.email.toLowerCase() === email)) {
                alert("A user with this email already exists.");
                return;
            }

            if (newRole.value !== 'admin' && newRole.value !== 'exams' && newRole.value !== 'daas' && !newFiliere.value) {
                alert("Please choose a department for this lecturer/student (otherwise they will never see any lecture).");
                return;
            }

            if (newRole.value === 'student' && !newNiveau.value) {
                alert("Please choose this student's level (otherwise they will never see their class list).");
                return;
            }

            if (newRole.value === 'student' && (!newNom.value.trim() || !newPrenom.value.trim())) {
                alert("Please enter this student's last and first name (needed for the scores export).");
                return;
            }

            if (newRole.value === 'student' && !newMatricule.value.trim()) {
                alert("Please enter this student's index number.");
                return;
            }

            if (newRole.value === 'student' && newMatricule.value.trim() &&
                state.USERS.some(u => u.role === 'student' && (u.matricule || '').toLowerCase() === newMatricule.value.trim().toLowerCase())) {
                alert("This index number is already assigned to another student.");
                return;
            }

            const newUser = { email, password: newPassword.value, role: newRole.value };
            if (newRole.value !== 'admin' && newRole.value !== 'exams' && newRole.value !== 'daas' && newFiliere.value) {
                newUser.filiere = newFiliere.value;
            }
            if (newRole.value === 'student' && newNiveau.value) {
                newUser.niveau = parseInt(newNiveau.value, 10);
            }
            if (newRole.value === 'student') {
                newUser.nom = newNom.value.trim();
                newUser.prenom = newPrenom.value.trim();
                newUser.matricule = newMatricule.value.trim();
            }

            try {
                await db.collection('users').add(newUser);
                e.target.reset();
            } catch (err) {
                console.error(err);
                alert("Unable to create the user.");
            }
        });

        const formAddCours = document.getElementById('formAddCours');
        formAddCours.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newTitre = document.getElementById('newTitre');
            const newDate = document.getElementById('newDate');
            const newFiliere = document.getElementById('newFiliereCours');
            const newSalle = document.getElementById('newSalle');
            const newMatiere = document.getElementById('coursMatiereAdmin');

            if (!newTitre.value || !newDate.value || !newFiliere.value) {
                alert("The title, date and department of the lecture are required.");
                return;
            }

            const filiereId = newFiliere.value;
            const numeroSalle = parseInt(newSalle.value, 10);

            const coursData = {
                titre: newTitre.value,
                date: newDate.value,
                filiere: filiereId,
                salle: numeroSalle,
                lien: lienSalle(filiereId, numeroSalle),
                en_live: false
            };

            // Rattache le cours à la matière choisie (si l'admin en a
            // sélectionné une) : c'est ce qui détermine ensuite QUEL
            // professeur (celui attribué à la matière) pourra lancer le
            // Live de ce cours précis — voir coursGereParProf().
            if (newMatiere && newMatiere.value) {
                const matiere = state.MATIERES.find(m => m.id === newMatiere.value);
                if (matiere) {
                    coursData.matiereId = matiere.id;
                    coursData.matiereNom = matiere.nom;
                }
            }

            // Cours de tronc commun : il faut préciser quelles filières sont
            // concernées (en plus du niveau), pour que seuls leurs étudiants
            // reçoivent le cours.
            if (estFiliereTroncCommun(filiereId)) {
                const filieresConcernees = getFilieresConcerneesCochees('filieresConcerneesCours');
                if (filieresConcernees.length === 0) {
                    alert("For a Common Courses lecture, please tick at least one department concerned.");
                    return;
                }
                coursData.filieresConcernees = filieresConcernees;
            }

            try {
                await ecrireEnFile(db.collection('cours').add(coursData));
                e.target.reset();
                document.getElementById('filieresConcerneesWrapper').style.display = 'none';
            } catch (err) {
                console.error(err);
                alert("Unable to schedule the lecture.");
            }
        });

        const formAddMatiere = document.getElementById('formAddMatiere');
        if (formAddMatiere) {
            formAddMatiere.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newNomMatiere = document.getElementById('newNomMatiere');
                const newFiliereMatiere = document.getElementById('newFiliereMatiere');
                const newNiveauMatiere = document.getElementById('newNiveauMatiere');
                const newUeMatiere = document.getElementById('newUeMatiere');
                const newCreditsMatiere = document.getElementById('newCreditsMatiere');
                const newSemestreMatiere = document.getElementById('newSemestreMatiere');

                if (!newNomMatiere.value.trim() || !newFiliereMatiere.value || !newNiveauMatiere.value
                    || !newUeMatiere.value.trim() || !newSemestreMatiere.value) {
                    alert("The course name, department, level, module and semester are required.");
                    return;
                }

                try {
                    await db.collection('matieres').add({
                        nom: newNomMatiere.value.trim(),
                        filiere: newFiliereMatiere.value,
                        niveau: parseInt(newNiveauMatiere.value, 10),
                        ue: newUeMatiere.value.trim(),
                        credits: newCreditsMatiere.value ? Number(newCreditsMatiere.value) : 0,
                        semestre: parseInt(newSemestreMatiere.value, 10),
                        profId: null,
                        profEmail: null
                    });
                    e.target.reset();
                    remplirSelectSemestres('newSemestreMatiere', '');
                } catch (err) {
                    console.error(err);
                    alert("Unable to create the course.");
                }
            });
        }

        // ==========================================
        // Import de plusieurs matières depuis un fichier PDF/Word
        // (un nom de matière par ligne dans le document déposé)
        // ==========================================
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        const formAddDevoir = document.getElementById('formAddDevoir');
        formAddDevoir.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newTitreDevoir = document.getElementById('newTitreDevoir');
            const newDescDevoir = document.getElementById('newDescDevoir');
            const newFiliereDevoir = document.getElementById('newFiliereDevoir');

            if (!newTitreDevoir.value || !newFiliereDevoir.value) {
                alert("The title and department of the assignment are required.");
                return;
            }

            try {
                await ecrireEnFile(db.collection('devoirs').add({
                    titre: newTitreDevoir.value,
                    desc: newDescDevoir.value,
                    filiere: newFiliereDevoir.value
                }));
                e.target.reset();
            } catch (err) {
                console.error(err);
                alert("Unable to add the assignment.");
            }
        });
    }

    // ---------------- PROF ----------------
    if (document.getElementById('listeCoursProf')) {
        remplirSelectCours('supportCours');

        const supportFileInput = document.getElementById('supportFile');
        const supportLienInput = document.getElementById('supportLien');
        document.querySelectorAll('input[name="supportType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const modeLien = document.querySelector('input[name="supportType"]:checked').value === 'lien';
                supportFileInput.style.display = modeLien ? 'none' : 'block';
                supportLienInput.style.display = modeLien ? 'block' : 'none';
                supportFileInput.required = !modeLien;
                supportLienInput.required = modeLien;
                if (modeLien) supportFileInput.value = '';
                else supportLienInput.value = '';
            });
        });

        const formAddSupport = document.getElementById('formAddSupport');
        formAddSupport.addEventListener('submit', (e) => {
            e.preventDefault();
            const supportCours = document.getElementById('supportCours');
            const supportNom = document.getElementById('supportNom');
            const modeLien = document.querySelector('input[name="supportType"]:checked').value === 'lien';

            if (!supportCours.value) {
                alert("Please choose a lecture.");
                return;
            }

            if (modeLien) {
                const lien = supportLienInput.value.trim();
                if (!lien || !/^https?:\/\/.+/i.test(lien)) {
                    alert("Please enter a valid link (starting with http:// or https://).");
                    return;
                }
                ecrireEnFile(db.collection('supports').add({
                    coursId: supportCours.value,
                    nom: supportNom.value,
                    lien
                })).then(() => {
                    formAddSupport.reset();
                    supportFileInput.style.display = 'block';
                    supportLienInput.style.display = 'none';
                    supportFileInput.required = true;
                    supportLienInput.required = false;
                }).catch(err => {
                    console.error(err);
                    alert("Unable to send the material link.");
                });
                return;
            }

            const file = supportFileInput.files[0];
            if (!file) {
                alert("Please choose a file.");
                return;
            }

            const formSupport = e.target;
            const coursIdSupport = supportCours.value;
            const nomSupport = supportNom.value;
            lireFichierPourEnvoi(file).then(async (dataUrl) => {
                if (dataUrl.length > LIMITE_FICHIER_OCTETS) {
                    alert("This file is too large (limit about 950 KB). Reduce it or share a Google Drive link instead.");
                    return;
                }
                const etat = await ecrireEnFile(db.collection('supports').add({
                    coursId: coursIdSupport,
                    nom: nomSupport,
                    fichier: dataUrl
                }));
                formSupport.reset();
                if (etat === 'file') afficherToast(messageFile('Material'));
            }).catch((err) => {
                console.error(err);
                alert("Unable to send the material.");
            });
        });
    }

    // ---------------- ETUDIANT ----------------
    if (document.getElementById('listeCours')) {
        demanderPermissionNotification();
        remplirSelectDevoir('depotDevoir');

        const depotFileInput = document.getElementById('depotFile');
        const depotLienInput = document.getElementById('depotLien');
        document.querySelectorAll('input[name="depotType"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const modeLien = document.querySelector('input[name="depotType"]:checked').value === 'lien';
                depotFileInput.style.display = modeLien ? 'none' : 'block';
                depotLienInput.style.display = modeLien ? 'block' : 'none';
                depotFileInput.required = !modeLien;
                depotLienInput.required = modeLien;
                if (modeLien) depotFileInput.value = '';
                else depotLienInput.value = '';
            });
        });

        const formDepot = document.getElementById('formDepot');
        formDepot.addEventListener('submit', (e) => {
            e.preventDefault();
            const depotDevoir = document.getElementById('depotDevoir');
            const modeLien = document.querySelector('input[name="depotType"]:checked').value === 'lien';

            if (!depotDevoir.value) {
                alert("Please choose an assignment.");
                return;
            }

            const devoirId = depotDevoir.value;
            const dejaDepose = state.DEPOTS.some(d => d.devoirId === devoirId && d.etudiant === currentUser.email);
            if (dejaDepose) {
                alert("You have already submitted a copy for this assignment.");
                return;
            }

            if (modeLien) {
                const lien = depotLienInput.value.trim();
                if (!lien || !/^https?:\/\/.+/i.test(lien)) {
                    alert("Please enter a valid link (starting with http:// or https://).");
                    return;
                }
                const devoir = state.DEVOIRS.find(d => d.id === devoirId);
                ecrireEnFile(db.collection('depots').add({
                    devoirId,
                    etudiant: currentUser.email,
                    filiere: devoir ? devoir.filiere : currentUser.filiere,
                    lien,
                    note: ""
                })).then((etat) => {
                    formDepot.reset();
                    depotFileInput.style.display = 'block';
                    depotLienInput.style.display = 'none';
                    depotFileInput.required = true;
                    depotLienInput.required = false;
                    alert(etat === 'file' ? messageFile('Submission link') : "Submission link sent!");
                }).catch(err => {
                    console.error(err);
                    alert("Unable to send the submission link.");
                });
                return;
            }

            const file = depotFileInput.files[0];
            if (!file) {
                alert("Please choose a file.");
                return;
            }

            const btnDepot = formDepot.querySelector('button[type="submit"]');
            if (btnDepot) btnDepot.disabled = true;
            // Les photos sont réduites avant envoi (indispensable en 2G) ; un fichier trop
            // lourd est refusé tout de suite, car hors-ligne il serait rejeté plus tard sans qu'on le voie.
            lireFichierPourEnvoi(file).then(async (dataUrl) => {
                if (dataUrl.length > LIMITE_FICHIER_OCTETS) {
                    alert("This file is too large (limit about 950 KB). Reduce it or submit a Google Drive link instead.");
                    return;
                }
                const devoir = state.DEVOIRS.find(d => d.id === devoirId);
                const etat = await ecrireEnFile(db.collection('depots').add({
                    devoirId,
                    etudiant: currentUser.email,
                    filiere: devoir ? devoir.filiere : currentUser.filiere, // dénormalisé pour restreindre les requêtes par filière
                    fichier: dataUrl,
                    note: ""
                }));
                formDepot.reset();
                alert(etat === 'file' ? messageFile('Submission') : "Submission sent!");
            }).catch((err) => {
                console.error(err);
                alert("Unable to send the submission.");
            }).finally(() => { if (btnDepot) btnDepot.disabled = false; });
        });
    }
});

// ================= FONCTIONS D'AFFICHAGE / ADMIN =================

function nomAffiche(u) {
    return u.nom && u.prenom ? `${u.prenom} ${u.nom}` : u.email;
}

// Échappe le HTML : toutes les valeurs saisies par un utilisateur (nom de
// matière, titre de cours/devoir, email, contenu d'un fichier importé...)
// passent par cette fonction avant d'être insérées dans le innerHTML d'une
// page. Sans ça, un simple "<script>" tapé dans un champ texte (ou caché
// dans un PDF/Excel importé) s'exécuterait dans le navigateur de TOUS les
// utilisateurs qui consultent ensuite cette donnée (faille XSS stockée).
function escapeHtml(valeur) {
    if (valeur === null || valeur === undefined) return '';
    return String(valeur)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Libellé lisible d'un rôle technique (affichage uniquement).
function libelleRole(role) {
    const libelles = { admin: 'Administrator', prof: 'Lecturer', etudiant: 'Student', examen: "Examinations Office", daas: 'DAAS (Academic Affairs & Registry)' };
    return libelles[role] || role;
}

function afficherUsers() {
    const el = document.getElementById('listeUsers');
    if (!el) return;
    el.innerHTML = state.USERS.map((u) =>
        `<div class="card"><p><b>${u.nom && u.prenom ? escapeHtml(nomAffiche(u)) + ' — ' + escapeHtml(u.email) : escapeHtml(u.email)}</b> - ${escapeHtml(libelleRole(u.role))} ${u.filiere ? '(' + escapeHtml(getNomFiliere(u.filiere)) + (u.niveau ? ' - ' + escapeHtml(getNomNiveau(u.niveau)) : '') + ')' : ''} ${u.matricule ? '<br><small>Index No.: ' + escapeHtml(u.matricule) + '</small>' : (u.role === 'student' ? '<br><small style="color:var(--danger);">No index number assigned</small>' : '')}</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${u.role === 'student' ? `<button type="button" onclick="modifierMatriculeUser('${u.id}')" class="btn-secondary">${u.matricule ? 'Edit' : 'Assign'} the index number</button>` : ''}
                ${u.role !== 'admin' ? `<button onclick="supprimerUser('${u.id}')" class="btn-danger">Delete</button>` : ''}
            </div>
        </div>`
    ).join('') || '<p>No user</p>';
}

// Permet à l'admin d'attribuer ou de corriger le N° matricule d'un étudiant
// après sa création (ex : étudiant importé sans matricule, faute de frappe...).
// Même règle qu'à la création : un matricule doit être unique parmi les étudiants.
async function modifierMatriculeUser(id) {
    const etudiant = state.USERS.find(u => u.id === id);
    if (!etudiant || etudiant.role !== 'student') return;

    const saisie = prompt(
        `Index number for ${nomAffiche(etudiant)} (${etudiant.email}) :`,
        etudiant.matricule || ''
    );
    if (saisie === null) return; // annulé
    const nouveauMatricule = saisie.trim();
    if (!nouveauMatricule) {
        alert("The index number cannot be empty.");
        return;
    }
    const dejaUtilise = state.USERS.some(u =>
        u.id !== id && u.role === 'student' &&
        (u.matricule || '').toLowerCase() === nouveauMatricule.toLowerCase()
    );
    if (dejaUtilise) {
        alert("This index number is already assigned to another student.");
        return;
    }
    try {
        await db.collection('users').doc(id).update({ matricule: nouveauMatricule });
    } catch (err) {
        console.error(err);
        alert("Updating the index number failed.");
    }
}

async function supprimerUser(id) {
    if (!confirm("Delete this user?")) return;
    try {
        await db.collection('users').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Unable to delete.");
    }
}

// ==========================================
// Création de plusieurs utilisateurs à la fois depuis un fichier Excel/CSV
// (admins, professeurs et/ou étudiants mélangés dans un même fichier).
// Réutilise SheetJS (déjà chargé pour l'export des notes) à la fois pour
// générer le modèle et pour lire le fichier rempli par l'admin.
// ==========================================
let usersDetectesImport = [];

// Normalise un nom d'en-tête de colonne (accents/casse/espaces/ponctuation
// ignorés) pour que "Mot de passe", "mot_de_passe" ou "Password" soient
// tous reconnus, quelle que soit la façon dont l'admin a nommé sa colonne.
function normaliserEntete(txt) {
    return String(txt)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z]/g, '');
}

// Génère un mot de passe aléatoire lisible (sans caractères ambigus comme
// 0/O ou 1/l/I) : utilisé quand la colonne "Mot de passe" est laissée vide
// dans le fichier importé — indispensable pour créer une centaine
// d'étudiants d'un coup sans devoir inventer une centaine de mots de passe.
function genererMotDePasseAleatoire(longueur = 8) {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    return chaineAleatoireSecurisee(caracteres, longueur);
}

function telechargerModeleUsers() {
    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not be loaded (check your internet connection) — please try again.");
        return;
    }

    const entetes = ['Last name', 'First name', 'Index No.', 'Email', 'Role', 'Department', 'Level', 'Password'];
    const exemples = [
        ['Mensah', 'Kofi', 'UEW-2026-0001', 'kofi.mensah@uew-ecampus.edu.gh', 'student', 'accounting_finance', 1, ''],
        ['Boateng', 'Ama', '', 'ama.boateng@uew-ecampus.edu.gh', 'lecturer', 'ict', '', ''],
        ['', '', '', 'admin2@uew-ecampus.edu.gh', 'admin', '', '', ''],
        ['', '', '', 'exams2@uew-ecampus.edu.gh', 'exams', '', '', '']
    ];
    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...exemples]);
    feuille['!cols'] = entetes.map(() => ({ wch: 22 }));

    const feuilleCodes = XLSX.utils.aoa_to_sheet([
        ['Column "Role" — accepted values'],
        ['admin'], ['lecturer'], ['student'], ['exams (Examinations Office, scores)'],
        [],
        ['Column "Department" — department code to use (empty for an admin, DAAS or the Examinations Office)', 'Full name'],
        ...Object.keys(FILIERES).map(k => [k, FILIERES[k].nom]),
        [],
        ['Column "Level" — students only', 'Meaning'],
        ...Object.keys(NIVEAUX).map(n => [n, NIVEAUX[n]]),
        [],
        ['Name / First name / Index No.: required for students only'],
        ['(scores export, identification), optional for admin/lecturer.'],
        [],
        ['Password: optional. If left empty, a password is generated'],
        ['automatically for each user, and the complete list'],
        ['(email + password) is offered for download right after creation.']
    ]);

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Users");
    XLSX.utils.book_append_sheet(classeur, feuilleCodes, "Codes to use");
    XLSX.writeFile(classeur, "Users_Template_UEW-E-Campus.xlsx");
}

async function analyserFichierUsers() {
    const input = document.getElementById('fichierUsers');
    const apercu = document.getElementById('apercuUsersImport');

    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not be loaded (check your internet connection) — please try again.");
        return;
    }
    if (!input.files || !input.files[0]) {
        alert("Choose an Excel (.xlsx) or CSV file to analyse.");
        return;
    }

    apercu.innerHTML = '<p>Reading file...</p>';

    try {
        const buffer = await input.files[0].arrayBuffer();
        const classeur = XLSX.read(buffer, { type: 'array' });
        const premiereFeuille = classeur.Sheets[classeur.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(premiereFeuille, { defval: '' });

        if (lignes.length === 0) {
            apercu.innerHTML = "<p>The file contains no usable row. Please use the template provided.</p>";
            return;
        }

        const lireColonne = (ligne, nomAttendu) => {
            const clef = Object.keys(ligne).find(k => nomAttendu.split('|').includes(normaliserEntete(k)));
            return clef ? String(ligne[clef]).trim() : '';
        };

        // Emails déjà en base : pour repérer les doublons AVANT de créer quoi que ce soit.
        const emailsExistants = new Set(state.USERS.map(u => u.email.toLowerCase()));
        const emailsDuFichier = new Set();
        // Matricules déjà en base (étudiants uniquement) : même logique anti-doublon.
        const matriculesExistants = new Set(
            state.USERS.filter(u => u.role === 'student' && u.matricule).map(u => u.matricule.toLowerCase())
        );
        const matriculesDuFichier = new Set();

        usersDetectesImport = lignes.map((ligne, index) => {
            const email = lireColonne(ligne, 'email').toLowerCase();
            const passwordSaisi = lireColonne(ligne, 'password|motdepasse');
            // Mot de passe optionnel : généré automatiquement si absent du
            // fichier (indispensable pour créer 100+ étudiants sans en
            // inventer autant à la main).
            const motDePasseGenere = !passwordSaisi;
            const password = passwordSaisi || genererMotDePasseAleatoire();
            const role = lireColonne(ligne, 'role').toLowerCase();
            const filiere = lireColonne(ligne, 'department|filiere').toLowerCase();
            const niveauBrut = lireColonne(ligne, 'level|niveau');
            const niveau = parseInt(niveauBrut, 10);
            const nom = lireColonne(ligne, 'lastname|nom');
            const prenom = lireColonne(ligne, 'firstname|prenom');
            const matricule = lireColonne(ligne, 'indexno|matricule');

            const erreurs = [];
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erreurs.push("invalid email");
            if (!['admin', 'lecturer', 'student', 'exams', 'daas'].includes(role)) erreurs.push("invalid role (admin/lecturer/student/exams/daas)");
            if (role && role !== 'admin' && role !== 'exams' && role !== 'daas' && !FILIERES[filiere]) erreurs.push("unknown department");
            if (role === 'student' && !NIVEAUX[niveau]) erreurs.push("invalid level (1 to 5)");
            if (role === 'student' && (!nom || !prenom)) erreurs.push("missing last/first name");
            if (role === 'student' && !matricule) erreurs.push("missing index number");
            if (email) {
                if (emailsExistants.has(email)) erreurs.push("email already used in the database");
                if (emailsDuFichier.has(email)) erreurs.push("duplicate email in the file");
                emailsDuFichier.add(email);
            }
            if (role === 'student' && matricule) {
                const matriculeCle = matricule.toLowerCase();
                if (matriculesExistants.has(matriculeCle)) erreurs.push("index number already used in the database");
                if (matriculesDuFichier.has(matriculeCle)) erreurs.push("duplicate index number in the file");
                matriculesDuFichier.add(matriculeCle);
            }

            return { ligneNum: index + 2, email, password, motDePasseGenere, role, filiere, niveau, nom, prenom, matricule, erreurs };
        });

        const nbValides = usersDetectesImport.filter(u => u.erreurs.length === 0).length;

        apercu.innerHTML = `
            <p>${usersDetectesImport.length} row(s) read, of which <b>${nbValides} valid</b>. Rows with errors are greyed out: fix them in the file and re-analyse if needed.</p>
            <div class="checkbox-group">
                ${usersDetectesImport.map((u, i) => {
                    const ok = u.erreurs.length === 0;
                    const nomComplet = (u.nom && u.prenom) ? `${u.prenom} ${u.nom} — ` : '';
                    const details = ok
                        ? `${nomComplet}${u.email} — ${u.role}${u.filiere ? ' — ' + getNomFiliere(u.filiere) : ''}${u.niveau ? ' — ' + getNomNiveau(u.niveau) : ''}${u.matricule ? ' — Index No.: ' + u.matricule : ''}${u.motDePasseGenere ? ' — password generated' : ''}`
                        : `Row ${u.ligneNum} (${u.email || 'missing email'}) : ${u.erreurs.join(', ')}`;
                    return `<label><input type="checkbox" id="userImport_${i}" ${ok ? 'checked' : 'disabled'}> ${escapeHtml(details)}</label>`;
                }).join('')}
            </div>
            <button type="button" onclick="importerUsersSelectionnes()" class="btn-success" ${nbValides === 0 ? 'disabled' : ''}>Create the selected users (${nbValides})</button>
        `;
    } catch (err) {
        console.error(err);
        apercu.innerHTML = "<p>Unable to read this file. Make sure it is an Excel (.xlsx) or CSV file, preferably generated from the template.</p>";
    }
}

async function importerUsersSelectionnes() {
    const apercu = document.getElementById('apercuUsersImport');
    const aCreer = usersDetectesImport.filter((u, i) => {
        const cb = document.getElementById(`userImport_${i}`);
        return cb && cb.checked && u.erreurs.length === 0;
    });

    if (aCreer.length === 0) {
        alert("No valid user selected for creation.");
        return;
    }

    if (aCreer.length > 30 && !confirm(`You are about to create ${aCreer.length} users at once. Continue?`)) {
        return;
    }

    apercu.innerHTML = `<p>Creating (0 / ${aCreer.length})...</p>`;

    try {
        // Firestore limite un batch à 500 écritures ; on découpe par lots de
        // 400 pour rester largement en dessous, même pour un fichier de
        // plusieurs centaines de lignes (100 étudiants tiennent dans un seul lot).
        const TAILLE_LOT = 400;
        const paquets = [];
        for (let i = 0; i < aCreer.length; i += TAILLE_LOT) paquets.push(aCreer.slice(i, i + TAILLE_LOT));

        let creees = 0;
        for (const paquet of paquets) {
            const batch = db.batch();
            paquet.forEach(u => {
                const data = { email: u.email, password: u.password, role: u.role };
                if (u.role !== 'admin' && u.role !== 'exams' && u.role !== 'daas') data.filiere = u.filiere;
                if (u.role === 'student') data.niveau = u.niveau;
                // Nom/prénom/matricule : obligatoires pour un étudiant, mais
                // conservés aussi pour un admin/prof si le fichier les fournissait.
                if (u.nom) data.nom = u.nom;
                if (u.prenom) data.prenom = u.prenom;
                if (u.matricule) data.matricule = u.matricule;
                batch.set(db.collection('users').doc(), data);
            });
            await batch.commit();
            creees += paquet.length;
            apercu.innerHTML = `<p>Creating (${creees} / ${aCreer.length})...</p>`;
        }

        afficherResultatImportUsers(aCreer);
        usersDetectesImport = [];
        document.getElementById('fichierUsers').value = '';
    } catch (err) {
        console.error(err);
        apercu.innerHTML = "<p>An error occurred during creation. Check the user list above (some may already have been created) before running the import again.</p>";
    }
}

// Affiche le résultat de l'import + un bouton pour télécharger les
// identifiants (email + mot de passe, y compris ceux générés automatiquement)
// des utilisateurs qui viennent d'être créés, pour que l'admin puisse les
// distribuer (impression, envoi par classe...).
function afficherResultatImportUsers(utilisateursCrees) {
    const apercu = document.getElementById('apercuUsersImport');
    dernierImportUsersCrees = utilisateursCrees;
    apercu.innerHTML = `
        <p>${utilisateursCrees.length} user(s) created successfully.</p>
        <button type="button" onclick="telechargerIdentifiantsImportes()" class="btn-secondary">Download the credentials (.xlsx)</button>
    `;
}

let dernierImportUsersCrees = [];

function telechargerIdentifiantsImportes() {
    if (typeof XLSX === 'undefined' || dernierImportUsersCrees.length === 0) return;
    const entetes = ['Last name', 'First name', 'Index No.', 'Email', 'Role', 'Department', 'Level', 'Password'];
    const lignes = dernierImportUsersCrees.map(u => [
        u.nom || '', u.prenom || '', u.matricule || '', u.email, u.role,
        u.filiere ? getNomFiliere(u.filiere) : '', u.niveau ? getNomNiveau(u.niveau) : '', u.password
    ]);
    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...lignes]);
    feuille['!cols'] = entetes.map(() => ({ wch: 20 }));
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Credentials");
    XLSX.writeFile(classeur, `Credentials_UEW-E-Campus_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Petit texte "Filières concernées : ..." affiché uniquement pour les cours de
// tronc commun, pour que l'admin/le prof voie d'un coup d'œil qui recevra le cours.
function texteFilieresConcernees(c) {
    if (!estFiliereTroncCommun(c.filiere) || !Array.isArray(c.filieresConcernees) || c.filieresConcernees.length === 0) return '';
    return `<p>Departments concerned: ${c.filieresConcernees.map(getNomFiliere).join(', ')}</p>`;
}

// Petit texte "Matière : ..." affiché uniquement si le cours a été
// programmé à partir d'une matière attribuée par l'admin (voir coursData.matiereId).
function texteMatiereCours(c) {
    if (!c.matiereNom) return '';
    return `<p>Course: ${escapeHtml(c.matiereNom)}</p>`;
}

function afficherCoursAdmin() {
    const el = document.getElementById('listeCoursAdmin');
    if (!el) return;
    el.innerHTML = state.COURS.map((c) =>
        `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(c.titre)}</h4><p>${getNomFiliere(c.filiere)} | ${new Date(c.date).toLocaleString('en-GB')} | ${nomSalle(c.filiere, c.salle)} ${c.en_live ? 'LIVE' : ''}</p>${texteMatiereCours(c)}${texteFilieresConcernees(c)}<button onclick="supprimerCours('${c.id}')" class="btn-danger">Delete</button></div>`
    ).join('') || '<p>No lecture</p>';
}

async function supprimerCours(id) {
    if (!confirm("Delete this lecture? This action cannot be undone.")) return;
    try {
        await db.collection('cours').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Unable to delete.");
    }
}

function afficherDevoirsAdmin() {
    const el = document.getElementById('listeDevoirsAdmin');
    if (!el) return;
    el.innerHTML = state.DEVOIRS.map((d) =>
        `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(d.titre)}</h4><p>${getNomFiliere(d.filiere)}</p><p>${escapeHtml(d.desc)}</p><button onclick="supprimerDevoir('${d.id}')" class="btn-danger">Delete</button></div>`
    ).join('') || '<p>No assignment</p>';
}

// ================= FONCTIONS MATIERES (admin) =================
// Une matière appartient à une filière ET un niveau (comme un cours), et peut
// être attribuée à UN professeur de cette même filière. L'admin peut créer,
// attribuer/réattribuer (y compris "aucun prof") et supprimer.

function afficherMatieresAdmin() {
    const el = document.getElementById('listeMatieresAdmin');
    if (!el) return;

    // Regroupées par UE (dans l'ordre : filière > niveau > UE), pour que
    // l'admin visualise directement quelles matières composent quelle UE
    // et le total de crédits ECTS de chaque UE.
    const matieresTriees = [...state.MATIERES].sort((a, b) =>
        getNomFiliere(a.filiere).localeCompare(getNomFiliere(b.filiere))
        || Number(a.niveau) - Number(b.niveau)
        || (a.ue || '').localeCompare(b.ue || '')
        || (a.nom || '').localeCompare(b.nom || '')
    );

    el.innerHTML = matieresTriees.map(m => {
        // Seuls les profs de la même filière que la matière ont du sens ici.
        const profsFiliere = state.USERS.filter(u => u.role === 'lecturer' && u.filiere === m.filiere);
        const optionsProfs = '<option value="">-- No lecturer --</option>' +
            profsFiliere.map(p => `<option value="${p.id}" ${m.profId === p.id ? 'selected' : ''}>${escapeHtml(nomAffiche(p))}</option>`).join('');

        const semestresPossibles = getSemestresDuNiveau(m.niveau);
        const optionsSemestres = semestresPossibles.map(s =>
            `<option value="${s}" ${Number(m.semestre) === s ? 'selected' : ''}>${getNomSemestre(s)}</option>`
        ).join('');

        return `<div class="card">
            <h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(m.nom)}</h4>
            <p>${getNomFiliere(m.filiere)} | ${getNomNiveau(m.niveau)} | ${getNomSemestre(m.semestre)}</p>
            <p>Module: <b>${escapeHtml(m.ue || 'No module')}</b> — <b>${m.credits || 0}</b> credit hour(s)</p>
            <p>${m.profId ? `Assigned to: <b>${escapeHtml(m.profEmail || '(lecturer)')}</b>` : 'No lecturer assigned yet'}</p>

            <label>Assign / reassign to a lecturer:</label>
            <select onchange="assignerProfMatiere('${m.id}', this.value)">${optionsProfs}</select>

            <label>Module:</label>
            <input type="text" id="ueMatiere_${m.id}" value="${escapeHtml(m.ue || '')}" placeholder="e.g. Module 1 - Foundations">

            <label>Credit hours:</label>
            <input type="number" id="creditsMatiere_${m.id}" min="0" step="0.5" value="${m.credits || 0}">

            <label>Semester:</label>
            <select id="semestreMatiere_${m.id}">${optionsSemestres}</select>

            <button type="button" onclick="mettreAJourMatiere('${m.id}')" class="btn-success">Save module / credit hours / semester</button>
            <button onclick="supprimerMatiere('${m.id}')" class="btn-danger">Delete</button>
        </div>`;
    }).join('') || '<p>No course created yet</p>';
}

// Met à jour l'UE, les crédits ECTS et le semestre d'une matière déjà créée
// (utile notamment pour corriger/compléter des matières importées en masse
// depuis un fichier, qui partagent au départ la même UE/les mêmes crédits).
async function mettreAJourMatiere(id) {
    const ueInput = document.getElementById(`ueMatiere_${id}`);
    const creditsInput = document.getElementById(`creditsMatiere_${id}`);
    const semestreSelect = document.getElementById(`semestreMatiere_${id}`);
    if (!ueInput || !creditsInput || !semestreSelect) return;

    if (!ueInput.value.trim()) {
        alert("The module is required.");
        return;
    }
    if (!semestreSelect.value) {
        alert("The semester is required.");
        return;
    }

    try {
        await db.collection('matieres').doc(id).update({
            ue: ueInput.value.trim(),
            credits: creditsInput.value ? Number(creditsInput.value) : 0,
            semestre: parseInt(semestreSelect.value, 10)
        });
    } catch (err) {
        console.error(err);
        alert("Unable to update this course.");
    }
}

async function assignerProfMatiere(matiereId, profId) {
    try {
        if (!profId) {
            await db.collection('matieres').doc(matiereId).update({ profId: null, profEmail: null });
            return;
        }
        const prof = state.USERS.find(u => u.id === profId);
        await db.collection('matieres').doc(matiereId).update({
            profId,
            profEmail: prof ? prof.email : null
        });
    } catch (err) {
        console.error(err);
        alert("Unable to assign the course to this lecturer.");
        afficherMatieresAdmin(); // réaffiche l'état réel (annule le changement visuel du select)
    }
}

// ==========================================
// Import de matières en masse depuis un fichier PDF ou Word (.docx)
// Chaque ligne non vide du fichier devient une matière candidate,
// créée pour la filière et le niveau choisis par l'admin.
// ==========================================
let matieresDetecteesImport = [];

// Normalise un nom de matière pour comparaison (accents/casse/espaces
// ignorés) : sert à détecter les doublons, aussi bien à l'intérieur du
// fichier importé qu'avec les matières déjà présentes en base.
function normaliserNomMatiere(nom) {
    return nom
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // retire les accents
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

async function extraireTexteFichier(file) {
    const nom = file.name.toLowerCase();
    if (nom.endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let texte = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const contenu = await page.getTextContent();

            // IMPORTANT : pdf.js ne renvoie PAS des lignes de texte, mais
            // des fragments positionnés par coordonnées (x, y). Les
            // concaténer tel quel écrase tous les retours à la ligne du
            // PDF d'origine et fusionne toutes les matières d'une page en
            // une seule "ligne" géante (donc jamais détectée ensuite).
            // On reconstitue les lignes en regroupant les fragments qui
            // partagent la même coordonnée Y (à une petite tolérance près,
            // pour absorber les micro-décalages de rendu des polices).
            const TOLERANCE_Y = 2;
            let ligneCourante = [];
            let yLigneCourante = null;
            const lignesPage = [];

            contenu.items.forEach(item => {
                const y = item.transform[5];
                if (yLigneCourante !== null && Math.abs(y - yLigneCourante) > TOLERANCE_Y) {
                    lignesPage.push(ligneCourante.join(' '));
                    ligneCourante = [];
                }
                ligneCourante.push(item.str);
                yLigneCourante = y;
            });
            if (ligneCourante.length > 0) lignesPage.push(ligneCourante.join(' '));

            texte += lignesPage.join('\n') + '\n';
        }
        return texte;
    }
    if (nom.endsWith('.docx')) {
        const buffer = await file.arrayBuffer();
        const resultat = await mammoth.extractRawText({ arrayBuffer: buffer });
        return resultat.value;
    }
    if (nom.endsWith('.doc')) {
        throw new Error("The .doc format (old Word) is not supported: save the file as .docx or PDF, then try again.");
    }
    throw new Error("Unsupported format. Use a PDF or .docx file.");
}

function nettoyerLigneMatiere(ligne) {
    return ligne
        .replace(/^[\s•\-–—*]+/, '')     // puces en début de ligne
        .replace(/^\d+[\).\-]\s*/, '')   // numérotation "1. " / "1) " / "1- "
        .replace(/\s+/g, ' ')
        .trim();
}

async function analyserFichierMatieres() {
    const input = document.getElementById('fichierMatieres');
    const apercu = document.getElementById('apercuMatieresImport');
    const filiere = document.getElementById('importFiliereMatiere').value;
    const niveau = document.getElementById('importNiveauMatiere').value;
    const ueEl = document.getElementById('importUeMatiere');
    const semestreEl = document.getElementById('importSemestreMatiere');

    if (!filiere || !niveau) {
        alert("First choose the department and level concerned by this file.");
        return;
    }
    if (!ueEl.value.trim() || !semestreEl.value) {
        alert("Also choose the module and semester concerned by this file (all courses in the file belong to the same module/semester; you can adjust an individual course afterwards from the list).");
        return;
    }
    if (!input.files || !input.files[0]) {
        alert("Choose a PDF or Word file to analyse.");
        return;
    }

    apercu.innerHTML = '<p>Reading file...</p>';

    try {
        const texte = await extraireTexteFichier(input.files[0]);
        const lignes = texte.split('\n')
            .map(nettoyerLigneMatiere)
            .filter(l => l.length >= 2 && l.length <= 80);

        // Dédoublonnage à l'intérieur même du fichier (insensible aux
        // accents/casse), pour éviter de proposer deux fois la même matière
        // si elle apparaît deux fois dans le document.
        const vues = new Set();
        matieresDetecteesImport = lignes.filter(l => {
            const cle = normaliserNomMatiere(l);
            if (vues.has(cle)) return false;
            vues.add(cle);
            return true;
        });

        if (matieresDetecteesImport.length === 0) {
            apercu.innerHTML = "<p>No course detected in this file. Check that it contains one course name per line.</p>";
            return;
        }

        // Repère celles qui existent déjà en base pour cette filière/ce
        // niveau (même nom, accents/casse ignorés) : décochées par défaut
        // pour ne pas créer de doublon Firestore par mégarde, mais l'admin
        // peut quand même les recocher s'il le souhaite vraiment.
        const niveauInt = parseInt(niveau, 10);
        const dejaExistantes = new Set(
            state.MATIERES
                .filter(m => m.filiere === filiere && Number(m.niveau) === niveauInt)
                .map(m => normaliserNomMatiere(m.nom))
        );

        apercu.innerHTML = `
            <p>${matieresDetecteesImport.length} course(s) detected for <b>${getNomFiliere(filiere)} - ${getNomNiveau(niveauInt)}</b>. Untick the ones you do not want to create:</p>
            <div class="checkbox-group">
                ${matieresDetecteesImport.map((m, i) => {
                    const existeDeja = dejaExistantes.has(normaliserNomMatiere(m));
                    return `<label><input type="checkbox" id="matiereImport_${i}" ${existeDeja ? '' : 'checked'}> ${escapeHtml(m)}${existeDeja ? ' <i>(already exists — unticked)</i>' : ''}</label>`;
                }).join('')}
            </div>
            <button type="button" onclick="importerMatieresSelectionnees()" class="btn-success">Create the selected courses</button>
        `;
    } catch (err) {
        console.error(err);
        apercu.innerHTML = `<p>${escapeHtml(err.message || "Unable to read this file.")}</p>`;
    }
}

async function importerMatieresSelectionnees() {
    const filiere = document.getElementById('importFiliereMatiere').value;
    const niveau = parseInt(document.getElementById('importNiveauMatiere').value, 10);
    const ue = document.getElementById('importUeMatiere').value.trim();
    const credits = document.getElementById('importCreditsMatiere').value ? Number(document.getElementById('importCreditsMatiere').value) : 0;
    const semestre = parseInt(document.getElementById('importSemestreMatiere').value, 10);
    const apercu = document.getElementById('apercuMatieresImport');

    const aCreer = matieresDetecteesImport.filter((m, i) => {
        const cb = document.getElementById(`matiereImport_${i}`);
        return cb && cb.checked;
    });

    if (aCreer.length === 0) {
        alert("No course selected for creation.");
        return;
    }

    try {
        await Promise.all(aCreer.map(nom => db.collection('matieres').add({
            nom,
            filiere,
            niveau,
            ue,
            credits,
            semestre,
            profId: null,
            profEmail: null
        })));
        apercu.innerHTML = `<p>${aCreer.length} course(s) created successfully.</p>`;
        matieresDetecteesImport = [];
        document.getElementById('fichierMatieres').value = '';
    } catch (err) {
        console.error(err);
        alert("Unable to create some courses.");
    }
}

async function supprimerMatiere(id) {
    if (!confirm("Delete this course? Lectures already scheduled will not be deleted.")) return;
    try {
        await db.collection('matieres').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Unable to delete.");
    }
}

// ================= FONCTIONS MATIERES (prof) =================

// Liste en lecture seule des matières que l'admin a attribuées à ce prof.
function afficherMatieresProf() {
    const el = document.getElementById('listeMatieresProf');
    if (!el || !currentUser) return;

    const mesMatieres = state.MATIERES.filter(m => m.profId === currentUser.id);
    el.innerHTML = mesMatieres.map(m =>
        `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(m.nom)}</h4><p>${getNomNiveau(m.niveau)} | ${getNomSemestre(m.semestre)} | ${getNomFiliere(m.filiere)}</p><p>Module: ${escapeHtml(m.ue || 'No module')} — ${m.credits || 0} credit hour(s)</p></div>`
    ).join('') || "<p>No course has been assigned to you by the administration yet.</p>";
}

// Remplit le select "Matière" du formulaire "Programmer un cours" de
// l'admin, avec TOUTES les matières existantes (toutes filières confondues,
// puisque c'est l'admin qui choisit ensuite la filière via le champ dédié).
// Choisir une matière préremplit automatiquement la filière, le niveau/salle
// et le titre (si vide) du cours.
function remplirSelectMatieresAdmin() {
    const el = document.getElementById('coursMatiereAdmin');
    if (!el) return;

    el.innerHTML = '<option value="">-- Free entry (no course) --</option>' +
        state.MATIERES.map(m =>
            `<option value="${m.id}" data-filiere="${escapeHtml(m.filiere)}" data-niveau="${m.niveau}" data-nom="${escapeHtml(m.nom)}">${escapeHtml(m.nom)} — ${getNomFiliere(m.filiere)} / ${getNomNiveau(m.niveau)} ${m.profEmail ? '(' + escapeHtml(m.profEmail) + ')' : '(not assigned)'}</option>`
        ).join('');
}

// Appelée par le onchange du select #coursMatiereAdmin (voir admin.html).
function appliquerMatiereSelectionneeAdmin() {
    const select = document.getElementById('coursMatiereAdmin');
    const filiereSelect = document.getElementById('newFiliereCours');
    const salleSelect = document.getElementById('newSalle');
    const titreInput = document.getElementById('newTitre');
    if (!select || !select.value) return;

    const option = select.options[select.selectedIndex];
    const filiere = option.getAttribute('data-filiere');
    const niveau = option.getAttribute('data-niveau');
    const nom = option.getAttribute('data-nom');

    if (filiereSelect && filiere) {
        filiereSelect.value = filiere;
        remplirSelectSalles('newSalle', filiere);
        toggleFilieresConcerneesCours();
    }
    if (salleSelect && niveau) salleSelect.value = niveau;
    if (titreInput && !titreInput.value.trim()) titreInput.value = nom;
}

async function supprimerDevoir(id) {
    if (!confirm("Delete this assignment? The related submissions will remain orphaned.")) return;
    try {
        await db.collection('devoirs').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Unable to delete.");
    }
}

function afficherStats() {
    if (!document.getElementById('totalCours')) return;
    document.getElementById('totalCours').innerText = state.COURS.length;
    document.getElementById('totalDevoirs').innerText = state.DEVOIRS.length;
    document.getElementById('totalProfs').innerText = state.USERS.filter(u => u.role === 'lecturer').length;
    document.getElementById('totalEtudiants').innerText = state.USERS.filter(u => u.role === 'student').length;
    const totalMatieresEl = document.getElementById('totalMatieres');
    if (totalMatieresEl) totalMatieresEl.innerText = state.MATIERES.length;
    const totalInscriptionsEl = document.getElementById('totalInscriptions');
    if (totalInscriptionsEl) {
        totalInscriptionsEl.innerText = state.INSCRIPTIONS.filter(i => i.statut === 'en_attente').length;
    }
}

// ================= FONCTIONS PROF =================

async function lancerCours(id) {
    const cours = state.COURS.find(c => c.id === id);
    if (!cours) return;

    const conflit = state.COURS.find(c => c.id !== id && c.filiere === cours.filiere && c.salle === cours.salle && c.en_live === true);
    if (conflit) {
        alert(`Not possible: the room "${nomSalle(cours.filiere, cours.salle)}" is already used by the lecture "${conflit.titre}". Stop it first, or choose a lecture in another room.`);
        return;
    }

    try {
        await db.collection('cours').doc(id).update({ en_live: true });
        // Pas besoin de rafraîchir manuellement : Firestore pousse le changement
        // à ce navigateur ET à tous les étudiants concernés en temps réel.
        alert("The lecture is LIVE! Students of the department receive the link instantly.");
    } catch (err) {
        console.error(err);
        alert("Unable to start the lecture. Check your connection.");
    }
}

async function couperCours(id) {
    try {
        await db.collection('cours').doc(id).update({ en_live: false });
        alert("The lecture has ENDED");
    } catch (err) {
        console.error(err);
        alert("Unable to stop the lecture.");
    }
}

function blocVisio(c) {
    // NOTE : meet.jit.si (serveur public gratuit) limite les réunions à 5 minutes
    // lorsqu'elles sont intégrées en <iframe> dans une page ("embed mode").
    // Cette limite ne s'applique PAS quand la réunion est ouverte dans un onglet
    // séparé — on utilise donc systématiquement un bouton "Rejoindre" plutôt
    // qu'un <iframe>, pour des cours sans limite de durée.
    if (!estLienJitsi(c.lien)) {
        return `<div class="jitsi-fallback"><p>Video conference room ready.</p><a href="${c.lien}" target="_blank" rel="noopener"><button class="btn-live">Join the video call</button></a></div>`;
    }
    // Connexion faible (2G/3G) : la vidéo est inutilisable, l'audio seul reste possible.
    // Les paramètres après # sont lus par Jitsi (aucune modification côté serveur).
    const lienAudio = `${c.lien}#config.startAudioOnly=true&config.startWithVideoMuted=true`;
    const lent = typeof window.reseauLent === 'function' && window.reseauLent();
    const principal = lent
        ? `<a href="${lienAudio}" target="_blank" rel="noopener"><button class="btn-live">Join audio-only (weak connection)</button></a>`
        : `<a href="${c.lien}" target="_blank" rel="noopener"><button class="btn-live">Join the video call</button></a>`;
    const secondaire = lent
        ? `<a href="${c.lien}" target="_blank" rel="noopener">with video</a>`
        : `<a href="${lienAudio}" target="_blank" rel="noopener">audio only (saves data)</a>`;
    return `<div class="jitsi-fallback"><p>Video conference room ready.</p>${principal}<p style="margin:8px 0 0;font-size:13px;">Or: ${secondaire}</p></div>`;
}

// Liste, pour un cours donné, le temps passé par chaque étudiant concerné
// (même filière + même niveau que la salle du cours) — visible par le prof.
function blocPresenceEtudiants(c) {
    const etudiantsConcernes = state.USERS.filter(u => u.role === 'student' && coursConcerneEtudiant(c, u));
    if (etudiantsConcernes.length === 0) return '';

    const lignes = etudiantsConcernes.map(u => {
        const presencesEtudiant = state.PRESENCES.filter(p => p.etudiant === u.email && p.coursId === c.id);
        const secondes = presencesEtudiant.reduce((total, p) => total + calculerSecondesPresence(p), 0);
        const enDirect = presencesEtudiant.some(p => p.enLigne);
        return `<li class="${enDirect ? 'presence-en-direct' : ''}">${escapeHtml(nomAffiche(u))} — <b>${formatDuree(secondes)}</b></li>`;
    }).join('');

    return `<div class="presence-etudiants"><p><b>Time spent by students in this lecture:</b></p><ul>${lignes}</ul></div>`;
}

function afficherCoursProf() {
    const el = document.getElementById('listeCoursProf');
    if (!el || !currentUser) return;

    // Un prof ne gère que les cours de sa filière qui lui sont réellement
    // destinés (voir coursGereParProf : tient compte de l'attribution des
    // matières par l'admin).
    const mesCours = currentUser.role === 'admin'
        ? state.COURS
        : state.COURS.filter(c => coursGereParProf(c, currentUser));

    el.innerHTML = mesCours.map(c =>
        `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(c.titre)}</h4><p>${getNomFiliere(c.filiere)} | ${new Date(c.date).toLocaleString('en-GB')} | ${nomSalle(c.filiere, c.salle)}</p>${texteMatiereCours(c)}${texteFilieresConcernees(c)}${c.en_live ? `<p class="live">LIVE</p>${blocVisio(c)}<button onclick="couperCours('${c.id}')" class="btn-danger" style="margin-top:12px;">Stop the Live</button>` : `<button onclick="lancerCours('${c.id}')" class="btn-success">Start the Live</button>`}${blocPresenceEtudiants(c)}</div>`
    ).join('') || "<p>No lecture scheduled by the administration yet</p>";
}

// Rendu d'une pièce jointe (support de cours ou copie rendue) : gère les
// deux cas possibles, un fichier stocké en base64 (téléchargement direct)
// ou un simple lien externe (Google Drive, etc.) ouvert dans un nouvel onglet.
function renderPieceJointe(item, nomTelechargement, classeBtn) {
    if (item.lien && !/^https?:\/\//i.test(item.lien)) return '';
    if (item.fichier && !/^data:/i.test(item.fichier)) return '';
    if (item.lien) {
        return `<a href="${escapeHtml(item.lien)}" target="_blank" rel="noopener noreferrer" class="${classeBtn}">Open on Drive</a>`;
    }
    if (item.fichier) {
        return `<a href="${item.fichier}" download="${escapeHtml(nomTelechargement)}" class="${classeBtn}">Download</a>`;
    }
    return '';
}

function afficherSupportsProf() {
    const el = document.getElementById('listeSupportsProf');
    if (!el || !currentUser) return;
    el.innerHTML = state.SUPPORTS
        .filter(s => {
            const cours = state.COURS.find(c => c.id === s.coursId);
            // Un prof ne doit voir/gérer que les supports des cours qui lui sont attribués
            return cours && coursGereParProf(cours, currentUser);
        })
        .map(s => {
            const cours = state.COURS.find(c => c.id === s.coursId);
            return `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(s.nom)}</h4><p><b>Lecture:</b> ${escapeHtml(cours ? cours.titre : '(lecture deleted)')}</p>${renderPieceJointe(s, s.nom, 'btn-secondary')}<button onclick="supprimerSupport('${s.id}')" class="btn-danger">Delete</button></div>`;
        }).join('') || "<p>No material</p>";
}

async function supprimerSupport(id) {
    if (!confirm("Delete this material?")) return;
    try {
        await db.collection('supports').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Unable to delete.");
    }
}

function afficherDepotsProf() {
    const el = document.getElementById('listeDepotsProf');
    if (!el || !currentUser) return;
    // Un prof ne doit voir que les copies déposées pour un devoir de SA
    // propre filière ; l'admin (onglet "Devoirs ou TD") voit tout, toutes
    // filières confondues, pour pouvoir superviser/noter n'importe quelle copie.
    el.innerHTML = state.DEPOTS
        .filter(d => {
            const devoir = state.DEVOIRS.find(dv => dv.id === d.devoirId);
            if (!devoir) return false;
            return currentUser.role === 'admin' || devoir.filiere === currentUser.filiere;
        })
        .map(d => {
            const devoir = state.DEVOIRS.find(dv => dv.id === d.devoirId);
            const etudiant = state.USERS.find(u => u.email === d.etudiant);
            const infosEtudiant = etudiant
                ? `${escapeHtml(nomAffiche(etudiant))}${etudiant.matricule ? ' — Index No.: ' + escapeHtml(etudiant.matricule) : ''}`
                : escapeHtml(d.etudiant);
            const infosFiliere = currentUser.role === 'admin' && devoir ? `<p>${getNomFiliere(devoir.filiere)}</p>` : '';
            return `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(devoir ? devoir.titre : '(assignment deleted)')}</h4>${infosFiliere}<p><b>Student:</b> ${infosEtudiant}</p>${renderPieceJointe(d, 'copie.pdf', 'btn-secondary')}<input type="number" min="0" max="${NOTE_MAX}" placeholder="Score /${NOTE_MAX}" value="${d.note}" onchange="noterCopie('${d.id}', this.value)" style="width:100px;"></div>`;
        }).join('') || "<p>No submission</p>";
}

async function noterCopie(id, note) {
    const n = parseFloat(note);
    if (note !== "" && (isNaN(n) || n < 0 || n > NOTE_MAX)) {
        alert(`The score must be between 0 and ${NOTE_MAX}.`);
        afficherDepotsProf();
        return;
    }
    try {
        await ecrireEnFile(db.collection('depots').doc(id).update({ note }));
    } catch (err) {
        console.error(err);
        alert("Unable to save the score.");
    }
}

// ===================================
// MESSAGERIE INSTANTANEE
// Discussion en temps réel Professeur <-> Étudiant (de sa filière) et
// Professeur <-> Administration. Chaque conversation est identifiée par
// "participants" = les 2 emails triés, ce qui permet de retrouver toujours
// le même fil de discussion entre 2 personnes.
// ===================================

function idConversation(emailA, emailB) {
    return [emailA, emailB].sort().join('__');
}

// ===================================
// MESSAGERIE FLOTTANTE
// Bouton rond (💬 + pastille des messages non lus) qui ouvre une fenêtre
// déplaçable ; deux vues comme WhatsApp : contacts -> conversation.
// ===================================
const idsMarquesLus = new Set();

function nbMessagesNonLusTotal() {
    if (!currentUser) return 0;
    return state.MESSAGES.filter(m => m.to === currentUser.email && !m.lu).length;
}

function majBadgeChat() {
    const badge = document.getElementById('chatFabBadge');
    if (!badge) return;
    const nb = nbMessagesNonLusTotal();
    badge.textContent = nb > 99 ? '99+' : String(nb);
    badge.style.display = nb > 0 ? 'block' : 'none';
}

function chatFlottantOuvert() {
    const p = document.getElementById('chatFlottant');
    return !!p && !p.hidden;
}

function basculerVueChat(vue) {
    const p = document.getElementById('chatFlottant');
    if (!p) return;
    p.classList.toggle('chat-vue-conversation', vue === 'conversation');
    if (vue !== 'conversation') {
        const titre = document.getElementById('chatTitre');
        if (titre) titre.innerText = p.dataset.titre || 'Messages';
    }
}

function ouvrirChatFlottant() {
    const p = document.getElementById('chatFlottant');
    if (!p) return;
    p.hidden = false;
    const fab = document.getElementById('chatFab');
    if (fab) fab.style.display = 'none';
    afficherContactsChat();
    afficherMessagesChat();
    marquerLusConversationActive();
}

function fermerChatFlottant() {
    const p = document.getElementById('chatFlottant');
    if (!p) return;
    p.hidden = true;
    const fab = document.getElementById('chatFab');
    if (fab) fab.style.display = '';
}

// Un message reçu pendant que la conversation est affichée est aussitôt
// marqué "lu" (✓✓ chez l'expéditeur) ; rien n'est marqué si la fenêtre est
// fermée ou l'onglet masqué.
function marquerLusConversationActive() {
    if (!contactChatActif || !currentUser || !chatFlottantOuvert() || document.hidden) return;
    state.MESSAGES
        .filter(m => m.from === contactChatActif && m.to === currentUser.email && !m.lu && !idsMarquesLus.has(m.id))
        .forEach(m => {
            idsMarquesLus.add(m.id);
            db.collection('messages').doc(m.id).update({ lu: true }).catch(err => {
                idsMarquesLus.delete(m.id);
                console.error("Error while marking a message as read:", err);
            });
        });
}

function initialiserChatFlottant() {
    const fab = document.getElementById('chatFab');
    const panneau = document.getElementById('chatFlottant');
    const barre = document.getElementById('chatBarre');
    if (!fab || !panneau || !barre) return;

    fab.addEventListener('click', ouvrirChatFlottant);
    document.getElementById('chatReduire').addEventListener('click', fermerChatFlottant);
    document.getElementById('chatRetour').addEventListener('click', () => {
        contactChatActif = null;
        const form = document.getElementById('formChat');
        if (form) form.style.display = 'none';
        basculerVueChat('liste');
        afficherContactsChat();
        afficherMessagesChat();
    });
    document.getElementById('chatContacts').addEventListener('click', (e) => {
        const ligne = e.target.closest('.chat-contact');
        if (ligne && ligne.dataset.email) ouvrirConversationChat(ligne.dataset.email);
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && chatFlottantOuvert()) fermerChatFlottant();
    });
    document.addEventListener('visibilitychange', marquerLusConversationActive);

    // Déplacement de la fenêtre à la souris / au doigt (ordinateur et tablette ;
    // sur téléphone elle occupe tout l'écran)
    barre.addEventListener('pointerdown', (e) => {
        if (window.innerWidth <= 640 || e.target.closest('button')) return;
        const r = panneau.getBoundingClientRect();
        const dx = e.clientX - r.left;
        const dy = e.clientY - r.top;
        barre.setPointerCapture(e.pointerId);
        const deplacer = (ev) => {
            const x = Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - r.width);
            const y = Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - r.height);
            panneau.style.left = x + 'px';
            panneau.style.top = y + 'px';
            panneau.style.right = 'auto';
            panneau.style.bottom = 'auto';
        };
        const fin = () => {
            barre.removeEventListener('pointermove', deplacer);
            barre.removeEventListener('pointerup', fin);
            barre.removeEventListener('pointercancel', fin);
        };
        barre.addEventListener('pointermove', deplacer);
        barre.addEventListener('pointerup', fin);
        barre.addEventListener('pointercancel', fin);
    });

    majBadgeChat();
}

function notifierNouveauMessage(message) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const expediteur = state.USERS.find(u => u.email === message.from);
    const notif = new Notification('New message', {
        body: `${expediteur ? nomAffiche(expediteur) : message.from} : ${message.texte}`
    });
    notif.onclick = () => {
        window.focus();
        ouvrirChatFlottant();
        if (state.USERS.some(u => u.email === message.from)) ouvrirConversationChat(message.from);
    };
}

// Détermine la liste des contacts autorisés selon le rôle de l'utilisateur
// connecté : un étudiant ne discute qu'avec les profs de SA filière, un prof
// discute avec les étudiants de SA filière et avec l'administration, un admin
// discute avec l'ensemble des professeurs.
function listeContactsChat() {
    if (!currentUser) return [];
    if (currentUser.role === 'student') {
        return state.USERS.filter(u => u.role === 'lecturer' && u.filiere === currentUser.filiere);
    }
    if (currentUser.role === 'lecturer') {
        return state.USERS.filter(u =>
            (u.role === 'student' && u.filiere === currentUser.filiere) || u.role === 'admin'
        );
    }
    if (currentUser.role === 'admin') {
        return state.USERS.filter(u => u.role === 'lecturer');
    }
    return [];
}

function nbMessagesNonLus(emailContact) {
    return state.MESSAGES.filter(m => m.from === emailContact && m.to === currentUser.email && !m.lu).length;
}

function afficherContactsChat() {
    majBadgeChat();
    const el = document.getElementById('chatContacts');
    if (!el || !currentUser) return;

    const contacts = listeContactsChat();

    const rendreContact = (u) => {
        const nb = nbMessagesNonLus(u.email);
        return `<div class="chat-contact ${contactChatActif === u.email ? 'actif' : ''}" data-email="${escapeHtml(u.email)}">
            <span class="chat-contact-nom">${u.role === 'student' ? '🎓 ' : ''}${escapeHtml(nomAffiche(u))}</span>
            ${nb > 0 ? `<span class="chat-contact-badge">${nb}</span>` : ''}
        </div>`;
    };

    if (currentUser.role === 'lecturer') {
        // Deux groupes distincts pour un prof : ses étudiants et l'administration.
        const etudiants = contacts.filter(u => u.role === 'student');
        const admins = contacts.filter(u => u.role === 'admin');
        el.innerHTML =
            (admins.length ? `<div class="chat-contacts-groupe-titre">Administration</div>${admins.map(rendreContact).join('')}` : '') +
            `<div class="chat-contacts-groupe-titre">Students (${getNomFiliere(currentUser.filiere)})</div>` +
            (etudiants.length ? etudiants.map(rendreContact).join('') : '<div class="chat-contacts-vide">No student yet</div>');
    } else {
        el.innerHTML = contacts.length
            ? contacts.map(rendreContact).join('')
            : `<div class="chat-contacts-vide">No contact available yet</div>`;
    }
}

async function ouvrirConversationChat(emailContact) {
    contactChatActif = emailContact;
    afficherContactsChat();
    afficherMessagesChat();

    const contact = state.USERS.find(u => u.email === emailContact);
    const nom = contact ? nomAffiche(contact) : emailContact;
    const header = document.getElementById('chatHeader');
    if (header) header.innerText = nom;
    const titre = document.getElementById('chatTitre');
    if (titre) titre.innerText = nom;
    const form = document.getElementById('formChat');
    if (form) form.style.display = 'flex';

    basculerVueChat('conversation');
    marquerLusConversationActive();
    const saisie = document.getElementById('chatInput');
    if (saisie && window.innerWidth > 640) saisie.focus();
}

// Statut d'un message envoyé par moi, comme sur WhatsApp :
//  🕓 en attente d'envoi (hors-ligne / réseau lent), ✓ envoyé, ✓✓ lu.
function statutMessage(m) {
    if (m.from !== currentUser.email) return '';
    if (m._enAttente) return '<span class="chat-statut chat-statut-attente" title="Waiting to be sent">🕓</span>';
    if (m.lu) return '<span class="chat-statut chat-statut-lu" title="Read">✓✓</span>';
    return '<span class="chat-statut" title="Sent">✓</span>';
}

function afficherMessagesChat() {
    const el = document.getElementById('chatMessages');
    if (!el || !currentUser) return;

    if (!contactChatActif) {
        el.innerHTML = '<p class="chat-messages-vide">Choose a contact on the left to start or continue a conversation.</p>';
        return;
    }

    const fil = state.MESSAGES.filter(m => m.participants && m.participants.includes(contactChatActif) && m.participants.includes(currentUser.email));

    el.innerHTML = fil.length
        ? fil.map(m => `<div class="chat-bulle ${m.from === currentUser.email ? 'chat-bulle-moi' : 'chat-bulle-autre'}${m._enAttente ? ' chat-bulle-attente' : ''}">${escapeHtml(m.texte)}<span class="chat-bulle-heure">${new Date(m.date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}${statutMessage(m)}</span></div>`).join('')
        : '<p class="chat-messages-vide">No message yet. Write the first one!</p>';

    el.scrollTop = el.scrollHeight;
    marquerLusConversationActive();
}

async function envoyerMessageChat(texte) {
    if (!currentUser || !contactChatActif) return;
    const contact = state.USERS.find(u => u.email === contactChatActif);
    const message = {
        participants: [currentUser.email, contactChatActif].sort(),
        from: currentUser.email,
        to: contactChatActif,
        fromRole: currentUser.role,
        toRole: contact ? contact.role : null,
        texte: texte.trim(),
        date: new Date().toISOString(),
        lu: false
    };
    // Pas de "await" sur le serveur : le message s'affiche aussitôt (🕓) puis
    // passe à ✓ dès que le serveur l'a reçu. Sans réseau, il part tout seul
    // au retour de la connexion.
    db.collection('messages').doc().set(message).catch((err) => {
        console.error(err);
        afficherToast("A message was rejected by the server.");
    });
}

// ================= FONCTIONS ETUDIANT =================

function afficherBanniereLive(coursLive) {
    const banniere = document.getElementById('liveBanner');
    if (!banniere) return;

    if (coursLive.length === 0) {
        banniere.innerHTML = '';
        return;
    }

    banniere.innerHTML = coursLive.map(c =>
        `<span>${escapeHtml(c.titre)} (${nomSalle(c.filiere, c.salle)}${estFiliereTroncCommun(c.filiere) ? ' - Common Courses' : ''}is LIVE</span><a href="#live-cours-${c.id}">View lecture</a>`
    ).join(' &nbsp;|&nbsp; ');
    banniere.className = 'live-banner';
}

function afficherCoursEtudiant() {
    const el = document.getElementById('listeCours');
    if (!el || !currentUser) return;

    if (!currentUser.niveau) {
        el.innerHTML = "<p>Your level has not been set by the administration yet. Contact the administrator to see your lectures.</p>";
        afficherBanniereLive([]);
        return;
    }

    // Seuls les cours en live qui concernent la filière ET le niveau de
    // l'étudiant sont montrés (voir coursConcerneEtudiant : gère aussi le
    // cas des cours de tronc commun destinés à plusieurs filières).
    const coursLive = state.COURS.filter(c => c.en_live === true && coursConcerneEtudiant(c, currentUser));

    afficherBanniereLive(coursLive);

    el.innerHTML = coursLive.map(c =>
        `<div class="card card-live" id="live-cours-${c.id}"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(c.titre)}</h4><p>${getNomFiliere(c.filiere)} | ${new Date(c.date).toLocaleString('en-GB')} | ${nomSalle(c.filiere, c.salle)}</p>${texteMatiereCours(c)}${blocVisio(c)}</div>`
    ).join('') || "<p>No live lecture at the moment. This page updates automatically and instantly as soon as a lecturer starts a lecture.</p>";
}

function afficherProchainsCours() {
    const el = document.getElementById('listeProchainsCours');
    if (!el || !currentUser) return;

    if (!currentUser.niveau) {
        el.innerHTML = "<p>Your level has not been set by the administration yet.</p>";
        return;
    }

    const prochains = state.COURS
        .filter(c => c.en_live === false && coursConcerneEtudiant(c, currentUser))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    el.innerHTML = prochains.map(c =>
        `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(c.titre)}</h4><p>${getNomFiliere(c.filiere)} | ${new Date(c.date).toLocaleString('en-GB')} | ${nomSalle(c.filiere, c.salle)}</p>${texteMatiereCours(c)}</div>`
    ).join('') || "<p>No lecture scheduled yet</p>";
}

function afficherSupportsEtudiant() {
    const el = document.getElementById('listeSupportsEtudiant');
    if (!el || !currentUser) return;

    if (!currentUser.niveau) {
        el.innerHTML = "<p>Your level has not been set by the administration yet.</p>";
        return;
    }

    el.innerHTML = state.SUPPORTS
        .filter(s => {
            const cours = state.COURS.find(c => c.id === s.coursId);
            // Un support n'est visible que par les étudiants concernés par le cours (filière/niveau, y compris tronc commun)
            return cours && coursConcerneEtudiant(cours, currentUser);
        })
        .map(s => {
            const cours = state.COURS.find(c => c.id === s.coursId);
            return `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(s.nom)}</h4><p><b>Lecture:</b> ${escapeHtml(cours ? cours.titre : '(lecture deleted)')}</p>${renderPieceJointe(s, s.nom, 'btn-success')}</div>`;
        }).join('') || "<p>No material yet</p>";
}

// Liste des camarades de classe : uniquement ceux de la même filière ET du
// même niveau que l'étudiant connecté ("seuls les étudiants du même niveau
// peuvent consulter leur liste").
function afficherClasseEtudiant() {
    const el = document.getElementById('listeClasseEtudiant');
    if (!el || !currentUser) return;

    if (!currentUser.niveau) {
        el.innerHTML = "<p>Your level has not been set by the administration yet. Ask the administrator to complete it to see your class list.</p>";
        return;
    }

    const camarades = state.USERS.filter(u =>
        u.role === 'student' && u.filiere === currentUser.filiere && Number(u.niveau) === Number(currentUser.niveau)
    );

    el.innerHTML = camarades.map(u => {
        const presenceEnDirect = state.PRESENCES.find(p => p.etudiant === u.email && p.filiere === currentUser.filiere && Number(p.niveau) === Number(currentUser.niveau) && p.enLigne);
        const secondes = presenceEnDirect
            ? calculerSecondesPresence(presenceEnDirect)
            : state.PRESENCES.filter(p => p.etudiant === u.email && p.filiere === currentUser.filiere && Number(p.niveau) === Number(currentUser.niveau))
                .reduce((total, p) => total + calculerSecondesPresence(p), 0);

        return `<div class="card classe-item">
            <span class="minuteur ${presenceEnDirect ? 'minuteur-actif' : ''}">${formatDuree(secondes)}</span>
            <span>${u.email === currentUser.email ? `🎓 ${escapeHtml(nomAffiche(u))} (you)` : `🎓 ${escapeHtml(nomAffiche(u))}`}${u.matricule ? ` <small>(${escapeHtml(u.matricule)})</small>` : ''}</span>
        </div>`;
    }).join('') || "<p>You are the only student at this level for now.</p>";
}

function afficherDevoirsEtudiant() {
    const el = document.getElementById('listeDevoirsEtudiant');
    if (!el || !currentUser) return;
    el.innerHTML = state.DEVOIRS
        .filter(d => d.filiere === currentUser.filiere)
        .map(d => {
            const monDepot = state.DEPOTS.find(dep => dep.devoirId === d.id && dep.etudiant === currentUser.email);
            return `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(d.titre)}</h4><p>${escapeHtml(d.desc)}</p>${monDepot ? `<p class="success">Submitted. Score: ${escapeHtml(monDepot.note || 'Pending')}</p>` : `<p class="warning">Not submitted yet</p>`}</div>`;
        }).join('') || "<p>No assignment</p>";
}

function remplirSelectCours(id) {
    const el = document.getElementById(id);
    if (!el || !currentUser) return;
    // Un prof ne peut envoyer un support que pour les cours qu'il gère
    // réellement (voir coursGereParProf) — pas tous les cours de sa filière.
    const cours = currentUser.role === 'admin' ? state.COURS : state.COURS.filter(c => coursGereParProf(c, currentUser));
    el.innerHTML = '<option value="">Choose a lecture</option>' +
        cours.map(c => `<option value="${c.id}">${escapeHtml(c.titre)} (${getNomFiliere(c.filiere)})</option>`).join('');
}

function remplirSelectDevoir(id) {
    const el = document.getElementById(id);
    if (!el || !currentUser) return;
    const devoirs = currentUser.role === 'admin' ? state.DEVOIRS : state.DEVOIRS.filter(d => d.filiere === currentUser.filiere);
    el.innerHTML = '<option value="">Choose an assignment</option>' +
        devoirs.map(d => `<option value="${d.id}">${escapeHtml(d.titre)} (${getNomFiliere(d.filiere)})</option>`).join('');
}

function remplirSelectFilieres(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const cles = Object.keys(FILIERES);
    const groupes = Object.keys(POLES).map(poleKey => {
        const clesDuPole = cles.filter(key => FILIERES[key].pole === poleKey);
        if (clesDuPole.length === 0) return '';
        const options = clesDuPole.map(key =>
            `<option value="${key}" title="${escapeHtml(FILIERES[key].libelle || '')}">${FILIERES[key].nom}</option>`
        ).join('');
        return `<optgroup label="${POLES[poleKey]}">${options}</optgroup>`;
    }).join('');
    el.innerHTML = '<option value="">Choose a department</option>' + groupes;
}

function remplirSelectNiveaux(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<option value="">-- Choose a level --</option>' +
        Object.keys(NIVEAUX).map(num => `<option value="${num}">${NIVEAUX[num]}</option>`).join('');
}

// Remplit un <select> de semestres. Si un niveau est fourni, ne propose que
// les 2 semestres de ce niveau (ex : niveau 3 -> S5, S6) ; sinon (niveau pas
// encore choisi), propose l'ensemble S1 à S10.
function remplirSelectSemestres(id, niveau) {
    const el = document.getElementById(id);
    if (!el) return;
    const semestres = niveau ? getSemestresDuNiveau(niveau) : Object.values(NIVEAU_SEMESTRES).flat();
    el.innerHTML = '<option value="">-- Choose a semester --</option>' +
        semestres.map(s => `<option value="${s}">${getNomSemestre(s)}</option>`).join('');
}

// Variantes "facultatives" de remplirSelectFilieres/remplirSelectNiveaux :
// la première option ("Toutes les filières" / "Tous les niveaux") a une
// valeur vide qui, dans exporterListeEtudiants(), signifie "pas de filtre"
// plutôt que "champ non rempli".
function remplirSelectFilieresAvecToutes(id) {
    const el = document.getElementById(id);
    if (!el) return;
    remplirSelectFilieres(id);
    el.querySelector('option[value=""]').textContent = 'All departments';
}

function remplirSelectNiveauxAvecToutes(id) {
    const el = document.getElementById(id);
    if (!el) return;
    remplirSelectNiveaux(id);
    el.querySelector('option[value=""]').textContent = 'All levels';
}

function remplirSelectSalles(id, filiereId) {
    const el = document.getElementById(id);
    if (!el || !filiereId) return;
    const filiere = FILIERES[filiereId];
    if (!filiere) return;
    el.innerHTML = Object.keys(filiere.salles).map(num =>
        `<option value="${num}">${filiere.salles[num]}</option>`
    ).join('');
}
