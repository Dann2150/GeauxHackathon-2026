import { Event } from "./Event.js";
import { ACC } from "../config.js";
import { F, inrect, rand, randInt } from "../utils.js";

const BRUSH = new Image();
BRUSH.src = "https://static.vecteezy.com/system/resources/thumbnails/021/767/031/small/make-up-brush-icon-symbol-illustration-design-template-vector.jpg";

const COLS = 4, ROWS = 2;
const BRUSH_SIZE = 130; // draw size in px
const TIP = [0.48, 0.88]; // where the bristle tip sits in the image
const CLEAN_RATE = 0.012; // dust removed per px of brush movement
const REGROW = 0.04; // dust creeps back per second (set to 0 to disable)

export class DustStorm extends Event {
  static title = "DUST STORM";
  static system = 1;
  static stat = "POWER";
  static blurb = "Dust is burying the solar arrays. Sweep the brush over every panel to dust them off. Missed spots slowly get buried again.";

  setup() {
    this.prog = 0;
    this.need = 4;
    this.dust = Array.from({ length: COLS * ROWS }, () => 1); // 1 = buried, 0 = clean
    this.panelRects = [];
    this.gameRect = null; // the area where the brush replaces the cursor
    this.overGame = false;
    this.last = null;
    this.canvasEl = document.querySelector("canvas");
  }

  setCursorHidden(hide) {
    if (this.canvasEl) this.canvasEl.style.cursor = hide ? "none" : "";
  }

  restoreCursor() {
    this.overGame = false;
    this.setCursorHidden(false);
  }

  effects(dt) {
    this.g.damage("POWER", 0.7 * this.g.sev() * dt);
  }

  update(dt) {
    const m = this.g.mouse;

    // only hide the system cursor while it's over this event's game area
    this.overGame = !!(this.visible && this.gameRect && inrect(m, this.gameRect));
    this.setCursorHidden(this.overGame);

    if (this.visible && this.last) {
      const dist = Math.hypot(m[0] - this.last[0], m[1] - this.last[1]);
      this.panelRects.forEach((pr, i) => {
        if (inrect(m, pr)) this.dust[i] = Math.max(0, this.dust[i] - dist * CLEAN_RATE);
      });
    }
    this.last = [m[0], m[1]];

    // dust slowly settles back onto the panels
    this.dust = this.dust.map((d) => Math.min(1, d + REGROW * dt));

    const clean = this.dust.reduce((s, d) => s + (1 - d), 0) / this.dust.length;
    this.prog = clean * this.need;

    if (this.dust.every((d) => d < 0.05)) {
      this.done = true;
      this.restoreCursor();
    }
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    this.gameRect = r;

    // solar panels
    const gx = x0 + 40, gy = y0 + (y1 - y0) * 0.12;
    const gw = x1 - x0 - 80, gh = (y1 - y0) * 0.5;
    const pw = gw / COLS, ph = gh / ROWS, pad = 6;
    this.panelRects = [];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const i = row * COLS + col;
        const rect = [gx + col * pw + pad, gy + row * ph + pad, gx + (col + 1) * pw - pad, gy + (row + 1) * ph - pad];
        this.panelRects.push(rect);
        c.rect(...rect, { fill: "#12304f", outline: "#3b7bb8", width: 2 });
        // dust layer fades as you brush it away
        const a = Math.round(this.dust[i] * 0xcc).toString(16).padStart(2, "0");
        c.rect(...rect, { fill: "#8a4b2a" + a });
      }
    }

    // swirling dust
    for (let i = 0; i < 30; i++) {
      const a = rand(x0, x1), b = rand(y0, y1);
      c.line([a, b, a + randInt(8, 30), b + randInt(-4, 4)], { fill: "#8a4b2a" });
    }

    const cx = (x0 + x1) / 2;
    this.progressBar(c, cx - 140, gy + gh + 30, cx + 140, this.prog / this.need, "PANEL CLEARED");

    // brush cursor, only while the mouse is inside the game area
    if (this.overGame && BRUSH.complete && BRUSH.naturalWidth) {
      const [mx, my] = this.g.mouse;
      const ctx = c.ctx;
      ctx.save();
      ctx.filter = "invert(1)"; // black brush -> white
      ctx.globalCompositeOperation = "lighten";
      ctx.translate(mx, my);
      ctx.rotate(0.35);
      ctx.drawImage(BRUSH, -TIP[0] * BRUSH_SIZE, -TIP[1] * BRUSH_SIZE, BRUSH_SIZE, BRUSH_SIZE);
      ctx.restore();
    }
  }
}