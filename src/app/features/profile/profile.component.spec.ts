import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { ProfileComponent } from './profile.component';
import { ProgressService } from '../../core/services/progress.service';
import { SettingsService } from '../../core/services/settings.service';

function makeProgressSpy() {
  return {
    accuracy: signal(85),
    streak: signal(3),
    xp: signal(250),
    progress: signal({
      exerciseHistory: [{ exerciseId: 'e1' }, { exerciseId: 'e2' }, { exerciseId: 'e3' }],
      totalPracticeMs: 300000, // 5 minutes
    }),
  };
}

function makeSettingsSpy() {
  return {
    settings: signal({ volume: 0.8, reduceAnimations: false, darkTheme: true }),
    setVolume: vi.fn(),
    setReduceAnimations: vi.fn(),
    setDarkTheme: vi.fn(),
  };
}

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let settingsSpy: ReturnType<typeof makeSettingsSpy>;

  beforeEach(async () => {
    settingsSpy = makeSettingsSpy();

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProgressService, useValue: makeProgressSpy() },
        { provide: SettingsService, useValue: settingsSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('accuracy should reflect progress service', () => {
    expect(component.accuracy()).toBe(85);
  });

  it('streak should reflect progress service', () => {
    expect(component.streak()).toBe(3);
  });

  it('xp should reflect progress service', () => {
    expect(component.xp()).toBe(250);
  });

  it('exerciseCount should return history length', () => {
    expect(component.exerciseCount()).toBe(3);
  });

  it('practiceMinutes should convert ms to minutes', () => {
    expect(component.practiceMinutes()).toBe(5);
  });

  it('practiceMinutes should round correctly', async () => {
    // 90_000 ms = 1.5 min → rounds to 2
    await TestBed.resetTestingModule();
    const progress = makeProgressSpy();
    progress.progress.set({ exerciseHistory: [], totalPracticeMs: 90000 });

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ProgressService, useValue: progress },
        { provide: SettingsService, useValue: makeSettingsSpy() },
      ],
    }).compileComponents();

    const f = TestBed.createComponent(ProfileComponent);
    f.detectChanges();
    expect(f.componentInstance.practiceMinutes()).toBe(2);
  });

  it('volume computed should return current volume', () => {
    expect(component.volume()).toBe(0.8);
  });

  it('reduceAnimations should return current setting', () => {
    expect(component.reduceAnimations()).toBe(false);
  });

  it('darkTheme should return current setting', () => {
    expect(component.darkTheme()).toBe(true);
  });

  it('onVolumeChange() should call settingsSvc.setVolume()', () => {
    component.onVolumeChange(0.5);
    expect(settingsSpy.setVolume).toHaveBeenCalledWith(0.5);
  });

  it('onReduceAnimations() should call settingsSvc.setReduceAnimations()', () => {
    component.onReduceAnimations(true);
    expect(settingsSpy.setReduceAnimations).toHaveBeenCalledWith(true);
  });

  it('onDarkTheme() should call settingsSvc.setDarkTheme()', () => {
    component.onDarkTheme(false);
    expect(settingsSpy.setDarkTheme).toHaveBeenCalledWith(false);
  });
});
