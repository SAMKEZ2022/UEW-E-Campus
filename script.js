// ===================================
// UEW E-CAMPUS PLATFORM - MAIN SCRIPT
// Firebase (real-time) version: students in a department automatically
// receive the room link the moment their lecturer starts the Live session.
// Requirement: firebase-config.js must be loaded BEFORE this file (global "db" variable).
// University of Education, Winneba (UEW) — internal code identifiers (function
// and variable names, Firestore field names) were kept from the original
// codebase and remain in French; every user-facing label, message and menu
// is in English.
// ===================================

// ---- UEW FACULTIES / SCHOOLS ----
// Group departments in the dropdown menus (via <optgroup>).
const POLES = {
    sci_ed: "Faculty of Science Education",
    soc_sci_ed: "Faculty of Social Sciences Education",
    for_lang_ed: "Faculty of Foreign Languages Education",
    ghana_lang_ed: "Faculty of Ghanaian Languages Education",
    health_ed: "Faculty of Health, Allied Sciences and Home Economics Education",
    behav_sci_ed: "Faculty of Applied Behavioural Sciences in Education",
    business: "School of Business",
    comm_media: "School of Communication and Media Studies",
    creative_arts: "School of Creative Arts",
    edu_lifelong: "School of Education and Life-Long Learning",
    commun: "Common Core"
};

// ---- DEPARTMENTS AND FIXED VIRTUAL ROOMS ----
// Each department has 5 permanent Jitsi rooms (one per level), so several
// departments can be live at the same time.
// "abbr" is the short name shown everywhere (menus, cards, room titles);
// "libelle" is the department's full name (tooltip / Excel export) and
// includes its main areas of specialisation.
const FILIERES_DATA = [
    // -- Faculty of Science Education (3 departments) --
    { key: "ict", abbr: "ICT", libelle: "Information and Communication Technology (Software Engineering, Networking, Information Systems)", pole: "sci_ed", couleur: "#2E86DE" },
    { key: "math_ed", abbr: "Mathematics Education", libelle: "Mathematics Education (Applied Mathematics, Statistics)", pole: "sci_ed", couleur: "#2E86DE" },
    { key: "int_sci_ed", abbr: "Integrated Science Education", libelle: "Integrated Science Education (Physics, Chemistry, Biology Education)", pole: "sci_ed", couleur: "#2E86DE" },

    // -- Faculty of Social Sciences Education (4 departments) --
    { key: "econ_ed", abbr: "Economics Education", libelle: "Economics Education (Economics, Public Finance)", pole: "soc_sci_ed", couleur: "#27AE60" },
    { key: "geo_ed", abbr: "Geography Education", libelle: "Geography Education (Geography, Land-Use Planning)", pole: "soc_sci_ed", couleur: "#27AE60" },
    { key: "hist_pol_sci", abbr: "History & Political Science Education", libelle: "History and Political Science Education (Political Science, History, Civic Studies)", pole: "soc_sci_ed", couleur: "#27AE60" },
    { key: "soc_studies", abbr: "Social Studies Education", libelle: "Social Studies Education (Social Sciences)", pole: "soc_sci_ed", couleur: "#27AE60" },

    // -- Faculty of Foreign Languages Education (2 departments) --
    { key: "eng_ed", abbr: "English Education", libelle: "English Education (English Linguistics, Literature)", pole: "for_lang_ed", couleur: "#8E44AD" },
    { key: "fr_ed", abbr: "French Education", libelle: "French Education (French Studies, Didactics of French)", pole: "for_lang_ed", couleur: "#8E44AD" },

    // -- Faculty of Ghanaian Languages Education (1 department) --
    { key: "ghana_lang", abbr: "Ghanaian Languages Education", libelle: "Akan-Twi / Fante / Ga / Ewe Education (Local Languages and Cultures)", pole: "ghana_lang_ed", couleur: "#16A085" },

    // -- Faculty of Health, Allied Sciences and Home Economics Education (2 departments) --
    { key: "home_econ", abbr: "Home Economics Education", libelle: "Home Economics Education (Nutrition, Textiles Management, Hospitality Management)", pole: "health_ed", couleur: "#E67E22" },
    { key: "hpers", abbr: "HPERS", libelle: "Health, Physical Education, Recreation and Sports (Sports, Public Health)", pole: "health_ed", couleur: "#E67E22" },

    // -- Faculty of Applied Behavioural Sciences in Education (2 departments) --
    { key: "psych_counsel", abbr: "Psychology & Counselling", libelle: "Psychology and Counselling (Educational Psychology, School Guidance)", pole: "behav_sci_ed", couleur: "#D35400" },
    { key: "special_ed", abbr: "Special Education", libelle: "Special Education", pole: "behav_sci_ed", couleur: "#D35400" },

    // -- School of Business (3 departments) --
    { key: "acct_fin", abbr: "Accounting & Finance", libelle: "Accounting and Finance (Accounting, Finance, Taxation)", pole: "business", couleur: "#C9962E" },
    { key: "mgt_sci", abbr: "Management Sciences", libelle: "Management Sciences (Business Management, Administration)", pole: "business", couleur: "#C9962E" },
    { key: "mkt_scm", abbr: "Marketing & Supply Chain Mgt", libelle: "Marketing and Supply Chain Management (Marketing, Logistics, Procurement)", pole: "business", couleur: "#C9962E" },

    // -- School of Communication and Media Studies (3 departments) --
    { key: "journ_media", abbr: "Journalism & Media Studies", libelle: "Journalism and Media Studies (Journalism, Digital Media)", pole: "comm_media", couleur: "#2980B9" },
    { key: "strat_comm", abbr: "Strategic Communication", libelle: "Strategic Communication (Corporate Communication, Public Relations)", pole: "comm_media", couleur: "#2980B9" },
    { key: "dev_comm", abbr: "Development Communication", libelle: "Development Communication (Communication for Development)", pole: "comm_media", couleur: "#2980B9" },

    // -- School of Creative Arts (4 departments) --
    { key: "graphic_design", abbr: "Graphic Design", libelle: "Graphic Design (Graphic Design, Multimedia)", pole: "creative_arts", couleur: "#AD1457" },
    { key: "theatre_arts", abbr: "Theatre Arts", libelle: "Theatre Arts (Performing Arts, Film)", pole: "creative_arts", couleur: "#AD1457" },
    { key: "music_ed", abbr: "Music Education", libelle: "Music Education (Music, Musicology)", pole: "creative_arts", couleur: "#AD1457" },
    { key: "art_ed", abbr: "Art Education", libelle: "Art Education (Fine Arts, Textiles & Fashion)", pole: "creative_arts", couleur: "#AD1457" },

    // -- School of Education and Life-Long Learning (3 departments) --
    { key: "basic_ed", abbr: "Basic Education", libelle: "Basic Education", pole: "edu_lifelong", couleur: "#00796B" },
    { key: "ecce", abbr: "Early Childhood Education", libelle: "Early Childhood Education", pole: "edu_lifelong", couleur: "#00796B" },
    { key: "adult_ed", abbr: "Adult & Continuing Education", libelle: "Adult and Continuing Education", pole: "edu_lifelong", couleur: "#00796B" }
];

// Generates the 5 fixed virtual rooms (one per level) of a department from
// its short name.
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
// "Common Core": cross-department pseudo-department (see below), not an
// actual UEW programme, but needed for courses shared by several departments.
FILIERES.tronc_commun = {
    nom: "Common Core",
    abbr: "Common Core",
    libelle: "Common Core (courses shared across several departments)",
    slug: "common-core",
    pole: "commun",
    couleur: "#95A5A6",
    salles: genererSallesFiliere("Common Core")
};

// ---- LEVELS (shared by all departments) ----
// A student belongs to a department AND a level (1 to 5). These levels use
// the same numbers as course rooms (c.salle): this is how the platform knows
// which students follow which course.
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

// ---- GRADE SCALE (marks out of 20) ----
// Used on the student side (viewing one's own mark) and on the Exams Office
// side (live preview while entering marks).
function getMention(note) {
    const n = Number(note);
    if (note === '' || note === null || note === undefined || Number.isNaN(n)) {
        return { texte: 'Not graded', classe: 'mention-attente' };
    }
    if (n < 10) return { texte: 'Fail', classe: 'mention-non-valide' };
    if (n < 12) return { texte: 'Pass', classe: 'mention-passable' };
    if (n < 14) return { texte: 'Satisfactory', classe: 'mention-assez-bien' };
    if (n < 16) return { texte: 'Good', classe: 'mention-bien' };
    if (n < 18) return { texte: 'Very Good', classe: 'mention-tres-bien' };
    return { texte: 'Excellent', classe: 'mention-excellent' };
}

