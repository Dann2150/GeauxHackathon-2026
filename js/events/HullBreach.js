import { Event } from "./Event.js";
import { EDGE, BAD, WARN } from "../config.js";
import { F, rand, randInt } from "../utils.js";

export class HullBreach extends Event {
  static title = "HULL BREACH";
  static system = 0;
  static stat = "PRESSURE";
  static blurb = "Micrometeorite strike! Click each crack twice to apply sealant before the pressure bleeds out.";

  setup() {
    this.cracks = Array.from({ length: 3 }, () => ({
      fx: rand(0.15, 0.85),
      fy: rand(0.2, 0.8),
      hp: 2,
      zz: Array.from({ length: 6 }, () => randInt(-14, 14)),
    }));
  }

  effects(dt) {
    this.g.damage("PRESSURE", 0.38 * this.cracks.length * this.g.sev() * dt);
  }

  patch(crack) {
    crack.hp -= 1;
    const idx = this.cracks.indexOf(crack);
    if (crack.hp <= 0 && idx !== -1) {
      this.cracks.splice(idx, 1);
      if (!this.cracks.length) this.done = true;
    }
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    c.rect(x0 + 10, y0 + 6, x1 - 10, y1 - 10, { outline: EDGE, width: 3 });
    for (const k of this.cracks) {
      const px = x0 + 30 + k.fx * (x1 - x0 - 60);
      const py = y0 + 20 + k.fy * (y1 - y0 - 60);
      const pts = [];
      k.zz.forEach((dy, i) => pts.push(px + (i - 2.5) * 11, py + dy * 0.8));
      c.line(pts, { fill: BAD, width: 3 });
      const col = k.hp === 1 ? WARN : BAD;
      c.oval(px - 28, py - 28, px + 28, py + 28, { outline: col, width: 2 });
      c.text(px, py + 40, "SEAL x" + k.hp, { font: F(9), fill: col });
      for (let i = 0; i < 3; i++) { // escaping air
        c.line([px, py, px + randInt(-40, 40), py + randInt(-40, 40)], { fill: "#bbb" });
      }
      this.g.zone([px - 30, py - 30, px + 30, py + 30], () => this.patch(k));
    }
  }
}
