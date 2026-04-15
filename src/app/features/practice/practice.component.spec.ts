import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { PracticeComponent } from './practice.component';
import { AudioService } from '../../core/services/audio.service';
import { ProgressService } from '../../core/services/progress.service';
import { BackgroundTrackService } from '../../core/services/background-track.service';
import { ApiService } from '../../core/services/api.service';
import { MODULES } from '../../data/modules.data';
import { EXERCISES } from '../../data/exercises.data';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeAudioSpy() {
  return {
    resume: vi.fn().mockResolvedValue(undefined),
    playInterval: vi.fn(),
    playChord: vi.fn(),
    playTone: vi.fn(),
    playMelody: vi.fn().mockReturnValue(1000),
    playMetronomeTick: vi.fn(),
    getScheduleStart: vi.fn().mockReturnValue(0.2),
    getScheduleOffsetMs: vi.fn().mockReturnValue(200),
  };
}

function makeBgTrackSpy() {
  return {
    start: vi.fn(),
    stop: vi.fn(),
    duckFor: vi.fn(),
  };
}

function makeProgressSpy() {
  return { recordResult: vi.fn() };
}

function makeApiSpy() {
  const modulesSignal = signal(MODULES);
  const exercisesSignal = signal(EXERCISES);
  return {
    modules: modulesSignal,
    exercises: exercisesSignal,
    achievements: signal([]),
    getExercisesForModule: vi.fn().mockImplementation((moduleId: string) => {
      const mod = MODULES.find(m => m.id === moduleId);
      if (!mod) return [];
      return EXERCISES.filter(e => mod.exerciseIds.includes(e.id));
    }),
  };
}

function makeRoute(moduleId: string) {
  return {
    snapshot: { paramMap: { get: vi.fn().mockReturnValue(moduleId) } },
  };
}

