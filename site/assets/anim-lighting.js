// Session 6: DMX512-A, RDM, RDMnet and sACN. The E1 family, end to end.

import { register } from './anim-core.js';
import {
  figure, canvas, slider, toggle, choice, button, label, labelWrap, box, line,
  palette, alpha, fitter, compare, chain, role, node, arrow, flowDots, eng, sig,
} from './anim-kit.js';

register('dmx-packet', (host) => {
  let channels = 512;
  let showTiming = true;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'A DMX packet, to scale',
    sub: 'Reduce the channel count and watch the refresh rate rise. It is a real effect, not a curiosity.',
    note: '',
  });

  const slotUs = 44;
  const packetUs = () => 92 + 12 + (channels + 1) * slotUs;

  const upd = () => {
    const us = packetUs();
    const hz = 1e6 / us;
    setNote(channels === 512
      ? `A full universe: break, mark, start code and 512 slots, ${sig(us / 1000)} ms, so about ${sig(hz)} Hz. <b>There is no error detection of any kind in this. The protocol\'s entire reliability comes from sending the complete picture again 22.7 ms later, which is why DMX faults present as flicker rather than as errors.</b>`
      : `${channels} channels takes ${sig(us / 1000)} ms, so ${sig(hz)} Hz, which is ${sig(hz / (1e6 / (92 + 12 + 513 * slotUs)))} times faster than a full universe. <b>That is a visible difference on a fast moving-light chase, and it is why some consoles offer a channel limit and why it is worth using.</b>`);
    cv.once();
  };

  controls.append(slider('Channels sent', {
    min: 16, max: 512, step: 16, value: 512, on: (v) => { channels = v; upd(); },
  }).node);
  controls.append(toggle('Show the timing', { value: true, on: (v) => { showTiming = v; upd(); } }).node);

  challenge('Get the refresh rate above 100 Hz.', () => 1e6 / packetUs() > 100);

  const cv = canvas(stage, {
    height: 300, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const us = packetUs();
      const hz = 1e6 / us;

      // The waveform: break, MAB, start code, then slots.
      const gy = 96, gh = 46;
      const hi = gy, lo = gy + gh;
      const gw = w - pad * 2;
      const scale = gw / us;

      g.strokeStyle = R.signal;
      g.lineWidth = 2.5;
      g.beginPath();
      let x = pad;
      g.moveTo(x, hi);
      // Break: low for 92 µs.
      g.lineTo(x, lo);
      g.lineTo(x + 92 * scale, lo);
      x += 92 * scale;
      // Mark after break.
      g.lineTo(x, hi);
      g.lineTo(x + 12 * scale, hi);
      x += 12 * scale;
      // Slots.
      //
      // At a full universe one slot is 44 µs out of 22,700, so under two pixels
      // wide. Drawing 513 individual pulses at that size produces a solid black
      // rectangle that reads as a filled block rather than as data, so below
      // about five pixels a slot the run is drawn as a hatched band with its
      // arithmetic inside it instead. Above that, real pulses.
      const slotW = slotUs * scale;
      const slotsX0 = x;
      let detail = 0;
      if (slotW >= 5) {
        detail = Math.min(channels + 1, Math.floor((pad + gw - x) / slotW));
        for (let i = 0; i < detail; i++) {
          g.lineTo(x, lo); g.lineTo(x + slotW * 0.35, lo);
          g.lineTo(x + slotW * 0.35, hi); g.lineTo(x + slotW, hi);
          x += slotW;
        }
      }
      g.lineTo(pad + gw, hi);
      g.stroke();

      const remaining = channels + 1 - detail;
      if (remaining > 0) {
        const bx0 = x, bwid = pad + gw - x;
        box(g, bx0, gy + 5, bwid, gh - 10, {
          fill: alpha(R.signal, 0.16), stroke: alpha(R.signal, 0.55), r: 3,
        });
        // A hatch, so the band reads as many things rather than as one thing.
        g.save();
        g.beginPath(); g.rect(bx0, gy + 5, bwid, gh - 10); g.clip();
        g.strokeStyle = alpha(R.signal, 0.3);
        g.lineWidth = 1;
        for (let hxp = bx0; hxp < bx0 + bwid; hxp += 5) {
          g.beginPath(); g.moveTo(hxp, gy + 5); g.lineTo(hxp - 8, gy + gh - 5); g.stroke();
        }
        g.restore();
        label(g, `${remaining} slots × 44 µs`, bx0 + bwid / 2, gy + gh / 2, {
          color: p.ink, size: 11, align: 'center', weight: 600, mono: true, max: bwid - 10,
        });
      }
      // The slots caption sits over the band it describes, not up with the
      // staggered break and mark labels, which is where it used to collide.
      label(g, detail ? 'slots, one byte each' : 'the slots, too narrow to draw individually',
        slotsX0 + 2, gy + gh + 16, { color: p.ink2, size: 9.5, max: pad + gw - slotsX0 - 4 });

      // Region labels.
      //
      // At a full universe the break is 92 µs out of 22,700, so about four
      // pixels wide, and three labels anchored inside their own regions would
      // overprint each other. Stagger them above the trace on leader lines,
      // which is what an annotated scope screenshot does anyway.
      const regions = [
        ['break', pad, 92 * scale, R.fault, '\u2265 92 \u00b5s'],
        ['mark after break', pad + 92 * scale, 12 * scale, R.energy, '\u2265 12 \u00b5s'],
        ['start code', pad + 104 * scale, slotW, R.safe, '0x00'],
      ];
      const LEAD = [58, 40, 22];
      regions.forEach(([nm, rx, rw, col, sub], k) => {
        const wide = rw > 60;
        // The dashed rule down the region boundary, always.
        line(g, rx, gy - 8, rx, lo + 8, { color: alpha(col, 0.7), lw: 1, dash: [3, 3] });
        if (wide) {
          label(g, nm, rx + rw / 2, gy - 16, { color: col, size: 9.5, align: 'center', max: rw });
          if (showTiming) {
            label(g, sub, rx + rw / 2, lo + 32, { color: p.muted, size: 8.5, align: 'center', mono: true, max: rw + 20 });
          }
        } else {
          // Too narrow to label in place: leader up to a staggered caption.
          const ly = gy - LEAD[k];
          line(g, rx, ly + 4, rx, gy - 8, { color: alpha(col, 0.55), lw: 1 });
          label(g, showTiming ? `${nm}  ${sub}` : nm, rx + 5, ly, {
            color: col, size: 9.5, max: gw - (rx - pad) - 10,
          });
        }
      });


      // The numbers.
      const rows = [
        ['One bit', '4 µs', 'at 250 kbit/s'],
        ['One slot, with framing', `${slotUs} µs`, '11 bit times'],
        ['Break, minimum', '92 µs', 'longer than any valid byte, so it cannot be mistaken for data'],
        ['Mark after break, minimum', '12 µs', ''],
        ['This packet', `${sig(us / 1000)} ms`, `${channels} channels plus the start code`],
        ['Refresh rate', `${sig(hz)} Hz`, channels === 512 ? 'the familiar 44 Hz' : `${sig(hz / (1e6 / (92 + 12 + 513 * slotUs)))}× a full universe`],
      ];
      let y = lo + 58;
      const keyW = Math.min(190, w * 0.4);
      const valW = 70;
      for (const [k, v, note] of rows) {
        label(g, k, pad, y, { color: p.muted, size: 10.5, max: keyW - 8 });
        label(g, v, pad + keyW, y, { color: p.ink, size: 11, weight: 600, mono: true, max: valW });
        if (note) label(g, note, pad + keyW + valW, y, { color: p.muted, size: 10, max: w - pad * 2 - keyW - valW });
        y += 19;
      }
    },
  });
  upd();
});

