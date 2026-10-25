import { Event } from "./Event.js";
import { OK, BAD } from "../config.js";
import { F, inrect } from "../utils.js";

const COLORS = ["#e53935", "#1e88e5", "#fdd835", "#43a047"]; // red, blue, yellow, green
const LIGHT_R = 90;           // flashlight radius in px
const WRONG_DAMAGE = 0.6;     // extra power damage for plugging into the wrong port
const DIM = "#161c24";        // how cables look outside the light (shapes visible, colors not)

export class LooseCables extends Event {
  static title = "POWER SURGE";
  static system = 1;
  static stat = "POWER";
  static blurb = "A surge knocked the power cables loose and the lights are out! Move your flashlight to find each cable, click it, then click the port with the matching color.";

  setup() {
    this.need = COLORS.length;
    this.prog = 0;
    // shuffle which color sits at which port
    this.portColor = COLORS.map((_, i) => i).sort(() => Math.random() - 0.5);
    this.connected = COLORS.map(() => -1); // port index each cable is plugged into, or -1
    this.selected = -1;
    this.cableRects = [];
    this.portRects = [];
    this.gameRect = null;
    this.overGame = false;
    this.wasDown = false;
    this.flash = null;
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
    this.g.damage("POWER", 0.55 * this.g.sev() * dt);
  }

  update(dt) {
    if (!this.cableRects.length) return; // wait for the first draw
    const mouse = this.g.mouse;

    // flashlight replaces the system cursor only while over the game area
    this.overGame = !!(this.visible && this.gameRect && inrect(mouse, this.gameRect));
    this.setCursorHidden(this.overGame);

    // click detection (rising edge of the mouse button)
    const down = this.g.down;
    const click = down && !this.wasDown;
    this.wasDown = down;

    if (click && this.visible) {
      const pad = (r) => [r[0] - 8, r[1] - 8, r[2] + 8, r[3] + 8];

      // pick up an unplugged cable
      this.cableRects.forEach((r, i) => {
        if (this.connected[i] === -1 && inrect(mouse, pad(r))) this.selected = i;
      });

      // try a port
      if (this.selected !== -1) {
        this.portRects.forEach((r, j) => {
          if (this.connected.includes(j) || !inrect(mouse, pad(r))) return;
          if (this.portColor[j] === this.selected) {
            this.connected[this.selected] = j;
            this.prog += 1;
            this.flash = { text: "CONNECTED", col: OK, t: 1 };
          } else {
            this.g.damage("POWER", WRONG_DAMAGE * this.g.sev());
            this.flash = { text: "WRONG PORT: COLORS DON'T MATCH", col: BAD, t: 1.2 };
          }
          this.selected = -1;
        });
      }
    }

    if (this.flash) {
      this.flash.t -= dt;
      if (this.flash.t <= 0) this.flash = null;
    }

    if (this.prog >= this.need) {
      this.done = true;
      this.restoreCursor();
    }
  }

  // draws all cables and ports; lit = true shows real colors, false shows dark silhouettes
  drawParts(c, lit) {
    const mouse = this.g.mouse;
    this.cableRects.forEach((r, i) => {
      const col = lit ? COLORS[i] : DIM;
      const cy = (r[1] + r[3]) / 2;
      const j = this.connected[i];
      if (j !== -1) {
        const pr = this.portRects[j];
        c.line([r[2], cy, pr[0], (pr[1] + pr[3]) / 2], { fill: col, width: 4 });
      } else if (this.selected === i) {
        c.line([r[2], cy, mouse[0], mouse[1]], { fill: col, width: 4 }); // wire follows the flashlight
      } else {
        c.line([r[0] - 40, cy, r[0], cy], { fill: col, width: 4 }); // loose cable hanging
      }
      c.rect(...r, { fill: col, outline: lit && this.selected === i ? "#ffffff" : DIM, width: 2 });
    });
    this.portRects.forEach((r, j) => {
      const taken = this.connected.includes(j);
      const col = lit ? COLORS[this.portColor[j]] : DIM;
      c.rect(...r, { fill: "#05070a", outline: col, width: 4 });
      if (taken) c.rect(r[0] + 8, r[1] + 8, r[2] - 8, r[3] - 8, { fill: col });
    });
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    this.gameRect = r;
    const cx = (x0 + x1) / 2;
    const n = COLORS.length;

    // layout: cables on the left, ports on the right
    const top = y0 + 50, bottom = y1 - 56;
    const step = (bottom - top) / n;
    this.cableRects = [];
    this.portRects = [];
    for (let i = 0; i < n; i++) {
      const cy = top + step * (i + 0.5);
      this.cableRects.push([x0 + 70, cy - 14, x0 + 120, cy + 14]);
      this.portRects.push([x1 - 100, cy - 18, x1 - 60, cy + 18]);
    }

    // darkness
    c.rect(x0, y0, x1, y1, { fill: "#05070a" });
    this.drawParts(c, false);

    // flashlight: draw the real colors only inside the beam
    const ctx = c.ctx; // raw 2D context, adjust if your canvas wrapper names it differently
    if (this.overGame) {
      const [mx, my] = this.g.mouse;
      ctx.save();
      ctx.beginPath();
      ctx.arc(mx, my, LIGHT_R, 0, Math.PI * 2);
      ctx.clip();
      c.rect(x0, y0, x1, y1, { fill: "#1b1f26" }); // lit floor
      this.drawParts(c, true);
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = "rgba(255, 244, 200, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(mx, my, LIGHT_R, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffffff"; // small dot at the center of the beam
      ctx.beginPath();
      ctx.arc(mx, my, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // text and progress sit outside the dark area so they stay readable
    const msg = this.flash ? this.flash.text : (this.selected === -1 ? "FIND A CABLE, THEN CLICK IT" : "NOW CLICK THE MATCHING PORT");
    c.text(cx, y0 + 22, msg, { font: F(11), fill: this.flash ? this.flash.col : "#8fb3d9" });
    this.progressBar(c, x0 + 20, y1 - 26, x1 - 20, this.prog / this.need, "CABLES RECONNECTED");
  }
}