// Deterministic id for a mark = course + student: a new entry for the same
// pair simply updates the existing document (never a duplicate), whether
// entered by hand or imported from Excel.
function idNote(matiereId, etudiantId) {
    return `${matiereId}_${etudiantId}`;
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
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function estLienJitsi(lien) {
    return typeof lien === 'string' && lien.includes('meet.jit.si/');
}

// ---- COMMON CORE: a "Common Core" course is followed by several departments ----
// For a normal course, only the course's own department (c.filiere) is
// concerned. For a Common Core course, an explicit list of departments
// (c.filieresConcernees) is chosen by the lecturer/admin scheduling the
// course: students from THESE departments (at the course's level) must
// receive the link, in addition to any student directly attached to the
// "tronc_commun" (Common Core) department.
function estFiliereTroncCommun(filiereId) {
    return filiereId === 'tronc_commun';
}

// Central function: determines whether a given course concerns a given
// student (same level AND (same department OR a department listed in the
// "departments concerned" of a Common Core course)). Used everywhere the
// display, notifications and student attendance tracking are filtered, to
// keep a single consistent rule.
function coursConcerneEtudiant(cours, etudiant) {
    if (!cours || !etudiant || !etudiant.niveau) return false;
    if (Number(cours.salle) !== Number(etudiant.niveau)) return false;
    if (cours.filiere === etudiant.filiere) return true;
    if (estFiliereTroncCommun(cours.filiere) && Array.isArray(cours.filieresConcernees)) {
        return cours.filieresConcernees.includes(etudiant.filiere);
    }
    return false;
}

// Determines whether a given lecturer is allowed to manage a given course
// (see it under "My Courses", start/stop its Live session, send it a
// course material). Rule: same department is mandatory, AND:
//  - if the course is not linked to any course unit (created via "free
//    entry" by the admin): managed by all lecturers of the department
//    (historical behaviour, notably for the Common Core);
//  - if the course is linked to a course unit WITHOUT an assigned
//    lecturer: managed by all lecturers of the department, pending
//    assignment;
//  - if the course is linked to a course unit WITH an assigned lecturer:
//    managed ONLY by that lecturer.
function coursGereParProf(cours, prof) {
    if (!cours || !prof) return false;
    if (cours.filiere !== prof.filiere) return false;
    if (!cours.matiereId) return true;
    const matiere = state.MATIERES.find(m => m.id === cours.matiereId);
    if (!matiere || !matiere.profId) return true;
    return matiere.profId === prof.id;
}

// Fills a checkbox list with all "normal" departments (the "tronc_commun"
// pseudo-department itself is excluded: it would make no sense to tick
// "Common Core" as a department concerned by a Common Core course).
// Departments are grouped by faculty to stay readable despite their number.
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

// Reads the checked boxes of a group filled by remplirCheckboxFilieresConcernees.
function getFilieresConcerneesCochees(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return [];
    return Array.from(el.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value);
}

// ===================================
// ETAT LOCAL EN MEMOIRE
// Filled automatically and continuously by the Firestore listeners (onSnapshot).
// Toutes les fonctions d'affichage lisent depuis cet "state" ; il est toujours
// up to date because Firestore pushes every change in real time to every client.
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

// Contact currently open in the messaging panel (email), local memory only.
let contactChatActif = null;

// ---- SEED (demo data on the very first launch of the Firebase project) ----

async function seedDonneesInitialesSiNecessaire() {
    const metaRef = db.collection('_meta').doc('init');
    const metaSnap = await metaRef.get();
    if (metaSnap.exists) return; // already initialised, leave everything untouched

    const batch = db.batch();

    const coursInitiaux = [
        { titre: "Introduction to Software Engineering", date: "2026-08-25T14:00", filiere: "ict", salle: 1, lien: lienSalle("ict", 1), en_live: false },
        { titre: "Algorithms and Data Structures", date: "2026-08-26T10:00", filiere: "ict", salle: 1, lien: lienSalle("ict", 1), en_live: false },
        { titre: "Principles of Educational Psychology", date: "2026-08-27T09:00", filiere: "psych_counsel", salle: 1, lien: lienSalle("psych_counsel", 1), en_live: false },
        { titre: "Financial Accounting Fundamentals", date: "2026-08-27T14:00", filiere: "acct_fin", salle: 1, lien: lienSalle("acct_fin", 1), en_live: false },
        { titre: "Introduction to Journalism", date: "2026-08-28T09:00", filiere: "journ_media", salle: 1, lien: lienSalle("journ_media", 1), en_live: false }
    ];
    coursInitiaux.forEach(c => batch.set(db.collection('cours').doc(), c));

    const devoirsInitiaux = [
        { titre: "Assignment 1 - Requirements Analysis", desc: "Write the requirements document for the case study provided", filiere: "ict" },
        { titre: "Problem Set 1 - Algorithmic Complexity", desc: "Complete exercises 1 to 5, page 12", filiere: "ict" },
        { titre: "Case Study - Learning Theories", desc: "Submit your written analysis", filiere: "psych_counsel" },
        { titre: "Exercise - Reading a Financial Statement", desc: "Analyse the documents provided in class", filiere: "acct_fin" },
        { titre: "Project - News Story Pitch", desc: "Draft a pitch for a news story of your choice", filiere: "journ_media" }
    ];
    devoirsInitiaux.forEach(d => batch.set(db.collection('devoirs').doc(), d));

    const usersInitiaux = [
        { email: "admin@uew-ecampus.edu.gh", password: "UEW2026#Admin", role: "admin" },
        { email: "exams@uew-ecampus.edu.gh", password: "UEW2026#Exams", role: "exams" },
        { email: "lecturer.ict@uew-ecampus.edu.gh", password: "UEW2026#LectICT", role: "lecturer", filiere: "ict" },
        { email: "lecturer.acctfin@uew-ecampus.edu.gh", password: "UEW2026#LectAF", role: "lecturer", filiere: "acct_fin" },
        { email: "lecturer.journmedia@uew-ecampus.edu.gh", password: "UEW2026#LectJM", role: "lecturer", filiere: "journ_media" },
        { email: "student.ict@uew-ecampus.edu.gh", password: "UEW2026#StuICT", role: "student", filiere: "ict", niveau: 1, nom: "Owusu", prenom: "Ama", matricule: "UEW-2026-0001" },
        { email: "student.acctfin@uew-ecampus.edu.gh", password: "UEW2026#StuAF", role: "student", filiere: "acct_fin", niveau: 1, nom: "Mensah", prenom: "Kofi", matricule: "UEW-2026-0002" }
    ];
    usersInitiaux.forEach(u => batch.set(db.collection('users').doc(), u));

    batch.set(metaRef, { seeded: true, date: new Date().toISOString() });

    await batch.commit();
}

// ---- REAL-TIME LISTENING ----
// This is the heart of the system: as soon as a "cours" document changes in
// Firestore (e.g. a lecturer flips en_live to true), Firestore INSTANTLY
// notifies every connected browser (lecturer, students, admin) with no
// reload needed.

function demarrerEcouteTempsReel() {
    db.collection('cours').onSnapshot((snap) => {
        const ancienCours = state.COURS;
        state.COURS = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (etatInitialCoursCharge) {
            notifierNouveauxLivePourEtudiant(ancienCours, state.COURS);
        }
        etatInitialCoursCharge = true;

        rafraichirVuesLieesAuxCours();
    }, (err) => console.error("Firestore listening error (cours):", err));

    db.collection('devoirs').onSnapshot((snap) => {
        state.DEVOIRS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        rafraichirVuesLieesAuxDevoirs();
    }, (err) => console.error("Firestore listening error (devoirs):", err));

    db.collection('supports').onSnapshot((snap) => {
        state.SUPPORTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        afficherSupportsProf();
        afficherSupportsEtudiant();
    }, (err) => console.error("Firestore listening error (supports):", err));

    // Submissions (files + marks) are sensitive: a student must NEVER
    // receive other students' submissions/marks in their browser, and a
    // lecturer must only see those of their own department. The query
    // itself is therefore restricted (not just the display). Only the
    // admin needs to see everything (for the cross-department Excel
    // export of marks).
    if (currentUser.role === 'student') {
        db.collection('depots').where('etudiant', '==', currentUser.email).onSnapshot((snap) => {
            state.DEPOTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherDevoirsEtudiant();
        }, (err) => console.error("Firestore listening error (depots):", err));
    } else if (currentUser.role === 'lecturer') {
        db.collection('depots').where('filiere', '==', currentUser.filiere).onSnapshot((snap) => {
            state.DEPOTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherDepotsProf();
            afficherDevoirsEtudiant();
        }, (err) => console.error("Firestore listening error (depots):", err));
    } else {
        // Admin: full access, needed for the export of marks by class/course unit
        db.collection('depots').onSnapshot((snap) => {
            state.DEPOTS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherDepotsProf();
            afficherDevoirsEtudiant();
        }, (err) => console.error("Firestore listening error (depots):", err));
    }

    db.collection('users').onSnapshot((snap) => {
        state.USERS = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        afficherUsers();
        afficherStats();
        afficherClasseEtudiant();
        afficherCoursProf();
        afficherMatieresAdmin(); // the list of assignable lecturers depends on state.USERS
        afficherContactsChat(); // the messaging contacts list depends on state.USERS
    }, (err) => console.error("Firestore listening error (users):", err));

    // ---- COURSE UNITS ----
    // Created by the admin for a given level (and department), then assigned
    // to a lecturer of that department. Serves as the reference for "who
    // teaches what"; also used to pre-fill the course-scheduling form on
    // the lecturer side.
    db.collection('matieres').onSnapshot((snap) => {
        state.MATIERES = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        afficherMatieresAdmin();
        afficherMatieresProf();
        remplirSelectMatieresAdmin();
        afficherStats();
        rafraichirVuesLieesAuxCours(); // assigning a course unit can change who manages which course
        afficherSupportsProf(); // same for the course materials visible/managed by the lecturer
    }, (err) => console.error("Firestore listening error (matieres):", err));

    // ---- ONLINE REGISTRATION ----
    // Applications submitted by candidates from the public page
    // registration.html. Personal/biodata data: only the admin accesses it
    // (neither lecturers nor students listen to this collection).
    if (currentUser.role === 'admin') {
        db.collection('inscriptions').onSnapshot((snap) => {
            state.INSCRIPTIONS = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a, b) => new Date(b.dateDemande || 0) - new Date(a.dateDemande || 0));
            afficherInscriptionsAdmin();
            afficherStats();
        }, (err) => console.error("Firestore listening error (inscriptions):", err));
    }

    // ---- MARKS (per course unit, entered/imported by the Exams Office) ----
    // A student must see ONLY their own marks: the query itself is
    // restricted to their email (same logic as for submissions). The Exams
    // Office and the administration need to see everything (to pick any
    // department/level/course unit to grade, or for the global export of
    // transcripts).
    if (currentUser.role === 'student') {
        db.collection('notes').where('etudiant', '==', currentUser.email).onSnapshot((snap) => {
            state.NOTES = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherNotesEtudiant();
        }, (err) => console.error("Firestore listening error (notes):", err));
    } else if (currentUser.role === 'exams' || currentUser.role === 'admin') {
        db.collection('notes').onSnapshot((snap) => {
            state.NOTES = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            afficherFormulaireNotesExamen();
        }, (err) => console.error("Firestore listening error (notes):", err));
    }

    // Students' attendance time in courses (for the timer and lecturer
    // follow-up). See "ATTENDANCE TRACKING" further below.
    db.collection('presences').onSnapshot((snap) => {
        state.PRESENCES = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        afficherClasseEtudiant();
        afficherCoursProf();
    }, (err) => console.error("Firestore listening error (presences):", err));

    // ---- INSTANT MESSAGING (Lecturer <-> Student, Lecturer <-> Admin) ----
    // Only the page that has the messaging panel listens to this
    // collection. Only messages where the logged-in user is a participant
    // are fetched (the "participants" field = array of the 2 emails in the
    // conversation), never other people's conversations.
    if (document.getElementById('chatContacts')) {
        db.collection('messages').where('participants', 'array-contains', currentUser.email).onSnapshot((snap) => {
            const nouveauxIds = new Set(
                snap.docChanges().filter(c => c.type === 'added').map(c => c.doc.id)
            );
            const messagesPrecedents = state.MESSAGES;
            state.MESSAGES = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => new Date(a.date) - new Date(b.date));

            // Only play the sound/notification for a TRULY new incoming
            // message (not on first load, not for my own messages).
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
        }, (err) => console.error("Firestore listening error (messages):", err));
    }
}

function rafraichirVuesLieesAuxCours() {
    afficherCoursProf();
    afficherCoursEtudiant();
    afficherProchainsCours();
    afficherCoursAdmin();
    afficherStats();
    synchroniserPresenceEtudiant();
    remplirSelectCours('supportCours'); // fixes the empty select if courses arrive after the first render
}

function rafraichirVuesLieesAuxDevoirs() {
    afficherDevoirsAdmin();
    afficherDevoirsEtudiant();
    afficherStats();
    remplirSelectDevoir('depotDevoir');
}

// ---- SESSION (stays local to the browser, by design: it's just "who is logged in here") ----

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

// A "public" page (data-public="true" attribute on <body>) is accessible
// WITHOUT being logged in: this is the case for the online registration
// portal, meant for candidates who obviously don't have an account yet.
// These pages start no real-time listener and only access the
// "inscriptions" collection.
function estPagePublique() {
    return document.body && document.body.dataset.public === 'true';
}

(function guardPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const hasLoginForm = !!document.getElementById('loginForm');

    if (estPagePublique()) return; // registration portal: no redirect

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

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// ===================================
// TAB NAVIGATION (Home / Dashboard / My Courses)
// Purely a display concern: each page splits its content into 3 blocks
// <section class="tab-page" data-tab="...">, only one visible at a time.
// No element is removed from the DOM (just hidden): every Firestore
// listener and every form keeps working normally even in a currently
// hidden tab.
// ===================================
function activerOnglet(nomOnglet) {
    document.querySelectorAll('.topnav-tab').forEach(t => t.classList.toggle('actif', t.dataset.tab === nomOnglet));
    document.querySelectorAll('.sidebar-nav-tab').forEach(t => t.classList.toggle('actif', t.dataset.tab === nomOnglet));
    document.querySelectorAll('.tab-page').forEach(p => p.classList.toggle('actif', p.dataset.tab === nomOnglet));
    try { localStorage.setItem('ongletActif_' + currentUser.role, nomOnglet); } catch (err) { /* storage unavailable, no big deal */ }
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================
// LIVE NOTIFICATIONS (student)
// Only notifies students of the department concerned by the course that started.
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
        const notif = new Notification('Course is Live!', {
            body: `${cours.titre} has just started in ${nomSalle(cours.filiere, cours.salle)}. Join now.`
        });
        notif.onclick = () => {
            window.focus();
            const cible = document.getElementById(`live-cours-${cours.id}`);
            if (cible) cible.scrollIntoView({ behavior: 'smooth' });
        };
    }
}

// Only concerns students (a page with #listeCours) and only their own department + level
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
// ATTENDANCE TRACKING (per-student timer)
// While a course in their department is Live, the student's browser
// regularly records the elapsed time in Firestore (the "presences"
// collection). This lets:
//  - the lecturer see how many minutes each student spent in THEIR
//    course (afficherCoursProf);
//  - classmates see a live timer next to each name
//    (afficherClasseEtudiant).
// ===================================

// coursId -> { debut: Date, dernierFlush: Date }  (local memory only)
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

// Saves the time elapsed since the last "flush" to Firestore.
// resterEnLigne=false when the course is no longer Live or the page is closing.
function flushPresence(coursId, resterEnLigne) {
    const session = presencesEnCours[coursId];
    if (!session) return;
    const maintenant = new Date();
    const minutesEcoulees = (maintenant - session.dernierFlush) / 60000;
    session.dernierFlush = maintenant;
    majPresenceFirestore(coursId, resterEnLigne, minutesEcoulees);
}

// Called on every change to the course list: starts/stops tracking
// depending on which courses are currently Live for the student's department.
function synchroniserPresenceEtudiant() {
    if (!currentUser || currentUser.role !== 'student') return;
    if (!document.getElementById('listeCours')) return; // student page only
    if (!currentUser.niveau) return; // no known level = no relevant course

    const coursLiveConcernes = state.COURS.filter(c => c.en_live && coursConcerneEtudiant(c, currentUser));
    const idsLive = new Set(coursLiveConcernes.map(c => c.id));

    coursLiveConcernes.forEach(c => {
        if (!presencesEnCours[c.id]) {
            const maintenant = new Date();
            presencesEnCours[c.id] = { debut: maintenant, dernierFlush: maintenant };
            majPresenceFirestore(c.id, true, 0); // creates/reactivates the attendance document
        }
    });

    Object.keys(presencesEnCours).forEach(coursId => {
        if (!idsLive.has(coursId)) {
            flushPresence(coursId, false);
            delete presencesEnCours[coursId];
        }
    });
}

// Periodic save (every 30s) so lecturers/classmates see an up-to-date
// time even if the student stays connected for a long while.
setInterval(() => {
    Object.keys(presencesEnCours).forEach(coursId => flushPresence(coursId, true));
}, 30000);

// Best-effort save when the page/tab is closed.
window.addEventListener('beforeunload', () => {
    Object.keys(presencesEnCours).forEach(coursId => flushPresence(coursId, false));
});

// Visual refresh of the timer every second (the Firestore data itself
// only changes every 30s or so).
setInterval(() => {
    afficherClasseEtudiant();
    afficherCoursProf();
}, 1000);

// Computes the total time (in seconds) represented by an attendance document,
// adding the current session's time if the student is currently online.
function calculerSecondesPresence(p) {
    let secondes = (p.minutesTotal || 0) * 60;
    if (p.enLigne && p.sessionDebut) {
        secondes += (Date.now() - new Date(p.sessionDebut).getTime()) / 1000;
    }
    return Math.max(0, Math.round(secondes));
}

