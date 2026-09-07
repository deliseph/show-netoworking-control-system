// Shared figure shapes.
//
// Roughly a third of the explainers in this course are the same three pictures
// with different content: a chain of stages you step through, a set of options
// you compare, and a logarithmic ladder with a pointer on it. Writing each of
// those ninety times would produce ninety slightly different interactions,
// which is worse for a student than one interaction they learn once.
//
// So the shapes live here, and a module that wants one supplies only the
// content. Anything with a real mechanism to show is still hand drawn: these
// are for the figures whose subject is a relationship rather than a process.

import {
  figure, canvas, choice, slider, toggle, button, label, labelWrap, box, line,
  palette, alpha, roundRect, fitter, textWidth, wrapText, drawnSize, TEACH,
} from './anim-core.js';

// Height a wrapped block will occupy, measured before anything is drawn, so a
// panel can be sized to its text instead of the text being drawn twice.
const blockHeight = (g, text, max, opts = {}) => {
  const size = opts.size || 12;
  const step = Math.round(drawnSize(size) * 1.28);
  return Math.min(wrapText(g, text, max, opts).length, opts.maxLines || 4) * step;
};

// Colour by role, not by name. Every figure in the course uses the same four.
export const role = (p) => ({
  energy: p.amber,   // anything live, anything carrying power
  signal: p.cyan,    // signal, data, information
  safe: p.green,     // safe, earthed, verified, correct
  fault: p.red,      // a fault, a hazard, the wrong answer
});

/** Wrap a number the way a bench notebook would: 3 significant figures, no more. */
export const sig = (v, n = 3) => {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const mag = Math.floor(Math.log10(Math.abs(v)));
  const dp = Math.max(0, n - 1 - mag);
  const s = v.toFixed(Math.min(dp, 6));
  // Only trim zeros that are after a decimal point. Trimming them from an
  // integer turns 100 into 1, which is the kind of bug that silently makes
  // every number on the site wrong.
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
};

/** Engineering notation with the right prefix, which is how a value is spoken. */
export function eng(v, unit = '') {
  const a = Math.abs(v);
  const steps = [
    [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'],
  ];
  for (const [mul, pre] of steps) {
    if (a >= mul || mul === 1e-12) return `${sig(v / mul)} ${pre}${unit}`.trim();
  }
  return `${sig(v)} ${unit}`.trim();
}

// ---------------------------------------------------------------------------
// Chain: stages in order, one selected, its detail shown beneath.
//
// For anything whose subject is "this happens, then this, then this": a build
// order, a test sequence, a diagnostic method, a signal path. The interaction
// is stepping, because the point of these figures is that the order matters.
// ---------------------------------------------------------------------------

export function chain(host, {
  title, sub, note, stages, tag = 'Step', accent = 'signal',
  height = 300, footer,
}) {
  const { controls, stage, setNote } = figure(host, { title, sub, note });
  let i = 0;

  const prev = document.createElement('button');
  prev.className = 'ac ac-btn';
  prev.textContent = '← Back';
  const next = document.createElement('button');
  next.className = 'ac ac-btn';
  next.textContent = 'Next →';
  const pos = document.createElement('span');
  pos.className = 'ac ac-read';

  const go = (n) => {
    i = Math.max(0, Math.min(stages.length - 1, n));
    pos.textContent = `${tag} ${i + 1} of ${stages.length}`;
    prev.disabled = i === 0;
    next.disabled = i === stages.length - 1;
    if (stages[i].note) setNote(stages[i].note);
    cv.once();
  };
  prev.addEventListener('click', () => go(i - 1));
  next.addEventListener('click', () => go(i + 1));
  controls.append(prev, next, pos);

  // canvas() paints once while it is being constructed, which runs draw()
  // before `cv` exists. The fitter reads through a holder that is null for that
  // first frame, and its own guard skips it.
  let cvRef = null;
  const fit = fitter(() => cvRef);

  const cv = canvas(stage, {
    height, animated: false,
    draw(g, w, h) {
      const p = palette();
      const R = role(p);
      const A = R[accent];
      const pad = 10;
      const n = stages.length;
      // Below this width the row of boxes becomes unreadable, so it stacks.
      const cols = w < 520 ? Math.min(n, 4) : n;
      const rows = Math.ceil(n / cols);
      const bw = (w - pad * 2 - (cols - 1) * 6) / cols;
      const bh = 34;

      let y = pad;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const k = r * cols + c;
          if (k >= n) break;
          const x = pad + c * (bw + 6);
          const on = k === i;
          const done = k < i;
          box(g, x, y, bw, bh, {
            fill: on ? alpha(A, 0.22) : done ? alpha(p.muted, 0.1) : p.raised,
            stroke: on ? A : p.line, r: 7, lw: on ? 2 : 1,
          });
          label(g, String(k + 1), x + 12, y + bh / 2, {
            color: on ? A : p.muted, size: 12, weight: 700, align: 'center',
          });
          label(g, stages[k].name, x + 22, y + bh / 2, {
            color: on ? p.ink : p.ink2, size: 11, max: bw - 30,
          });
          // The arrow between stages: order is the whole subject here.
          if (c < cols - 1 && k < n - 1) {
            label(g, '›', x + bw + 3, y + bh / 2, { color: p.muted, size: 13, align: 'center' });
          }
        }
        y += bh + 8;
      }

      y += 6;
      const s = stages[i];
      const innerW = w - pad * 2 - 24;
      const bodyH = blockHeight(g, s.body, innerW, { size: 12, maxLines: 6 });
      const whyH = s.why ? blockHeight(g, s.why, innerW, { size: 11, maxLines: 4 }) + 8 : 0;
      const panelH = 20 + 20 + bodyH + whyH + 8;

      box(g, pad, y, w - pad * 2, panelH, {
        fill: alpha(A, 0.06), stroke: alpha(A, 0.35), r: 8,
      });
      let ty = y + 16;
      label(g, s.name, pad + 12, ty, { color: A, size: 13, weight: 700, max: innerW });
      ty += 20;
      ty += labelWrap(g, s.body, pad + 12, ty, {
        color: p.ink2, size: 12, max: innerW, maxLines: 6,
      });
      if (s.why) {
        ty += 8;
        labelWrap(g, s.why, pad + 12, ty, {
          color: p.muted, size: 11, max: innerW, maxLines: 4,
        });
      }
      ty = y + panelH;

      let bottom = ty + 10;
      if (footer) {
        labelWrap(g, footer, pad, bottom, { color: p.muted, size: 10.5, max: w - pad * 2, maxLines: 2 });
        bottom += 26;
      }
      fit(bottom);
    },
  });
  cvRef = cv;
  go(0);
}

