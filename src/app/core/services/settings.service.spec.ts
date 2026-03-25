import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { StorageService } from '../storage/storage.service';
import { AudioService } from './audio.service';

describe('SettingsService', () => {
  let service: SettingsService;
  let audioSpy: { setMasterVolume: ReturnType<typeof vi.fn> };
  let storageSpy: { get: ReturnType<typeof vi.fn>; set: ReturnType<typeof vi.fn> };

  const DEFAULT_SETTINGS = { volume: 0.7, reduceAnimations: false, darkTheme: true };

  beforeEach(() => {
    audioSpy = { setMasterVolume: vi.fn() };
    storageSpy = {
      get: vi.fn().mockReturnValue(DEFAULT_SETTINGS),
      set: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        { provide: StorageService, useValue: storageSpy },
        { provide: AudioService, useValue: audioSpy },
      ],
    });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ── Volume ───────────────────────────────────────────────────────────────

  it('should sync volume to AudioService on startup', () => {
    expect(audioSpy.setMasterVolume).toHaveBeenCalledWith(DEFAULT_SETTINGS.volume);
  });

  it('setVolume should update settings signal', () => {
    service.setVolume(0.3);
    expect(service.settings().volume).toBe(0.3);
  });

  it('setVolume should call AudioService.setMasterVolume', () => {
    service.setVolume(0.5);
    expect(audioSpy.setMasterVolume).toHaveBeenCalledWith(0.5);
  });

  it('setVolume should persist to storage', () => {
    service.setVolume(0.4);
    expect(storageSpy.set).toHaveBeenCalled();
  });

  // ── Reduce Animations ────────────────────────────────────────────────────

  it('setReduceAnimations(true) should add reduce-motion CSS class', () => {
    service.setReduceAnimations(true);
    expect(document.documentElement.classList.contains('reduce-motion')).toBe(true);
    service.setReduceAnimations(false);
  });

  it('setReduceAnimations(false) should remove reduce-motion CSS class', () => {
    document.documentElement.classList.add('reduce-motion');
    service.setReduceAnimations(false);
    expect(document.documentElement.classList.contains('reduce-motion')).toBe(false);
  });

  it('setReduceAnimations should update settings signal', () => {
    service.setReduceAnimations(true);
    expect(service.settings().reduceAnimations).toBe(true);
    service.setReduceAnimations(false);
  });

  // ── Dark Theme ───────────────────────────────────────────────────────────

  it('setDarkTheme(true) should set data-theme to dark', () => {
    service.setDarkTheme(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('setDarkTheme(false) should set data-theme to light', () => {
    service.setDarkTheme(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    service.setDarkTheme(true); // restore
  });

  it('setDarkTheme should update settings signal', () => {
    service.setDarkTheme(false);
    expect(service.settings().darkTheme).toBe(false);
    service.setDarkTheme(true); // restore
  });

  it('setDarkTheme should persist to storage', () => {
    service.setDarkTheme(false);
    expect(storageSpy.set).toHaveBeenCalled();
  });
});
