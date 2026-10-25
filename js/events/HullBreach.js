import { Event } from "./Event.js";
import { EDGE, BAD, WARN, DIM, ACC } from "../config.js";
import { F, rand, randInt, inrect, now } from "../utils.js";

const STEP = 6; // px between weld points along a seam
const REACH = 15; // torch radius that counts as "on the seam"
const FUSE = 0.06; // seconds the torch must linger on a point to fuse it
const COOL = 1.5; // seconds for a fresh bead to cool from white-hot to grey



// Jagged seam as offsets from its centre, resampled every STEP px.
function makeSeam() {
  const verts = [];
  let x = -45, y = rand(-18, 18);
  verts.push([x, y]);
  while (x < 45) {
    x = Math.min(45, x + rand(14, 24));
    y = Math.max(-26, Math.min(26, y + rand(-16, 16)));
    verts.push([x, y]);
  }
  const pts = [];
  for (let i = 1; i < verts.length; i++) {
    const [ax, ay] = verts[i - 1], [bx, by] = verts[i];
    const n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay) / STEP));
    for (let k = i === 1 ? 0 : 1; k <= n; k++) {
      pts.push({ ox: ax + ((bx - ax) * k) / n, oy: ay + ((by - ay) * k) / n, x: 0, y: 0, heat: 0, at: 0 });
    }
  }
  return pts;
}

function beadColour(age) {
  if (age < COOL * 0.25) return "#fff6c8";
  if (age < COOL * 0.6) return WARN;
  if (age < COOL) return ACC;
  return "#9a8f88";
}

export class HullBreach extends Event {
  static title = "HULL BREACH";
  static system = 0;
  static stat = "PRESSURE";
  static blurb = "Micrometeorite strike! HOLD the mouse and trace the welding torch slowly along each crack to seal it.";
  static facts = [
    "Fun Fact: Mars's atmosphere cannot replace the lost air. Mars's atmosphere is mostly carbon dioxide and is far too thin for humans to breathe.",
    "Fun Fact: A habitat can continuously monitor cabin pressure. An unexpected pressure decline can trigger alarms before the loss becomes obvious to the crew.",
    "Fun Fact: Multiple pressure-tight modules with isolating hatches can allow the crew to seal off a damaged compartment and preserve the atmosphere in other sections.",
    "Fun Fact: Falling pressure can interfere with temperature regulation, water handling, and equipment designed to operate at cabin pressure.",
    "Mars experiences substantial temperature variation. Repeated thermal expansion and contraction can contribute to material fatigue and seal degradation over time."
  ];
  setup() {
    this.cracks = [];
    while (this.cracks.length < 3) {
      const fx = rand(0.2, 0.8), fy = rand(0.15, 0.85);
      if (this.cracks.every((k) => Math.hypot((k.fx - fx) * 1.4, k.fy - fy) > 0.32)) {
        this.cracks.push({ fx, fy, pts: makeSeam(), sealed: false });
      }
    }
    this.sparks = [];
    this.gameRect = null;
    this.welding = false;

    const hullbreach_audio = new Audio('../../Elevenlabs/Audio/hull_breach.mp3');
    hullbreach_audio.play();
  }

  remaining() {
    let left = 0, total = 0;
    for (const k of this.cracks) {
      total += k.pts.length;
      left += k.pts.filter((p) => !p.at).length;
    }
    return left / total;
  }

  effects(dt) {
    this.g.damage("PRESSURE", 0.38 * 3 * this.remaining() * this.g.sev() * dt);
  }

  update(dt) {
    const m = this.g.mouse;
    this.welding = !!(this.visible && this.g.down && this.gameRect && inrect(m, this.gameRect));
    if (this.welding) {
      let hit = false;
      for (const k of this.cracks) {
        if (k.sealed) continue;
        for (const p of k.pts) {
          if (p.at || Math.hypot(m[0] - p.x, m[1] - p.y) > REACH) continue;
          hit = true;
          p.heat += dt;
          if (p.heat >= FUSE) p.at = now();
        }
        // a few stray points left at the tips shouldn't make the player hunt
        if (k.pts.filter((p) => !p.at).length <= 2) {
          for (const p of k.pts) p.at ||= now();
          k.sealed = true;
        }
      }
      for (let i = 0; i < (hit ? 4 : 1); i++) {
        const a = rand(0, Math.PI * 2), v = rand(40, hit ? 180 : 70);
        this.sparks.push({ x: m[0], y: m[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, life: rand(0.2, 0.5) });
      }
      if (this.cracks.every((k) => k.sealed)) this.done = true;
    }
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.vy += 300 * dt;
      s.life -= dt;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);
  }

  drawGame(c, r) {
    const [x0, y0, x1, y1] = r;
    const [ax0, ay0, ax1, ay1] = [x0 + 10, y0 + 6, x1 - 10, y1 - 26];
    this.gameRect = [ax0, ay0, ax1, ay1];
    c.rect(ax0, ay0, ax1, ay1, { fill: "#241812", outline: EDGE, width: 3 });
    for (let y = ay0 + 30; y < ay1; y += 40) c.line([ax0 + 4, y, ax1 - 4, y], { fill: "#2f2018" }); // hull plating

    const t = now();
    for (const k of this.cracks) {
      const cx = ax0 + 50 + k.fx * (ax1 - ax0 - 100);
      const cy = ay0 + 30 + k.fy * (ay1 - ay0 - 60);
      for (const p of k.pts) {
        p.x = cx + p.ox;
        p.y = cy + p.oy;
      }
      // open seam first, then the weld bead on top
      for (let i = 1; i < k.pts.length; i++) {
        const a = k.pts[i - 1], b = k.pts[i];
        if (!a.at || !b.at) c.line([a.x, a.y, b.x, b.y], { fill: BAD, width: 3 });
      }
      for (const p of k.pts) {
        if (!p.at) continue;
        c.oval(p.x - 4, p.y - 4, p.x + 4, p.y + 4, { fill: beadColour(t - p.at) });
      }
      if (!k.sealed) {
        const open = k.pts.filter((p) => !p.at);
        const mid = open[Math.floor(open.length / 2)];
        for (let i = 0; i < 3; i++) { // escaping air
          c.line([mid.x, mid.y, mid.x + randInt(-35, 35), mid.y + randInt(-35, 35)], { fill: "#bbb" });
        }
      }
    }

    for (const s of this.sparks) {
      c.line([s.x, s.y, s.x - s.vx * 0.03, s.y - s.vy * 0.03], { fill: s.life > 0.25 ? "#fff6c8" : WARN, width: 2 });
    }

    // torch tip follows the mouse inside the hull panel
    const m = this.g.mouse;
    if (inrect(m, this.gameRect)) {
      const [mx, my] = m;
      c.line([mx + 6, my + 6, mx + 26, my + 26], { fill: "#777", width: 6 });
      c.line([mx, my, mx + 8, my + 8], { fill: "#bbb", width: 3 });
      if (this.welding) c.oval(mx - 7, my - 7, mx + 7, my + 7, { fill: "#fff6c8", alpha: 0.85 });
      else c.oval(mx - REACH, my - REACH, mx + REACH, my + REACH, { outline: DIM });
    }

    const pct = Math.round((1 - this.remaining()) * 100);
    this.progressBar(c, x0 + 14, y1 - 22, x1 - 14, pct / 100, `WELD ${pct}%  ${this.cracks.filter((k) => k.sealed).length}/3 SEALED`);
  }
}