register('dmx-footprint', (host) => {
  let footprint = 16;
  let stride = 20;
  let count = 24;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Addressing a rig, and what a gap is worth',
    sub: 'Next address is this address plus the footprint, not plus one. Then decide whether to pack it tight.',
    note: '',
  });

  const realStride = () => Math.max(footprint, stride);

  const upd = () => {
    const st = realStride();
    const per = Math.floor(512 / st);
    const unis = Math.ceil(count / per);
    setNote(st === footprint
      ? `Packed tight: ${per} fixtures per universe and ${unis} universe${unis > 1 ? 's' : ''} in total. It fits, and <b>the first fixture swapped for a larger one repatches everything after it.</b> That is an afternoon on a ladder, and it is bought back by a few wasted channels.`
      : `A stride of ${st} leaves ${st - footprint} spare channels per fixture, so ${per} per universe and ${unis} universe${unis > 1 ? 's' : ''}. <b>A fixture can now be replaced with a larger one without moving anything else, which is the cheapest resilience in a lighting design and it costs ${(st - footprint) * per} channels per universe.</b>`);
    cv.once();
  };

  controls.append(slider('Footprint', { min: 3, max: 64, step: 1, value: 16, fmt: (v) => `${v} ch`, on: (v) => { footprint = v; upd(); } }).node);
  controls.append(slider('Stride', { min: 3, max: 80, step: 1, value: 20, fmt: (v) => `${v} ch`, on: (v) => { stride = v; upd(); } }).node);
  controls.append(slider('Fixtures', { min: 4, max: 60, step: 1, value: 24, on: (v) => { count = v; upd(); } }).node);

  challenge('Leave at least four spare channels per fixture.', () => realStride() - footprint >= 4);

  const cv = canvas(stage, {
    height: 292, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const st = realStride();
      const per = Math.floor(512 / st);
      const unis = Math.ceil(count / per);

      // One universe drawn as 512 channels.
      const uy = 48, uh = 40;
      const uw = w - pad * 2;
      const chW = uw / 512;
      box(g, pad, uy, uw, uh, { fill: alpha(p.line, 0.25), stroke: p.line, r: 6 });
      label(g, 'universe 1 · 512 channels', pad, uy - 10, { color: p.muted, size: 10 });

      let addr = 1, n = 0;
      while (addr + st - 1 <= 512 && n < count) {
        const x = pad + (addr - 1) * chW;
        box(g, x, uy + 4, footprint * chW - 0.5, uh - 8, {
          fill: alpha(R.energy, 0.4), stroke: 'transparent', r: 2,
        });
        if (st > footprint) {
          box(g, x + footprint * chW, uy + 4, (st - footprint) * chW - 0.5, uh - 8, {
            fill: alpha(R.safe, 0.16), stroke: 'transparent', r: 2,
          });
        }
        addr += st; n++;
      }
      const usedCh = n * footprint;
      const gapCh = n * (st - footprint);
      const leftover = 512 - n * st;
      if (leftover > 0) {
        label(g, `${leftover} left`, pad + uw - 4, uy + uh / 2, {
          color: p.muted, size: 9.5, align: 'right', max: 70,
        });
      }

      // The address list.
      const ly = uy + uh + 24;
      label(g, 'first six addresses', pad, ly, { color: p.muted, size: 10, weight: 600 });
      const addrs = [];
      let a = 1;
      for (let i = 0; i < 6 && i < count; i++) { addrs.push(a); a += st; }
      addrs.forEach((v, i) => {
        const bw = Math.min(78, (w - pad * 2) / 6 - 4);
        const x = pad + i * (bw + 4);
        box(g, x, ly + 10, bw, 30, { fill: alpha(R.energy, 0.12), stroke: alpha(R.energy, 0.5), r: 5 });
        label(g, String(v), x + bw / 2, ly + 20, { color: p.ink, size: 12, align: 'center', weight: 700, mono: true, max: bw - 6 });
        label(g, `${v}–${v + footprint - 1}`, x + bw / 2, ly + 34, { color: p.muted, size: 8.5, align: 'center', mono: true, max: bw - 6 });
      });

      // Numbers.
      const rows = [
        ['Stride used', `${st}`, st === footprint ? 'packed tight' : `${st - footprint} spare per fixture`],
        ['Fixtures per universe', `${per}`, ''],
        ['Universes needed', `${unis}`, `for ${count} fixtures`],
        ['Channels used per universe', `${usedCh}`, `${sig((usedCh / 512) * 100)}% of 512`],
        ['Channels held as gaps', `${gapCh}`, gapCh ? 'the price of being able to swap a fixture' : ''],
      ];
      let y = ly + 62;
      const keyW = Math.min(200, w * 0.44);
      for (const [k, v, note] of rows) {
        label(g, k, pad, y, { color: p.muted, size: 10.5, max: keyW - 8 });
        label(g, v, pad + keyW, y, { color: p.ink, size: 11, weight: 600, mono: true, max: 50 });
        if (note) label(g, note, pad + keyW + 50, y, { color: p.muted, size: 10, max: w - pad * 2 - keyW - 50 });
        y += 18;
      }
    },
  });
  upd();
});

