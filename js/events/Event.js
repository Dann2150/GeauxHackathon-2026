// Base class for every emergency. Subclasses set static metadata
// (title, system, stat, blurb) and override the hook methods.

import { PANEL, EDGE, BAD, DIM, WARN, OK, TXT } from "../config.js";
import { F, blink } from "../utils.js";

export class Event {
  static title = "EVENT";
  static system = 0;
  static stat = "POWER";
  static blurb = "";

  constructor(g) {
    this.g = g;
    this.age = 0;
    this.penT = 0;
    this.done = false;
    this.visible = false;
    this.limit = g.deadline();
    this.setup();
  }

  get name() { return this.constructor.title; }
  get system() { return this.constructor.system; }
  get stat() { return this.constructor.stat; }
  get blurb() { return this.constructor.blurb; }

  // hooks ---------------------------------------------------------------
  setup() {}
  effects(dt) {}
  update(dt) {}
  release() {}
  drawGame(c, r) {}

  // shared frame --------------------------------------------------------
  draw(c, r) {
    this.visible = true;
    const [x0, y0, x1, y1] = r;
    const frac = Math.max(0, 1 - this.penT / this.limit);
    const urgent = frac < 0.3;
    c.rect(...r, { fill: PANEL, outline: urgent && blink() ? BAD : EDGE, width: 2 });
    c.text(x0 + 14, y0 + 10, "[!] " + this.name, { anchor: "nw", font: F(15), fill: BAD });
    c.text(x0 + 14, y0 + 36, this.blurb, { anchor: "nw", font: F(10, false), fill: DIM, width: x1 - x0 - 28 });
    const bx0 = x0 + 14, bx1 = x1 - 14;
    c.rect(bx0, y0 + 66, bx1, y0 + 74, { outline: EDGE });
    c.rect(bx0, y0 + 66, bx0 + (bx1 - bx0) * frac, y0 + 74, { fill: urgent ? BAD : WARN });
    this.drawGame(c, [x0, y0 + 84, x1, y1]);
  }

  progressBar(c, x0, y, x1, frac, label = "") {
    c.rect(x0, y, x1, y + 16, { outline: EDGE });
    c.rect(x0, y, x0 + (x1 - x0) * Math.max(0, Math.min(1, frac)), y + 16, { fill: OK });
    if (label) {
      c.text((x0 + x1) / 2, y + 8, label, { font: F(9), fill: frac > 0.5 ? "#000" : TXT });
    }
  }
}