// Formats a number of seconds as "1h 05min" or "05:23" (timer style).
function formatDuree(secondesTotales) {
    const s = Math.floor(secondesTotales);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ===================================
// MARKS EXPORT TO EXCEL (admin)
// One file per class (department + level): one row per student
// (last name, first name), one column per assignment/course unit with its mark.
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

    // Two distinct sources of marks, both exported:
    // - assignments graded directly by a lecturer (via a submitted file);
    // - course-unit marks entered/imported by the Exams Office.
    const devoirsClasse = state.DEVOIRS.filter(d => d.filiere === filiere);
    const matieresClasse = state.MATIERES.filter(m => m.filiere === filiere && Number(m.niveau) === Number(niveau));

    if (typeof XLSX === 'undefined') {
        alert("The Excel export library could not load (check your internet connection) and try again.");
        return;
    }

    const entetes = ["Student ID", "Last Name", "First Name", "Email", ...devoirsClasse.map(d => d.titre), ...matieresClasse.map(m => `${m.nom} (Exams Office)`)];
    const lignes = etudiantsClasse.map(u => {
        const ligne = [u.matricule || '', u.nom || '(not provided)', u.prenom || '', u.email];
        devoirsClasse.forEach(d => {
            const depot = state.DEPOTS.find(dep => dep.devoirId === d.id && dep.etudiant === u.email);
            ligne.push(depot && depot.note !== '' && depot.note != null ? Number(depot.note) : '');
        });
        matieresClasse.forEach(m => {
            const noteDoc = state.NOTES.find(n => n.matiereId === m.id && n.etudiantId === u.id);
            ligne.push(noteDoc && noteDoc.note != null ? Number(noteDoc.note) : '');
        });
        return ligne;
    });

    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...lignes]);
    feuille['!cols'] = entetes.map((_, i) => ({ wch: i < 4 ? 18 : 22 }));

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Marks");

    const nomClasse = `${getNomFiliere(filiere)}_${getNomNiveau(niveau)}`.replace(/[\/\\?%*:|"<>\s]/g, '-');
    XLSX.writeFile(classeur, `Marks_${nomClasse}.xlsx`);
}

// ===================================
// MARKS FUNCTIONS — Exams Office
// -----------------------------------
// The Exams Office chooses a department, a level, then a course unit (every
// course unit of that class, regardless of which lecturer it is assigned
// to: the Exams Office is not attached to a department, it operates across
// the whole institution). It can then enter marks one by one, or upload a
// filled-in Excel file in bulk. Each mark is stored in a document whose ID
// combines the course unit and the student (see idNote()), which prevents
// any duplicate on re-entry or re-import.
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
        matiereSelect.innerHTML = '<option value="">-- Choose the department and level --</option>';
        document.getElementById('zoneSaisieNotesExamen').innerHTML = '';
        return;
    }

    const matieresClasse = state.MATIERES.filter(m => m.filiere === filiere && Number(m.niveau) === Number(niveau));
    matiereSelect.innerHTML = '<option value="">-- Choose a course unit --</option>' +
        matieresClasse.map(m => `<option value="${m.id}">${escapeHtml(m.nom)}${m.profEmail ? ' (' + escapeHtml(m.profEmail) + ')' : ' (not assigned)'}</option>`).join('');

    const zone = document.getElementById('zoneSaisieNotesExamen');
    if (matieresClasse.length === 0) {
        zone.innerHTML = "<p>No course unit has been created yet by the administration for this department and level.</p>";
        return;
    }

    // Stays on the same course unit if it still exists in the new list
    // (e.g. the class refreshes but the admin hasn't changed the
    // selection), otherwise starts back from an empty selection.
    if (valeurActuelle && matieresClasse.some(m => m.id === valeurActuelle)) {
        matiereSelect.value = valeurActuelle;
        afficherFormulaireNotesExamen();
    } else {
        zone.innerHTML = '';
    }
}

// Redisplays the entry table for the currently selected course unit
// (called on every selection change AND on every real-time update of
// state.NOTES/state.USERS, so a colleague's entry or a freshly imported
// mark appears immediately).
function afficherFormulaireNotesExamen() {
    const matiereSelect = document.getElementById('examenMatiere');
    const zone = document.getElementById('zoneSaisieNotesExamen');
    if (!matiereSelect || !zone) return;

    const matiereId = matiereSelect.value;
    if (!matiereId) return;

    const matiere = state.MATIERES.find(m => m.id === matiereId);
    if (!matiere) {
        zone.innerHTML = '<p>Course unit not found (it may have been deleted).</p>';
        return;
    }

    const etudiantsClasse = state.USERS
        .filter(u => u.role === 'student' && u.filiere === matiere.filiere && Number(u.niveau) === Number(matiere.niveau))
        .sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email));

    if (etudiantsClasse.length === 0) {
        zone.innerHTML = `<p>No student enrolled yet in ${getNomFiliere(matiere.filiere)} - ${getNomNiveau(matiere.niveau)}.</p>`;
        return;
    }

    zone.innerHTML = `
        <div class="card">
            <p><b>Quick import from an Excel file</b><br>
            Download the template (already pre-filled with this class's current list and marks
            for this course unit), complete/correct the "Mark" column, then upload it here.</p>
            <button type="button" onclick="telechargerModeleNotesExamen('${matiereId}')" class="btn-secondary">Download template (.xlsx)</button>
            <input type="file" id="fichierNotesExamen" accept=".xlsx,.xls,.csv">
            <button type="button" onclick="analyserFichierNotesExamen('${matiereId}')">Analyse file</button>
            <div id="apercuNotesImport"></div>
        </div>
        <table class="notes-table">
            <thead><tr><th>Student ID</th><th>Student</th><th>Mark / 20</th><th>Grade</th><th></th></tr></thead>
            <tbody>
            ${etudiantsClasse.map(u => {
                const noteDoc = state.NOTES.find(n => n.matiereId === matiereId && n.etudiantId === u.id);
                const valeur = noteDoc && noteDoc.note !== '' && noteDoc.note != null ? noteDoc.note : '';
                const mention = getMention(valeur);
                const cle = idNote(matiereId, u.id);
                return `<tr>
                    <td>${escapeHtml(u.matricule || '—')}</td>
                    <td>${escapeHtml(nomAffiche(u))}</td>
                    <td><input type="number" min="0" max="20" step="0.25" id="noteInput_${cle}" value="${valeur}" oninput="previsualiserMentionExamen('${cle}', this.value)"></td>
                    <td><span class="mention-badge ${mention.classe}" id="noteMention_${cle}">${mention.texte}</span></td>
                    <td><button type="button" onclick="enregistrerNoteExamen('${matiereId}', '${u.id}', '${escapeHtml(u.email)}')">Save</button></td>
                </tr>`;
            }).join('')}
            </tbody>
        </table>`;
}

// Updates the "Grade" badge live while typing, without waiting for the
// save (just a local visual preview).
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
        alert("Please enter a mark before saving.");
        return;
    }
    const valeur = Number(brut);
    if (Number.isNaN(valeur) || valeur < 0 || valeur > 20) {
        alert("The mark must be a number between 0 and 20.");
        return;
    }
    const matiere = state.MATIERES.find(m => m.id === matiereId);
    const etudiant = state.USERS.find(u => u.id === etudiantId);
    try {
        await db.collection('notes').doc(idNote(matiereId, etudiantId)).set({
            matiereId,
            matiereNom: matiere ? matiere.nom : '',
            filiere: matiere ? matiere.filiere : null,
            niveau: matiere ? matiere.niveau : null,
            etudiantId,
            etudiant: etudiantEmail,
            matricule: etudiant ? etudiant.matricule || '' : '',
            note: valeur,
            saisiPar: currentUser.email,
            dateMaj: new Date().toISOString()
        }, { merge: true });
    } catch (err) {
        console.error(err);
        alert("Could not save this mark.");
    }
}

function telechargerModeleNotesExamen(matiereId) {
    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not load (check your internet connection) and try again.");
        return;
    }
    const matiere = state.MATIERES.find(m => m.id === matiereId);
    if (!matiere) return;

    const etudiantsClasse = state.USERS
        .filter(u => u.role === 'student' && u.filiere === matiere.filiere && Number(u.niveau) === Number(matiere.niveau))
        .sort((a, b) => (a.nom || a.email).localeCompare(b.nom || b.email));

    const entetes = ['Student ID', 'Last Name', 'First Name', 'Mark'];
    const lignes = etudiantsClasse.map(u => {
        const noteDoc = state.NOTES.find(n => n.matiereId === matiereId && n.etudiantId === u.id);
        return [u.matricule || '', u.nom || '', u.prenom || '', noteDoc && noteDoc.note != null ? noteDoc.note : ''];
    });

    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...lignes]);
    feuille['!cols'] = entetes.map(() => ({ wch: 20 }));

    const feuilleInfos = XLSX.utils.aoa_to_sheet([
        ['Course unit', matiere.nom],
        ['Department', getNomFiliere(matiere.filiere)],
        ['Level', getNomNiveau(matiere.niveau)],
        [],
        ['Do not change the "Student ID" column or the row order: it is the'],
        ['student ID that identifies the student on re-import, not the row.'],
        ['The "Mark" column must be a number between 0 and 20 (blank = no mark).']
    ]);

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Marks");
    XLSX.utils.book_append_sheet(classeur, feuilleInfos, "Info");

    const nomFichier = `Marks_Template_${matiere.nom}_${getNomFiliere(matiere.filiere)}_${getNomNiveau(matiere.niveau)}`.replace(/[\/\\?%*:|"<>\s]/g, '-');
    XLSX.writeFile(classeur, `${nomFichier}.xlsx`);
}

let notesDetecteesImport = [];

async function analyserFichierNotesExamen(matiereId) {
    const input = document.getElementById('fichierNotesExamen');
    const apercu = document.getElementById('apercuNotesImport');
    const matiere = state.MATIERES.find(m => m.id === matiereId);

    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not load (check your internet connection) and try again.");
        return;
    }
    if (!matiere) {
        apercu.innerHTML = "<p>Course unit not found.</p>";
        return;
    }
    if (!input.files || !input.files[0]) {
        alert("Choose an Excel (.xlsx) or CSV file to analyse.");
        return;
    }

    apercu.innerHTML = '<p>Reading the file...</p>';

    try {
        const buffer = await input.files[0].arrayBuffer();
        const classeur = XLSX.read(buffer, { type: 'array' });
        const premiereFeuille = classeur.Sheets[classeur.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(premiereFeuille, { defval: '' });

        if (lignes.length === 0) {
            apercu.innerHTML = "<p>The file contains no usable row. Use the template provided.</p>";
            return;
        }

        const lireColonne = (ligne, nomAttendu) => {
            const clef = Object.keys(ligne).find(k => normaliserEntete(k) === nomAttendu);
            return clef !== undefined ? String(ligne[clef]).trim() : '';
        };

        const etudiantsClasse = state.USERS.filter(u => u.role === 'student' && u.filiere === matiere.filiere && Number(u.niveau) === Number(matiere.niveau));
        const parMatricule = new Map(etudiantsClasse.filter(u => u.matricule).map(u => [u.matricule.toLowerCase(), u]));

        notesDetecteesImport = lignes.map((ligne, index) => {
            const matricule = lireColonne(ligne, 'matricule');
            const noteBrute = lireColonne(ligne, 'note');
            const erreurs = [];

            if (!matricule) erreurs.push("missing student ID");
            const etudiant = matricule ? parMatricule.get(matricule.toLowerCase()) : null;
            if (matricule && !etudiant) erreurs.push("student ID not found in this class");

            let note = null;
            if (noteBrute !== '') {
                note = Number(noteBrute);
                if (Number.isNaN(note) || note < 0 || note > 20) erreurs.push("invalid mark (0 to 20)");
            } else {
                erreurs.push("empty mark");
            }

            return { ligneNum: index + 2, matricule, etudiant, note, erreurs };
        });

        const nbValides = notesDetecteesImport.filter(n => n.erreurs.length === 0).length;

        apercu.innerHTML = `
            <p>${notesDetecteesImport.length} row(s) read, including <b>${nbValides} valid</b>. Rows with errors are greyed out: fix them in the file then re-analyse if needed.</p>
            <div class="checkbox-group">
                ${notesDetecteesImport.map((n, i) => {
                    const ok = n.erreurs.length === 0;
                    const details = ok
                        ? `${escapeHtml(nomAffiche(n.etudiant))} (${escapeHtml(n.matricule)}) — Mark: ${n.note}/20 (${getMention(n.note).texte})`
                        : `Row ${n.ligneNum} (${n.matricule || 'missing student ID'}): ${n.erreurs.join(', ')}`;
                    return `<label><input type="checkbox" id="noteImport_${i}" ${ok ? 'checked' : 'disabled'}> ${details}</label>`;
                }).join('')}
            </div>
            <button type="button" onclick="importerNotesSelectionneesExamen('${matiereId}')" class="btn-success" ${nbValides === 0 ? 'disabled' : ''}>Save checked marks (${nbValides})</button>
        `;
    } catch (err) {
        console.error(err);
        apercu.innerHTML = "<p>Could not read this file. Check that it is indeed an Excel (.xlsx) or CSV file, preferably generated from the template.</p>";
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
        alert("No valid checked mark to save.");
        return;
    }

    apercu.innerHTML = `<p>Saving in progress (0 / ${aEnregistrer.length})...</p>`;

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
            apercu.innerHTML = `<p>Saving in progress (${faites} / ${aEnregistrer.length})...</p>`;
        }

        apercu.innerHTML = `<p class="success">${aEnregistrer.length} mark(s) saved successfully.</p>`;
        notesDetecteesImport = [];
        const fichierInput = document.getElementById('fichierNotesExamen');
        if (fichierInput) fichierInput.value = '';
    } catch (err) {
        console.error(err);
        alert("Could not save some of the marks.");
    }
}

// ================= MARKS FUNCTIONS (student) =================
// The student sees ONLY their own marks (the Firestore query itself is
// already restricted to their email, see demarrerEcouteTempsReel).
function afficherNotesEtudiant() {
    const el = document.getElementById('listeNotesEtudiant');
    if (!el) return;
    const mesNotes = [...state.NOTES].sort((a, b) => (a.matiereNom || '').localeCompare(b.matiereNom || ''));
    el.innerHTML = mesNotes.map(n => {
        const mention = getMention(n.note);
        return `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(n.matiereNom)}</h4>
            <p>Mark: <b>${n.note}/20</b> — <span class="mention-badge ${mention.classe}">${mention.texte}</span></p></div>`;
    }).join('') || '<p>No mark available yet.</p>';

    // The download button only makes sense if there is at least one mark
    // to put in the transcript (otherwise an empty file would be generated).
    const btn = document.getElementById('btnTelechargerMesNotes');
    if (btn) btn.style.display = mesNotes.length > 0 ? 'inline-block' : 'none';
}

