import {
  Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';

import { I18nService } from '../../core/i18n/i18n.service';
import { AudioService } from '../../core/services/audio.service';
import { BackgroundTrackService } from '../../core/services/background-track.service';
import { ProgressService } from '../../core/services/progress.service';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/storage/storage.service';
import {
  Exercise, IntervalExercise, ChordExercise, RhythmExercise, NoteExercise, MelodyExercise,
  ExerciseResult, ModuleId, ChordType,
} from '../../core/models';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { XpBarComponent } from '../../shared/components/xp-bar/xp-bar.component';
import { PianoKeyboardComponent } from '../../shared/components/piano-keyboard/piano-keyboard.component';
import { PianoTutorialComponent, TUTORIAL_STORAGE_KEY } from '../../shared/components/piano-tutorial/piano-tutorial.component';

type PracticePhase = 'intro' | 'exercise' | 'feedback' | 'result';

const INTERVAL_NAMES: Record<number, string> = {
  0: 'interval.unison', 1: 'interval.minor2', 2: 'interval.major2',
  3: 'interval.minor3', 4: 'interval.major3', 5: 'interval.perfect4',
  6: 'interval.tritone', 7: 'interval.perfect5', 8: 'interval.minor6',
  9: 'interval.major6', 10: 'interval.minor7', 11: 'interval.major7',
  12: 'interval.octave',
};

@Component({
  selector: 'app-practice',
  imports: [
    MatIconModule,
    GlassPanelComponent, PrimaryButtonComponent, XpBarComponent, PianoKeyboardComponent,
    PianoTutorialComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('280ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateY(-10px)' })),
      ]),
    ]),
    trigger('feedback', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('300ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
    ]),
    trigger('countdownPop', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.4)' }),
        animate('300ms cubic-bezier(0.34,1.56,0.64,1)', style({ opacity: 1, transform: 'scale(1)' })),
      ]),
      transition('* => *', [
        style({ transform: 'scale(0.4)' }),
        animate('300ms cubic-bezier(0.34,1.56,0.64,1)', style({ transform: 'scale(1)' })),
      ]),
      transition(':leave', [
        animate('150ms ease-in', style({ opacity: 0, transform: 'scale(1.2)' })),
      ]),
    ]),
  ],
  templateUrl: './practice.component.html',
  styleUrl: './practice.component.scss',
})
export class PracticeComponent implements OnInit, OnDestroy {
  readonly phase = signal<PracticePhase>('intro');
  readonly currentIndex = signal(0);
  readonly exercises = signal<Exercise[]>([]);
  readonly selectedAnswer = signal<number | string | null>(null);
  readonly lastCorrect = signal(false);
  readonly lastXpEarned = signal(0);
  readonly sessionXp = signal(0);
  readonly sessionResults = signal<ExerciseResult[]>([]);

  // Estado de identificação de nota
  readonly noteHintActive = signal(false);
  private noteHintTimer: ReturnType<typeof setTimeout> | null = null;

  // Estado de melodia
  readonly melodyPhase = signal<'listen' | 'play'>('listen');
  readonly melodyStep = signal(0);          // qual nota o usuário deve tocar agora
  readonly melodyWrongNote = signal<string | null>(null);
  readonly melodyPlayedNotes = signal<string[]>([]); // notas tocadas corretamente
  private melodyTimers: ReturnType<typeof setTimeout>[] = [];
  private melodyPlayingNote = signal<string | null>(null); // tecla acesa durante reprodução

  // Estado de ritmo
  readonly tapping = signal(false);
  readonly tappedBeats = signal<boolean[]>([]);
  readonly activeBeat = signal(-1);
  readonly countdown = signal(-1); // -1 = hidden, 3/2/1 = counting, 0 = GO!
  readonly rhythmBeatStatus = signal<('pending' | 'hit' | 'miss')[]>([]);
  readonly rhythmExtraTaps = signal(0);
  readonly rhythmTapFeedback = signal<'correct' | 'wrong' | null>(null);
  readonly rhythmActive = signal(false);

  private rhythmTimers: ReturnType<typeof setTimeout>[] = [];
  private exerciseStartMs = 0;
  private rhythmBeatIndex = 0;
  private rhythmExpectedTimes: number[] = [];

  // Auto-avanço após acerto
  readonly autoAdvancing = signal(false);
  private autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly AUTO_ADVANCE_MS = 1400;

