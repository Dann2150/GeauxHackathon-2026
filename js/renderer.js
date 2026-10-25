// All screen drawing: title, HUD, tabs, event panel, log and overlays.

import { W, H, HOUR_SEC, HOURS, BG, MARS, PANEL, EDGE, TXT, DIM, OK, WARN, BAD, ACC, TABS, STAT_ORDER } from "./config.js";
import { F, blink, now, pad2 } from "./utils.js";

function clockText(t) {
  const hour = 18 + t / HOUR_SEC;
  return `${pad2(Math.floor(hour) % 24)}:${pad2(Math.floor((hour % 1) * 60))}`;
}

export function draw(g) {
  const c = g.c;
  c.ctx.canvas.style.cursor = ""; // rehides the cursor only while active

  // background picture, scaled to cover the screen, with a dark fallback
  c.rect(0, 0, W, H, { fill: "#1b133d" });
  if (BG.complete && BG.naturalWidth) {
    const s = Math.max(W / BG.naturalWidth, H / BG.naturalHeight);
    const dw = BG.naturalWidth * s, dh = BG.naturalHeight * s;
    c.ctx.drawImage(BG, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  g.btns = [];
  for (const e of g.events) e.visible = false;
  if (g.state === "title") return drawTitle(g);
  drawHud(g);
  drawTabs(g);
  drawPanel(g);
  drawLog(g);
  if (g.paused) {
    c.rect(0, 0, W, H, { fill: "#0b1028", alpha: 0.6 });
    c.text(W / 2, H / 2, "PAUSED", { font: F(40), fill: WARN });
  }
  if (g.state === "dead" || g.state === "win") {
    g.btns = [];
    drawOverlay(g);
  }
  if (g.paused || g.state === "dead" || g.state === "win") c.ctx.canvas.style.cursor = ""; // rehide cursor only while event is active
}

function drawTitle(g) {
  const c = g.c;
  for (let i = 0; i < 60; i++) {
    const x = (i * 173) % W, y = (i * 97) % 300;
    c.oval(x, y, x + 2, y + 2, { fill: "#c8cdf5" });
  }
  if (MARS.complete && MARS.naturalWidth) {
  const size = 240;                 
  const px = W / 2 - size / 2, py = 230;
  const iw = MARS.naturalWidth, ih = MARS.naturalHeight;
  // crop box around the planet (fractions of the image)
  const sx = 0.183 * iw, sy = 0.183 * ih, sw = 0.6 * iw, sh = 0.6 * ih;
  const ctx = c.ctx;
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, py + size / 2, size / 2, 0, Math.PI * 2); 
  ctx.clip();
  ctx.drawImage(MARS, sx, sy, sw, sh, px, py, size, size);
  ctx.restore();
} else {
  c.oval(W / 2 - 120, 230, W / 2 + 120, 470, { fill: "#5b3fa0" }); 
}

  c.text(W / 2, 90, "MARS: LIFE IN SPACE", { font: F(44), fill: ACC });
  c.text(W / 2, 140, "One habitat. One survivor. Zero margin for error.", { font: F(13), fill: TXT });
  const lines = [
    "Survive from 18:00 to 06:00 sunrise.",
    "Systems fail at random: weather, hull, power, air, suit, radiation.",
    "Each fix lives on its own tab. Flashing tab = something is dying.",
    "Ignore an alert too long and it does severe damage.",
    "Keys 1-5 switch tabs. P pauses.",
  ];
  lines.forEach((ln, i) => c.text(W / 2, 500 + i * 22, ln, { font: F(11), fill: TXT }));
  g.btn([W / 2 - 110, 620, W / 2 + 110, 668], "BEGIN SHIFT", () => g.newGame());
}

function gauge(g, x, y, w, label, val) {
  const c = g.c;
  const inverse = label === "RADIATION";
  const danger = inverse ? val > 70 : val < 25;
  const warn = inverse ? val > 40 : val < 50;
  const col = danger ? BAD : (warn ? WARN : OK);
  c.text(x, y, label, { anchor: "nw", font: F(9), fill: danger && blink() ? BAD : DIM });
  c.rect(x, y + 16, x + w, y + 32, { outline: EDGE });
  c.rect(x, y + 16, x + w * val / 100, y + 32, { fill: col });
  c.text(x + w, y, Math.floor(val) + "%", { anchor: "ne", font: F(9), fill: col });
}

function drawHud(g) {
  const c = g.c;
  c.text(20, 8, clockText(g.t), { anchor: "nw", font: F(30), fill: ACC });
  c.text(20, 50, `SOL ${g.sol}   FIXED ${g.fixed}`, { anchor: "nw", font: F(10), fill: DIM });
  c.rect(150, 14, 220, 20, { outline: EDGE });
  c.rect(150, 14, 150 + 70 * Math.min(1, g.t / (HOURS * HOUR_SEC)), 20, { fill: ACC });
  c.text(185, 26, "to sunrise", { font: F(8, false), fill: DIM });
  const gx = 250;
  const gw = (W - gx - 20 - 5 * 14) / 6;
  STAT_ORDER.forEach((k, i) => gauge(g, gx + i * (gw + 14), 14, gw, k, g.stats[k]));
  if (g.stats.POWER <= 0 && blink()) {
    c.text(W / 2 + 120, 62, "*** BLACKOUT: AIR AND HEAT FAILING ***", { font: F(11), fill: BAD });
  }
}

function drawTabs(g) {
  const c = g.c;
  const w = (W - 40 - 4 * 8) / 5;
  TABS.forEach((name, i) => {
    const x0 = 20 + i * (w + 8);
    const r = [x0, 88, x0 + w, 128];
    const n = g.events.filter((e) => e.system === i).length;
    const alarm = n > 0;
    const fill = alarm && blink(3) ? "#5a1010" : (i === g.tab ? EDGE : PANEL);
    c.rect(...r, { fill, outline: alarm ? BAD : (i === g.tab ? ACC : EDGE), width: 2 });
    const label = `${i + 1}  ${name}` + "  !".repeat(n);
    c.text((r[0] + r[2]) / 2, 108, label, { font: F(11), fill: alarm ? BAD : TXT });
    g.zone(r, () => { g.tab = i; });
  });
}

function drawPanel(g) {
  const c = g.c;
  const area = [20, 138, 980, 560];
  const evs = g.events.filter((e) => e.system === g.tab);
  if (!evs.length) {
    const [x0, y0, x1, y1] = area;
    c.rect(...area, { fill: PANEL, outline: EDGE, width: 2 });
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    for (const rad of [60, 110, 160]) c.oval(cx - rad, cy - rad, cx + rad, cy + rad, { outline: "#4ade80" });
    const a = now() * 1.6;
    c.line([cx, cy, cx + 160 * Math.cos(a), cy + 160 * Math.sin(a)], { fill: OK, width: 2 });
    c.text(cx, y0 + 30, TABS[g.tab] + ": ALL SYSTEMS NOMINAL", { font: F(16), fill: OK });
    c.text(cx, y1 - 28, "Stay alert. Check the other tabs.", { font: F(11, false), fill: DIM });
    return;
  }
  const wd = (area[2] - area[0]) / evs.length;
  evs.forEach((e, i) => {
    e.draw(c, [area[0] + i * wd + (i ? 4 : 0), area[1], area[0] + (i + 1) * wd, area[3]]);
  });
}

function drawLog(g) {
  const c = g.c;
  c.rect(20, 570, 980, 690, { fill: PANEL, outline: EDGE });

  const maxCharsPerLine = 110; 
  let currentY = 578;

  const maxTextWidth = 980 - 64;
  
  [...g.log].reverse().forEach(([msg], i) => {
    const fullMsg = "> " + msg;

    // Split the message into words and wrap them into separate lines
    const words = fullMsg.split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
      if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);

    const lineColor = (i===0)? "#a5b4fc" : TXT
    // Draw each line individually and advance the Y coordinate
    lines.forEach((line) => {
      // Stop drawing if we reach the bottom of the box
      if (currentY > 670) return;

      c.text(32, currentY, line, { 
        anchor: "nw", 
        font: F(10), 
        fill: lineColor
      });
      
      currentY += 18; // Space out each line vertically
    });
  });
}

function drawOverlay(g) {
  const c = g.c;
  c.rect(0, 0, W, H, { fill: "#000", alpha: 0.5 });
  if (g.state === "dead") {
    c.text(W / 2, 250, "YOU DIED ON MARS", { font: F(40), fill: BAD });
    c.text(W / 2, 320, g.cause, { font: F(13), fill: TXT });
    c.text(W / 2, 355, `Reached sol ${g.sol}, ${clockText(g.t)}.  Problems fixed: ${g.fixed}`,
      { font: F(11, false), fill: DIM });
    g.btn([W / 2 - 110, 400, W / 2 + 110, 448], "TRY AGAIN", () => g.newGame());
  } else {
    c.text(W / 2, 250, "06:00 - SUNRISE", { font: F(40), fill: OK });
    c.text(W / 2, 320, `Sol ${g.sol} survived. Problems fixed: ${g.fixed}`, { font: F(13), fill: TXT });
    c.text(W / 2, 355, "The next night will be worse.", { font: F(11, false), fill: DIM });
    g.btn([W / 2 - 110, 400, W / 2 + 110, 448], "NEXT SOL", () => g.nextSol(), OK);
  }
}