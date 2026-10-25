import { Event } from "./Event.js";
import { EDGE, OK, ACC, DIM } from "../config.js";
import { F, choice, randInt } from "../utils.js";


const N = 1, E = 2, S = 4, W = 8;
const DIRS = [[N, 0, -1], [E, 1, 0], [S, 0, 1], [W, -1, 0]]; // [side, dcol, drow]
const COLS = 4, ROWS = 3;

const opposite = (d) => ((d << 2) | (d >> 2)) & 15;
const turn = (m) => ((m << 1) | (m >> 3)) & 15; // 90 degrees clockwise


export class RotatePipe extends Event {
  static title = "WATER RECYCLER CLOG";
  static system = 2;
  static stat = "OXYGEN";
  static blurb = "Mineral buildup blocked the water recycler. Click pipes to rotate them and connect the inlet to the outlet.";
  static facts = [
    "Fun Fact: When water is removed from a waste stream, dissolved substances may remain behind. Repeated processing can increase their concentration until some minerals begin to precipitate out of solution.",
    "Fun Fact: Temperature changes can alter mineral solubility. For some salts, heating makes precipitation more likely, particularly in hot-water equipment and evaporation systems.",
    "Fun Fact: Pumps may need to work harder to move water through restricted passages."
  ];
  setup() {
    // Build the solution first: a path from the left column to the right.
    let row = randInt(0, ROWS - 1);
    this.inRow = row;
    const path = [];
    for (let col = 0; col < COLS; col++) {
      const target = randInt(0, ROWS - 1);
      path.push([col, row]);
      while (row !== target) {
        row += target > row ? 1 : -1;
        path.push([col, row]);
      }
    
    const rotatepipe_audio = new Audio('../../Elevenlabs/Audio/rotate_pipe.mp3');
    rotatepipe_audio.play();
    
    rotatepipe_audio.volume = 0.4;
    }
    this.outRow = row;

    this.tiles = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) this.tiles.push({ col: c, row: r, m: choice([N | S, N | E]), flow: false });
    }

    // Path tiles open toward the previous and next cell on the path.
    path.forEach(([c, r], i) => {
      const side = (other) => DIRS.find(([, dc, dr]) => c + dc === other[0] && r + dr === other[1])[0];
      const prev = i === 0 ? W : side(path[i - 1]);
      const next = i === path.length - 1 ? E : side(path[i + 1]);
      this.tile(c, r).m = prev | next;
    });

    // Scramble, but never hand the player an already solved board.
    for (const t of this.tiles) {
      for (let k = randInt(0, 3); k > 0; k--) t.m = turn(t.m);
    }
    while (this.checkFlow()) {
      const [c, r] = choice(path);
      this.tile(c, r).m = turn(this.tile(c, r).m);
    }
  }

  tile(c, r) {
    return this.tiles[r * COLS + c];
  }

  effects(dt) {
    this.g.damage("OXYGEN", 0.8 * this.g.sev() * dt);
  }

  rotate(t) {
    t.m = turn(t.m);
    if (this.checkFlow()) this.done = true;
  }

  // Follow the water from the inlet; mark every tile it reaches.
  checkFlow() {
    for (const t of this.tiles) t.flow = false;
    const start = this.tile(0, this.inRow);
    if (!(start.m & W)) return false;
    start.flow = true;
    const queue = [start];
    while (queue.length) {
      const t = queue.shift();
      for (const [d, dc, dr] of DIRS) {
        if (!(t.m & d)) continue;
        const c = t.col + dc, r = t.row + dr;
        if (c < 0 || c >= COLS || r < 0 || r >= ROWS) continue;
        const n = this.tile(c, r);
        if (!n.flow && n.m & opposite(d)) {
          n.flow = true;
          queue.push(n);
        }
      }
    }
    const end = this.tile(COLS - 1, this.outRow);
    return end.flow && (end.m & E) !== 0;
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    const size = Math.min((x1 - x0 - 80) / COLS, (y1 - y0 - 30) / ROWS, 80);
    const gx = (x0 + x1) / 2 - (size * COLS) / 2;
    const gy = y0 + 6;
    const pipe = Math.max(6, size / 6);

    // inlet and outlet stubs
    const inY = gy + (this.inRow + 0.5) * size, outY = gy + (this.outRow + 0.5) * size;
    c.line([gx - 30, inY, gx, inY], { fill: OK, width: pipe });
    c.text(gx - 15, inY - 16, "IN", { font: F(9), fill: OK });
    c.line([gx + COLS * size, outY, gx + COLS * size + 30, outY], { fill: DIM, width: pipe });
    c.text(gx + COLS * size + 15, outY - 16, "OUT", { font: F(9), fill: DIM });

    for (const t of this.tiles) {
      const tx = gx + t.col * size, ty = gy + t.row * size;
      const cx = tx + size / 2, cy = ty + size / 2;
      c.rect(tx, ty, tx + size, ty + size, { fill: "#000", outline: EDGE, width: 2 });
      const col = t.flow ? OK : ACC;
      if (t.m & N) c.line([cx, cy, cx, ty], { fill: col, width: pipe });
      if (t.m & E) c.line([cx, cy, tx + size, cy], { fill: col, width: pipe });
      if (t.m & S) c.line([cx, cy, cx, ty + size], { fill: col, width: pipe });
      if (t.m & W) c.line([cx, cy, tx, cy], { fill: col, width: pipe });
      this.g.zone([tx, ty, tx + size, ty + size], () => this.rotate(t));
    }
  }
}