async function createFixture(moduleId: string) {
  const audioSpy = makeAudioSpy();
  const progressSpy = makeProgressSpy();
  const bgTrackSpy = makeBgTrackSpy();
  const apiSpy = makeApiSpy();
  const routerSpy = { navigate: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [PracticeComponent],
    providers: [
      provideNoopAnimations(),
      { provide: AudioService, useValue: audioSpy },
      { provide: ProgressService, useValue: progressSpy },
      { provide: BackgroundTrackService, useValue: bgTrackSpy },
      { provide: ApiService, useValue: apiSpy },
      { provide: ActivatedRoute, useValue: makeRoute(moduleId) },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PracticeComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component: fixture.componentInstance, audioSpy, progressSpy, bgTrackSpy, apiSpy, routerSpy };
}

// ══════════════════════════════════════════════════════════════════════════════
// Creation & init
// ══════════════════════════════════════════════════════════════════════════════

describe('PracticeComponent — init', () => {
  it('should create with fundamentals module', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component).toBeTruthy();
  });

  it('should load exercises for the given moduleId', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component.exercises().length).toBeGreaterThan(0);
    expect(component.exercises().every(e => e.moduleId === 'fundamentals')).toBe(true);
  });

  it('should start in intro phase', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component.phase()).toBe('intro');
  });

  it('should redirect to /home for unknown moduleId', async () => {
    const { routerSpy } = await createFixture('nonexistent' as any);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('totalXp computed should sum exercise rewards', async () => {
    const { component } = await createFixture('fundamentals');
    const expected = component.exercises().reduce((sum, e) => sum + e.xpReward, 0);
    expect(component.totalXp()).toBe(expected);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Navigation flow
// ══════════════════════════════════════════════════════════════════════════════

describe('PracticeComponent — navigation flow', () => {
  it('startPractice() should transition to exercise phase', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    expect(component.phase()).toBe('exercise');
  });

  it('startPractice() should reset to exercise index 0', async () => {
    const { component } = await createFixture('fundamentals');
    component.currentIndex.set(2);
    component.startPractice();
    expect(component.currentIndex()).toBe(0);
  });

  it('goBack() should navigate to /home', async () => {
    const { component, routerSpy } = await createFixture('fundamentals');
    component.goBack();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('nextExercise() should advance to next exercise', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    const before = component.currentIndex();
    component.nextExercise();
    expect(component.currentIndex()).toBe(before + 1);
  });

  it('nextExercise() on last exercise should transition to result phase', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    component.currentIndex.set(component.exercises().length - 1);
    component.nextExercise();
    expect(component.phase()).toBe('result');
  });

  it('isLastExercise() should be true on last exercise', async () => {
    const { component } = await createFixture('fundamentals');
    component.currentIndex.set(component.exercises().length - 1);
    expect(component.isLastExercise()).toBe(true);
  });

  it('isLastExercise() should be false on first exercise', async () => {
    const { component } = await createFixture('fundamentals');
    component.currentIndex.set(0);
    expect(component.isLastExercise()).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Interval exercise
// ══════════════════════════════════════════════════════════════════════════════

describe('PracticeComponent — interval exercise', () => {
  it('intervalOptions should return options from current exercise', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    const ex = component.currentExercise();
    if (ex?.type === 'interval') {
      expect(component.intervalOptions()).toEqual(ex.options);
    }
  });

  it('selectAnswer() should set the selected answer', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    component.selectAnswer(4);
    expect(component.selectedAnswer()).toBe(4);
  });

  it('submitAnswer() with correct semitones should transition to feedback with correct=true', async () => {
    const { component, progressSpy } = await createFixture('intervals');
    component.startPractice();
    const ex = component.currentExercise() as any;
    component.selectAnswer(ex.semitones);
    component.submitAnswer();
    expect(component.phase()).toBe('feedback');
    expect(component.lastCorrect()).toBe(true);
    expect(progressSpy.recordResult).toHaveBeenCalled();
  });

  it('submitAnswer() with wrong semitones should set lastCorrect=false', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    const ex = component.currentExercise() as any;
    const wrongAnswer = ex.options.find((o: number) => o !== ex.semitones);
    component.selectAnswer(wrongAnswer);
    component.submitAnswer();
    expect(component.lastCorrect()).toBe(false);
    expect(component.lastXpEarned()).toBe(0);
  });

  it('submitAnswer() should do nothing when no answer is selected', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    component.selectedAnswer.set(null);
    component.submitAnswer();
    expect(component.phase()).toBe('exercise');
  });

  it('intervalLabel() should return translated interval name', async () => {
    const { component } = await createFixture('intervals');
    expect(component.intervalLabel(4)).toBe('3ª maior');
    expect(component.intervalLabel(7)).toBe('5ª justa');
    expect(component.intervalLabel(12)).toBe('Oitava');
  });

  it('intervalLabel() should return semitone string for unknown value', async () => {
    const { component } = await createFixture('intervals');
    expect(component.intervalLabel(99)).toBe('99');
  });

  it('playCurrentExercise() should call audio.playInterval for interval type', async () => {
    const { component, audioSpy } = await createFixture('intervals');
    component.startPractice();
    component.playCurrentExercise();
    await Promise.resolve();
    expect(audioSpy.playInterval).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Chord exercise
// ══════════════════════════════════════════════════════════════════════════════

describe('PracticeComponent — chord exercise', () => {
  it('chordOptions should return options from current exercise', async () => {
    const { component } = await createFixture('chords');
    component.startPractice();
    const ex = component.currentExercise();
    if (ex?.type === 'chord') {
      expect(component.chordOptions()).toEqual(ex.options);
    }
  });

  it('submitAnswer() with correct chord type should set lastCorrect=true', async () => {
    const { component } = await createFixture('chords');
    component.startPractice();
    const ex = component.currentExercise() as any;
    component.selectAnswer(ex.chordType);
    component.submitAnswer();
    expect(component.lastCorrect()).toBe(true);
  });

  it('submitAnswer() with wrong chord type should set lastCorrect=false', async () => {
    const { component } = await createFixture('chords');
    component.startPractice();
    const ex = component.currentExercise() as any;
    const wrong = ex.options.find((o: string) => o !== ex.chordType);
    component.selectAnswer(wrong);
    component.submitAnswer();
    expect(component.lastCorrect()).toBe(false);
  });

  it('chordLabel() should return translated chord name', async () => {
    const { component } = await createFixture('chords');
    expect(component.chordLabel('major')).toBe('Maior');
    expect(component.chordLabel('minor')).toBe('Menor');
    expect(component.chordLabel('dim')).toBe('Diminuto');
    expect(component.chordLabel('aug')).toBe('Aumentado');
  });

  it('playCurrentExercise() should call audio.playChord for chord type', async () => {
    const { component, audioSpy } = await createFixture('chords');
    component.startPractice();
    component.playCurrentExercise();
    await Promise.resolve();
    expect(audioSpy.playChord).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Rhythm exercise
// ══════════════════════════════════════════════════════════════════════════════

describe('PracticeComponent — rhythm exercise', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('rhythmBeats should return pattern from current rhythm exercise', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    const ex = component.currentExercise() as any;
    expect(component.rhythmBeats()).toEqual(ex.pattern);
  });

  it('handleTap() before startRhythm should record tap time but not mark any beat', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    component.handleTap();
    // rhythmExpectedTimes está vazio até startRhythm() ser executado, nenhum beat é marcado
    expect(component.tappedBeats().some(b => b)).toBe(false);
  });

  it('handleTap() should set tapping=true briefly', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    vi.useFakeTimers();
    component.handleTap();
    expect(component.tapping()).toBe(true);
    vi.advanceTimersByTime(150);
    expect(component.tapping()).toBe(false);
  });

  it('spacebar keydown should trigger handleTap during rhythm exercise', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    component.rhythmActive.set(true);
    vi.useFakeTimers();
    const tapSpy = vi.spyOn(component, 'handleTap');
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(tapSpy).toHaveBeenCalledTimes(1);
  });

  it('spacebar keydown should NOT trigger handleTap when rhythm is not active', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    component.rhythmActive.set(false);
    const tapSpy = vi.spyOn(component, 'handleTap');
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(tapSpy).not.toHaveBeenCalled();
  });

  it('spacebar keydown should NOT trigger handleTap during non-rhythm exercise', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    const tapSpy = vi.spyOn(component, 'handleTap');
    document.dispatchEvent(new KeyboardEvent('keydown', { code: 'Space' }));
    expect(tapSpy).not.toHaveBeenCalled();
  });

  it('countdown should start at -1', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component.countdown()).toBe(-1);
  });

  it('startRhythm() should set countdown to 3 after schedule offset', async () => {
    vi.useFakeTimers();
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    component.startRhythm();
    // audio.resume() retorna uma promise já resolvida; flush do microtask .then()
    await Promise.resolve();
    // countdown permanece -1 até o offset (200 ms) passar
    expect(component.countdown()).toBe(-1);
    vi.advanceTimersByTime(200);
    expect(component.countdown()).toBe(3);
  });

  it('evaluateRhythm() with all beats hit should be correct', async () => {
    const { component, progressSpy } = await createFixture('fundamentals');
    component.startPractice();

    const ex = component.currentExercise() as any;

    // Simula que todos os beats não-rest foram acertados
    const statuses = ex.pattern.map((note: string) =>
      note === 'rest' ? 'pending' : 'hit'
    );
    component.rhythmBeatStatus.set(statuses);
    component.rhythmExtraTaps.set(0);

    component['evaluateRhythm']();

    expect(component.phase()).toBe('feedback');
    expect(component.lastCorrect()).toBe(true);
    expect(progressSpy.recordResult).toHaveBeenCalled();
  });

  it('evaluateRhythm() with no taps should be incorrect', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();

    const ex = component.currentExercise() as any;

    // Simula que nenhum beat foi acertado (todos pending)
    component.rhythmBeatStatus.set(new Array(ex.pattern.length).fill('pending'));
    component.rhythmExtraTaps.set(0);

    component['evaluateRhythm']();

    expect(component.lastCorrect()).toBe(false);
  });

  it('evaluateRhythm() with extra taps should be incorrect', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();

    const ex = component.currentExercise() as any;

    // Todos beats acertados mas com toques extras
    const statuses = ex.pattern.map((note: string) =>
      note === 'rest' ? 'pending' : 'hit'
    );
    component.rhythmBeatStatus.set(statuses);
    component.rhythmExtraTaps.set(3);

    component['evaluateRhythm']();

    expect(component.lastCorrect()).toBe(false);
  });

  it('handleTap() within tolerance should mark beat as hit', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();

    const ex = component.currentExercise() as any;
    const msBeat = (60 / ex.bpm) * 1000;
    const now = Date.now();
    let cumulative = 0;
    component['rhythmExpectedTimes'] = ex.pattern.map((note: string) => {
      const t = now + cumulative;
      cumulative += note === 'eighth' ? msBeat / 2 : msBeat;
      return t;
    });
    component.rhythmBeatStatus.set(new Array(ex.pattern.length).fill('pending'));
    component.tappedBeats.set(new Array(ex.pattern.length).fill(false));
    component.rhythmActive.set(true);

    component.handleTap();

    // Primeiro beat não-rest deve ter sido marcado como 'hit'
    const firstNonRest = ex.pattern.findIndex((b: string) => b !== 'rest');
    expect(component.rhythmBeatStatus()[firstNonRest]).toBe('hit');
    expect(component.rhythmTapFeedback()).toBe('correct');
  });

  it('handleTap() far from any beat should count as extra tap', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();

    const ex = component.currentExercise() as any;
    // Tempos esperados 10 segundos no passado
    component['rhythmExpectedTimes'] = ex.pattern.map(() => Date.now() - 10000);
    component.rhythmBeatStatus.set(new Array(ex.pattern.length).fill('pending'));
    component.rhythmActive.set(true);

    component.handleTap();

    expect(component.rhythmExtraTaps()).toBe(1);
    expect(component.rhythmTapFeedback()).toBe('wrong');
  });

  it('noteDurationMs should return half beat for eighth note', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component['noteDurationMs']('eighth', 1000)).toBe(500);
  });

  it('noteDurationMs should return full beat for quarter note', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component['noteDurationMs']('quarter', 1000)).toBe(1000);
  });

  it('noteDurationMs should return full beat for rest', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component['noteDurationMs']('rest', 750)).toBe(750);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Feedback & retry
