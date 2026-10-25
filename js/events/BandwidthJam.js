import { Event } from "./Event.js";
import { OK, WARN } from "../config.js";
import { F, inrect } from "../utils.js";

const COLS = 4, ROWS = 2;
const SLOTS = COLS * ROWS;
const SPAWN_EVERY = 0.8;   // seconds between new messages
const URGENT_CHANCE = 0.5; // chance a new message is urgent
const URGENT_LIFE = 4.5;   // seconds before an urgent message times out
const ROUTINE_LIFE = 3.5;  // seconds before a routine message goes away
const WRONG_PENALTY = 1;   // messages lost for clicking a routine one
const MISS_PENALTY = 0.5;  // messages lost when an urgent one times out

const URGENT = ["MEDICAL DATA", "LIFE SUPPORT ALERT", "SUIT TELEMETRY", "HULL SENSOR REPORT", "CREW HEALTH LOG"];
const ROUTINE = ["WEATHER LOG", "PHOTO UPLOAD", "CREW EMAIL", "MUSIC LIBRARY", "SYSTEM BACKUP", "VIDEO CALL"];


export class BandwidthJam extends Event {
  static title = "BANDWIDTH JAM";
  static system = 4;
  static stat = "RADIATION"; // must be one of the stats in STAT_ORDER
  static blurb = "The link is overloaded. Messages are piling up. Click only the red URGENT ones to send them, and leave the routine ones alone.";
  static facts = [
    "Fun Fact: A settlement may share radio links among crew communications, rover control, scientific instruments, habitat sensors, and data transfers to Earth",
    "Fun Fact: Radio signals between Earth and Mars take approximately 3–22 minutes one way, depending on the planets' positions.",
    "Fun Fact: Crews could use redundant radios, backup power, alternate relay paths, and prearranged emergency procedures during lack of communication emergencies.",
    "Fun Fact: NASA researchers have documented radio-frequency interference between spacecraft operating around Mars. Signals from one spacecraft can interfere with another spacecraft's receiver when their transmissions overlap in problematic ways."
  ];

  setup() {
    this.prog = 0;   // urgent messages sent
    this.need = 6;
    this.msgs = Array(SLOTS).fill(null);
    this.slotRects = [];
    this.spawnT = 0;
    this.wasDown = false;
    this.flash = null; // { text, col, t }

    
    const bandwidthjam_audio = new Audio('../../Elevenlabs/Audio/band_widthJam.mp3');
    bandwidthjam_audio.play();
  }

  effects(dt) {
    this.g.damage("RADIATION", 0.8 * this.g.sev() * dt);
  }

  spawn() {
    const free = [];
    this.msgs.forEach((m, i) => { if (!m) free.push(i); });
    if (!free.length) return;
    const slot = free[Math.floor(Math.random() * free.length)];
    const urgent = Math.random() < URGENT_CHANCE;
    const list = urgent ? URGENT : ROUTINE;
    const life = urgent ? URGENT_LIFE : ROUTINE_LIFE;
    this.msgs[slot] = { urgent, label: list[Math.floor(Math.random() * list.length)], life, left: life };
  }

  setFlash(text, col) {
    this.flash = { text, col, t: 1.2 };
  }

  update(dt) {
    if (!this.slotRects.length) return; // wait for the first draw

    // new messages arrive
    this.spawnT += dt;
    if (this.spawnT >= SPAWN_EVERY) {
      this.spawnT = 0;
      this.spawn();
    }

    // messages age out
    this.msgs.forEach((m, i) => {
      if (!m) return;
      m.left -= dt;
      if (m.left <= 0) {
        if (m.urgent) {
          this.prog = Math.max(0, this.prog - MISS_PENALTY);
          this.setFlash("URGENT MESSAGE MISSED", WARN);
        }
        this.msgs[i] = null;
      }
    });

    // click detection (rising edge of the mouse button)
    const down = this.g.down;
    const click = down && !this.wasDown;
    this.wasDown = down;

    if (click && this.visible) {
      this.slotRects.forEach((rect, i) => {
        const m = this.msgs[i];
        if (!m || !inrect(this.g.mouse, rect)) return;
        if (m.urgent) {
          this.prog += 1;
          this.setFlash("SENT: " + m.label, OK);
        } else {
          this.prog = Math.max(0, this.prog - WRONG_PENALTY);
          this.setFlash("WASTED BANDWIDTH ON ROUTINE DATA", WARN);
        }
        this.msgs[i] = null;
      });
    }

    if (this.flash) {
      this.flash.t -= dt;
      if (this.flash.t <= 0) this.flash = null;
    }

    if (this.prog >= this.need) this.done = true;
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    const cx = (x0 + x1) / 2;

    c.text(cx, y0 + 22, "LINK OVERLOADED: SEND URGENT ONLY", { font: F(12), fill: WARN });

    // message grid
    const gx0 = x0 + 24, gx1 = x1 - 24;
    const gy0 = y0 + 50, gy1 = y0 + (y1 - y0) * 0.68;
    const gap = 10;
    const cw = (gx1 - gx0 - gap * (COLS - 1)) / COLS;
    const ch = (gy1 - gy0 - gap * (ROWS - 1)) / ROWS;
    this.slotRects = [];

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const i = row * COLS + col;
        const rx = gx0 + col * (cw + gap);
        const ry = gy0 + row * (ch + gap);
        const rect = [rx, ry, rx + cw, ry + ch];
        this.slotRects.push(rect);

        const m = this.msgs[i];
        if (!m) {
          c.rect(...rect, { fill: "#0c1520", outline: "#1f3347", width: 1 });
          continue;
        }

        const hot = this.visible && inrect(this.g.mouse, rect);
        const fill = m.urgent ? (hot ? "#7a1f1f" : "#4a1414") : (hot ? "#2a3440" : "#1a232d");
        const edge = m.urgent ? WARN : "#4a5a6a";
        c.rect(...rect, { fill, outline: edge, width: m.urgent ? 3 : 2 });
        c.text(rx + cw / 2, ry + ch / 2 - 8, m.urgent ? "URGENT" : "ROUTINE", { font: F(9), fill: m.urgent ? WARN : "#8a98a8" });
        c.text(rx + cw / 2, ry + ch / 2 + 10, m.label, { font: F(8), fill: m.urgent ? "#ffd0d0" : "#8a98a8" });

        // time-left bar along the bottom of the card
        const frac = Math.max(0, m.left / m.life);
        c.rect(rx + 4, ry + ch - 8, rx + 4 + (cw - 8) * frac, ry + ch - 4, { fill: m.urgent ? WARN : "#4a5a6a" });
      }
    }

    // feedback line
    if (this.flash) {
      c.text(cx, gy1 + 20, this.flash.text, { font: F(10), fill: this.flash.col });
    } else {
      c.text(cx, gy1 + 20, "CLICK RED MESSAGES. IGNORE GREY ONES.", { font: F(10), fill: "#8fb3d9" });
    }

    this.progressBar(c, gx0, gy1 + 44, gx1, this.prog / this.need, "URGENT DATA SENT");
  }
}