import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  OnInit,
  OnDestroy,
  inject,
  effect,
  viewChild,
  ElementRef,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { A11yModule } from '@angular/cdk/a11y';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';

import { I18nService } from '../../core/i18n/i18n.service';
import { AudioService } from '../../core/services/audio.service';
import { BackgroundTrackService } from '../../core/services/background-track.service';
import { ProgressService } from '../../core/services/progress.service';
import { ApiService } from '../../core/services/api.service';
import { StorageService } from '../../core/storage/storage.service';
import { JourneyLesson, JourneyService } from '../../core/services/journey.service';
import { MODULE_CONCEPTS, PracticeMode, theoryForModule } from '../../data/journey.data';
import {
  Exercise,
  IntervalExercise,
  ChordExercise,
  RhythmExercise,
  NoteExercise,
  MelodyExercise,
  ExerciseResult,
  ModuleId,
  ChordType,
} from '../../core/models';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { XpBarComponent } from '../../shared/components/xp-bar/xp-bar.component';
import { SessionResultComponent } from '../../shared/components/session-result/session-result.component';
import { PianoKeyboardComponent } from '../../shared/components/piano-keyboard/piano-keyboard.component';
import { ALL_KEYS } from '../../shared/components/piano-keyboard/piano-keyboard.component';
import {
  PianoTutorialComponent,
  TUTORIAL_STORAGE_KEY,
} from '../../shared/components/piano-tutorial/piano-tutorial.component';

type PracticePhase = 'intro' | 'exercise' | 'feedback' | 'result';

const INTERVAL_NAMES: Record<number, string> = {
  0: 'interval.unison',
  1: 'interval.minor2',
  2: 'interval.major2',
  3: 'interval.minor3',
  4: 'interval.major3',
  5: 'interval.perfect4',
  6: 'interval.tritone',
  7: 'interval.perfect5',
  8: 'interval.minor6',
  9: 'interval.major6',
  10: 'interval.minor7',
  11: 'interval.major7',
  12: 'interval.octave',
};

const EXERCISE_PRESENTATION: Record<Exercise['type'], { icon: string; label: string }> = {
  'note-id': { icon: 'piano', label: 'exercise.note.title' },
  rhythm: { icon: 'graphic_eq', label: 'exercise.rhythm.title' },
  interval: { icon: 'hearing', label: 'exercise.interval.title' },
  chord: { icon: 'piano', label: 'exercise.chord.title' },
  melody: { icon: 'queue_music', label: 'exercise.melody.title' },
  theory: { icon: 'psychology', label: 'practice.theory.label' },
};