  readonly moduleName = computed(() => {
    const mod = this.api.modules().find(m => m.id === this.moduleId);
    return mod ? this.i18n.tStr(mod.nameKey) : '';
  });

  readonly currentExercise = computed<Exercise | null>(() => {
    const list = this.exercises();
    const idx = this.currentIndex();
    return list[idx] ?? null;
  });

  readonly isLastExercise = computed(() =>
    this.currentIndex() >= this.exercises().length - 1
  );

  readonly totalXp = computed(() =>
    this.exercises().reduce((sum, e) => sum + e.xpReward, 0)
  );

  readonly correctCount = computed(() =>
    this.sessionResults().filter(r => r.correct).length
  );

  readonly rhythmBeats = computed(() => {
    const ex = this.currentExercise();
    if (ex?.type === 'rhythm') return (ex as RhythmExercise).pattern;
    return [];
  });

  readonly intervalOptions = computed<number[]>(() => {
    const ex = this.currentExercise();
    if (ex?.type === 'interval') return (ex as IntervalExercise).options;
    return [];
  });

  readonly chordOptions = computed<ChordType[]>(() => {
    const ex = this.currentExercise();
    if (ex?.type === 'chord') return (ex as ChordExercise).options;
    return [];
  });

  readonly noteHintKey = computed<string | null>(() => {
    const ex = this.currentExercise();
    if (ex?.type === 'note-id' && (ex as NoteExercise).showHint && this.noteHintActive()) {
      return (ex as NoteExercise).noteName;
    }
    return null;
  });

  readonly melodyNotes = computed(() => {
    const ex = this.currentExercise();
    if (ex?.type === 'melody') return (ex as MelodyExercise).notes;
    return [];
  });

  // Tecla que deve ser tocada neste instante do exercício de melodia
  readonly melodyExpectedNote = computed<string | null>(() => {
    const ex = this.currentExercise();
    if (ex?.type !== 'melody') return null;
    const step = this.melodyStep();
    const notes = (ex as MelodyExercise).notes;
    if (this.melodyPhase() === 'play' && step < notes.length) {
      return notes[step].note;
    }
    return null;
  });

  // Tecla a iluminar durante a reprodução automática da melodia
  readonly melodyHighlightNote = computed<string | null>(() =>
    this.melodyPlayingNote()
  );

  readonly explanationText = computed(() => {
    const ex = this.currentExercise();
    if (!ex) return null;
    const correct = this.lastCorrect();
    // Ritmo não precisa de explanationKey — sempre mostra feedback
    if (ex.type === 'rhythm') {
      return correct
        ? 'Ritmo perfeito! Seu timing está excelente.'
        : 'O ritmo não ficou preciso. Ouça com atenção e toque junto com as batidas.';
    }
    if (!ex.explanationKey) return null;
    const ex2 = ex as IntervalExercise;
    if (ex.type === 'interval') {
      const name = this.i18n.tStr(INTERVAL_NAMES[ex2.semitones]);
      return correct
        ? `O intervalo era uma ${name}. Bem reconhecido!`
        : `O intervalo correto era: ${name}.`;
    }
    if (ex.type === 'chord') {
      const c = ex as ChordExercise;
      const name = this.i18n.tStr('chord.' + c.chordType);
      return correct
        ? `O acorde era ${name}. Ouvido afinado!`
        : `O acorde correto era: ${name}.`;
    }
    if (ex.type === 'note-id') {
      const n = ex as NoteExercise;
      return correct
        ? `A nota era ${n.noteName.replace(/\d/, '')}. Perfeito!`
        : `A nota correta era ${n.noteName.replace(/\d/, '')}. Continue praticando!`;
    }
    if (ex.type === 'melody') {
      const m = ex as MelodyExercise;
      const seq = m.notes.map(n => n.note.replace(/\d/, '')).join(' → ');
      return correct
        ? `Melodia completa: ${seq}. Excelente memória musical!`
        : `A melodia era: ${seq}. Ouça novamente e tente mais uma vez!`;
    }
    return null;
  });

  private moduleId!: ModuleId;

  // Tutorial do piano
  readonly showTutorial = signal(false);
  readonly tutorialCloseButton = signal(false);
  private tutorialAutoShown = false;

