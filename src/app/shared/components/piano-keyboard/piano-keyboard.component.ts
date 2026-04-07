import {
  Component, ChangeDetectionStrategy, Input, Output, EventEmitter, signal, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AudioService } from '../../../core/services/audio.service';

export interface PianoKey {
  note: string;
  freq: number;
  label: string;
  isBlack: boolean;
  blackAfter?: boolean; // tem tecla preta após esta tecla branca?
}

const A4 = 440;
const st = (n: number) => A4 * Math.pow(2, n / 12);

export const WHITE_KEYS: PianoKey[] = [
  { note: 'C4', freq: st(-9),  label: 'C', isBlack: false, blackAfter: true  },
  { note: 'D4', freq: st(-7),  label: 'D', isBlack: false, blackAfter: true  },
  { note: 'E4', freq: st(-5),  label: 'E', isBlack: false, blackAfter: false },
  { note: 'F4', freq: st(-4),  label: 'F', isBlack: false, blackAfter: true  },
  { note: 'G4', freq: st(-2),  label: 'G', isBlack: false, blackAfter: true  },
  { note: 'A4', freq: st(0),   label: 'A', isBlack: false, blackAfter: true  },
  { note: 'B4', freq: st(2),   label: 'B', isBlack: false, blackAfter: false },
  { note: 'C5', freq: st(3),   label: 'C', isBlack: false, blackAfter: false },
];

@Component({
  selector: 'app-piano-keyboard',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './piano-keyboard.component.html',
  styleUrl: './piano-keyboard.component.scss',
})
export class PianoKeyboardComponent {
  @Input() highlightedNote: string | null = null;
  @Input() selectedNote: string | null = null;
  @Input() wrongNote: string | null = null;
  @Input() disabled = false;
  @Output() noteTapped = new EventEmitter<string>();

  readonly pressedNote = signal<string | null>(null);
  readonly keys = WHITE_KEYS;

  private readonly audio = inject(AudioService);

  tapKey(key: PianoKey): void {
    if (this.disabled) return;
    this.audio.resume().then(() => {
      this.audio.playTone(key.freq, 600);
    });
    this.pressedNote.set(key.note);
    setTimeout(() => this.pressedNote.set(null), 200);
    this.noteTapped.emit(key.note);
  }

  trackByNote(_: number, key: PianoKey): string { return key.note; }
}
