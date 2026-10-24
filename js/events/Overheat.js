import { Event } from "./Event.js";
import { EDGE, OK, ACC, BAD, TXT } from "../config.js";
import { F, rand } from "../utils.js";

export class Overheat extends Event {
  static title = "BATTERY OVERHEAT";
  static system = 1;
  static stat = "POWER";
  static blurb = "Coolant flow is wrong! Drag the slider and keep the handle inside the green band while it drifts.";

  setup() {
    this.val = 0.1;
    this.prog = 0;
    this.need = 3;
    this.ph = rand(0, 6);
    this.drag = false;
    this.track = [0, 0, 1, 1];
  }

  target() {
    return 0.5 + 0.32 * Math.sin(this.age * (0.9 + 0.1 * this.g.sol) + this.ph);
  }

  effects(dt) {
    this.g.damage("POWER", 0.55 * this.g.sev() * dt);
  }

  update(dt) {
    if (this.drag && this.g.down && this.visible) {
      const ty0 = this.track[1], ty1 = this.track[3];
      this.val = Math.max(0, Math.min(1, 1 - (this.g.mouse[1] - ty0) / (ty1 - ty0)));
    }
    if (Math.abs(this.val - this.target()) < 0.1) {
      this.prog += dt;
    } else {
      this.prog = Math.max(0, this.prog - 0.5 * dt);
    }
    if (this.prog >= this.need) this.done = true;
  }

  release() {
    this.drag = false;
  }

  startDrag() {
    this.drag = true;
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    const tx = x0 + (x1 - x0) * 0.35;
    const ty0 = y0 + 12, ty1 = y1 - 24;
    this.track = [tx - 20, ty0, tx + 20, ty1];
    c.rect(tx - 6, ty0, tx + 6, ty1, { fill: "#000", outline: EDGE });
    const h = ty1 - ty0;
    const zc = ty1 - this.target() * h;
    c.rect(tx - 24, zc - 0.1 * h, tx + 24, zc + 0.1 * h, { fill: "#14532d", outline: OK, width: 2 });
    const hy = ty1 - this.val * h;
    const ok = Math.abs(this.val - this.target()) < 0.1;
    c.rect(tx - 32, hy - 9, tx + 32, hy + 9, { fill: ok ? OK : ACC });
    this.g.zone([tx - 45, ty0 - 12, tx + 45, ty1 + 12], () => this.startDrag());
    c.text(tx + 60, y0 + 30, "COOLANT FLOW", { anchor: "nw", font: F(13), fill: TXT });
    c.text(tx + 60, y0 + 56, Math.floor(this.val * 100) + "%", { anchor: "nw", font: F(20), fill: ok ? OK : BAD });
    this.progressBar(c, tx + 60, y0 + 100, x1 - 20, this.prog / this.need, "STABILIZING");
  }
}
