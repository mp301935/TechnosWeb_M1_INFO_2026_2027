# TP3 — Analyse : suppression, progression de l'upload et tests

Ce document répond aux questions des Missions 5, 6 et 7 du
[`SUJET_ETUDIANT_TP3.md`](SUJET_ETUDIANT_TP3.md) et contient le **rapport des
tests** demandé dans les livrables. Les numéros de ligne correspondent à l'état
du dépôt **après** les modifications du TP3.

Les schémas sont écrits en **Mermaid** (affichés directement par GitHub et la
plupart des IDE). Une image PNG de chaque schéma est aussi disponible dans
[`docs/`](docs/).

---

## 1. Fichiers concernés

| Rôle | Fichier | Élément | Ligne(s) |
|---|---|---|---|
| Bouton « Supprimer » (présentation) | `frontend-starter/src/app/components/track-card/track-card.html` | `(click)="remove.emit(track())"`, `[disabled]="deleting()"` | 43-44 |
| Sortie / entrée de la card | `frontend-starter/src/app/components/track-card/track-card.ts` | `remove = output<Track>()`, `deleting = input(false)` | — |
| Confirmation | `frontend-starter/src/app/components/confirm-dialog/confirm-dialog.ts` | `ConfirmDialogComponent` (MatDialog) | tout le fichier |
| Orchestration de la suppression | `frontend-starter/src/app/components/tracks-page/tracks-page.ts` | `confirmRemove()`, `remove()`, `deletingIds`, `stopIfPlaying()` | 103, 281, 317-361, 376 |
| Appel HTTP de suppression | `frontend-starter/src/app/shared/services/track.service.ts` | `remove(id)` → `http.delete('/api/tracks/:id')` | 79-80 |
| Messages SnackBar | `frontend-starter/src/app/shared/services/notification.service.ts` | `success()`, `error()` | tout le fichier |
| Upload avec événements | `track.service.ts` | `upload()` avec `reportUploadProgress: true`, `observe: 'events'` | 53-61 |
| Traduction événement → état | `frontend-starter/src/app/shared/utils/upload-state.ts` | `uploadStateFromEvent()` | 33-57 |
| États de l'upload | `frontend-starter/src/app/shared/models/upload-state.model.ts` | union `UploadState` | tout le fichier |
| Affichage de la progression | `tracks-page.html` | `@let state`, `<mat-progress-bar>`, région `aria-live` | 54-85 |
| Backend XHR (indispensable) | `frontend-starter/src/app/app.config.ts` | `provideHttpClient(withXhr(), …)` | 23 |
| Protection côté serveur | `backend/src/app.js` | `auth()` + `app.delete(...)` + `findOneAndDelete({ _id, ownerId: req.auth.sub })` | 56-77, 409-413 |

Flux (rappel du sujet) :

```text
card de piste → TrackService → HttpClient → DELETE /api/tracks/:id
formulaire d'upload → TrackService → HttpClient → événements de progression
tests → services/composants isolés → réponses HTTP simulées
```

---

## 2. Mission 5 — Suppression d'une piste

### 2.1 Diagramme de séquence

![Diagramme de séquence de la suppression](docs/tp3-sequence-suppression.png)

