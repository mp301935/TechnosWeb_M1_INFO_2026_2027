# TP2 — Analyse de l'upload et de la lecture audio (Mission 3)

Ce document répond aux questions d'analyse de la Mission 3 du
[`SUJET_ETUDIANT_TP2.md`](SUJET_ETUDIANT_TP2.md). Les numéros de ligne
correspondent à l'état du dépôt **après** les modifications du TP2.

---

## 1. Où se trouve chaque étape dans le code ?

| Étape | Fichier | Méthode / élément | Ligne(s) |
|---|---|---|---|
| Choix du fichier | `frontend-starter/src/app/components/tracks-page/tracks-page.html` | `<input #fileInput type="file" (change)="choose($event)">` | 21-30 |
| | `frontend-starter/src/app/components/tracks-page/tracks-page.ts` | `choose(event)` : lit `files[0]`, le met dans le Signal `selectedFile`, valide immédiatement | 144 |
| Validation avant HTTP (ajoutée) | `frontend-starter/src/app/shared/validators/audio-file.validator.ts` | `validateAudioFile(file)` | tout le fichier |
| | `tracks-page.ts` | `upload()` appelle `validateAudioFile` avant `service.upload` | 153-165 |
| Construction du `FormData` | `frontend-starter/src/app/shared/services/track.service.ts` | `upload(file, title)` : `new FormData()`, `append('audio', file)`, `append('title', title)` | 34-37 |
| Appel HTTP d'upload | `track.service.ts` | `this.http.post<Track>('/api/tracks', body)` | 38 |
| | `tracks-page.ts` | `upload()` → `this.service.upload(file, title).subscribe({ next, error })` | 179 |
| Récupération du `Blob` | `track.service.ts` | `audio(id)` : `http.get(..., { responseType: 'blob' })` | 46-49 |
| Création de l'`ObjectURL` | `tracks-page.ts` | `play(track)` → `URL.createObjectURL(blob)` | 215, 228 |
| Affectation au lecteur `<audio>` | `tracks-page.html` | `<audio [src]="url" controls autoplay ...>` (où `url = audioUrl()`) | 71 |
| Révocation de l'ancienne URL | `tracks-page.ts` | `revokeAudioUrl()` appelée dans `play()` **avant** la nouvelle URL | 227, 259 |
| Révocation de l'URL finale (ajoutée) | `tracks-page.ts` | `inject(DestroyRef).onDestroy(...)` → `revokeAudioUrl()` | 80-85 |
| Ajout du JWT | `frontend-starter/src/app/shared/interceptors/auth.interceptor.ts` | `request.clone({ setHeaders: { Authorization: \`Bearer ${token}\` } })` | 12 |
| Enregistrement de l'intercepteur | `frontend-starter/src/main.ts` | `provideHttpClient(withInterceptors([authInterceptor, unauthorizedInterceptor]))` | 12 |

---

## 2. Les deux flux

### 2.1 Upload : composant → service → `HttpClient` → API

```text
[<input type=file>] --(change)--> TracksPageComponent.choose()
                                   └─ selectedFile.set(file) + validateAudioFile(file)
[bouton Envoyer] --(ngSubmit)--> TracksPageComponent.upload()
   1. validateAudioFile(file)           ← refuse AVANT tout appel réseau
   2. uploading.set(true)               ← bouton désactivé, « Envoi en cours… »
   3. TrackService.upload(file, title)
        └─ FormData { audio: <File>, title: "..." }
        └─ HttpClient.post('/api/tracks', formData)
              └─ authInterceptor : + Authorization: Bearer <JWT>
              └─ unauthorizedInterceptor : si 401 → logout + /login
              └─ proxy.conf.json : /api → http://localhost:3000
   4. Express : auth → upload.single("audio") (Multer) → handler
        └─ Multer : fileFilter (type MIME) + limits.fileSize (25 Mo) → écrit sur disque
        └─ handler : req.file absent ? 400 ; sinon Track.create(...) dans MongoDB
   5. 201 Track  → next : message de succès, formulaire vidé, page.set(1), load()
      400/401/… → error : httpErrorMessage() → uploadError affiché
   6. finalize : uploading.set(false)
```

### 2.2 Lecture : API → `Blob` → `ObjectURL` → lecteur audio

