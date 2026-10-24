import { Event } from "./Event.js";
import { EDGE, OK, BAD, ACC } from "../config.js";
import { F, sample, shuffle } from "../utils.js";

export class SuitLeak extends Event {
  static title = "SUIT PRESSURE LEAK";
  static system = 3;
  static stat = "SUIT";
  static blurb = "Your suit is venting! Close the four valves IN ORDER: 1, 2, 3, 4. A wrong click starts you over.";

  setup() {
    const grid = [];
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) grid.push([i, j]);
    const cells = sample(grid, 4);
    const nums = shuffle([1, 2, 3, 4]);
    this.valves = cells.map((cell, i) => ({ cell, n: nums[i] }));
    this.nxt = 1;
    this.flash = 0;
  }

  effects(dt) {
    this.g.damage("SUIT", 0.9 * this.g.sev() * dt);
  }

  update(dt) {
    this.flash = Math.max(0, this.flash - dt);
  }

  press(n) {
    if (n === this.nxt) {
      this.nxt += 1;
      if (this.nxt > 4) this.done = true;
    } else {
      this.nxt = 1;
      this.flash = 0.4;
    }
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    c.oval(cx - 60, cy - 90, cx + 60, cy + 90, { outline: EDGE, width: 2 });
    c.oval(cx - 28, cy - 125, cx + 28, cy - 75, { outline: EDGE, width: 2 });
    for (const v of this.valves) {
      const px = x0 + 50 + v.cell[0] * (x1 - x0 - 100) / 3;
      const py = y0 + 30 + v.cell[1] * (y1 - y0 - 80) / 2;
      const closed = v.n < this.nxt;
      const col = closed ? OK : (this.flash > 0 ? BAD : ACC);
      c.oval(px - 22, py - 22, px + 22, py + 22, { fill: closed ? "#14532d" : "#3a2016", outline: col, width: 3 });
      c.text(px, py, String(v.n), { font: F(16), fill: col });
      this.g.zone([px - 24, py - 24, px + 24, py + 24], () => this.press(v.n));
    }
  }
}