<details>
<summary>Source Mermaid (rendu automatiquement sur GitHub)</summary>

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant C as TrackCard
    participant P as TracksPage
    participant D as MatDialog<br/>(ConfirmDialog)
    participant S as TrackService
    participant H as HttpClient +<br/>intercepteurs
    participant A as API Express<br/>(auth + route)
    participant M as MongoDB
    participant F as Disque<br/>data/uploads
    participant N as NotificationService<br/>(MatSnackBar)

    U->>C: clic « Supprimer »
    C-->>P: output remove(track)
    P->>D: open(ConfirmDialog, { data })
    D-->>U: « Supprimer cette piste ? »<br/>focus sur « Annuler »
    alt Annuler / Échap / clic extérieur
        U->>D: Annuler
        D-->>P: afterClosed() → false | undefined
        Note over P: rien n'est envoyé
    else Confirmer
        U->>D: Supprimer
        D-->>P: afterClosed() → true
        P->>P: remove(track)<br/>deletingIds += id (bouton désactivé)
        P->>S: remove(id)
        S->>H: DELETE /api/tracks/:id
        H->>A: + Authorization: Bearer JWT
        A->>A: auth : jwt.verify (signature, expiration)
        alt JWT absent / invalide / expiré
            A-->>H: 401
            H->>H: unauthorizedInterceptor :<br/>logout() + /login
            H-->>P: error 401 → SnackBar d'erreur
        else JWT valide
            A->>M: findOneAndDelete({ _id, ownerId: sub })
            alt piste trouvée ET appartient à sub
                M-->>A: document supprimé
                A->>F: unlink(storedName)
                A-->>H: 204 No Content
                H-->>S: réponse vide
                S-->>P: next()
                P->>N: success(« … a été supprimée »)
                P->>S: list(page, 5) → GET /api/tracks
                S-->>P: Page<Track> recalculée
            else absente (autre onglet) OU d'un autre utilisateur
                M-->>A: null
                A-->>H: 404 « Piste inconnue »
                H-->>P: error 404
                P->>N: error(« n'existe plus ou ne vous appartient pas »)
                P->>S: list(page, 5) (resynchronisation)
            end
        end
        P->>P: finalize : deletingIds -= id
    end
```

</details>

### 2.2 Ce qui a été ajouté et pourquoi

| Exigence du sujet | Réalisation |
|---|---|
| Action « Supprimer » dans chaque card | Bouton dans `track-card.html`. La card **n'appelle rien** : elle émet `remove` (composant de présentation). |
| Confirmation avant suppression | `MatDialog` + `ConfirmDialogComponent`. Focus initial sur **Annuler** : un appui involontaire sur Entrée ne supprime pas. Échap ou clic extérieur = annulation. |
| État de suppression (anti double clic) | Signal `deletingIds` (un `Set` d'identifiants) : bouton désactivé + garde `if (this.isDeleting(id)) return;` dans `remove()` et `confirmRemove()`. Un `Set` permet de supprimer A puis B sans attendre, mais jamais deux fois A. |
| Message de succès / d'erreur (SnackBar) | `NotificationService` (`MatSnackBar`), durée plus longue et `politeness: 'assertive'` pour les erreurs. |
| Mise à jour de la page | Après `204`, **nouvelle requête** `GET /api/tracks?page=…` : une piste de la page suivante remonte, `total` et `pages` sont recalculés par le serveur. Si la page devient vide, `load()` revient à la dernière page existante (code du TP2). |
| Piste qui n'existe plus / d'un autre utilisateur | Le backend répond `404` dans les deux cas. Le frontend affiche « n'existe plus ou ne vous appartient pas » et **recharge la liste** pour retirer la piste « fantôme ». |
| Piste en cours de lecture | Si la piste supprimée est dans le lecteur, il est arrêté et l'`ObjectURL` révoquée (`stopIfPlaying`). |
| Le composant n'appelle pas `HttpClient` | `TracksPage` → `TrackService.remove()` uniquement. |

Pourquoi une **resynchronisation** plutôt que retirer la card localement ?
Retirer seulement l'élément du tableau laisserait une page de 4 pistes au lieu
de 5, un total faux et un nombre de pages faux. Le serveur reste la source de
vérité ; c'est la même logique que la pagination serveur du TP2.

### 2.3 Pourquoi le guard et l'interface ne suffisent pas à sécuriser la suppression

- Le **guard** (`authGuard`) ne fait que vérifier la *présence* d'un token dans
  le navigateur, pour le confort de navigation. Il ne vérifie ni sa signature,
  ni son expiration, ni à qui appartient une piste.
- Masquer ou désactiver un bouton ne protège rien : n'importe qui peut envoyer
  `DELETE /api/tracks/<id>` avec `curl`, Postman, ou la console des DevTools,
  sans passer par Angular. Le code Angular est livré au navigateur : il peut être
  lu et modifié par l'utilisateur.
- C'est le **backend** qui protège réellement :
  1. le middleware `auth` (`app.js` l. 56-77) refuse sans en-tête `Bearer`
     (`401 Authentification requise`) et vérifie avec `jwt.verify` la signature
     (secret connu du serveur seul) et l'expiration (`401 Jeton invalide ou expiré`) ;
  2. la route (`app.js` l. 409-413) supprime avec
     `findOneAndDelete({ _id: req.params.id, ownerId: req.auth.sub })`.
     `req.auth.sub` vient du **JWT vérifié**, pas d'une donnée envoyée par le
     client : on ne peut donc supprimer que ses propres pistes. Une piste d'un
     autre utilisateur donne `404` (et non `403`), ce qui ne révèle même pas
     qu'elle existe.

Ces deux protections sont vérifiées par les tests backend (§ 4.3).

---

## 3. Mission 6 — Progression de l'upload

### 3.1 Diagramme de séquence

![Diagramme de séquence de l'upload avec progression](docs/tp3-sequence-upload-progression.png)

<details>
<summary>Source Mermaid</summary>

```mermaid
sequenceDiagram
    autonumber
    actor U as Utilisateur
    participant P as TracksPage
    participant S as TrackService
    participant H as HttpClient<br/>(withXhr)
    participant X as XMLHttpRequest<br/>du navigateur
    participant A as API Express<br/>(auth + Multer)
    participant B as MongoDB + disque

    U->>P: choisit un fichier puis « Envoyer »
    P->>P: validateAudioFile() (avant HTTP)
    P->>P: uploadState = uploading 0 %<br/>bouton, fichier et titre désactivés
    P->>S: upload(file, title)
    S->>H: POST /api/tracks (FormData audio + title)<br/>reportUploadProgress: true, observe: 'events'
    H->>X: send(FormData) + Authorization
    H-->>P: HttpEvent Sent → 0 %
    loop pendant l'envoi des octets
        X->>A: morceau du corps multipart
        X-->>H: xhr.upload.onprogress(loaded, total)
        H-->>P: HttpEvent UploadProgress
        P->>P: progress = round(100 × loaded / total)
    end
    Note over P: 100 % = tout est PARTI du navigateur,<br/>le serveur n'a pas encore répondu
    A->>A: Multer : type MIME, 25 Mo, écriture disque
    A->>B: Track.create(métadonnées)
    alt succès
        A-->>X: 201 Track
        H-->>P: HttpEvent ResponseHeader (ignoré)
        H-->>P: HttpEvent Response (body = Track)
        P->>P: uploadState = success, formulaire vidé
        P->>S: list(1, 5) → nouvelle piste en tête
    else refus (400, 401, 500…) ou réseau
        A-->>X: 4xx / 5xx
        H-->>P: callback error (pas un événement)
        P->>P: uploadState = error(message)
    end
    P->>P: finalize : titre réactivé
```

</details>

### 3.2 Les quatre états

![Diagramme d'états de l'upload](docs/tp3-etats-upload.png)

<details>
<summary>Source Mermaid</summary>

```mermaid
stateDiagram-v2
    direction LR
    [*] --> idle
    idle --> uploading: Envoyer (fichier valide)
    uploading --> uploading: Sent (0 %)<br/>UploadProgress (n %)
    uploading --> success: Response 201 (body = Track)
    uploading --> error: callback error<br/>(400, 401, 500, réseau)
    success --> idle: nouveau fichier choisi
    error --> idle: nouveau fichier choisi
    error --> uploading: Envoyer à nouveau
    success --> uploading: Envoyer un autre fichier

    note right of uploading
        contrôles désactivés
        seconde soumission impossible
    end note
```

</details>

Les états sont modélisés par **un seul Signal** `uploadState` de type
`UploadState` (union discriminée TypeScript : `idle | uploading | success |
error`). Il remplace les trois Signals `uploading`, `uploadError` et
`uploadSuccess` du TP2 : avec trois valeurs indépendantes, rien n'empêchait
d'afficher à la fois un succès et une erreur. `uploading` devient un `computed`
dérivé de `uploadState`.

Pendant l'envoi : bouton « Envoyer », champ fichier et champ titre désactivés,
et garde `if (this.uploading()) return;` dans `upload()` (la touche Entrée peut
déclencher `ngSubmit` même si le bouton est désactivé). Aucun log ne contient le
JWT ni le contenu du fichier : seuls le pourcentage et le nombre d'octets sont
journalisés.

### 3.3 Comment Angular calcule le pourcentage

1. `TrackService.upload()` passe `reportUploadProgress: true` et
   `observe: 'events'`.
2. Le backend XHR d'Angular s'abonne à `xhr.upload.onprogress`. Le navigateur
   déclenche cet événement plusieurs fois pendant l'envoi avec `loaded` (octets
   déjà envoyés) et `total` (taille du corps multipart, un peu plus que le
   fichier à cause des en-têtes multipart et du champ `title`).
3. Angular le transforme en `HttpUploadProgressEvent { type: UploadProgress, loaded, total }`.
4. `uploadStateFromEvent()` calcule `Math.round(100 × loaded / total)` (borné à
   100). Si `total` est inconnu, la barre passe en mode « indéterminé ».

**100 % ne veut pas dire « terminé »** : cela veut dire que tous les octets sont
partis du navigateur. Ensuite Multer écrit le fichier, Mongoose crée la
métadonnée, puis le serveur répond `201`. L'interface affiche donc « Fichier
transmis, enregistrement par le serveur… » entre 100 % et la réponse, et le
succès n'est déclaré qu'à l'événement `Response`.

### 3.4 Pourquoi un upload avec progression ne se traite pas comme une requête simple

| Requête « simple » (ex. `list()`) | Upload avec `observe: 'events'` |
|---|---|
| L'Observable émet **une seule** valeur : le corps de la réponse. | L'Observable émet **une suite** d'`HttpEvent` : `Sent`, plusieurs `UploadProgress`, `ResponseHeader`, `Response`. |
| `next` = succès. | `next` est appelé plusieurs fois ; il faut **trier** les événements par `event.type`. Seul `Response` signifie succès, et le `Track` est dans `event.body`. |
| Deux états suffisent : en cours / terminé. | Un état intermédiaire avec une valeur qui change (le pourcentage). |
| — | Les erreurs HTTP n'arrivent **pas** sous forme d'événement mais dans le callback `error`. |
| — | Le backend HTTP compte : `fetch` ne sait pas mesurer un envoi (voir § 3.5). |

### 3.5 Piège rencontré : Angular 22 utilise `fetch` par défaut

Premier essai dans un vrai navigateur : la barre restait bloquée à **0 %**
pendant 4,7 secondes puis passait directement au succès, alors que les tests
unitaires passaient. Cause : depuis Angular 22, `provideHttpClient()` utilise le
backend **`fetch`**, qui ne fournit pas la progression d'un envoi ; l'ancienne
option `reportProgress` (dépréciée en 22.0) était alors silencieusement ignorée
pour l'upload.

Correction :

- `withXhr()` dans `provideHttpClient(...)` (`app.config.ts`) pour revenir au
  backend `XMLHttpRequest` ;
- option explicite `reportUploadProgress: true` : si `withXhr()` était retiré,
  Angular lèverait l'erreur **NG02824** au lieu d'échouer en silence ;
- configuration déplacée de `main.ts` vers `app.config.ts` pour pouvoir la
  tester : `app.config.spec.ts` vérifie que le backend injecté est
  `HttpXhrBackend`.

Les tests unitaires ne pouvaient pas voir ce bug, car `HttpTestingController`
**remplace** le backend HTTP. C'est un bon exemple de la limite d'un test
unitaire (§ 6, question 6).

---

## 4. Mission 7 — Tests automatisés et rapport des tests

### 4.1 Architecture des tests

![Architecture des tests](docs/tp3-architecture-tests.png)

<details>
<summary>Source Mermaid</summary>

```mermaid
flowchart LR
    subgraph FRONT["Frontend — npm test (Vitest + jsdom, aucun serveur)"]
        direction TB
        TS["Code testé<br/>TrackService · AuthService<br/>authInterceptor · unauthorizedInterceptor<br/>authGuard · uploadStateFromEvent<br/>TracksPage · appConfig"]
        HC["HttpClient réel<br/>+ intercepteurs réels"]
        HTC[("HttpTestingController<br/>faux backend HTTP :<br/>expectOne · flush · event")]
        FAKE["Faux MatDialog<br/>Faux NotificationService<br/>(vi.fn)"]
        TS --> HC --> HTC
        TS -.-> FAKE
    end

    subgraph BACK["Backend — npm test (node --test)"]
        direction TB
        F["fetch() réel"]
        APP["createApp() réelle<br/>routes · auth JWT · Multer"]
        MOCK[("Modèle Track simulé<br/>t.mock.method :<br/>find · countDocuments<br/>findOneAndDelete · findOne · create")]
        DISK[("Disque réel<br/>data/uploads")]
        F --> APP --> MOCK
        APP --> DISK
    end

    MONGO[("MongoDB Atlas")]
    MONGO -. jamais contacté .- FRONT
    MONGO -. jamais contacté .- BACK
```

</details>

Commandes :

```bash
cd frontend-starter && npm test      # ng test --watch=false (Vitest + jsdom)
cd backend && npm test               # node --test
```

Configuration ajoutée pour le frontend : `tsconfig.spec.json` (types
`vitest/globals`), exclusion des `*.spec.ts` du build (`tsconfig.app.json`),
cible `test` reliée au build dans `angular.json`, dépendance de développement
`jsdom` (environnement DOM simulé dans Node).

### 4.2 Tests frontend (7 fichiers, 33 tests)

| Fichier | Test | Ce qui est vérifié | Attendu | Observé |
|---|---|---|---|---|
| `track.service.spec.ts` | `list()` transmet page et limit | méthode `GET`, URL `/api/tracks`, paramètres `page=2`, `limit=5`, `urlWithParams` | requête conforme, réponse simulée renvoyée | ✅ |
| | `remove()` envoie DELETE | méthode `DELETE`, URL `/api/tracks/abc123`, corps vide, complétion sur `204` | conforme | ✅ |
| | `remove()` encode l'id | `a/b?c` → `/api/tracks/a%2Fb%3Fc` | chemin non modifiable | ✅ |
| | `remove()` propage un 404 | erreur reçue avec `status === 404` | 404 | ✅ |
| | `upload()` multipart + progression | `POST`, `reportUploadProgress`, `FormData` avec **exactement** `audio` et `title`, pas de `Content-Type` forcé, événements `UploadProgress` puis `Response` | conforme | ✅ |
| `auth.service.spec.ts` | `login()` | `POST /api/auth/login`, corps **exactement** `{ email, password }` | conforme | ✅ |
| | login réussi | token dans le Signal **et** `localStorage`, `currentUser`, `isAuthenticated` | mémorisés | ✅ |
| | login refusé (401) | rien n'est mémorisé | token `null` | ✅ |
| | `logout()` | Signal, utilisateur et `localStorage` vidés | vidés | ✅ |
| `auth.interceptor.spec.ts` | Bearer avec token | en-tête `Authorization: Bearer fake-token-for-tests` | présent | ✅ |
| | sans token | aucun en-tête `Authorization` | absent | ✅ |
| | DELETE avec token | en-tête présent sur la suppression | présent | ✅ |
| | 401 sur route protégée | `logout()`, navigation `/login`, erreur relancée | déconnexion | ✅ |
| | 401 sur `/api/auth/login` | **pas** de déconnexion (mauvais mot de passe) | pas d'appel | ✅ |
| | 404 | aucune réaction de l'intercepteur | token conservé | ✅ |
| `auth.guard.spec.ts` | sans token | `UrlTree` vers `/login` | redirection | ✅ |
| | avec token | `true` | accès | ✅ |
| `upload-state.spec.ts` | 6 tests | `Sent` → 0 % ; `UploadProgress` 1/3 → 33 % et 3/3 → 100 % ; total inconnu → `null` ; `Response` → succès ; corps vide → erreur ; `ResponseHeader` → ignoré | conforme | ✅ |
| `tracks-page.spec.ts` | erreur HTTP affichée | `500` → message « Base indisponible (HTTP 500) » dans `role="alert"` | affiché | ✅ |
| | suppression confirmée | dialogue ouvert **avant** l'appel ; `DELETE /api/tracks/t1` ; bouton désactivé pendant la requête ; SnackBar de succès ; **nouveau** `GET /api/tracks?page=1&limit=5` ; 1 card restante | conforme | ✅ |
| | double clic | une seule requête `DELETE` | 1 requête | ✅ |
| | suppression annulée | aucune requête `DELETE` | aucune | ✅ |
| | 404 (autre onglet) | SnackBar d'erreur explicite + liste rechargée | conforme | ✅ |
| | 500 | SnackBar avec le message serveur, liste **non** rechargée, état remis à zéro | conforme | ✅ |
| | upload avec progression | état `uploading` 40 %, texte « 40 % », `aria-valuenow="40"`, contrôles désactivés, 2ᵉ envoi bloqué, 100 % → « enregistrement par le serveur », puis `success`, formulaire vidé, page 1 rechargée | conforme | ✅ |
| | upload en erreur | `400` → état `error` « Format audio non accepté (HTTP 400) », contrôles réactivés pour réessayer | conforme | ✅ |
| | fichier invalide | `.txt` refusé, **aucune** requête `POST` | aucune | ✅ |
| `app.config.spec.ts` | backend XHR | `HttpBackend` injecté = `HttpXhrBackend` | XHR | ✅ |

Résultat observé :

```text
 Test Files  7 passed (7)
      Tests  33 passed (33)
```

### 4.3 Tests backend — extension facultative (`backend/test/api-contract.test.js`, 13 tests)

Aucune route modifiée. Le test existant `api.test.js` est conservé tel quel.

| Test | Attendu | Observé |
|---|---|---|
| Sans JWT sur 5 routes protégées (`GET /users/me`, `GET/POST /tracks`, `GET /tracks/:id/audio`, `DELETE /tracks/:id`) | `401 { message: "Authentification requise" }` | ✅ |
| En-tête sans le préfixe `Bearer` | `401` | ✅ |
| JWT malformé, signé avec un autre secret, expiré | `401 { message: "Jeton invalide ou expiré" }` | ✅ |
| Upload sans fichier | `400 Fichier audio requis`, aucune métadonnée créée | ✅ |
| Type MIME refusé (`text/plain`) | `400 Format audio non accepté`, **aucun fichier écrit** | ✅ |
| Fichier > 25 Mo | `400 File too large`, fichier partiel supprimé | ✅ |
| Upload valide | `201`, `ownerId` = `sub` du JWT, nom de stockage aléatoire | ✅ |
| Pagination `page=2&limit=3` | filtre `{ ownerId }`, tri `createdAt: -1`, `skip(3)`, `limit(3)`, `select("-storedName")`, forme `Page<Track>`, `id` sans `_id` | ✅ |
| Pagination `page=-4&limit=500` | `page=1`, `limit=20` (plafond), `pages=1` | ✅ |
| DELETE de la piste d'un autre utilisateur | `404`, filtre `{ _id, ownerId: BOB }`, fichier d'Alice **intact** | ✅ |
| DELETE par la propriétaire | `204` sans corps, fichier supprimé du disque | ✅ |
| DELETE d'une piste déjà supprimée | `404` | ✅ |
| Lecture audio de la piste d'un autre utilisateur | `404` | ✅ |

Résultat observé : `tests 15, pass 15, fail 0` (2 existants + 13 nouveaux).

### 4.4 Les tests vérifient-ils vraiment quelque chose ?

Un test qui passe toujours ne prouve rien. Chaque bug ci-dessous a été
**introduit volontairement**, la suite relancée, puis le code restauré :

| Bug introduit | Détecté ? | Tests en échec |
|---|---|---|
| `http.delete` remplacé par `http.get` | ✅ | 24 |
| Pas de rechargement après suppression | ✅ | 2 |
| Garde anti double clic supprimée | ✅ | 1 |
| Suppression sans confirmation | ✅ | 24 |
| `reportUploadProgress: false` | ✅ | 2 |
| Pourcentage mal calculé (`loaded / total`) | ✅ | 2 |
| Intercepteur sans le préfixe `Bearer` | ✅ | 2 |
| Guard qui laisse tout passer | ✅ | 1 |
| `limit` non transmis | ✅ | 10 |
| `login()` sans `password` | ✅ | 1 |
| `withXhr()` retiré de `app.config.ts` | ✅ | 1 |
| Backend : filtre `ownerId` retiré du `DELETE` | ✅ | 2 |

---

## 5. Vérifications finales

| Vérification | Commande / méthode | Résultat |
|---|---|---|
| Build | `cd frontend-starter && npm run build` | ✅ sans erreur ni avertissement |
| Tests frontend | `npm test` | ✅ 33/33 |
| Tests backend | `cd backend && npm test` | ✅ 15/15 |
| Scénario navigateur (API simulée) | Chromium piloté par Playwright | ✅ 28/28, voir [`preuves/tp3-simulation/`](preuves/tp3-simulation/) |

Dans le scénario navigateur, la progression a été observée avec un débit
d'envoi limité à ~0,9 Mo/s (DevTools) : 0 %, 3 %, 5 %, … 98 %, puis « Fichier
transmis, enregistrement par le serveur… », puis le succès.

**À faire par l'élève avec son propre backend et MongoDB Atlas** (l'assistant
n'y a pas accès) — onglet Network des DevTools :

1. supprimer une piste : vérifier qu'**aucune** requête ne part tant que la
   confirmation n'est pas validée, puis `DELETE /api/tracks/<id>` → `204`, suivi
   d'un `GET /api/tracks?page=…&limit=5` ; vérifier l'en-tête
   `Authorization: Bearer …` (sans copier sa valeur dans le rapport) ;
2. ouvrir un second onglet, y supprimer une piste, puis tenter de la supprimer
   dans le premier : `DELETE` → `404`, SnackBar d'erreur, liste rafraîchie ;
3. upload : choisir dans Network un profil lent (ex. « 3G » ou un profil
   personnalisé) pour voir la barre avancer ; la requête `POST /api/tracks`
   reste « pending » pendant l'envoi puis passe à `201` ;
4. console : aucune erreur inattendue, ni token ni mot de passe affichés.

Captures à ajouter dans `preuves/` et à lier dans `RAPPORT_IA_MODELE.md`.

---

## 6. Restitution orale

**1. Pourquoi la suppression passe-t-elle par un service ?**
Le composant gère l'affichage et l'état (confirmation, bouton désactivé,
messages) ; `TrackService` est le **seul** endroit qui connaît l'URL et la
méthode HTTP. Avantages : une seule modification si l'API change, réutilisation
par d'autres composants, et tests séparés (le service est testé avec
`HttpTestingController`, la page avec le vrai service et un faux backend).
C'est aussi la règle d'`AGENTS.md`.

**2. Comment le backend protège-t-il la suppression ?**
Middleware `auth` : en-tête `Bearer` obligatoire, puis `jwt.verify` (signature
avec le secret du serveur et expiration de 2 h) → sinon `401`. Puis
`findOneAndDelete({ _id, ownerId: req.auth.sub })` : l'identité vient du JWT
vérifié, donc seule la propriétaire peut supprimer ; sinon `404` sans révéler
l'existence de la piste. Le fichier n'est supprimé du disque qu'**après** la
suppression de la métadonnée, et un échec de suppression du fichier est journalisé
et renvoie `500`.

**3. Comment Angular calcule-t-il le pourcentage d'upload ?**
Avec `reportUploadProgress: true`, `observe: 'events'` et le backend XHR, le
navigateur déclenche `xhr.upload.onprogress` ; Angular émet des
`UploadProgress` avec `loaded` et `total` ; le code calcule
`round(100 × loaded / total)`. 100 % signifie « octets envoyés », pas « enregistré
par le serveur ».

**4. Pourquoi les tests HTTP n'ont-ils pas besoin de MongoDB ?**
Côté frontend, aucune requête ne sort : `provideHttpClientTesting()` remplace le
backend HTTP, et le test fournit lui-même la réponse (`flush`). On teste le code
Angular, pas le serveur. Côté backend, les refus `401`/`400` ont lieu **avant**
tout accès à la base, et pour les autres cas les méthodes du modèle `Track` sont
remplacées par des fausses (`t.mock.method`). La connexion MongoDB est faite dans
`server.js`, que les tests n'importent jamais. Les tests sont donc rapides,
reproductibles, et n'exposent aucun identifiant Atlas.

**5. Que vérifie un test d'intercepteur ou de guard ?**
Intercepteur : la requête **telle qu'elle sort** de la chaîne (présence et valeur
exacte de `Authorization`, absence sans token) et la réaction à une réponse
simulée (un `401` déconnecte et redirige, sauf sur `/api/auth/login` ; un `404`
ne fait rien ; l'erreur est relancée). Guard : la décision de navigation —
`true` avec un token, `UrlTree` vers `/login` sans token. Ces tests vérifient le
comportement côté client, **pas** la sécurité, qui reste au backend.

**6. Différence entre test unitaire et test d'intégration ?**
Un test **unitaire** isole une unité (un service, une fonction pure, un composant)
et remplace ses dépendances par des faux : rapide, précis, il localise
l'erreur. Un test d'**intégration** fait fonctionner plusieurs parties réelles
ensemble (ex. les tests backend : vraie application Express, vrais middlewares,
vrai Multer, vrai disque ; ou le scénario navigateur : vraie application compilée
dans Chromium). Le TP3 l'illustre : le bug `fetch`/`withXhr()` est passé à
travers les tests unitaires (le backend HTTP y est remplacé) et n'a été trouvé
que par le test d'intégration dans le navigateur ; un test unitaire ciblé
(`app.config.spec.ts`) a ensuite été ajouté pour qu'il ne revienne pas.
