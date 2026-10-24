// Mouse and keyboard wiring. Coordinates are mapped back to the logical
// W x H canvas so the game works when the canvas is scaled by CSS.

import { W, H } from "./config.js";

export function bindInput(canvas, game) {
  const toGame = (e) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height)];
  };

  // move/up on window so drags keep tracking outside the canvas
  window.addEventListener("mousemove", (e) => {
    game.mouse = toGame(e);
  });
  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    game.press(...toGame(e));
  });
  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) game.release();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key.length === 1) game.key(e.key);
  });
}
