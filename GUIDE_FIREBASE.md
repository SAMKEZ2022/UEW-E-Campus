# Migration vers Firebase — Guide d'installation

## Ce qui a changé

Avant, `localStorage` stockait les données **dans le navigateur de chaque personne** —
c'est pourquoi un prof qui lançait un Live ne pouvait pas réellement prévenir un
étudiant sur un autre appareil : rien n'était partagé.

Maintenant, tout passe par **Firebase Firestore** avec écoute en temps réel
(`onSnapshot`). Concrètement :

1. Le prof clique sur **"Lancer le Live"** → le document du cours est mis à jour
   dans Firestore (`en_live: true`).
2. Firestore **pousse ce changement instantanément** à tous les navigateurs
   connectés (sans rafraîchissement, sans délai d'attente).
3. Chaque étudiant **de la même filière** (`c.filiere === currentUser.filiere`) voit
   apparaître automatiquement : la bannière rouge en haut, la carte du cours
   avec le lien Jitsi intégré, un son d'alerte, et une notification navigateur.
4. Les étudiants d'une autre filière ne sont pas dérangés — seuls les
   "concernés" reçoivent le lien.

## Étape 1 — Le projet Firebase

Le projet Firebase **`uew-e-campus`** est déjà créé et sa configuration est
renseignée dans **`firebase-config.js`** — rien à faire ici sauf si vous
changez un jour de projet (roue crantée > Paramètres du projet > Vos
applications, pour récupérer un nouvel objet `firebaseConfig`).

Deux choses restent à activer dans la [console Firebase](https://console.firebase.google.com/project/uew-e-campus) :

1. **Build > Firestore Database** → "Créer une base de données" (mode
   production ou test) si ce n'est pas déjà fait.
2. **Build > Authentication > Sign-in method** → activer le fournisseur
   **Anonyme** (nécessaire, voir Étape 2 ci-dessous).

## Étape 2 — Règles de sécurité Firestore + Authentification anonyme

Si tu utilises des règles qui exigent d'être authentifié, par exemple :

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

...il faut impérativement activer l'**authentification anonyme** de Firebase,
sinon **toute l'app est bloquée** (login, live, tout) car elle n'utilisait pas
le SDK Firebase Auth auparavant.

1. Dans la console Firebase : **Build > Authentication > Sign-in method**.
2. Active le fournisseur **"Anonyme"**.
3. C'est tout — `firebase-config.js` connecte désormais chaque navigateur
   anonymement dès le chargement de la page (`signInAnonymously`), ce qui
   satisfait `request.auth != null`. Votre système de rôles
   (admin/prof/étudiant) continue d'être géré "à la main" via la collection
   Firestore `users` : l'authentification anonyme ne fait que débloquer
   l'accès à la base, elle ne remplace pas votre logique de connexion par
   email/mot de passe.

⚠️ Avec ces règles, n'importe quel visiteur anonyme peut quand même lire/
écrire toute la base (y compris les mots de passe en clair dans `users`) —
elles empêchent juste les robots/scripts complètement extérieurs à
l'application. Pour une vraie protection par rôle, il faudrait remplacer le
login "maison" par de vraies sessions **Firebase Authentication**
(email/mot de passe) et des règles qui vérifient, par exemple,
`request.auth.token.role == 'admin'` via des "custom claims". Je peux faire
cette migration si vous voulez sécuriser filièreusement l'app.

## Étape 3 — Ajouter Firebase aux 3 autres pages

Je n'ai reçu que `admin.html` dans le zip (pas `index.html`, `lecturer.html`,
`student.html`, `style.css`). `admin.html` a déjà été mis à jour ci-joint.
Pour les 3 autres, ajoute exactement ces 3 lignes dans le `<head>`,
**avant** le `<script src="./script.js">` :

```html
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.13.0/firebase-auth-compat.js"></script>
<script src="./firebase-config.js"></script>
```

Et place `firebase-config.js` dans le même dossier que les pages HTML.

Aucune autre modification n'est nécessaire dans ces pages : tous les `id`
(`listeCours`, `listeCoursProf`, `loginForm`, etc.) sont restés identiques,
`script.js` s'y raccroche automatiquement.

## Étape 4 — Premier lancement

Au tout premier chargement de la page de connexion, `script.js` recrée
automatiquement les comptes et cours de démonstration dans Firestore
(comptes de test : `admin@uew-ecampus.edu.gh` / `UEW2026#Admin`, etc. — voir
la page de connexion pour la liste complète). Cela ne se produit qu'une seule
fois grâce à un document `_meta/init`.

## Départements et salles UEW

- Les **24 départements** de l'UEW sont répartis en 10 facultés/écoles (`POLES` dans
  `script.js`) : Informatique & Technologie, Économie & Finance, Management &
  Gestion. Les menus déroulants de filière les affichent groupées par pôle.
