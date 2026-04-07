import { TestBed } from '@angular/core/testing';
import { AudioService } from './audio.service';

describe('AudioService', () => {
  let service: AudioService;

  const mockGainNode = {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };

  const mockOscillator = {
    type: 'sine' as OscillatorType,
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };

  const mockCtx = {
    state: 'running' as AudioContextState,
    currentTime: 0,
    baseLatency: 0,
    destination: {},
    createOscillator: vi.fn().mockReturnValue(mockOscillator),
    createGain: vi.fn().mockReturnValue(mockGainNode),
    resume: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCtx.createOscillator.mockReturnValue(mockOscillator);
    mockCtx.createGain.mockReturnValue(mockGainNode);
    // AudioContext é uma classe — usar 'function' (não arrow) para mock de classe
    (window as any).AudioContext = vi.fn().mockImplementation(function(this: any) {
      return mockCtx;
    });
    TestBed.configureTestingModule({ providers: [AudioService] });
    service = TestBed.inject(AudioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('setMasterVolume should clamp to 1 when above max', () => {
    service['getCtx']();
    service.setMasterVolume(1.5);
    expect(service['_volume']).toBe(1);
  });

  it('setMasterVolume should clamp to 0 when below min', () => {
    service['getCtx']();
    service.setMasterVolume(-0.5);
    expect(service['_volume']).toBe(0);
  });

  it('setMasterVolume should set exact value within range', () => {
    service['getCtx']();
    service.setMasterVolume(0.5);
    expect(service['_volume']).toBe(0.5);
  });

  it('playTone should create and connect an oscillator', () => {
    service.playTone(440, 500);
    expect(mockCtx.createOscillator).toHaveBeenCalled();
    expect(mockOscillator.connect).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
    expect(mockOscillator.stop).toHaveBeenCalled();
  });

  it('playTone should use provided oscillator type', () => {
    service.playTone(440, 300, 'sawtooth');
    expect(mockOscillator.type).toBe('sawtooth');
  });

  it('playChord(major) should play 3 tones', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(service, 'playTone');
    service.playChord(261.63, 'major', 500);
    vi.runAllTimers();
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(3);
    vi.useRealTimers();
  });

  it('playChord(minor) should play 3 tones', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(service, 'playTone');
    service.playChord(261.63, 'minor', 500);
    vi.runAllTimers();
    expect(spy.mock.calls.length).toBe(3);
    vi.useRealTimers();
  });

  it('playChord(dim) should play 3 tones', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(service, 'playTone');
    service.playChord(261.63, 'dim', 500);
    vi.runAllTimers();
    expect(spy.mock.calls.length).toBe(3);
    vi.useRealTimers();
  });

  it('playChord(aug) should play 3 tones', () => {
    vi.useFakeTimers();
    const spy = vi.spyOn(service, 'playTone');
    service.playChord(261.63, 'aug', 500);
    vi.runAllTimers();
    expect(spy.mock.calls.length).toBe(3);
    vi.useRealTimers();
  });

  it('playInterval should play root and upper note synchronously', () => {
    const spy = vi.spyOn(service, 'playTone');
    service.playInterval(261.63, 4, 800);
    // Ambas as notas são agendadas de forma síncrona no Web Audio clock
    expect(spy.mock.calls.length).toBe(2);
  });

  it('playMetronomeTick should use higher frequency for accent', () => {
    // playMetronomeTick cria seu próprio oscillator com envelope percussivo;
    // verifica a frequência configurada no oscillator criado.
    vi.clearAllMocks();
    service.playMetronomeTick(true);
    const accentFreq = mockOscillator.frequency.value;
    vi.clearAllMocks();
    service.playMetronomeTick(false);
    const normalFreq = mockOscillator.frequency.value;
    expect(accentFreq).toBeGreaterThan(normalFreq);
  });

  it('resume should call ctx.resume when suspended', async () => {
    mockCtx.state = 'suspended';
    await service.resume();
    expect(mockCtx.resume).toHaveBeenCalled();
    mockCtx.state = 'running';
  });

  it('resume should not call ctx.resume when running', async () => {
    mockCtx.state = 'running';
    await service.resume();
    expect(mockCtx.resume).not.toHaveBeenCalled();
  });

  it('getAudioContext should return the AudioContext instance', () => {
    const ctx = service.getAudioContext();
    expect(ctx).toBe(mockCtx);
  });

  it('getMasterGainNode should return the master gain node', () => {
    const gain = service.getMasterGainNode();
    expect(gain).toBe(mockGainNode);
  });
});