// Generates and downloads, on the student's browser, an Excel (.xlsx)
// transcript listing THEIR marks (and only theirs: state.NOTES is already
// filtered by the Firestore query on their own email). Lets the student
// keep/print a record, in addition to simply viewing it on screen.
function exporterMesNotesExcel() {
    if (typeof XLSX === 'undefined') {
        alert("The Excel export library could not load (check your internet connection) and try again.");
        return;
    }
    if (!currentUser) return;

    const mesNotes = [...state.NOTES].sort((a, b) => (a.matiereNom || '').localeCompare(b.matiereNom || ''));
    if (mesNotes.length === 0) {
        alert("No mark available yet.");
        return;
    }

    const entetesIdentite = [
        ['Last Name', currentUser.nom || ''],
        ['First Name', currentUser.prenom || ''],
        ['Student ID', currentUser.matricule || ''],
        ['Department', getNomFiliere(currentUser.filiere)],
        ['Level', getNomNiveau(currentUser.niveau)],
        []
    ];
    const entetesNotes = ['Course Unit', 'Mark / 20', 'Grade'];
    const lignesNotes = mesNotes.map(n => [n.matiereNom || '', n.note, getMention(n.note).texte]);

    const feuille = XLSX.utils.aoa_to_sheet([...entetesIdentite, entetesNotes, ...lignesNotes]);
    feuille['!cols'] = [{ wch: 32 }, { wch: 14 }, { wch: 16 }];

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "My Transcript");

    const nomFichier = `Transcript_${currentUser.nom || currentUser.email}_${currentUser.prenom || ''}`.replace(/[\/\\?%*:|"<>\s]/g, '-');
    XLSX.writeFile(classeur, `${nomFichier}.xlsx`);
}

// ===================================
// EXPORT OF THE LIST OF ENROLLED STUDENTS (admin)
// -----------------------------------
// Unlike exporterNotesExcel() (which requires a specific class to produce a
// transcript), here the department and level are optional: leaving
// "All/All" produces the complete list of enrolled students, or a single
// one of the two criteria can be applied (e.g. all levels of a department,
// or a given level across all departments).
// The file contains a "Students" sheet (full nominal list) and a "Summary"
// sheet (headcount by department + level), useful for reporting/data uses.
// ===================================
function exporterListeEtudiants() {
    if (typeof XLSX === 'undefined') {
        alert("The Excel export library could not load (check your internet connection) and try again.");
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
        alert("No enrolled student matches these criteria.");
        return;
    }

    // ---- Sheet 1: full nominal list ----
    const entetes = [
        "Student ID", "Last Name", "First Name", "Department", "Level",
        "Email (login)", "Personal Email", "Phone",
        "Gender", "Date of Birth", "Place of Birth", "Nationality",
        "Application Reference No."
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

    // ---- Sheet 2: summary (headcount by department + level) ----
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
    const nomFichier = `Students_List_${partieFiliere}_${partieNiveau}`.replace(/[\/\\?%*:|"<>\s]/g, '-');
    XLSX.writeFile(classeur, `${nomFichier}.xlsx`);
}

// ===================================
// ONLINE REGISTRATION PLATFORM
// -----------------------------------
// A candidate (who does not yet have an account) submits their application
// from the public page registration.html: biodata (last name, first name,
// date and place of birth, gender, nationality, ID document number if any),
// contact details and desired programme (department + level).
// The application lands in the Firestore "inscriptions" collection with the
// status "en_attente" (pending). The administrator processes it from their
// space:
//   - Approve -> automatically creates the student account (login email,
//                temporary password and student ID generated);
//   - Reject  -> records a reason, viewable by the candidate.
// The candidate tracks their application with their reference number + date
// of birth (double check: the reference number alone is not enough to view
// biodata).
// ===================================

const STATUTS_INSCRIPTION = {
    en_attente: "Pending review",
    validee: "Approved — account created",
    refusee: "Rejected"
};

const GENRES = {
    M: "Male",
    F: "Female",
    autre: "Other / prefer not to say"
};

const TYPES_PIECE = {
    cni: "National ID Card",
    passeport: "Passport",
    carte_consulaire: "Consular Card",
    extrait_naissance: "Birth Certificate",
    autre: "Other document"
};

// Readable, unique application reference number: UEW-APP-2026-4F7K2P
// (the year makes filing easier, the random suffix prevents guessing
// another candidate's number and therefore viewing their biodata).
function genererNumeroDossier() {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let suffixe = '';
    for (let i = 0; i < 6; i++) suffixe += caracteres[Math.floor(Math.random() * caracteres.length)];
    return `UEW-APP-${new Date().getFullYear()}-${suffixe}`;
}

// Normalises a last/first name to build an email identifier
// ("Kofi N'Danso" -> "kofindanso").
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

// ---- Registration period (opening/closing decided by the admin) ----
// Stored in the Firestore document "_config/inscriptions": { dateDebut,
// dateFin } (two dates in "YYYY-MM-DD" format, both bounds inclusive). An
// empty date = no bound on that side (open indefinitely in that
// direction). This document is read directly (get), never via a query, so
// it stays accessible to a logged-out visitor without exposing any
// application.
const MESSAGE_INSCRIPTION_FERMEE = "Sorry, we are unable to process your request! Please contact the administration for the reopening of registration.";

async function chargerPeriodeInscription() {
    try {
        const snap = await db.collection('_config').doc('inscriptions').get();
        return snap.exists ? snap.data() : { dateDebut: '', dateFin: '' };
    } catch (err) {
        console.error("Error reading the registration period:", err);
        return { dateDebut: '', dateFin: '' };
    }
}

// Compares "YYYY-MM-DD" dates at day resolution (the time of day doesn't
// matter): the end date's own day remains included.
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
        bornes = `Open from ${formaterDateFr(periode.dateDebut)} to ${formaterDateFr(periode.dateFin)}.`;
    } else if (periode.dateDebut) {
        bornes = `Open from ${formaterDateFr(periode.dateDebut)}.`;
    } else if (periode.dateFin) {
        bornes = `Open until ${formaterDateFr(periode.dateFin)}.`;
    }

    if (ouverte) {
        zone.innerHTML = bornes ? `<p class="success">Registration is open. ${escapeHtml(bornes)}</p>` : '';
        if (form) form.style.display = '';
    } else {
        zone.innerHTML = `<div class="card"><p class="warning">${escapeHtml(MESSAGE_INSCRIPTION_FERMEE)}</p>${bornes ? `<p><small>${escapeHtml(bornes)}</small></p>` : ''}</div>`;
        if (form) form.style.display = 'none';
    }
}

// ---- Public page: submitting the application + tracking ----

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

    // Double-check of the period (the form is already hidden if it is
    // closed, but a page left open in a tab must not be able to bypass a
    // closure the admin decided on in the meantime).
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
        niveau: val('insNiveau') ? parseInt(val('insNiveau'), 10) : null
    };

    // Required fields (the ID document number stays optional: many
    // candidates don't have one yet when submitting their application).
    const manquants = [];
    if (!dossier.nom) manquants.push('last name');
    if (!dossier.prenom) manquants.push('first name');
    if (!dossier.dateNaissance) manquants.push('date of birth');
    if (!dossier.lieuNaissance) manquants.push('place of birth');
    if (!dossier.genre) manquants.push('gender');
    if (!dossier.nationalite) manquants.push('nationality');
    if (!dossier.email) manquants.push('email');
    if (!dossier.telephone) manquants.push('phone number');
    if (!dossier.filiere) manquants.push('desired department');
    if (!dossier.niveau) manquants.push('desired level');
    if (manquants.length) {
        zoneErreur.innerText = `Please fill in: ${manquants.join(', ')}.`;
        return;
    }

    // Consistency check on the date of birth (not in the future, and
    // candidate at least 14 years old: catches year typos).
    const naissance = new Date(dossier.dateNaissance);
    const aujourdhui = new Date();
    if (isNaN(naissance.getTime()) || naissance >= aujourdhui) {
        zoneErreur.innerText = "The date of birth entered is not valid.";
        return;
    }
    const age = (aujourdhui - naissance) / (365.25 * 24 * 3600 * 1000);
    if (age < 14 || age > 90) {
        zoneErreur.innerText = "Please check the date of birth: the resulting age is unusual.";
        return;
    }

    // If an ID document is declared, its type and its number go together.
    if (dossier.numeroPiece && !dossier.typePiece) {
        zoneErreur.innerText = "Please specify the type of the ID document entered.";
        return;
    }
    if (!dossier.numeroPiece) {
        dossier.typePiece = '';
    }

    if (bouton) bouton.disabled = true;
    try {
        // The application reference number serves as the Firestore document
        // ID. Important consequence for privacy: online tracking is done by
        // DIRECTLY reading one specific document (get), never by a query
        // that would scan the collection. A public page therefore has no
        // way to read other candidates' biodata.
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
                <p class="success">Your application has been successfully submitted.</p>
                <p>Your application reference number:</p>
                <p class="numero-dossier">${escapeHtml(dossier.numeroDossier)}</p>
                <p><b>Keep this reference number.</b> Together with your date of birth, it lets you
                track your application's progress below and, once approved,
                retrieve your UEW E-Campus login details.</p>
            </div>`;
        document.getElementById('inscriptionConfirmation').scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
        console.error("Error while submitting the application:", err);
        zoneErreur.innerText = "Could not submit. Check your internet connection and try again.";
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
        resultat.innerHTML = '<p class="warning">Enter your application reference number and your date of birth.</p>';
        return;
    }

    resultat.innerHTML = '<p>Searching...</p>';
    try {
        const snap = await db.collection('inscriptions').doc(numero).get();
        // The reference number alone is not enough: the date of birth must match.
        if (!snap.exists || snap.data().dateNaissance !== dateNaissance) {
            resultat.innerHTML = '<p class="warning">No application matches this reference number and date of birth.</p>';
            return;
        }

        const d = snap.data();
        let details = '';
        if (d.statut === 'validee') {
            details = `
                <p class="success">Congratulations, your registration is approved.</p>
                <p>Your UEW E-Campus login details:</p>
                <ul>
                    <li><b>Email:</b> ${escapeHtml(d.emailConnexion || '')}</li>
                    <li><b>Temporary password:</b> ${escapeHtml(d.motDePasseProvisoire || '(provided by the administration)')}</li>
                    <li><b>Student ID:</b> ${escapeHtml(d.matricule || '')}</li>
                    <li><b>Class:</b> ${escapeHtml(getNomFiliere(d.filiere))} — ${escapeHtml(getNomNiveau(d.niveau))}</li>
                </ul>
                <p><a href="index.html">Log in to UEW E-Campus</a></p>`;
        } else if (d.statut === 'refusee') {
            details = `<p class="warning">Your application was not successful.</p>
                ${d.motifRefus ? `<p><b>Reason:</b> ${escapeHtml(d.motifRefus)}</p>` : ''}
                <p>You may contact the UEW administration for more information.</p>`;
        } else {
            details = `<p class="live">Your application is being reviewed by the administration.</p>
                <p>Check back on this page regularly: your login details will
                appear here as soon as it is approved.</p>`;
        }

        resultat.innerHTML = `
            <div class="card">
                <p><b>Application ${escapeHtml(d.numeroDossier)}</b> — submitted on ${escapeHtml(new Date(d.dateDemande).toLocaleDateString('en-GB'))}</p>
                <p>${escapeHtml(d.prenom)} ${escapeHtml(d.nom)} — desired programme: ${escapeHtml(getNomFiliere(d.filiere))} (${escapeHtml(getNomNiveau(d.niveau))})</p>
                <p><b>Status:</b> ${escapeHtml(STATUTS_INSCRIPTION[d.statut] || d.statut)}</p>
                ${details}
            </div>`;
    } catch (err) {
        console.error("Error while tracking the application:", err);
        resultat.innerHTML = '<p class="warning">Search failed. Check your internet connection and try again.</p>';
    }
}

// ---- Admin area: processing applications ----

// Current filter for the application list ('' = all).
let filtreStatutInscription = 'en_attente';

function changerFiltreInscriptions(valeur) {
    filtreStatutInscription = valeur;
    afficherInscriptionsAdmin();
}

// Breaks down a "YYYY-MM-DD" date into {annee, mois, jour} (integers), used
// to write the Firestore rules for the period in a form the rules can
// compare (timestamp.date(annee, mois, jour)).
function decomposerDate(isoDate) {
    if (!isoDate) return null;
    const [annee, mois, jour] = isoDate.split('-').map(n => parseInt(n, 10));
    if (!annee || !mois || !jour) return null;
    return { annee, mois, jour };
}

// Loads the current period into the admin form, when the "Online
// Registration" tab is opened.
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
        ? '<p class="success">Registration is currently <b>open</b> to candidates.</p>'
        : `<p class="warning">Registration is currently <b>closed</b>: candidates see the message "${escapeHtml(MESSAGE_INSCRIPTION_FERMEE)}".</p>`;
}

// Saves the period chosen by the admin. The dates are optional
// independently of each other (e.g. setting only an end date for a
// registration that is already open). The {annee, mois, jour} components
// are stored alongside the displayable strings: it is on them that the
// Firestore rules rely to reject a submission outside the period
// server-side.
async function enregistrerPeriodeInscription() {
    const dateDebut = document.getElementById('periodeAdminDebut').value || '';
    const dateFin = document.getElementById('periodeAdminFin').value || '';

    if (dateDebut && dateFin && dateDebut > dateFin) {
        alert("The start date must be before or equal to the end date.");
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
        console.error("Error saving the period:", err);
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

    // Duplicate detection: a candidate may submit the same application
    // twice (form resent, reference number lost...). Applications sharing
    // last name + first name + date of birth are flagged, to avoid
    // creating two student accounts for the same person.
    const signature = (i) => `${normaliserPourEmail(i.nom)}|${normaliserPourEmail(i.prenom)}|${i.dateNaissance}`;
    const occurrences = {};
    state.INSCRIPTIONS.filter(i => i.statut !== 'refusee').forEach(i => {
        occurrences[signature(i)] = (occurrences[signature(i)] || 0) + 1;
    });

    el.innerHTML = dossiers.map(i => `
        <div class="card">
            ${occurrences[signature(i)] > 1 && i.statut !== 'refusee'
                ? '<p class="warning">Possible duplicate: another application has the same last name, first name and date of birth.</p>'
                : ''}
            <p><b>${escapeHtml(i.prenom)} ${escapeHtml(i.nom)}</b> — ${badgeStatut(i.statut)}<br>
            <small>Application ${escapeHtml(i.numeroDossier)} — submitted on ${escapeHtml(new Date(i.dateDemande).toLocaleString('en-GB'))}</small></p>
            <ul class="fiche-etat-civil">
                <li><b>Born on:</b> ${escapeHtml(formaterDateFr(i.dateNaissance))} in ${escapeHtml(i.lieuNaissance)}</li>
                <li><b>Gender:</b> ${escapeHtml(GENRES[i.genre] || i.genre)}</li>
                <li><b>Nationality:</b> ${escapeHtml(i.nationalite)}</li>
                <li><b>ID document:</b> ${i.numeroPiece ? escapeHtml((TYPES_PIECE[i.typePiece] || i.typePiece || 'Document')) + ' No. ' + escapeHtml(i.numeroPiece) : '<i>not provided</i>'}</li>
                <li><b>Contact:</b> ${escapeHtml(i.email)} — ${escapeHtml(i.telephone)}</li>
                <li><b>Desired programme:</b> ${escapeHtml(getNomFiliere(i.filiere))} — ${escapeHtml(getNomNiveau(i.niveau))}</li>
                ${i.matricule ? `<li><b>Account created:</b> ${escapeHtml(i.emailConnexion)} — Student ID ${escapeHtml(i.matricule)}</li>` : ''}
                ${i.motifRefus ? `<li><b>Rejection reason:</b> ${escapeHtml(i.motifRefus)}</li>` : ''}
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

    // The placement dropdowns are filled in after the HTML is inserted,
    // then pre-selected on the candidate's stated preference.
    dossiers.filter(i => i.statut === 'en_attente').forEach(i => {
        remplirSelectFilieres(`affFiliere-${i.id}`);
        remplirSelectNiveaux(`affNiveau-${i.id}`);
        const selF = document.getElementById(`affFiliere-${i.id}`);
        const selN = document.getElementById(`affNiveau-${i.id}`);
        if (selF && i.filiere) selF.value = i.filiere;
        if (selN && i.niveau) selN.value = String(i.niveau);
    });
}

// Generates the next available student ID of the year: UEW-2026-0042.
// Scans both existing accounts and already-approved applications (the
// account was just created, the "users" list may not yet have been
// refreshed by Firestore by the time of the next click).
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

// Institutional login email: firstname.lastname@uew-ecampus.edu.gh,
// suffixed (2, 3...) in case of a name clash.
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

    const recapitulatif = `Approve the registration of ${dossier.prenom} ${dossier.nom}?\n\n` +
        `Class: ${getNomFiliere(filiere)} — ${getNomNiveau(niveau)}\n` +
        `Login email: ${emailConnexion}\n` +
        `Temporary password: ${motDePasse}\n` +
        `Student ID: ${matricule}\n\n` +
        `The student account will be created immediately.`;
    if (!confirm(recapitulatif)) return;

    try {
        // 1. Creates the student account (same fields as a manual creation,
        //    plus the biodata from the registration application).
        await db.collection('users').add({
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
        });

        // 2. Updates the application: the candidate will see their login
        //    details in the online tracker, with no need to travel in.
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

        alert(`Account created.\n\nEmail: ${emailConnexion}\nPassword: ${motDePasse}\nStudent ID: ${matricule}\n\nThese login details are now visible to the candidate in their application tracker.`);
    } catch (err) {
        console.error("Error while approving the application:", err);
        alert("Approval failed. The account may not have been created: check the user list before trying again.");
    }
}