// ---------------------------------------------------------------------------
// Compare: a set of things with the same fields, one selected.
//
// For "here are the six options and what each costs you". The interaction is
// selection, because the teaching point is always the trade-off between them
// rather than any one of them.
// ---------------------------------------------------------------------------

export function compare(host, {
  title, sub, note, items, fields, accent = 'signal', height = 320, footer,
}) {
  const { controls, stage, setNote } = figure(host, { title, sub, note });
  let sel = 0;

  controls.append(choice('Show', items.map((it, k) => [k, it.short || it.name]), {
    value: 0,
    on: (v) => { sel = Number(v); if (items[sel].note) setNote(items[sel].note); cv.once(); },
  }).node);

  let cvRef = null;
  const fit = fitter(() => cvRef);

  const cv = canvas(stage, {
    height, animated: false,
    draw(g, w, h) {
      const p = palette();
      const R = role(p);
      const pad = 10;
      const it = items[sel];
      const A = R[it.tone || accent];

      let y = pad + 4;
      label(g, it.name, pad, y + 8, { color: A, size: 15, weight: 700, max: w - pad * 2 });
      y += 26;
      if (it.line) {
        y += labelWrap(g, it.line, pad, y + 6, { color: p.ink2, size: 12, max: w - pad * 2, maxLines: 3 }) + 8;
      }

      // The field rows. A label column wide enough for the longest key, so the
      // values line up and can be read down rather than hunted for.
      const keyW = Math.min(
        Math.max(...fields.map((f) => textWidth(g, f.label, { size: 11, weight: 600 }))) + 14,
        Math.max(110, w * 0.36)
      );
      for (const f of fields) {
        const v = it[f.key];
        if (v == null) continue;
        const rowTop = y;
        label(g, f.label, pad, y + 10, { color: p.muted, size: 11, weight: 600, max: keyW - 10 });
        const used = labelWrap(g, String(v), pad + keyW, y + 10, {
          color: f.tone ? R[f.tone] : p.ink, size: 12, max: w - pad * 2 - keyW, maxLines: 4,
        });
        y += Math.max(used, 18) + 8;
        line(g, pad, rowTop - 4, w - pad, rowTop - 4, { color: alpha(p.line, 0.7), lw: 1 });
      }

      if (it.watch) {
        y += 4;
        const wW = w - pad * 2 - 40;
        const wH = blockHeight(g, it.watch, wW, { size: 11.5, maxLines: 4 });
        box(g, pad, y, w - pad * 2, wH + 20, {
          fill: alpha(p.red, 0.08), stroke: alpha(p.red, 0.4), r: 7,
        });
        label(g, '!', pad + 15, y + 18, { color: p.red, size: 15, weight: 800, align: 'center' });
        labelWrap(g, it.watch, pad + 30, y + 12, {
          color: p.ink2, size: 11.5, max: wW, maxLines: 4,
        });
        y += wH + 26;
      }

      if (footer) {
        y += 4;
        y += labelWrap(g, footer, pad, y + 8, { color: p.muted, size: 10.5, max: w - pad * 2, maxLines: 3 }) + 10;
      }
      fit(y + 6);
    },
  });
  cvRef = cv;
  if (items[0].note) setNote(items[0].note);
}