- Une filière **Tronc Commun** existe en plus, pour les cours communs à
  plusieurs filières (elle n'apparaît pas dans les 3 pôles ci-dessus).
- Chaque filière (y compris Tronc Commun) dispose de **5 niveaux/salles** :
  L1/BTS 1, L2/BTS 2, L3, Master 1 et Master 2.
- Pour ajouter, renommer ou retirer une filière : modifier le tableau
  `FILIERES_DATA` en haut de `script.js` (aucune autre modification requise,
  tout le reste du code lit cette liste dynamiquement).

## Ce qui n'a pas changé

- Les filières, les salles Jitsi fixes, la logique de conflit de salle.
- La structure des pages, les noms des fonctions appelées en `onclick`.
- Le dépôt de fichiers (support de cours, copies d'étudiants) — toujours en
  base64, mais désormais avec un plafond conseillé de ~700 Ko à cause de la
  limite de 1 Mo par document Firestore (au lieu de la limite du navigateur).

## Amélioration ajoutée par rapport à l'original

Dans la version `localStorage`, un étudiant voyait **tous** les cours en live
de toutes les filières. J'ai filtré l'affichage et les notifications pour ne
montrer aux étudiants **que les cours de leur propre filière** — ce qui
correspond à "les étudiants concernés" dans votre demande.

## Historique : le prof a un temps programmé ses propres cours (revenu en arrière)

Une version intermédiaire de l'app laissait chaque prof créer lui-même ses
cours depuis `lecturer.html`. **Ce n'est plus le cas** : voir la section
"Nouveau : seul l'admin programme les cours" plus bas, qui décrit le
fonctionnement actuel.

## Nouveau : Gestion des Matières par niveau (admin → prof)

Nouvelle collection Firestore **`matieres`**. Chaque document représente une
matière rattachée à une **filière** et un **niveau**, avec un professeur
attribué (ou aucun) :

```
{ nom: "Financial Accounting", filiere: "acct_fin", niveau: 1, profId: "abc123", profEmail: "lecturer.acctfin@uew-ecampus.edu.gh" }
```

### Côté admin (`admin.html`)

Nouvelle section **"📘 Gestion des Matières"**, juste après la gestion des
utilisateurs :

- L'admin crée une matière : nom + filière + niveau.
- Sous chaque matière listée, un menu déroulant liste **uniquement les
  professeurs de la même filière** (`state.USERS.filter(u => u.role === 'prof' && u.filiere === m.filiere)`)
  et permet de l'attribuer (ou de retirer l'attribution avec "Aucun
  professeur"). L'attribution est immédiate (mise à jour Firestore), pas
  besoin de bouton "Valider" séparé.
- Une matière peut être supprimée à tout moment (les cours déjà programmés
  ne sont pas affectés).
- Le compteur "Matières" a été ajouté aux statistiques du tableau de bord.

### Côté prof (`lecturer.html`)

- Nouvelle section **"📘 Mes Matières"** : liste en lecture seule des
  matières que l'admin lui a attribuées (nom + niveau + filière).
- Ces matières ne servent plus à créer des cours depuis l'espace prof (voir
  section suivante) : elles servent uniquement de référence, et déterminent
  **quel prof peut lancer le Live** d'un cours donné quand l'admin relie ce
  cours à une matière.

### Sécurité

Les règles Firestore actuelles (`allow read, write: if request.auth != null`)
couvrent automatiquement la nouvelle collection `matieres` — aucune
modification de `firestore.rules` n'était nécessaire.

## Nouveau : Navigation par onglets (Accueil / Tableau de bord / Mes cours)

Sur demande, les 3 espaces (`admin.html`, `lecturer.html`, `student.html`) adoptent
maintenant une navigation par onglets sous l'en-tête coloré, inspirée des
plateformes e-learning classiques (type Moodle) : une barre blanche avec
**Accueil**, **Tableau de bord** et **Mes cours**, l'onglet actif étant
souligné en orange.

### Comment ça marche techniquement

Tout le contenu de chaque page est réparti dans 3 blocs
`<section class="tab-page" data-tab="...">` (un par onglet). Une fonction
générique `activerOnglet(nomOnglet)` dans `script.js` affiche la bonne
section et masque les autres (`display:none` en CSS) — **aucun élément
n'est retiré du DOM**, donc tous les écouteurs Firestore, formulaires et
scripts existants continuent de fonctionner normalement même dans un
onglet actuellement masqué. Le dernier onglet consulté est mémorisé
(`localStorage`) par rôle, pour le retrouver à la prochaine connexion.

### Répartition du contenu par espace

| Espace | Accueil | Tableau de bord | Mes cours |
|---|---|---|---|
| **Étudiant** | Cours en Live Maintenant | Ma Classe, Messagerie, Mes Devoirs | Prochains Cours, Supports de Cours, Déposer une Copie |
| **Professeur** | Mes Cours & Live | Copies des Devoirs, Messagerie | Mes Matières, Envoyer un Support de Cours |
| **Admin** | Statistiques | Gestion des Utilisateurs (+ import Excel), Messagerie | Gestion des Matières, Programmer un cours, Gestion des Devoirs, Export des notes |

La bannière "🔴 Cours en Live" (`#liveBanner`, espace étudiant) reste visible
en permanence, quel que soit l'onglet ouvert, puisqu'elle est placée en
dehors des `.tab-page`.

## Nouveau : Messagerie instantanée (Prof ↔ Étudiant, Prof ↔ Admin)

Nouvelle collection Firestore **`messages`**. Chaque document représente un
message d'une conversation à 2 personnes :

```
{ participants: ["admin@uew-ecampus.edu.gh", "lecturer.acctfin@uew-ecampus.edu.gh"], from: "lecturer.acctfin@uew-ecampus.edu.gh",
  to: "admin@uew-ecampus.edu.gh", fromRole: "lecturer", toRole: "admin",
  texte: "Bonjour, ...", date: "2026-09-15T10:00:00.000Z", lu: false }
```

`participants` est un tableau trié des 2 emails : c'est ce qui permet de
retrouver toujours le même fil entre 2 personnes (`idConversation` dans
`script.js`) et d'écouter en temps réel uniquement les messages qui
concernent l'utilisateur connecté (`where('participants', 'array-contains', currentUser.email)`).

### Qui peut discuter avec qui

- **Étudiant** (`student.html`) : discute uniquement avec les **professeurs
  de sa propre filière**.
- **Professeur** (`lecturer.html`) : discute avec les **étudiants de sa filière**
  ET avec l'**administration** (tous les comptes admin), regroupés en 2
  listes dans le panneau de contacts.
- **Admin** (`admin.html`) : discute avec l'ensemble des **professeurs**.

Un étudiant ne peut pas discuter directement avec un admin (et inversement) :
ce n'était pas demandé, seuls les canaux Prof↔Étudiant et Prof↔Admin existent.

### Fonctionnement

Chaque page concernée affiche une section **"💬 Messagerie"** avec la liste
des contacts à gauche (badge rouge = nombre de messages non lus) et la
conversation active à droite. Les messages arrivent instantanément grâce à
`onSnapshot` (comme le Live des cours), avec un petit son + une notification
navigateur pour tout nouveau message reçu. Ouvrir une conversation marque
automatiquement ses messages comme lus.

### Sécurité

Comme pour `matieres`, les règles Firestore actuelles
(`allow read, write: if request.auth != null`) couvrent automatiquement la
nouvelle collection `messages` — aucune modification de `firestore.rules`
n'était nécessaire.

## Nouveau : Police unifiée sur les 3 espaces (admin / prof / étudiant)

Les 3 espaces utilisaient déjà la même police système par défaut, mais avec
de petites variations selon le navigateur/OS des utilisateurs. Une police
web unique ("Poppins", chargée depuis Google Fonts dans le `<head>` de
chaque page) est maintenant appliquée à tous les textes, formulaires et
boutons via la variable CSS `--font-app` dans `style.css`, avec un repli sur
la police système si Google Fonts est inaccessible. Résultat : l'apparence
du texte est désormais strictement identique, que l'on soit sur
`admin.html`, `lecturer.html` ou `student.html`.

## Nouveau : seul l'admin programme les cours, le prof ne fait que lancer le Live

Changement de workflow demandé : le formulaire **"📅 Programmer un cours"**
a été **retiré de `lecturer.html`**. Il n'existe plus que sur `admin.html`. Le
prof garde uniquement la section **"Mes Cours & Live"**, où il peut lancer
ou couper le Live des cours que l'admin a programmés pour lui.

### Le formulaire admin peut maintenant partir d'une matière

Le formulaire de l'admin **"📅 Programmer un cours"** propose un nouveau
menu déroulant **"Matière"** (`#coursMatiereAdmin`), rempli avec **toutes**
les matières existantes (avec le nom du prof attribué entre parenthèses,
ou "non attribuée"). En choisir une :

- préremplit automatiquement la **filière** et le **niveau/salle** du cours ;
- préremplit le **titre** du cours (si le champ est encore vide) ;
- affiche/masque automatiquement la case "Filières concernées" si la filière
  de la matière est "Tronc Commun" ;
- enregistre `matiereId` et `matiereNom` sur le document `cours` créé.

L'admin garde la possibilité de laisser "-- Saisie libre --" et de tout
choisir manuellement comme avant (filière, salle/niveau), pour les cours qui
ne correspondent à aucune matière du référentiel.

### Qui peut lancer le Live d'un cours ? (`coursGereParProf`)

Nouvelle fonction centrale dans `script.js`, utilisée partout où un prof
gère un cours (liste "Mes Cours & Live", bouton Lancer/Couper le Live,
liste et envoi des supports de cours) :

- Le prof doit être de la **même filière** que le cours (condition de base,
  inchangée).
- Si le cours **n'est rattaché à aucune matière** (créé en "saisie libre"
  par l'admin — notamment les cours de Tronc Commun), il reste géré par
  **tous les profs de la filière**, comme avant.
- Si le cours est rattaché à une matière **sans professeur attribué**, il
  reste géré par tous les profs de la filière (en attendant que l'admin
  fasse l'attribution).
- Si le cours est rattaché à une matière **avec un professeur attribué**,
  **seul ce professeur** voit le cours dans "Mes Cours & Live", peut lancer/
  couper son Live, et peut lui envoyer un support de cours. Les autres
  profs de la même filière ne le voient plus du tout dans leur espace.

### Supports de cours envoyés aux bons étudiants

Ce point était déjà correct avant cette mise à jour et n'a pas eu besoin
d'être changé : un support de cours est rattaché à un `coursId`, et
`afficherSupportsEtudiant()` ne montre à un étudiant que les supports dont
le cours le concerne réellement, via la même fonction centrale
`coursConcerneEtudiant()` utilisée pour les cours en Live (même niveau ET
(même filière, OU — pour un cours de Tronc Commun — filière listée dans les
"filières concernées" du cours)). Ce qui a changé avec cette mise à jour,
c'est le menu déroulant **côté prof** pour choisir le cours auquel
rattacher un support (`#supportCours`) : il ne liste plus que les cours que
le prof **gère réellement** (voir `coursGereParProf` ci-dessus), au lieu de
tous les cours de sa filière.

**Non traité (hors demande) :** les **devoirs** restent liés à une seule
filière (pas de notion de tronc commun, pas de notion de matière/prof
attribué) — dites-moi si vous voulez la même logique pour eux.

## Nouveau : import de plusieurs matières en une fois depuis un PDF ou un Word

Jusqu'ici l'admin devait créer les matières une par une (nom + filière + niveau).
Un second bloc a été ajouté juste sous le formulaire habituel, dans
**"📘 Gestion des Matières"** (`admin.html`) :

1. L'admin choisit une **filière** et un **niveau** (ceux qui s'appliqueront à
   toutes les matières importées).
2. Il dépose un fichier **PDF ou Word (.docx)** contenant la liste des
   matières, **une par ligne** (des puces `-`, `•` ou une numérotation
   `1.`/`1)` en début de ligne sont automatiquement retirées).
3. Clic sur **"🔍 Analyser le fichier"** → le texte est lu directement dans
   le navigateur (bibliothèques `pdf.js` pour le PDF, `mammoth.js` pour le
   `.docx`, ajoutées dans `admin.html`), les lignes vides/doublons sont
   filtrées, et la liste des matières détectées s'affiche avec une case à
   cocher par matière (toutes cochées par défaut — l'admin peut décocher
   celles à ne pas créer).
4. Clic sur **"✅ Créer les matières cochées"** → chacune est ajoutée à la
   collection Firestore `matieres` (sans professeur attribué, comme pour une
   création manuelle) ; l'admin les attribue ensuite à un professeur depuis
   la liste juste au-dessus, comme avant.

**Limites à connaître :**
- Le format `.doc` (ancien Word, avant 2007) n'est pas lisible par
  `mammoth.js` : il faut l'enregistrer en `.docx` ou en PDF avant l'import.
- Un PDF scanné (image, sans texte sélectionnable) ne contient pas de texte
  extractible — seuls les PDF "texte" fonctionnent.
- Toutes les matières importées en une fois partagent la même filière et le
  même niveau ; pour un fichier qui mélange plusieurs filières/niveaux,
  importez-le plusieurs fois (une fois par filière/niveau), ou séparez-le en
  plusieurs fichiers.

### Corrections apportées à cet import (relecture data/code)

1. **Bug bloquant sur les PDF (extraction de texte) :** `pdf.js` ne renvoie
   pas des "lignes" de texte mais des fragments positionnés par coordonnées
   (x, y) sur la page. Le code initial les recollait tous avec un simple
   espace, sans jamais réinsérer de retour à la ligne : toutes les matières
   d'une page PDF finissaient fusionnées en une seule chaîne géante, rejetée
   par le filtre de longueur (≤ 80 caractères) → **aucune matière n'était
   jamais détectée dans un vrai PDF**. Corrigé en reconstituant les lignes à
   partir de la coordonnée Y de chaque fragment (les fragments partageant
   la même hauteur, à 2px près, forment une ligne).
2. **Doublons non détectés contre la base existante :** le code ne
   dédoublonnait qu'à l'intérieur du fichier importé, pas contre les
   matières déjà créées en base pour la même filière/niveau — un import
   répété du même fichier créait des doublons Firestore. Une comparaison
   insensible aux accents/à la casse (`normaliserNomMatiere`) coche
   maintenant automatiquement "à ne pas créer" (décochée par défaut, avec
   la mention *"déjà existante"*) toute matière détectée qui existe déjà
   pour cette filière/ce niveau ; le dédoublonnage interne au fichier utilise
   la même normalisation (avant, "Économie" et "economie" auraient compté
   comme deux matières différentes).

### Bug corrigé au passage

Le menu déroulant "Envoyer un Support de Cours" (`#supportCours`, page prof)
n'était rempli qu'une seule fois, **avant** que les cours n'aient fini de
charger depuis Firestore (chargement asynchrone) : il restait donc souvent
vide. Il est maintenant réactualisé à chaque mise à jour temps réel des
cours (`rafraichirVuesLieesAuxCours`), comme le sont déjà les autres menus
déroulants du même type.

## Relecture de code (sécurité) : faille XSS stockée corrigée

Toutes les valeurs saisies par un utilisateur (titre de cours/devoir, nom
de matière, nom de fichier, nom/prénom, email, lignes détectées dans un
PDF/Word importé...) étaient insérées **directement** dans le HTML des
pages (`innerHTML`) sans aucun échappement. Concrètement, un professeur ou
un admin qui tapait (ou important un fichier contenant) quelque chose comme
`<img src=x onerror=alert(1)>` dans un titre de cours aurait vu ce code
s'exécuter dans le navigateur de **tous les étudiants** qui consultent
ensuite ce cours (faille XSS stockée) — un simple champ texte devenait un
vecteur d'attaque contre les autres comptes de la plateforme.

Une fonction `escapeHtml()` a été ajoutée et appliquée à tous les endroits
où une donnée saisie par un utilisateur (ou extraite d'un fichier importé)
est réinjectée dans une page : listes d'utilisateurs, de cours, de devoirs,
de matières, de supports, de copies déposées, bannière de live, classe de
l'étudiant, aperçus d'import. Les données qui viennent uniquement de
`FILIERES`/`NIVEAUX` (fixées dans le code, jamais saisies par un utilisateur)
n'ont pas besoin de cet échappement et n'y sont pas soumises.

## Nouveau : créer plusieurs utilisateurs à la fois (Excel/CSV)

Dans **"👥 Gestion des Utilisateurs"** (`admin.html`), sous le formulaire
habituel (un utilisateur à la fois) :

1. **"📄 Télécharger le modèle (.xlsx)"** génère un fichier Excel avec les
   colonnes `Nom`, `Prenom`, `Matricule`, `Email`, `Role`, `Filiere`,
   `Niveau`, `Mot de passe`, quelques lignes d'exemple, et un second onglet
   rappelant les codes valides (rôles, codes de filière, niveaux 1 à 5).
2. L'admin remplit une ligne par utilisateur (`Role` = `admin`, `prof` ou
   `etudiant` ; `Filiere` obligatoire sauf pour un admin ; `Niveau`/`Nom`/
   `Prenom`/`Matricule` obligatoires uniquement pour un étudiant), puis
   dépose le fichier via le champ juste en dessous.
3. **"🔍 Analyser le fichier"** relit chaque ligne (format Excel ou CSV, via
   `SheetJS`, déjà utilisé pour l'export des notes), et affiche un aperçu
   avec une case à cocher par ligne :
   - lignes valides → cochées par défaut ;
   - lignes en erreur (email invalide, mot de passe manquant, rôle/filière/
     niveau invalide, nom/prénom manquant pour un étudiant, email déjà
     utilisé en base ou en double dans le fichier) → grisées et décochées,
     avec le détail de l'erreur affiché à la place de la ligne.
4. **"✅ Créer les utilisateurs cochés"** crée uniquement les lignes valides
   restées cochées, par lots Firestore (`batch`) de 400 pour rester
   largement sous la limite de 500 écritures par lot.

**Limite à connaître :** comme pour la création d'un utilisateur au compte-
goutte, les mots de passe du fichier sont stockés tels quels dans Firestore
(voir la section sécurité plus haut dans ce guide) — ne partagez/ne stockez
pas ce fichier au-delà de l'import.

## Mise à jour : import illimité (100+ utilisateurs) + mot de passe optionnel

Deux ajustements pour un usage réel en début d'année scolaire, où l'admin
importe une centaine d'étudiants d'un coup :

1. **Le mot de passe devient optionnel** dans le fichier importé. S'il est
   laissé vide, un mot de passe aléatoire de 8 caractères (sans caractères
   ambigus comme `0`/`O` ou `1`/`l`/`I`) est généré automatiquement pour
   chaque ligne. Après la création, un bouton **"📥 Télécharger les
   identifiants (.xlsx)"** apparaît : il exporte nom/prénom/email/rôle/
   filière/niveau/mot de passe de **tous les utilisateurs qui viennent d'être
   créés**, pour que l'admin puisse les distribuer (impression, envoi par
   classe, etc.). Sans ça, importer 100 étudiants obligeait à inventer 100
   mots de passe à la main dans le fichier — pas réaliste.
2. **Aucune limite de taille de fichier n'était en réalité bloquante**, mais
   c'était non vérifié : le découpage en lots Firestore (déjà en place,
   400 écritures par lot pour rester sous la limite de 500 imposée par
   Firestore) a été testé avec un jeu de 150 lignes (mélange étudiants/
   profs/admin, avec doublons et email invalide volontaires) : validation
   de tout le fichier en ~15 ms, doublons et erreurs bien détectés, un seul
   lot Firestore nécessaire. Une confirmation (`confirm()`) est maintenant
   demandée avant de lancer une création de plus de 30 utilisateurs d'un
   coup, pour éviter un clic accidentel, et l'aperçu affiche une progression
   ("Création en cours (X / Y)") pendant l'écriture des lots.
