# Captures TP2 — produites contre une API SIMULÉE

⚠️ Ces captures ont été produites par l'assistant IA, **sans** votre backend
ni votre base MongoDB Atlas (auxquels il n'a pas accès, conformément aux
consignes de sécurité). Le **vrai frontend compilé** (`npm run build`) a été
servi avec un petit serveur d'API simulé qui respecte `API_CONTRACT.md` et
reprend les contrôles Multer de `backend/src/app.js` (types MIME, 25 Mo,
champ `audio`, filtrage par propriétaire). Chromium a été piloté par
Playwright.

Elles montrent l'interface et le comportement du frontend, mais **ne
remplacent pas** les captures Network demandées par le sujet, à faire avec
votre propre backend (voir `TP2_ANALYSE_AUDIO.md` §9).

| Fichier | Contenu |
|---|---|
| `01-page1.png` | Bibliothèque, page 1/2, bouton « Précédent » désactivé |
| `02-page2.png` | Page 2/2 après clic sur « Suivant » (nouvelle requête `page=2`) |
| `03-fichier-invalide.png` | Fichier `.txt` refusé côté client, bouton désactivé |
| `04-envoi-en-cours.png` | Pendant l'upload : « Envoi en cours… », bouton désactivé |
| `05-upload-succes.png` | Message de succès, formulaire vidé, retour en page 1 |
| `06-lecture.png` | Lecteur avec « En cours de lecture », card mise en évidence |
| `07-erreur-lecture.png` | Erreur de lecture compréhensible (404 serveur) |
| `08-mobile.png` | Affichage responsive (390 px de large) |
| `resultats-verifications.txt` | Les 25 vérifications automatiques et leur résultat |
