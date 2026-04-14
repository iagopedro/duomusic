import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PianoTutorialComponent, TUTORIAL_STORAGE_KEY } from './piano-tutorial.component';
import { StorageService } from '../../../core/storage/storage.service';
import { AudioService } from '../../../core/services/audio.service';

function makeStorageSpy() {
  return {
    get: vi.fn().mockReturnValue(false),
    set: vi.fn(),
  };
}

function makeAudioSpy() {
  return {
    resume: vi.fn().mockResolvedValue(undefined),
    playTone: vi.fn(),
  };
}

describe('PianoTutorialComponent', () => {
  let fixture: ComponentFixture<PianoTutorialComponent>;
  let component: PianoTutorialComponent;
  let storageSpy: ReturnType<typeof makeStorageSpy>;

  beforeEach(async () => {
    storageSpy = makeStorageSpy();
    await TestBed.configureTestingModule({
      imports: [PianoTutorialComponent, NoopAnimationsModule],
      providers: [
        { provide: StorageService, useValue: storageSpy },
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

  it('confirm() should NOT save to storage when checkbox is unchecked', () => {
    component.dontShowAgain.set(false);
    component.confirm();
    expect(storageSpy.set).not.toHaveBeenCalled();
  });

  it('confirm() should save to storage when checkbox is checked', () => {
    component.dontShowAgain.set(true);
    component.confirm();
    expect(storageSpy.set).toHaveBeenCalledWith(TUTORIAL_STORAGE_KEY, true);
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
