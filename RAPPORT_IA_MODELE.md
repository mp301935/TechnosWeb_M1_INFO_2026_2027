# Rapport d'usage de l'IA - TP1, TP2 et TP3

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par l'élève; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que l'élève sait maintenant expliquer sans l'agent.

> **Élève** : *(à compléter par l'élève — nom, prénom)*
> **Assistant IA utilisé** : Claude (modèle `claude-sonnet-5`, exécuté ici en mode agentique dans un environnement Claude Code / Claude Agent SDK relié au dépôt GitHub `mp301935/technosweb_m1_info_2026_2027`), pas en simple chatbot web — l'assistant a lu et modifié directement les fichiers du dépôt, exécuté des commandes (`npm install`, `npm run build`, `node --test`) et lu leur sortie.
> **Réponse à la question du sujet « quel modèle utilisez-vous ? »** : `claude-sonnet-5`. Le modèle réellement utilisé pour une réponse donnée peut différer légèrement (bascule automatique côté fournisseur), l'identifiant ci-dessus est celui déclaré à la session.
> **Réponse à « comment savoir combien de tokens ont été consommés ? »** : selon `CONSEILS_POUR_UTIISER_ASSISTANT_AI.md` §10, cela dépend de l'outil : les offres API affichent la consommation dans le tableau de bord du fournisseur, certains outils CLI/desktop affichent un compteur ou une fenêtre de contexte dans la session ; à défaut, on peut demander à l'assistant d'indiquer la taille du contexte utilisé (une estimation, pas une mesure officielle).
> **Réponse à « qui peut conseiller le meilleur modèle pour une tâche donnée ? »** : l'assistant lui-même peut être interrogé pour comparer les modèles disponibles dans l'outil utilisé et recommander un niveau de raisonnement adapté (prompt fourni en exemple dans `CONSEILS_POUR_UTIISER_ASSISTANT_AI.md` §10) ; sinon, la documentation du fournisseur (Anthropic, OpenAI, Google) et l'enseignant.

---

## Mission 0 — Cartographier l'application

### Objectif

Repérer, **sans modifier le code**, les responsabilités de chaque fichier du
frontend fourni (composant racine, routes, `HttpClient`, modèles, services,
pages, mécanisme d'ajout du JWT) et produire un schéma annoté du flux
déclenché par un clic sur « Se connecter », puis distinguer dans
`API_CONTRACT.md` les routes publiques des routes protégées.

### Prompt principal

Prompt donné par l'utilisateur (traduit tel quel) : *« Fait moi en détaillant
chaque étape le SUJET_ETUDIANT_TP1, en écrivant nos interactions et ce que tu
fais dans RAPPORT_IA_MODEL »*, suivi d'un message *« continuer »* après que la
session a été reliée à l'ordinateur de l'utilisateur.

### Plan proposé par l'agent

1. Localiser et lire le vrai sujet (`SUJET_ETUDIANT_TP1.md`), le contrat
   d'API (`API_CONTRACT.md`), le README et les fichiers d'instructions
   (`AGENTS.md`, `CLAUDE.md`, `best-practices.md`) avant toute modification.
2. Explorer l'arborescence `frontend-starter/src` et `backend/src` en
   lecture seule pour identifier composant racine, routes, `HttpClient`,
   modèles, services, pages, garde de route et intercepteur JWT.
3. Rédiger un document séparé (`SCHEMA_FLUX_CONNEXION.md`) avec un schéma
   texte annoté du flux `composant → service → HttpClient → API Express →
   MongoDB` pour l'action « Se connecter », plus un tableau routes
   publiques/protégées et les réponses aux deux questions du sujet
   (routes utilisées, emplacement de la mise à jour du profil).
4. Ne rien modifier tant que la cartographie n'est pas terminée, conformément
   à la consigne « Sans modifier le code au début » de la Mission 0.

### Vérifications réalisées

- Lecture effective de chaque fichier cité dans `SCHEMA_FLUX_CONNEXION.md`
  (pas de suppositions sur un nom de méthode ou un chemin non lu).
- Confrontation du tableau des routes avec `API_CONTRACT.md` (aucune route
  inventée).
- Vérification croisée entre `backend/src/app.js` (signature JWT,
  `expiresIn: '2h'`, middleware `auth`) et `frontend-starter/.../auth.interceptor.ts`
  pour confirmer que l'ajout du `Bearer` correspond bien au contrat.
- *(À compléter par l'élève)* : relire `SCHEMA_FLUX_CONNEXION.md` et
  vérifier, dans les DevTools de votre propre navigateur, que la requête
  `POST /api/auth/login` réelle correspond bien au schéma décrit.

### Erreurs ou propositions rejetées

- Aucune proposition de code n'a été faite à ce stade : la Mission 0 est
  volontairement une phase de lecture, aucune modification n'a été rejetée
  car aucune n'a été tentée.
- Point de vigilance corrigé en cours de rédaction : le premier jet du
  schéma laissait entendre que l'intercepteur distinguait les routes
  publiques/protégées ; relecture faite pour préciser qu'il ajoute le
  `Bearer` dès qu'un token existe, sans distinction de route — la
  distinction vient simplement du fait qu'aucun token n'existe encore au
  moment des deux appels publics (`register`/`login`).

### Fichiers effectivement modifiés

Aucun fichier de code modifié. Fichier ajouté (documentation) :
- `SCHEMA_FLUX_CONNEXION.md` (nouveau).

### Preuve de fonctionnement

Sans objet pour cette mission (pas de code exécutable produit) : la preuve
est la cohérence du document avec le code réellement lu, vérifiable en
comparant chaque ligne du tableau de `SCHEMA_FLUX_CONNEXION.md` au fichier
qu'elle cite.

### Ce que l'élève sait maintenant expliquer sans l'agent

- Le trajet complet d'une requête de connexion :
  `LoginPageComponent.submit()` → `AuthService.login()` → `HttpClient` →
  `authInterceptor` → proxy Angular → route Express → MongoDB (via
  Mongoose) → réponse `{ token, user }` → `tap()` dans `AuthService` qui
  écrit `localStorage` et met à jour les Signals `token`/`currentUser`.
- Pourquoi le composant n'appelle jamais `HttpClient` directement (règle du
  sujet) et à quoi sert la couche `AuthService`.
- La différence entre une route publique (`/api/auth/*`) et une route
  protégée (toutes les autres, qui exigent `Authorization: Bearer <token>`).
- Où se trouve, très précisément, la mise à jour du profil utilisateur :
  `profile-page.ts` (`save()`) → `AuthService.update()` → `PUT
  /api/users/me` côté frontend ; route `PUT /api/users/me` dans
  `backend/src/app.js` côté serveur.

---

## Mission 1 — Inscription, connexion et profil

### Objectif

Compléter la partie utilisateur du frontend pour couvrir **tous** les points
listés dans le sujet, en particulier les deux points qui manquaient dans le
starter fourni : la gestion d'un `401` (token invalide ou expiré → retour
vers `/login`) et le bouton de déconnexion avec nettoyage de l'état local.

### État constaté avant modification (lecture du starter)

Avant toute modification, l'agent a vérifié ce qui existait déjà dans
`frontend-starter/src/app` :

| Exigence du sujet | Déjà présent dans le starter ? |
|---|---|
| Formulaires réactifs inscription/connexion | ✅ `login-page.ts`, `register-page.ts` |
| Appels `/api/auth/register` et `/api/auth/login` | ✅ via `AuthService` |
| Sauvegarde du JWT sans jamais l'afficher dans les logs | ✅ (`localStorage`, aucun `console.log(token)`) |
| Mise à jour du Signal `currentUser` | ✅ dans `storeAuthentication()` |
| Redirection après connexion/inscription réussie | ✅ `navigateByUrl('/tracks')` / `'/profile'` |
| Chargement de `/api/users/me` et `PUT /api/users/me` | ✅ `profile-page.ts` |
| Le composant ne doit pas appeler `HttpClient` directement | ✅ tout passe par `AuthService`/`TrackService` |
| **Bouton de déconnexion avec nettoyage de l'état local** | ❌ `AuthService.logout()` existait mais n'était appelé nulle part |
| **Gestion d'un 401 → retour vers `/login`** | ❌ aucun intercepteur ne traitait les erreurs |

Ce tableau a orienté le plan : ne toucher que ce qui manquait réellement,
conformément à `AGENTS.md` (« Propose une modification limitée à la mission
demandée ») et à `CONSEILS_POUR_UTIISER_ASSISTANT_AI.md` (« travailler par
petites étapes »).

### Prompt principal

Même prompt utilisateur que pour la Mission 0 (une seule demande globale
« fais le TP1 en détaillant chaque étape » couvrant les deux missions) ;
l'agent a lui-même découpé le travail en sous-étapes via une liste de tâches
(`TaskCreate`/`TaskUpdate`) plutôt que d'attendre des prompts séparés.

### Plan proposé par l'agent

1. Créer `shared/interceptors/unauthorized.interceptor.ts` : intercepteur
   fonctionnel qui capte les erreurs `401` (`catchError`), ignore le cas des
   routes `/api/auth/*` (un 401 sur `/login` = mauvais mot de passe, pas une
   session expirée), et sinon appelle `AuthService.logout()` puis redirige
   vers `/login`.
2. Enregistrer ce nouvel intercepteur dans `main.ts`, après `authInterceptor`.
3. Ajouter un `computed(() => this.token() !== null)` (`isAuthenticated`)
   dans `AuthService` pour piloter l'affichage réactif de l'en-tête.
4. Rendre `AppComponent` réactif à l'état de connexion : afficher
   « Connexion / Créer un compte » si déconnecté, ou « Backing tracks /
   Profil / nom de l'utilisateur / Déconnexion » si connecté ; le bouton
   « Déconnexion » appelle `auth.logout()` puis redirige vers `/login`.
5. Ajuster `styles.css` pour l'alignement du bouton dans la barre de
   navigation (détail visuel, pas fonctionnel).
6. Ne pas toucher à `backend/` ni à `API_CONTRACT.md` (aucune route
   modifiée), conformément à `frontend-starter/CLAUDE.md` et `AGENTS.md`.
7. Lancer `npm run build` dans `frontend-starter` (exigé par `AGENTS.md`
   après toute modification) et les tests fournis dans `backend` sans
   modifier ce dossier.

### Vérifications réalisées

- **Compilation** : `node -v` a d'abord montré `v22.22.2`, alors que
  `@schematics/angular@22.1.x` exige `^22.22.3 || ^24.15.0 || >=26.0.0`.
  L'agent a installé un Node 24 local (`npm install node@24` dans un dossier
  dédié, sans toucher au Node système) pour pouvoir exécuter le CLI Angular.
  Résultat de `npm run build` :

  ```text
  Application bundle generation complete. [5.323 seconds]
  Output location: frontend-starter/dist/gpc
  main.js  293.94 kB  (77.74 kB transféré estimé)
  styles.css 1.35 kB
  ```

  Aucune erreur TypeScript ni Angular.