  readonly i18n = inject(I18nService);
  private readonly api = inject(ApiService);
  private readonly audio = inject(AudioService);
  private readonly bgTrack = inject(BackgroundTrackService);
  private readonly progress = inject(ProgressService);
  private readonly storage = inject(StorageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (
      event.code === 'Space' &&
      this.phase() === 'exercise' &&
      this.currentExercise()?.type === 'rhythm'
    ) {
      event.preventDefault();
      if (this.rhythmActive()) {
        this.handleTap();
      }
    }
  };

  ngOnInit(): void {
    document.addEventListener('keydown', this.onKeydown);
    this.moduleId = this.route.snapshot.paramMap.get('moduleId') as ModuleId;
    const exerciseList = this.api.getExercisesForModule(this.moduleId);
    if (!exerciseList.length) {
      this.router.navigate(['/home']);
      return;
    }
    this.exercises.set(exerciseList);
  }

  ngOnDestroy(): void {
    document.removeEventListener('keydown', this.onKeydown);
    this.bgTrack.stop();
    this.clearRhythmTimer();
    this.clearMelodyTimers();
    if (this.noteHintTimer) clearTimeout(this.noteHintTimer);
    this.cancelAutoAdvance();
  }

  startPractice(): void {
    this.phase.set('exercise');
    this.currentIndex.set(0);
    this.exerciseStartMs = Date.now();
    this.resetExerciseState();
    // Inicia trilha de fundo (mantém pipeline Bluetooth ativo)
    this.audio.resume().then(() => this.bgTrack.start(this.moduleId));
    this.checkAndShowTutorial();
    // Reprodução automática do exercício de áudio
    setTimeout(() => this.playCurrentExercise(), 500);
  }

  closeTutorial(): void {
    if (this.tutorialAutoShown) {
      this.storage.set(TUTORIAL_STORAGE_KEY, true);
    }
    this.tutorialAutoShown = false;
    this.showTutorial.set(false);
  }

  openTutorial(): void {
    this.tutorialAutoShown = false;
    this.tutorialCloseButton.set(true);
    this.showTutorial.set(true);
  }

  private checkAndShowTutorial(): void {
    const ex = this.currentExercise();
    const isPiano = ex?.type === 'note-id' || ex?.type === 'melody';
    if (isPiano && !this.storage.get<boolean>(TUTORIAL_STORAGE_KEY, false)) {
      this.tutorialAutoShown = true;
      this.tutorialCloseButton.set(false);
      this.showTutorial.set(true);
    }
  }

  playCurrentExercise(): void {
    const ex = this.currentExercise();
    if (!ex) return;
    this.audio.resume().then(() => {
      const offset = this.audio.getScheduleOffsetMs();
      if (ex.type === 'interval') {
        const ie = ex as IntervalExercise;
        this.bgTrack.duckFor(800 * 2 + 150 + offset + 300);
        this.audio.playInterval(ie.rootFreq, ie.semitones, 800);
      } else if (ex.type === 'chord') {
        const ce = ex as ChordExercise;
        this.bgTrack.duckFor(1200 + offset + 300);
        this.audio.playChord(ce.rootFreq, ce.chordType, 1200);
      } else if (ex.type === 'note-id') {
        const ne = ex as NoteExercise;
        this.bgTrack.duckFor(900 + offset + 300);
        this.audio.playTone(ne.noteFreq, 900);
        if (ne.showHint) {
          this.noteHintActive.set(true);
          this.noteHintTimer = setTimeout(() => this.noteHintActive.set(false), 1800);
        }
      } else if (ex.type === 'melody') {
        this.playMelodyAudio(ex as MelodyExercise);
      }
    });
  }

  selectAnswer(value: number | string): void {
    this.selectedAnswer.set(value);
  }

  submitAnswer(): void {
    const ex = this.currentExercise();
    if (!ex || this.selectedAnswer() === null) return;

    let correct = false;
    if (ex.type === 'interval') {
      correct = this.selectedAnswer() === (ex as IntervalExercise).semitones;
    } else if (ex.type === 'chord') {
      correct = this.selectedAnswer() === (ex as ChordExercise).chordType;
    } else if (ex.type === 'note-id') {
      correct = this.selectedAnswer() === (ex as NoteExercise).noteName;
    }

    this.finishExercise(correct, correct ? ex.xpReward : 0);
  }

