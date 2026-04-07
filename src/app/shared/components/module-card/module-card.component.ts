import {
  Component, ChangeDetectionStrategy, input, output, inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { Module } from '../../../core/models';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-module-card',
  imports: [MatIconModule, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './module-card.component.html',
  styleUrl: './module-card.component.scss',
})
export class ModuleCardComponent {
  readonly i18n = inject(I18nService);

  readonly module = input.required<Module>();
  readonly locked = input(false);
  readonly completed = input(false);
  readonly cardClicked = output<Module>();

  get ariaLabel(): string {
    const name = this.moduleName();
    if (this.locked()) return `${name} — ${this.i18n.t('home.modules.locked')}`;
    if (this.completed()) return `${name} — ${this.i18n.t('home.modules.completed')}`;
    return `${name} — ${this.i18n.t('home.modules.unlocked')}`;
  }

  moduleName(): string {
    return this.i18n.tStr(this.module().nameKey);
  }
}
