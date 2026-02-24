// audio.js - Minimal spatial-ish periodic audio cue manager

class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.lastBeepTime = 0;
    this.intervalSeconds = 1.0;
    this.maxDistance = 35.0;
    this.baseVolume = 0.30;
  }

  ensureContext() {
    if (!this.context) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      this.context = new Ctx();
    }
    return this.context;
  }

  unlock() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume();
    this.enabled = true;
  }

  volumeFromDistance(distance) {
    const t = Math.min(1, Math.max(0, distance / this.maxDistance));
    // Ease-out attenuation so nearby beeps are clear.
    return this.baseVolume * (1 - t) * (1 - t);
  }

  beep(volume = 0.1) {
    const ctx = this.ensureContext();
    if (!ctx || volume <= 0.0005) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(volume, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  update(deltaTime, listenerPosition, sourcePosition) {
    if (!this.enabled || !listenerPosition || !sourcePosition) return;
    this.lastBeepTime += deltaTime;
    if (this.lastBeepTime < this.intervalSeconds) return;
    this.lastBeepTime = 0;

    const dx = listenerPosition[0] - sourcePosition[0];
    const dz = listenerPosition[2] - sourcePosition[2];
    const distance = Math.hypot(dx, dz);
    const volume = this.volumeFromDistance(distance);
    this.beep(volume);
  }
}
