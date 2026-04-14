import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { OfflineComponent } from './offline.component';
import { ApiService } from '../../core/services/api.service';

describe('OfflineComponent', () => {
  let component: OfflineComponent;
  let apiSpy: { initialize: ReturnType<typeof vi.fn>; backendOffline: ReturnType<typeof signal<boolean>> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    apiSpy = {
      initialize: vi.fn().mockResolvedValue(undefined),
      backendOffline: signal(true),
    };
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OfflineComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OfflineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('isRetrying should start false', () => {
    expect(component.isRetrying).toBe(false);
  });

  it('retry() should call api.initialize()', async () => {
    await component.retry();
    expect(apiSpy.initialize).toHaveBeenCalled();
  });

  it('retry() should navigate to /home when backend comes online', async () => {
    apiSpy.initialize.mockImplementation(async () => {
      apiSpy.backendOffline.set(false);
    });

    await component.retry();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('retry() should set isRetrying=false when backend stays offline', async () => {
    // backendOffline stays true (default)
    await component.retry();

    expect(component.isRetrying).toBe(false);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('retry() should set isRetrying=true while retrying', () => {
    // Don't await — check state during execution
    let resolveInit!: () => void;
    apiSpy.initialize.mockReturnValue(new Promise<void>(r => { resolveInit = r; }));

    const promise = component.retry();
    expect(component.isRetrying).toBe(true);

    resolveInit();
    return promise;
  });
});