register('dmx-topology', (host) => {
  let topo = 'chain';
  let terminated = true;
  let extra = 0;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Daisy chain, terminator, and the reflection',
    sub: 'Break the topology and watch what comes back down the cable at you.',
    note: '',
  });

  const bad = () => topo === 'star' || !terminated;

  const upd = () => {
    setNote(topo === 'star'
      ? 'A star creates a stub at every branch, and every stub reflects. A passive Y-splitter is a star. <b>To split, use an active splitter, which receives the signal and regenerates it onto several isolated outputs.</b>'
      : !terminated
        ? `Without a terminator the reflection is <b>present</b> and merely small enough to survive today. Add ${extra ? `the ${extra} m you just added, ` : ''}a fixture, a warm evening, and it becomes intermittent flicker somewhere apparently unrelated to what you changed. <b>Termination is not about whether it works now: it is about whether it still works in three weeks with a different rig on the end.</b>`
        : `A clean daisy chain with 120 Ω across the data pair at the far end. The signal is absorbed rather than reflected, and the edges stay square all the way down the line. <b>Move the run and the terminator moves with it: leaving it at the old far end is the commonest version of this fault.</b>`);
    cv.once();
  };

  controls.append(choice('Topology', [['chain', 'Daisy chain'], ['star', 'Star / Y-split']], {
    value: 'chain', on: (v) => { topo = v; upd(); },
  }).node);
  controls.append(toggle('Terminated at the far end', { value: true, on: (v) => { terminated = v; upd(); } }).node);
  controls.append(slider('Extra cable added', { min: 0, max: 60, step: 10, value: 0, fmt: (v) => `${v} m`, on: (v) => { extra = v; upd(); } }).node);

  challenge('Produce a reflection, then make it worse.', () => bad() && extra > 0);

  const cv = canvas(stage, {
    height: 270,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const y = 66;

      // Console.
      box(g, pad, y - 16, 70, 32, { fill: alpha(R.energy, 0.18), stroke: R.energy, r: 6 });
      label(g, 'console', pad + 35, y, { color: R.energy, size: 10, align: 'center', weight: 700 });

      if (topo === 'chain') {
        const N = 5;
        const x0 = pad + 78, x1 = w - pad - 46;
        const step = (x1 - x0) / N;
        line(g, pad + 70, y, x1, y, { color: R.signal, lw: 2 });
        flowDots(g, pad + 70, y, x1, y, { color: R.signal, t, speed: 1.4, count: 6, r: 2.4 });
        for (let i = 0; i < N; i++) {
          const x = x0 + i * step;
          box(g, x - 14, y - 13, 28, 26, { fill: p.raised, stroke: p.line, r: 4 });
          label(g, String(i + 1), x, y, { color: p.ink2, size: 10, align: 'center', weight: 600 });
        }
        // Terminator or not.
        if (terminated) {
          box(g, x1, y - 12, 34, 24, { fill: alpha(R.safe, 0.2), stroke: R.safe, r: 4 });
          label(g, '120Ω', x1 + 17, y, { color: R.safe, size: 9, align: 'center', weight: 700 });
        } else {
          label(g, 'open', x1 + 17, y, { color: R.fault, size: 10, align: 'center', weight: 700 });
          // Reflection travelling back.
          flowDots(g, x1, y + 16, pad + 70, y + 16, { color: R.fault, t, speed: 1.0, count: 5, r: 2.2 });
          label(g, 'reflection, coming back at you', pad + 80, y + 30, { color: R.fault, size: 10, max: w - pad * 2 - 90 });
        }
      } else {
        // A star: three stubs off one point.
        const jx = pad + 120;
        line(g, pad + 70, y, jx, y, { color: R.signal, lw: 2 });
        g.fillStyle = R.fault;
        g.beginPath(); g.arc(jx, y, 4, 0, Math.PI * 2); g.fill();
        label(g, 'passive Y', jx, y - 16, { color: R.fault, size: 9.5, align: 'center' });
        const ends = [[w - pad - 40, y - 40], [w - pad - 40, y], [w - pad - 40, y + 40]];
        ends.forEach(([ex, ey], i) => {
          line(g, jx, y, ex, ey, { color: R.signal, lw: 2 });
          box(g, ex, ey - 13, 30, 26, { fill: p.raised, stroke: p.line, r: 4 });
          label(g, String(i + 1), ex + 15, ey, { color: p.ink2, size: 10, align: 'center', weight: 600 });
          flowDots(g, ex, ey, jx, y, { color: R.fault, t, speed: 0.9, count: 3, r: 2 });
        });
        label(g, 'every branch is a stub, and every stub reflects', pad, y + 74, {
          color: R.fault, size: 11, max: w - pad * 2,
        });
      }

      // The scope trace.
      const sy = 156, sh = 60;
      box(g, pad, sy, w - pad * 2, sh, { fill: alpha(p.line, 0.22), stroke: p.line, r: 6 });
      label(g, 'at the far end, on a scope', pad + 6, sy - 8, { color: p.muted, size: 9.5 });
      g.save();
      g.beginPath(); g.rect(pad, sy, w - pad * 2, sh); g.clip();
      g.strokeStyle = bad() ? R.fault : R.safe;
      g.lineWidth = 2;
      g.beginPath();
      const x0 = pad + 6, x1 = w - pad - 6;
      const mid = sy + sh / 2;
      const ring = bad() ? 1 + extra / 40 : 0;
      for (let x = x0; x <= x1; x += 1.2) {
        const ph = ((x - x0) / (x1 - x0)) * 6;
        const sq = Math.sin(ph * Math.PI) > 0 ? 1 : -1;
        const since = (ph % 1);
        const r = ring * 16 * Math.exp(-since * 5) * Math.sin(since * 34);
        const yy = mid - sq * 18 - r;
        if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
      g.stroke();
      g.restore();

      label(g, bad()
        ? `Ringing after every edge${extra ? `, worse now that ${extra} m has been added` : ''}. It works until it does not.`
        : 'Square edges all the way down the line. The terminator absorbed the signal rather than reflecting it.',
      pad, sy + sh + 18, { color: bad() ? R.fault : R.safe, size: 11, weight: 600, max: w - pad * 2 });
      label(g, 'DMX cable is 110 Ω; the terminator is 120 Ω across the data pair. 32 unit loads and about 300 m per segment.',
        pad, sy + sh + 38, { color: p.muted, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});

register('startcode', (host) => compare(host, {
  title: 'Start codes: what the 512 bytes actually mean',
  sub: 'The byte after the mark tells a receiver how to read everything that follows.',
  accent: 'signal',
  fields: [
    { key: 'code', label: 'Value' },
    { key: 'means', label: 'What follows' },
    { key: 'where', label: 'Where you meet it' },
  ],
  items: [
    {
      name: 'Null start code', short: '0x00', tone: 'safe',
      line: 'Ordinary dimmer data. The one everything sends by default.',
      code: '<code>0x00</code>',
      means: 'Up to 512 slot values, 0 to 255 each',
      where: 'Everything, all the time',
      note: 'This is the only start code most rigs ever carry. <b>A device must ignore any start code it does not understand, and a fixture that misbehaves when other start codes are present has a firmware bug.</b>',
    },
    {
      name: 'RDM', short: '0xCC', tone: 'energy',
      line: 'A device management message, sharing the line with the lighting data.',
      code: '<code>0xCC</code>',
      means: 'An RDM message: UID, parameter ID, data, checksum',
      where: 'Every RDM discovery, get and set',
      note: 'RDM traffic occupies the same line and the same time budget as the DMX. <b>Discover during the rig check, not during the show, and if a rig behaves strangely after you enable RDM, the first thing to try is turning it off.</b>',
    },
    {
      name: 'Per-address priority', short: '0xDD', tone: 'signal',
      line: 'An optional part of sACN, carrying a priority for each slot rather than for the whole universe.',
      code: '<code>0xDD</code>',
      means: '512 priority values, one per slot',
      where: 'sACN systems that need channel-level merging control',
      note: 'Powerful and less widely supported than the universe-level priority. <b>Check it on the actual kit before you design around it.</b>',
    },
    {
      name: 'Text', short: '0x17', tone: 'signal',
      line: 'ASCII text in the packet, occasionally used by test equipment.',
      code: '<code>0x17</code>',
      means: 'A page number, a character count, then ASCII',
      where: 'Rare. Some test gear',
      note: 'Mostly worth recognising so that it is not a mystery when a tool shows it. <b>Nothing in a normal rig sends this.</b>',
    },
    {
      name: 'Manufacturer specific', short: 'Vendor', tone: 'fault',
      line: 'A vendor\'s own extension, in a reserved range.',
      code: 'various',
      means: 'Whatever that manufacturer decided',
      where: 'Proprietary features on specific product families',
      note: 'These are why the "ignore what you do not understand" rule exists. <b>A device that reacts to somebody else\'s vendor start code is the reason a rig from two manufacturers occasionally does something inexplicable.</b>',
    },
  ],
  footer: 'The start code is the first of the Five Questions being answered: it tells you what kind of message this is.',
}));

register('rdm-discovery', (host) => {
  let step = 0;
  const MAX_STEP = 6;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Discovery by halving',
    sub: 'The controller has no idea what is out there. Watch it find three devices in a 48-bit space by asking better questions.',
    note: '',
  });

  // Three devices, positioned in a normalised 0..1 UID space.
  const DEVS = [0.18, 0.34, 0.79];

  // Each step narrows a range. This is the sequence the figure walks.
  const RANGES = [
    { lo: 0, hi: 1, label: 'everyone' },
    { lo: 0, hi: 0.5, label: 'the lower half' },
    { lo: 0, hi: 0.25, label: 'the lower quarter' },
    { lo: 0.25, hi: 0.5, label: 'the second quarter' },
    { lo: 0.5, hi: 1, label: 'the upper half' },
    { lo: 0.5, hi: 0.75, label: 'the third quarter' },
    { lo: 0.75, hi: 1, label: 'the fourth quarter' },
  ];

  const inRange = (r) => DEVS.filter((d) => d >= r.lo && d < r.hi).length;

  const upd = () => {
    const r = RANGES[step];
    const n = inRange(r);
    setNote(n > 1
      ? `Asking ${r.label}: ${n} devices reply at once, they collide, and the answer is garbled. <b>The controller cannot read it, so it halves the range and asks each half separately. A collision is not a failure here: it is information.</b>`
      : n === 1
        ? `Exactly one device replies, cleanly. The controller records its UID and <b>mutes</b> it so it stops answering, then carries on searching the rest. <b>That muting is what makes the search terminate.</b>`
        : `Nothing replies, so this range is empty and the controller discards it without searching inside it. <b>An empty answer eliminates half the remaining space in one message, which is why a binary search over 48 bits finishes at all.</b>`);
    cv.once();
  };

  const prev = button('← Back', () => { step = Math.max(0, step - 1); upd(); });
  const next = button('Next →', () => { step = Math.min(MAX_STEP, step + 1); upd(); });
  controls.append(prev.node, next.node);

  challenge('Reach a step where exactly one device replies cleanly.', () => inRange(RANGES[step]) === 1);

  const cv = canvas(stage, {
    height: 292, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const r = RANGES[step];
      const n = inRange(r);
      const bx = pad, bw = w - pad * 2, by = 62, bh = 44;

      label(g, `Step ${step + 1}: "everyone whose UID is in ${r.label}, reply"`, pad, 24, {
        color: p.ink, size: 12, weight: 600, max: bw,
      });
      label(g, 'the 48-bit UID space, as one bar', pad, 48, { color: p.muted, size: 9.5 });

      box(g, bx, by, bw, bh, { fill: alpha(p.line, 0.25), stroke: p.line, r: 6 });
      // The asked range.
      box(g, bx + r.lo * bw, by, (r.hi - r.lo) * bw, bh, {
        fill: alpha(n > 1 ? R.fault : n === 1 ? R.safe : p.muted, 0.2),
        stroke: alpha(n > 1 ? R.fault : n === 1 ? R.safe : p.muted, 0.7), r: 4, lw: 2,
      });
      // The devices.
      DEVS.forEach((d, i) => {
        const x = bx + d * bw;
        const inside = d >= r.lo && d < r.hi;
        g.fillStyle = inside ? (n > 1 ? R.fault : R.safe) : p.muted;
        g.beginPath(); g.arc(x, by + bh / 2, 7, 0, Math.PI * 2); g.fill();
        label(g, `dev ${i + 1}`, x, by + bh + 16, {
          color: inside ? (n > 1 ? R.fault : R.safe) : p.muted, size: 9.5, align: 'center', weight: inside ? 700 : 500,
        });
      });

      // The verdict.
      const vy = by + bh + 40;
      box(g, pad, vy, bw, 34, {
        fill: alpha(n > 1 ? R.fault : n === 1 ? R.safe : p.muted, 0.12),
        stroke: alpha(n > 1 ? R.fault : n === 1 ? R.safe : p.muted, 0.55), r: 7,
      });
      label(g, n > 1 ? `${n} replies collide — garbled, so halve the range`
        : n === 1 ? '1 clean reply — record the UID and mute it'
          : 'no reply — this range is empty, discard it',
      w / 2, vy + 17, {
        color: n > 1 ? R.fault : n === 1 ? R.safe : p.ink2, size: 12, align: 'center', weight: 700, max: bw - 16,
      });

      const rows = [
        ['UID length', '48 bits: 16 manufacturer, 32 device'],
        ['Search method', 'binary search, so steps grow with the log of the range'],
        ['Devices found so far', String(RANGES.slice(0, step + 1).filter((rr) => inRange(rr) === 1).length)],
        ['The same idea', 'the halving in the fault-finding method: twelve devices in four tests'],
      ];
      let y = vy + 52;
      const keyW = Math.min(160, w * 0.36);
      for (const [k, v] of rows) {
        label(g, k, pad, y, { color: p.muted, size: 10.5, max: keyW - 8 });
        label(g, v, pad + keyW, y, { color: p.ink2, size: 10.5, max: bw - keyW });
        y += 18;
      }
    },
  });
  upd();
});

