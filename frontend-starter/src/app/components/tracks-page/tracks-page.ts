import { Component, DestroyRef, ElementRef, computed, inject, signal, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription, finalize } from 'rxjs';
import { Track } from '../../shared/models/track.model';
import { TRACKS_PAGE_SIZE, TrackService } from '../../shared/services/track.service';
import { httpErrorMessage } from '../../shared/utils/http-error-message';
import { AUDIO_ACCEPT, validateAudioFile } from '../../shared/validators/audio-file.validator';
import { TrackCardComponent } from '../track-card/track-card';

/**
 * Page « Backing tracks » : bibliothèque paginée côté serveur (Mission 2),
 * upload et lecture audio authentifiée (Mission 3).
 */
@Component({
  imports: [ReactiveFormsModule, TrackCardComponent],
  templateUrl: './tracks-page.html',
  styleUrl: './tracks-page.css',
})
export class TracksPageComponent {
  private readonly service = inject(TrackService);

  // ---------------------------------------------------------------------
  // Mission 2 — état de la bibliothèque paginée (Signals)
  // ---------------------------------------------------------------------
  readonly limit = TRACKS_PAGE_SIZE;
  /** Pistes de la page courante UNIQUEMENT (jamais toute la collection). */
  readonly tracks = signal<Track[]>([]);
  /** Page courante (1-indexée, comme le backend). */
  readonly page = signal(1);
  /** Nombre total de pages renvoyé par le serveur (`pages`). */
  readonly pages = signal(1);
  /** Nombre total de pistes renvoyé par le serveur (`total`). */
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly hasPrevious = computed(() => this.page() > 1);
  readonly hasNext = computed(() => this.page() < this.pages());

  /** Requête de liste en cours : annulée si une nouvelle page est demandée. */
  private listRequest?: Subscription;