3. **Correction annexe :** nom/prénom saisis pour un admin ou un professeur
   dans le fichier étaient silencieusement ignorés (le code ne les
   enregistrait que pour le rôle "etudiant"). Ils sont maintenant conservés
   pour n'importe quel rôle s'ils sont fournis (utile pour l'affichage dans
   "Gestion des Utilisateurs", qui préfère déjà afficher "Prénom Nom"
   quand disponible).

---

## Nouveau : plateforme d'inscription en ligne (candidats externes)

Un candidat qui n'est pas encore étudiant peut déposer son dossier lui-même,
sans compte, depuis la page publique **`registration.html`** (lien ajouté sur la
page de connexion).

### Ce que le candidat saisit

| Bloc | Champs |
|---|---|
| État civil | Nom\*, Prénom(s)\*, Date de naissance\*, Lieu de naissance\*, Genre\*, Nationalité\* |
| Pièce d'identité | Type de pièce et Numéro — **facultatifs** : un candidat sans pièce reste recevable |
| Contact | Email personnel\*, Téléphone\* |
| Formation | Filière souhaitée\*, Niveau souhaité\* |

Contrôles effectués avant envoi : champs obligatoires, date de naissance
cohérente (pas dans le futur, âge plausible), et type de pièce exigé dès qu'un
numéro de pièce est saisi.