```text
[bouton Lire d'une card] --(play output)--> TracksPageComponent.play(track)
   1. TrackService.audio(id) = HttpClient.get('/api/tracks/:id/audio', { responseType: 'blob' })
        └─ authInterceptor ajoute Authorization: Bearer <JWT>
   2. Express : auth → Track.findOne({ _id, ownerId: req.auth.sub })
        └─ pas propriétaire ou inconnue → 404 { message: "Piste inconnue" }
        └─ sinon res.type(mimeType) + res.sendFile(chemin)  (flux lu depuis le disque)
   3. Navigateur : reçoit TOUS les octets → HttpClient émet UN Blob (type audio/mpeg…)
   4. revokeAudioUrl()                    ← libère l'ancien Blob
      URL.createObjectURL(blob)           → "blob:http://localhost:4200/3f2c…"
   5. audioUrl.set(url) → template : <audio [src]="url"> → le lecteur lit depuis la MÉMOIRE
   6. currentTrack.set(track)             ← « En cours de lecture : … »
   7. Destruction du composant → DestroyRef.onDestroy → revokeAudioUrl()
```

---

## 3. L'intercepteur et pourquoi `<audio src="/api/...">` ne suffit pas

Dans l'onglet **Network**, la requête `GET /api/tracks/<id>/audio` porte
l'en-tête `Authorization: Bearer eyJ…` (ne jamais copier sa valeur dans un
rapport). Cet en-tête est ajouté par `authInterceptor`
(`auth.interceptor.ts`, ligne 12), qui clone chaque requête **passant par
`HttpClient`**.

Une URL placée directement dans `<audio src="/api/tracks/42/audio">` est
chargée par le **moteur multimédia du navigateur**, pas par Angular :

- la requête ne passe pas par `HttpClient`, donc par aucun intercepteur ;
- HTML ne permet pas d'ajouter un en-tête personnalisé à un `src`
  (`<audio>`, `<img>`, `<video>` n'envoient que les cookies et en-têtes
  standards) ;
- le JWT est stocké dans `localStorage`, que le navigateur n'envoie jamais
  automatiquement (contrairement à un cookie).

Résultat : le middleware `auth` du backend répond **401 « Authentification
requise »**. Cela a été vérifié (voir `preuves/tp2-simulation/resultats-verifications.txt`,
ligne « URL audio appelée sans header (comme `<audio src>`) → 401 »).

D'où le choix du TP : télécharger via `HttpClient` (avec JWT) → `Blob` →
`ObjectURL` locale que `<audio>` peut lire sans en-tête.

