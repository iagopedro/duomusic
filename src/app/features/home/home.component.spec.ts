import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { HomeComponent } from './home.component';
import { ApiService } from '../../core/services/api.service';
import { ProgressService } from '../../core/services/progress.service';
import { Module, ModuleId } from '../../core/models';

const MOCK_MODULES: Module[] = [
  {
    id: 'fundamentals', nameKey: 'mod.fund', description: '', icon: '🎵',
    color: '#000', order: 1, minXpToUnlock: 0, exerciseIds: ['e1'],
  },
  {
    id: 'intervals', nameKey: 'mod.int', description: '', icon: '🎶',
    color: '#111', order: 2, requiredModuleId: 'fundamentals', minXpToUnlock: 50,
    exerciseIds: ['e3'],
  },
];

function makeApiSpy() {
  return {
    modules: signal(MOCK_MODULES),
    exercises: signal([]),
    achievements: signal([]),
  };
}

function makeProgressSpy() {
  return {
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

  beforeEach(async () => {
    routerSpy = { navigate: vi.fn() };
    progressSpy = makeProgressSpy();

    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ApiService, useValue: makeApiSpy() },
        { provide: ProgressService, useValue: progressSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(HomeComponent);
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

  it('recentBadges() should call getRecentBadges(3)', () => {
    component.recentBadges();
    expect(progressSpy.getRecentBadges).toHaveBeenCalledWith(3);
  });
});
