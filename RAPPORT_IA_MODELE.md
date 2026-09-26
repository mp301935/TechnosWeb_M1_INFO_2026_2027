# Rapport d'usage de l'IA - TP1

Pour chaque mission, détailler et fournir des explications concernant : objectif; prompt principal; plan proposé par l'agent; vérifications réalisées par le binôme; erreurs ou propositions rejetées; fichiers effectivement modifiés; preuve de fonctionnement; ce que chaque membre sait maintenant expliquer sans l'agent.

> **Binôme** : *(à compléter par les deux étudiant·e·s — noms, prénoms)*
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
- *(À compléter par le binôme)* : relire `SCHEMA_FLUX_CONNEXION.md` et
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

### Ce que chaque membre du binôme sait maintenant expliquer sans l'agent

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
  nécessitent les identifiants MongoDB Atlas personnels du binôme, que
  l'agent ne doit **jamais** recevoir (règle explicite du sujet et de
  `CONSEILS_POUR_UTIISER_ASSISTANT_AI.md` §9) : cette partie reste à faire
  par les étudiant·e·s eux-mêmes, avec leur propre `backend/.env`.
- **Relecture du diff** (`git diff --stat`) : 5 fichiers modifiés, 2 fichiers
  ajoutés, aucun fichier hors `frontend-starter/src` touché.
- *(À compléter par le binôme)* : démarrer `backend` avec votre propre
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
  avec le binôme avant de l'appliquer.
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
- **Preuve manquante à ce stade, à produire par le binôme** : capture réelle
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

### Ce que chaque membre du binôme sait maintenant expliquer sans l'agent

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

## Environnement d'exécution (pour traçabilité)

- Dépôt cloné dans un conteneur cloud isolé, relié également à l'ordinateur
  Windows de l'utilisateur (session « linked device »), sans qu'aucun
  dossier local personnel n'ait été demandé ni utilisé.
- Node système : `v22.22.2` (insuffisant pour le CLI Angular 22) ; Node
  local additionnel `v24.21.0` utilisé uniquement pour `npm run build` côté
  frontend et `node --test` côté backend.
- Aucun secret (`.env`, URI MongoDB, JWT) n'a été lu, demandé ou généré par
  l'agent à aucun moment.