Alternatives possibles (non retenues, pour information) : mettre le token
dans l'URL (`?token=…`, mauvais car il fuit dans l'historique et les logs),
utiliser un cookie `HttpOnly` (change le mécanisme d'authentification), ou
une URL signée à durée courte générée par le serveur (change le contrat).

---

## 4. Contrôles du backend (identifiés, non modifiés)

| Contrôle | `backend/src/app.js` | Réponse |
|---|---|---|
| Taille max 25 Mo | l. 31 `MAX_FILE_SIZE = 25 * 1024 * 1024` ; l. 108 `limits: { fileSize: MAX_FILE_SIZE }` | `MulterError LIMIT_FILE_SIZE` → **400** « File too large » (gestionnaire l. 445-450) |
| Formats acceptés | l. 34-41 Set `allowed` (`audio/mpeg`, `audio/wav`, `audio/x-wav`, `audio/ogg`, `audio/mp4`, `audio/x-m4a`) ; l. 109-119 `fileFilter` | **400** « Format audio non accepté » |
| Le champ fichier s'appelle `audio` | l. 337 `upload.single("audio")` | un autre nom de champ → `MulterError LIMIT_UNEXPECTED_FILE` → **400** |
| Fichier présent | l. 340-343 `if (!req.file)` | **400** « Fichier audio requis » |
| Champ `title` | l. 347 `title: req.body.title \|\| req.file.originalname` | titre facultatif |
| Nom de stockage sûr | l. 93-98 `crypto.randomUUID() + extension` | pas de collision ni de chemin injecté |
| Authentification | l. 336 middleware `auth` | **401** |

Le frontend construit bien le `FormData` avec **exactement** `audio` et
`title` (`track.service.ts` l. 35-37). Vérifié côté serveur : Multer a reçu
`champ fichier=audio(song1.mp3, audio/mpeg) champs texte={"title":"Blues en La"}`.

---

## 5. Validation frontend ≠ validation backend

Ajouté : `validateAudioFile()` applique **les mêmes règles** que Multer
(fichier présent, non vide, ≤ 25 Mo, type MIME dans la même liste) avant
l'appel HTTP, et l'attribut `accept` filtre déjà le sélecteur de fichiers.

- **Ce que la validation frontend apporte** : un message immédiat et
  compréhensible, un bouton désactivé tant que le fichier est invalide, et
  aucun envoi inutile de 25 Mo sur le réseau pour se faire refuser ensuite.
- **Pourquoi elle ne remplace jamais le backend** : le frontend s'exécute
  chez l'utilisateur, qui contrôle tout (DevTools, désactivation du JS).
  N'importe qui peut appeler `POST /api/tracks` directement avec `curl` ou
  Postman sans passer par Angular. Seul le serveur est une frontière de
  confiance. De plus `file.type` est déduit de l'extension par le navigateur :
  un `.mp3` renommé n'est pas forcément de l'audio (le backend actuel ne
  vérifie pas non plus le contenu réel — une amélioration possible serait de
  lire les premiers octets, les « magic numbers »).

---

## 6. Téléchargement complet d'un `Blob`, buffering, streaming

| Notion | Qui ? | Ce qui se passe dans ce TP |
|---|---|---|
| **Streaming côté serveur** | Express | `res.sendFile()` lit le fichier sur le disque **par morceaux** (flux `fs.createReadStream` du module `send`) et les écrit dans la réponse au fur et à mesure. Il gère aussi les requêtes `Range` (réponse `206 Partial Content`). Le fichier n'est jamais chargé entièrement en RAM côté serveur. |
| **Téléchargement complet d'un `Blob`** | `HttpClient` (XHR) | Le navigateur reçoit les morceaux, mais `HttpClient` n'émet la valeur (`next`) **qu'une seule fois, à la fin**, avec le `Blob` complet. La lecture ne peut commencer qu'après le téléchargement total. |
| **Buffering du navigateur** | élément `<audio>` | Quand `<audio>` a une URL HTTP, il télécharge progressivement, remplit un tampon et **commence à jouer avant la fin**, en demandant des plages (`Range`) quand on avance dans le morceau. Avec une `blob:` URL, tout est déjà en mémoire : le « buffering » est instantané. |

---

## 7. Réponses aux questions mémoire / buffering / streaming

**1. Le backend envoie-t-il le fichier entier en mémoire ou peut-il l'envoyer progressivement depuis le disque ?**
Progressivement. La route `GET /api/tracks/:id/audio` (l. 379-406) utilise
`res.sendFile(audioPath, callback)`, qui ouvre un flux de lecture sur le
fichier et le transmet par morceaux (backpressure gérée par Node). Il ne fait
**pas** de `fs.readFile` qui chargerait tout le fichier en mémoire. Il
supporte aussi `Range` / `206`. Même logique à l'upload : `multer.diskStorage`
écrit le fichier sur le disque au fil de l'eau (l. 88-99).

**2. Avec `HttpClient` et `responseType: "blob"`, à quel moment le composant reçoit-il le fichier ?**
Une fois que **toute** la réponse a été téléchargée. L'Observable émet une
seule valeur (le `Blob` complet) puis se termine. Pour un fichier de 20 Mo,
l'utilisateur attend le téléchargement complet avant d'entendre le premier
son (d'où l'état « Chargement » sur le bouton de la card). On pourrait suivre
la progression avec `reportProgress: true, observe: 'events'`, mais le `Blob`
n'arriverait toujours qu'à la fin.

**3. Si la bibliothèque contient 100 morceaux, les 100 fichiers audio sont-ils chargés en mémoire dès l'affichage de la liste ?**
Non, pour trois raisons visibles dans le code :
- `load()` appelle `TrackService.list(page, 5)` → `GET /api/tracks?page=1&limit=5` :
  seules **5 métadonnées JSON** sont reçues (le backend fait `skip/limit` et
  `.select("-storedName")`, sans aucun octet audio) ;
- le template des cards n'a **aucun** `<audio>` : un seul lecteur existe, et
  il n'apparaît que si `audioUrl()` est défini ;
- `TrackService.audio(id)` n'est appelé que dans `play()`, donc **au clic**
  sur « Lire », pour **un seul** morceau ; l'ancien `Blob` est libéré par
  `revokeAudioUrl()` avant d'en créer un nouveau. Au maximum **un** fichier
  audio est en mémoire à la fois.

**4. Quelle différence y aurait-il avec 100 éléments `<audio>` utilisant directement une URL HTTP ?**
- Ici, **ça ne marcherait pas** : pas d'en-tête `Authorization` → 100 × 401.
- Si les URL étaient accessibles (cookie ou URL signée) : le navigateur
  gérerait lui-même chaque élément selon son attribut `preload`
  (`none` / `metadata` / `auto`). Avec `metadata` ou `auto`, l'affichage de la
  liste déclencherait jusqu'à **100 requêtes** (au moins les en-têtes, voire
  une partie du fichier), une charge réseau et serveur importante.
