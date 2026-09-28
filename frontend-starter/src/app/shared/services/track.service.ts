import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Page } from '../models/page.model';
import { Track } from '../models/track.model';

/** Nombre de pistes par page demandé au serveur (le backend plafonne à 20). */
export const TRACKS_PAGE_SIZE = 5;

/**
 * Encapsule toutes les opérations HTTP sur les backing tracks.
 * Les composants n'appellent jamais `HttpClient` directement.
 */
@Injectable({ providedIn: 'root' })
export class TrackService {
  private readonly http = inject(HttpClient);

  /**
   * Mission 2 — pagination SERVEUR.
   * `page` et `limit` sont réellement transmis dans l'URL :
   * `GET /api/tracks?page=2&limit=5`. Le backend fait `skip/limit` dans
   * MongoDB : Angular ne reçoit jamais plus d'une page de pistes.
   */
  list(page = 1, limit = TRACKS_PAGE_SIZE) {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<Page<Track>>('/api/tracks', { params });
  }

  /**
   * Upload multipart : le `FormData` contient EXACTEMENT les deux champs
   * attendus par le backend (`upload.single("audio")` et `req.body.title`).
   * On ne fixe pas `Content-Type` : le navigateur ajoute lui-même
   * `multipart/form-data; boundary=...`.
   */
  upload(file: File, title: string) {
    const body = new FormData();
    body.append('audio', file);
    body.append('title', title);
    return this.http.post<Track>('/api/tracks', body);
  }

  /**
   * Lecture authentifiée : la requête passe par `HttpClient`, donc par
   * `authInterceptor` qui ajoute `Authorization: Bearer <token>`.
   * La réponse complète est reçue sous forme de `Blob`.
   */
  audio(id: string) {
    return this.http.get(`/api/tracks/${encodeURIComponent(id)}/audio`, {
      responseType: 'blob',
    });
  }
}