### Le numéro de dossier

À l'envoi, le candidat reçoit un numéro du type `UEW-APP-2026-4F7K2P`.
Ce numéro **est l'identifiant du document Firestore** : le suivi en ligne lit
donc directement *ce* dossier (`get`), sans jamais parcourir la collection.
Le suffixe aléatoire empêche de deviner le numéro d'un autre candidat.

Pour consulter son dossier, le candidat fournit **son numéro + sa date de
naissance** : le numéro seul ne donne pas accès à l'état civil.

### Traitement par l'administrateur

Nouvel onglet **« Inscriptions en ligne »** dans l'espace admin (et une
statistique « Inscriptions en attente » sur l'accueil) :

- liste filtrable par statut (en attente / validées / refusées / toutes) ;
- fiche d'état civil complète pour chaque dossier ;
- signalement automatique des **doublons possibles** (mêmes nom, prénom et date
  de naissance) avant de créer deux comptes pour la même personne ;
- deux listes déroulantes permettent de **corriger la filière et le niveau**
  avant validation (le vœu du candidat n'est qu'une demande) ;
- **Valider** crée immédiatement le compte étudiant avec :
  - un email de connexion `prenom.nom@uew-ecampus.edu.gh` (suffixé `2`, `3`... en
    cas d'homonymie),
  - un mot de passe provisoire aléatoire,
  - un **n° matricule** `UEW-<année>-NNNN` auto-incrémenté ;
- **Refuser** enregistre un motif, affiché au candidat dans son suivi ;
- **Exporter (.xlsx)** produit la liste des dossiers du filtre courant avec tout
  l'état civil (service scolarité / archivage).

Après validation, le candidat retrouve ses identifiants tout seul dans le suivi
de son dossier : aucun envoi manuel n'est nécessaire.

### Règles Firestore

`firestore.rules` contient désormais un bloc dédié à `inscriptions` qui valide
les dépôts publics : les champs d'état civil obligatoires doivent être présents,
le statut est forcé à `en_attente`, et un candidat ne peut pas s'attribuer un
`matricule` ni un `motDePasseProvisoire`. **N'oubliez pas de redéployer les
règles** (`firebase deploy --only firestore:rules`, ou copier-coller dans
Firebase Console > Firestore Database > Règles).

> **Limite connue, à traiter ensuite.** Tous les visiteurs sont authentifiés
> *anonymement* et les rôles vivent dans la collection `users`, que les règles ne
> peuvent pas consulter. Les règles ne savent donc pas distinguer un
> administrateur d'un visiteur : le `list` sur `inscriptions` reste ouvert à
> toute session anonyme, comme le reste de la base. Le correctif durable est de
> migrer les comptes vers Firebase Authentication et de poser un *custom claim*
> `role`, puis d'écrire les règles sur ce claim.

---

## Nouveau : période d'inscription (ouverture/fermeture décidée par l'admin)

Dans l'onglet **« Inscriptions en ligne »**, un nouveau panneau **« Période
d'inscription »** permet de fixer une date de début et une date de fin.
Laisser une date vide revient à ne pas fixer de borne de ce côté (ex : laisser
la fin vide pour une inscription ouverte jusqu'à nouvel ordre).

En dehors de cette période, la page publique `registration.html` masque le
formulaire et affiche :

> Désolés, nous ne pouvons pas donner suite à votre demande ! Veuillez
> contacter l'administration pour la réouverture de l'inscription.

### Où c'est stocké

Document Firestore `_config/inscriptions` : `{ dateDebut, dateFin,
debutAnnee/Mois/Jour, finAnnee/Mois/Jour }`. Les composantes numériques
existent uniquement pour que les **règles Firestore** puissent comparer des
dates (`timestamp.date(...)`) — la chaîne `dateDebut`/`dateFin` reste ce que
l'admin voit et modifie dans le formulaire.

### Vérification à deux niveaux

1. **Client** : `registration.html` masque le formulaire hors période (bonne
   expérience pour le candidat, message clair).
2. **Serveur (règles Firestore)** : la règle `create` sur `inscriptions`
   relit `_config/inscriptions` et refuse le dépôt si la date du jour est hors
   période — même si quelqu'un contourne le formulaire (appel direct à l'API
   Firestore). C'est le contrôle qui compte réellement ; le message côté client
   n'est qu'un confort d'affichage. **Pensez à redéployer les règles.**
