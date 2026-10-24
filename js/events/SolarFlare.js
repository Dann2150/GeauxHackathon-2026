import { Event } from "./Event.js";
import { OK, WARN } from "../config.js";
import { F, rand } from "../utils.js";

export class SolarFlare extends Event {
  static title = "SOLAR FLARE";
  static system = 4;
  static stat = "RADIATION";
  static blurb = "Radiation spiking! Lock the relay satellite to trigger the magnetic shield. HOLD the mouse on the moving target.";

  setup() {
    this.prog = 0;
    this.need = 4;
    this.p1 = rand(0, 6);
    this.p2 = rand(0, 6);
    this.gr = [0, 0, 1, 1];
  }

  pos() {
    const [x0, y0, x1, y1] = this.gr;
    const sp = 1 + 0.12 * (this.g.sol - 1);
    return [
      (x0 + x1) / 2 + (x1 - x0) * 0.38 * Math.sin(this.age * 0.8 * sp + this.p1),
      (y0 + y1) / 2 + (y1 - y0) * 0.36 * Math.sin(this.age * 1.15 * sp + this.p2),
    ];
  }

  locked() {
    const [tx, ty] = this.pos();
    const [mx, my] = this.g.mouse;
    return this.g.down && Math.hypot(mx - tx, my - ty) < 42;
  }

  effects(dt) {
    this.g.damage("RADIATION", 1.1 * this.g.sev() * dt);
  }

  update(dt) {
    if (this.visible && this.locked()) {
      this.prog += dt;
    } else {
      this.prog = Math.max(0, this.prog - 0.6 * dt);
    }
    if (this.prog >= this.need) this.done = true;
  }

  drawGame(c, r) {
    this.gr = [r[0], r[1], r[2], r[3] - 30];
    const [tx, ty] = this.pos();
    const col = this.locked() ? OK : WARN;
    c.oval(tx - 40, ty - 40, tx + 40, ty + 40, { outline: col, width: 3 });
    c.line([tx - 52, ty, tx + 52, ty], { fill: col });
    c.line([tx, ty - 52, tx, ty + 52], { fill: col });
    c.text(tx, ty + 56, "RELAY SAT", { font: F(9), fill: col });
    this.progressBar(c, r[0] + 20, r[3] - 26, r[2] - 20, this.prog / this.need, "SHIELD LOCK");
  }
}
