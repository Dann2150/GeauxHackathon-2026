import { Event } from "./Event.js";
import { ACC, BAD, OK } from "../config.js";
import { F, choice } from "../utils.js";

export class ScrubberFail extends Event {
  static title = "CO2 SCRUBBER FAILURE";
  static system = 2;
  static stat = "OXYGEN";
  static blurb = "Scrubbers are down and oxygen is dropping. Enter the reboot code on the keypad. A wrong digit resets the entry.";

  setup() {
    this.code = Array.from({ length: 5 }, () => choice("0123456789")).join("");
    this.entered = "";
    this.flash = 0;
  }

  effects(dt) {
    this.g.damage("OXYGEN", 0.8 * this.g.sev() * dt);
  }

  update(dt) {
    this.flash = Math.max(0, this.flash - dt);
  }

  press(d) {
    if (d === "C") {
      this.entered = "";
      return;
    }
    this.entered += d;
    if (!this.code.startsWith(this.entered)) {
      this.entered = "";
      this.flash = 0.4;
    } else if (this.entered === this.code) {
      this.done = true;
    }
  }

  drawGame(c, r) {
    const [x0, y0, x1] = r;
    const cx = (x0 + x1) / 2;
    c.text(cx, y0 + 16, "CODE: " + this.code.split("").join(" "), { font: F(20), fill: ACC });
    const shown = this.entered ? this.entered.padEnd(5, "_").split("").join(" ") : "_ _ _ _ _";
    c.text(cx, y0 + 52, shown, { font: F(20), fill: this.flash > 0 ? BAD : OK });
    const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", " "];
    const bw = 70, bh = 38, gap = 8;
    const sx = cx - (3 * bw + 2 * gap) / 2;
    keys.forEach((k, i) => {
      if (k === " ") return;
      const bx = sx + (i % 3) * (bw + gap);
      const by = y0 + 80 + Math.floor(i / 3) * (bh + gap);
      this.g.btn([bx, by, bx + bw, by + bh], k === "C" ? "CLR" : k, () => this.press(k));
    });
  }
}
