import {
  Component, ChangeDetectionStrategy, input, output, signal, inject, OnInit, OnDestroy,
} from '@angular/core';
import { AudioService } from '../../../core/services/audio.service';

export interface PianoKey {
  note: string;
  freq: number;
  label: string;
  isBlack: boolean;
  keyboardKey: string;
  blackAfter?: boolean; // tem tecla preta após esta tecla branca?
}

const A4 = 440;
const st = (n: number) => A4 * Math.pow(2, n / 12);

export const ALL_KEYS: PianoKey[] = [
  { note: 'C4',  freq: st(-9), label: 'C',  isBlack: false, keyboardKey: 'a', blackAfter: true  },
  { note: 'C#4', freq: st(-8), label: 'C#', isBlack: true,  keyboardKey: 'w' },
  { note: 'D4',  freq: st(-7), label: 'D',  isBlack: false, keyboardKey: 's', blackAfter: true  },
  { note: 'D#4', freq: st(-6), label: 'D#', isBlack: true,  keyboardKey: 'e' },
  { note: 'E4',  freq: st(-5), label: 'E',  isBlack: false, keyboardKey: 'd', blackAfter: false },
  { note: 'F4',  freq: st(-4), label: 'F',  isBlack: false, keyboardKey: 'f', blackAfter: true  },
  { note: 'F#4', freq: st(-3), label: 'F#', isBlack: true,  keyboardKey: 't' },
  { note: 'G4',  freq: st(-2), label: 'G',  isBlack: false, keyboardKey: 'g', blackAfter: true  },
  { note: 'G#4', freq: st(-1), label: 'G#', isBlack: true,  keyboardKey: 'y' },
  { note: 'A4',  freq: st(0),  label: 'A',  isBlack: false, keyboardKey: 'h', blackAfter: true  },
  { note: 'A#4', freq: st(1),  label: 'A#', isBlack: true,  keyboardKey: 'u' },
  { note: 'B4',  freq: st(2),  label: 'B',  isBlack: false, keyboardKey: 'j', blackAfter: false },
  { note: 'C5',  freq: st(3),  label: 'C',  isBlack: false, keyboardKey: 'k', blackAfter: false },
];

export const WHITE_KEYS: PianoKey[] = ALL_KEYS.filter(k => !k.isBlack);

// Mapa de tecla branca → tecla preta seguinte (para layout do template)
const BLACK_AFTER_MAP = new Map<string, PianoKey>();
ALL_KEYS.forEach((k, i) => {
  if (!k.isBlack && k.blackAfter) {
    const next = ALL_KEYS[i + 1];
    if (next?.isBlack) BLACK_AFTER_MAP.set(k.note, next);
  }
});

@Component({
  selector: 'app-piano-keyboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './piano-keyboard.component.html',
  styleUrl: './piano-keyboard.component.scss',
})
export class PianoKeyboardComponent implements OnInit, OnDestroy {
  readonly highlightedNote = input<string | null>(null);
  readonly selectedNote = input<string | null>(null);
  readonly wrongNote = input<string | null>(null);
  readonly disabled = input(false);
  readonly showKeyboardHints = input(false);
  readonly noteTapped = output<string>();

  readonly pressedNote = signal<string | null>(null);
  readonly keys = WHITE_KEYS;

  private readonly audio = inject(AudioService);

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (this.disabled()) return;
    const key = ALL_KEYS.find(k => k.keyboardKey === event.key.toLowerCase());
    if (key) {
      event.preventDefault();
      this.tapKey(key);
    }
  };

  ngOnInit(): void {
    document.addEventListener('keydown', this.onKeydown);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.onKeydown);
  }

  getBlackKey(whiteKey: PianoKey): PianoKey | undefined {
    return BLACK_AFTER_MAP.get(whiteKey.note);
  }

  tapKey(key: PianoKey): void {
    if (this.disabled()) return;
    this.audio.resume().then(() => {
      this.audio.playTone(key.freq, 600);
    });
    this.pressedNote.set(key.note);
    setTimeout(() => this.pressedNote.set(null), 200);
    this.noteTapped.emit(key.note);
  }
}
