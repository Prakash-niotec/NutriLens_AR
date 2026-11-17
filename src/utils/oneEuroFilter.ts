/**
 * 1-Euro Filter for low-jitter, zero-lag interactive tracking.
 * Reference: Casiez, G., Roussel, N. and Vogel, D. (2012).
 * "1 € Filter: A Simple Speed-based Low-pass Filter for Noisy Input in Interactive Systems."
 * ACM Conference on Human Factors in Computing Systems (CHI '12).
 */

class LowPassFilter {
  private y: number | null = null;
  private s: number | null = null;

  filter(value: number, alpha: number): number {
    if (this.s === null) {
      this.s = value;
      this.y = value;
      return value;
    }
    this.y = value;
    this.s = alpha * value + (1.0 - alpha) * this.s;
    return this.s;
  }

  hasLast(): boolean {
    return this.y !== null;
  }

  last(): number {
    return this.y ?? 0;
  }

  reset() {
    this.y = null;
    this.s = null;
  }
}

export class OneEuroFilter {
  private minCutoff: number;
  private beta: number;
  private dCutoff: number;
  private xFilter = new LowPassFilter();
  private dxFilter = new LowPassFilter();
  private lastTime: number | null = null;

  /**
   * @param minCutoff Minimum cutoff frequency in Hz. Lower values reduce static jitter (e.g. 0.8 - 1.2 Hz).
   * @param beta Speed coefficient. Higher values eliminate motion lag (e.g. 0.05 - 0.2).
   * @param dCutoff Derivative cutoff frequency in Hz (typically 1.0 Hz).
   */
  constructor(minCutoff = 1.0, beta = 0.08, dCutoff = 1.0) {
    this.minCutoff = minCutoff;
    this.beta = beta;
    this.dCutoff = dCutoff;
  }

  private alpha(cutoff: number, dt: number): number {
    const tau = 1.0 / (2.0 * Math.PI * cutoff);
    return 1.0 / (1.0 + tau / dt);
  }

  filter(x: number, timestampMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = timestampMs;
      return this.xFilter.filter(x, 1.0);
    }

    const dt = Math.max(0.001, (timestampMs - this.lastTime) / 1000.0);
    this.lastTime = timestampMs;

    // Filter the derivative (velocity)
    const prevX = this.xFilter.last();
    const dx = (x - prevX) / dt;
    const edx = this.dxFilter.filter(dx, this.alpha(this.dCutoff, dt));

    // Adaptive cutoff frequency: higher velocity -> higher cutoff -> zero lag!
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);

    // Filter the signal
    return this.xFilter.filter(x, this.alpha(cutoff, dt));
  }

  reset() {
    this.xFilter.reset();
    this.dxFilter.reset();
    this.lastTime = null;
  }
}
