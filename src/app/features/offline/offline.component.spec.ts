import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { signal } from '@angular/core';

import { OfflineComponent } from './offline.component';
import { ApiService } from '../../core/services/api.service';

describe('OfflineComponent', () => {
  let apiSpy: { initialize: ReturnType<typeof vi.fn>; backendOffline: ReturnType<typeof signal<boolean>> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  async function setup(backendOffline = true) {
    apiSpy = {
      initialize: vi.fn().mockResolvedValue(undefined),
      backendOffline: signal(backendOffline),
    };
    routerSpy = { navigate: vi.fn().mockResolvedValue(true) };

    await TestBed.configureTestingModule({
      imports: [OfflineComponent],
      providers: [
        provideNoopAnimations(),
        { provide: ApiService, useValue: apiSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OfflineComponent);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  it('should create and stay on the page while the backend is offline', async () => {
    const { component } = await setup();
    expect(component).toBeTruthy();
    expect(component.isRetrying()).toBe(false);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('should redirect on load when the backend is already available', async () => {
    await setup(false);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home'], { replaceUrl: true });
  });

  it('retry() should call api.initialize()', async () => {
    const { component } = await setup();
    await component.retry();
    expect(apiSpy.initialize).toHaveBeenCalled();
  });

  it('retry() should navigate to /home when backend comes online', async () => {
    const { component } = await setup();
    apiSpy.initialize.mockImplementation(async () => {
      apiSpy.backendOffline.set(false);
    });

    await component.retry();

    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home'], { replaceUrl: true });
    expect(component.retryFailed()).toBe(false);
  });

  it('retry() should announce failure when backend stays offline', async () => {
    const { fixture, component } = await setup();
    await component.retry();
    await fixture.whenStable();

    expect(component.isRetrying()).toBe(false);
    expect(component.retryFailed()).toBe(true);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent).toContain('O servidor ainda não respondeu');
  });

  it('retry() should show loading state and ignore repeated clicks while retrying', async () => {
    const { fixture, component } = await setup();
    let resolveInit!: () => void;
    apiSpy.initialize.mockReturnValue(new Promise<void>(r => { resolveInit = r; }));

    const promise = component.retry();
    void component.retry();
    await fixture.whenStable();

    expect(component.isRetrying()).toBe(true);
    expect(apiSpy.initialize).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Reconectando...');

    resolveInit();
    await promise;
    expect(component.isRetrying()).toBe(false);
  });
});