// ---------------------------------------------------------------------------
// Ladder: a logarithmic scale with named bands and a draggable pointer.
//
// For anything whose subject is "these things are all the same quantity, and
// they are orders of magnitude apart". A linear axis makes microvolts and
// kilovolts unplottable together, which is exactly the intuition being taught.
// ---------------------------------------------------------------------------

export function ladder(host, {
  title, sub, note, bands, unit, min, max, start, fmt = (v) => eng(v, unit),
  readout, height = 300, footer, sliderLabel = 'Value',
}) {
  const { controls, stage, setNote } = figure(host, { title, sub, note });
  const lo = Math.log10(min);
  const hi = Math.log10(max);
  let val = start;

  const sl = slider(sliderLabel, {
    min: 0, max: 1000, step: 1,
    value: Math.round(((Math.log10(start) - lo) / (hi - lo)) * 1000),
    fmt: (v) => fmt(10 ** (lo + (v / 1000) * (hi - lo))),
    on: (v) => {
      val = 10 ** (lo + (v / 1000) * (hi - lo));
      const b = bands.find((x) => val >= x.from && val < x.to);
      if (b && readout) setNote(readout(val, b));
      cv.once();
    },
  });
  controls.append(sl.node);

  let cvRef = null;
  const fit = fitter(() => cvRef);

  const cv = canvas(stage, {
    height, animated: false,
    draw(g, w, h) {
      const p = palette();
      const R = role(p);
      const pad = 10;
      const x0 = pad;
      const x1 = w - pad;
      const barTop = 46;
      const barH = 30;
      const at = (v) => x0 + ((Math.log10(v) - lo) / (hi - lo)) * (x1 - x0);

      // Bands, drawn as a continuous strip so the scale reads as one axis.
      for (const b of bands) {
        const a = Math.max(x0, at(Math.max(b.from, min)));
        const z = Math.min(x1, at(Math.min(b.to, max)));
        if (z <= a) continue;
        const c = R[b.tone] || p.muted;
        g.fillStyle = alpha(c, 0.2);
        g.fillRect(a, barTop, z - a, barH);
        line(g, a, barTop, a, barTop + barH, { color: alpha(c, 0.6), lw: 1 });
      }
      box(g, x0, barTop, x1 - x0, barH, { fill: 'transparent', stroke: p.line, r: 4 });

      // Decade ticks. Without them a log axis is a coloured stripe.
      for (let d = Math.ceil(lo); d <= Math.floor(hi); d++) {
        const x = at(10 ** d);
        line(g, x, barTop + barH, x, barTop + barH + 5, { color: p.muted, lw: 1 });
        label(g, eng(10 ** d, unit), x, barTop + barH + 14, {
          color: p.muted, size: 9.5, align: 'center', mono: true,
        });
      }

      // The pointer.
      const px = at(val);
      line(g, px, barTop - 12, px, barTop + barH + 2, { color: p.ink, lw: 2 });
      g.fillStyle = p.ink;
      g.beginPath();
      g.moveTo(px, barTop - 2);
      g.lineTo(px - 5, barTop - 12);
      g.lineTo(px + 5, barTop - 12);
      g.closePath();
      g.fill();

      const cur = bands.find((b) => val >= b.from && val < b.to) || bands[bands.length - 1];
      label(g, fmt(val), pad, 16, { color: p.ink, size: 15, weight: 700, mono: true });
      label(g, cur.name, pad, 32, { color: R[cur.tone] || p.ink2, size: 12, weight: 600, max: w - pad * 2 });

      // The legend doubles as the list of bands, which is the content.
      let y = barTop + barH + 32;
      for (const b of bands) {
        const on = b === cur;
        const c = R[b.tone] || p.muted;
        g.fillStyle = on ? c : alpha(c, 0.45);
        roundRect(g, pad, y - 4, 4, 14, 2);
        g.fill();
        label(g, b.name, pad + 12, y + 3, {
          color: on ? p.ink : p.ink2, size: 11.5, weight: on ? 700 : 500, max: w * 0.42,
        });
        const used = labelWrap(g, b.what, pad + Math.max(w * 0.44, 130), y + 3, {
          color: on ? p.ink2 : p.muted, size: 11, max: w - pad - Math.max(w * 0.44, 130), maxLines: 3,
        });
        y += Math.max(used, 16) + 6;
      }

      if (footer) {
        y += 4;
        y += labelWrap(g, footer, pad, y + 6, { color: p.muted, size: 10.5, max: w - pad * 2, maxLines: 3 }) + 8;
      }
      fit(y + 4);
    },
  });
  cvRef = cv;
  const b0 = bands.find((x) => start >= x.from && start < x.to);
  if (b0 && readout) setNote(readout(start, b0));
}