register('rdmnet-arch', (host) => chain(host, {
  title: 'RDMnet, the one the older books do not have',
  sub: 'ANSI E1.33, published in 2019. RDM over IP, and it fixes almost everything that makes RDM fragile.',
  tag: 'Piece',
  accent: 'safe',
  stages: [
    {
      name: 'The problem it solves',
      body: 'RDM over DMX is half duplex on a line designed for one direction, sharing a time budget with the lighting data, through boxes that may not pass the return direction.',
      why: 'Every RDM complaint in the industry is one of those three things.',
      note: 'A DMX-only splitter passes the forward direction perfectly and blocks the return. <b>Every fixture works, none is discoverable, and the symptom points at exactly the wrong place.</b>',
    },
    {
      name: 'The broker',
      body: 'A rendezvous point on the network. Devices register with it, and controllers reach devices through it.',
      why: 'It removes the need for a controller to know where anything is, and it scales to a building rather than to one line of 32 devices.',
      note: 'This is a genuinely different architecture from everything else in the session. <b>DMX has no addressing at all; RDMnet has a directory.</b>',
    },
    {
      name: 'TCP transport',
      body: 'Messages are acknowledged and ordered, because a configuration change is a command rather than a stream.',
      why: 'The fourth of the Five Questions, answered properly for the first time in the E1 family.',
      note: 'This is the right choice here and the wrong choice for sACN, and knowing why is the point. <b>Configuration must not be lost; a lighting level from 40 ms ago is not worth having.</b>',
    },
    {
      name: 'LLRP',
      body: 'A low-level recovery protocol on multicast, which can reach a device even when its IP configuration is wrong.',
      why: 'This is the feature that matters most in practice.',
      note: 'It is how you fix a node somebody set to the wrong static address, <b>without a ladder</b>. Anybody who has spent an afternoon on that will understand immediately why this is in the standard.',
    },
    {
      name: 'Where it is, in 2026',
      body: 'Appearing in new nodes and consoles. The installed base of fixtures is enormous and will not have it.',
      why: 'Expect RDM over DMX to remain the last metre for a long time, with RDMnet from the console to the gateway.',
      note: 'This is the pattern of the whole course arriving again: <b>the network carries it as far as the last box, and a 1986 protocol carries it the last few metres to the fixture.</b>',
    },
  ],
  footer: 'No shared time budget, no half-duplex turnaround, no splitter transparency problem, and reliable transport.',
}));

