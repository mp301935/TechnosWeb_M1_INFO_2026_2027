import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Track } from '../../shared/models/track.model';
import { FileSizePipe } from '../../shared/pipes/file-size.pipe';

const FORMAT_LABELS: Record<string, string> = {
  'audio/mpeg': 'MP3',
  'audio/wav': 'WAV',
  'audio/x-wav': 'WAV',
  'audio/ogg': 'OGG',
  'audio/mp4': 'M4A',
  'audio/x-m4a': 'M4A',
};

/**
 * Card d'une piste : titre, nom original, format, taille, date d'ajout
 * et action de lecture. Composant de présentation pur : il ne fait aucun
 * appel HTTP, il émet seulement `play` vers la page parente.
 */
@Component({
  selector: 'app-track-card',
  imports: [DatePipe, FileSizePipe],
  templateUrl: './track-card.html',
  styleUrl: './track-card.css',
})
export class TrackCardComponent {
  readonly track = input.required<Track>();
  /** Vrai si cette piste est celle actuellement dans le lecteur. */
  readonly playing = input(false);
  /** Vrai pendant le téléchargement du Blob de cette piste. */
  readonly loadingAudio = input(false);

  readonly play = output<Track>();

  readonly format = computed(() => FORMAT_LABELS[this.track().mimeType] ?? this.track().mimeType);
}
