import { Injectable, inject } from '@angular/core';
import { AudioService } from './audio.service';
import { ModuleId } from '../models';

interface TrackConfig {
  frequencies: number[];
  waveform: OscillatorType;
  detuneCents: number;
  lfoRate: number;
  lfoDepth: number;
  volume: number;
}

/**
 * Gera trilhas sonoras ambientais procedurais por módulo usando Web Audio API.
 *
 * Propósito principal: manter o pipeline de áudio Bluetooth A2DP sempre ativo
 * durante a sessão de exercícios. Dispositivos BT desconectam o pipe no
 * silêncio, causando perda dos primeiros sons de cada exercício.
 *
 * Cada módulo possui um "pad" ambiente diferente — acordes sustentados com
 * osciladores levemente desafinados e LFOs lentos para criar movimento sutil.
 * O volume é muito baixo para não atrapalhar o aprendizado.
 */
@Injectable({ providedIn: 'root' })
export class BackgroundTrackService {
  private readonly audio = inject(AudioService);

  private oscillators: OscillatorNode[] = [];
  private lfoNodes: OscillatorNode[] = [];
  private trackGain: GainNode | null = null;
  private playing = false;
  private ducked = false;
  private currentVolume = 0.06;
  private unduckTimer: ReturnType<typeof setTimeout> | null = null;

  private static readonly DUCK_VOLUME = 0.005;

  /**
   * Configurações de trilha por módulo.
   * Frequências escolhidas para criar pads harmônicos consonantes e distintos.
   */
  private static readonly CONFIGS: Record<ModuleId, TrackConfig> = {
    fundamentals: {
      frequencies: [130.81, 164.81, 196.00],   // C3 E3 G3 — Dó maior, acolhedor
      waveform: 'sine',
      detuneCents: 5,
      lfoRate: 0.15,
      lfoDepth: 3,
      volume: 0.06,
    },
    intervals: {
      frequencies: [87.31, 130.81, 174.61],    // F2 C3 F3 — Fá maior, espaçoso
      waveform: 'sine',
      detuneCents: 8,
      lfoRate: 0.1,
      lfoDepth: 4,
      volume: 0.05,
    },
    scales: {
      frequencies: [110.00, 164.81, 220.00],   // A2 E3 A3 — Lá menor, etéreo
      waveform: 'triangle',
      detuneCents: 6,
      lfoRate: 0.08,
      lfoDepth: 5,
      volume: 0.04,
    },
    chords: {
      frequencies: [98.00, 146.83, 246.94],    // G2 D3 B3 — Sol maior, encorpado
      waveform: 'sine',
      detuneCents: 4,
      lfoRate: 0.12,
      lfoDepth: 3,
      volume: 0.05,
    },
    mixed: {
      frequencies: [73.42, 110.00, 146.83, 174.61], // D2 A2 D3 F3 — Ré menor, misterioso
      waveform: 'triangle',
      detuneCents: 7,
      lfoRate: 0.2,
      lfoDepth: 4,
      volume: 0.04,
    },
  };

  /** Inicia a trilha de fundo para o módulo. Fade-in de 2 s. */
  start(moduleId: ModuleId): void {
    if (this.playing) this.stop();

    const ctx = this.audio.getAudioContext();
    const master = this.audio.getMasterGainNode();
    const config = BackgroundTrackService.CONFIGS[moduleId];
    this.currentVolume = config.volume;

    this.trackGain = ctx.createGain();
    this.trackGain.gain.setValueAtTime(0, ctx.currentTime);
    this.trackGain.gain.linearRampToValueAtTime(config.volume, ctx.currentTime + 2);
    this.trackGain.connect(master);

    config.frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = config.waveform;
      osc.frequency.value = freq;
      osc.detune.value = i % 2 === 0 ? config.detuneCents : -config.detuneCents;

      const oscGain = ctx.createGain();
      oscGain.gain.value = 1 / config.frequencies.length;

      // LFO — modulação lenta de pitch para movimento orgânico
      const lfo = ctx.createOscillator();
      lfo.frequency.value = config.lfoRate + i * 0.02;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = config.lfoDepth;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.detune);

      osc.connect(oscGain);
      oscGain.connect(this.trackGain!);

      osc.start();
      lfo.start();

      this.oscillators.push(osc);
      this.lfoNodes.push(lfo);
    });

    this.playing = true;
    this.ducked = false;
  }

  /** Para a trilha de fundo com fade-out suave. */
  stop(): void {
    if (!this.playing && !this.trackGain) return;

    if (this.unduckTimer) {
      clearTimeout(this.unduckTimer);
      this.unduckTimer = null;
    }

    const ctx = this.audio.getAudioContext();
    if (this.trackGain) {
      this.trackGain.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
    }

    const oscs = [...this.oscillators];
    const lfos = [...this.lfoNodes];
    const oldGain = this.trackGain;
    setTimeout(() => {
      oscs.forEach(o => { try { o.stop(); o.disconnect(); } catch { /* já parado */ } });
      lfos.forEach(l => { try { l.stop(); l.disconnect(); } catch { /* já parado */ } });
      if (oldGain) { try { oldGain.disconnect(); } catch { /* já desconectado */ } }
    }, 2500);

    this.oscillators = [];
    this.lfoNodes = [];
    this.trackGain = null;
    this.playing = false;
    this.ducked = false;
  }

  /**
   * Abaixa o volume durante reprodução de áudio do exercício.
   * Mantém volume mínimo (não zero) para preservar o pipeline Bluetooth.
   */
  duck(): void {
    if (!this.trackGain || this.ducked) return;
    const ctx = this.audio.getAudioContext();
    this.trackGain.gain.setTargetAtTime(
      BackgroundTrackService.DUCK_VOLUME, ctx.currentTime, 0.08,
    );
    this.ducked = true;
  }

  /** Restaura o volume normal da trilha de fundo. */
  unduck(): void {
    if (!this.trackGain || !this.ducked) return;
    const ctx = this.audio.getAudioContext();
    this.trackGain.gain.setTargetAtTime(this.currentVolume, ctx.currentTime, 3.0);
    this.ducked = false;
  }

  /**
   * Abaixa o volume por uma duração e restaura automaticamente.
   * Chamadas consecutivas resetam o timer de restauração.
   */
  duckFor(durationMs: number): void {
    this.duck();
    if (this.unduckTimer) clearTimeout(this.unduckTimer);
    this.unduckTimer = setTimeout(() => {
      this.unduck();
      this.unduckTimer = null;
    }, durationMs);
  }

  isPlaying(): boolean {
    return this.playing;
  }
}
