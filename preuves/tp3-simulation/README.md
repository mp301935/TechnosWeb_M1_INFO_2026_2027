# Captures TP3 — produites contre une API SIMULÉE

⚠️ Comme au TP2, ces captures ont été produites par l'assistant IA **sans**
votre backend ni votre base MongoDB Atlas (auxquels il n'a pas accès). Le
**vrai frontend compilé** (`npm run build`) a été servi par une petite API
simulée qui respecte `API_CONTRACT.md` et les règles de `backend/src/app.js`
(JWT obligatoire, filtrage par propriétaire, `404` pour une piste absente ou
d'un autre utilisateur, contrôles Multer). Chromium a été piloté par
Playwright. Le débit d'envoi a été limité (~0,9 Mo/s) pour rendre la
progression visible.

Elles **ne remplacent pas** les captures Network demandées par le sujet, à
faire avec votre propre backend (voir `TP3_ANALYSE.md` § 5).

| Fichier | Contenu |
|---|---|
| `01-liste-avec-supprimer.png` | Bibliothèque : bouton « Supprimer » sur chaque card |
| `02-confirmation.png` | Boîte de confirmation (MatDialog), focus sur « Annuler » |
| `03-suppression-en-cours.png` | Pendant la requête `DELETE` : bouton désactivé « Suppression » |
| `04-snackbar-succes.png` | SnackBar de succès, liste rechargée (une piste de la page 2 est remontée) |
| `05-snackbar-404.png` | Piste supprimée dans un « autre onglet » : `404`, SnackBar d'erreur, liste resynchronisée |
| `06-upload-progression.png` | Upload en cours : barre de progression, pourcentage, contrôles désactivés |
| `07-upload-100-serveur.png` | 100 % envoyé, en attente de la réponse du serveur |
| `08-upload-succes.png` | Upload réussi, nouvelle piste en tête |
| `09-upload-erreur.png` | Refus du serveur (`400`) : message d'erreur, possibilité de réessayer |
| `10-mobile.png` | Affichage responsive (390 px) |
| `resultats-verifications.txt` | Les 28 vérifications automatiques et leur résultat |