async function refuserInscription(id) {
    const dossier = state.INSCRIPTIONS.find(i => i.id === id);
    if (!dossier || dossier.statut !== 'en_attente') return;

    const motif = prompt(`Reason for rejecting ${dossier.prenom} ${dossier.nom}'s application (visible to the candidate):`, '');
    if (motif === null) return;
    if (!motif.trim()) {
        alert("Please provide a reason: it will be shown to the candidate.");
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
    if (!confirm("Permanently delete this application? The candidate will no longer be able to track it online.")) return;
    try {
        await db.collection('inscriptions').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Deletion failed.");
    }
}

// Excel export of every application matching the displayed filter: one row
// per candidate, with full biodata (useful for the registry office and for
// regulatory record-keeping of applications).
function exporterInscriptionsExcel() {
    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not load (check your internet connection) and try again.");
        return;
    }

    const dossiers = state.INSCRIPTIONS.filter(i => !filtreStatutInscription || i.statut === filtreStatutInscription);
    if (dossiers.length === 0) {
        alert("No application to export for this filter.");
        return;
    }

    const entetes = [
        'Reference No.', 'Status', 'Application Date', 'Last Name', 'First Name',
        'Date of Birth', 'Place of Birth', 'Gender', 'Nationality',
        'ID Document Type', 'ID Document No.', 'Contact Email', 'Phone',
        'Department', 'Level', 'Assigned Student ID', 'Login Email', 'Rejection Reason'
    ];
    const lignes = dossiers.map(i => [
        i.numeroDossier || '', STATUTS_INSCRIPTION[i.statut] || i.statut || '',
        i.dateDemande ? new Date(i.dateDemande).toLocaleString('en-GB') : '',
        i.nom || '', i.prenom || '', formaterDateFr(i.dateNaissance), i.lieuNaissance || '',
        GENRES[i.genre] || i.genre || '', i.nationalite || '',
        TYPES_PIECE[i.typePiece] || i.typePiece || '', i.numeroPiece || '',
        i.email || '', i.telephone || '',
        getNomFiliere(i.filiere), i.niveau ? getNomNiveau(i.niveau) : '',
        i.matricule || '', i.emailConnexion || '', i.motifRefus || ''
    ]);

    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...lignes]);
    feuille['!cols'] = entetes.map(() => ({ wch: 22 }));
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Applications");
    XLSX.writeFile(classeur, `UEW_Applications_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

document.addEventListener('DOMContentLoaded', async () => {
    document.querySelectorAll('.btn-logout').forEach(btn => btn.addEventListener('click', logout));

    // Waits for Firebase anonymous authentication to be ready before
    // touching Firestore (the rules require request.auth != null).
    try {
        await authReadyPromise;
    } catch (err) {
        console.error(err);
        alert("Could not connect to the server. Check your internet connection and reload the page.");
        return;
    }

    // ---------------- PUBLIC REGISTRATION PORTAL ----------------
    // No session, no real-time listener: the candidate only writes to the
    // "inscriptions" collection and only reads their own application.
    if (estPagePublique()) {
        initialiserPageInscription();
        return;
    }

    // ---------------- LOGIN ----------------
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
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
                await seedDonneesInitialesSiNecessaire();

                const snap = await db.collection('users').where('email', '==', emailValue).limit(1).get();

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
                errorEl.innerText = "Could not log in. Check your internet connection and try again.";
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
        return; // no need for a real-time listener on the login page
    }

    // From here on, the user is logged in: start the real-time listener
    demarrerEcouteTempsReel();

    // ---------------- INSTANT MESSAGING ----------------
    const formChat = document.getElementById('formChat');
    if (formChat) {
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

    // ---------------- TAB NAVIGATION (Home / Dashboard / My Courses) ----------------
    const topnav = document.querySelector('.topnav');
    if (topnav) {
        topnav.querySelectorAll('.topnav-tab').forEach(tab => {
            tab.addEventListener('click', () => activerOnglet(tab.dataset.tab));
        });

        // Reopens the tab this user last viewed in this area (otherwise
        // "Home" stays active by default, as set in the HTML).
        let ongletMemorise = null;
        try { ongletMemorise = localStorage.getItem('ongletActif_' + currentUser.role); } catch (err) { /* storage unavailable, no big deal */ }
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
                alert("Please fill in every field.");
                return;
            }

            if (state.USERS.some(u => u.email.toLowerCase() === email)) {
                alert("A user with this email already exists.");
                return;
            }

            if (newRole.value !== 'admin' && newRole.value !== 'exams' && !newFiliere.value) {
                alert("Please choose a department for this lecturer/student (otherwise they will never see any course).");
                return;
            }

            if (newRole.value === 'student' && !newNiveau.value) {
                alert("Please choose this student's level (otherwise they will never see their class list).");
                return;
            }

            if (newRole.value === 'student' && (!newNom.value.trim() || !newPrenom.value.trim())) {
                alert("Please enter this student's last name and first name (needed for the marks export).");
                return;
            }

            if (newRole.value === 'student' && !newMatricule.value.trim()) {
                alert("Please enter this student's ID number.");
                return;
            }

            if (newRole.value === 'student' && newMatricule.value.trim() &&
                state.USERS.some(u => u.role === 'student' && (u.matricule || '').toLowerCase() === newMatricule.value.trim().toLowerCase())) {
                alert("This student ID is already assigned to another student.");
                return;
            }

            const newUser = { email, password: newPassword.value, role: newRole.value };
            if (newRole.value !== 'admin' && newRole.value !== 'exams' && newFiliere.value) {
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
                alert("Could not create the user.");
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
                alert("The course title, date and department are required.");
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

            // Links the course to the chosen course unit (if the admin
            // selected one): this is what later determines WHICH lecturer
            // (the one assigned to the course unit) can start the Live
            // session for this specific course — see coursGereParProf().
            if (newMatiere && newMatiere.value) {
                const matiere = state.MATIERES.find(m => m.id === newMatiere.value);
                if (matiere) {
                    coursData.matiereId = matiere.id;
                    coursData.matiereNom = matiere.nom;
                }
            }

            // Common Core course: the concerned departments must be
            // specified (in addition to the level), so that only their
            // students receive the course.
            if (estFiliereTroncCommun(filiereId)) {
                const filieresConcernees = getFilieresConcerneesCochees('filieresConcerneesCours');
                if (filieresConcernees.length === 0) {
                    alert("For a Common Core course, please tick at least one concerned department.");
                    return;
                }
                coursData.filieresConcernees = filieresConcernees;
            }

            try {
                await db.collection('cours').add(coursData);
                e.target.reset();
                document.getElementById('filieresConcerneesWrapper').style.display = 'none';
            } catch (err) {
                console.error(err);
                alert("Could not schedule the course.");
            }
        });

        const formAddMatiere = document.getElementById('formAddMatiere');
        if (formAddMatiere) {
            formAddMatiere.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newNomMatiere = document.getElementById('newNomMatiere');
                const newFiliereMatiere = document.getElementById('newFiliereMatiere');
                const newNiveauMatiere = document.getElementById('newNiveauMatiere');

                if (!newNomMatiere.value.trim() || !newFiliereMatiere.value || !newNiveauMatiere.value) {
                    alert("The course unit's name, department and level are required.");
                    return;
                }

                try {
                    await db.collection('matieres').add({
                        nom: newNomMatiere.value.trim(),
                        filiere: newFiliereMatiere.value,
                        niveau: parseInt(newNiveauMatiere.value, 10),
                        profId: null,
                        profEmail: null
                    });
                    e.target.reset();
                } catch (err) {
                    console.error(err);
                    alert("Could not create the course unit.");
                }
            });
        }

        // ==========================================
        // Bulk import of course units from a PDF/Word file
        // (one course unit name per line in the uploaded document)
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
                alert("The assignment title and department are required.");
                return;
            }

            try {
                await db.collection('devoirs').add({
                    titre: newTitreDevoir.value,
                    desc: newDescDevoir.value,
                    filiere: newFiliereDevoir.value
                });
                e.target.reset();
            } catch (err) {
                console.error(err);
                alert("Could not add the assignment.");
            }
        });
    }

    // ---------------- LECTURER ----------------
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
                alert("Please choose a course.");
                return;
            }

            if (modeLien) {
                const lien = supportLienInput.value.trim();
                if (!lien || !/^https?:\/\/.+/i.test(lien)) {
                    alert("Please enter a valid link (starting with http:// or https://).");
                    return;
                }
                db.collection('supports').add({
                    coursId: supportCours.value,
                    nom: supportNom.value,
                    lien
                }).then(() => {
                    formAddSupport.reset();
                    supportFileInput.style.display = 'block';
                    supportLienInput.style.display = 'none';
                    supportFileInput.required = true;
                    supportLienInput.required = false;
                }).catch(err => {
                    console.error(err);
                    alert("Could not send the course material link.");
                });
                return;
            }

            const file = supportFileInput.files[0];
            if (!file) {
                alert("Please choose a file.");
                return;
            }
            if (file.size > 700 * 1024) {
                if (!confirm("This file is large (>700 KB) and could exceed a Firestore document's size limit (1 MB). Continue anyway?")) {
                    return;
                }
            }

            const reader = new FileReader();
            reader.onerror = () => alert("Error reading the file.");
            reader.onload = async () => {
                try {
                    await db.collection('supports').add({
                        coursId: supportCours.value,
                        nom: supportNom.value,
                        fichier: reader.result
                    });
                    e.target.reset();
                } catch (err) {
                    console.error(err);
                    alert("Could not upload the course material (the file is probably too large).");
                }
            };
            reader.readAsDataURL(file);
        });
    }

    // ---------------- STUDENT ----------------
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
                alert("You have already submitted a file for this assignment.");
                return;
            }

            if (modeLien) {
                const lien = depotLienInput.value.trim();
                if (!lien || !/^https?:\/\/.+/i.test(lien)) {
                    alert("Please enter a valid link (starting with http:// or https://).");
                    return;
                }
                const devoir = state.DEVOIRS.find(d => d.id === devoirId);
                db.collection('depots').add({
                    devoirId,
                    etudiant: currentUser.email,
                    filiere: devoir ? devoir.filiere : currentUser.filiere,
                    lien,
                    note: ""
                }).then(() => {
                    formDepot.reset();
                    depotFileInput.style.display = 'block';
                    depotLienInput.style.display = 'none';
                    depotFileInput.required = true;
                    depotLienInput.required = false;
                    alert("Submission link uploaded!");
                }).catch(err => {
                    console.error(err);
                    alert("Could not send the submission link.");
                });
                return;
            }

            const file = depotFileInput.files[0];
            if (!file) {
                alert("Please choose a file.");
                return;
            }
            if (file.size > 700 * 1024) {
                if (!confirm("This file is large (>700 KB) and could exceed a Firestore document's size limit (1 MB). Continue anyway?")) {
                    return;
                }
            }

            const reader = new FileReader();
            reader.onerror = () => alert("Error reading the file.");
            reader.onload = async () => {
                try {
                    const devoir = state.DEVOIRS.find(d => d.id === devoirId);
                    await db.collection('depots').add({
                        devoirId,
                        etudiant: currentUser.email,
                        filiere: devoir ? devoir.filiere : currentUser.filiere, // denormalised to restrict queries by department
                        fichier: reader.result,
                        note: ""
                    });
                    e.target.reset();
                    alert("Submission uploaded!");
                } catch (err) {
                    console.error(err);
                    alert("Could not upload the submission (the file is probably too large).");
                }
            };
            reader.readAsDataURL(file);
        });
    }
});

// ================= DISPLAY / ADMIN FUNCTIONS =================

function nomAffiche(u) {
    return u.nom && u.prenom ? `${u.prenom} ${u.nom}` : u.email;
}

// Escapes HTML: every value entered by a user (course unit name, course
// unit/assignment title, email, content of an imported file...) goes
// through this function before being inserted into a page's innerHTML.
// Without it, a simple "<script>" typed into a text field (or hidden in an
// imported PDF/Excel file) would run in the browser of EVERY user who
// later views that data (a stored XSS vulnerability).
function escapeHtml(valeur) {
    if (valeur === null || valeur === undefined) return '';
    return String(valeur)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// Human-readable label for a technical role code (display only).
function libelleRole(role) {
    const libelles = { admin: 'Administrator', lecturer: 'Lecturer', student: 'Student', exams: 'Exams Office' };
    return libelles[role] || role;
}

function afficherUsers() {
    const el = document.getElementById('listeUsers');
    if (!el) return;
    el.innerHTML = state.USERS.map((u) =>
        `<div class="card"><p><b>${u.nom && u.prenom ? escapeHtml(nomAffiche(u)) + ' — ' + escapeHtml(u.email) : escapeHtml(u.email)}</b> - ${escapeHtml(libelleRole(u.role))} ${u.filiere ? '(' + escapeHtml(getNomFiliere(u.filiere)) + (u.niveau ? ' - ' + escapeHtml(getNomNiveau(u.niveau)) : '') + ')' : ''} ${u.matricule ? '<br><small>Student ID: ' + escapeHtml(u.matricule) + '</small>' : (u.role === 'student' ? '<br><small style="color:var(--danger);">No student ID assigned</small>' : '')}</p>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${u.role === 'student' ? `<button type="button" onclick="modifierMatriculeUser('${u.id}')" class="btn-secondary">${u.matricule ? 'Edit' : 'Assign'} student ID</button>` : ''}
                ${u.role !== 'admin' ? `<button onclick="supprimerUser('${u.id}')" class="btn-danger">Delete</button>` : ''}
            </div>
        </div>`
    ).join('') || '<p>No user</p>';
}

// Lets the admin assign or fix a student's ID number after account
// creation (e.g. student imported without an ID, a typo...). Same rule as
// at creation: an ID must be unique among students.
async function modifierMatriculeUser(id) {
    const etudiant = state.USERS.find(u => u.id === id);
    if (!etudiant || etudiant.role !== 'student') return;

    const saisie = prompt(
        `Student ID for ${nomAffiche(etudiant)} (${etudiant.email}):`,
        etudiant.matricule || ''
    );
    if (saisie === null) return; // cancelled
    const nouveauMatricule = saisie.trim();
    if (!nouveauMatricule) {
        alert("The student ID cannot be empty.");
        return;
    }
    const dejaUtilise = state.USERS.some(u =>
        u.id !== id && u.role === 'student' &&
        (u.matricule || '').toLowerCase() === nouveauMatricule.toLowerCase()
    );
    if (dejaUtilise) {
        alert("This student ID is already assigned to another student.");
        return;
    }
    try {
        await db.collection('users').doc(id).update({ matricule: nouveauMatricule });
    } catch (err) {
        console.error(err);
        alert("Updating the student ID failed.");
    }
}

async function supprimerUser(id) {
    if (!confirm("Delete this user?")) return;
    try {
        await db.collection('users').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Deletion failed.");
    }
}

// ==========================================
// Bulk creation of users from an Excel/CSV file (admins, lecturers and/or
// students mixed in the same file). Reuses SheetJS (already loaded for the
// marks export) both to generate the template and to read the file filled
// in by the admin.
// ==========================================
let usersDetectesImport = [];

// Normalises a column header name (accents/case/spaces/punctuation
// ignored) so that "Password", "mot_de_passe" or "Mot de passe" are all
// recognised, whichever way the admin named their column.
function normaliserEntete(txt) {
    return String(txt)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z]/g, '');
}

// Generates a readable random password (no ambiguous characters like
// 0/O or 1/l/I): used when the "Password" column is left blank in the
// imported file — essential to create a hundred students at once without
// having to invent a hundred passwords.
function genererMotDePasseAleatoire(longueur = 8) {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let mdp = '';
    for (let i = 0; i < longueur; i++) {
        mdp += caracteres[Math.floor(Math.random() * caracteres.length)];
    }
    return mdp;
}

function telechargerModeleUsers() {
    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not load (check your internet connection) and try again.");
        return;
    }

    const entetes = ['Last Name', 'First Name', 'Student ID', 'Email', 'Role', 'Department', 'Level', 'Password'];
    const exemples = [
        ['Doe', 'John', 'UEW-2026-0001', 'john.doe@uew-ecampus.edu.gh', 'student', 'acct_fin', 1, ''],
        ['Owusu', 'Ama', '', 'lecturer.ama@uew-ecampus.edu.gh', 'lecturer', 'ict', '', ''],
        ['', '', '', 'admin2@uew-ecampus.edu.gh', 'admin', '', '', ''],
        ['', '', '', 'exams2@uew-ecampus.edu.gh', 'exams', '', '', '']
    ];
    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...exemples]);
    feuille['!cols'] = entetes.map(() => ({ wch: 22 }));

    const feuilleCodes = XLSX.utils.aoa_to_sheet([
        ['"Role" column — accepted values'],
        ['admin'], ['lecturer'], ['student'], ['exams (Exams Office, marks)'],
        [],
        ['"Department" column — code to use (blank for an admin or the Exams Office)', 'Full name'],
        ...Object.keys(FILIERES).map(k => [k, FILIERES[k].nom]),
        [],
        ['"Level" column — students only', 'Meaning'],
        ...Object.keys(NIVEAUX).map(n => [n, NIVEAUX[n]]),
        [],
        ['Last Name / First Name / Student ID: required for students only'],
        ['(marks export, identification), optional for admin/lecturer.'],
        [],
        ['Password: optional. Left blank, a password is generated'],
        ['automatically for each user, and the full list'],
        ['(email + password) is offered for download right after creation.']
    ]);

    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Users");
    XLSX.utils.book_append_sheet(classeur, feuilleCodes, "Codes to use");
    XLSX.writeFile(classeur, "UEW-E-Campus_Users_Template.xlsx");
}

async function analyserFichierUsers() {
    const input = document.getElementById('fichierUsers');
    const apercu = document.getElementById('apercuUsersImport');

    if (typeof XLSX === 'undefined') {
        alert("The Excel library could not load (check your internet connection) and try again.");
        return;
    }
    if (!input.files || !input.files[0]) {
        alert("Choose an Excel (.xlsx) or CSV file to analyse.");
        return;
    }

    apercu.innerHTML = '<p>Reading the file...</p>';

    try {
        const buffer = await input.files[0].arrayBuffer();
        const classeur = XLSX.read(buffer, { type: 'array' });
        const premiereFeuille = classeur.Sheets[classeur.SheetNames[0]];
        const lignes = XLSX.utils.sheet_to_json(premiereFeuille, { defval: '' });

        if (lignes.length === 0) {
            apercu.innerHTML = "<p>The file contains no usable row. Use the template provided.</p>";
            return;
        }

        const lireColonne = (ligne, nomAttendu) => {
            const clef = Object.keys(ligne).find(k => normaliserEntete(k) === nomAttendu);
            return clef ? String(ligne[clef]).trim() : '';
        };

        // Emails already in the database: to catch duplicates BEFORE creating anything.
        const emailsExistants = new Set(state.USERS.map(u => u.email.toLowerCase()));
        const emailsDuFichier = new Set();
        // Student IDs already in the database (students only): same anti-duplicate logic.
        const matriculesExistants = new Set(
            state.USERS.filter(u => u.role === 'student' && u.matricule).map(u => u.matricule.toLowerCase())
        );
        const matriculesDuFichier = new Set();

        usersDetectesImport = lignes.map((ligne, index) => {
            const email = lireColonne(ligne, 'email').toLowerCase();
            const passwordSaisi = lireColonne(ligne, 'motdepasse') || lireColonne(ligne, 'password');
            // Optional password: auto-generated if missing from the
            // file (essential for creating 100+ students without
            // inventing that many by hand).
            const motDePasseGenere = !passwordSaisi;
            const password = passwordSaisi || genererMotDePasseAleatoire();
            const role = lireColonne(ligne, 'role').toLowerCase();
            const filiere = lireColonne(ligne, 'filiere').toLowerCase();
            const niveauBrut = lireColonne(ligne, 'niveau');
            const niveau = parseInt(niveauBrut, 10);
            const nom = lireColonne(ligne, 'nom');
            const prenom = lireColonne(ligne, 'prenom');
            const matricule = lireColonne(ligne, 'matricule');

            const erreurs = [];
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) erreurs.push("invalid email");
            if (!['admin', 'lecturer', 'student', 'exams'].includes(role)) erreurs.push("invalid role (admin/lecturer/student/exams)");
            if (role && role !== 'admin' && role !== 'exams' && !FILIERES[filiere]) erreurs.push("unknown department");
            if (role === 'student' && !NIVEAUX[niveau]) erreurs.push("invalid level (1 to 5)");
            if (role === 'student' && (!nom || !prenom)) erreurs.push("missing last/first name");
            if (role === 'student' && !matricule) erreurs.push("missing student ID");
            if (email) {
                if (emailsExistants.has(email)) erreurs.push("email already used in the database");
                if (emailsDuFichier.has(email)) erreurs.push("duplicate email in the file");
                emailsDuFichier.add(email);
            }
            if (role === 'student' && matricule) {
                const matriculeCle = matricule.toLowerCase();
                if (matriculesExistants.has(matriculeCle)) erreurs.push("student ID already used in the database");
                if (matriculesDuFichier.has(matriculeCle)) erreurs.push("duplicate student ID in the file");
                matriculesDuFichier.add(matriculeCle);
            }

            return { ligneNum: index + 2, email, password, motDePasseGenere, role, filiere, niveau, nom, prenom, matricule, erreurs };
        });

        const nbValides = usersDetectesImport.filter(u => u.erreurs.length === 0).length;

        apercu.innerHTML = `
            <p>${usersDetectesImport.length} row(s) read, including <b>${nbValides} valid</b>. Rows with errors are greyed out: fix them in the file then re-analyse if needed.</p>
            <div class="checkbox-group">
                ${usersDetectesImport.map((u, i) => {
                    const ok = u.erreurs.length === 0;
                    const nomComplet = (u.nom && u.prenom) ? `${u.prenom} ${u.nom} — ` : '';
                    const details = ok
                        ? `${nomComplet}${u.email} — ${u.role}${u.filiere ? ' — ' + getNomFiliere(u.filiere) : ''}${u.niveau ? ' — ' + getNomNiveau(u.niveau) : ''}${u.matricule ? ' — Student ID: ' + u.matricule : ''}${u.motDePasseGenere ? ' — password generated' : ''}`
                        : `Row ${u.ligneNum} (${u.email || 'missing email'}): ${u.erreurs.join(', ')}`;
                    return `<label><input type="checkbox" id="userImport_${i}" ${ok ? 'checked' : 'disabled'}> ${escapeHtml(details)}</label>`;
                }).join('')}
            </div>
            <button type="button" onclick="importerUsersSelectionnes()" class="btn-success" ${nbValides === 0 ? 'disabled' : ''}>Create checked users (${nbValides})</button>
        `;
    } catch (err) {
        console.error(err);
        apercu.innerHTML = "<p>Could not read this file. Check that it is indeed an Excel (.xlsx) or CSV file, preferably generated from the template.</p>";
    }
}

async function importerUsersSelectionnes() {
    const apercu = document.getElementById('apercuUsersImport');
    const aCreer = usersDetectesImport.filter((u, i) => {
        const cb = document.getElementById(`userImport_${i}`);
        return cb && cb.checked && u.erreurs.length === 0;
    });

    if (aCreer.length === 0) {
        alert("No valid checked user to create.");
        return;
    }

    if (aCreer.length > 30 && !confirm(`You are about to create ${aCreer.length} users at once. Continue?`)) {
        return;
    }

    apercu.innerHTML = `<p>Creating in progress (0 / ${aCreer.length})...</p>`;

    try {
        // Firestore limits a batch to 500 writes; splitting into batches of
        // 400 keeps us comfortably under that, even for a file with
        // several hundred rows (100 students fit in a single batch).
        const TAILLE_LOT = 400;
        const paquets = [];
        for (let i = 0; i < aCreer.length; i += TAILLE_LOT) paquets.push(aCreer.slice(i, i + TAILLE_LOT));

        let creees = 0;
        for (const paquet of paquets) {
            const batch = db.batch();
            paquet.forEach(u => {
                const data = { email: u.email, password: u.password, role: u.role };
                if (u.role !== 'admin' && u.role !== 'exams') data.filiere = u.filiere;
                if (u.role === 'student') data.niveau = u.niveau;
                // Last/first name/student ID: mandatory for a student, but
                // also kept for an admin/lecturer if the file provided them.
                if (u.nom) data.nom = u.nom;
                if (u.prenom) data.prenom = u.prenom;
                if (u.matricule) data.matricule = u.matricule;
                batch.set(db.collection('users').doc(), data);
            });
            await batch.commit();
            creees += paquet.length;
            apercu.innerHTML = `<p>Creating in progress (${creees} / ${aCreer.length})...</p>`;
        }

        afficherResultatImportUsers(aCreer);
        usersDetectesImport = [];
        document.getElementById('fichierUsers').value = '';
    } catch (err) {
        console.error(err);
        apercu.innerHTML = "<p>An error occurred while creating the users. Check the list above (some may have already been created) before restarting the import.</p>";
    }
}

// Displays the import result + a button to download the credentials
// (email + password, including auto-generated ones) of the users that
// were just created, so the admin can
// distribute them (printing, sending per class...).
function afficherResultatImportUsers(utilisateursCrees) {
    const apercu = document.getElementById('apercuUsersImport');
    dernierImportUsersCrees = utilisateursCrees;
    apercu.innerHTML = `
        <p>${utilisateursCrees.length} user(s) created successfully.</p>
        <button type="button" onclick="telechargerIdentifiantsImportes()" class="btn-secondary">Download credentials (.xlsx)</button>
    `;
}

let dernierImportUsersCrees = [];

function telechargerIdentifiantsImportes() {
    if (typeof XLSX === 'undefined' || dernierImportUsersCrees.length === 0) return;
    const entetes = ['Last Name', 'First Name', 'Student ID', 'Email', 'Role', 'Department', 'Level', 'Password'];
    const lignes = dernierImportUsersCrees.map(u => [
        u.nom || '', u.prenom || '', u.matricule || '', u.email, u.role,
        u.filiere ? getNomFiliere(u.filiere) : '', u.niveau ? getNomNiveau(u.niveau) : '', u.password
    ]);
    const feuille = XLSX.utils.aoa_to_sheet([entetes, ...lignes]);
    feuille['!cols'] = entetes.map(() => ({ wch: 20 }));
    const classeur = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(classeur, feuille, "Credentials");
    XLSX.writeFile(classeur, `UEW-E-Campus_Credentials_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// Small "Departments concerned: ..." text shown only for Common Core
// courses, so the admin/lecturer can see at a glance who will receive the course.
function texteFilieresConcernees(c) {
    if (!estFiliereTroncCommun(c.filiere) || !Array.isArray(c.filieresConcernees) || c.filieresConcernees.length === 0) return '';
    return `<p>Departments concerned: ${c.filieresConcernees.map(getNomFiliere).join(', ')}</p>`;
}

// Small "Course unit: ..." text shown only if the course was scheduled
// from a course unit assigned by the admin (see coursData.matiereId).
function texteMatiereCours(c) {
    if (!c.matiereNom) return '';
    return `<p>Course unit: ${escapeHtml(c.matiereNom)}</p>`;
}

function afficherCoursAdmin() {
    const el = document.getElementById('listeCoursAdmin');
    if (!el) return;
    el.innerHTML = state.COURS.map((c) =>
        `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(c.titre)}</h4><p>${getNomFiliere(c.filiere)} | ${new Date(c.date).toLocaleString('en-GB')} | ${nomSalle(c.filiere, c.salle)} ${c.en_live ? 'LIVE' : ''}</p>${texteMatiereCours(c)}${texteFilieresConcernees(c)}<button onclick="supprimerCours('${c.id}')" class="btn-danger">Delete</button></div>`
    ).join('') || '<p>No course</p>';
}

async function supprimerCours(id) {
    if (!confirm("Delete this course? This action is irreversible.")) return;
    try {
        await db.collection('cours').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Deletion failed.");
    }
}

function afficherDevoirsAdmin() {
    const el = document.getElementById('listeDevoirsAdmin');
    if (!el) return;
    el.innerHTML = state.DEVOIRS.map((d) =>
        `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(d.titre)}</h4><p>${getNomFiliere(d.filiere)}</p><p>${escapeHtml(d.desc)}</p><button onclick="supprimerDevoir('${d.id}')" class="btn-danger">Delete</button></div>`
    ).join('') || '<p>No assignment</p>';
}

// ================= COURSE UNIT FUNCTIONS (admin) =================
// A course unit belongs to a department AND a level (like a course), and
// can be assigned to ONE lecturer of that same department. The admin can
// create, assign/reassign (including "no lecturer") and delete.

function afficherMatieresAdmin() {
    const el = document.getElementById('listeMatieresAdmin');
    if (!el) return;

    el.innerHTML = state.MATIERES.map(m => {
        // Only lecturers from the same department as the course unit make sense here.
        const profsFiliere = state.USERS.filter(u => u.role === 'lecturer' && u.filiere === m.filiere);
        const optionsProfs = '<option value="">-- No lecturer --</option>' +
            profsFiliere.map(p => `<option value="${p.id}" ${m.profId === p.id ? 'selected' : ''}>${escapeHtml(nomAffiche(p))}</option>`).join('');

        return `<div class="card">
            <h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(m.nom)}</h4>
            <p>${getNomFiliere(m.filiere)} | ${getNomNiveau(m.niveau)}</p>
            <p>${m.profId ? `Assigned to: <b>${escapeHtml(m.profEmail || '(lecturer)')}</b>` : 'No lecturer assigned yet'}</p>
            <label>Assign / reassign to a lecturer:</label>
            <select onchange="assignerProfMatiere('${m.id}', this.value)">${optionsProfs}</select>
            <button onclick="supprimerMatiere('${m.id}')" class="btn-danger">Delete</button>
        </div>`;
    }).join('') || '<p>No course unit created yet</p>';
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
        alert("Could not assign the course unit to this lecturer.");
        afficherMatieresAdmin(); // redisplays the real state (undoes the select's visual change)
    }
}

