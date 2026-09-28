# Guitar Practice Cloud — package étudiant

Ce dépôt contient uniquement les ressources nécessaires aux trois TP :
`backend/` et `frontend-starter/`, ainsi que les sujets et documents utiles.

## Prérequis

- Node.js 22 ou plus récent ;
- un compte MongoDB Atlas pour l'élève ;
- Git et un navigateur récent.
- Un IDE de qualité
- Recommandé : un abonnement à un 

Consulter [ATLAS_SETUP.md](ATLAS_SETUP.md) pour créer la base de données.

## Démarrer le backend

```bash
cd backend
cp .env.example .env
```

Renseigner dans `.env` l’URI MongoDB Atlas et le secret JWT. Ne jamais publier
ce fichier ni copier un secret dans le code Angular.

```bash
npm install
npm start
```

Le backend écoute normalement sur `http://localhost:3000`.

## Démarrer le frontend

Dans un autre terminal :

```bash
cd frontend-starter
npm install
npm start
```

Ouvrir `http://localhost:4200`. Le compte de démonstration est
`demo@example.com` / `Demo1234!`.

## Architecture de l'application

### Vue d'ensemble

```mermaid
flowchart TB
    U(("👤 Utilisateur"))

    subgraph NAV["Navigateur — Angular 22 (http://localhost:4200)"]
        direction TB
        subgraph PAGES["components/ (pages)"]
            direction LR
            APP["AppComponent<br/>en-tête + router-outlet"]
            LOGIN["LoginPage"]
            REG["RegisterPage"]
            PROF["ProfilePage"]
            TRACKS["TracksPage<br/>pagination · upload · lecteur"]
            CARD["TrackCard<br/>(présentation)"]
        end
        subgraph SHARED["shared/"]
            direction LR
            GUARD["authGuard"]
            AUTHS["AuthService<br/>Signals token / currentUser"]
            TRACKS_S["TrackService<br/>list · upload · audio"]
            VALID["validateAudioFile"]
            HTTP["HttpClient"]
            INT1["authInterceptor<br/>+ Bearer JWT"]
            INT2["unauthorizedInterceptor<br/>401 → /login"]
        end
        LS[("localStorage<br/>gpc_token")]
        BLOB[("Blob + ObjectURL<br/>blob:…")]
    end

    PROXY["proxy.conf.json<br/>/api → :3000"]

    subgraph API["Backend Node.js / Express 5 (http://localhost:3000)"]
        direction LR
        AUTHMW["middleware auth<br/>jwt.verify"]
        ROUTES["Routes /api/auth · /api/users/me · /api/tracks"]
        MULTER["Multer<br/>25 Mo · types audio"]
        MODELS["Mongoose<br/>User · Track"]
    end

    DB[("MongoDB Atlas<br/>users · tracks<br/>(métadonnées)")]
    DISK[("Disque serveur<br/>data/uploads/<br/>(octets audio)")]

    U --> APP
    APP --> LOGIN & REG & PROF & TRACKS
    TRACKS --> CARD
    GUARD -. protège /tracks /profile .-> TRACKS
    LOGIN & REG & PROF --> AUTHS
    TRACKS --> TRACKS_S
    TRACKS --> VALID
    AUTHS <--> LS
    AUTHS & TRACKS_S --> HTTP
    HTTP --> INT1 --> INT2 --> PROXY
    PROXY --> ROUTES
    ROUTES --> AUTHMW
    ROUTES --> MULTER --> DISK
    ROUTES --> MODELS --> DB
    ROUTES -. "sendFile (flux)" .-> DISK
    TRACKS_S -. responseType blob .-> BLOB
    BLOB -. src .-> TRACKS
```

> Si votre éditeur n'affiche pas les diagrammes Mermaid, la même image est disponible dans [`docs/architecture.png`](docs/architecture.png).

### Couches et responsabilités

| Couche | Emplacement | Rôle |
|---|---|---|
| Pages (composants) | `frontend-starter/src/app/components/*` | Affichage, formulaires réactifs, état local en Signals. N'appellent **jamais** `HttpClient` directement. |
| Services | `frontend-starter/src/app/shared/services` | Seuls points d'appel HTTP : `AuthService` (auth, profil, token), `TrackService` (liste paginée, upload multipart, audio en `Blob`). |
| Intercepteurs | `frontend-starter/src/app/shared/interceptors` | `authInterceptor` ajoute `Authorization: Bearer <JWT>` ; `unauthorizedInterceptor` déconnecte et renvoie vers `/login` sur un 401. |
| Garde | `frontend-starter/src/app/shared/guards` | `authGuard` bloque `/tracks` et `/profile` sans token. |
| Modèles, pipes, validateurs, utilitaires | `frontend-starter/src/app/shared/{models,pipes,validators,utils}` | Interfaces TypeScript du contrat, formatage des tailles, validation audio avant envoi, lecture des messages d'erreur HTTP. |
| Proxy de dev | `frontend-starter/proxy.conf.json` | Redirige `/api/*` de `:4200` vers `:3000` (pas de CORS en dev). |
| API | `backend/src/app.js` | Routes Express, middleware `auth` (JWT), Multer (upload sur disque), gestion centralisée des erreurs. |
| Démarrage | `backend/src/server.js` | Connexion MongoDB, création du compte démo, ouverture du port. |
| Données | `backend/src/models` + MongoDB Atlas | `User` (mot de passe haché bcrypt) et `Track` (métadonnées, `ownerId`). Les **octets audio** restent dans `backend/data/uploads/`. |