register('sacn-multicast', (host) => {
  let universe = 300;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Universe to multicast group, in your head',
    sub: 'This is how you write a filter that isolates one universe out of a hundred, and it is one division.',
    note: '',
  });

  const upd = () => {
    const hi = Math.floor(universe / 256), lo = universe % 256;
    setNote(`Universe ${universe} is <b>239.255.${hi}.${lo}</b>: ${universe} ÷ 256 = ${hi} remainder ${lo}, and those two bytes are the last two octets. <b>A device that has joined only the groups for its own universes receives only those, which is the entire reason sACN is kinder to a network than broadcast Art-Net, and it exists only if IGMP snooping is working.</b>`);
    cv.once();
  };

  controls.append(slider('Universe', {
    min: 1, max: 2048, step: 1, value: 300, on: (v) => { universe = v; upd(); },
  }).node);
  [1, 16, 256, 512].forEach((u) => controls.append(button(String(u), () => { universe = u; upd(); }).node));

  challenge('Find the universe where the third octet first becomes 1.', () => universe === 256);

  const cv = canvas(stage, {
    height: 292, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const hi = Math.floor(universe / 256), lo = universe % 256;

      // The 16-bit universe number split into two bytes.
      label(g, `Universe ${universe}, as 16 bits`, pad, 24, { color: p.ink, size: 12, weight: 600 });
      const bits = universe.toString(2).padStart(16, '0');
      const bw = Math.min(26, (w - pad * 2 - 18) / 16);
      for (let i = 0; i < 16; i++) {
        const gap = i >= 8 ? 18 : 0;
        const x = pad + i * bw + gap;
        const on = bits[i] === '1';
        box(g, x, 38, bw - 1, 28, {
          fill: on ? alpha(i < 8 ? R.energy : R.signal, 0.3) : alpha(p.line, 0.25), stroke: 'transparent', r: 3,
        });
        if (bw > 12) {
          label(g, bits[i], x + bw / 2, 52, {
            color: on ? (i < 8 ? R.energy : R.signal) : p.muted, size: 10, align: 'center', weight: 700, mono: true,
          });
        }
      }
      label(g, `high byte = ${hi}`, pad + 4 * bw, 78, { color: R.energy, size: 10.5, align: 'center', mono: true, max: 8 * bw });
      label(g, `low byte = ${lo}`, pad + 12 * bw + 18, 78, { color: R.signal, size: 10.5, align: 'center', mono: true, max: 8 * bw });

      // The group address, built from those bytes.
      const gy = 102;
      const octets = [['239', p.muted], ['255', p.muted], [String(hi), R.energy], [String(lo), R.signal]];
      const ow = Math.min(84, (w - pad * 2 - 24) / 4);
      octets.forEach(([v, col], i) => {
        const x = pad + i * (ow + 8);
        box(g, x, gy, ow, 46, { fill: alpha(col, 0.14), stroke: alpha(col, 0.6), r: 7 });
        label(g, v, x + ow / 2, gy + 20, { color: col === p.muted ? p.ink2 : col, size: 17, align: 'center', weight: 700, mono: true, max: ow - 8 });
        label(g, ['fixed', 'fixed', 'high byte', 'low byte'][i], x + ow / 2, gy + 38, {
          color: p.muted, size: 8.5, align: 'center', max: ow - 6,
        });
        if (i < 3) label(g, '.', x + ow + 4, gy + 22, { color: p.muted, size: 16, align: 'center' });
      });

      // Working and filters.
      const rows = [
        ['Multicast group', `239.255.${hi}.${lo}`],
        ['Working', `${universe} ÷ 256 = ${hi} remainder ${lo}`],
        ['Wireshark filter', `ip.dst == 239.255.${hi}.${lo}`],
        ['All of sACN', 'udp.port == 5568'],
        ['Range', '239.255.0.0/16, universes 1 to 63999'],
      ];
      let y = gy + 68;
      const keyW = Math.min(150, w * 0.34);
      for (const [k, v] of rows) {
        label(g, k, pad, y, { color: p.muted, size: 10.5, max: keyW - 8 });
        label(g, v, pad + keyW, y, { color: p.ink2, size: 11, mono: true, max: w - pad * 2 - keyW });
        y += 19;
      }
    },
  });
  upd();
});

