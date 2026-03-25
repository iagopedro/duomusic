import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { PracticeComponent } from './practice.component';
import { AudioService } from '../../core/services/audio.service';
import { ProgressService } from '../../core/services/progress.service';

// ── Helpers ────────────────────────────────────────────────────────────────

function makeAudioSpy() {
  return {
    resume: vi.fn().mockResolvedValue(undefined),
    playInterval: vi.fn(),
    playChord: vi.fn(),
    playTone: vi.fn(),
    playMetronomeTick: vi.fn(),
  };
}

function makeProgressSpy() {
  return { recordResult: vi.fn() };
}

function makeRoute(moduleId: string) {
  return {
    snapshot: { paramMap: { get: vi.fn().mockReturnValue(moduleId) } },
  };
}

async function createFixture(moduleId: string) {
  const audioSpy = makeAudioSpy();
  const progressSpy = makeProgressSpy();
  const routerSpy = { navigate: vi.fn() };

  await TestBed.configureTestingModule({
    imports: [PracticeComponent],
    providers: [
      provideNoopAnimations(),
      { provide: AudioService, useValue: audioSpy },
      { provide: ProgressService, useValue: progressSpy },
      { provide: ActivatedRoute, useValue: makeRoute(moduleId) },
      { provide: Router, useValue: routerSpy },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(PracticeComponent);
  fixture.detectChanges();
  await fixture.whenStable();

  return { fixture, component: fixture.componentInstance, audioSpy, progressSpy, routerSpy };
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
    // rhythmExpectedTimes is empty until startRhythm() runs, so no beat is marked
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

  it('countdown should start at -1', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component.countdown()).toBe(-1);
  });

  it('startRhythm() should set countdown to 3 after audio resolves', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    component.startRhythm();
    // audio.resume() returns an already-resolved promise; flush its .then() microtask
    await Promise.resolve();
    expect(component.countdown()).toBe(3);
  });

  it('submitRhythm() with all beats tapped on time should be correct', async () => {
    const { component, progressSpy } = await createFixture('fundamentals');
    component.startPractice();

    const ex = component.currentExercise() as any;
    const msBeat = (60 / ex.bpm) * 1000;

    // Inject expected times as if the countdown finished
    const now = Date.now();
    let cumulative = 0;
    component['rhythmExpectedTimes'] = ex.pattern.map((note: string) => {
      const t = now + cumulative;
      cumulative += note === 'eighth' ? msBeat / 2 : msBeat;
      return t;
    });
    component.tappedBeats.set(new Array(ex.pattern.length).fill(false));

    // Tap each non-rest beat exactly at expected time
    for (let i = 0; i < ex.pattern.length; i++) {
      if (ex.pattern[i] !== 'rest') {
        component['rhythmTapTimes'].push(component['rhythmExpectedTimes'][i]);
        const updated = [...component.tappedBeats()];
        updated[i] = true;
        component.tappedBeats.set(updated);
      }
    }

    component.submitRhythm();

    expect(component.phase()).toBe('feedback');
    expect(component.lastCorrect()).toBe(true);
    expect(progressSpy.recordResult).toHaveBeenCalled();
  });

  it('submitRhythm() with no taps should be incorrect', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();

    const ex = component.currentExercise() as any;
    const msBeat = (60 / ex.bpm) * 1000;
    const now = Date.now();
    let cumulative = 0;
    // Expected times 5 seconds in the past — no tap can match within tolerance
    component['rhythmExpectedTimes'] = ex.pattern.map((note: string) => {
      const t = now - 5000 + cumulative;
      cumulative += note === 'eighth' ? msBeat / 2 : msBeat;
      return t;
    });
    component.tappedBeats.set(new Array(ex.pattern.length).fill(true));
    component['rhythmTapTimes'] = [now];

    component.submitRhythm();

    expect(component.lastCorrect()).toBe(false);
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

  it('explanationText() should be null for rhythm exercises', async () => {
    const { component } = await createFixture('fundamentals');
    component.startPractice();
    expect(component.explanationText()).toBeNull();
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

  it('trackByIndex should return the index itself', async () => {
    const { component } = await createFixture('fundamentals');
    expect(component.trackByIndex(3)).toBe(3);
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
