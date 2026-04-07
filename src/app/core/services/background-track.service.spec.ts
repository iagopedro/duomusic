import { TestBed } from '@angular/core/testing';
import { BackgroundTrackService } from './background-track.service';
import { AudioService } from './audio.service';

function makeMockCtx() {
  const gainNode = {
    gain: {
      value: 0,
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  };
  const oscillator = {
    type: 'sine' as OscillatorType,
    frequency: { value: 0 },
    detune: { value: 0 },
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const ctx = {
    currentTime: 0,
    createGain: vi.fn().mockReturnValue(gainNode),
    createOscillator: vi.fn().mockReturnValue(oscillator),
  };
  return { ctx, gainNode, oscillator };
}

function makeAudioSpy(ctx: ReturnType<typeof makeMockCtx>['ctx'], gainNode: ReturnType<typeof makeMockCtx>['gainNode']) {
  return {
    getAudioContext: vi.fn().mockReturnValue(ctx),
    getMasterGainNode: vi.fn().mockReturnValue(gainNode),
  };
}

describe('BackgroundTrackService', () => {
  let service: BackgroundTrackService;
  let mocks: ReturnType<typeof makeMockCtx>;

  beforeEach(() => {
    vi.useFakeTimers();
    mocks = makeMockCtx();
    const audioSpy = makeAudioSpy(mocks.ctx, mocks.gainNode);

    TestBed.configureTestingModule({
      providers: [
        BackgroundTrackService,
        { provide: AudioService, useValue: audioSpy },
      ],
    });
    service = TestBed.inject(BackgroundTrackService);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Criação ───────────────────────────────────────────────────────────────

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isPlaying() should be false before start()', () => {
    expect(service.isPlaying()).toBe(false);
  });

  // ── start() ───────────────────────────────────────────────────────────────

  it('start() should set isPlaying to true', () => {
    service.start('fundamentals');
    expect(service.isPlaying()).toBe(true);
  });

  it('start() should create oscillators for each frequency in the config', () => {
    service.start('fundamentals');
    // fundamentals tem 3 frequências; cada uma cria 1 oscilador + 1 LFO = 2 createOscillator por freq
    expect(mocks.ctx.createOscillator).toHaveBeenCalled();
  });

  it('start() during playback should stop previous track first', () => {
    service.start('fundamentals');
    const stopSpy = vi.spyOn(service, 'stop');
    service.start('intervals');
    expect(stopSpy).toHaveBeenCalled();
  });

  it('start() should work for all module IDs', () => {
    const modules: Array<'fundamentals' | 'intervals' | 'scales' | 'chords' | 'mixed'> =
      ['fundamentals', 'intervals', 'scales', 'chords', 'mixed'];
    modules.forEach(mod => {
      service.stop();
      expect(() => service.start(mod)).not.toThrow();
    });
  });

  // ── stop() ────────────────────────────────────────────────────────────────

  it('stop() should set isPlaying to false', () => {
    service.start('fundamentals');
    service.stop();
    expect(service.isPlaying()).toBe(false);
  });

  it('stop() without prior start should not throw', () => {
    expect(() => service.stop()).not.toThrow();
  });

  it('stop() twice should not throw', () => {
    service.start('fundamentals');
    service.stop();
    expect(() => service.stop()).not.toThrow();
  });

  // ── duck() / unduck() / duckFor() ─────────────────────────────────────────

  it('duck() should call setTargetAtTime on trackGain with DUCK_VOLUME', () => {
    service.start('fundamentals');
    mocks.gainNode.gain.setTargetAtTime.mockClear();
    service.duck();
    expect(mocks.gainNode.gain.setTargetAtTime).toHaveBeenCalledWith(
      expect.closeTo(0.005, 4),
      expect.any(Number),
      expect.any(Number),
    );
  });

  it('duck() twice should not call setTargetAtTime a second time', () => {
    service.start('fundamentals');
    service.duck();
    mocks.gainNode.gain.setTargetAtTime.mockClear();
    service.duck();
    expect(mocks.gainNode.gain.setTargetAtTime).not.toHaveBeenCalled();
  });

  it('duck() without active track should not throw', () => {
    expect(() => service.duck()).not.toThrow();
  });

  it('unduck() should call setTargetAtTime to restore volume', () => {
    service.start('fundamentals');
    service.duck();
    mocks.gainNode.gain.setTargetAtTime.mockClear();
    service.unduck();
    expect(mocks.gainNode.gain.setTargetAtTime).toHaveBeenCalled();
  });

  it('unduck() without being ducked should not call setTargetAtTime', () => {
    service.start('fundamentals');
    mocks.gainNode.gain.setTargetAtTime.mockClear();
    service.unduck();
    expect(mocks.gainNode.gain.setTargetAtTime).not.toHaveBeenCalled();
  });

  it('duckFor() should duck immediately and unduck after the given duration', () => {
    service.start('fundamentals');
    const duckSpy = vi.spyOn(service, 'duck');
    const unduckSpy = vi.spyOn(service, 'unduck');

    service.duckFor(500);

    expect(duckSpy).toHaveBeenCalledTimes(1);
    expect(unduckSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(500);

    expect(unduckSpy).toHaveBeenCalledTimes(1);
  });

  it('duckFor() called again should reset the unduck timer', () => {
    service.start('fundamentals');
    const unduckSpy = vi.spyOn(service, 'unduck');

    service.duckFor(500);
    vi.advanceTimersByTime(400);
    service.duckFor(500); // reseta o timer

    vi.advanceTimersByTime(400); // total 800 ms — o primeiro timer teria disparado, mas foi cancelado
    expect(unduckSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100); // 900 ms — segundo timer dispara
    expect(unduckSpy).toHaveBeenCalledTimes(1);
  });
});
