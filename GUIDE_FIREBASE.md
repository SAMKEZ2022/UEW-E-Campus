# UEW E-Campus — Setup & Deployment Guide

Platform for the **University of Education, Winneba (UEW)**: HTML/CSS/vanilla JS + Firebase (Firestore + anonymous Auth), installable as a PWA and usable offline / on 2G.

## 1. Project structure

| File | Purpose |
|---|---|
| `index.html` | Login page |
| `registration.html` | Public online registration + application tracking |
| `admin.html` | Administrator space (users, courses, lectures, assignments, exports) |
| `daas.html` | Academic Affairs & Registry (DAAS): approves/rejects online registrations, sets the registration period |
| `exams.html` | Examinations Office: score entry/import, transcripts, student academic record |
| `lecturer.html` | Lecturer space (live lectures, materials, assignment submissions) |
| `student.html` | Student space (live lectures, scores, assignments, class list, messages) |
| `script.js` | Single main script (all logic) |
| `firebase-config.js` | Firebase initialisation — web app keys (already filled in for `uew-e-campus`) |
| `firestore.rules` | Firestore security rules |
| `sw.js`, `offline.js`, `manifest.webmanifest` | Offline mode / PWA |

## 2. Firebase project

1. Open the [Firebase console](https://console.firebase.google.com/) and open (or create) the project **`uew-e-campus`**.
2. The web app keys are already filled in `firebase-config.js` for `uew-e-campus` (nothing to paste).
3. *Build > Firestore Database*: create the database.
4. *Build > Authentication > Sign-in method*: enable **Anonymous**.
5. *Firestore > Rules*: paste the content of `firestore.rules` and publish.

## 3. Deploy (Firebase Hosting)

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting,firestore
```

Each time you change a file, bump `VERSION` in `sw.js` (e.g. `'uew-v2'`) so phones refresh their cache.

## 4. First launch

Demo accounts have **public passwords** (they are written in `script.js` and below), so they are no longer created automatically on a live site.

* **Live site (production)**: open `https://<your-site>/index.html?setup=1` once. A single administrator account (`admin@uew-ecampus.edu.gh`) is created with a random password shown **once** in a pop-up: write it down. Do this right after the first deployment, then create the other accounts from the admin space.
* **Local tests / demo**: on `localhost`, or on the site with `index.html?demo=1`, the demo records and accounts below are created at the first login.

| Role | Email | Password |
|---|---|---|
| Admin | admin@uew-ecampus.edu.gh | Uew2026#Admin |
| DAAS | daas@uew-ecampus.edu.gh | Uew2026#Daas |
| Examinations Office | exams@uew-ecampus.edu.gh | Uew2026#Exams |
| Lecturer (ICT) | lecturer.ict@uew-ecampus.edu.gh | Uew2026#LecICT |
| Student (Accounting & Finance) | student.accounting@uew-ecampus.edu.gh | Uew2026#StuAcc |

**Never keep the demo accounts on a live platform.**

## 5. Faculties, schools and departments

In the code a department is a `filiere`. Each department has 5 permanent Jitsi rooms (one per level).

| Faculty / School | Departments |
|---|---|
| Faculty of Applied Behavioural Sciences in Education | Psychology & Counselling; Special Education |
| School of Business | Accounting & Finance; Management Sciences; Marketing & Supply Chain Mgt |
| School of Communication and Media Studies | Journalism & Media Studies; Strategic Communication; Development Communication |
| School of Creative Arts | Graphic Design; Theatre Arts; Music Education; Art Education |
| School of Education and Life-Long Learning | Basic Education; Early Childhood Education; Adult & Continuing Education |
| Faculty of Science Education | ICT; Mathematics Education; Integrated Science Education |
| Faculty of Social Sciences Education | Economics Education; Geography Education; History & Political Science Education; Social Studies Education |
| Faculty of Foreign Languages Education | English Education; French Education |
| Faculty of Ghanaian Languages Education | Ghanaian Languages Education |

Plus a pseudo-department **Common Courses** for lectures shared by several departments.

To add or rename a department, edit `POLES` and `FILIERES_DATA` at the top of `script.js`.

## 6. Levels, semesters and grading

* Levels: **Level 100, 200, 300, 400, Postgraduate** (internally 1 to 5), two semesters each (Sem 1 to Sem 10).
* Scores are out of **100** (`NOTE_MAX`), pass mark **50** (`NOTE_PASS`). Letter grades in `getMention()`: A ≥ 80, B+ 75–79, B 70–74, C+ 65–69, C 60–64, D+ 55–59, D 50–54, F < 50. **Check these bands against the current UEW regulations** and adjust `getMention()` if needed.
* Courses belong to a *module* and carry *credit hours*; credit hours are earned only when the pass mark is reached.

## 7. Roles

`admin`, `daas`, `exams`, `lecturer`, `student` (role value = name of the page opened after login).

Bulk user import (Excel/CSV): download the template from the admin space. Accepted column names: `Last name`, `First name`, `Index No.`, `Email`, `Role`, `Department`, `Level`, `Password` (the previous French headings are still accepted). Department codes (e.g. `ict`, `accounting_finance`) are listed in the "Codes to use" sheet.

## 8. Online registration

Applicants fill in `registration.html`, receive an application number (`UEW-REG-<year>-XXXXXX`) and follow their file with it + their date of birth. The DAAS approves → the student account is created (index number `UEW-<year>-NNNN`, login `firstname.lastname@uew-ecampus.edu.gh`, temporary password). The registration period is set in the DAAS space and enforced by `firestore.rules`.

## 9. Security note

All visitors are signed in anonymously and roles live in the `users` collection, which Firestore rules cannot read. For real lock-down, move accounts to Firebase Authentication with a `role` custom claim and tighten `firestore.rules` accordingly.
