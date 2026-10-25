import { Event } from "./Event.js";
import { OK, BAD } from "../config.js";
import { F, randInt } from "../utils.js";



export class HeaterFail extends Event {
  static title = "HEATER BREAKERS TRIPPED";
  static system = 0;
  static stat = "HEAT";
  static blurb = "The habitat is freezing. Switch every breaker ON, but each switch also flips its neighbour. Think!";
  static facts = [
    "Fun Fact: Some surges last only microseconds or milliseconds. Even though they're extremely brief, they can deliver enough electrical energy to damage vulnerable components.",
    "Fun Fact: Ordinary circuit breakers are designed primarily to interrupt excessive current, not necessarily to clamp a very brief voltage spike. A Mars habitat would need appropriately coordinated protection.",
    "Fun Fact: NASA's 2024 Mars architecture review selected nuclear fission as the primary surface power-generation technology for its initial crewed Mars mission planning. Unlike solar arrays, a fission power system can provide continuous electricity regardless of sunlight and dust-storm conditions.",
  ];
  setup() {
    this.n = 6;
    this.st = Array(this.n).fill(true);
    const flips = randInt(3, 5);
    for (let i = 0; i < flips; i++) this.flip(Math.floor(Math.random() * this.n));
    if (this.st.every(Boolean)) this.flip(0);

    const heaterfail_audio = new Audio('../../Elevenlabs/Audio/heater_fail.mp3');
    heaterfail_audio.play();

    heaterfail_audio.volume = 0.8;
  }

  flip(i) {
    this.st[i] = !this.st[i];
    const j = i < this.n - 1 ? i + 1 : i - 1;
    this.st[j] = !this.st[j];
  }

  press(i) {
    this.flip(i);
    if (this.st.every(Boolean)) this.done = true;
  }

  effects(dt) {
    this.g.damage("HEAT", 0.8 * this.g.sev() * dt);
  }

  drawGame(c, r) {
    const [x0, y0, x1] = r;
    const bw = 62, gap = 10;
    const sx = (x0 + x1) / 2 - (this.n * bw + (this.n - 1) * gap) / 2;
    const top = y0 + 30;
    for (let i = 0; i < this.n; i++) {
      const bx = sx + i * (bw + gap);
      const on = this.st[i];
      const col = on ? OK : BAD;
      c.rect(bx, top, bx + bw, top + 120, { fill: "#000", outline: col, width: 2 });
      const hy = on ? top + 8 : top + 66;
      c.rect(bx + 8, hy, bx + bw - 8, hy + 46, { fill: col });
      c.text(bx + bw / 2, top + 138, on ? "ON" : "OFF", { font: F(10), fill: col });
      this.g.zone([bx, top, bx + bw, top + 120], () => this.press(i));
    }
  }
}
