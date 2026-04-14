import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PianoTutorialComponent } from './piano-tutorial.component';
import { AudioService } from '../../../core/services/audio.service';

function makeAudioSpy() {
  return {
    resume: vi.fn().mockResolvedValue(undefined),
    playTone: vi.fn(),
  };
}

describe('PianoTutorialComponent', () => {
  let fixture: ComponentFixture<PianoTutorialComponent>;
  let component: PianoTutorialComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PianoTutorialComponent, NoopAnimationsModule],
      providers: [
        { provide: AudioService, useValue: makeAudioSpy() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PianoTutorialComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not render modal when visible is false', () => {
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.piano-tutorial__overlay');
    expect(overlay).toBeNull();
  });

  it('should render modal when visible is true', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const overlay = fixture.nativeElement.querySelector('.piano-tutorial__overlay');
    expect(overlay).toBeTruthy();
  });

  it('should display all 13 key mappings', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('.piano-tutorial__key-item');
    expect(items.length).toBe(13);
  });

  it('confirm() should emit closed', () => {
    const spy = vi.fn();
    component.closed.subscribe(spy);
    component.confirm();
    expect(spy).toHaveBeenCalled();
  });

  it('confirm() should NOT interact with storage', () => {
    // The component no longer has storage — confirm just emits
    expect(() => component.confirm()).not.toThrow();
  });

  it('should not render checkbox in modal', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]');
    expect(checkbox).toBeNull();
  });

  it('should render "Entendi!" button when closeButton is false', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('closeButton', false);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('app-primary-button');
    expect(btn).toBeTruthy();
    const closeBtn = fixture.nativeElement.querySelector('.piano-tutorial__close-btn');
    expect(closeBtn).toBeNull();
  });

  it('should render X close button when closeButton is true', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.componentRef.setInput('closeButton', true);
    fixture.detectChanges();
    const closeBtn = fixture.nativeElement.querySelector('.piano-tutorial__close-btn');
    expect(closeBtn).toBeTruthy();
    const primaryBtn = fixture.nativeElement.querySelector('app-primary-button');
    expect(primaryBtn).toBeNull();
  });

  it('clicking overlay should call confirm()', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const confirmSpy = vi.spyOn(component, 'confirm');
    const overlay = fixture.nativeElement.querySelector('.piano-tutorial__overlay');
    overlay.click();
    expect(confirmSpy).toHaveBeenCalled();
  });
});
