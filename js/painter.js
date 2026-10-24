// Thin wrapper over the 2D canvas context that mimics the Tk canvas calls
// the original game used (rectangles, ovals, lines, anchored/wrapped text).

const ANCHORS = {
  center: ["center", "middle"],
  nw: ["left", "top"],
  ne: ["right", "top"],
};

export class Painter {
  constructor(canvas, w, h) {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    this.ctx = canvas.getContext("2d");
    this.ctx.scale(dpr, dpr);
    this.w = w;
    this.h = h;
  }

  clear(bg) {
    this.ctx.fillStyle = bg;
    this.ctx.fillRect(0, 0, this.w, this.h);
  }

  paint({ fill, outline, width = 1, alpha = 1 }) {
    const ctx = this.ctx;
    ctx.globalAlpha = alpha;
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (outline) {
      ctx.strokeStyle = outline;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  rect(x0, y0, x1, y1, opts = {}) {
    this.ctx.beginPath();
    this.ctx.rect(x0, y0, x1 - x0, y1 - y0);
    this.paint(opts);
  }

  oval(x0, y0, x1, y1, opts = {}) {
    this.ctx.beginPath();
    this.ctx.ellipse((x0 + x1) / 2, (y0 + y1) / 2, Math.abs(x1 - x0) / 2, Math.abs(y1 - y0) / 2, 0, 0, Math.PI * 2);
    this.paint(opts);
  }

  // points: flat [x0, y0, x1, y1, ...]
  line(points, { fill = "#000", width = 1 } = {}) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0], points[1]);
    for (let i = 2; i < points.length; i += 2) ctx.lineTo(points[i], points[i + 1]);
    ctx.strokeStyle = fill;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  text(x, y, str, { font, fill = "#000", anchor = "center", width } = {}) {
    const ctx = this.ctx;
    const [align, baseline] = ANCHORS[anchor];
    ctx.font = font;
    ctx.fillStyle = fill;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    if (!width) {
      ctx.fillText(str, x, y);
      return;
    }
    const lineH = parseInt(font.match(/(\d+)px/)[1], 10) * 1.25;
    this.wrap(str, width).forEach((ln, i) => ctx.fillText(ln, x, y + i * lineH));
  }

  wrap(str, width) {
    const lines = [];
    let cur = "";
    for (const word of str.split(" ")) {
      const test = cur ? cur + " " + word : word;
      if (cur && this.ctx.measureText(test).width > width) {
        lines.push(cur);
        cur = word;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines;
  }
}