  selectNoteAndSubmit(note: string): void {
    this.selectAnswer(note);
    // Pequeno delay para a tecla iluminada renderizar antes da transição de feedback
    setTimeout(() => this.submitAnswer(), 150);
  }

  // ── Melody ────────────────────────────────────────────────────────────────

  private playMelodyAudio(ex: MelodyExercise): void {
    this.clearMelodyTimers();
    this.melodyPlayingNote.set(null);
    const totalMs = this.audio.playMelody(ex.notes, (idx) => {
      this.melodyPlayingNote.set(ex.notes[idx].note);
      const dur = ex.notes[idx].durationMs;
      this.melodyTimers.push(
        setTimeout(() => this.melodyPlayingNote.set(null), dur + 60),
      );
    });
    this.bgTrack.duckFor(totalMs + this.audio.getScheduleOffsetMs() + 300);
  }

  startMelodyPlay(): void {
    this.melodyPhase.set('play');
    this.melodyStep.set(0);
    this.melodyPlayedNotes.set([]);
    this.melodyWrongNote.set(null);
  }

  tapMelodyNote(note: string): void {
    const ex = this.currentExercise() as MelodyExercise;
    if (!ex || ex.type !== 'melody' || this.melodyPhase() !== 'play') return;

    const step = this.melodyStep();
    const expected = ex.notes[step].note;

    if (note === expected) {
      const played = [...this.melodyPlayedNotes(), note];
      this.melodyPlayedNotes.set(played);

      if (played.length === ex.notes.length) {
        // Melodia completa com acerto
        this.finishExercise(true, ex.xpReward);
      } else {
        this.melodyStep.set(step + 1);
      }
    } else {
      // Nota errada: pisca em vermelho e permite tentar novamente
      this.melodyWrongNote.set(note);
      setTimeout(() => this.melodyWrongNote.set(null), 500);
    }
  }

  private clearMelodyTimers(): void {
    this.melodyTimers.forEach(id => clearTimeout(id));
    this.melodyTimers = [];
  }

  // ── Rhythm ────────────────────────────────────────────────────────────────

  startRhythm(): void {
    const ex = this.currentExercise() as RhythmExercise;
    if (!ex || ex.type !== 'rhythm') return;
    this.clearRhythmTimer();

    const msBeat = (60 / ex.bpm) * 1000;
    const sBeat = msBeat / 1000;
    this.rhythmBeatIndex = 0;
    this.tappedBeats.set(new Array(ex.pattern.length).fill(false));
    this.rhythmBeatStatus.set(new Array(ex.pattern.length).fill('pending'));
    this.rhythmExtraTaps.set(0);
    this.rhythmTapFeedback.set(null);

    this.audio.resume().then(() => {
      // Duck trilha de fundo durante countdown + padrão rítmico
      let patternDurationMs = 0;
      ex.pattern.forEach(beat => {
        patternDurationMs += this.noteDurationMs(beat, msBeat);
      });
      this.bgTrack.duckFor(4 * msBeat + patternDurationMs + this.audio.getScheduleOffsetMs() + 300);

      // ─────────────────────────────────────────────────────────────────────
      // TODO o áudio é pré-agendado de uma só vez no clock interno do Web Audio.
      // Isso garante um stream de áudio contínuo para dispositivos Bluetooth:
      // sem pre-agendamento, cada tick chega de forma intermitente e o device BT
      // pode descartar amostras ao reativar o pipeline.
      // ─────────────────────────────────────────────────────────────────────
      const audioStart = this.audio.getScheduleStart(); // ctx.currentTime + offset

      // Contagem regressiva: ticks 3, 2, 1
      this.audio.playMetronomeTick(false, audioStart);
      this.audio.playMetronomeTick(false, audioStart + sBeat);
      this.audio.playMetronomeTick(false, audioStart + 2 * sBeat);
      // "GO!" (audioStart + 3*sBeat): sem tick de áudio

      // Ritmo: começa 4 beats após o audioStart
      const rhythmStartSecs = audioStart + 4 * sBeat;
      let cumSecs = 0;
      ex.pattern.forEach((beat, idx) => {
        if (beat !== 'rest') {
          this.audio.playMetronomeTick(idx === 0, rhythmStartSecs + cumSecs);
        }
        cumSecs += this.noteDurationMs(beat, msBeat) / 1000;
      });

      // ─────────────────────────────────────────────────────────────────────
      // Atualizações VISUAIS: atrasadas pelo mesmo offset de agendamento
      // do áudio para manter sincronia entre a borda verde e o som.
      // ─────────────────────────────────────────────────────────────────────
      const offsetMs = this.audio.getScheduleOffsetMs();
      const t = (delay: number, fn: () => void) => {
        this.rhythmTimers.push(setTimeout(fn, offsetMs + delay));
      };

      this.countdown.set(-1); // esconde até o offset passar
      t(0,            () => this.countdown.set(3));
      t(msBeat,       () => this.countdown.set(2));
      t(2 * msBeat,   () => this.countdown.set(1));
      t(3 * msBeat,   () => this.countdown.set(0));  // GO!
      t(4 * msBeat,   () => this.countdown.set(-1)); // esconde

      const rhythmVisualStart = 4 * msBeat;
      let cumMs = 0;
      ex.pattern.forEach((beat, idx) => {
        const beatDelay = rhythmVisualStart + cumMs;
        const duration  = this.noteDurationMs(beat, msBeat);
        t(beatDelay, () => {
          this.activeBeat.set(idx);
          this.rhythmBeatIndex = idx + 1;
          t(duration * 0.4, () => {
            if (this.rhythmBeatIndex === idx + 1) this.activeBeat.set(-1);
          });
        });
        cumMs += duration;
      });
      t(rhythmVisualStart + cumMs, () => this.activeBeat.set(-1));

      // Ativa recepção de toques após o countdown
      t(4 * msBeat, () => this.rhythmActive.set(true));

      // Auto-avalia após o padrão terminar + janela de tolerância
      t(rhythmVisualStart + cumMs + ex.toleranceMs, () => {
        this.rhythmActive.set(false);
        this.evaluateRhythm();
      });

      // Expected tap times: alinhados com visual + áudio (ambos usam o mesmo offset)
      const rhythmStartMs = Date.now() + offsetMs + 4 * msBeat;
      let msCum = 0;
      this.rhythmExpectedTimes = ex.pattern.map(note => {
        const time = rhythmStartMs + msCum;
        msCum += this.noteDurationMs(note, msBeat);
        return time;
      });
    });
  }

