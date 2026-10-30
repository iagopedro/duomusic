import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { GlassPanelComponent } from '../../shared/components/glass-panel/glass-panel.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { ApiService } from '../../core/services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-offline',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatIconModule, GlassPanelComponent, PrimaryButtonComponent],
  templateUrl: './offline.component.html',
  styleUrl: './offline.component.scss',
})
export class OfflineComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly isRetrying = signal(false);
  readonly retryFailed = signal(false);

  ngOnInit(): void {
    // Ao abrir/atualizar /offline, o initializer acabou de checar o backend; se ele já respondeu, sai daqui.
    if (!this.api.backendOffline()) {
      void this.leaveOffline();
    }
  }

  async retry(): Promise<void> {
    if (this.isRetrying()) return;
    this.isRetrying.set(true);
    this.retryFailed.set(false);
    await this.api.initialize();
    if (!this.api.backendOffline()) {
      await this.leaveOffline();
    } else {
      this.retryFailed.set(true);
    }
    this.isRetrying.set(false);
  }

  private leaveOffline(): Promise<boolean> {
    // Os guards de /home redirecionam para login ou onboarding quando necessário.
    return this.router.navigate(['/home'], { replaceUrl: true });
  }
}
