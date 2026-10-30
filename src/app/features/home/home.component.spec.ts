import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { HomeComponent } from './home.component';
import { ApiService } from '../../core/services/api.service';
import { ProgressService } from '../../core/services/progress.service';
import { Module, ModuleId, UserProgress } from '../../core/models';
import { MODULES } from '../../data/modules.data';
import { EXERCISES } from '../../data/exercises.data';

const MOCK_MODULES: Module[] = [
  {
    id: 'fundamentals',
    nameKey: 'mod.fund',
    description: '',
    icon: '🎵',
    color: '#000',
    order: 1,
    minXpToUnlock: 0,
    exerciseIds: ['e1'],
  },
  {
    id: 'intervals',
    nameKey: 'mod.int',
    description: '',
    icon: '🎶',
    color: '#111',
    order: 2,
    requiredModuleId: 'fundamentals',
    minXpToUnlock: 50,
    exerciseIds: ['e3'],
  },
];

function makeApiSpy() {
  return {
    modules: signal(MOCK_MODULES),
    exercises: signal(EXERCISES),
    achievements: signal([]),
  };
}

function makeProgressSpy() {
  return {
    progress: signal<Pick<UserProgress, 'exerciseHistory'>>({ exerciseHistory: [] }),
    level: signal(1),
    streak: signal(0),
    xpInCurrentLevel: signal(10),
    xpForNextLevel: signal(100),
    getDailyMissions: vi.fn().mockReturnValue([]),
    getRecentBadges: vi.fn().mockReturnValue([]),
    isModuleUnlocked: vi.fn().mockImplementation((id: ModuleId) => id === 'fundamentals'),
    isModuleCompleted: vi.fn().mockReturnValue(false),
  };
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };
  let progressSpy: ReturnType<typeof makeProgressSpy>;
  let apiSpy: ReturnType<typeof makeApiSpy>;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn() };
    progressSpy = makeProgressSpy();
    apiSpy = makeApiSpy();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ApiService, useValue: apiSpy },
        { provide: ProgressService, useValue: progressSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('modules() should return modules from API', () => {
    expect(component.modules().length).toBe(2);
  });

  it('isUnlocked() should delegate to progress service', () => {
    expect(component.isUnlocked(MOCK_MODULES[0])).toBe(true);
    expect(component.isUnlocked(MOCK_MODULES[1])).toBe(false);
  });

  it('isCompleted() should delegate to progress service', () => {
    expect(component.isCompleted(MOCK_MODULES[0])).toBe(false);
    expect(progressSpy.isModuleCompleted).toHaveBeenCalledWith('fundamentals');
  });

  it('continuePractice() should navigate to first unlocked incomplete module', () => {
    component.continuePractice();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/practice', 'fundamentals']);
  });

  it('continuePractice() should fallback to fundamentals when all completed', () => {
    progressSpy.isModuleCompleted.mockReturnValue(true);
    component.continuePractice();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/practice', 'fundamentals']);
  });

  it('openModule() should navigate when unlocked', () => {
    component.openModule(MOCK_MODULES[0]);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/practice', 'fundamentals']);
  });

  it('openModule() should NOT navigate when locked', () => {
    component.openModule(MOCK_MODULES[1]);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('missions() should call getDailyMissions', () => {
    component.missions();
    expect(progressSpy.getDailyMissions).toHaveBeenCalled();
  });

  it('allows free practice in a locked module without unlocking it', () => {
    component.selectFreeModule('intervals');
    component.startFreePractice();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/practice', 'intervals'], {
      queryParams: { mode: 'free' },
    });
    expect(component.isUnlocked(MOCK_MODULES[1])).toBe(false);
  });

  it('recentBadges() should call getRecentBadges(3)', () => {
    component.recentBadges();
    expect(progressSpy.getRecentBadges).toHaveBeenCalledWith(3);
  });

  it('shows the next available lesson with its actual reward', () => {
    apiSpy.modules.set(MODULES);
    fixture.detectChanges();
    const next = component.nextStop();
    expect(next?.module.id).toBe('fundamentals');
    expect(next?.lesson.index).toBe(0);
    expect(component.lessonReward(next!.lesson)).toBe(
      next!.lesson.exercises.reduce((xp, exercise) => xp + exercise.xpReward, 0) + 5,
    );
    expect(fixture.nativeElement.querySelector('.home__next-meta').textContent).toContain(
      'Fundamentos',
    );
  });

  it('collapses locked units and exposes exactly one current lesson', () => {
    apiSpy.modules.set(MODULES);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    expect(host.querySelectorAll('.home__unit--locked[open]')).toHaveLength(0);
    expect(host.querySelectorAll('[aria-current="step"]')).toHaveLength(1);
    expect(
      host.querySelector<HTMLButtonElement>('.home__unit--locked .home__lesson-node')?.disabled,
    ).toBe(true);
    expect(host.querySelector('summary')?.textContent).toContain('Fundamentos');
  });

  it('reflects mastered lessons in the hero without counting partial or free practice', () => {
    apiSpy.modules.set(MODULES);
    const firstLesson = MODULES[0].exerciseIds.slice(0, 3);
    progressSpy.progress.set({
      exerciseHistory: [...firstLesson, 'free-n-4'].map((exerciseId) => ({
        exerciseId,
        moduleId: 'fundamentals',
        correct: true,
        xpEarned: 10,
        attemptedAt: 1,
        durationMs: 1000,
      })),
    });
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const progress = host.querySelector('.home__hero-progress [role="progressbar"]');
    expect(progress?.getAttribute('aria-valuenow')).toBe('1');
    expect(progress?.getAttribute('aria-valuemax')).toBe(String(component.totalLessons()));
    expect(progress?.getAttribute('aria-label')).toBe(
      `1 de ${component.totalLessons()} lições concluídas`,
    );
    expect(component.nextStop()?.lesson.index).toBe(1);
  });

  it('does not render a lesson progress bar for an unavailable catalog', () => {
    apiSpy.modules.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.home__hero-progress')).toBeNull();
  });
});