### Arborescence

```text
.
├── API_CONTRACT.md            ← contrat HTTP (source de vérité front ↔ back)
├── SCHEMA_FLUX_CONNEXION.md   ← flux « Se connecter » (TP1)
├── SCHEMA_FLUX_CONNEXION.drawio ← diagramme de séquence à ouvrir dans draw.io
├── TP2_ANALYSE_AUDIO.md       ← analyse upload / Blob / streaming (TP2)
├── RAPPORT_IA_MODELE.md       ← compte rendu d'usage de l'IA
├── docs/                      ← images des schémas (architecture, séquence)
├── preuves/                   ← captures d'écran
├── backend/
│   └── src/
│       ├── app.js             ← routes, auth JWT, Multer, erreurs
│       ├── server.js          ← MongoDB + écoute du port
│       └── models/            ← User.js, Track.js
└── frontend-starter/
    ├── proxy.conf.json
    └── src/
        ├── main.ts            ← bootstrap, HttpClient + intercepteurs
        └── app/
            ├── routes.ts
            ├── components/    ← app, login-page, register-page, profile-page,
            │                    tracks-page, track-card
            └── shared/        ← services, interceptors, guards, models,
                                 pipes, validators, utils
```

### Flux principaux

- **Connexion** : `LoginPage` → `AuthService.login()` → `POST /api/auth/login` → `{ token, user }` → `localStorage` + Signals. Détail : [SCHEMA_FLUX_CONNEXION.md](SCHEMA_FLUX_CONNEXION.md) et le diagramme de séquence [SCHEMA_FLUX_CONNEXION.drawio](SCHEMA_FLUX_CONNEXION.drawio) (draw.io → *Fichier › Ouvrir* ou *Organiser › Insérer › Avancé › XML*).
- **Bibliothèque paginée** : `TracksPage.load()` → `TrackService.list(page, 5)` → `GET /api/tracks?page=…&limit=5` → une page de métadonnées (pagination faite par MongoDB, jamais dans Angular).
- **Upload** : validation locale → `FormData { audio, title }` → `POST /api/tracks` → Multer écrit le fichier, Mongoose crée la métadonnée → retour page 1.
- **Lecture** : `GET /api/tracks/:id/audio` avec JWT → `Blob` → `URL.createObjectURL` → `<audio>` ; l'URL est révoquée au changement de piste et à la destruction de la page. Détail : [TP2_ANALYSE_AUDIO.md](TP2_ANALYSE_AUDIO.md).

## Documents de travail

- [SUJET_ETUDIANT_TP1.md](SUJET_ETUDIANT_TP1.md), [SUJET_ETUDIANT_TP2.md](SUJET_ETUDIANT_TP2.md) et [SUJET_ETUDIANT_TP3.md](SUJET_ETUDIANT_TP3.md) : missions des trois séances ;
- [API_CONTRACT.md](API_CONTRACT.md) : endpoints, authentification et formats échangés ;
- [RAPPORT_IA_MODELE.md](RAPPORT_IA_MODELE.md) : modèle de compte rendu.
- [CONSEILS_POUR_UTIISER_ASSISTANT_AI.md](CONSEILS_POUR_UTIISER_ASSISTANT_AI.md) : utiliser correctement un assistant IA, quel que soit l’outil choisi.

Le backend contient également ses propres consignes pour les assistants :
[`backend/AGENTS.md`](backend/AGENTS.md), [`backend/CLAUDE.md`](backend/CLAUDE.md),
[`backend/GEMINI.md`](backend/GEMINI.md) et
[`backend/best-practices.md`](backend/best-practices.md). Elles couvrent
Node.js, Express, Mongoose, MongoDB, l’authentification, Multer, les uploads,
les logs et les tests.

Les fichiers audio présents dans `frontend-starter/fichiers-audio-de-test/` sont
des fixtures fournies pour les essais. Aucun fichier uploadé, dossier de
dépendances (`node_modules`), fichier `.env` ou identifiant local n’est inclus.