// ---------------------------------------------------------------------------
// Plot: y against x, with the curve recomputed from a control.
//
// For a characteristic: a diode curve, a transfer function, a response. The
// point of these is always that the curve is not a straight line, so the axes
// are drawn honestly and the reading at the cursor is printed.
// ---------------------------------------------------------------------------

export function plot(host, {
  title, sub, note, xLabel, yLabel, xMin, xMax, yMin, yMax, curves,
  controls: mk, cursor, height = 300, footer, grid = true,
}) {
  const { controls, stage, setNote } = figure(host, { title, sub, note });
  const state = {};
  if (mk) for (const c of mk(state, () => cv.once(), setNote)) controls.append(c);

  const cv = canvas(stage, {
    height, animated: false,
    draw(g, w, h) {
      const p = palette();
      const R = role(p);
      const L = 46, Rp = 12, T = 14, B = 34;
      const pw = w - L - Rp;
      const ph = h - T - B;
      const X = (v) => L + ((v - xMin) / (xMax - xMin)) * pw;
      const Y = (v) => T + ph - ((v - yMin) / (yMax - yMin)) * ph;

      if (grid) {
        for (let k = 0; k <= 4; k++) {
          const y = T + (k / 4) * ph;
          line(g, L, y, L + pw, y, { color: alpha(p.line, 0.8), lw: 1 });
          label(g, sig(yMax - (k / 4) * (yMax - yMin)), L - 6, y, {
            color: p.muted, size: 9.5, align: 'right', mono: true,
          });
          const x = L + (k / 4) * pw;
          line(g, x, T, x, T + ph, { color: alpha(p.line, 0.5), lw: 1 });
          label(g, sig(xMin + (k / 4) * (xMax - xMin)), x, T + ph + 12, {
            color: p.muted, size: 9.5, align: 'center', mono: true,
          });
        }
      }
      line(g, L, T + ph, L + pw, T + ph, { color: p.muted, lw: 1.5 });
      line(g, L, T, L, T + ph, { color: p.muted, lw: 1.5 });
      label(g, xLabel, L + pw, T + ph + 26, { color: p.ink2, size: 10.5, align: 'right' });
      label(g, yLabel, L - 40, T - 2, { color: p.ink2, size: 10.5 });

      for (const c of curves(state)) {
        const col = R[c.tone] || p.cyan;
        g.save();
        if (c.dash) g.setLineDash(c.dash);
        g.strokeStyle = col;
        g.lineWidth = c.lw || 2;
        g.beginPath();
        let started = false;
        const N = 240;
        for (let k = 0; k <= N; k++) {
          const x = xMin + (k / N) * (xMax - xMin);
          const y = c.f(x);
          if (!Number.isFinite(y)) { started = false; continue; }
          const py = Y(Math.max(yMin, Math.min(yMax, y)));
          if (!started) { g.moveTo(X(x), py); started = true; } else g.lineTo(X(x), py);
        }
        g.stroke();
        g.restore();
        if (c.label) {
          label(g, c.label, L + pw - 6, Y(Math.max(yMin, Math.min(yMax, c.f(xMax * 0.82)))) - 10, {
            color: col, size: 10.5, align: 'right', weight: 600,
          });
        }
      }

      if (cursor) {
        const cur = cursor(state);
        if (cur && Number.isFinite(cur.x) && Number.isFinite(cur.y)) {
          const cx = X(cur.x);
          const cy = Y(Math.max(yMin, Math.min(yMax, cur.y)));
          line(g, cx, T, cx, T + ph, { color: alpha(p.amber, 0.55), lw: 1, dash: [3, 3] });
          g.fillStyle = p.amber;
          g.beginPath();
          g.arc(cx, cy, 4.5, 0, Math.PI * 2);
          g.fill();
          if (cur.text) {
            const tw = textWidth(g, cur.text, { size: 11, weight: 600, mono: true }) + 12;
            const bx = Math.min(cx + 8, L + pw - tw);
            box(g, bx, cy - 24, tw, 18, { fill: p.raised, stroke: alpha(p.amber, 0.5), r: 5 });
            label(g, cur.text, bx + 6, cy - 15, { color: p.ink, size: 11, weight: 600, mono: true });
          }
        }
      }

      if (footer) labelWrap(g, footer, L, T + ph + 44, { color: p.muted, size: 10.5, max: pw, maxLines: 2 });
    },
  });
}

