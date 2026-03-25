import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { App } from './app';
import { I18nService } from './core/i18n/i18n.service';
import { SettingsService } from './core/services/settings.service';

describe('App (root shell)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  it('should create the app shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('showNav should be false on onboarding route', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.currentRoute.set('/onboarding');
    expect(app.showNav()).toBe(false);
  });

  it('showNav should be true on home route', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.currentRoute.set('/home');
    expect(app.showNav()).toBe(true);
  });

  it('isActive should return true for matching route prefix', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.currentRoute.set('/home');
    expect(app.isActive('/home')).toBe(true);
    expect(app.isActive('/practice')).toBe(false);
  });

  it('theme should reflect settings darkTheme', () => {
    const fixture = TestBed.createComponent(App);
    const settings = TestBed.inject(SettingsService);
    const app = fixture.componentInstance;
    expect(app.theme()).toBe(settings.settings().darkTheme ? 'dark' : 'light');
  });

  it('navItems should contain 4 entries', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance.navItems.length).toBe(4);
  });
});
