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
      providers: [provideRouter([]), provideNoopAnimations()],
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

  it('showNav should be false on practice route', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app.currentRoute.set('/practice/fundamentals');
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

  it('navItems should contain 3 entries', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance.navItems.length).toBe(3);
  });

  it('keeps authentication screens free of journey navigation', () => {
    const app = TestBed.createComponent(App).componentInstance;
    for (const route of ['/auth/login', '/auth/register', '/offline', '/']) {
      app.currentRoute.set(route);
      expect(app.showNav()).toBe(false);
    }
  });

  it('moves skip-link focus without navigating to the base URL', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const event = new MouseEvent('click', { cancelable: true });
    const main: HTMLElement = fixture.nativeElement.querySelector('#main-content');
    const focus = vi.spyOn(main, 'focus');
    fixture.componentInstance.skipToContent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(focus).toHaveBeenCalledOnce();
  });

  it('respects the in-app reduced motion preference', () => {
    const app = TestBed.createComponent(App).componentInstance;
    const settings = TestBed.inject(SettingsService);
    const previous = settings.settings().reduceAnimations;
    try {
      settings.setReduceAnimations(true);
      expect(app.reduceMotion()).toBe(true);
      settings.setReduceAnimations(false);
      app.systemReduceMotion.set(true);
      expect(app.reduceMotion()).toBe(true);
      app.systemReduceMotion.set(false);
      expect(app.reduceMotion()).toBe(false);
    } finally {
      settings.setReduceAnimations(previous);
    }
  });

  it('reacts to system motion changes and disposes the listener', () => {
    const listeners: Array<(event: MediaQueryListEvent) => void> = [];
    const remove = vi.fn();
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => ({
        matches: true,
        addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) =>
          listeners.push(listener),
        removeEventListener: remove,
      })),
    );
    try {
      const fixture = TestBed.createComponent(App);
      expect(fixture.componentInstance.systemReduceMotion()).toBe(true);
      listeners[0]({ matches: false } as MediaQueryListEvent);
      expect(fixture.componentInstance.systemReduceMotion()).toBe(false);
      fixture.destroy();
      expect(remove).toHaveBeenCalledWith('change', listeners[0]);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