  handleTap(): void {
    this.tapping.set(true);
    const now = Date.now();
    const ex = this.currentExercise() as RhythmExercise;
    if (!ex) return;

    // Encontra a batida não-rest mais próxima ainda não acertada dentro da tolerância
    let closestIdx = -1;
    let closestDist = Infinity;
    const statuses = this.rhythmBeatStatus();

    for (let i = 0; i < this.rhythmExpectedTimes.length; i++) {
      if (ex.pattern[i] === 'rest') continue;
      if (statuses[i] === 'hit') continue;
      const dist = Math.abs(now - this.rhythmExpectedTimes[i]);
      if (dist < closestDist && dist <= ex.toleranceMs) {
        closestDist = dist;
        closestIdx = i;
      }
    }

    if (closestIdx >= 0) {
      // Toque correto — marca a batida como acertada
      const updated = [...statuses];
      updated[closestIdx] = 'hit';
      this.rhythmBeatStatus.set(updated);

      const tapped = [...this.tappedBeats()];
      tapped[closestIdx] = true;
      this.tappedBeats.set(tapped);
      this.showRhythmTapFeedback('correct');
    } else {
      // Toque fora do tempo — erro
      this.rhythmExtraTaps.update(n => n + 1);
      this.showRhythmTapFeedback('wrong');
    }

    setTimeout(() => this.tapping.set(false), 100);
  }

  private showRhythmTapFeedback(type: 'correct' | 'wrong'): void {
    this.rhythmTapFeedback.set(type);
    setTimeout(() => this.rhythmTapFeedback.set(null), 300);
  }

