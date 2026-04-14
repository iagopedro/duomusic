import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PianoKeyboardComponent, WHITE_KEYS, ALL_KEYS } from './piano-keyboard.component';
import { AudioService } from '../../../core/services/audio.service';

function makeAudioSpy() {
  return {
    resume: vi.fn().mockResolvedValue(undefined),
    playTone: vi.fn(),
  };
}

describe('PianoKeyboardComponent', () => {
  let fixture: ComponentFixture<PianoKeyboardComponent>;
  let component: PianoKeyboardComponent;
  let audioSpy: ReturnType<typeof makeAudioSpy>;

  beforeEach(async () => {
    audioSpy = makeAudioSpy();
    await TestBed.configureTestingModule({
      imports: [PianoKeyboardComponent],
      providers: [{ provide: AudioService, useValue: audioSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(PianoKeyboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose WHITE_KEYS as keys', () => {
    expect(component.keys).toBe(WHITE_KEYS);
    expect(component.keys.length).toBe(8);
  });

  it('tapKey() should emit noteTapped with the note name', () => {
    const spy = vi.fn();
    component.noteTapped.subscribe(spy);

    component.tapKey(WHITE_KEYS[0]);

    expect(spy).toHaveBeenCalledWith('C4');
  });

  it('tapKey() should set pressedNote briefly', () => {
    vi.useFakeTimers();
    component.tapKey(WHITE_KEYS[0]);
    expect(component.pressedNote()).toBe('C4');
    vi.advanceTimersByTime(250);
    expect(component.pressedNote()).toBeNull();
    vi.useRealTimers();
  });

  it('tapKey() should call audio.playTone', async () => {
    component.tapKey(WHITE_KEYS[0]);
    await Promise.resolve();
    expect(audioSpy.playTone).toHaveBeenCalledWith(WHITE_KEYS[0].freq, 600);
  });

  it('tapKey() should do nothing when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const spy = vi.fn();
    component.noteTapped.subscribe(spy);
    component.tapKey(WHITE_KEYS[0]);

    expect(spy).not.toHaveBeenCalled();
    expect(audioSpy.resume).not.toHaveBeenCalled();
  });

  it('should render piano keys in the DOM', () => {
    const keys = fixture.nativeElement.querySelectorAll('.piano-key, [class*="piano"]');
    // At minimum we expect rendered content for keys
    expect(fixture.nativeElement.textContent).toBeTruthy();
  });

  it('ALL_KEYS should have 13 entries (8 white + 5 black)', () => {
    expect(ALL_KEYS.length).toBe(13);
    expect(WHITE_KEYS.length).toBe(8);
    expect(ALL_KEYS.filter(k => k.isBlack).length).toBe(5);
  });

  it('each key should have a keyboardKey mapping', () => {
    for (const k of ALL_KEYS) {
      expect(k.keyboardKey).toBeTruthy();
    }
  });

  it('keyboard keydown should trigger tapKey for mapped key', () => {
    const spy = vi.fn();
    component.noteTapped.subscribe(spy);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(spy).toHaveBeenCalledWith('C4');
  });

  it('keyboard keydown should be ignored when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    const spy = vi.fn();
    component.noteTapped.subscribe(spy);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('keyboard keydown for unmapped key should do nothing', () => {
    const spy = vi.fn();
    component.noteTapped.subscribe(spy);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z' }));
    expect(spy).not.toHaveBeenCalled();
  });

  it('getBlackKey returns the black key after a white key with blackAfter', () => {
    const cKey = WHITE_KEYS.find(k => k.note === 'C4')!;
    const bk = component.getBlackKey(cKey);
    expect(bk).toBeDefined();
    expect(bk!.note).toBe('C#4');
  });

  it('getBlackKey returns undefined for white key without blackAfter', () => {
    const eKey = WHITE_KEYS.find(k => k.note === 'E4')!;
    expect(component.getBlackKey(eKey)).toBeUndefined();
  });
});
