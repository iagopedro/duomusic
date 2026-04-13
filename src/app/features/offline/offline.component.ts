import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
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
export class OfflineComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  isRetrying = false;

  async retry(): Promise<void> {
    this.isRetrying = true;
    await this.api.initialize();
    if (!this.api.backendOffline()) {
      this.router.navigate(['/home']);
    } else {
      this.isRetrying = false;
    }
  }
}