  private evaluateRhythm(): void {
    const ex = this.currentExercise() as RhythmExercise;
    if (!ex) return;
    this.clearRhythmTimer();

    // Marca batidas não-rest que não foram acertadas como 'miss'
    const statuses = [...this.rhythmBeatStatus()];
    for (let i = 0; i < ex.pattern.length; i++) {
      if (ex.pattern[i] !== 'rest' && statuses[i] === 'pending') {
        statuses[i] = 'miss';
      }
    }
    this.rhythmBeatStatus.set(statuses);

    const nonRestCount = ex.pattern.filter(b => b !== 'rest').length;
    const hits = statuses.filter(s => s === 'hit').length;
    const misses = nonRestCount - hits;
    const extras = this.rhythmExtraTaps();
    const totalErrors = misses + extras;

    // Quase perfeito: max 1 erro para padrões com 6+ batidas, zero para menores
    const maxErrors = nonRestCount >= 6 ? 1 : 0;
    const correct = totalErrors <= maxErrors;

    this.finishExercise(correct, correct ? ex.xpReward : 0);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  retry(): void {
    this.cancelAutoAdvance();
    this.resetExerciseState();
    this.phase.set('exercise');
    this.exerciseStartMs = Date.now();
    setTimeout(() => this.playCurrentExercise(), 400);
  }

  nextExercise(): void {
    if (this.isLastExercise()) {
      this.bgTrack.stop();
      this.phase.set('result');
      return;
    }
    this.currentIndex.update(i => i + 1);
    this.phase.set('exercise');
    this.resetExerciseState();
    this.exerciseStartMs = Date.now();
    this.checkAndShowTutorial();
    setTimeout(() => this.playCurrentExercise(), 400);
  }

  goBack(): void {
    this.bgTrack.stop();
    this.router.navigate(['/home']);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  intervalLabel(semitones: number): string {
    const key = INTERVAL_NAMES[semitones];
    return key ? this.i18n.tStr(key) : String(semitones);
  }

  chordLabel(type: ChordType): string {
    return this.i18n.tStr('chord.' + type);
  }

  private finishExercise(correct: boolean, xpEarned: number): void {
    const ex = this.currentExercise()!;
    const durationMs = Date.now() - this.exerciseStartMs;
    const result: ExerciseResult = {
      exerciseId: ex.id,
      moduleId: ex.moduleId,
      correct,
      xpEarned,
      attemptedAt: Date.now(),
      durationMs,
    };

    this.progress.recordResult(result);
    this.lastCorrect.set(correct);
    this.lastXpEarned.set(xpEarned);
    this.sessionXp.update(s => s + xpEarned);
    this.sessionResults.update(r => [...r, result]);
    this.phase.set('feedback');

    // Play audio feedback (duck trilha de fundo)
    this.audio.resume().then(() => {
      const offset = this.audio.getScheduleOffsetMs();
      this.bgTrack.duckFor(correct ? 620 + offset + 200 : 400 + offset + 200);
      if (correct) {
        this.audio.playTone(523.25, 150); // C5
        setTimeout(() => this.audio.playTone(659.25, 150), 160); // E5
        setTimeout(() => this.audio.playTone(783.99, 300), 320); // G5
      } else {
        this.audio.playTone(220, 400, 'sawtooth', undefined, 0.15);
      }
    });

    if (correct) {
      this.autoAdvancing.set(true);
      this.autoAdvanceTimer = setTimeout(() => {
        this.autoAdvancing.set(false);
        this.nextExercise();
      }, PracticeComponent.AUTO_ADVANCE_MS);
    }
  }

  private cancelAutoAdvance(): void {
    if (this.autoAdvanceTimer !== null) {
      clearTimeout(this.autoAdvanceTimer);
      this.autoAdvanceTimer = null;
    }
    this.autoAdvancing.set(false);
  }

  private resetExerciseState(): void {
    this.selectedAnswer.set(null);
    this.tappedBeats.set([]);
    this.activeBeat.set(-1);
    this.countdown.set(-1);
    this.rhythmExpectedTimes = [];
    this.rhythmBeatIndex = 0;
    this.rhythmBeatStatus.set([]);
    this.rhythmExtraTaps.set(0);
    this.rhythmTapFeedback.set(null);
    this.rhythmActive.set(false);
    this.clearRhythmTimer();
    // Reinicia estado de melodia
    this.melodyPhase.set('listen');
    this.melodyStep.set(0);
    this.melodyPlayedNotes.set([]);
    this.melodyWrongNote.set(null);
    this.melodyPlayingNote.set(null);
    this.clearMelodyTimers();
  }

  private noteDurationMs(note: string, msBeat: number): number {
    return note === 'eighth' ? msBeat / 2 : msBeat;
  }

  private clearRhythmTimer(): void {
    this.rhythmTimers.forEach(id => clearTimeout(id));
    this.rhythmTimers = [];
  }
}
