import { Event } from "./Event.js";
import { EDGE, ACC, BAD, DIM } from "../config.js";
import { F, choice, randInt, shuffle } from "../utils.js";

// Look-alike symbol pairs: one is the good data, the other the flipped bit.
const PAIRS = [["0", "O"], ["1", "l"], ["8", "B"], ["5", "S"], ["E", "F"], ["M", "N"]];
const COLS = 6, ROWS = 4;

export class CosmicRadiation extends Event {
  static title = "COSMIC RAY DATA CORRUPTION";
  static system = 4;
  static stat = "RADIATION";
  static blurb = "Cosmic rays flipped bits in the comms memory, blinding the radiation monitor. Click the ONE symbol that doesn't match. Fix 3 packets; a wrong click starts you over.";

  setup() {
    this.round = 0;
    this.need = 3;
    this.flash = 0;
    this.newPacket();
  }

  newPacket() {
    [this.good, this.bad] = shuffle([...choice(PAIRS)]);
    this.odd = randInt(0, COLS * ROWS - 1);
  }

  effects(dt) {
    this.g.damage("RADIATION", 0.9 * this.g.sev() * dt);
  }

  update(dt) {
    this.flash = Math.max(0, this.flash - dt);
  }

  pick(i) {
    if (i === this.odd) {
      this.round += 1;
      if (this.round >= this.need) this.done = true;
    } else {
      this.round = 0;
      this.flash = 0.4;
    }
    this.newPacket();
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    const size = Math.min((x1 - x0 - 40) / COLS, (y1 - y0 - 50) / ROWS, 56);
    const gx = (x0 + x1) / 2 - (size * COLS) / 2;
    const gy = y0 + 6;
    const col = this.flash > 0 ? BAD : ACC;
    for (let i = 0; i < COLS * ROWS; i++) {
      const cx0 = gx + (i % COLS) * size, cy0 = gy + Math.floor(i / COLS) * size;
      const cell = [cx0 + 3, cy0 + 3, cx0 + size - 3, cy0 + size - 3];
      c.rect(...cell, { fill: "#000", outline: this.flash > 0 ? BAD : EDGE });
      c.text(cx0 + size / 2, cy0 + size / 2, i === this.odd ? this.bad : this.good, { font: F(16), fill: col });
      this.g.zone(cell, () => this.pick(i));
    }
    const by = gy + ROWS * size + 12;
    this.progressBar(c, x0 + 20, by, x1 - 20, this.round / this.need, `PACKETS RESTORED ${this.round}/${this.need}`);
    if (this.flash > 0) c.text((x0 + x1) / 2, by + 30, "WRONG BLOCK - RESTARTING", { font: F(9), fill: BAD });
    else c.text((x0 + x1) / 2, by + 30, "Find the flipped bit", { font: F(9, false), fill: DIM });
  }
}
