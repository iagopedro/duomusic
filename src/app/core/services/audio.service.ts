import { Injectable } from '@angular/core';
import { ChordType, OscillatorType } from '../models';

/**
 * Lookahead mínimo de agendamento.
 * 200 ms garante que o buffer Bluetooth A2DP esteja preenchido antes da reprodução.
 * Dispositivos BT desconnectam o pipe de áudio no silêncio e precisam de tempo
 * para reconectar; valores abaixo de 150 ms resultam em áudio descartado.
 */
const MIN_LOOKAHEAD_S = 0.2;

@Injectable({ providedIn: 'root' })
export class AudioService {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private keepAliveOsc: OscillatorNode | null = null;
  private _volume = 0.7;

  private getCtx(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      // 'playback' prioriza continuidade do áudio sobre baixa latência,
      // evitando underruns no pipeline Bluetooth.
      this.ctx = new AudioContext({ latencyHint: 'playback' });
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._volume;
      this.masterGain.connect(this.ctx.destination);
      this.startKeepAlive();
    }
    return this.ctx;
  }

  /**
   * Tom inaudível contínuo (20 Hz, ganho ~0) que mantém o pipe de áudio Bluetooth
   * aberto durante os silêncios entre exercícios.
   * Sem isso, o device BT "dorme" e o primeiro som de cada sequência é descartado
   * enquanto a conexão A2DP é reestabelecida (~200–500 ms de delay).
   */
  private startKeepAlive(): void {
    if (!this.ctx || this.keepAliveOsc) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    gain.gain.value = 0.00001; // inaudível
    osc.frequency.value = 20;  // abaixo do limiar auditivo
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    this.keepAliveOsc = osc;
  }

  /**
   * Calcula o offset de agendamento em segundos.
   * Usa o maior entre o outputLatency reportado e o MIN_LOOKAHEAD_S.
   * NOTA: outputLatency costuma ser 0 em BT apesar da latência real de 150–300 ms;
   * por isso MIN_LOOKAHEAD_S = 200 ms é o valor de segurança.
   */
  private scheduleOffset(): number {
    const ctx = this.getCtx();
    const reported = (ctx as AudioContext & { outputLatency?: number }).outputLatency ?? 0;
    return Math.max(reported + ctx.baseLatency, MIN_LOOKAHEAD_S);
  }

  /** Latência de saída em milissegundos (usada para calibrar o timing do ritmo). */
  getOutputLatencyMs(): number {
    return this.scheduleOffset() * 1000;
  }

  /**
   * Retorna o próximo instante de início seguro no clock do Web Audio (em segundos).
   * Use este valor para pré-agendar sequências inteiras de sons em uma única chamada,
   * garantindo um stream contínuo para dispositivos Bluetooth.
   */
  getScheduleStart(): number {
    return this.getCtx().currentTime + this.scheduleOffset();
  }

  /** Offset de agendamento em milissegundos (equivalente a getOutputLatencyMs). */
  getScheduleOffsetMs(): number {
    return this.scheduleOffset() * 1000;
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
    // Garante que o keep-alive está rodando após o resume
    this.startKeepAlive();
  }

  setMasterVolume(value: number): void {
    this._volume = Math.max(0, Math.min(1, value));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this._volume, this.getCtx().currentTime, 0.01);
    }
  }

  /**
   * Toca um tom sintético.
   * @param startAt Instante de início em segundos (AudioContext time). Se omitido,
   *                usa currentTime + scheduleOffset() para compensar latência Bluetooth.
   */
  playTone(freq: number, durationMs: number, type: OscillatorType = 'sine', startAt?: number): void {
    const ctx = this.getCtx();
    const osc = ctx.createOscillator();
    const envGain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;

    const now = startAt ?? (ctx.currentTime + this.scheduleOffset());
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
    const ctx = this.getCtx();
    // Agenda ambas as notas pelo scheduler do Web Audio para manter sincronismo
    // mesmo em dispositivos Bluetooth de alta latência.
    const start = ctx.currentTime + this.scheduleOffset();
    const dur = durationMs / 1000;
    this.playTone(rootFreq, durationMs, 'sine', start);
    this.playTone(upper, durationMs, 'sine', start + dur + 0.15);
  }

  playChord(rootFreq: number, chordType: ChordType, durationMs = 1500): void {
    const intervals = this.chordIntervals(chordType);
    const ctx = this.getCtx();
    // Strum agendado via Web Audio clock em vez de setTimeout
    const start = ctx.currentTime + this.scheduleOffset();
    intervals.forEach((semi, idx) => {
      const freq = rootFreq * Math.pow(2, semi / 12);
      this.playTone(freq, durationMs, 'sine', start + idx * 0.03);
    });
  }

  /**
   * @param accent Tick acentuado (beat 0) ou tick normal.
   * @param startAt Instante de início em segundos (Web Audio clock). Se omitido,
   *                agenda com scheduleOffset() como lookahead — porém prefira passar
   *                um valor explícito ao pré-agendar sequências inteiras de beats.
   */
  playMetronomeTick(accent = false, startAt?: number): void {
    this.playTone(accent ? 880 : 660, 80, 'square', startAt);
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