- En revanche, la lecture serait **progressive** : démarrage avant la fin du
  téléchargement, déplacement dans le morceau via `Range`, et le navigateur
  libère lui-même son tampon. Aucune `ObjectURL` à gérer.

**5. Pourquoi l'URL créée par `URL.createObjectURL` doit-elle être révoquée ?**
Une `blob:` URL est une **référence** vers le `Blob`, enregistrée dans le
document. Tant qu'elle existe, le ramasse-miettes ne peut pas libérer le
`Blob` (plusieurs Mo), même si plus aucune variable ne le référence. Dans une
application monopage (SPA), le document n'est jamais rechargé : sans
`URL.revokeObjectURL`, chaque morceau écouté resterait en mémoire jusqu'à la
fermeture de l'onglet (fuite mémoire). D'où les deux révocations :
l'ancienne URL dans `play()`, et l'URL finale dans `DestroyRef.onDestroy`.

---

## 8. Explication du choix `Blob` + `ObjectURL` (livrable)

L'API audio est protégée par JWT dans l'en-tête `Authorization`. Un élément
`<audio src>` ne peut pas envoyer cet en-tête. On télécharge donc le fichier
avec `HttpClient` (qui passe par `authInterceptor`) sous forme de `Blob`, puis
`URL.createObjectURL(blob)` fabrique une URL locale `blob:` que le lecteur
peut lire sans authentification, car les données sont déjà dans la mémoire du
navigateur.

**Avantages** : sécurité conservée (JWT jamais dans l'URL, piste lisible
seulement par son propriétaire), contrat HTTP inchangé, code simple.
**Inconvénients** : la lecture attend le téléchargement complet (pas de
streaming progressif), tout le fichier occupe la RAM du navigateur, et il faut
penser à révoquer l'URL. Acceptable pour des backing tracks ≤ 25 Mo lues une
par une ; pour de longs fichiers, une URL signée courte ou un cookie `HttpOnly`
permettrait le streaming natif.

---

## 9. Checkpoint Network — ce que vous devez observer

| Vérification | Où regarder dans DevTools > Network |
|---|---|
| Chaque changement de page modifie `page` | Requêtes `tracks?page=1&limit=5`, puis `tracks?page=2&limit=5` (onglet *Payload* → *Query String Parameters*) |
| Upload multipart avec `audio` et `title` | `POST tracks` → *Headers* : `Content-Type: multipart/form-data; boundary=…` ; *Payload* : `audio: (binary)`, `title: …` |
| Réponse de lecture = flux audio | `GET <id>/audio` → *Headers* : `Content-Type: audio/mpeg`, *Type* : `media`/`xhr`, taille ≈ celle du fichier |
| 400 affichée pour fichier invalide | Le frontend bloque désormais avant l'envoi. Pour voir un vrai 400 serveur : DevTools > Console, `fetch('/api/tracks', { method: 'POST', headers: { Authorization: 'Bearer ' + localStorage.getItem('gpc_token') }, body: new FormData() })` → 400 « Fichier audio requis » |
| Lecture réservée au propriétaire | Se connecter avec un 2ᵉ compte et appeler l'`id` d'une piste du 1ᵉʳ compte → **404** « Piste inconnue » (le backend filtre sur `ownerId`) |

Des captures produites contre une **API simulée** (pas votre MongoDB) sont
dans [`preuves/tp2-simulation/`](preuves/tp2-simulation/). Elles montrent
l'interface mais **ne remplacent pas** les captures Network demandées, à
réaliser avec votre propre backend.