// ---------------------------------------------------------------------------
// Small drawing helpers shared by the hand-drawn mechanism figures.
// ---------------------------------------------------------------------------

/** A labelled terminal block: the recurring "box with a name" in every schematic. */
export function node(g, x, y, w, h, text, { fill, stroke, color, size = 11, r = 6, sub }) {
  box(g, x, y, w, h, { fill, stroke, r });
  if (sub) {
    label(g, text, x + w / 2, y + h / 2 - 7, { color, size, align: 'center', weight: 600, max: w - 8 });
    label(g, sub, x + w / 2, y + h / 2 + 8, { color, size: size - 1.5, align: 'center', max: w - 8 });
  } else {
    label(g, text, x + w / 2, y + h / 2, { color, size, align: 'center', weight: 600, max: w - 8 });
  }
}

/** An arrow, for a flow of current, signal or work. */
export function arrow(g, x1, y1, x2, y2, { color, lw = 2, head = 7, dash }) {
  line(g, x1, y1, x2, y2, { color, lw, dash });
  const a = Math.atan2(y2 - y1, x2 - x1);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x2, y2);
  g.lineTo(x2 - head * Math.cos(a - 0.42), y2 - head * Math.sin(a - 0.42));
  g.lineTo(x2 - head * Math.cos(a + 0.42), y2 - head * Math.sin(a + 0.42));
  g.closePath();
  g.fill();
}

/** Moving dots along a path, which is how every current in this course is drawn. */
export function flowDots(g, x1, y1, x2, y2, { color, t, speed = 1, count = 6, r = 2.6 }) {
  for (let k = 0; k < count; k++) {
    const u = ((t * speed + k / count) % 1);
    g.fillStyle = color;
    g.beginPath();
    g.arc(x1 + (x2 - x1) * u, y1 + (y2 - y1) * u, r, 0, Math.PI * 2);
    g.fill();
  }
}

/** A resistor drawn as a zigzag, because a rectangle reads as a box. */
export function resistorSym(g, x, y, w, h, color, lw = 2) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.beginPath();
  const seg = w / 7;
  g.moveTo(x, y);
  for (let k = 0; k < 6; k++) {
    g.lineTo(x + seg * (k + 0.5), y + (k % 2 === 0 ? -h / 2 : h / 2));
  }
  g.lineTo(x + w, y);
  g.stroke();
  g.restore();
}

/** A battery or supply symbol. */
export function supplySym(g, x, y, h, color, lw = 2) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = lw;
  g.beginPath();
  g.moveTo(x - 9, y - h / 2); g.lineTo(x + 9, y - h / 2);
  g.moveTo(x - 4, y); g.lineTo(x + 4, y);
  g.moveTo(x - 9, y + h / 2); g.lineTo(x + 9, y + h / 2);
  g.stroke();
  g.restore();
}

/** Ground: three shortening bars, the universal common reference. */
export function groundSym(g, x, y, color, lw = 2) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = lw;
  for (let k = 0; k < 3; k++) {
    const half = 9 - k * 3;
    g.beginPath();
    g.moveTo(x - half, y + k * 4);
    g.lineTo(x + half, y + k * 4);
    g.stroke();
  }
  g.restore();
}

/** A readout chip: the number a figure wants you to watch. */
export function readoutChip(g, x, y, text, value, { color, p, w = 96 }) {
  box(g, x, y, w, 34, { fill: p.raised, stroke: alpha(color, 0.45), r: 6 });
  label(g, text, x + 8, y + 11, { color: p.muted, size: 9.5, max: w - 16 });
  label(g, value, x + 8, y + 24, { color, size: 13, weight: 700, mono: true, max: w - 16 });
}

export { figure, canvas, choice, slider, toggle, button, label, labelWrap, box, line, palette, alpha, roundRect, fitter, textWidth, wrapText, drawnSize, TEACH };