  // ---------------------------------------------------------------------
  // Mission 3 — upload
  // ---------------------------------------------------------------------
  readonly accept = AUDIO_ACCEPT;
  readonly title = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(120)] });
  /**
   * Le `FormGroup` lié par `[formGroup]` est indispensable : c'est la
   * directive `FormGroupDirective` qui capte `(ngSubmit)` et empêche la
   * soumission HTML native (sinon le navigateur recharge la page).
   */
  readonly uploadForm = new FormGroup({ title: this.title });
  readonly selectedFile = signal<File | null>(null);
  readonly uploading = signal(false);
  /** Erreur de validation du fichier (détectée côté client, avant HTTP). */
  readonly fileError = signal<string | null>(null);
  /** Erreur renvoyée par le serveur (400, 401, 413, 500…). */
  readonly uploadError = signal<string | null>(null);
  readonly uploadSuccess = signal<string | null>(null);
  readonly canUpload = computed(
    () => this.selectedFile() !== null && !this.uploading() && this.fileError() === null,
  );
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  // ---------------------------------------------------------------------
  // Mission 3 — lecture audio
  // ---------------------------------------------------------------------
  /** `blob:` URL affectée au lecteur `<audio>`. */
  readonly audioUrl = signal<string | null>(null);
  readonly currentTrack = signal<Track | null>(null);
  readonly loadingTrackId = signal<string | null>(null);
  readonly audioError = signal<string | null>(null);
  private audioRequest?: Subscription;

  constructor() {
    // À la destruction du composant (changement de route, déconnexion) :
    // on annule les requêtes en cours et on révoque l'ObjectURL FINALE,
    // sinon le Blob resterait en mémoire jusqu'à la fermeture de l'onglet.
    inject(DestroyRef).onDestroy(() => {
      this.listRequest?.unsubscribe();
      this.audioRequest?.unsubscribe();
      this.revokeAudioUrl();
      console.debug('[TracksPage] Destruction : ObjectURL révoquée, requêtes annulées');
    });

    this.load();
  }

  // ======================= Mission 2 : pagination =======================

  /** Charge la page courante depuis le serveur : une requête HTTP par page. */
  load(): void {
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    const requestedPage = this.page();
    this.listRequest = this.service
      .list(requestedPage, this.limit)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (response) => {
          console.debug(
            `[TracksPage] Page ${response.page}/${response.pages} reçue : ${response.items.length} piste(s) sur ${response.total}`,
          );
          this.pages.set(response.pages);
          this.total.set(response.total);

          // Cas limite : la page demandée n'existe plus (ex. pistes
          // supprimées ailleurs). On redemande la dernière page existante.
          if (response.items.length === 0 && requestedPage > response.pages) {
            this.page.set(response.pages);
            this.load();
            return;
          }

          this.page.set(response.page);
          this.tracks.set(response.items);
        },
        error: (error: unknown) => {
          console.error('[TracksPage] Chargement impossible', error);
          this.tracks.set([]);
          void httpErrorMessage(error, 'Impossible de charger vos pistes').then((message) =>
            this.error.set(message),
          );
        },
      });
  }

  /** Change de page puis refait une requête HTTP (aucun découpage local). */
  go(target: number): void {
    if (this.loading() || target < 1 || target > this.pages() || target === this.page()) {
      return;
    }
    console.debug(`[TracksPage] Changement de page ${this.page()} → ${target}`);
    this.page.set(target);
    this.load();
  }

  // ========================= Mission 3 : upload ==========================

  /** Choix du fichier : validation immédiate pour un retour instantané. */
  choose(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.selectedFile.set(file);
    this.uploadSuccess.set(null);
    this.uploadError.set(null);
    this.fileError.set(file ? validateAudioFile(file) : null);
    console.debug('[TracksPage] Fichier sélectionné', file?.name, file?.type, file?.size);
  }

  upload(): void {
    // Empêche les doubles soumissions (double clic, touche Entrée répétée).
    if (this.uploading()) return;

    const file = this.selectedFile();
    // Vérification AVANT l'appel HTTP (mêmes règles que le backend).
    const validationError = validateAudioFile(file);
    if (validationError || !file) {
      this.fileError.set(validationError);
      console.warn('[TracksPage] Upload bloqué côté client :', validationError);
      return;
    }

    if (this.title.invalid) {
      this.uploadError.set('Le titre ne doit pas dépasser 120 caractères.');
      return;
    }

    const title = this.title.value.trim() || file.name;
    this.uploading.set(true);
    this.fileError.set(null);
    this.uploadError.set(null);
    this.uploadSuccess.set(null);
    this.title.disable();

    this.service
      .upload(file, title)
      .pipe(
        finalize(() => {
          this.uploading.set(false);
          this.title.enable();
        }),
      )
      .subscribe({
        next: (track) => {
          console.debug('[TracksPage] Piste envoyée', track.id);
          this.uploadSuccess.set(`« ${track.title} » a bien été ajoutée à votre bibliothèque.`);
          this.resetUploadForm();
          // Retour à la première page : les pistes sont triées par date
          // décroissante côté serveur, la nouvelle est donc en tête.
          this.page.set(1);
          this.load();
        },
        error: (error: unknown) => {
          console.error('[TracksPage] Envoi impossible', error);
          void httpErrorMessage(error, 'Envoi impossible').then((message) =>
            this.uploadError.set(message),
          );
        },
      });
  }

  private resetUploadForm(): void {
    this.title.reset('');
    this.selectedFile.set(null);
    // Un <input type="file"> ne se vide pas via Angular : on remet sa valeur à ''.
    const input = this.fileInput()?.nativeElement;
    if (input) input.value = '';
  }

  // ====================== Mission 3 : lecture audio ======================

  play(track: Track): void {
    this.audioRequest?.unsubscribe();
    this.loadingTrackId.set(track.id);
    this.audioError.set(null);

    this.audioRequest = this.service
      .audio(track.id)
      .pipe(finalize(() => this.loadingTrackId.set(null)))
      .subscribe({
        next: (blob) => {
          console.debug(`[TracksPage] Audio reçu (${blob.type}, ${blob.size} octets)`, track.id);
          // On révoque l'ancienne URL AVANT d'en créer une nouvelle.
          this.revokeAudioUrl();
          this.audioUrl.set(URL.createObjectURL(blob));
          this.currentTrack.set(track);
        },
        error: (error: unknown) => {
          console.error('[TracksPage] Lecture impossible', error);
          void httpErrorMessage(error, `Impossible de lire « ${track.title} »`).then((message) =>
            this.audioError.set(message),
          );
        },
      });
  }

  /** Erreur levée par l'élément `<audio>` lui-même (décodage, format…). */
  onAudioError(event: Event): void {
    const media = (event.target as HTMLAudioElement).error;
    console.error('[TracksPage] Erreur du lecteur audio', media?.code, media?.message);
    const reasons: Record<number, string> = {
      1: 'la lecture a été interrompue',
      2: 'erreur réseau pendant la lecture',
      3: 'le fichier audio est corrompu ou ne peut pas être décodé',
      4: 'ce format audio n’est pas pris en charge par votre navigateur',
    };
    const reason = (media && reasons[media.code]) || 'erreur inconnue';
    this.audioError.set(`Lecture impossible de « ${this.currentTrack()?.title ?? 'la piste'} » : ${reason}.`);
  }

  /** Le navigateur peut refuser `autoplay` : ce n'est pas une erreur du fichier. */
  onAudioPlay(): void {
    this.audioError.set(null);
  }

  private revokeAudioUrl(): void {
    const previousUrl = this.audioUrl();
    if (previousUrl) {
      URL.revokeObjectURL(previousUrl);
      console.debug('[TracksPage] ObjectURL révoquée');
    }
    this.audioUrl.set(null);
  }
}
