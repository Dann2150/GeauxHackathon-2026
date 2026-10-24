// Game state and simulation. Drawing lives in renderer.js, input in input.js.

import { HOUR_SEC, HOURS, TXT, DIM, BAD, OK, ACC, PANEL, TABS, STAT_ORDER, DEATH_CAUSE } from "./config.js";
import { EVENT_TYPES } from "./events/index.js";
import { F, inrect, choice, rand } from "./utils.js";
import { beep } from "./audio.js";

export class Game {
  constructor(painter) {
    this.c = painter;
    this.mouse = [0, 0];
    this.down = false;
    this.btns = [];
    this.state = "title";
    this.paused = false;
    this.sol = 1;
    this.tab = 0;
    this.fixed = 0;
    this.events = [];
    this.log = [];
    this.cause = "";
    this.stats = {};
    this.t = 0;
    this.spawnT = 5;
  }

  // ---- input -----------------------------------------------------------
  press(x, y) {
    this.mouse = [x, y];
    this.down = true;
    for (let i = this.btns.length - 1; i >= 0; i--) {
      const [r, cb] = this.btns[i];
      if (inrect(this.mouse, r)) {
        cb();
        break;
      }
    }
  }

  release() {
    this.down = false;
    for (const ev of this.events) ev.release();
  }

  key(k) {
    if (this.state !== "play") return;
    if ("12345".includes(k)) this.tab = Number(k) - 1;
    else if (k.toLowerCase() === "p") this.paused = !this.paused;
  }

  // ---- state -----------------------------------------------------------
  newGame() {
    this.sol = 1;
    this.fixed = 0;
    this.stats = Object.fromEntries(STAT_ORDER.map((k) => [k, 100]));
    this.stats.RADIATION = 0;
    this.startSol();
  }

  nextSol() {
    this.sol += 1;
    for (const k of STAT_ORDER) { // resupply / repairs during the day
      if (k === "RADIATION") this.stats[k] = Math.max(0, this.stats[k] - 50);
      else this.stats[k] = Math.min(100, this.stats[k] + 50);
    }
    this.startSol();
  }

  startSol() {
    this.t = 0;
    this.spawnT = 6;
    this.events = [];
    this.log = [];
    this.tab = 0;
    this.paused = false;
    this.state = "play";
    this.say(`SOL ${this.sol} NIGHT SHIFT BEGINS. SURVIVE UNTIL 06:00.`, TXT);
  }

  say(msg, col = DIM) {
    this.log.push([msg, col]);
    this.log = this.log.slice(-5);
  }

  // ---- helpers for events ---------------------------------------------
  hourIdx() {
    return this.t / HOUR_SEC;
  }

  sev() {
    return 1 + 0.2 * (this.sol - 1) + 0.03 * this.hourIdx();
  }

  deadline() {
    return Math.max(14, 30 - 3 * (this.sol - 1) - 0.5 * this.hourIdx());
  }

  damage(stat, amt) {
    const v = this.stats[stat] + (stat === "RADIATION" ? amt : -amt);
    this.stats[stat] = Math.max(0, Math.min(100, v));
  }

  zone(r, cb) {
    this.btns.push([r, cb]);
  }

  btn(r, label, cb, col = ACC) {
    const hover = inrect(this.mouse, r);
    this.c.rect(...r, { fill: hover ? "#3a2016" : PANEL, outline: col, width: 2 });
    this.c.text((r[0] + r[2]) / 2, (r[1] + r[3]) / 2, label, { font: F(12), fill: col });
    this.btns.push([r, cb]);
  }

  // ---- simulation -----------------------------------------------------
  maxEvents() {
    const n = 2 + (this.hourIdx() >= 5 ? 1 : 0) + (this.sol > 1 ? 1 : 0);
    return Math.min(5, n);
  }

  spawn() {
    const active = new Set(this.events.map((e) => e.constructor));
    const pool = EVENT_TYPES.filter((T) => !active.has(T));
    if (pool.length && this.events.length < this.maxEvents()) {
      const Type = choice(pool);
      const ev = new Type(this);
      this.events.push(ev);
      this.say(`ALERT: ${ev.name} (${TABS[ev.system]})`, BAD);
      beep();
    }
    const base = Math.max(4.5, 15 - 0.6 * this.hourIdx() - 2 * (this.sol - 1));
    this.spawnT = base * rand(0.7, 1.3);
  }

  update(dt) {
    const st = this.stats;
    this.t += dt;
    const blackout = st.POWER <= 0;
    this.damage("POWER", 0.22 * dt * (1 + 0.1 * (this.sol - 1)));
    this.damage("RADIATION", -0.04 * dt);
    if (blackout) {
      this.damage("OXYGEN", 0.9 * dt);
      this.damage("HEAT", 0.9 * dt);
    } else {
      for (const k of ["OXYGEN", "HEAT", "PRESSURE", "SUIT"]) this.damage(k, -0.04 * dt);
    }

    this.spawnT -= dt;
    if (this.spawnT <= 0) this.spawn();

    for (const e of [...this.events]) {
      e.age += dt;
      e.effects(dt);
      e.update(dt);
      e.penT += dt;
      if (e.penT >= e.limit && !e.done) {
        e.penT = 0;
        this.damage(e.stat, 12);
        this.say(`${e.name} IGNORED TOO LONG! SEVERE DAMAGE.`, BAD);
        beep();
      }
      if (e.done) {
        this.events.splice(this.events.indexOf(e), 1);
        this.fixed += 1;
        this.damage(e.stat, -10);
        this.say(`RESOLVED: ${e.name}`, OK);
      }
    }

    for (const [k, cause] of Object.entries(DEATH_CAUSE)) {
      const lost = k === "RADIATION" ? st[k] >= 100 : st[k] <= 0;
      if (lost) {
        this.cause = cause;
        this.state = "dead";
        return;
      }
    }
    if (this.t >= HOURS * HOUR_SEC) this.state = "win";
  }
}
