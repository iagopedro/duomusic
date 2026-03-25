import { Injectable, signal, inject } from '@angular/core';
import { AppSettings } from '../models';
import { StorageService } from '../storage/storage.service';
import { AudioService } from './audio.service';

const STORAGE_KEY = 'musicteoria_settings';

const DEFAULT_SETTINGS: AppSettings = {
  volume: 0.7,
  reduceAnimations: false,
  darkTheme: true,
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly storage = inject(StorageService);
  private readonly audio = inject(AudioService);

  private readonly _settings = signal<AppSettings>(
    this.storage.get(STORAGE_KEY, DEFAULT_SETTINGS)
  );

  readonly settings = this._settings.asReadonly();

  constructor() {
    // Sync volume to AudioService on startup
    this.audio.setMasterVolume(this._settings().volume);
    // Apply theme class on startup
    this.applyTheme(this._settings().darkTheme);
    // Apply reduce-motion on startup
    this.applyReduceMotion(this._settings().reduceAnimations);
  }

  setVolume(value: number): void {
    this.update({ volume: value });
    this.audio.setMasterVolume(value);
  }

  setReduceAnimations(value: boolean): void {
    this.update({ reduceAnimations: value });
    this.applyReduceMotion(value);
  }

  setDarkTheme(value: boolean): void {
    this.update({ darkTheme: value });
    this.applyTheme(value);
  }

  private update(patch: Partial<AppSettings>): void {
    this._settings.update(s => ({ ...s, ...patch }));
    this.storage.set(STORAGE_KEY, this._settings());
  }

  private applyTheme(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  }

  private applyReduceMotion(reduce: boolean): void {
    if (reduce) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  }
}