register('sacn-priority', (host) => {
  let mainP = 100;
  let backupP = 90;
  let mainAlive = true;
  let seconds = 0;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Two sources, one universe',
    sub: 'Set the priorities, then stop the main console and watch the source timeout do its work.',
    note: '',
  });

  const winner = () => {
    if (!mainAlive && seconds >= 2.5) return 'backup';
    if (!mainAlive) return 'main-stale';
    return mainP >= backupP ? 'main' : 'backup';
  };

  const upd = () => {
    const wnr = winner();
    setNote(mainAlive
      ? (mainP === backupP
        ? 'Equal priorities, and the standard does not say what a receiver must do: merge, or pick. <b>Different manufacturers do different things, which is exactly the ambiguity to avoid. Give the backup a lower number.</b>'
        : `Priority ${Math.max(mainP, backupP)} wins outright. There is no merging between different priorities: the higher source owns the universe completely. <b>Default 100 for the main console, lower for a backup, higher only for a tool that takes control deliberately and releases by stopping.</b>`)
      : wnr === 'main-stale'
        ? `The main console has stopped and ${sig(seconds)} s have passed. The receiver still considers it present until the <b>2.5 second source timeout</b>, so nothing has changed yet. <b>Those two and a half seconds are a real gap and they are in the standard.</b>`
        : `Past the 2.5 s timeout, so the main source is considered gone and the backup at priority ${backupP} takes over. <b>No changeover to operate and nobody to press anything, which is why a continuously-sending backup at a lower priority is the cheapest resilience in a lighting system.</b>`);
    cv.once();
  };

  controls.append(slider('Main console priority', { min: 0, max: 200, step: 10, value: 100, on: (v) => { mainP = v; upd(); } }).node);
  controls.append(slider('Backup priority', { min: 0, max: 200, step: 10, value: 90, on: (v) => { backupP = v; upd(); } }).node);
  controls.append(toggle('Main console sending', { value: true, on: (v) => { mainAlive = v; upd(); } }).node);
  controls.append(slider('Seconds since it stopped', { min: 0, max: 6, step: 0.5, value: 0, fmt: (v) => `${v} s`, on: (v) => { seconds = v; upd(); } }).node);

  challenge('Make the backup take over without anybody pressing anything.', () => !mainAlive && seconds >= 2.5);

  const cv = canvas(stage, {
    height: 250,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const wnr = winner();
      const bw = Math.min(170, (w - pad * 2 - 30) / 2);

      const src = (x, nm, pr, alive, wins) => {
        box(g, x, 40, bw, 66, {
          fill: alpha(wins ? R.safe : alive ? p.muted : R.fault, wins ? 0.18 : 0.06),
          stroke: wins ? R.safe : alive ? p.line : alpha(R.fault, 0.6), r: 8, lw: wins ? 2 : 1,
        });
        label(g, nm, x + 12, 58, { color: p.ink, size: 12, weight: 700, max: bw - 24 });
        label(g, `priority ${pr}`, x + 12, 78, { color: wins ? R.safe : p.muted, size: 11, mono: true, max: bw - 24 });
        label(g, alive ? 'sending' : 'stopped', x + 12, 95, {
          color: alive ? R.safe : R.fault, size: 10.5, weight: 600, max: bw - 24,
        });
      };
      src(pad, 'Main console', mainP, mainAlive, wnr === 'main' || wnr === 'main-stale');
      src(w - pad - bw, 'Backup', backupP, true, wnr === 'backup');

      // The receiver.
      const ry = 148;
      box(g, pad, ry, w - pad * 2, 44, {
        fill: alpha(R.signal, 0.1), stroke: alpha(R.signal, 0.5), r: 8,
      });
      label(g, 'fixture, receiving universe 1', pad + 12, ry + 15, { color: p.muted, size: 10 });
      const wnrText = wnr === 'backup' ? `taking data from the BACKUP at priority ${backupP}`
        : wnr === 'main-stale' ? `still holding the main console's last data, ${sig(2.5 - seconds)} s of timeout left`
          : mainP === backupP ? 'two sources at equal priority: behaviour is manufacturer dependent'
            : `taking data from the ${mainP > backupP ? 'MAIN CONSOLE' : 'BACKUP'} at priority ${Math.max(mainP, backupP)}`;
      label(g, wnrText, pad + 12, ry + 32, {
        color: wnr === 'main-stale' ? R.energy : mainP === backupP && mainAlive ? R.fault : R.safe,
        size: 11.5, weight: 600, max: w - pad * 2 - 24,
      });

      // Feeds into the receiver.
      [[pad + bw / 2, mainAlive], [w - pad - bw / 2, true]].forEach(([x, alive], i) => {
        const wins = (i === 0 && (wnr === 'main' || wnr === 'main-stale')) || (i === 1 && wnr === 'backup');
        if (!alive) return;
        line(g, x, 106, x, ry, { color: alpha(wins ? R.safe : p.muted, wins ? 0.9 : 0.3), lw: wins ? 2.5 : 1.5, dash: wins ? null : [4, 4] });
        if (wins) flowDots(g, x, 106, x, ry, { color: R.safe, t, speed: 1.5, count: 3, r: 2.4 });
      });

      // The timeout bar.
      if (!mainAlive) {
        const tx = pad, tw = w - pad * 2, ty = 206;
        box(g, tx, ty, tw, 16, { fill: alpha(p.line, 0.3), stroke: p.line, r: 4 });
        const frac = Math.min(1, seconds / 2.5);
        box(g, tx + 1, ty + 1, Math.max(2, frac * tw - 2), 14, {
          fill: alpha(frac >= 1 ? R.safe : R.energy, 0.5), stroke: 'transparent', r: 3,
        });
        label(g, `source timeout ${sig(Math.min(seconds, 2.5))} of 2.5 s`, tx + 8, ty + 8, {
          color: p.ink2, size: 10, mono: true, max: tw - 16,
        });
      }
    },
  });
  upd();
});

