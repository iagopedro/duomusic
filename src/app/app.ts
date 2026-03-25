import {
  Component, ChangeDetectionStrategy, OnInit, signal, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { trigger, transition, style, animate, query, group } from '@angular/animations';
import { I18nService } from './core/i18n/i18n.service';
import { SettingsService } from './core/services/settings.service';
import { computed } from '@angular/core';

interface NavItem {
  route: string;
  icon: string;
  label: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, MatIconModule, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('routeAnimation', [
      transition('* <=> *', [
        group([
          query(':enter', [
            style({ opacity: 0, transform: 'translateY(12px)' }),
            animate('250ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
          ], { optional: true }),
          query(':leave', [
            animate('180ms ease-in', style({ opacity: 0 })),
          ], { optional: true }),
        ]),
      ]),
    ]),
  ],
  template: `
    <div class="app-shell" [attr.data-theme]="theme()">
      <main class="app-shell__content" [@routeAnimation]="routeState()">
        <router-outlet />
      </main>

      <nav class="app-shell__bottom-nav" *ngIf="showNav()"
           role="navigation" aria-label="Navegação">
        <button
          *ngFor="let item of navItems; trackBy: trackByRoute"
          class="app-shell__nav-btn"
          [class.app-shell__nav-btn--active]="isActive(item.route)"
          [attr.aria-label]="item.label"
          [attr.aria-current]="isActive(item.route) ? 'page' : null"
          matRipple
          [matRippleCentered]="true"
          (click)="navigate(item.route)"
        >
          <mat-icon class="app-shell__nav-icon" aria-hidden="true">{{ item.icon }}</mat-icon>
          <span class="app-shell__nav-label">{{ item.label }}</span>
        </button>
      </nav>
    </div>
  `,
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly i18n = inject(I18nService);
  private readonly router = inject(Router);
  private readonly settings = inject(SettingsService);

  readonly navItems: NavItem[] = [
    { route: '/home',         icon: 'home',           label: this.i18n.t('nav.home') },
    { route: '/practice',     icon: 'sports_esports',  label: this.i18n.t('nav.practice') },
    { route: '/achievements', icon: 'emoji_events',   label: this.i18n.t('nav.achievements') },
    { route: '/profile',      icon: 'person',          label: this.i18n.t('nav.profile') },
  ];

  readonly currentRoute = signal('');
  readonly showNav = computed(() => !this.currentRoute().startsWith('/onboarding'));
  readonly routeState = computed(() => this.currentRoute());
  readonly theme = computed(() => this.settings.settings().darkTheme ? 'dark' : 'light');

  ngOnInit(): void {
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(e => {
        this.currentRoute.set((e as NavigationEnd).urlAfterRedirects);
      });
    this.currentRoute.set(this.router.url);
  }

  isActive(route: string): boolean {
    return this.currentRoute().startsWith(route);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  trackByRoute(_: number, item: NavItem): string { return item.route; }
}
