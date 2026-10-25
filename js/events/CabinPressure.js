import { Event } from "./Event.js";
import { ACC, BAD, OK } from "../config.js";
import { F } from "../utils.js";

// ---- Drawing helper -------------------------------------------------------
// The only place that touches the canvas wrapper's rectangle API.
// If your wrapper uses a different signature, change just this function.
// Assumed: c.rect(x0, y0, x1, y1, { fill, stroke })
function box(c, x0, y0, x1, y1, { fill, stroke } = {}) {
  c.rect(x0, y0, x1, y1, { fill, stroke });
}

const PANEL = "#0f141c";
const TRACK = "#1b2230";
const EDGE = "#2b3544";


export class CabinPressure extends Event {
  static title = "CABIN PRESSURE LEAK";
  static system = 2; // Life support
  static stat = "OXYGEN";
  static blurb = "A hull seal is leaking and cabin pressure keeps drifting. PUMP and VENT to hold it inside the target range until the seal holds.";

  static BAND_WIDTH = 20; // size of the target range (in pressure units)
  static HOLD_TIME = 5;   // seconds of continuous stability needed
  static STEP = 6;        // PUMP adds +STEP, VENT adds -STEP

  setup() {
    // Random target range each time (kept away from the very ends)
    this.lo = 10 + Math.random() * (80 - CabinPressure.BAND_WIDTH);
    this.hi = this.lo + CabinPressure.BAND_WIDTH;

    // Start on the far side of the bar from the target, outside the range
    const mid = (this.lo + this.hi) / 2;
    this.level = mid < 50 ? Math.min(95, this.hi + 12) : Math.max(5, this.lo - 12);

    this.drift = (Math.random() < 0.5 ? -1 : 1) * 6; // units/sec
    this.stable = 0;                                 // continuous seconds in range
    this.kick = 0;                                   // time until next gust
    this.t = 0;                                      // animation clock
    
    const cabinpressure_audio = new Audio('../../Elevenlabs/Audio/cabin_pressure.mp3');
    cabinpressure_audio.play();
  }

  inBand() {
    return this.level >= this.lo && this.level <= this.hi;
  }

  effects(dt) {
    // Out-of-range pressure bleeds oxygen faster than the baseline event
    const mult = this.inBand() ? 0.3 : 1.2;
    this.g.damage("OXYGEN", mult * this.g.sev() * dt);
  }

  update(dt) {
    this.t += dt;

    // Random gusts change the drift direction/strength
    this.kick -= dt;
    if (this.kick <= 0) {
      this.kick = 0.8 + Math.random() * 1.2;
      this.drift += (Math.random() - 0.5) * 12;
      this.drift = Math.max(-10, Math.min(10, this.drift));
    }

    this.level += this.drift * dt;
    if (this.level <= 0 || this.level >= 100) {
      this.level = Math.max(0, Math.min(100, this.level));
      this.drift = -this.drift * 0.5; // bounce off the limits
    }

    if (this.inBand()) {
      this.stable += dt;
      if (this.stable >= CabinPressure.HOLD_TIME) this.done = true;
    } else {
      this.stable = 0;
    }
  }

  adjust(amount) {
    this.level = Math.max(0, Math.min(100, this.level + amount));
  }

  drawGame(c, r) {
    const [x0, y0, x1] = r;
    const cx = (x0 + x1) / 2;
    const ok = this.inBand();
    const status = ok ? OK : BAD;

    // Readout
    c.text(cx, y0 + 14, "PRESSURE " + this.level.toFixed(0) + " kPa", { font: F(20), fill: status });
    const trend = this.drift > 1 ? "RISING  >>" : this.drift < -1 ? "<<  FALLING" : "STEADY";
    c.text(cx, y0 + 38, trend, { font: F(13), fill: ACC });

    // ---- Pressure gauge ----
    const gw = Math.min(x1 - x0 - 40, 380);
    const gx0 = cx - gw / 2;
    const gx1 = cx + gw / 2;
    const gy0 = y0 + 70;
    const gy1 = gy0 + 32;
    const px = (v) => gx0 + (v / 100) * gw;

    // Frame + empty track
    box(c, gx0 - 4, gy0 - 4, gx1 + 4, gy1 + 4, { fill: PANEL, stroke: EDGE });
    box(c, gx0, gy0, gx1, gy1, { fill: TRACK });

    // Green fill up to the current pressure
    if (this.level > 0) box(c, gx0, gy0, px(this.level), gy1, { fill: OK });

    // Tick marks every 10 units
    for (let v = 0; v <= 100; v += 10) {
      box(c, px(v) - 0.5, gy1 + 4, px(v) + 0.5, gy1 + 9, { fill: EDGE });
    }

    // Target range, drawn on top so it stays visible over the fill:
    // a "[ ]" bracket around the range plus a bar above it
    const bl = px(this.lo), bh = px(this.hi);
    const tc = ok ? OK : ACC;
    box(c, bl - 2, gy0 - 8, bl + 2, gy1 + 8, { fill: tc });         // left edge
    box(c, bh - 2, gy0 - 8, bh + 2, gy1 + 8, { fill: tc });         // right edge
    box(c, bl - 2, gy0 - 8, bl + 8, gy0 - 4, { fill: tc });         // left top cap
    box(c, bh - 8, gy0 - 8, bh + 2, gy0 - 4, { fill: tc });         // right top cap
    box(c, bl - 2, gy1 + 4, bl + 8, gy1 + 8, { fill: tc });         // left bottom cap
    box(c, bh - 8, gy1 + 4, bh + 2, gy1 + 8, { fill: tc });         // right bottom cap
    c.text((bl + bh) / 2, gy0 - 18, "TARGET", { font: F(11), fill: tc });

    // ---- Hold timer bar ----
    const ty0 = gy1 + 28;
    const ty1 = ty0 + 12;
    const frac = Math.min(1, this.stable / CabinPressure.HOLD_TIME);
    box(c, gx0, ty0, gx1, ty1, { fill: PANEL, stroke: EDGE });
    if (frac > 0) box(c, gx0 + 1, ty0 + 1, gx0 + 1 + (gw - 2) * frac, ty1 - 1, { fill: ACC });
    const left = Math.max(0, CabinPressure.HOLD_TIME - this.stable);
    c.text(cx, ty1 + 14, ok ? "SEAL HOLDING  " + left.toFixed(1) + "s" : "OUT OF RANGE", {
      font: F(13), fill: ok ? ACC : BAD,
    });

    // ---- Buttons: PUMP (+STEP) / VENT (-STEP) ----
    const bw = 120, bth = 40, gap = 16;
    const by = ty1 + 30;
    const sx = cx - (2 * bw + gap) / 2;
    const step = CabinPressure.STEP;
    this.g.btn([sx, by, sx + bw, by + bth], "VENT", () => this.adjust(-step));
    this.g.btn([sx + bw + gap, by, sx + 2 * bw + gap, by + bth], "PUMP", () => this.adjust(step));
  }
}