register('artnet-vs-sacn', (host) => compare(host, {
  title: 'sACN and Art-Net, honestly',
  sub: 'Different protocols, different ports, different numbering, and one operational difference that matters more than the rest.',
  accent: 'signal',
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'port', label: 'Port' },
    { key: 'addr', label: 'Default addressing' },
    { key: 'uni', label: 'Universes' },
    { key: 'pri', label: 'Priority' },
    { key: 'disc', label: 'Discovery' },
  ],
  items: [
    {
      name: 'sACN, E1.31-2018', short: 'sACN', tone: 'safe',
      line: 'An ESTA standard. DMX data over UDP multicast, with ACN framing.',
      status: 'ANSI standard, currently E1.31-2018',
      port: 'UDP 5568',
      addr: '<b>Multicast</b>, one group per universe in 239.255.0.0/16',
      uni: '1 to 63999, flat numbering',
      pri: 'Yes, 0 to 200, default 100',
      disc: 'None in the protocol',
      note: 'The multicast default is the whole argument. <b>A device joins only the groups for its own universes and receives only those, provided IGMP snooping is working and a querier is present.</b>',
    },
    {
      name: 'Art-Net 4', short: 'Art-Net', tone: 'energy',
      line: 'Published by one company, free to implement, enormously widely deployed, and it predates sACN by a decade.',
      status: 'Not a standard. Published by Artistic Licence',
      port: 'UDP 6454',
      addr: '<b>Broadcast</b> by default, with unicast and multicast available',
      uni: '32768, split into net : sub-net : universe',
      pri: 'None in the protocol',
      disc: 'Yes: ArtPoll and ArtPollReply, plus configuration over the protocol',
      note: 'On eight universes nobody notices the broadcast. <b>On two hundred, every device on the network is doing real work discarding data it did not ask for, and it is a known cause of media servers glitching on a shared network.</b>',
    },
    {
      name: 'The difference that matters', short: 'The point', tone: 'fault',
      line: 'Broadcast against multicast, and the universe numbering.',
      status: '—',
      port: '—',
      addr: 'Art-Net\'s default reaches every device; sACN\'s reaches only subscribers',
      uni: 'Art-Net numbers from zero in a 15-bit port address; consoles number from one, flat',
      pri: 'A backup console is trivial on sACN and needs external logic on Art-Net',
      disc: 'Art-Net wins here, which is part of why RDMnet exists',
      note: 'Off-by-one universe errors between a console\'s flat numbering and Art-Net\'s net/sub-net/universe are constant. <b>New designs: sACN, with snooping and a querier. Existing Art-Net rigs: leave them, but turn off broadcast and check the universe mapping.</b>',
    },
  ],
  footer: 'Art-Net 4 supports unicast and multicast and most modern nodes will do it. Configure it: the default is the problem, not the protocol.',
}));

register('pixel-load', (host) => {
  let widthM = 4;
  let heightM = 3;
  let pitch = 50;
  let cpp = 3;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'What a pixel rig does to the arithmetic',
    sub: 'One universe holds 170 RGB pixels. Everything else follows from that number.',
    note: '',
  });

  const calc = () => {
    const cols = Math.max(1, Math.floor((widthM * 1000) / pitch));
    const rows = Math.max(1, Math.floor((heightM * 1000) / pitch));
    const pixels = cols * rows;
    const per = Math.floor(512 / cpp);
    const universes = Math.ceil(pixels / per);
    const bits = universes * 680 * 8 * 44;
    return { cols, rows, pixels, per, universes, bits };
  };

  const upd = () => {
    const c = calc();
    setNote(c.universes > 40
      ? `${c.pixels.toLocaleString()} pixels is <b>${c.universes} universes</b> and ${eng(c.bits, 'bit/s')} of continuous multicast. This is the point at which the network configuration from Session 5 stops being good practice and becomes the difference between a rig that works and one that does not: <b>IGMP snooping with a querier, sACN rather than broadcast Art-Net, and the media servers on a different VLAN.</b>`
      : `${c.pixels.toLocaleString()} pixels is ${c.universes} universe${c.universes > 1 ? 's' : ''} and ${eng(c.bits, 'bit/s')}, which is comfortable on gigabit. <b>Comfortable only if multicast is going where it was asked for: without IGMP snooping every one of these universes reaches every device on the network.</b>`);
    cv.once();
  };

  controls.append(slider('Width', { min: 1, max: 20, step: 0.5, value: 4, fmt: (v) => `${v} m`, on: (v) => { widthM = v; upd(); } }).node);
  controls.append(slider('Height', { min: 0.5, max: 12, step: 0.5, value: 3, fmt: (v) => `${v} m`, on: (v) => { heightM = v; upd(); } }).node);
  controls.append(slider('Pitch', { min: 10, max: 200, step: 5, value: 50, fmt: (v) => `${v} mm`, on: (v) => { pitch = v; upd(); } }).node);
  controls.append(choice('Per pixel', [['3', 'RGB'], ['4', 'RGBW'], ['6', 'RGB 16-bit']], {
    value: '3', on: (v) => { cpp = Number(v); upd(); },
  }).node);

  challenge('Build a wall that needs more than a hundred universes.', () => calc().universes > 100);

  const cv = canvas(stage, {
    height: 304, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const c = calc();

      // A scaled sketch of the wall.
      const maxW = Math.min(w * 0.42, 220);
      const maxH = 100;
      const ar = widthM / heightM;
      let dw = maxW, dh = maxW / ar;
      if (dh > maxH) { dh = maxH; dw = maxH * ar; }
      const wx = pad, wy = 44;
      box(g, wx, wy, dw, dh, { fill: alpha(R.signal, 0.1), stroke: alpha(R.signal, 0.6), r: 4 });
      // Grid, sampled so it stays drawable.
      const gcols = Math.min(c.cols, 40), grows = Math.min(c.rows, 30);
      for (let i = 1; i < gcols; i++) {
        const x = wx + (i / gcols) * dw;
        line(g, x, wy, x, wy + dh, { color: alpha(p.line, 0.5), lw: 0.5 });
      }
      for (let i = 1; i < grows; i++) {
        const y = wy + (i / grows) * dh;
        line(g, wx, y, wx + dw, y, { color: alpha(p.line, 0.5), lw: 0.5 });
      }
      label(g, `${widthM} m × ${heightM} m at ${pitch} mm`, wx, wy - 10, { color: p.muted, size: 10, max: dw + 60 });
      label(g, `${c.cols} × ${c.rows}`, wx + dw / 2, wy + dh + 14, {
        color: p.ink2, size: 10.5, align: 'center', mono: true, max: dw,
      });

      // The numbers.
      const rx = pad + Math.max(dw, maxW) + 24;
      const rows = [
        ['Pixels', c.pixels.toLocaleString(), R.signal],
        ['Channels', (c.pixels * cpp).toLocaleString(), p.ink2],
        ['Pixels per universe', String(c.per), p.ink2],
        ['Universes', String(c.universes), c.universes > 40 ? R.fault : R.safe],
        ['Network load at 44 Hz', eng(c.bits, 'bit/s'), c.universes > 40 ? R.fault : R.safe],
        ['Share of a gigabit link', `${sig((c.bits / 1e9) * 100)} %`, p.ink2],
      ];
      let y = 52;
      const keyW = Math.min(180, (w - rx) * 0.62);
      for (const [k, v, col] of rows) {
        label(g, k, rx, y, { color: p.muted, size: 10.5, max: keyW - 8 });
        label(g, v, rx + keyW, y, { color: col, size: 11.5, weight: 600, mono: true, max: w - rx - keyW - pad });
        y += 20;
      }

      // The scale reminder.
      const by = Math.max(wy + dh + 34, y + 10);
      const notes = [
        `One universe holds ${c.per} ${cpp === 3 ? 'RGB' : cpp === 4 ? 'RGBW' : '16-bit RGB'} pixels, with ${512 - c.per * cpp} channels spare.`,
        'A 5 m run of 60-per-metre tape is 300 pixels, so two universes.',
        'A modest architectural install is comfortably a hundred universes, which is about 24 Mbit/s.',
      ];
      let ny = by;
      for (const n of notes) {
        ny += labelWrap(g, n, pad, ny, { color: p.muted, size: 10.5, max: w - pad * 2, maxLines: 2 }) + 4;
      }
    },
  });
  upd();
});

