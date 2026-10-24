import { Event } from "./Event.js";
import { EDGE, OK, ACC, BAD, DIM } from "../config.js";
import { F, rand, randInt } from "../utils.js";

export class PatchSuit extends Event {
  static title = "GLOVE PUNCTURE";
  static system = 3;
  static stat = "SUIT";
  static blurb = "Sharp regolith cut your glove in several places! DRAG a bandage from the kit and DROP it on each hole.";

  setup() {
    // stationary holes, kept apart so bandages don't overlap
    this.holes = [];
    while (this.holes.length < 3) {
      const fx = rand(0.25, 0.75), fy = rand(0.25, 0.75);
      if (this.holes.every((h) => Math.hypot(h.fx - fx, h.fy - fy) > 0.22)) {
        this.holes.push({ fx, fy, x: 0, y: 0, sealed: false });
      }
    }
    this.drag = false;
    this.patch = null; // [x, y] while dragging
  }

  open() {
    return this.holes.filter((h) => !h.sealed);
  }

  effects(dt) {
    this.g.damage("SUIT", 0.3 * this.open().length * this.g.sev() * dt);
  }

  update(dt) {
    if (this.drag && this.g.down && this.visible) this.patch = [...this.g.mouse];
  }

  // dropping the bandage on an open hole seals it
  release() {
    if (this.drag && this.patch) {
      const hit = this.open().find((h) => Math.hypot(this.patch[0] - h.x, this.patch[1] - h.y) < 28);
      if (hit) {
        hit.sealed = true;
        if (!this.open().length) this.done = true;
      }
    }
    this.drag = false;
    this.patch = null;
  }

  startDrag() {
    this.drag = true;
    this.patch = [...this.g.mouse];
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    const split = x0 + (x1 - x0) * 0.72;
    const [ax0, ay0, ax1, ay1] = [x0 + 20, y0 + 10, split - 10, y1 - 14];

    // glove outline
    c.oval(ax0, ay0, ax1, ay1, { fill: "#2a1a12", outline: EDGE, width: 3 });
    c.text((ax0 + ax1) / 2, ay1 - 14, "LEFT GLOVE", { font: F(9), fill: DIM });

    for (const h of this.holes) {
      h.x = ax0 + h.fx * (ax1 - ax0);
      h.y = ay0 + h.fy * (ay1 - ay0);
      if (h.sealed) {
        c.rect(h.x - 20, h.y - 20, h.x + 20, h.y + 20, { fill: OK, outline: "#000", width: 2 });
        c.line([h.x - 12, h.y, h.x + 12, h.y], { fill: "#000", width: 2 });
        c.line([h.x, h.y - 12, h.x, h.y + 12], { fill: "#000", width: 2 });
        continue;
      }
      const near = this.patch && Math.hypot(this.patch[0] - h.x, this.patch[1] - h.y) < 28;
      c.oval(h.x - 12, h.y - 12, h.x + 12, h.y + 12, { fill: "#000", outline: near ? OK : BAD, width: 2 });
      for (let i = 0; i < 3; i++) { // venting air
        c.line([h.x, h.y, h.x + randInt(-30, 30), h.y + randInt(-30, 30)], { fill: "#bbb" });
      }
    }

    // bandage kit on the right; the bandage follows the mouse while dragged
    const tx = (split + x1) / 2, ty = (y0 + y1) / 2;
    c.rect(split, y0 + 10, x1 - 14, y1 - 14, { outline: EDGE });
    c.text(tx, y0 + 26, "BANDAGE KIT", { font: F(9), fill: DIM });
    c.text(tx, y1 - 32, `${this.open().length} LEFT`, { font: F(10), fill: ACC });
    c.rect(tx - 20, ty - 20, tx + 20, ty + 20, { fill: this.drag ? "#3a2016" : ACC, outline: "#000", width: 2 });
    if (this.patch) c.rect(this.patch[0] - 20, this.patch[1] - 20, this.patch[0] + 20, this.patch[1] + 20, { fill: ACC, outline: "#000", width: 2 });
    if (!this.drag) this.g.zone([tx - 26, ty - 26, tx + 26, ty + 26], () => this.startDrag());
  }
}