// ==========================================
// Bulk import of course units from a PDF or Word (.docx) file.
// Each non-empty line of the file becomes a candidate course unit,
// created for the department and level chosen by the admin.
// ==========================================
let matieresDetecteesImport = [];

// Normalises a course unit name for comparison (accents/case/spaces
// ignored): used to detect duplicates, both within the imported file and
// against course units already in the database.
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

            // IMPORTANT: pdf.js does NOT return text lines, but fragments
            // positioned by (x, y) coordinates. Concatenating them as-is
            // wipes out every line break from the original PDF and merges
            // all the course units on a page into one giant "line" (so
            // none of them are ever detected afterwards). Lines are
            // rebuilt by grouping fragments that share the same Y
            // coordinate (within a small tolerance, to absorb tiny font
            // rendering offsets).
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
        .replace(/^[\s•\-–—*]+/, '')     // bullet points at the start of the line
        .replace(/^\d+[\).\-]\s*/, '')   // numbering "1. " / "1) " / "1- "
        .replace(/\s+/g, ' ')
        .trim();
}

async function analyserFichierMatieres() {
    const input = document.getElementById('fichierMatieres');
    const apercu = document.getElementById('apercuMatieresImport');
    const filiere = document.getElementById('importFiliereMatiere').value;
    const niveau = document.getElementById('importNiveauMatiere').value;

    if (!filiere || !niveau) {
        alert("First choose the department and level this file concerns.");
        return;
    }
    if (!input.files || !input.files[0]) {
        alert("Choose a PDF or Word file to analyse.");
        return;
    }

    apercu.innerHTML = '<p>Reading the file...</p>';

    try {
        const texte = await extraireTexteFichier(input.files[0]);
        const lignes = texte.split('\n')
            .map(nettoyerLigneMatiere)
            .filter(l => l.length >= 2 && l.length <= 80);

        // De-duplication within the file itself (accent/case insensitive),
        // to avoid suggesting the same course unit twice if it appears
        // twice in the document.
        const vues = new Set();
        matieresDetecteesImport = lignes.filter(l => {
            const cle = normaliserNomMatiere(l);
            if (vues.has(cle)) return false;
            vues.add(cle);
            return true;
        });

        if (matieresDetecteesImport.length === 0) {
            apercu.innerHTML = "<p>No course unit detected in this file. Check that it contains one course unit name per line.</p>";
            return;
        }

        // Flags the ones that already exist in the database for this
        // department/level (same name, accents/case ignored): unchecked by
        // default to avoid creating a Firestore duplicate by mistake, but
        // the admin can still re-check them if they really want to.
        const niveauInt = parseInt(niveau, 10);
        const dejaExistantes = new Set(
            state.MATIERES
                .filter(m => m.filiere === filiere && Number(m.niveau) === niveauInt)
                .map(m => normaliserNomMatiere(m.nom))
        );

        apercu.innerHTML = `
            <p>${matieresDetecteesImport.length} course unit(s) detected for <b>${getNomFiliere(filiere)} - ${getNomNiveau(niveauInt)}</b>. Uncheck the ones not to create:</p>
            <div class="checkbox-group">
                ${matieresDetecteesImport.map((m, i) => {
                    const existeDeja = dejaExistantes.has(normaliserNomMatiere(m));
                    return `<label><input type="checkbox" id="matiereImport_${i}" ${existeDeja ? '' : 'checked'}> ${escapeHtml(m)}${existeDeja ? ' <i>(already exists — unchecked)</i>' : ''}</label>`;
                }).join('')}
            </div>
            <button type="button" onclick="importerMatieresSelectionnees()" class="btn-success">Create checked course units</button>
        `;
    } catch (err) {
        console.error(err);
        apercu.innerHTML = `<p>${err.message || "Could not read this file."}</p>`;
    }
}