@Component({
  selector: 'app-practice',
  imports: [
    MatIconModule,
    A11yModule,
    GlassPanelComponent,
    PrimaryButtonComponent,
    XpBarComponent,
    SessionResultComponent,
    PianoKeyboardComponent,
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
        animate(
          '300ms cubic-bezier(0.34,1.56,0.64,1)',
          style({ opacity: 1, transform: 'scale(1)' }),
        ),
      ]),
    ]),
    trigger('countdownPop', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.4)' }),
        animate(
          '300ms cubic-bezier(0.34,1.56,0.64,1)',
          style({ opacity: 1, transform: 'scale(1)' }),
        ),
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
  readonly reviewQueue = signal<Exercise[]>([]);
  readonly reviewing = signal(false);
  readonly combo = signal(0);
  readonly bestCombo = signal(0);
  readonly mode = signal<PracticeMode>('guided');
  readonly modes: PracticeMode[] = ['guided', 'standard', 'challenge'];
  readonly loading = signal(true);
  readonly loadError = signal(false);
  readonly freePractice = signal(false);
  readonly lessonIndex = signal(0);
  readonly lessonSize = signal(0);
  readonly lessonXp = signal(0);
  readonly exitConfirm = signal(false);
  readonly playbackActive = signal(false);
  private playbackIndicatorTimer: ReturnType<typeof setTimeout> | null = null;
  readonly exercisePresentation = computed(() => {
    const exercise = this.currentExercise();
    return exercise ? EXERCISE_PRESENTATION[exercise.type] : null;
  });
  readonly sessionStars = computed(() =>
    this.accuracy() === 100 ? 3 : this.accuracy() >= 70 ? 2 : 1,
  );
  readonly theoryExercise = computed(() => {
    const exercise = this.currentExercise();
    return exercise?.type === 'theory' ? exercise : null;
  });
  readonly concept = computed(
    () => MODULE_CONCEPTS[this.currentExercise()?.moduleId ?? this.moduleId],
  );
  readonly phaseHeading = viewChild<ElementRef<HTMLElement>>('phaseHeading');
  readonly sessionLabel = computed(() =>
    this.reviewing()
      ? this.i18n.t('journey.review.round')
      : this.freePractice()
        ? this.i18n.t('journey.free')
        : this.i18n.t('journey.lesson.label', { n: this.lessonIndex() + 1 }),
  );
  private lesson?: JourneyLesson;
  private sourceExercises: Exercise[] = [];
  private playbackTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;
  readonly accuracy = computed(() => {
    const results = this.sessionResults();
    return results.length
      ? Math.round((results.filter((result) => result.correct).length / results.length) * 100)
      : 0;
  });

  // Estado de identificação de nota
  readonly noteHintActive = signal(false);
  private noteHintTimer: ReturnType<typeof setTimeout> | null = null;

  // Estado de melodia
  readonly melodyPhase = signal<'listen' | 'explore' | 'countdown' | 'recording' | 'play'>(
    'listen',
  );
  readonly melodyStep = signal(0); // qual nota o usuário deve tocar agora
  readonly melodyWrongNote = signal<string | null>(null);
  readonly melodyPlayedNotes = signal<string[]>([]); // notas tocadas corretamente
  private melodyTimers: ReturnType<typeof setTimeout>[] = [];
  private melodyPlayingNote = signal<string | null>(null); // tecla acesa durante reprodução

  // Estado de gravação de melodia (modo exploração livre)
  readonly melodyCountdown = signal(-1); // -1 = hidden, 3/2/1 = counting, 0 = GO!
  readonly melodyRecording = signal(false);
  readonly melodyScore = signal<number | null>(null);
  private melodyRecordedNotes: { note: string; timeMs: number }[] = [];
  private melodyRecordingStart = 0;
  private melodyRecordingTimer: ReturnType<typeof setTimeout> | null = null;

  // Estado de note-id com exploração livre
  readonly noteIdExploring = signal(true); // começa em exploração livre
  readonly noteIdOptions = computed<string[]>(() => {
    const ex = this.currentExercise();
    if (ex?.type !== 'note-id') return [];
    const ne = ex as NoteExercise;
    return this.generateNoteOptions(ne.noteName);
  });

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

  readonly moduleName = computed(() => {
    const mod = this.api.modules().find((m) => m.id === this.moduleId);
    return mod ? this.i18n.tStr(mod.nameKey) : '';
  });

  readonly currentExercise = computed<Exercise | null>(() => {
    const list = this.exercises();
    const idx = this.currentIndex();
    return list[idx] ?? null;
  });

  readonly isLastExercise = computed(() => this.currentIndex() >= this.exercises().length - 1);

  readonly totalXp = computed(() => this.exercises().reduce((sum, e) => sum + e.xpReward, 0));

  readonly correctCount = computed(
    () =>
      new Set(
        this.sessionResults()
          .filter((result) => result.correct)
          .map((result) => result.exerciseId),
      ).size,
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
    if (this.melodyPhase() === 'recording' && step < notes.length) {
      return notes[step].note;
    }
    return null;
  });

  // Tecla a iluminar durante a reprodução automática da melodia
  readonly melodyHighlightNote = computed<string | null>(() => this.melodyPlayingNote());

  readonly explanationText = computed(() => {
    const ex = this.currentExercise();
    if (!ex) return null;
    const correct = this.lastCorrect();
    // Ritmo não precisa de explanationKey — sempre mostra feedback
    if (ex.type === 'rhythm') {
      return correct
        ? 'Pulso consistente! As colcheias duram metade das semínimas; as pausas também ocupam tempo.'
        : 'O ritmo não ficou preciso. Ouça com atenção e toque junto com as batidas.';
    }
    if (ex.type === 'theory') return this.i18n.tStr(ex.explanationKey ?? '');
    const ex2 = ex as IntervalExercise;
    if (ex.type === 'interval') {
      const name = this.i18n.tStr(INTERVAL_NAMES[ex2.semitones]);
      return correct
        ? `${name}: ${ex2.semitones} semitons entre as notas. Bem reconhecido!`
        : `O intervalo correto era ${name}: ${ex2.semitones} semitons entre as notas.`;
    }
    if (ex.type === 'chord') {
      const c = ex as ChordExercise;
      const name = this.i18n.tStr('chord.' + c.chordType);
      return correct ? `O acorde era ${name}. Ouvido afinado!` : `O acorde correto era: ${name}.`;
    }
    if (ex.type === 'note-id') {
      const n = ex as NoteExercise;
      return correct
        ? `A nota era ${n.noteName.replace(/\d/, '')}. Perfeito!`
        : `A nota correta era ${n.noteName.replace(/\d/, '')}. Continue praticando!`;
    }
    if (ex.type === 'melody') {
      const m = ex as MelodyExercise;
      const seq = m.notes.map((n) => n.note.replace(/\d/, '')).join(' → ');
      const score = this.melodyScore();
      if (score !== null) {
        return correct
          ? `Melodia completa: ${seq}. Score: ${score}%. Excelente memória musical!`
          : `A melodia era: ${seq}. Score: ${score}%. Você precisa de 70% para avançar.`;
      }
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
  private readonly journey = inject(JourneyService);
  private readonly storage = inject(StorageService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  constructor() {
    effect(() => this.phaseHeading()?.nativeElement.focus());
  }

  private readonly onKeydown = (event: KeyboardEvent): void => {
    if (
      event.code === 'Space' &&
      !event.repeat &&
      !(
        event.target instanceof HTMLElement &&
        event.target.closest('button, input, select, textarea')
      ) &&
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
    const savedMode = this.storage.get<string>('duomusic_practice_mode', 'guided');
    this.mode.set(savedMode === 'standard' || savedMode === 'challenge' ? savedMode : 'guided');
    this.freePractice.set(this.route.snapshot.queryParamMap?.get('mode') === 'free');
    void this.loadExercises();
  }

  async loadExercises(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(false);
    try {
      if (!this.api.modules().some((module) => module.id === this.moduleId)) {
        this.router.navigate(['/home']);
        return;
      }
      if (this.freePractice()) {
        this.sourceExercises = (await this.api.generateExercises(this.moduleId, 5))
          .slice(0, 5)
          .map((exercise) => ({ ...exercise, id: `free-${exercise.id}`, moduleId: this.moduleId }));
      } else {
        const requested = this.route.snapshot.queryParamMap?.get('lesson');
        this.lesson =
          this.route.snapshot.queryParamMap?.get('mode') === 'review'
            ? this.journey.reviewLesson(this.moduleId)
            : requested !== null && requested !== undefined
              ? this.journey
                  .lessons(this.moduleId)
                  .find((lesson) => lesson.index === Number(requested) && lesson.unlocked)
              : this.journey.nextLesson(this.moduleId);
        this.sourceExercises = this.lesson?.exercises ?? [];
        this.lessonIndex.set(this.lesson?.index ?? 0);
      }
      if (this.destroyed) return;
      this.selectMode(this.mode());
      this.loadError.set(!this.exercises().length);
    } catch {
      this.loadError.set(true);
    } finally {
      if (!this.destroyed) this.loading.set(false);
    }
  }

  selectMode(mode: PracticeMode): void {
    if (this.phase() !== 'intro') return;
    this.mode.set(mode);
    this.storage.set('duomusic_practice_mode', mode);
    this.exercises.set(
      this.lesson
        ? this.journey.prepare(this.lesson, this.moduleId, mode)
        : this.sourceExercises.length
          ? [
              ...this.sourceExercises.map((exercise) => this.journey.adapt(exercise, mode)),
              theoryForModule(this.moduleId, mode, 0),
            ]
          : [],
    );
    this.lessonSize.set(this.exercises().length);
    this.lessonXp.set(this.totalXp());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.stopPlaybackIndicator();
    if (this.playbackTimer) clearTimeout(this.playbackTimer);
    document.removeEventListener('keydown', this.onKeydown);
    this.bgTrack.stop();
    this.clearRhythmTimer();
    this.clearMelodyTimers();
    if (this.noteHintTimer) clearTimeout(this.noteHintTimer);
    if (this.melodyRecordingTimer) clearTimeout(this.melodyRecordingTimer);
  }

  startPractice(): void {
    if (!this.exercises().length || this.loading()) return;
    this.lessonSize.set(this.exercises().length);
    this.lessonXp.set(this.totalXp());
    this.sessionResults.set([]);
    this.sessionXp.set(0);
    this.reviewQueue.set([]);
    this.reviewing.set(false);
    this.combo.set(0);
    this.bestCombo.set(0);
    this.phase.set('exercise');
    this.currentIndex.set(0);
    this.exerciseStartMs = Date.now();
    this.resetExerciseState();
    // Inicia trilha de fundo (mantém pipeline Bluetooth ativo)
    this.audio.resume().then(() => this.bgTrack.start(this.moduleId));
    this.checkAndShowTutorial();
    // Reprodução automática do exercício de áudio
    this.schedulePlayback();
  }

  closeTutorial(): void {
    if (this.tutorialAutoShown) {
      this.storage.set(TUTORIAL_STORAGE_KEY, true);
    }
    this.tutorialAutoShown = false;
    this.showTutorial.set(false);
    this.schedulePlayback();
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
    if (!ex || this.destroyed || this.showTutorial()) return;
    this.audio.resume().then(() => {
      if (this.destroyed || this.currentExercise() !== ex) return;
      const offset = this.audio.getScheduleOffsetMs();
      if (ex.type === 'interval') {
        const ie = ex as IntervalExercise;
        this.bgTrack.duckFor(800 * 2 + 150 + offset + 300);
        this.audio.playInterval(ie.rootFreq, ie.semitones, 800);
        this.indicatePlayback(1750 + offset);
      } else if (ex.type === 'chord') {
        const ce = ex as ChordExercise;
        this.bgTrack.duckFor(1200 + offset + 300);
        this.audio.playChord(ce.rootFreq, ce.chordType, 1200);
        this.indicatePlayback(1200 + offset);
      } else if (ex.type === 'note-id') {
        const ne = ex as NoteExercise;
        this.bgTrack.duckFor(900 + offset + 300);
        this.audio.playTone(ne.noteFreq, 900);
        this.indicatePlayback(900 + offset);
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
    } else if (ex.type === 'theory') {
      correct = this.selectedAnswer() === ex.answer;
    }

    this.finishExercise(correct, correct ? ex.xpReward : 0);
  }

  selectNoteAndSubmit(note: string): void {
    // No modo exploração livre, apenas toca o som — não submete
    // A submissão ocorre via selectNoteAnswer()
  }

  /** Seleciona uma das alternativas apresentadas no note-id e submete */
  selectNoteAnswer(note: string): void {
    this.selectAnswer(note);
    this.submitAnswer();
  }

  // ── Melody ────────────────────────────────────────────────────────────────

  private playMelodyAudio(ex: MelodyExercise): void {
    this.clearMelodyTimers();
    this.melodyPlayingNote.set(null);
    const totalMs = this.audio.playMelody(ex.notes, (idx) => {
      this.melodyPlayingNote.set(ex.notes[idx].note);
      const dur = ex.notes[idx].durationMs;
      this.melodyTimers.push(setTimeout(() => this.melodyPlayingNote.set(null), dur + 60));
    });
    this.bgTrack.duckFor(totalMs + this.audio.getScheduleOffsetMs() + 300);
    this.indicatePlayback(totalMs + this.audio.getScheduleOffsetMs());
  }

  /** Transição de listen → explore (exploração livre) */
  startMelodyExplore(): void {
    this.melodyPhase.set('explore');
  }

  /** Inicia contagem regressiva antes da gravação */
  startMelodyRecord(): void {
    const ex = this.currentExercise() as MelodyExercise;
    if (!ex || ex.type !== 'melody') return;

    this.melodyPhase.set('countdown');
    this.melodyRecordedNotes = [];
    this.melodyStep.set(0);
    this.melodyPlayedNotes.set([]);

    const msBeat = (60 / ex.bpm) * 1000;
    const sBeat = msBeat / 1000;

    this.audio.resume().then(() => {
      const audioStart = this.audio.getScheduleStart();
      this.audio.playMetronomeTick(false, audioStart);
      this.audio.playMetronomeTick(false, audioStart + sBeat);
      this.audio.playMetronomeTick(false, audioStart + 2 * sBeat);

      const offsetMs = this.audio.getScheduleOffsetMs();
      const t = (delay: number, fn: () => void) => {
        this.melodyTimers.push(setTimeout(fn, offsetMs + delay));
      };

      this.melodyCountdown.set(-1);
      t(0, () => this.melodyCountdown.set(3));
      t(msBeat, () => this.melodyCountdown.set(2));
      t(2 * msBeat, () => this.melodyCountdown.set(1));
      t(3 * msBeat, () => {
        this.melodyCountdown.set(0); // GO!
      });
      t(4 * msBeat, () => {
        this.melodyCountdown.set(-1);
        this.startMelodyRecording(ex);
      });
    });
  }

  private startMelodyRecording(ex: MelodyExercise): void {
    this.melodyPhase.set('recording');
    this.melodyRecording.set(true);
    this.melodyRecordingStart = Date.now();
    this.melodyRecordedNotes = [];
    this.melodyStep.set(0);
    this.melodyPlayedNotes.set([]);

    // Calcula duração total da melodia + margem de 50%
    let totalMs = 0;
    const gapMs = 80;
    ex.notes.forEach((n) => {
      totalMs += n.durationMs + gapMs;
    });
    const recordingLimit = totalMs * 1.5;

    this.melodyRecordingTimer = setTimeout(() => {
      this.finishMelodyRecording();
    }, recordingLimit);
  }

  /** Captura nota durante gravação de melodia */
  tapMelodyNote(note: string): void {
    const phase = this.melodyPhase();

    // Exploração livre — apenas toca som, sem registro
    if (phase === 'explore') return;

    // Gravação ativa — registra nota com timestamp
    if (phase === 'recording') {
      const timeMs = Date.now() - this.melodyRecordingStart;
      this.melodyRecordedNotes.push({ note, timeMs });
      const played = [...this.melodyPlayedNotes(), note];
      this.melodyPlayedNotes.set(played);
      this.melodyStep.set(played.length);

      const ex = this.currentExercise() as MelodyExercise;
      if (played.length >= ex.notes.length) {
        // Gravou todas as notas necessárias
        if (this.melodyRecordingTimer) {
          clearTimeout(this.melodyRecordingTimer);
          this.melodyRecordingTimer = null;
        }
        setTimeout(() => this.finishMelodyRecording(), 300);
      }
      return;
    }
  }

  private finishMelodyRecording(): void {
    this.melodyRecording.set(false);
    if (this.melodyRecordingTimer) {
      clearTimeout(this.melodyRecordingTimer);
      this.melodyRecordingTimer = null;
    }

    const ex = this.currentExercise() as MelodyExercise;
    if (!ex || ex.type !== 'melody') return;

    const score = this.evaluateMelodyScore(ex, this.melodyRecordedNotes);
    this.melodyScore.set(score);
    const passed = score >= 70;

    this.finishExercise(passed, passed ? ex.xpReward : 0);
  }

  /**
   * Avalia a execução da melodia gravada.
   * Score = 60% precisão de notas + 40% precisão de tempo.
   */
  private evaluateMelodyScore(
    ex: MelodyExercise,
    recorded: { note: string; timeMs: number }[],
  ): number {
    const expected = ex.notes;
    if (recorded.length === 0) return 0;

    // -- Precisão de notas (60% do score) --
    // Compara notas gravadas na mesma ordem
    let noteHits = 0;
    for (let i = 0; i < expected.length; i++) {
      if (i < recorded.length && recorded[i].note === expected[i].note) {
        noteHits++;
      }
    }
    const noteAccuracy = noteHits / expected.length;

    // -- Precisão de tempo (40% do score) --
    // Para cada nota correta, calcula desvio relativo ao tempo esperado
    const gapMs = 80;
    const expectedTimes: number[] = [];
    let cumMs = 0;
    expected.forEach((n) => {
      expectedTimes.push(cumMs);
      cumMs += n.durationMs + gapMs;
    });

    let timeScoreSum = 0;
    let timeScoreCount = 0;
    for (let i = 0; i < expected.length; i++) {
      if (i < recorded.length && recorded[i].note === expected[i].note) {
        const expectedTime = expectedTimes[i];
        const actualTime = recorded[i].timeMs;
        const deviation = Math.abs(actualTime - expectedTime);
        const maxDeviation = expected[i].durationMs; // tolerância = duração da nota
        const timeScore = Math.max(0, 1 - deviation / maxDeviation);
        timeScoreSum += timeScore;
        timeScoreCount++;
      }
    }
    const timeAccuracy = timeScoreCount > 0 ? timeScoreSum / timeScoreCount : 0;

    const finalScore = Math.round(noteAccuracy * 60 + timeAccuracy * 40);
    return Math.min(100, Math.max(0, finalScore));
  }

  /** Volta da fase de explore para listen */
  melodyBackToListen(): void {
    this.melodyPhase.set('listen');
    this.playCurrentExercise();
  }

  startMelodyPlay(): void {
    this.melodyPhase.set('explore');
    this.melodyStep.set(0);
    this.melodyPlayedNotes.set([]);
    this.melodyWrongNote.set(null);
  }

  private clearMelodyTimers(): void {
    this.melodyTimers.forEach((id) => clearTimeout(id));
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
      ex.pattern.forEach((beat) => {
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
      t(0, () => this.countdown.set(3));
      t(msBeat, () => this.countdown.set(2));
      t(2 * msBeat, () => this.countdown.set(1));
      t(3 * msBeat, () => this.countdown.set(0)); // GO!
      t(4 * msBeat, () => this.countdown.set(-1)); // esconde

      const rhythmVisualStart = 4 * msBeat;
      let cumMs = 0;
      ex.pattern.forEach((beat, idx) => {
        const beatDelay = rhythmVisualStart + cumMs;
        const duration = this.noteDurationMs(beat, msBeat);
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
      this.rhythmExpectedTimes = ex.pattern.map((note) => {
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
      this.rhythmExtraTaps.update((n) => n + 1);
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

    const nonRestCount = ex.pattern.filter((b) => b !== 'rest').length;
    const hits = statuses.filter((s) => s === 'hit').length;
    const extras = this.rhythmExtraTaps();
    const precision = nonRestCount > 0 ? Math.max(0, hits - extras) / nonRestCount : 0;
    const threshold = this.mode() === 'guided' ? 0.6 : this.mode() === 'challenge' ? 0.95 : 0.8;
    const correct = precision >= threshold;

    this.finishExercise(correct, correct ? ex.xpReward : 0);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  retry(): void {
    if (this.lastCorrect()) return;
    this.resetExerciseState();
    this.phase.set('exercise');
    this.exerciseStartMs = Date.now();
    this.schedulePlayback();
  }

  nextExercise(): void {
    if (this.isLastExercise()) {
      if (this.reviewQueue().length) {
        this.exercises.set([...this.reviewQueue()]);
        this.reviewQueue.set([]);
        this.reviewing.set(true);
        this.currentIndex.set(0);
      } else {
        this.bgTrack.stop();
        this.phase.set('result');
        return;
      }
    } else {
      this.currentIndex.update((index) => index + 1);
    }
    this.phase.set('exercise');
    this.resetExerciseState();
    this.exerciseStartMs = Date.now();
    this.checkAndShowTutorial();
    this.schedulePlayback();
  }

  goBack(): void {
    if (this.phase() === 'exercise' || this.phase() === 'feedback') {
      this.exitConfirm.set(true);
      return;
    }
    this.leavePractice();
  }

  leavePractice(): void {
    this.bgTrack.stop();
    this.router.navigate(['/home']);
  }

  private schedulePlayback(): void {
    if (this.playbackTimer) clearTimeout(this.playbackTimer);
    this.playbackTimer = setTimeout(() => {
      if (this.phase() === 'exercise' && !this.showTutorial() && !this.destroyed)
        this.playCurrentExercise();
    }, 400);
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
    if (this.phase() !== 'exercise') return;
    this.stopPlaybackIndicator();
    const ex = this.currentExercise()!;
    const alreadyCorrect = this.sessionResults().some(
      (result) => result.exerciseId === ex.id && result.correct,
    );
    if (alreadyCorrect) xpEarned = 0;
    if (correct) {
      this.reviewQueue.update((queue) => queue.filter((exercise) => exercise.id !== ex.id));
      this.combo.update((combo) => combo + 1);
      this.bestCombo.update((best) => Math.max(best, this.combo()));
    } else {
      this.combo.set(0);
      this.reviewQueue.update((queue) =>
        queue.some((exercise) => exercise.id === ex.id) ? queue : [...queue, ex],
      );
    }
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
    this.sessionXp.update((s) => s + xpEarned);
    this.sessionResults.update((r) => [...r, result]);
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
  }

  private resetExerciseState(): void {
    this.stopPlaybackIndicator();
    if (this.playbackTimer) clearTimeout(this.playbackTimer);
    if (this.noteHintTimer) clearTimeout(this.noteHintTimer);
    this.noteHintActive.set(false);
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
    this.melodyCountdown.set(-1);
    this.melodyRecording.set(false);
    this.melodyScore.set(null);
    this.melodyRecordedNotes = [];
    if (this.melodyRecordingTimer) {
      clearTimeout(this.melodyRecordingTimer);
      this.melodyRecordingTimer = null;
    }
    this.clearMelodyTimers();
    // Reinicia estado de note-id
    this.noteIdExploring.set(true);
  }

  private noteDurationMs(note: string, msBeat: number): number {
    return note === 'eighth' ? msBeat / 2 : msBeat;
  }

  private indicatePlayback(durationMs: number): void {
    this.stopPlaybackIndicator();
    this.playbackActive.set(true);
    this.playbackIndicatorTimer = setTimeout(() => this.playbackActive.set(false), durationMs);
  }

  private stopPlaybackIndicator(): void {
    if (this.playbackIndicatorTimer) clearTimeout(this.playbackIndicatorTimer);
    this.playbackIndicatorTimer = null;
    this.playbackActive.set(false);
  }

  private clearRhythmTimer(): void {
    this.rhythmTimers.forEach((id) => clearTimeout(id));
    this.rhythmTimers = [];
  }

  /**
   * Gera opções de notas para o exercício note-id.
   * Inclui a resposta correta + 3 notas aleatórias diferentes (naturais, sem sustenidos).
   * ALL_KEYS contém C4 e C5 (mesmo rótulo "C"), então a exclusão e a deduplicação
   * são feitas pelo rótulo (nome da nota sem oitava), não pela string completa.
   */
  private generateNoteOptions(correctNote: string): string[] {
    const correctLabel = this.noteLabel(correctNote);
    const naturalNotes = ALL_KEYS.filter((k) => !k.isBlack)
      .map((k) => k.note)
      .sort(() => Math.random() - 0.5);

    const usedLabels = new Set<string>([correctLabel]);
    const others: string[] = [];
    for (const note of naturalNotes) {
      const label = this.noteLabel(note);
      if (usedLabels.has(label)) continue;
      usedLabels.add(label);
      others.push(note);
      if (others.length === 3) break;
    }

    const options = [correctNote, ...others];
    // Shuffle final
    return options.sort(() => Math.random() - 0.5);
  }

  /** Rótulo curto da nota para exibição nas alternativas */
  noteLabel(note: string): string {
    return note.replace(/\d/, '');
  }
}
