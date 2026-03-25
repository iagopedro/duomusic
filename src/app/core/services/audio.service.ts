import { Injectable } from '@angular/core';
import { ChordType, OscillatorType } from '../models';

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private _volume = 0.7;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  private getMaster(): GainNode {
    this.getCtx();
    return this.masterGain!;
  }

  /** Resume AudioContext after a user gesture (required by some browsers). */
  async resume(): Promise<void> {
    const ctx = this.getCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  setMasterVolume(value: number): void {
    this._volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this._volume, this.getCtx().currentTime, 0.01);
    }
  }

  playTone(freq: number, durationMs: number, type: OscillatorType = 'sine'): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const envGain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    const now = ctx.currentTime;
    const dur = durationMs / 1000;

    // Simple ADSR envelope
    envGain.gain.setValueAtTime(0, now);
    envGain.gain.linearRampToValueAtTime(0.8, now + 0.01);
    envGain.gain.setValueAtTime(0.8, now + dur - 0.05);
    envGain.gain.linearRampToValueAtTime(0, now + dur);

    osc.connect(envGain);
    envGain.connect(this.getMaster());

    osc.start(now);
    osc.stop(now + dur);
  }

  playInterval(rootFreq: number, semitones: number, durationMs = 1000): void {
    const upper = rootFreq * Math.pow(2, semitones / 12);
    this.playTone(rootFreq, durationMs);
    const ctx = this.getCtx();
    // Play upper note after a brief gap
    setTimeout(() => this.playTone(upper, durationMs), durationMs + 150);
  }

  playChord(rootFreq: number, chordType: ChordType, durationMs = 1500): void {
    const intervals = this.chordIntervals(chordType);
    intervals.forEach((semi, idx) => {
      const freq = rootFreq * Math.pow(2, semi / 12);
      // Slight strum delay for each note
      setTimeout(() => this.playTone(freq, durationMs, 'sine'), idx * 30);
    });
  }

  playMetronomeTick(accent = false): void {
    this.playTone(accent ? 880 : 660, 60, 'square');
  }

  private chordIntervals(chordType: ChordType): number[] {
    const map: Record<ChordType, number[]> = {
      major: [0, 4, 7],
      minor: [0, 3, 7],
      dim:   [0, 3, 6],
      aug:   [0, 4, 8],
    };
    return map[chordType];
  }
}
