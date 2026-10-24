// Small helpers shared by the game and the events.

// Font in the style of the original Tk version (point size -> px).
export function F(size, bold = true) {
  return `${bold ? "bold " : ""}${Math.round(size * 1.33)}px "Courier New", Courier, monospace`;
}

export function inrect(p, r) {
  return r[0] <= p[0] && p[0] <= r[2] && r[1] <= p[1] && p[1] <= r[3];
}

export function now() {
  return performance.now() / 1000;
}

export function blink(rate = 4) {
  return Math.floor(now() * rate) % 2 === 0;
}

export function rand(a, b) {
  return a + Math.random() * (b - a);
}

export function randInt(a, b) {
  return a + Math.floor(Math.random() * (b - a + 1));
}

export function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function sample(arr, k) {
  return shuffle([...arr]).slice(0, k);
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

export function pad2(n) {
  return String(n).padStart(2, "0");
}
