import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';

import { OnboardingComponent } from './onboarding.component';
import { StorageService } from '../../core/storage/storage.service';

describe('OnboardingComponent', () => {
  let component: OnboardingComponent;
  let storageSpy: { set: ReturnType<typeof vi.fn> };
  let routerSpy: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    storageSpy = { set: vi.fn() };
    routerSpy = { navigate: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [OnboardingComponent],
      providers: [
        provideNoopAnimations(),
        { provide: StorageService, useValue: storageSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(OnboardingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 3 steps', () => {
    expect(component.steps.length).toBe(3);
  });

  it('should start at index 0', () => {
    expect(component.currentIndex()).toBe(0);
  });

  it('currentStep should return first step initially', () => {
    expect(component.currentStep().titleKey).toBe('onboarding.step1.title');
  });

  it('isLast should be false on first step', () => {
    expect(component.isLast()).toBe(false);
  });

  it('next() should advance to next step', () => {
    component.next();
    expect(component.currentIndex()).toBe(1);
  });

  it('next() on last step should NOT go beyond', () => {
    component.currentIndex.set(2);
    component.next();
    expect(component.currentIndex()).toBe(2);
  });

  it('isLast should be true on last step', () => {
    component.currentIndex.set(2);
    expect(component.isLast()).toBe(true);
  });

  it('goTo() should set index directly', () => {
    component.goTo(2);
    expect(component.currentIndex()).toBe(2);
  });

  it('finish() should save to storage and navigate to /home', () => {
    component.finish();
    expect(storageSpy.set).toHaveBeenCalledWith('duomusic_onboarding_done', true);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('trackByIndex should return the index', () => {
    expect(component.trackByIndex(5)).toBe(5);
  });

  it('stepTitle and stepDesc should return translated strings', () => {
    expect(typeof component.stepTitle()).toBe('string');
    expect(typeof component.stepDesc()).toBe('string');
  });
});