async function importerMatieresSelectionnees() {
    const filiere = document.getElementById('importFiliereMatiere').value;
    const niveau = parseInt(document.getElementById('importNiveauMatiere').value, 10);
    const apercu = document.getElementById('apercuMatieresImport');

    const aCreer = matieresDetecteesImport.filter((m, i) => {
        const cb = document.getElementById(`matiereImport_${i}`);
        return cb && cb.checked;
    });

    if (aCreer.length === 0) {
        alert("No checked course unit to create.");
        return;
    }

    try {
        await Promise.all(aCreer.map(nom => db.collection('matieres').add({
            nom,
            filiere,
            niveau,
            profId: null,
            profEmail: null
        })));
        apercu.innerHTML = `<p>${aCreer.length} course unit(s) created successfully.</p>`;
        matieresDetecteesImport = [];
        document.getElementById('fichierMatieres').value = '';
    } catch (err) {
        console.error(err);
        alert("Could not create some of the course units.");
    }
}

async function supprimerMatiere(id) {
    if (!confirm("Delete this course unit? Courses already scheduled will not be deleted.")) return;
    try {
        await db.collection('matieres').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Deletion failed.");
    }
}

// ================= COURSE UNIT FUNCTIONS (lecturer) =================

// Read-only list of the course units the admin has assigned to this lecturer.
function afficherMatieresProf() {
    const el = document.getElementById('listeMatieresProf');
    if (!el || !currentUser) return;

    const mesMatieres = state.MATIERES.filter(m => m.profId === currentUser.id);
    el.innerHTML = mesMatieres.map(m =>
        `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(m.nom)}</h4><p>${getNomNiveau(m.niveau)} | ${getNomFiliere(m.filiere)}</p></div>`
    ).join('') || "<p>No course unit has been assigned to you by the administration yet.</p>";
}

// Fills the "Course unit" select of the admin's "Schedule a course" form,
// with EVERY existing course unit (across all departments, since the admin
// then chooses the department via its own dedicated field). Choosing a
// course unit automatically pre-fills the course's department,
// level/room, and title (if empty).
function remplirSelectMatieresAdmin() {
    const el = document.getElementById('coursMatiereAdmin');
    if (!el) return;

    el.innerHTML = '<option value="">-- Free entry (no course unit) --</option>' +
        state.MATIERES.map(m =>
            `<option value="${m.id}" data-filiere="${escapeHtml(m.filiere)}" data-niveau="${m.niveau}" data-nom="${escapeHtml(m.nom)}">${escapeHtml(m.nom)} — ${getNomFiliere(m.filiere)} / ${getNomNiveau(m.niveau)} ${m.profEmail ? '(' + escapeHtml(m.profEmail) + ')' : '(not assigned)'}</option>`
        ).join('');
}

