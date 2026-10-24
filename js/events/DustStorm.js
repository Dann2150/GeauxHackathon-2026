import { Event } from "./Event.js";
import { ACC } from "../config.js";
import { F, inrect, rand, randInt } from "../utils.js";

export class DustStorm extends Event {
  static title = "DUST STORM";
  static system = 1;
  static stat = "POWER";
  static blurb = "Dust is burying the solar arrays. HOLD the mouse on the button to run the panel brushes. Let go and it resets.";

  setup() {
    this.prog = 0;
    this.need = 4;
    this.btnRect = [0, 0, 1, 1];
  }

  effects(dt) {
    this.g.damage("POWER", 0.7 * this.g.sev() * dt);
  }

  update(dt) {
    if (this.visible && this.g.down && inrect(this.g.mouse, this.btnRect)) {
      this.prog += dt;
    } else {
      this.prog = Math.max(0, this.prog - 2 * dt);
    }
    if (this.prog >= this.need) this.done = true;
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    for (let i = 0; i < 30; i++) { // swirling dust
      const a = rand(x0, x1), b = rand(y0, y1);
      c.line([a, b, a + randInt(8, 30), b + randInt(-4, 4)], { fill: "#8a4b2a" });
    }
    const cx = (x0 + x1) / 2, cy = y0 + (y1 - y0) * 0.38;
    this.btnRect = [cx - 140, cy - 34, cx + 140, cy + 34];
    const held = this.g.down && inrect(this.g.mouse, this.btnRect);
    c.rect(...this.btnRect, { fill: held ? ACC : "#3a2016", outline: ACC, width: 3 });
    c.text(cx, cy, "HOLD: RUN BRUSHES", { font: F(14), fill: held ? "#000" : ACC });
    this.progressBar(c, cx - 140, cy + 52, cx + 140, this.prog / this.need, "PANEL CLEARED");
  }
}
