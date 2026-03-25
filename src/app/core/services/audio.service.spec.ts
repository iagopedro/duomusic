import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';

describe('AudioService', () => {
  let service: AudioService;

  // Mock Web Audio API
  const mockGainNode = {
    gain: { value: 0, setTargetAtTime: jasmine.createSpy(), linearRampToValueAtTime: jasmine.createSpy() },
    connect: jasmine.createSpy(),
  };

  const mockOscillator = {
    type: 'sine' as OscillatorType,
    frequency: { value: 0 },
    connect: jasmine.createSpy(),
    start: jasmine.createSpy(),
    stop: jasmine.createSpy(),
  };

  const mockCtx = {
    state: 'running',
    currentTime: 0,
    destination: {},
    createOscillator: jasmine.createSpy().and.returnValue(mockOscillator),
    createGain: jasmine.createSpy().and.returnValue(mockGainNode),
    resume: jasmine.createSpy().and.returnValue(Promise.resolve()),
  };

  beforeEach(() => {
    (window as any).AudioContext = jasmine.createSpy('AudioContext').and.returnValue(mockCtx);
    TestBed.configureTestingModule({ providers: [AudioService] });
    service = TestBed.inject(AudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setMasterVolume should clamp to [0,1]', () => {
    service['getCtx'](); // initialise ctx
    service.setMasterVolume(1.5);
    expect(service['_volume']).toBe(1);
    service.setMasterVolume(-0.5);
    expect(service['_volume']).toBe(0);
  });

  it('playTone should create an oscillator and connect it', () => {
    service.playTone(440, 500);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.connect).toHaveBeenCalled();
  });

  it('playChord(major) should play 3 tones', (done) => {
    const spy = spyOn(service, 'playTone');
    service.playChord(261.63, 'major', 500);
    setTimeout(() => {
      expect(spy.calls.count()).toBeGreaterThanOrEqual(3);
      done();
    }, 200);
  });
});