// ══════════════════════════════════════════════════════════════════════════════

describe('PracticeComponent — feedback phase', () => {
  it('correct answer should earn XP', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    const ex = component.currentExercise() as any;
    component.selectAnswer(ex.semitones);
    component.submitAnswer();
    expect(component.sessionXp()).toBe(ex.xpReward);
    expect(component.lastXpEarned()).toBe(ex.xpReward);
  });

  it('wrong answer should earn 0 XP', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    const ex = component.currentExercise() as any;
    const wrong = ex.options.find((o: number) => o !== ex.semitones);
    component.selectAnswer(wrong);
    component.submitAnswer();
    expect(component.lastXpEarned()).toBe(0);
  });

  it('retry() should reset to exercise phase', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    component.selectAnswer(999);
    component.submitAnswer();
    component.retry();
    expect(component.phase()).toBe('exercise');
    expect(component.selectedAnswer()).toBeNull();
  });

  it('correctCount() should count only correct results', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    const ex = component.currentExercise() as any;
    component.selectAnswer(ex.semitones);
    component.submitAnswer();
    expect(component.correctCount()).toBe(1);
  });

  it('explanationText() for interval should be a string describing the interval', async () => {
    const { component } = await createFixture('intervals');
    component.startPractice();
    const ex = component.currentExercise() as any;
    component.selectAnswer(ex.semitones);
    component.submitAnswer();
    expect(component.explanationText()).toBeTruthy();
    expect(typeof component.explanationText()).toBe('string');
  });

  it('explanationText() for rhythm should return description', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    // Simula que o exercício terminou com acerto
    component.lastCorrect.set(true);
    component.phase.set('feedback');
    expect(component.explanationText()).toBeTruthy();
    expect(typeof component.explanationText()).toBe('string');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Computed helpers
// ══════════════════════════════════════════════════════════════════════════════

describe('PracticeComponent — computed helpers', () => {
  it('moduleName() should return translated module name', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component.moduleName()).toBe('Fundamentos');
  });

  it('currentExercise() should return null when exercises list is empty', async () => {
    const { component } = await createFixture('fundamentals');
    component.exercises.set([]);
    expect(component.currentExercise()).toBeNull();
  });

  it('ngOnDestroy() should clear rhythm timer', async () => {
    const { component } = await createFixture('fundamentals');
    const spy = vi.spyOn(component as any, 'clearRhythmTimer');
    component.ngOnDestroy();
    expect(spy).toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Note-ID exercise — free exploration
// ══════════════════════════════════════════════════════════════════════════════

describe('PracticeComponent — note-id free exploration', () => {
  async function createNoteFixture() {
    const result = await createFixture('fundamentals');
    const { component } = result;
    component.startPractice();
    // Avança até encontrar um exercício note-id
    while (component.currentExercise()?.type !== 'note-id' && !component.isLastExercise()) {
      component.currentIndex.update(i => i + 1);
      component['resetExerciseState']();
    }
    return result;
  }

  it('should start in exploring mode', async () => {
    const { component } = await createNoteFixture();
    if (component.currentExercise()?.type !== 'note-id') return; // skip if no note-id
    expect(component.noteIdExploring()).toBe(true);
  });

  it('selectNoteAndSubmit() should NOT submit when exploring', async () => {
    const { component } = await createNoteFixture();
    if (component.currentExercise()?.type !== 'note-id') return;
    component.selectNoteAndSubmit('C4');
    expect(component.phase()).toBe('exercise'); // still in exercise, not feedback
    expect(component.selectedAnswer()).toBeNull();
  });

  it('selectNoteAnswer() should submit answer', async () => {
    const { component, progressSpy } = await createNoteFixture();
    const ex = component.currentExercise() as any;
    if (ex?.type !== 'note-id') return;
    vi.useFakeTimers();
    component.selectNoteAnswer(ex.noteName);
    vi.advanceTimersByTime(200);
    expect(component.phase()).toBe('feedback');
    expect(component.lastCorrect()).toBe(true);
    expect(progressSpy.recordResult).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('selectNoteAnswer() with wrong note should set lastCorrect=false', async () => {
    const { component } = await createNoteFixture();
    const ex = component.currentExercise() as any;
    if (ex?.type !== 'note-id') return;
    vi.useFakeTimers();
    const wrongNote = ex.noteName === 'C4' ? 'D4' : 'C4';
    component.selectNoteAnswer(wrongNote);
    vi.advanceTimersByTime(200);
    expect(component.lastCorrect()).toBe(false);
    vi.useRealTimers();
  });

  it('noteIdOptions should include the correct answer', async () => {
    const { component } = await createNoteFixture();
    const ex = component.currentExercise() as any;
    if (ex?.type !== 'note-id') return;
    expect(component.noteIdOptions()).toContain(ex.noteName);
  });

  it('noteIdOptions should have 4 options', async () => {
    const { component } = await createNoteFixture();
    if (component.currentExercise()?.type !== 'note-id') return;
    expect(component.noteIdOptions().length).toBe(4);
  });

  it('noteLabel() should strip octave number', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component.noteLabel('C4')).toBe('C');
    expect(component.noteLabel('A#4')).toBe('A#');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Melody exercise — free exploration & recording
// ══════════════════════════════════════════════════════════════════════════════

describe('PracticeComponent — melody free exploration', () => {
  async function createMelodyFixture() {
    const result = await createFixture('fundamentals');
    const { component } = result;
    component.startPractice();
    // Avança até encontrar um exercício melody
    while (component.currentExercise()?.type !== 'melody' && !component.isLastExercise()) {
      component.currentIndex.update(i => i + 1);
      component['resetExerciseState']();
    }
    return result;
  }

  it('should start in listen phase', async () => {
    const { component } = await createMelodyFixture();
    if (component.currentExercise()?.type !== 'melody') return;
    expect(component.melodyPhase()).toBe('listen');
  });

  it('startMelodyExplore() should transition to explore phase', async () => {
    const { component } = await createMelodyFixture();
    if (component.currentExercise()?.type !== 'melody') return;
    component.startMelodyExplore();
    expect(component.melodyPhase()).toBe('explore');
  });

  it('tapMelodyNote() during explore phase should not record notes', async () => {
    const { component } = await createMelodyFixture();
    if (component.currentExercise()?.type !== 'melody') return;
    component.startMelodyExplore();
    component.tapMelodyNote('C4');
    component.tapMelodyNote('D4');
    expect(component.melodyPlayedNotes().length).toBe(0);
    expect(component.melodyStep()).toBe(0);
  });

  it('startMelodyRecord() should transition to countdown phase', async () => {
    const { component } = await createMelodyFixture();
    if (component.currentExercise()?.type !== 'melody') return;
    component.startMelodyExplore();
    component.startMelodyRecord();
    await Promise.resolve();
    expect(component.melodyPhase()).toBe('countdown');
  });

  it('melodyBackToListen() should return to listen phase', async () => {
    const { component } = await createMelodyFixture();
    if (component.currentExercise()?.type !== 'melody') return;
    component.startMelodyExplore();
    component.melodyBackToListen();
    expect(component.melodyPhase()).toBe('listen');
  });

  it('tapMelodyNote() during recording should record notes', async () => {
    const { component } = await createMelodyFixture();
    const ex = component.currentExercise() as any;
    if (ex?.type !== 'melody') return;

    // Simula estado de recording diretamente
    component.melodyPhase.set('recording');
    component.melodyRecording.set(true);
    component['melodyRecordingStart'] = Date.now();
    component['melodyRecordedNotes'] = [];

    component.tapMelodyNote(ex.notes[0].note);
    expect(component.melodyPlayedNotes().length).toBe(1);
    expect(component.melodyStep()).toBe(1);
  });

  it('recording all correct notes should finish with evaluation', async () => {
    vi.useFakeTimers();
    const { component, progressSpy } = await createMelodyFixture();
    const ex = component.currentExercise() as any;
    if (ex?.type !== 'melody') { vi.useRealTimers(); return; }

    // Simula recording
    component.melodyPhase.set('recording');
    component.melodyRecording.set(true);
    component['melodyRecordingStart'] = Date.now();
    component['melodyRecordedNotes'] = [];
    component.melodyStep.set(0);
    component.melodyPlayedNotes.set([]);

    // Toca todas as notas corretas
    for (const note of ex.notes) {
      component.tapMelodyNote(note.note);
    }

    vi.advanceTimersByTime(500);
    expect(component.phase()).toBe('feedback');
    expect(component.melodyScore()).not.toBeNull();
    expect(progressSpy.recordResult).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('perfect execution should score 100%', async () => {
    const { component } = await createMelodyFixture();
    const ex = component.currentExercise() as any;
    if (ex?.type !== 'melody') return;

    // Todas as notas certas, no tempo certo
    const gapMs = 80;
    const recorded: { note: string; timeMs: number }[] = [];
    let cumMs = 0;
    for (const note of ex.notes) {
      recorded.push({ note: note.note, timeMs: cumMs });
      cumMs += note.durationMs + gapMs;
    }
    const score = component['evaluateMelodyScore'](ex, recorded);
    expect(score).toBe(100);
  });

  it('all wrong notes should score 0%', async () => {
    const { component } = await createMelodyFixture();
    const ex = component.currentExercise() as any;
    if (ex?.type !== 'melody') return;

    const recorded: { note: string; timeMs: number }[] = ex.notes.map((_: any, i: number) => ({
      note: 'X9', // nota que não existe na melodia
      timeMs: i * 500,
    }));
    const score = component['evaluateMelodyScore'](ex, recorded);
    expect(score).toBe(0);
  });

  it('empty recording should score 0%', async () => {
    const { component } = await createMelodyFixture();
    const ex = component.currentExercise() as any;
    if (ex?.type !== 'melody') return;

    const score = component['evaluateMelodyScore'](ex, []);
    expect(score).toBe(0);
  });

  it('score >= 70 should pass exercise', async () => {
    vi.useFakeTimers();
    const { component } = await createMelodyFixture();
    const ex = component.currentExercise() as any;
    if (ex?.type !== 'melody') { vi.useRealTimers(); return; }

    // Simula recording com notas perfeitas
    component.melodyPhase.set('recording');
    component.melodyRecording.set(true);
    component['melodyRecordingStart'] = Date.now();
    component['melodyRecordedNotes'] = [];
    component.melodyStep.set(0);
    component.melodyPlayedNotes.set([]);

    for (const note of ex.notes) {
      component.tapMelodyNote(note.note);
    }
    vi.advanceTimersByTime(500);

    expect(component.lastCorrect()).toBe(true);
    expect(component.melodyScore()!).toBeGreaterThanOrEqual(70);
    vi.useRealTimers();
  });

  it('melodyScore should be null before any attempt', async () => {
    const { component } = await createMelodyFixture();
    if (component.currentExercise()?.type !== 'melody') return;
    expect(component.melodyScore()).toBeNull();
  });

  it('resetExerciseState should clear melody recording state', async () => {
    const { component } = await createMelodyFixture();
    component.melodyPhase.set('recording');
    component.melodyRecording.set(true);
    component.melodyScore.set(85);
    component.melodyCountdown.set(2);
    component['resetExerciseState']();
    expect(component.melodyPhase()).toBe('listen');
    expect(component.melodyRecording()).toBe(false);
    expect(component.melodyScore()).toBeNull();
    expect(component.melodyCountdown()).toBe(-1);
  });
});