register('merge-modes', (host) => {
  let mode = 'htp';
  let a = 180;
  let b = 60;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Two sources, one output',
    sub: 'Somebody has to decide. Which rule is set is the answer to "why does the rig behave oddly when both consoles are on".',
    note: '',
  });

  const result = () => (mode === 'htp' ? Math.max(a, b) : mode === 'ltp' ? b : a);

  const upd = () => {
    setNote(mode === 'htp'
      ? `Highest takes precedence, per channel: the output is ${Math.max(a, b)}. Safe and intuitive for dimmers, where more light is never a surprise. <b>It is wrong for anything where a low value is meaningful: a colour mix, a pan position or an iris, where HTP produces a value neither source asked for.</b>`
      : mode === 'ltp'
        ? `Latest takes precedence: the output is ${b}, because that source moved it last. Right for moving lights. <b>It also means a source that stops sending keeps control until something else claims it, which surprises people the first time.</b>`
        : `Priority: the higher source wins outright and there is no merging at all. The output is ${a}. <b>This is what sACN does, and it is the cleanest of the three because there is never a value that neither source asked for.</b>`);
    cv.once();
  };

  controls.append(choice('Merge rule', [['htp', 'HTP'], ['ltp', 'LTP'], ['pri', 'Priority']], {
    value: 'htp', on: (v) => { mode = v; upd(); },
  }).node);
  controls.append(slider('Source A', { min: 0, max: 255, step: 5, value: 180, on: (v) => { a = v; upd(); } }).node);
  controls.append(slider('Source B, moved last', { min: 0, max: 255, step: 5, value: 60, on: (v) => { b = v; upd(); } }).node);

  challenge('Find a case where HTP produces a value neither source asked for.',
    () => mode === 'htp' && Math.max(a, b) !== a && Math.max(a, b) !== b ? false : mode === 'htp' && a !== b);

  const cv = canvas(stage, {
    height: 252, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const out = result();
      const bw = Math.min(150, (w - pad * 2 - 40) / 3);

      const bar = (x, nm, v, col, wins) => {
        box(g, x, 44, bw, 110, {
          fill: alpha(col, wins ? 0.16 : 0.06), stroke: alpha(col, wins ? 1 : 0.4), r: 8, lw: wins ? 2 : 1,
        });
        label(g, nm, x + bw / 2, 60, { color: p.ink2, size: 10.5, align: 'center', max: bw - 10 });
        // Level bar.
        const bh = 60;
        box(g, x + bw / 2 - 16, 72, 32, bh, { fill: alpha(p.line, 0.4), stroke: p.line, r: 4 });
        const fh = (v / 255) * (bh - 4);
        box(g, x + bw / 2 - 15, 72 + bh - 2 - fh, 30, Math.max(2, fh), {
          fill: alpha(col, 0.6), stroke: 'transparent', r: 3,
        });
        label(g, String(v), x + bw / 2, 146, {
          color: wins ? col : p.ink2, size: 14, align: 'center', weight: 700, mono: true, max: bw - 10,
        });
      };

      bar(pad, 'Source A', a, R.energy, mode === 'pri' || (mode === 'htp' && a >= b));
      bar(pad + bw + 20, 'Source B (moved last)', b, R.signal, mode === 'ltp' || (mode === 'htp' && b > a));
      bar(w - pad - bw, 'Output', out, R.safe, true);

      arrow(g, pad + bw + 4, 100, pad + bw + 16, 100, { color: p.muted, lw: 1.5 });
      arrow(g, pad + 2 * bw + 24, 100, w - pad - bw - 6, 100, { color: p.muted, lw: 1.5 });

      const desc = {
        htp: 'HTP: the higher of the two, per channel. Traditional for dimmers.',
        ltp: 'LTP: whoever moved it last owns it. Right for moving lights.',
        pri: 'Priority: the higher-priority source wins outright, with no merging.',
      }[mode];
      label(g, desc, pad, 178, { color: p.ink2, size: 11.5, weight: 600, max: w - pad * 2 });
      label(g, 'A gateway or node usually offers HTP or LTP merging of two inputs. Know which one is set: a rig that behaves oddly with two consoles connected is nearly always a merge mode that does not match the intent.',
        pad, 198, { color: p.muted, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});