// Called by the onchange of the #coursMatiereAdmin select (see admin.html).
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
    if (!confirm("Delete this assignment? Associated submissions will be left orphaned.")) return;
    try {
        await db.collection('devoirs').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Deletion failed.");
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

// ================= LECTURER FUNCTIONS =================

async function lancerCours(id) {
    const cours = state.COURS.find(c => c.id === id);
    if (!cours) return;

    const conflit = state.COURS.find(c => c.id !== id && c.filiere === cours.filiere && c.salle === cours.salle && c.en_live === true);
    if (conflit) {
        alert(`Not possible: room "${nomSalle(cours.filiere, cours.salle)}" is already occupied by the course "${conflit.titre}". Stop it first, or pick a course in a different room.`);
        return;
    }

    try {
        await db.collection('cours').doc(id).update({ en_live: true });
        // No need to refresh manually: Firestore pushes the change to this
        // browser AND to every concerned student in real time.
        alert("The course is LIVE! Students in the department receive the link instantly.");
    } catch (err) {
        console.error(err);
        alert("Could not start the course. Check your connection.");
    }
}

async function couperCours(id) {
    try {
        await db.collection('cours').doc(id).update({ en_live: false });
        alert("The course has ENDED");
    } catch (err) {
        console.error(err);
        alert("Could not stop the course.");
    }
}

function blocVisio(c) {
    // NOTE: meet.jit.si (free public server) limits meetings to 5 minutes
    // when embedded as an <iframe> in a page ("embed mode"). This limit
    // does NOT apply when the meeting is opened in a separate tab — so a
    // "Join" button is used everywhere instead of an <iframe>, for courses
    // with no time limit.
    return `<div class="jitsi-fallback"><p>Video conference room ready.</p><a href="${c.lien}" target="_blank" rel="noopener"><button class="btn-live">Join the video call</button></a></div>`;
}

// Lists, for a given course, the time spent by each concerned student
// (same department + same level as the course's room) — visible to the lecturer.
function blocPresenceEtudiants(c) {
    const etudiantsConcernes = state.USERS.filter(u => u.role === 'student' && coursConcerneEtudiant(c, u));
    if (etudiantsConcernes.length === 0) return '';

    const lignes = etudiantsConcernes.map(u => {
        const presencesEtudiant = state.PRESENCES.filter(p => p.etudiant === u.email && p.coursId === c.id);
        const secondes = presencesEtudiant.reduce((total, p) => total + calculerSecondesPresence(p), 0);
        const enDirect = presencesEtudiant.some(p => p.enLigne);
        return `<li class="${enDirect ? 'presence-en-direct' : ''}">${escapeHtml(nomAffiche(u))} — <b>${formatDuree(secondes)}</b></li>`;
    }).join('');

    return `<div class="presence-etudiants"><p><b>Time spent by students in this course:</b></p><ul>${lignes}</ul></div>`;
}

function afficherCoursProf() {
    const el = document.getElementById('listeCoursProf');
    if (!el || !currentUser) return;

    // A lecturer only manages the courses in their department that are
    // actually theirs (see coursGereParProf: accounts for course-unit
    // assignment by the admin).
    const mesCours = currentUser.role === 'admin'
        ? state.COURS
        : state.COURS.filter(c => coursGereParProf(c, currentUser));

    el.innerHTML = mesCours.map(c =>
        `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(c.titre)}</h4><p>${getNomFiliere(c.filiere)} | ${new Date(c.date).toLocaleString('en-GB')} | ${nomSalle(c.filiere, c.salle)}</p>${texteMatiereCours(c)}${texteFilieresConcernees(c)}${c.en_live ? `<p class="live">LIVE</p>${blocVisio(c)}<button onclick="couperCours('${c.id}')" class="btn-danger" style="margin-top:12px;">End Live</button>` : `<button onclick="lancerCours('${c.id}')" class="btn-success">Start Live</button>`}${blocPresenceEtudiants(c)}</div>`
    ).join('') || "<p>No course scheduled by the administration yet</p>";
}

// Renders an attachment (course material or submitted file): handles the
// two possible cases, a file stored as base64 (direct download) or a
// simple external link (Google Drive, etc.) opened in a new tab.
function renderPieceJointe(item, nomTelechargement, classeBtn) {
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
            // A lecturer should only see/manage materials for courses assigned to them
            return cours && coursGereParProf(cours, currentUser);
        })
        .map(s => {
            const cours = state.COURS.find(c => c.id === s.coursId);
            return `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(s.nom)}</h4><p><b>Course:</b> ${escapeHtml(cours ? cours.titre : '(course deleted)')}</p>${renderPieceJointe(s, s.nom, 'btn-secondary')}<button onclick="supprimerSupport('${s.id}')" class="btn-danger">Delete</button></div>`;
        }).join('') || "<p>No course material</p>";
}

async function supprimerSupport(id) {
    if (!confirm("Delete this course material?")) return;
    try {
        await db.collection('supports').doc(id).delete();
    } catch (err) {
        console.error(err);
        alert("Deletion failed.");
    }
}

function afficherDepotsProf() {
    const el = document.getElementById('listeDepotsProf');
    if (!el || !currentUser) return;
    // A lecturer should only see submissions for an assignment in THEIR
    // own department; the admin (the "Assignments" tab) sees everything,
    // across every department, in order to supervise/grade any submission.
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
                ? `${escapeHtml(nomAffiche(etudiant))}${etudiant.matricule ? ' — Student ID: ' + escapeHtml(etudiant.matricule) : ''}`
                : escapeHtml(d.etudiant);
            const infosFiliere = currentUser.role === 'admin' && devoir ? `<p>${getNomFiliere(devoir.filiere)}</p>` : '';
            return `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(devoir ? devoir.titre : '(assignment deleted)')}</h4>${infosFiliere}<p><b>Student:</b> ${infosEtudiant}</p>${renderPieceJointe(d, 'submission.pdf', 'btn-secondary')}<input type="number" min="0" max="20" placeholder="Mark /20" value="${d.note}" onchange="noterCopie('${d.id}', this.value)" style="width:100px;"></div>`;
        }).join('') || "<p>No submission</p>";
}

async function noterCopie(id, note) {
    const n = parseFloat(note);
    if (note !== "" && (isNaN(n) || n < 0 || n > 20)) {
        alert("The mark must be between 0 and 20.");
        afficherDepotsProf();
        return;
    }
    try {
        await db.collection('depots').doc(id).update({ note });
    } catch (err) {
        console.error(err);
        alert("Could not save the mark.");
    }
}

// ===================================
// INSTANT MESSAGING
// Real-time discussion Lecturer <-> Student (of their department) and
// Lecturer <-> Administration. Each conversation is identified by
// "participants" = the 2 emails sorted, which always finds the same
// thread between 2 people.
// ===================================

function idConversation(emailA, emailB) {
    return [emailA, emailB].sort().join('__');
}

function notifierNouveauMessage(message) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const expediteur = state.USERS.find(u => u.email === message.from);
    const notif = new Notification('New message', {
        body: `${expediteur ? nomAffiche(expediteur) : message.from}: ${message.texte}`
    });
    notif.onclick = () => {
        window.focus();
        const zone = document.getElementById('chatContacts');
        if (zone) zone.scrollIntoView({ behavior: 'smooth' });
    };
}

// Determines the list of allowed contacts based on the logged-in user's
// role: a student only chats with lecturers of THEIR department, a
// lecturer chats with students of THEIR department and with the
// administration, an admin chats with every lecturer.
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
    const el = document.getElementById('chatContacts');
    if (!el || !currentUser) return;

    const contacts = listeContactsChat();

    const rendreContact = (u) => {
        const nb = nbMessagesNonLus(u.email);
        return `<div class="chat-contact ${contactChatActif === u.email ? 'actif' : ''}" onclick="ouvrirConversationChat('${u.email}')">
            <span class="chat-contact-nom">${u.role === 'student' ? '🎓 ' : ''}${escapeHtml(nomAffiche(u))}</span>
            ${nb > 0 ? `<span class="chat-contact-badge">${nb}</span>` : ''}
        </div>`;
    };

    if (currentUser.role === 'lecturer') {
        // Two distinct groups for a lecturer: their students and the administration.
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
    const header = document.getElementById('chatHeader');
    if (header) header.innerText = contact ? `${nomAffiche(contact)}` : `${emailContact}`;
    const form = document.getElementById('formChat');
    if (form) form.style.display = 'flex';

    // Marks every message received from this contact as read
    const aMarquer = state.MESSAGES.filter(m => m.from === emailContact && m.to === currentUser.email && !m.lu);
    try {
        await Promise.all(aMarquer.map(m => db.collection('messages').doc(m.id).update({ lu: true })));
    } catch (err) {
        console.error("Error marking messages as read:", err);
    }
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
        ? fil.map(m => `<div class="chat-bulle ${m.from === currentUser.email ? 'chat-bulle-moi' : 'chat-bulle-autre'}">${escapeHtml(m.texte)}<span class="chat-bulle-heure">${new Date(m.date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span></div>`).join('')
        : '<p class="chat-messages-vide">No message yet. Write the first one!</p>';

    el.scrollTop = el.scrollHeight;
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
    try {
        await db.collection('messages').add(message);
    } catch (err) {
        console.error(err);
        alert("Could not send the message.");
    }
}

// ================= STUDENT FUNCTIONS =================

function afficherBanniereLive(coursLive) {
    const banniere = document.getElementById('liveBanner');
    if (!banniere) return;

    if (coursLive.length === 0) {
        banniere.innerHTML = '';
        return;
    }

    banniere.innerHTML = coursLive.map(c =>
        `<span>${escapeHtml(c.titre)} (${nomSalle(c.filiere, c.salle)}${estFiliereTroncCommun(c.filiere) ? ' - Common Core' : ''}) is Live</span><a href="#live-cours-${c.id}">View course</a>`
    ).join(' &nbsp;|&nbsp; ');
    banniere.className = 'live-banner';
}

function afficherCoursEtudiant() {
    const el = document.getElementById('listeCours');
    if (!el || !currentUser) return;

    if (!currentUser.niveau) {
        el.innerHTML = "<p>Your level has not been set by the administration yet. Contact the administrator to see your courses.</p>";
        afficherBanniereLive([]);
        return;
    }

    // Only Live courses that concern the student's department AND level
    // are shown (see coursConcerneEtudiant: also handles Common Core
    // courses meant for several departments).
    const coursLive = state.COURS.filter(c => c.en_live === true && coursConcerneEtudiant(c, currentUser));

    afficherBanniereLive(coursLive);

    el.innerHTML = coursLive.map(c =>
        `<div class="card card-live" id="live-cours-${c.id}"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(c.titre)}</h4><p>${getNomFiliere(c.filiere)} | ${new Date(c.date).toLocaleString('en-GB')} | ${nomSalle(c.filiere, c.salle)}</p>${texteMatiereCours(c)}${blocVisio(c)}</div>`
    ).join('') || "<p>No course live at the moment. This page updates automatically and instantly as soon as a lecturer starts a course.</p>";
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
    ).join('') || "<p>No course scheduled at the moment</p>";
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
            // A course material is only visible to students concerned by the course (department/level, Common Core included)
            return cours && coursConcerneEtudiant(cours, currentUser);
        })
        .map(s => {
            const cours = state.COURS.find(c => c.id === s.coursId);
            return `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(s.nom)}</h4><p><b>Course:</b> ${escapeHtml(cours ? cours.titre : '(course deleted)')}</p>${renderPieceJointe(s, s.nom, 'btn-success')}</div>`;
        }).join('') || "<p>No course material yet</p>";
}

// List of classmates: only those in the same department AND same level as
// the logged-in student ("only students at the same level can view their list").
function afficherClasseEtudiant() {
    const el = document.getElementById('listeClasseEtudiant');
    if (!el || !currentUser) return;

    if (!currentUser.niveau) {
        el.innerHTML = "<p>Your level has not been set by the administration yet. Ask the administrator to fill it in to see your class list.</p>";
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
    }).join('') || "<p>You are the only one at this level for now.</p>";
}

function afficherDevoirsEtudiant() {
    const el = document.getElementById('listeDevoirsEtudiant');
    if (!el || !currentUser) return;
    el.innerHTML = state.DEVOIRS
        .filter(d => d.filiere === currentUser.filiere)
        .map(d => {
            const monDepot = state.DEPOTS.find(dep => dep.devoirId === d.id && dep.etudiant === currentUser.email);
            return `<div class="card"><h4><img src="./logo.png" class="icon-logo" alt="">${escapeHtml(d.titre)}</h4><p>${escapeHtml(d.desc)}</p>${monDepot ? `<p class="success">Submitted. Mark: ${escapeHtml(monDepot.note || 'Pending')}</p>` : `<p class="warning">Not submitted yet</p>`}</div>`;
        }).join('') || "<p>Aucun devoir</p>";
}

function remplirSelectCours(id) {
    const el = document.getElementById(id);
    if (!el || !currentUser) return;
    // A lecturer can only send a course material for the courses they
    // actually manage (see coursGereParProf) — not every course in their department.
    const cours = currentUser.role === 'admin' ? state.COURS : state.COURS.filter(c => coursGereParProf(c, currentUser));
    el.innerHTML = '<option value="">Choisir un cours</option>' +
        cours.map(c => `<option value="${c.id}">${escapeHtml(c.titre)} (${getNomFiliere(c.filiere)})</option>`).join('');
}

function remplirSelectDevoir(id) {
    const el = document.getElementById(id);
    if (!el || !currentUser) return;
    const devoirs = currentUser.role === 'admin' ? state.DEVOIRS : state.DEVOIRS.filter(d => d.filiere === currentUser.filiere);
    el.innerHTML = '<option value="">Choisir un devoir</option>' +
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
    el.innerHTML = '<option value="">-- Choisir un niveau --</option>' +
        Object.keys(NIVEAUX).map(num => `<option value="${num}">${NIVEAUX[num]}</option>`).join('');
}

// "Optional" variants of remplirSelectFilieres/remplirSelectNiveaux:
// the first option ("All departments" / "All levels") has an empty value
// which, in exporterListeEtudiants(), means "no filter" rather than
// "field not filled in".
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
    el.querySelector('option[value=""]').textContent = 'Tous les niveaux';
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
