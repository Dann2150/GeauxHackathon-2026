import { Event } from "./Event.js";
import { ACC } from "../config.js";
import { F, inrect, rand, randInt } from "../utils.js";

const BRUSH_URL = "assets/geaux%20hack%20brush.jpg"; // must match the file name in assets exactly

const BRUSH = new Image();
let sprite = null; // { img, sx, sy, sw, sh }: the brush image plus the crop area to draw
const FALLBACK_CROP = [0.14, 0.26, 0.54, 0.78]; // used only if the browser blocks pixel access

function loadBrush(useCors) {
  BRUSH.onload = () => {
    const W = BRUSH.naturalWidth, H = BRUSH.naturalHeight;
    try {
      // remove the white background and find the brush's bounding box
      const cv = document.createElement("canvas");
      cv.width = W;
      cv.height = H;
      const x = cv.getContext("2d");
      x.drawImage(BRUSH, 0, 0);
      const img = x.getImageData(0, 0, W, H);
      const px = img.data;
      let minX = W, minY = H, maxX = 0, maxY = 0;
      for (let i = 0; i < px.length; i += 4) {
        const min = Math.min(px[i], px[i + 1], px[i + 2]);
        if (min > 235) px[i + 3] = 0;                                           // white -> transparent
        else if (min > 200) px[i + 3] = Math.round(px[i + 3] * (235 - min) / 35); // soften edges
        if (px[i + 3] > 20) {
          const p = i / 4, X = p % W, Y = (p - X) / W;
          if (X < minX) minX = X;
          if (X > maxX) maxX = X;
          if (Y < minY) minY = Y;
          if (Y > maxY) maxY = Y;
        }
      }
      x.putImageData(img, 0, 0);
      sprite = { img: cv, sx: minX, sy: minY, sw: maxX - minX + 1, sh: maxY - minY + 1 };
    } catch (e) {
      // browser blocked pixel access: draw the image as is, cropped by hand
      const [a, b, c2, d2] = FALLBACK_CROP;
      sprite = { img: BRUSH, sx: a * W, sy: b * H, sw: (c2 - a) * W, sh: (d2 - b) * H };
    }
  };
  BRUSH.onerror = () => {
    if (useCors) loadBrush(false);
  };
  if (useCors) BRUSH.crossOrigin = "anonymous"; else BRUSH.removeAttribute("crossorigin");
  BRUSH.src = BRUSH_URL;
}
loadBrush(true);

const COLS = 4, ROWS = 2;
const BRUSH_HEIGHT = 110;  // drawn height in px (width follows the image's proportions)
const TIP = [0.45, 0.75];  // pointer spot on the cropped brush (0..1 across, 0..1 down)
const CLEAN_RATE = 0.012;  // dust removed per px of brush movement
const REGROW = 0.04;       // dust creeps back per second (set to 0 to disable)
const DUST = "#e0a030";    // dust color (was brown)



export class DustStorm extends Event {
  static title = "DUST STORM";
  static system = 1;
  static stat = "POWER";
  static blurb = "Dust is burying the solar arrays. Sweep the brush over every panel to dust them off. Missed spots slowly get buried again.";
  static facts = [
    "Fun Fact: Most storms are regional, but occasionally they grow into global dust storms that surround Mars. These can last for weeks or even months.",
    "Fun Fact: The particles are fine and can cling to surfaces, work into moving mechanisms, and contaminate equipment. Airlocks, filters, suit-cleaning systems, and dust-resistant seals would be essential design features.",
    "Fun Fact: If a greenhouse uses sunlight, a dust storm could reduce the light available to crops. A settlement would need to budget energy for food production during prolonged low-light conditions.",
    "Fun Fact: Dust reduces the solar energy reaching the surface during the day, while absorbing radiation and influencing atmospheric temperatures, cooling the ground but warming parts of the atmosphere.",
    "Fun Fact: In research reported in 2025, NASA's Perseverance rover detected evidence of electrical sparks and associated shock waves in Martian dust devils."
  ];
  setup() {
    this.prog = 0;
    this.need = 4;
    this.dust = Array.from({ length: COLS * ROWS }, () => 1); // 1 = buried, 0 = clean
    this.panelRects = [];
    this.gameRect = null;
    this.overGame = false;
    this.last = null;
    this.canvasEl = document.querySelector("canvas");

    const duststorm_audio = new Audio('../../Elevenlabs/Audio/dust_storm.mp3');
    duststorm_audio.play();

    duststorm_audio.volume = 0.8;
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

    if (this.visible && this.last) {
      const dist = Math.hypot(m[0] - this.last[0], m[1] - this.last[1]);
      this.panelRects.forEach((pr, i) => {
        if (inrect(m, pr)) this.dust[i] = Math.max(0, this.dust[i] - dist * CLEAN_RATE);
      });
    }
    this.last = [m[0], m[1]];

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

    this.overGame = !!(this.visible && inrect(this.g.mouse, r));
    if (this.overGame && this.canvasEl) this.canvasEl.style.cursor = "none";

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
        const a = Math.round(this.dust[i] * 0xcc).toString(16).padStart(2, "0");
        c.rect(...rect, { fill: DUST + a });
      }
    }

    // swirling dust
    for (let i = 0; i < 30; i++) {
      const a = rand(x0, x1), b = rand(y0, y1);
      c.line([a, b, a + randInt(8, 30), b + randInt(-4, 4)], { fill: DUST });
    }

    const cx = (x0 + x1) / 2;
    this.progressBar(c, cx - 140, gy + gh + 30, cx + 140, this.prog / this.need, "PANEL CLEARED");

    // brush cursor, cropped to the drawing, no extra rotation
    if (this.overGame && sprite) {
      const [mx, my] = this.g.mouse;
      const h = BRUSH_HEIGHT, w = h * sprite.sw / sprite.sh;
      c.ctx.drawImage(sprite.img, sprite.sx, sprite.sy, sprite.sw, sprite.sh, mx - TIP[0] * w, my - TIP[1] * h, w, h);
    }
  }
}