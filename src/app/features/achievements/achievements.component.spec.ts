import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';

import { AchievementsComponent } from './achievements.component';
import { ApiService } from '../../core/services/api.service';
import { ProgressService } from '../../core/services/progress.service';
import { Achievement } from '../../core/models';

const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: 'a1', icon: '🏅', titleKey: 'ach.1', descriptionKey: 'ach.1.d',
    condition: { type: 'xp', value: 100 } },
  { id: 'a2', icon: '🔥', titleKey: 'ach.2', descriptionKey: 'ach.2.d',
    condition: { type: 'streak', value: 3 } },
  { id: 'a3', icon: '⭐', titleKey: 'ach.3', descriptionKey: 'ach.3.d',
    condition: { type: 'exercises_done', value: 10 } },
];

describe('AchievementsComponent', () => {
  let component: AchievementsComponent;
  let earnedIds: ReturnType<typeof signal<string[]>>;

  beforeEach(async () => {
    earnedIds = signal<string[]>(['a1']);

    await TestBed.configureTestingModule({
      imports: [AchievementsComponent],
      providers: [
        { provide: ApiService, useValue: { achievements: signal(MOCK_ACHIEVEMENTS) } },
        { provide: ProgressService, useValue: { earnedAchievementIds: earnedIds } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AchievementsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('allAchievements() should return all achievements', () => {
    expect(component.allAchievements().length).toBe(3);
  });

  it('earnedCount() should reflect earned achievements', () => {
    expect(component.earnedCount()).toBe(1);
  });

  it('total() should return total achievements', () => {
    expect(component.total()).toBe(3);
  });

  it('percentage() should compute percentage correctly', () => {
    expect(component.percentage()).toBeCloseTo(33.33, 1);
  });

  it('isEarned() should return true for earned achievement', () => {
    expect(component.isEarned('a1')).toBe(true);
  });

  it('isEarned() should return false for unearned achievement', () => {
    expect(component.isEarned('a2')).toBe(false);
  });

  it('percentage should be NaN when no achievements exist', async () => {
    // Recria com lista vazia
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AchievementsComponent],
      providers: [
        { provide: ApiService, useValue: { achievements: signal([]) } },
        { provide: ProgressService, useValue: { earnedAchievementIds: signal([]) } },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AchievementsComponent);
    const comp = fixture.componentInstance;
    fixture.detectChanges();
    expect(comp.total()).toBe(0);
    expect(comp.percentage()).toBeNaN();
  });
});
