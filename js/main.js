// MARS: NIGHT SHIFT
// A high-stress survival sim in the spirit of FNAF, set on Mars.
//
// You're alone in a habitat. Survive from 18:00 until sunrise at 06:00.
// Weather, equipment failures and suit leaks hit you at random. Every system
// lives on its own tab - an alert on a tab you're NOT looking at keeps hurting
// you until you switch over and fix it.
//
// Keys: 1-5 switch tabs, P pauses.

import { W, H } from "./config.js";
import { Painter } from "./painter.js";
import { Game } from "./game.js";
import { draw } from "./renderer.js";
import { bindInput } from "./input.js";
import { now } from "./utils.js";

const canvas = document.getElementById("game");
const game = new Game(new Painter(canvas, W, H));
bindInput(canvas, game);

let last = now();
function tick() {
  const t = now();
  const dt = Math.min(0.1, t - last);
  last = t;
  if (game.state === "play" && !game.paused) game.update(dt);
  draw(game);
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
