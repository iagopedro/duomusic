import {
  Component, ChangeDetectionStrategy, signal, computed, OnInit, OnDestroy, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { trigger, transition, style, animate } from '@angular/animations';

import { I18nService } from '../../core/i18n/i18n.service';
import { AudioService } from '../../core/services/audio.service';
import { ProgressService } from '../../core/services/progress.service';
import { EXERCISES } from '../../data/exercises.data';
import { MODULES } from '../../data/modules.data';
import {
  Exercise, IntervalExercise, ChordExercise, RhythmExercise,
  ExerciseResult, ModuleId, ChordType,
} from '../../core/models';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { XpBarComponent } from '../../shared/components/xp-bar/xp-bar.component';

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
  standalone: true,
  imports: [
    CommonModule, MatIconModule,
    GlassPanelComponent, PrimaryButtonComponent, XpBarComponent,
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

  // Rhythm state
  readonly tapping = signal(false);
  readonly tappedBeats = signal<boolean[]>([]);
  readonly activeBeat = signal(-1);
  readonly countdown = signal(-1); // -1 = hidden, 3/2/1 = counting, 0 = GO!

  private rhythmTimers: ReturnType<typeof setTimeout>[] = [];
  private exerciseStartMs = 0;
  private rhythmBeatIndex = 0;
  private rhythmTapTimes: number[] = [];
  private rhythmExpectedTimes: number[] = [];

  readonly moduleName = computed(() => {
    const mod = MODULES.find(m => m.id === this.moduleId);
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

  readonly explanationText = computed(() => {
    const ex = this.currentExercise();
    if (!ex?.explanationKey) return null;
    const correct = this.lastCorrect();
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
    return null;
  });

  private moduleId!: ModuleId;

  readonly i18n = inject(I18nService);
  private readonly audio = inject(AudioService);
  private readonly progress = inject(ProgressService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    this.moduleId = this.route.snapshot.paramMap.get('moduleId') as ModuleId;
    const mod = MODULES.find(m => m.id === this.moduleId);
    if (!mod) {
      this.router.navigate(['/home']);
      return;
    }
    const exerciseList = EXERCISES.filter(e => mod.exerciseIds.includes(e.id));
    this.exercises.set(exerciseList);
  }

  ngOnDestroy(): void {
    this.clearRhythmTimer();
  }

  startPractice(): void {
    this.phase.set('exercise');
    this.currentIndex.set(0);
    this.exerciseStartMs = Date.now();
    this.resetExerciseState();
    // Auto-play audio exercises
    setTimeout(() => this.playCurrentExercise(), 500);
  }

  playCurrentExercise(): void {
    const ex = this.currentExercise();
    if (!ex) return;
    this.audio.resume().then(() => {
      if (ex.type === 'interval') {
        const ie = ex as IntervalExercise;
        this.audio.playInterval(ie.rootFreq, ie.semitones, 800);
      } else if (ex.type === 'chord') {
        const ce = ex as ChordExercise;
        this.audio.playChord(ce.rootFreq, ce.chordType, 1200);
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
    }

    this.finishExercise(correct, correct ? ex.xpReward : 0);
  }

  // ── Rhythm ────────────────────────────────────────────────────────────────

  startRhythm(): void {
    const ex = this.currentExercise() as RhythmExercise;
    if (!ex || ex.type !== 'rhythm') return;
    this.clearRhythmTimer();

    const msBeat = (60 / ex.bpm) * 1000;
    const sBeat = msBeat / 1000;
    this.rhythmBeatIndex = 0;
    this.rhythmTapTimes = [];
    this.tappedBeats.set(new Array(ex.pattern.length).fill(false));

    this.audio.resume().then(() => {
      // ─────────────────────────────────────────────────────────────────────
      // TODO o áudio é pré-agendado de uma só vez no clock interno do Web Audio.
      // Isso garante um stream de áudio contínuo para dispositivos Bluetooth:
      // sem pre-agendamento, cada tick chega de forma intermitente e o device BT
      // pode descartar amostras ao reativar o pipeline.
      // ─────────────────────────────────────────────────────────────────────
      const audioStart = this.audio.getScheduleStart(); // ctx.currentTime + offset

      // Countdown: ticks 3, 2, 1
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
      // Atualizações VISUAIS: imediatas, sem delay artificial.
      // (A dessincronização com o áudio é tolerável e já existia antes.)
      // ─────────────────────────────────────────────────────────────────────
      const t = (delay: number, fn: () => void) => {
        this.rhythmTimers.push(setTimeout(fn, delay));
      };

      this.countdown.set(3);
      t(msBeat,      () => this.countdown.set(2));
      t(2 * msBeat,  () => this.countdown.set(1));
      t(3 * msBeat,  () => this.countdown.set(0));  // GO!
      t(4 * msBeat,  () => this.countdown.set(-1)); // esconde

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

      // Expected tap times: alinhados com o instante visual (quando o usuário vê o beat)
      const rhythmStartMs = Date.now() + 4 * msBeat;
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
    this.rhythmTapTimes.push(now);

    // Mark the closest non-rest beat as tapped for visual feedback & submit enablement
    if (this.rhythmExpectedTimes.length > 0) {
      const ex = this.currentExercise() as RhythmExercise;
      if (ex) {
        let closestIdx = -1;
        let closestDist = Infinity;
        for (let i = 0; i < this.rhythmExpectedTimes.length; i++) {
          if (ex.pattern[i] === 'rest') continue;
          const dist = Math.abs(now - this.rhythmExpectedTimes[i]);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = i;
          }
        }
        if (closestIdx >= 0) {
          const updated = [...this.tappedBeats()];
          updated[closestIdx] = true;
          this.tappedBeats.set(updated);
        }
      }
    }

    setTimeout(() => this.tapping.set(false), 100);
  }

  submitRhythm(): void {
    const ex = this.currentExercise() as RhythmExercise;
    if (!ex) return;
    this.clearRhythmTimer();

    // Evaluate: for each expected tap (non-rest beats), check closest tap time
    const nonRestIndices = ex.pattern
      .map((b, i) => ({ b, i }))
      .filter(x => x.b !== 'rest')
      .map(x => x.i);

    let hits = 0;
    for (const idx of nonRestIndices) {
      const expected = this.rhythmExpectedTimes[idx];
      if (!expected) continue;
      const closest = this.rhythmTapTimes.reduce(
        (best, t) => Math.abs(t - expected) < Math.abs(best - expected) ? t : best,
        Infinity,
      );
      if (Math.abs(closest - expected) <= ex.toleranceMs) hits++;
    }

    const correct = hits >= Math.ceil(nonRestIndices.length * 0.6);
    this.finishExercise(correct, correct ? ex.xpReward : 0);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  retry(): void {
    this.resetExerciseState();
    this.phase.set('exercise');
    this.exerciseStartMs = Date.now();
    setTimeout(() => this.playCurrentExercise(), 400);
  }

  nextExercise(): void {
    if (this.isLastExercise()) {
      this.phase.set('result');
      return;
    }
    this.currentIndex.update(i => i + 1);
    this.phase.set('exercise');
    this.resetExerciseState();
    this.exerciseStartMs = Date.now();
    setTimeout(() => this.playCurrentExercise(), 400);
  }

  goBack(): void {
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

  trackByIndex(index: number): number { return index; }

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

    // Play audio feedback
    this.audio.resume().then(() => {
      if (correct) {
        this.audio.playTone(523.25, 150); // C5
        setTimeout(() => this.audio.playTone(659.25, 150), 160); // E5
        setTimeout(() => this.audio.playTone(783.99, 300), 320); // G5
      } else {
        this.audio.playTone(220, 400, 'sawtooth');
      }
    });
  }

  private resetExerciseState(): void {
    this.selectedAnswer.set(null);
    this.tappedBeats.set([]);
    this.activeBeat.set(-1);
    this.countdown.set(-1);
    this.rhythmTapTimes = [];
    this.rhythmExpectedTimes = [];
    this.rhythmBeatIndex = 0;
    this.clearRhythmTimer();
  }

  private noteDurationMs(note: string, msBeat: number): number {
    return note === 'eighth' ? msBeat / 2 : msBeat;
  }

  private clearRhythmTimer(): void {
    this.rhythmTimers.forEach(id => clearTimeout(id));
    this.rhythmTimers = [];
  }
}