- **Tests backend fournis** (lecture seule, aucun fichier backend modifié) :
  `node --test` → `tests 2, pass 2, fail 0` (le test « santé sans dépendre de
  MongoDB » et le test des schémas Mongoose passent sans connexion Atlas).
  Les autres scénarios (inscription/connexion réels contre une vraie base)
  nécessitent les identifiants MongoDB Atlas personnels de l'élève, que
  l'agent ne doit **jamais** recevoir (règle explicite du sujet et de
  `CONSEILS_POUR_UTIISER_ASSISTANT_AI.md` §9) : cette partie reste à faire
  par l'élève lui-même, avec son propre `backend/.env`.
- **Relecture du diff** (`git diff --stat`) : 5 fichiers modifiés, 2 fichiers
  ajoutés, aucun fichier hors `frontend-starter/src` touché.
- *(À compléter par l'élève)* : démarrer `backend` avec votre propre
  `.env`, démarrer `frontend-starter`, vous connecter avec
  `demo@example.com` / `Demo1234!`, cliquer sur « Déconnexion » et vérifier
  que vous êtes bien renvoyés vers `/login` et que `localStorage` ne
  contient plus `gpc_token` (onglet Application des DevTools).
  Vérifier aussi un cas de 401 réel : par exemple modifier temporairement
  (dans les DevTools, pas dans le code) la valeur de `gpc_token` dans
  `localStorage` avant de recharger `/profile`, puis observer la
  redirection automatique vers `/login`.

### Erreurs ou propositions rejetées

- Première tentative de `npm install` : échec (`Cannot read properties of
  null (reading 'edgesOut')`), causé par le `node_modules` du starter absent
  et un souci transitoire de résolution ; résolu en relançant avec
  `--legacy-peer-deps`.
- `npm run build` a d'abord échoué avec l'erreur explicite « The Angular CLI
  requires a minimum Node.js version of v22.22.3… » : le Node système du
  conteneur (22.22.2) était légèrement trop ancien. Plutôt que de modifier
  le Node système (hors du périmètre autorisé), l'agent a installé un Node
  24 isolé uniquement pour lancer les commandes CLI.
- Option envisagée puis écartée : centraliser aussi la construction des
  messages d'erreur (`error.error?.message`) dans un utilitaire partagé
  (`getErrorMessage`). Écartée pour cette mission afin de rester strictement
  dans le périmètre demandé (« gestion d'un 401 » et « bouton de
  déconnexion ») et de ne pas modifier plus de fichiers que nécessaire — une
  amélioration possible pour une itération suivante, à proposer et valider
  avec l'élève avant de l'appliquer.
- Aucune tentative de se connecter à une vraie base MongoDB Atlas ni de lire
  un fichier `.env` réel : conforme à l'interdiction explicite du sujet.

### Fichiers effectivement modifiés

- `frontend-starter/src/main.ts` — enregistrement du nouvel intercepteur.
- `frontend-starter/src/app/shared/services/auth.service.ts` — ajout du
  `computed` `isAuthenticated` (+ commentaires pédagogiques).
- `frontend-starter/src/app/components/app/app.ts` — injection de
  `AuthService`/`Router`, méthode `logout()`.
- `frontend-starter/src/app/components/app/app.html` — en-tête réactif
  (`@if (auth.isAuthenticated())`), bouton de déconnexion.
- `frontend-starter/src/styles.css` — alignement du bouton dans `nav`.

Fichier ajouté :
- `frontend-starter/src/app/shared/interceptors/unauthorized.interceptor.ts`
  (nouveau).

Fichiers **non modifiés** (vérifié) : tout `backend/`, `API_CONTRACT.md`,
`ATLAS_SETUP.md`, tous les modèles et le `TrackService`/`tracks-page`
(hors périmètre de la Mission 1 côté authentification).

### Preuve de fonctionnement

- Sortie complète de `npm run build` (ci-dessus) : compilation Angular sans
  erreur avec le code des deux intercepteurs et de l'en-tête réactif.
- Sortie de `node --test` côté backend (ci-dessus) : 2/2 tests fournis
  passent, confirmant que le contrat d'API n'a pas été cassé (aucun fichier
  backend modifié de toute façon).
- **Preuve manquante à ce stade, à produire par l'élève** : capture réelle
  de l'onglet Network (checkpoint du sujet) montrant une connexion réussie,
  une connexion refusée et une lecture/modification de `/api/users/me`,
  obtenues avec votre propre backend connecté à votre MongoDB Atlas. Cette
  preuve ne peut pas être produite par l'agent, qui n'a et ne doit pas avoir
  accès à vos identifiants MongoDB Atlas ni à un navigateur connecté à
  votre instance personnelle. **Ajoutez vos captures d'écran dans ce dépôt
  (par exemple dans un dossier `preuves/`) et liez-les ci-dessous :**
  - *(lien vers la capture « connexion réussie »)*
  - *(lien vers la capture « connexion refusée »)*
  - *(lien vers la capture « lecture/modification de /api/users/me »)*
  - *(lien vers la capture « redirection après 401 »)*

### Ce que l'élève sait maintenant expliquer sans l'agent

- Pourquoi un intercepteur qui gère les erreurs 401 doit explicitement
  **exclure** `/api/auth/*` (sinon un mauvais mot de passe déclencherait une
  déconnexion au lieu d'afficher le message d'erreur du formulaire).
- La différence entre `token` (Signal, source de vérité en mémoire,
  initialisé depuis `localStorage`) et `localStorage` lui-même (persistance
  brute, non réactive : lire `localStorage.getItem(...)` directement ne
  déclencherait aucune mise à jour du template).
- Pourquoi `isAuthenticated` est un `computed` et pas un `signal` séparé
  (il se recalcule automatiquement à partir de `token`, sans risque de
  désynchronisation).
- Ce que fait concrètement le bouton « Déconnexion » : suppression de
  `gpc_token` dans `localStorage`, remise à `null` des Signals `token` et
  `currentUser`, puis navigation vers `/login` — sans aucun appel HTTP
  (le JWT n'est jamais « révoqué » côté serveur dans ce TP, il devient
  simplement inutilisé côté client).
- Pourquoi l'agent n'a pas pu fournir la capture Network du checkpoint, et
  pourquoi ce n'est pas un oubli mais une conséquence directe de la règle de
  sécurité du sujet (ne jamais transmettre l'URI MongoDB ni le JWT à un
  assistant IA).

---

# TP2 — Bibliothèque, upload et lecture audio

> **Assistant IA utilisé pour le TP2** : Claude, identifiant de modèle déclaré
> pour cette session : `claude-opus-5-5` (le modèle réellement servi peut
> différer ; le TP1 avait été fait avec `claude-sonnet-5`). Même mode
> agentique : l'assistant a cloné le dépôt, lu et modifié les fichiers,
> exécuté `npm run build`, `node --test` et des tests navigateur, et lu leurs
> sorties.

## Journal des interactions (TP2)

| # | Qui | Message / action |
|---|---|---|
| 1 | Utilisateur | *« Fait les missions du TP2 toujours en détaillant ce que tu fais. Nous verrons par la suite s'il y a une erreur. Je voudrais également un plan de l'architecture que tu mettras dans le README. Et enfin je voudrais que tu fasses pour Schéma du flux — clic sur « Se connecter » dans Schema_flux_connexion.md un fichier xml à mettre dans draw.io afin d'avoir un diagram de séquence plus parlant. »* |
| 2 | Agent | Aucun fichier joint dans la session : l'agent a tenté d'accéder à l'ordinateur de l'utilisateur, puis a rattaché le dépôt GitHub du projet (`mp301935/technosweb_m1_info_2026_2027`) et l'a cloné. |
| 3 | Agent | Lecture de `SUJET_ETUDIANT_TP2.md`, `RAPPORT_IA_MODELE.md`, `SCHEMA_FLUX_CONNEXION.md`, `README.md`, `API_CONTRACT.md`, `backend/src/app.js`, `backend/src/models/*`, `frontend-starter/AGENTS.md`, `CLAUDE.md`, `best-practices.md` et de tout le code Angular concerné, **avant** toute modification. |
| 4 | Agent | Création d'une liste de 6 tâches (Mission 2, Mission 3, réponses écrites, architecture README, diagramme draw.io, vérifications + rapport). |
| 5 | Agent | Écriture du code (Missions 2 et 3), `npm run build` OK. |
| 6 | Agent | Tentative de lancer le vrai backend avec une MongoDB en mémoire (`mongodb-memory-server`) : **échec**, téléchargement du binaire MongoDB bloqué par le pare-feu de l'environnement. Repli : API simulée conforme au contrat + Chromium piloté par Playwright. |
| 7 | Agent | Les tests navigateur révèlent **un vrai bug** introduit par l'agent (rechargement de page à l'envoi) → corrigé ; puis 25/25 vérifications OK. |
| 8 | Agent | Rédaction de `TP2_ANALYSE_AUDIO.md`, du plan d'architecture du README (Mermaid validé par un rendu réel), du fichier `SCHEMA_FLUX_CONNEXION.drawio` (rendu vérifié avec le moteur officiel draw.io), puis de ce rapport. |
| 9 | Agent | `git push` impossible depuis la session (l'application GitHub Claude n'a pas le droit d'écriture sur le dépôt) : les fichiers sont remis à l'utilisateur pour qu'il les commite lui-même. |

---

## Mission 2 — Bibliothèque paginée

### Objectif

Afficher les pistes page par page en s'appuyant sur la pagination **serveur**
(`GET /api/tracks?page=…&limit=…`), sans modifier le backend et sans jamais
découper localement une liste complète.

### État constaté avant modification

| Exigence | Dans le starter ? |
|---|---|
| `TrackService.list(page, limit)` transmet `page` et `limit` | ✅ déjà (`params: { page, limit }`) — mais le composant n'envoyait pas `limit` explicitement |
| Signals `tracks`, `page`, `pages`, `loading` | ✅ |
| Signal d'**erreur** | ❌ absent : une erreur n'était visible que dans la console |
| `@for`, `@empty`, `@if` | ✅ (mais « Aucune piste » s'affichait aussi pendant le chargement) |
| Boutons « Précédent » / « Suivant » désactivés aux bornes | ⚠️ libellés « Préc. / Suiv. », test `page() === pages()` fragile, pas de désactivation pendant le chargement |
| Nouvelle requête à chaque changement de page | ✅ |

### Prompt principal

Même prompt global que ci-dessus (interaction n° 1) ; l'agent a découpé lui-même
le travail.

### Plan proposé par l'agent

1. Garder `TrackService.list(page, limit)`, le documenter, utiliser
   `HttpParams` et une constante `TRACKS_PAGE_SIZE = 5`.
2. Ajouter les Signals `error` et `total`, et les `computed` `hasPrevious` /
   `hasNext` pour désactiver les boutons.
3. `load()` : annule la requête précédente (évite qu'une réponse lente
   écrase une réponse récente), gère `finalize` pour `loading`, et corrige le
   cas où la page demandée n'existe plus (retour à la dernière page).
4. `go(target)` : ignore les pages hors bornes et les clics pendant un
   chargement, puis refait **une requête HTTP**.
5. Template : `@if (loading())`, `@if (error())` avec bouton « Réessayer »,
   `@for … @empty` (vide affiché seulement si ni chargement ni erreur),
   `<nav aria-label="Pagination des pistes">` avec « Précédent » / « Suivant ».

Options **AVANCÉ** (Angular Material Paginator, `aggregate-paginate-v2`) : non
réalisées. La première ajoute une dépendance lourde, la seconde modifie le
backend et le contrat, ce que le sujet réserve à une démarche volontaire du
l'élève. À décider par l'élève.

### Vérifications réalisées

- `npm run build` : OK, aucune erreur.
- Test navigateur (API simulée, 7 pistes) : page 1 = 5 cards, requête
  `/api/tracks?page=1&limit=5` ; clic « Suivant » → nouvelle requête
  `page=2&limit=5`, 2 cards ; « Précédent » désactivé en page 1, « Suivant »
  désactivé en page 2.
- *(À faire par l'élève)* : capture Network réelle montrant `page=1` puis
  `page=2` avec votre backend.

### Erreurs ou propositions rejetées

- Rejeté : charger toutes les pistes puis faire `slice()` en Angular
  (interdit par le sujet).
- Rejeté : modifier le backend pour renvoyer d'autres champs (hors mission).

### Fichiers effectivement modifiés

- `frontend-starter/src/app/shared/services/track.service.ts`
- `frontend-starter/src/app/components/tracks-page/tracks-page.ts`, `.html`, `.css`

### Preuve de fonctionnement

`preuves/tp2-simulation/01-page1.png`, `02-page2.png` et
`resultats-verifications.txt` (lignes « Page 1 », « Page 2 », « Nouvelle
requête HTTP avec page=2 »).

### Ce que l'élève sait maintenant expliquer sans l'agent

- Pourquoi la pagination est faite par MongoDB (`skip((page-1)*limit).limit(limit)`
  + `countDocuments`) et pas par Angular.
- Le rôle de chaque Signal (`tracks`, `page`, `pages`, `total`, `loading`,
  `error`) et pourquoi `hasPrevious`/`hasNext` sont des `computed`.
- Pourquoi on annule la requête précédente (`Subscription.unsubscribe()`)
  quand on change de page rapidement.

---

## Mission 3 — Analyse et amélioration de l'upload et de la lecture audio

### Objectif

Comprendre le mécanisme existant (upload multipart, lecture `Blob` +
`ObjectURL`, intercepteur JWT, contrôles backend), puis compléter
**uniquement ce qui manquait** côté frontend, sans changer le contrat HTTP.

### État constaté avant modification

| Exigence | Dans le starter ? |
|---|---|
| `FormData` avec `audio` + `title` | ✅ |
| Lecture via `HttpClient` + `Blob` + `ObjectURL`, révocation de l'ancienne URL | ✅ |
| Validation du fichier avant HTTP (type, 25 Mo) | ❌ |
| État de chargement pendant l'envoi, anti double-soumission | ❌ (bouton actif pendant l'envoi) |
| Affichage des erreurs serveur / message de succès | ❌ (console uniquement) |
| Vider le formulaire après succès | ⚠️ titre vidé mais **pas** le champ fichier |
| Recharger la page 1 | ✅ |
| Cards responsives et accessibles | ❌ simple liste ; taille affichée en « Ko » alors que le serveur envoie des **octets** |
| Morceau en cours, erreur audio compréhensible | ❌ |
| Révocation de l'ObjectURL finale à la destruction | ❌ fuite mémoire |

### Plan proposé par l'agent

1. Identifier les fichiers/méthodes et les contrôles backend (fait dans
   `TP2_ANALYSE_AUDIO.md` §1 et §4, avec numéros de ligne).
2. Créer `shared/validators/audio-file.validator.ts` : mêmes règles que
   Multer (liste MIME identique, 25 Mo, fichier présent et non vide),
   `accept` sur l'input.
3. Créer `shared/utils/http-error-message.ts` : extrait `message` du corps
   d'erreur, **y compris quand le corps est un `Blob`** (cas de la lecture
   audio en `responseType: 'blob'`).
4. Dans `TracksPage` : Signals `uploading`, `fileError`, `uploadError`,
   `uploadSuccess`, `selectedFile` ; `finalize` pour rétablir l'état ; remise
   à zéro du champ fichier via `viewChild`.
5. Créer un composant `track-card` (entrées `track`, `playing`,
   `loadingAudio`, sortie `play`) et un pipe `fileSize` ; grille CSS
   `auto-fill` pour le responsive ; `<ul>/<li>`, `aria-pressed`,
   `aria-live`, `role="alert"`/`"status"`, focus visible.
6. Lecteur : bloc « En cours de lecture », `(error)` de `<audio>` traduit en
   message lisible (codes `MediaError`), erreurs HTTP de lecture affichées,
   `DestroyRef.onDestroy` pour révoquer l'URL finale et annuler les requêtes.
7. Rédiger les réponses aux questions mémoire / buffering / streaming.

### Vérifications réalisées

- `npm run build` : OK après chaque étape.
- `node --test` (backend, **non modifié**) : 2 tests, 2 réussis.
- 25 vérifications automatiques dans Chromium (voir
  `preuves/tp2-simulation/resultats-verifications.txt`), dont :
  fichier `.txt` refusé avant tout appel HTTP ; erreur 400 serveur affichée
  (« Format audio non accepté (HTTP 400) ») ; bouton désactivé et « Envoi en
  cours… » pendant l'upload ; `Content-Type: multipart/form-data` ; Multer
  reçoit `champ fichier=audio(song1.mp3, audio/mpeg)` et
  `{"title":"Blues en La"}` ; formulaire vidé ; nouvelle piste en tête de la
  page 1 ; requête audio avec `Authorization: Bearer` ; réponse
  `audio/mpeg` ; `<audio src="blob:…">` ; ancienne URL révoquée ; piste d'un
  autre utilisateur → 404 ; appel sans en-tête (comme `<audio src>`) → 401 ;
  erreur de lecture lisible ; URL finale révoquée en quittant la page.
- Contrôle visuel des captures (ordinateur 1200 px et mobile 390 px).

### Erreurs ou propositions rejetées

- **Bug introduit par l'agent puis corrigé** : le formulaire d'upload
  utilisait `(ngSubmit)` sans `[formGroup]`. Sans directive de formulaire
  Angular, `ngSubmit` n'existe pas et le navigateur faisait une **soumission
  HTML native qui rechargeait la page**. Détecté par le test navigateur
  (la requête `POST` n'était jamais envoyée et la page `/tracks` était
  rechargée). Correction : `uploadForm = new FormGroup({ title })` +
  `[formGroup]="uploadForm"` + `formControlName="title"`.
- **Défaut de conception corrigé avant les tests** : la première version
  utilisait un seul Signal d'erreur pour la validation locale et les erreurs
  serveur, ce qui empêchait de **réessayer** le même fichier après une erreur
  serveur. Séparé en `fileError` (bloque le bouton) et `uploadError`
  (n'empêche pas un nouvel essai).
- **Limite de l'outil de test** : Chromium n'expose pas le corps d'une
  requête contenant un fichier (`postData` vide). La vérification des champs
  `audio`/`title` a donc été faite côté serveur (journal de Multer) plutôt
  que côté navigateur.
- **Non réalisé (facultatif)** : barre de progression, suppression avec
  confirmation, filtre par titre, image de couverture. Seul le formatage de la
  taille et de la date a été fait, car nécessaire aux cards.
- **Non modifié volontairement** : le backend (consigne du sujet), le contrat
  HTTP.

### Fichiers effectivement modifiés

Modifiés :
- `frontend-starter/src/app/components/tracks-page/tracks-page.ts`, `.html`, `.css`
- `frontend-starter/src/app/shared/services/track.service.ts`
- `frontend-starter/src/app/shared/models/track.model.ts` (ajout de `ownerId?`, commentaire « taille en octets »)

Ajoutés :
- `frontend-starter/src/app/components/track-card/track-card.ts`, `.html`, `.css`
- `frontend-starter/src/app/shared/validators/audio-file.validator.ts`
- `frontend-starter/src/app/shared/utils/http-error-message.ts`
- `frontend-starter/src/app/shared/pipes/file-size.pipe.ts`
- `TP2_ANALYSE_AUDIO.md` (analyse écrite et réponses aux questions)
- `preuves/tp2-simulation/*` (captures contre API simulée + résultats)

Non modifiés (vérifié par `git status`) : tout `backend/`, `API_CONTRACT.md`,
les intercepteurs, `AuthService`, les autres pages.

### Preuve de fonctionnement

- Build Angular sans erreur ; tests backend 2/2.
- `preuves/tp2-simulation/` : 8 captures + 25 vérifications « OK ».
- **Preuves restant à produire par l'élève** avec votre propre backend et
  votre MongoDB Atlas (l'agent n'y a pas accès, et ne doit pas y avoir
  accès) :
  - *(lien vers la capture Network de la pagination `page=1` → `page=2`)*
  - *(lien vers la capture Network de l'upload multipart `audio` + `title`)*
  - *(lien vers la capture de la lecture authentifiée : requête `…/audio` avec `Authorization`, réponse `audio/mpeg`)*
  - *(lien vers la capture d'un 404 en lisant la piste d'un autre compte)*

### Ce que l'élève sait maintenant expliquer sans l'agent

- Le trajet d'un upload (`FormData` → `HttpClient` → intercepteurs → proxy →
  Multer → disque + MongoDB) et d'une lecture (`HttpClient` → `Blob` →
  `ObjectURL` → `<audio>`).
- Pourquoi `<audio src="/api/...">` reçoit un 401 (pas d'en-tête
  `Authorization` possible, JWT dans `localStorage`).
- Pourquoi la validation frontend améliore l'expérience mais ne remplace
  jamais celle du backend.
- La différence entre streaming serveur (`res.sendFile`), téléchargement
  complet d'un `Blob` et buffering de `<audio>`.
- Pourquoi il faut révoquer une `ObjectURL`, et où c'est fait dans le code.
- Pourquoi `(ngSubmit)` a besoin de `[formGroup]` (bug rencontré).

---

## Demandes complémentaires du TP2

### Plan de l'architecture dans le README

- **Objectif** : donner une vue d'ensemble de l'application.
- **Fait** : section « Architecture de l'application » dans `README.md` :
  diagramme Mermaid (navigateur Angular → proxy → Express → MongoDB / disque),
  tableau des couches, arborescence commentée, résumé des 4 flux principaux.
  Image de secours `docs/architecture.png`.
- **Vérification** : le diagramme Mermaid a été rendu réellement avec
  `@mermaid-js/mermaid-cli` (syntaxe valide). Une première version en
  disposition horizontale était illisible (trop large) : passée en
  disposition verticale. Un libellé contenant des parenthèses a été mis entre
  guillemets pour éviter une erreur de syntaxe Mermaid.

### Diagramme de séquence draw.io du flux « Se connecter »

- **Objectif** : rendre plus parlant le schéma ASCII de
  `SCHEMA_FLUX_CONNEXION.md`.
- **Fait** : `SCHEMA_FLUX_CONNEXION.drawio` (XML draw.io), 10 lignes de vie
  (Utilisateur, `LoginPageComponent`, `AuthService`, `HttpClient`,
  `authInterceptor`, `unauthorizedInterceptor`, proxy, API Express, MongoDB,
  `localStorage`), 32 messages numérotés, retours en pointillés, fragment
  `alt` « identifiants corrects / incorrects », légende. Généré par un script
  Python pour des coordonnées exactes. Lien et aperçu PNG
  (`docs/sequence-connexion.png`) ajoutés dans `SCHEMA_FLUX_CONNEXION.md`.
- **Vérification** : XML validé par un parseur, puis rendu avec le moteur
  officiel de draw.io (`viewer-static.min.js` du dépôt `jgraph/drawio`) dans
  Chromium et contrôlé visuellement. Chaque message correspond à une ligne
  réellement lue dans `login-page.ts`, `auth.service.ts`, les deux
  intercepteurs et `backend/src/app.js`.
- **Point d'attention ajouté** (absent du schéma ASCII du TP1) :
  `http.post()` renvoie un Observable **froid** ; la requête ne part qu'au
  `subscribe()` du composant (messages 5 et 6). Et en cas d'échec, c'est
  `unauthorizedInterceptor` qui **laisse passer** le 401 de `/api/auth/login`
  (message 28).

---

# TP3 — Fiabilisation et enrichissement du frontend

> **Assistant IA utilisé pour le TP3** : Claude, identifiant de modèle déclaré
> pour cette session : `claude-opus-5-5` (le modèle réellement servi peut
> différer). Même mode agentique qu'aux TP1/TP2 : l'assistant a cloné le dépôt,
> lu et modifié les fichiers, exécuté `npm run build`, `npm test` (frontend et
> backend), un scénario navigateur, et lu leurs sorties.

## Journal des interactions (TP3)

| # | Qui | Message / action |
|---|---|---|
| 1 | Utilisateur | *« Fait moi le Sujet du TP3 en respectant les règles suivis jusqu'ici, si il y a des schémas à faire fait les en forme de diagram (séquence, ou autre) pas en txt. N'essaye rien de pousser dans le git donne moi les changemets et je pousserrais. Si tu as des questions sur le rendu ou autre pose les. »* |
| 2 | Agent | Aucun fichier joint : rattachement en lecture du dépôt GitHub du projet et clonage. Aucun dossier de l'ordinateur de l'utilisateur n'a été demandé. |
| 3 | Agent | Lecture **avant toute modification** de `SUJET_ETUDIANT_TP3.md`, de ce rapport (TP1/TP2), `README.md`, `CONSEILS_POUR_UTIISER_ASSISTANT_AI.md`, `API_CONTRACT.md`, `frontend-starter/AGENTS.md`, `CLAUDE.md`, `best-practices.md`, `backend/AGENTS.md`, `backend/CLAUDE.md`, `backend/best-practices.md`, `backend/src/*`, `backend/test/api.test.js`, de tout le code Angular concerné, de `TP2_ANALYSE_AUDIO.md` et `SCHEMA_FLUX_CONNEXION.md` (pour reprendre les conventions). |
| 4 | Agent → Utilisateur | Trois questions (outil de questions à choix) : **(a)** confirmation par `MatDialog` ou `window.confirm()` — le SnackBar imposé exige déjà Angular Material ; **(b)** faire ou non l'extension backend facultative ; **(c)** format des schémas. |
| 5 | Utilisateur | Réponses : **MatDialog**, **oui pour l'extension backend**, **Mermaid + PNG**. |
| 6 | Agent | Liste de 5 tâches (Mission 5, Mission 6, Mission 7, documents/diagrammes, vérifications + rapport). |
| 7 | Agent | Ajout d'Angular Material/CDK et de `jsdom`, configuration des tests, code des Missions 5 et 6, `npm run build` OK. |
| 8 | Agent | Écriture des tests frontend (33) et backend (13 nouveaux), tous verts ; **12 bugs introduits volontairement** pour vérifier que les tests les détectent (tous détectés). |
| 9 | Agent | Scénario navigateur : **découverte d'un vrai bug** (barre bloquée à 0 % — Angular 22 utilise `fetch` par défaut) → corrigé (`withXhr()`, `reportUploadProgress`), test de non-régression ajouté. Deux erreurs dans le script de test de l'agent lui-même corrigées. 28/28 vérifications OK. |
| 10 | Agent | Correction visuelle (police serif dans le dialogue et la SnackBar), rédaction de `TP3_ANALYSE.md` (4 diagrammes Mermaid rendus et contrôlés visuellement), mise à jour du README et de ce rapport. |
| 11 | Agent | Aucun `git commit` ni `git push` (consigne explicite de l'utilisateur) : les changements sont remis sous forme de patch. |

---

## Mission 5 — Suppression d'une piste

### Objectif

Ajouter la suppression d'une piste côté frontend (`DELETE /api/tracks/:id`,
déjà fourni par le backend) : confirmation, anti double clic, SnackBar, mise à
jour de la page, cas de la piste disparue ou d'un autre utilisateur.

### État constaté avant modification

| Exigence | Dans le code après TP2 ? |
|---|---|
| `TrackService.remove()` | ❌ absent |
| Bouton « Supprimer » dans la card | ❌ (la card n'avait que « Lire ») |
| Confirmation, état de suppression, SnackBar | ❌ (Angular Material non installé) |
| Rechargement de la page courante | ✅ `load()` existait déjà et gérait le cas « page devenue vide » |
| Route backend protégée par JWT + propriétaire | ✅ `app.delete(...)` avec `findOneAndDelete({ _id, ownerId })` |

### Prompt principal

Prompt global de l'interaction n° 1, complété par les réponses n° 5.

### Plan proposé par l'agent

1. `TrackService.remove(id)` → `http.delete('/api/tracks/' + encodeURIComponent(id))`.
2. `TrackCard` : entrée `deleting`, sortie `remove`, bouton désactivé pendant la requête. Aucun appel HTTP dans la card.
3. `ConfirmDialogComponent` générique (MatDialog), focus initial sur « Annuler ».
4. `NotificationService` qui enveloppe `MatSnackBar` (testable par un faux).
5. `TracksPage` : `confirmRemove()` → dialogue → `remove()` ; Signal `deletingIds` ; `204` → SnackBar + `load()` ; `404` → SnackBar explicite + `load()` ; autres erreurs → message du serveur ; arrêt du lecteur si la piste supprimée était en lecture.
6. Ne pas toucher au backend ni au contrat.

### Vérifications réalisées

- `npm run build` : OK.
- Tests de composant (`tracks-page.spec.ts`) : confirmation avant appel, URL et méthode, bouton désactivé, une seule requête en cas de double clic, annulation sans requête, 404 et 500.
- Tests backend : 401 sans JWT / JWT invalide, 404 et fichier intact pour la piste d'un autre utilisateur, 204 et fichier supprimé pour la propriétaire.
- Navigateur (API simulée) : focus, Échap, retour du focus, une seule requête `DELETE` malgré un double clic, `Authorization` présent, rechargement, piste « fantôme » retirée après 404.
- *(À faire par l'élève)* : captures Network réelles (voir `TP3_ANALYSE.md` § 5).

### Erreurs ou propositions rejetées

- **Rejeté** : retirer seulement la card du tableau local après suppression. Total, nombre de pages et contenu de la page auraient été faux ; on recharge depuis le serveur, comme pour la pagination du TP2.
- **Rejeté** : `window.confirm()` (choix de l'utilisateur pour MatDialog : cohérent avec la SnackBar, accessible, testable).
- **Rejeté** : distinguer « piste supprimée » et « piste d'un autre utilisateur » côté frontend. Le backend renvoie volontairement `404` dans les deux cas pour ne rien révéler ; le message couvre les deux.
- **Corrigé** : texte du dialogue et de la SnackBar en police serif (le thème Material attend Roboto, non chargée) → jetons CSS de police dans `styles.css`.

### Fichiers effectivement modifiés

Ajoutés : `components/confirm-dialog/confirm-dialog.{ts,html,css}`, `shared/services/notification.service.ts`, `shared/models/confirm-dialog-data.model.ts`.
Modifiés : `shared/services/track.service.ts`, `components/track-card/track-card.{ts,html,css}`, `components/tracks-page/tracks-page.{ts,html,css}`, `src/styles.css`, `angular.json` (thème Material), `package.json` / `package-lock.json` (`@angular/material`, `@angular/cdk`).
Non modifiés : tout `backend/src`, `API_CONTRACT.md` (route inchangée).

### Preuve de fonctionnement

`preuves/tp3-simulation/01` à `05-*.png` et `resultats-verifications.txt`. Captures réelles à ajouter par l'élève :
- *(lien vers la capture Network : DELETE après confirmation → 204, puis GET de la liste)*
- *(lien vers la capture Network : DELETE → 404 depuis un second onglet)*

### Ce que l'élève sait maintenant expliquer sans l'agent

- Pourquoi la card émet un événement au lieu d'appeler le service, et pourquoi la page passe par `TrackService`.
- Pourquoi un `Set` d'identifiants plutôt qu'un booléen pour l'état de suppression.
- Pourquoi le guard et le bouton ne protègent rien, et comment `auth` + `findOneAndDelete({ _id, ownerId: req.auth.sub })` protègent la suppression.
- Pourquoi un `404` déclenche un rechargement de la liste.

---

## Mission 6 — Progression de l'upload

### Objectif

Afficher la progression de l'upload avec les événements HTTP d'Angular et
distinguer : aucun upload, upload en cours avec pourcentage, réussite, échec.

### Plan proposé par l'agent

1. `TrackService.upload()` renvoie `Observable<HttpEvent<Track>>` (`observe: 'events'`, `reportUploadProgress: true`).
2. Type `UploadState` (union discriminée) + fonction pure `uploadStateFromEvent()` (testable sans Angular).
3. Un seul Signal `uploadState` dans `TracksPage` (remplace `uploading`, `uploadError`, `uploadSuccess` du TP2) ; `uploading` devient un `computed`.
4. `mat-progress-bar` (déterminée, ou indéterminée si la taille totale est inconnue), état « 100 % → enregistrement par le serveur ».
5. Région `aria-live` seulement pour succès/erreur (annoncer chaque pourcentage serait trop bruyant).
6. Contrôles désactivés, garde anti double soumission, annulation de l'upload si on quitte la page.

### Vérifications réalisées

- Tests : 6 tests de `uploadStateFromEvent`, 3 tests de composant (progression 40 % puis 100 % puis succès, erreur 400 puis réessai, fichier invalide sans requête), test du service (options et `FormData`).
- Navigateur : débit d'envoi limité ; pourcentages observés 0, 3, 5, … 98 %, puis « Fichier transmis… », puis succès ; `role="progressbar"` avec `aria-valuenow` ; un seul `POST`.

### Erreurs ou propositions rejetées

- **Bug réel introduit par l'agent puis corrigé** : première version avec `reportProgress: true` (habitude des versions précédentes d'Angular). Tous les tests unitaires passaient, mais dans le navigateur la barre restait à **0 %** pendant 4,7 s puis passait au succès. Diagnostic en lisant le code d'Angular dans `node_modules/@angular/common` : **depuis Angular 22, `HttpClient` utilise `fetch` par défaut**, qui ne fournit pas la progression d'un envoi ; `reportProgress` est déprécié. Correction : `withXhr()` dans la configuration, option `reportUploadProgress: true` (avec `fetch`, Angular lèverait alors l'erreur claire NG02824), configuration déplacée dans `app.config.ts` et test `app.config.spec.ts` ajouté. Leçon : les tests unitaires remplacent le backend HTTP, ils ne pouvaient pas voir ce problème.
- **Défaut d'affichage corrigé** : « 30 %(1 Mo / 3,4 Mo) » sans espace (Angular supprime les espaces entre éléments) → marge CSS.
- **Rejeté** : annoncer chaque pourcentage aux lecteurs d'écran.

### Fichiers effectivement modifiés

Ajoutés : `shared/models/upload-state.model.ts`, `shared/utils/upload-state.ts`, `src/app/app.config.ts`.
Modifiés : `shared/services/track.service.ts`, `components/tracks-page/*`, `src/main.ts` (utilise `appConfig`).

### Preuve de fonctionnement

`preuves/tp3-simulation/06` à `09-*.png`. À ajouter par l'élève :
- *(lien vers la capture Network de l'upload avec un débit réduit)*

### Ce que l'élève sait maintenant expliquer sans l'agent

- La suite d'événements `Sent` → `UploadProgress`… → `ResponseHeader` → `Response`, et le calcul `round(100 × loaded / total)`.
- Pourquoi 100 % ne signifie pas « enregistré ».
- Pourquoi `withXhr()` est obligatoire avec Angular 22 pour la progression d'un envoi.
- Pourquoi un seul Signal d'état évite les états incohérents.

---

## Mission 7 — Tests automatisés

### Objectif

Au moins trois tests frontend utiles, sans backend ni MongoDB ; extension
backend facultative sans modifier les routes.

### Plan proposé par l'agent

1. Configurer `ng test` (Vitest, déjà présent) : `tsconfig.spec.json`, exclusion des specs du build, cible `test` reliée au build, `jsdom`.
2. Tests de services avec `HttpTestingController` (URL, méthode, paramètres, corps, headers).
3. Tests des intercepteurs branchés comme dans l'application, et du guard.
4. Tests de composant de `TracksPage` (vrai service, faux backend HTTP, faux dialogue, fausse SnackBar).
5. Backend : nouveau fichier `api-contract.test.js` avec `node:test` et `t.mock.method` sur le modèle `Track`.
6. Vérifier que les tests **échouent** quand on introduit un bug.

### Vérifications réalisées

- Frontend : `Test Files 7 passed, Tests 33 passed`.
- Backend : `tests 15, pass 15, fail 0` (2 existants + 13 nouveaux), aucune route modifiée (`git status` : seul le fichier de test est nouveau dans `backend/`), dossier `data/uploads` laissé vide après les tests.
- 12 bugs introduits volontairement puis retirés : tous détectés (tableau dans `TP3_ANALYSE.md` § 4.4).

### Erreurs ou propositions rejetées

- `ng test` échouait d'abord : « Configuration 'development' for target 'build' … is not set » → cible `test` reliée à `gpc:build`.
- Ajout du test « fichier > 25 Mo », demandé par `backend/best-practices.md`, en plus de la liste du sujet.
- **Rejeté** : `mongodb-memory-server` (téléchargement d'un binaire MongoDB, bloqué au TP2) ; on simule les méthodes du modèle, ce qui suffit pour vérifier le contrat.

### Fichiers effectivement modifiés

Ajoutés : 7 fichiers `*.spec.ts` (frontend), `backend/test/api-contract.test.js`, `frontend-starter/tsconfig.spec.json`.
Modifiés : `angular.json`, `tsconfig.json`, `tsconfig.app.json`, `package.json` (`jsdom`).
Non modifié : `backend/test/api.test.js`.

### Preuve de fonctionnement

Sorties de `npm test` ci-dessus ; rapport des tests (attendu / observé) dans `TP3_ANALYSE.md` § 4.

### Ce que l'élève sait maintenant expliquer sans l'agent

- Le rôle de `provideHttpClientTesting`, `expectOne`, `flush`, `event`, `verify`.
- Pourquoi les tests n'ont besoin ni du backend ni de MongoDB.
- Ce que vérifient un test d'intercepteur et un test de guard.
- La différence entre test unitaire et test d'intégration, illustrée par le bug `fetch`.

---

## Demandes complémentaires du TP3

- **Schémas en diagrammes** (demande de l'utilisateur) : 4 diagrammes Mermaid dans `TP3_ANALYSE.md` (séquence de la suppression, séquence de l'upload avec progression, diagramme d'états de l'upload, architecture des tests), rendus en PNG dans `docs/tp3-*.png` avec `@mermaid-js/mermaid-cli` (syntaxe validée) et contrôlés visuellement. Le diagramme d'architecture du README a été mis à jour (ConfirmDialog, NotificationService, `withXhr`, `remove`) et `docs/architecture.png` régénéré.
- **Pas de push** : aucun commit ni push effectué par l'agent.

---

## Environnement d'exécution (pour traçabilité)

- Dépôt cloné dans un conteneur cloud isolé, relié également à l'ordinateur
  Windows de l'utilisateur (session « linked device »), sans qu'aucun
  dossier local personnel n'ait été demandé ni utilisé.
- Node système : `v22.22.2` (insuffisant pour le CLI Angular 22) ; Node
  local additionnel `v24.21.0` utilisé uniquement pour `npm run build` côté
  frontend et `node --test` côté backend.
- Aucun secret (`.env`, URI MongoDB, JWT) n'a été lu, demandé ou généré par
  l'agent à aucun moment.
- TP2 : même conteneur cloud (Node système `v22.22.2`, Node isolé
  `v24.21.0` pour Angular). Outils de vérification installés **hors du
  dépôt** (`/home/claude/e2e`) : `playwright-core` (Chromium préinstallé),
  `express` + `multer` pour l'API simulée, `@mermaid-js/mermaid-cli`. Aucun
  de ces outils n'a été ajouté aux `package.json` du projet.
- `git push` refusé depuis la session (droits GitHub de l'application
  Claude) : les modifications sont à commiter par l'élève.
- TP3 : même type de conteneur ; Node isolé `v24.21.0` hors du dépôt. Outils
  hors dépôt : Playwright (Python) + Chromium préinstallés, `express` +
  `multer` pour l'API simulée (`/home/claude/e2e`), `@mermaid-js/mermaid-cli`.
  Dépendances ajoutées **au projet** : `@angular/material` et `@angular/cdk`
  (SnackBar et Dialog exigés/choisis), `jsdom` en développement (tests).
- Aucun secret n'a été lu ou demandé ; les tokens utilisés dans les tests sont
  des chaînes fictives ou signés avec le secret de développement par défaut du
  backend.
