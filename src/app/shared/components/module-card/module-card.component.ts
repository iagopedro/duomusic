import {
  Component, ChangeDetectionStrategy, Input, Output, EventEmitter,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';
import { Module } from '../../../core/models';
import { I18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-module-card',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatRippleModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './module-card.component.html',
  styleUrl: './module-card.component.scss',
})
export class ModuleCardComponent {
  @Input({ required: true }) module!: Module;
  @Input() locked = false;
  @Input() completed = false;
  @Output() cardClicked = new EventEmitter<Module>();

  get ariaLabel(): string {
    const name = this.moduleName();
    if (this.locked) return `${name} — ${this.i18n.t('home.modules.locked')}`;
    if (this.completed) return `${name} — ${this.i18n.t('home.modules.completed')}`;
    return `${name} — ${this.i18n.t('home.modules.unlocked')}`;
  }

  moduleName(): string {
    return this.i18n.tStr(this.module.nameKey);
  }

  constructor(readonly i18n: I18nService) {}
}
