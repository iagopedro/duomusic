import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  signal,
  inject,
  computed,
  DestroyRef,
  ElementRef,
  viewChild,
} from '@angular/core';
import { RouterOutlet, Router, RouterLink, NavigationEnd } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { I18nService } from './core/i18n/i18n.service';
import { SettingsService } from './core/services/settings.service';
import { ApiService } from './core/services/api.service';

interface NavItem {
  route: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, MatIconModule, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content" (click)="skipToContent($event)">{{
      i18n.t('nav.skip')
    }}</a>
    <div
      class="app-shell"
      [class.app-shell--with-nav]="showNav()"
      [attr.data-theme]="theme()"
      [@.disabled]="reduceMotion()"
    >
      @if (showNav()) {
        <aside class="app-shell__rail">
          <a routerLink="/home" class="app-shell__brand" aria-label="DuoMusic">
            <span class="app-shell__brand-mark"
              ><mat-icon aria-hidden="true">graphic_eq</mat-icon></span
            >
            duo<span>music</span>
          </a>
          <span class="app-shell__nav-caption eyebrow">{{ i18n.t('nav.space') }}</span>
          <nav class="app-shell__bottom-nav" [attr.aria-label]="i18n.t('nav.label')">
            @for (item of navItems; track item.route) {
              <a
                class="app-shell__nav-btn"
                [routerLink]="item.route"
                [class.app-shell__nav-btn--active]="isActive(item.route)"
                [attr.aria-current]="isActive(item.route) ? 'page' : null"
                matRipple
                [matRippleDisabled]="reduceMotion()"
              >
                <mat-icon class="app-shell__nav-icon" aria-hidden="true">{{ item.icon }}</mat-icon>
                <span class="app-shell__nav-label">{{ item.label }}</span>
              </a>
            }
          </nav>
          <div class="app-shell__rail-note">
            <mat-icon aria-hidden="true">headphones</mat-icon>
            <strong>{{ i18n.t('nav.note.title') }}</strong>
            <p>{{ i18n.t('nav.note.desc') }}</p>
          </div>
        </aside>
      }
      <main #content id="main-content" tabindex="-1" class="app-shell__content">
        <router-outlet />
      </main>
    </div>
  `,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  private readonly motionQuery =
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)')
      : null;
  readonly systemReduceMotion = signal(this.motionQuery?.matches ?? false);
  readonly reduceMotion = computed(
    () => this.systemReduceMotion() || this.settings.settings().reduceAnimations,
  );

  constructor() {
    const onMotionChange = (event: MediaQueryListEvent) =>
      this.systemReduceMotion.set(event.matches);
    this.motionQuery?.addEventListener('change', onMotionChange);
    this.destroyRef.onDestroy(() =>
      this.motionQuery?.removeEventListener('change', onMotionChange),
    );
  }

  readonly navItems: NavItem[] = [
    { route: '/home', icon: 'route', label: this.i18n.t('nav.home') },
    { route: '/achievements', icon: 'emoji_events', label: this.i18n.t('nav.achievements') },
    { route: '/profile', icon: 'person', label: this.i18n.t('nav.profile') },
  ];

  readonly currentRoute = signal('');
  readonly showNav = computed(
    () =>
      !this.currentRoute().startsWith('/onboarding') &&
      !this.currentRoute().startsWith('/offline') &&
      !this.currentRoute().startsWith('/auth') &&
      this.currentRoute() !== '/' &&
      !this.currentRoute().startsWith('/practice'),
  );
  readonly theme = computed(() => (this.settings.settings().darkTheme ? 'dark' : 'light'));

  ngOnInit(): void {
    if (this.api.backendOffline()) {
      this.router.navigate(['/offline']);
    }

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.currentRoute.set(e.urlAfterRedirects);
        const main = this.content()?.nativeElement;
        if (main) {
          main.scrollTop = 0;
          if (!this.currentRoute().startsWith('/practice')) main.focus({ preventScroll: true });
        }
      });
    this.currentRoute.set(this.router.url);
  }

  isActive(route: string): boolean {
    return this.currentRoute().startsWith(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  skipToContent(event: Event): void {
    event.preventDefault();
    this.content()?.nativeElement.focus();
  }
}
