// Session 8: time, interchange and everything else.

import { register } from './anim-core.js';
import {
  figure, canvas, slider, toggle, choice, button, label, labelWrap, box, line,
  palette, alpha, fitter, compare, chain, ladder, plot, role, node, arrow, flowDots, eng, sig,
} from './anim-kit.js';

register('dropframe', (host) => {
  let df = true;
  let hours = 3;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Drop frame drops no frames',
    sub: 'It skips frame numbers, the way a building skips a thirteenth floor. Run a show length with it on and off.',
    note: '',
  });

  const drift = () => (df ? 0 : hours * 3.6);

  const upd = () => {
    setNote(df
      ? `Drop frame skips frame numbers 00 and 01 at the start of every minute <b>except every tenth minute</b>: 2 per minute, 18 minutes in every 20, so 108 numbers an hour. At 29.97 fps those 108 frames are 3.6036 seconds, which is almost exactly the error, and over an hour the residual is a couple of milliseconds. <b>Every frame of the recording is present. Only the numbering skips.</b>`
      : `Non-drop counts every number, so after ${hours} hours the timecode clock is <b>${sig(drift())} seconds behind the wall clock</b>. That is fine for a music session that does not care about matching a broadcast clock, and it is the classic long-show drift when one device is set differently from the others. <b>Both devices report perfectly healthy timecode the whole way.</b>`);
    cv.once();
  };

  controls.append(choice('Counting', [['df', 'Drop frame'], ['nd', 'Non-drop']], {
    value: 'df', on: (v) => { df = v === 'df'; upd(); },
  }).node);
  controls.append(slider('Show length', { min: 0.5, max: 4, step: 0.5, value: 3, fmt: (v) => `${v} h`, on: (v) => { hours = v; upd(); } }).node);

  challenge('Produce more than three seconds of drift.', () => drift() > 3);

  const cv = canvas(stage, {
    height: 344, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;

      // The minute boundary, frame by frame.
      label(g, 'crossing a minute boundary, frame by frame', pad, 24, { color: p.muted, size: 10.5 });
      const frames = [];
      for (let f = 27; f <= 29; f++) frames.push({ n: f, m: 0, skip: false });
      for (let f = 0; f <= 4; f++) frames.push({ n: f, m: 1, skip: df && f < 2 });
      const bw = Math.min(58, (w - pad * 2 - (frames.length - 1) * 5) / frames.length);
      frames.forEach((f, i) => {
        const x = pad + i * (bw + 5);
        box(g, x, 40, bw, 44, {
          fill: f.skip ? alpha(R.fault, 0.12) : alpha(R.signal, 0.14),
          stroke: f.skip ? alpha(R.fault, 0.7) : alpha(R.signal, 0.6), r: 5,
          lw: f.skip ? 2 : 1,
        });
        label(g, `:${String(f.n).padStart(2, '0')}`, x + bw / 2, 56, {
          color: f.skip ? R.fault : p.ink, size: 12, align: 'center', weight: 700, mono: true, max: bw - 4,
        });
        label(g, f.skip ? 'skipped' : f.m === 0 ? 'min 0' : 'min 1', x + bw / 2, 74, {
          color: f.skip ? R.fault : p.muted, size: 8.5, align: 'center', max: bw - 4,
        });
        if (f.skip) {
          line(g, x + 6, 46, x + bw - 6, 78, { color: R.fault, lw: 1.5 });
        }
      });
      label(g, df ? 'Numbers 00 and 01 are skipped, at every minute except every tenth.'
        : 'Every number is counted, so the clock falls behind real time.',
      pad, 100, { color: df ? R.safe : R.energy, size: 11, weight: 600, max: w - pad * 2 });

      // The drift over the show.
      const gy = 126, gh = 66;
      box(g, pad, gy, w - pad * 2, gh, { fill: alpha(p.line, 0.22), stroke: p.line, r: 7 });
      label(g, 'error against the wall clock, over the show', pad + 6, gy - 8, { color: p.muted, size: 9.5 });
      g.save();
      g.beginPath(); g.rect(pad, gy, w - pad * 2, gh); g.clip();
      g.strokeStyle = df ? R.safe : R.fault;
      g.lineWidth = 2.5;
      g.beginPath();
      const gx0 = pad + 6, gx1 = w - pad - 6;
      const maxDrift = 4 * 3.6;
      for (let x = gx0; x <= gx1; x += 2) {
        const frac = (x - gx0) / (gx1 - gx0);
        const d = df ? 0.002 : frac * hours * 3.6;
        const yy = gy + gh - 8 - (d / maxDrift) * (gh - 18);
        if (x === gx0) g.moveTo(x, yy); else g.lineTo(x, yy);
      }
      g.stroke();
      g.restore();
      label(g, df ? 'flat: a couple of milliseconds' : `${sig(drift())} s after ${hours} h`,
        gx1 - 4, gy + (df ? gh - 20 : 18), {
          color: df ? R.safe : R.fault, size: 11, align: 'right', weight: 700, max: w * 0.6,
        });

      // The arithmetic.
      const rows = [
        ['NTSC colour rate', '30 × 1000 ÷ 1001 = 29.97002997 fps'],
        ['Error if you count 30', 'about 3.6 s per hour'],
        ['Numbers skipped', '2 per minute, except every tenth minute'],
        ['Per hour', '108 numbers, which is 3.6036 s at 29.97'],
        ['Written as', '01:23:45;12 for drop frame, colons throughout for non-drop'],
        ['At 25 fps', 'there is no drop frame. 25 is exactly 25'],
      ];
      let y = gy + gh + 22;
      const keyW = Math.min(160, w * 0.36);
      for (const [k, v] of rows) {
        label(g, k, pad, y, { color: p.muted, size: 10.5, max: keyW - 8 });
        label(g, v, pad + keyW, y, { color: p.ink2, size: 10.5, max: w - pad * 2 - keyW });
        y += 17;
      }
    },
  });
  upd();
});

register('ltc-waveform', (host) => {
  let speed = 1;
  let polarity = true;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'LTC: timecode as an audio signal',
    sub: 'Biphase mark encoding. Swap the conductors, run it backwards, run it slowly: it still decodes.',
    note: '',
  });

  const upd = () => {
    setNote(speed === 0
      ? 'Stopped, and there are no transitions, so <b>LTC cannot be read when a machine is parked on a frame</b>. That is the one thing it cannot do, and it is what VITC was invented for: putting the code in the invisible lines of a video signal so it survives a pause.'
      : !polarity
        ? 'The conductors are swapped and it still decodes perfectly, because the decoder reads <b>transitions</b> rather than absolute levels. <b>That matters on a patch bay, where a reversed cable would break almost any other signal.</b>'
        : `Running at ${speed < 0 ? 'reverse ' : ''}${Math.abs(speed)}× and still decoding. There is a transition at every bit boundary, plus an extra one mid-bit for a one, so the clock is carried in the signal itself. <b>Self-clocking, polarity independent, and readable at any speed, which is why a machine shuttling can still read timecode and why LTC is still everywhere.</b>`);
    cv.once();
  };

  controls.append(slider('Transport speed', {
    min: -2, max: 4, step: 1, value: 1,
    fmt: (v) => (v === 0 ? 'stopped' : v < 0 ? `${Math.abs(v)}× reverse` : `${v}× forward`),
    on: (v) => { speed = v; upd(); },
  }).node);
  controls.append(toggle('Conductors the right way round', { value: true, on: (v) => { polarity = v; upd(); } }).node);

  challenge('Find the one condition under which LTC cannot be read.', () => speed === 0);

  const cv = canvas(stage, {
    height: 284,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const BITS = [1, 0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 1];

      const gy = 60, gh = 60;
      const gx0 = pad, gx1 = w - pad;
      const bw = (gx1 - gx0) / BITS.length;
      const hi = gy, lo = gy + gh;

      label(g, 'biphase mark: a transition at every bit boundary, plus one in the middle for a 1',
        pad, 30, { color: p.ink2, size: 11, max: w - pad * 2 });

      const sign = polarity ? 1 : -1;
      const drift = speed === 0 ? 0 : (t * speed * bw * 0.4) % (bw * 2);

      g.strokeStyle = speed === 0 ? p.muted : R.signal;
      g.lineWidth = 2.5;
      g.beginPath();
      let level = 1;
      let x = gx0 - drift;
      g.moveTo(gx0, level * sign > 0 ? hi : lo);
      for (let i = 0; i < BITS.length + 2; i++) {
        const b = BITS[i % BITS.length];
        // Transition at the boundary.
        level = -level;
        g.lineTo(x, level * sign > 0 ? hi : lo);
        if (b === 1) {
          g.lineTo(x + bw / 2, level * sign > 0 ? hi : lo);
          level = -level;
          g.lineTo(x + bw / 2, level * sign > 0 ? hi : lo);
        }
        g.lineTo(x + bw, level * sign > 0 ? hi : lo);
        x += bw;
      }
      g.stroke();

      // Bit boundaries and values.
      BITS.forEach((b, i) => {
        const bx = gx0 + i * bw;
        line(g, bx, gy - 8, bx, lo + 8, { color: alpha(p.line, 0.9), lw: 1 });
        label(g, String(b), bx + bw / 2, lo + 18, {
          color: b ? R.energy : p.muted, size: 11, align: 'center', weight: 700, mono: true, max: bw - 2,
        });
      });
      label(g, 'bit values', gx0, lo + 34, { color: p.muted, size: 9.5 });

      // Properties.
      const rows = [
        ['Self-clocking', 'the transitions carry the clock, so no separate clock line is needed', true],
        ['Polarity independent', 'swap the conductors and it still decodes', polarity || true],
        ['Readable at any speed', 'forwards, backwards, shuttling', speed !== 0],
        ['Not readable when stopped', 'no transitions, so nothing to decode. This is what VITC solved', speed === 0],
      ];
      let y = lo + 58;
      const keyW = Math.min(170, w * 0.38);
      rows.forEach(([k, v, on]) => {
        const col = k.startsWith('Not') ? (on ? R.fault : p.muted) : (on ? R.safe : p.muted);
        label(g, k, pad, y, { color: col, size: 10.5, weight: 600, max: keyW - 8 });
        label(g, v, pad + keyW, y, { color: p.muted, size: 10.5, max: w - pad * 2 - keyW });
        y += 17;
      });
      label(g, '80 bits per frame. At 25 fps that is 2000 bit/s, at about −10 to 0 dBu on ordinary audio cable, so it goes anywhere audio goes.',
        pad, y + 8, { color: p.ink2, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});

register('mtc-quarter', (host) => {
  let nibble = 0;

  const NIBBLES = ['frames low', 'frames high', 'seconds low', 'seconds high', 'minutes low', 'minutes high', 'hours low', 'hours high and rate'];

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'MTC, one nibble at a time',
    sub: 'A complete timecode value takes eight quarter-frame messages, which is two frames. Step through them.',
    note: '',
  });

  const upd = () => {
    setNote(nibble < 7
      ? `Quarter-frame ${nibble + 1} of 8, carrying the <b>${NIBBLES[nibble]}</b> nibble. Each message is two bytes: <code>F1</code> and one data byte whose top three bits say which nibble this is and whose low four bits are the value. <b>At 31.25 kbit/s this is the only economical way to carry timecode over MIDI, and it is characteristically clever.</b>`
      : 'The eighth nibble completes the value, and eight quarter-frames is <b>two whole frames</b>. So MTC is inherently two frames behind, forever. <b>A good implementation compensates for that known offset; not all do, which is why an MTC-driven cue can sit two frames late against an LTC-driven one.</b>');
    cv.once();
  };

  const prev = button('← Back', () => { nibble = Math.max(0, nibble - 1); upd(); });
  const next = button('Next →', () => { nibble = Math.min(7, nibble + 1); upd(); });
  controls.append(prev.node, next.node);

  challenge('Complete a whole timecode value and read how long it took.', () => nibble === 7);

  const cv = canvas(stage, {
    height: 250, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;

      // The eight quarter frames along a two-frame timeline.
      const tx = pad, tw = w - pad * 2, ty = 54;
      box(g, tx, ty, tw / 2, 26, { fill: alpha(p.line, 0.3), stroke: p.line, r: 5 });
      box(g, tx + tw / 2, ty, tw / 2, 26, { fill: alpha(p.line, 0.3), stroke: p.line, r: 5 });
      label(g, 'frame 1', tx + tw / 4, ty + 13, { color: p.muted, size: 10, align: 'center' });
      label(g, 'frame 2', tx + 3 * tw / 4, ty + 13, { color: p.muted, size: 10, align: 'center' });

      const qw = tw / 8;
      for (let i = 0; i < 8; i++) {
        const x = tx + i * qw;
        const done = i <= nibble;
        const now = i === nibble;
        box(g, x + 2, ty + 34, qw - 4, 44, {
          fill: alpha(now ? R.safe : done ? R.signal : p.muted, now ? 0.24 : done ? 0.12 : 0.04),
          stroke: alpha(now ? R.safe : done ? R.signal : p.muted, now ? 1 : done ? 0.6 : 0.25),
          r: 5, lw: now ? 2 : 1,
        });
        label(g, `F1 ${(i * 16 + 5).toString(16).toUpperCase().padStart(2, '0')}`, x + qw / 2, ty + 48, {
          color: done ? p.ink : p.muted, size: 9.5, align: 'center', mono: true, max: qw - 8,
        });
        label(g, NIBBLES[i].split(' ')[0], x + qw / 2, ty + 62, {
          color: done ? p.ink2 : p.muted, size: 8.5, align: 'center', max: qw - 6,
        });
        label(g, NIBBLES[i].split(' ').slice(1).join(' '), x + qw / 2, ty + 72, {
          color: p.muted, size: 8, align: 'center', max: qw - 6,
        });
      }

      // The value assembling.
      const vy = ty + 96;
      const parts = ['01', '23', '45', '12'];
      const known = [nibble >= 7, nibble >= 5, nibble >= 3, nibble >= 1];
      const pw = Math.min(70, (w - pad * 2 - 30) / 4);
      parts.forEach((v, i) => {
        const x = pad + i * (pw + 10);
        box(g, x, vy, pw, 42, {
          fill: alpha(known[i] ? R.safe : p.muted, known[i] ? 0.14 : 0.04),
          stroke: alpha(known[i] ? R.safe : p.muted, known[i] ? 0.7 : 0.3), r: 6,
        });
        label(g, known[i] ? v : '--', x + pw / 2, vy + 20, {
          color: known[i] ? p.ink : p.muted, size: 17, align: 'center', weight: 700, mono: true, max: pw - 6,
        });
        label(g, ['hours', 'minutes', 'seconds', 'frames'][i], x + pw / 2, vy + 35, {
          color: p.muted, size: 8.5, align: 'center', max: pw - 6,
        });
      });

      label(g, nibble >= 7
        ? 'Complete: 01:23:45:12, after two frames. So MTC is always two frames behind.'
        : `${nibble + 1} of 8 nibbles received. The value is not yet usable.`,
      pad, vy + 62, {
        color: nibble >= 7 ? R.safe : p.muted, size: 11.5, weight: 600, max: w - pad * 2,
      });
      label(g, 'A full-frame message exists as a SysEx, for locating: it delivers a complete value at once when the machine jumps rather than runs.',
        pad, vy + 82, { color: p.muted, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});

register('sync-methods', (host) => compare(host, {
  title: 'Five ways to make things happen together',
  sub: 'Two of these are clocks and two are events. Using one where you needed the other is a common design mistake.',
  accent: 'safe',
  fields: [
    { key: 'kind', label: 'Clock or event?' },
    { key: 'acc', label: 'Accuracy' },
    { key: 'for', label: 'What it is for' },
    { key: 'watch', label: 'Watch out for', tone: 'fault' },
  ],
  items: [
    {
      name: 'Timecode', short: 'Timecode', tone: 'signal',
      line: 'LTC or MTC. Hours, minutes, seconds and frames, continuously.',
      kind: '<b>A clock.</b> It answers "what time is it now?"',
      acc: 'One frame, and MTC is two frames behind',
      for: 'Running several systems against fixed media',
      watch: 'A drop-frame and a non-drop source drift 3.6 s an hour apart while both report healthy',
      note: 'Timecode is the original answer and it is still the right one whenever the show is locked to a recording. <b>Write the frame rate and the drop-frame setting on the system drawing: it is one menu page on every device and it is invisible until it has accumulated.</b>',
    },
    {
      name: 'PTP', short: 'PTP', tone: 'safe',
      line: 'IEEE 1588. Four timestamps, several times a second, to sub-microsecond agreement.',
      kind: '<b>A clock</b>, and a far more precise one',
      acc: 'Sub-microsecond',
      for: 'Media over IP: Dante, AES67, ST 2110',
      watch: 'Two grandmasters flapping, a router in the path, or two devices on different profiles',
      note: 'PTP is what made audio and video over IP possible, and it introduced three singular roles to every show network. <b>One grandmaster, one profile, one domain, one VLAN.</b>',
    },
    {
      name: 'Genlock', short: 'Genlock', tone: 'energy',
      line: 'Black burst or tri-level, distributed to every video device.',
      kind: 'A clock, for the video scan itself',
      acc: 'Sub-line',
      for: 'Legacy video systems sharing a scan, and still the backbone of a broadcast plant',
      watch: 'It is a separate distribution system with its own cabling and its own failure modes',
      note: 'Being replaced by PTP under ST 2059-2 in IP plants, and still present in an enormous amount of working equipment. <b>A facility mid-transition runs both, which is a real complication rather than a footnote.</b>',
    },
    {
      name: 'Network cues', short: 'Cues', tone: 'signal',
      line: 'MSC, OSC, a contact closure, an HTTP request.',
      kind: '<b>An event.</b> It says "do this thing now"',
      acc: '5 to 50 ms, which is fine',
      for: 'Discrete moments, not continuous running',
      watch: 'Using an event where a clock was needed shows as things that start together and then drift apart',
      note: 'This is the distinction that matters most in system design. <b>A cue cannot keep two systems in step; it can only start them at the same instant, and what happens after that is each system\'s own clock.</b>',
    },
    {
      name: 'Ableton Link', short: 'Link', tone: 'energy',
      line: 'A shared musical tempo across a network.',
      kind: 'Neither: it shares a <b>beat</b>, not a time',
      acc: 'Musically tight',
      for: 'Musicians on a shared network tempo, and increasingly interactive installations',
      watch: 'It is a different thing from timecode and cannot substitute for it',
      note: 'Worth knowing exists, because it appears in installations and in music-led shows. <b>A beat grid and a wall clock are different objects, and conflating them produces a system that is right on the downbeat and wrong everywhere else.</b>',
    },
  ],
  footer: 'Timecode and PTP answer "what time is it". MSC and OSC say "do this". Know which one your problem needs.',
}));

register('osc-message', (host) => {
  let addr = '/eos/chan/1/level';
  let type = 'f';
  let val = 75;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'An OSC message, byte by byte',
    sub: 'An address pattern, a type tag string, then the arguments. Everything padded to a multiple of four.',
    note: '',
  });

  const pad4 = (n) => Math.ceil((n + 1) / 4) * 4;

  const upd = () => {
    const aLen = pad4(addr.length);
    const tLen = pad4(1 + 1);
    const vLen = type === 's' ? pad4(String(val).length) : 4;
    setNote(`${aLen} bytes of address, ${tLen} of type tag and ${vLen} of argument: <b>${aLen + tLen + vLen} bytes in total</b>. Everything is padded to a multiple of four, which is why OSC messages are larger than they look and why <b>a hand-built one that does not work is usually a padding error</b>.`);
    cv.once();
  };

  controls.append(choice('Address', [
    ['/eos/chan/1/level', '/eos/chan/1/level'],
    ['/cue/12.5/start', '/cue/12.5/start'],
    ['/light/*/level', '/light/*/level  (wildcard)'],
  ], { value: '/eos/chan/1/level', on: (v) => { addr = v; upd(); } }).node);
  controls.append(choice('Argument type', [['f', 'float'], ['i', 'int'], ['s', 'string'], ['T', 'true, no bytes']], {
    value: 'f', on: (v) => { type = v; upd(); },
  }).node);
  controls.append(slider('Value', { min: 0, max: 255, step: 1, value: 75, on: (v) => { val = v; upd(); } }).node);

  challenge('Use a wildcard address to reach several devices at once.', () => addr.includes('*'));

  const cv = canvas(stage, {
    height: 292, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pd = 16;
      const aLen = pad4(addr.length);
      const tLen = pad4(2);
      const vLen = type === 'T' ? 0 : type === 's' ? pad4(String(val).length) : 4;
      const total = aLen + tLen + vLen;

      // The three parts, to scale.
      const parts = [
        ['address pattern', addr, aLen, R.signal],
        ['type tag', `,${type}`, tLen, R.energy],
        ...(vLen ? [['argument', type === 'f' ? `${val}.0` : String(val), vLen, R.safe]] : []),
      ];
      let x = pd;
      const bw = w - pd * 2;
      parts.forEach(([nm, v, len, col]) => {
        const pw = (len / total) * bw;
        box(g, x, 46, pw - 2, 52, { fill: alpha(col, 0.15), stroke: col, r: 7 });
        label(g, v, x + pw / 2, 64, { color: p.ink, size: 11.5, align: 'center', weight: 700, mono: true, max: pw - 8 });
        label(g, nm, x + pw / 2, 80, { color: col, size: 9.5, align: 'center', max: pw - 6 });
        label(g, `${len} B`, x + pw / 2, 92, { color: p.muted, size: 9, align: 'center', mono: true, max: pw - 6 });
        x += pw;
      });
      label(g, `${total} bytes on the wire`, w - pd, 34, { color: p.ink2, size: 10.5, align: 'right' });
      label(g, 'padded to a multiple of four', pd, 34, { color: p.muted, size: 10 });

      // The type tag table.
      const ty = 118;
      label(g, 'type tags', pd, ty, { color: p.muted, size: 10, weight: 600 });
      const TAGS = [['i', '32-bit integer'], ['f', '32-bit float'], ['s', 'string, null-terminated'], ['b', 'blob'], ['T F', 'true, false — no argument bytes'], ['t', '64-bit NTP time tag'], ['h d', '64-bit int, double — OSC 1.1']];
      const cols = 2;
      const cw = (w - pd * 2) / cols;
      TAGS.forEach(([k, v], i) => {
        const cx = pd + (i % cols) * cw;
        const cy = ty + 16 + Math.floor(i / cols) * 18;
        label(g, k, cx, cy, { color: k.includes(type) ? R.energy : p.ink2, size: 10.5, weight: k.includes(type) ? 700 : 500, mono: true, max: 40 });
        label(g, v, cx + 40, cy, { color: p.muted, size: 10, max: cw - 46 });
      });

      const wy = ty + 16 + Math.ceil(TAGS.length / cols) * 18 + 12;
      labelWrap(g, 'The address is a string beginning with a slash, structured like a filesystem path, and it supports wildcards. The type tag string begins with a comma. That is the entire format, and it is why OSC is easy to implement and why every product invents its own vocabulary.',
        pd, wy, { color: p.ink2, size: 10.5, max: w - pd * 2, maxLines: 3 });
    },
  });
  upd();
});

register('osc-bundle', (host) => {
  let scheduled = false;
  let supported = false;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'An OSC bundle, and the feature people forget it has',
    sub: 'Several messages, one time tag, executed atomically. Then check whether the device actually implements it.',
    note: '',
  });

  const upd = () => {
    setNote(!scheduled
      ? 'A time tag of <code>1</code> means <b>immediately</b>: execute on arrival. This is what almost every implementation supports, and it still buys you atomicity, because everything in the bundle happens together rather than in the order the packets arrived.'
      : supported
        ? 'A real time tag, in 64-bit NTP format, and the receiver honours it: all twelve messages take effect at exactly 20:15:03.500, together. <b>This is genuinely useful and it is the one OSC feature people forget exists.</b>'
        : '<b>The receiver does not implement scheduled bundles, so it acts on arrival and the time tag is ignored.</b> Nothing reports an error. QLab and a few others honour them properly and a great many devices do not, so test it on the actual devices before designing around it.');
    cv.once();
  };

  controls.append(toggle('Use a real time tag', { value: false, on: (v) => { scheduled = v; upd(); } }).node);
  controls.append(toggle('Receiver implements scheduling', { value: false, on: (v) => { supported = v; upd(); } }).node);

  challenge('Find the combination that fails silently.', () => scheduled && !supported);

  const cv = canvas(stage, {
    height: 282,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pd = 16;
      const honoured = !scheduled || supported;

      // The bundle structure.
      box(g, pd, 40, w - pd * 2, 76, { fill: alpha(R.signal, 0.07), stroke: alpha(R.signal, 0.5), r: 9 });
      label(g, '#bundle', pd + 12, 58, { color: R.signal, size: 12, weight: 700, mono: true });
      box(g, pd + 90, 46, 200, 22, {
        fill: alpha(scheduled ? R.energy : p.muted, 0.16), stroke: alpha(scheduled ? R.energy : p.muted, 0.6), r: 4,
      });
      label(g, scheduled ? 'time tag  20:15:03.500' : 'time tag  1  (immediately)', pd + 98, 57, {
        color: scheduled ? R.energy : p.ink2, size: 10.5, mono: true, max: 190,
      });

      const msgs = 6;
      const mw = (w - pd * 2 - 24 - (msgs - 1) * 5) / msgs;
      for (let i = 0; i < msgs; i++) {
        const x = pd + 12 + i * (mw + 5);
        box(g, x, 78, mw, 28, { fill: alpha(R.safe, 0.14), stroke: alpha(R.safe, 0.55), r: 4 });
        label(g, `/msg/${i + 1}`, x + mw / 2, 92, {
          color: p.ink2, size: 9.5, align: 'center', mono: true, max: mw - 4,
        });
      }

      // The timeline of execution.
      const ty = 148, tw = w - pd * 2;
      box(g, pd, ty, tw, 24, { fill: alpha(p.line, 0.28), stroke: p.line, r: 5 });
      label(g, 'when each message takes effect', pd, ty - 10, { color: p.muted, size: 9.5 });
      const arrive = pd + tw * 0.28;
      const target = pd + tw * 0.7;
      line(g, arrive, ty - 4, arrive, ty + 28, { color: alpha(p.muted, 0.9), lw: 1.5, dash: [3, 3] });
      label(g, 'arrives', arrive, ty + 42, { color: p.muted, size: 9.5, align: 'center' });
      if (scheduled) {
        line(g, target, ty - 4, target, ty + 28, { color: alpha(R.energy, 0.9), lw: 1.5, dash: [3, 3] });
        label(g, 'time tag', target, ty + 42, { color: R.energy, size: 9.5, align: 'center' });
      }

      const at = honoured && scheduled ? target : arrive;
      for (let i = 0; i < msgs; i++) {
        // If it is honoured, all land together; if not, they land as they are processed.
        const x = honoured ? at : arrive + i * 3;
        g.fillStyle = honoured ? R.safe : R.fault;
        g.beginPath(); g.arc(x, ty + 12, 5, 0, Math.PI * 2); g.fill();
      }

      const vy = ty + 62;
      box(g, pd, vy, tw, 32, {
        fill: alpha(honoured ? R.safe : R.fault, 0.12), stroke: alpha(honoured ? R.safe : R.fault, 0.6), r: 7,
      });
      label(g, scheduled && supported ? 'All six take effect together, at the moment the time tag names'
        : scheduled ? 'The time tag is ignored and they act on arrival. Nothing reports an error.'
          : 'All six take effect together, on arrival. Atomic, which is what a bundle is for.',
      w / 2, vy + 16, {
        color: honoured ? R.safe : R.fault, size: 11.5, align: 'center', weight: 700, max: tw - 16,
      });
      label(g, 'The time tag is 64-bit NTP: seconds since 1900 plus a fraction. The special value 1 means immediately.',
        pd, vy + 48, { color: p.muted, size: 10.5, max: tw });
    },
  });
  upd();
});

register('osc-dialects', (host) => compare(host, {
  title: 'The OSC dialect problem',
  sub: 'OSC specifies an encoding, not a vocabulary. None of these is wrong, and none of them is compatible.',
  accent: 'energy',
  fields: [
    { key: 'addr', label: 'Example address' },
    { key: 'port', label: 'Port' },
    { key: 'note2', label: 'Note' },
  ],
  items: [
    {
      name: 'QLab', short: 'QLab', tone: 'signal',
      line: 'The de facto show controller in a great deal of theatre.',
      addr: '<code>/cue/12.5/start</code>',
      port: '53000, replies on 53001',
      note2: 'Extremely well documented, and its OSC dictionary is a genuine reference',
      note: 'QLab is also one of the few products that honours OSC bundle time tags properly. <b>If you need scheduled bundles, it is the place to test them.</b>',
    },
    {
      name: 'ETC Eos', short: 'Eos', tone: 'signal',
      line: 'The dominant theatre lighting platform.',
      addr: '<code>/eos/cue/1/5/fire</code>',
      port: '3032 for OSC, 3033 for TCP',
      note2: 'Very complete OSC implementation, including a key-press interface',
      note: 'Eos exposes almost its whole command line over OSC, including <code>/eos/key/go</code>. <b>That means a Companion button can do anything an operator can, which is powerful and worth being deliberate about.</b>',
    },
    {
      name: 'grandMA3', short: 'MA3', tone: 'energy',
      line: 'The other dominant lighting platform.',
      addr: '<code>/gma3/cmd</code>',
      port: 'Configurable, often 8000',
      note2: 'Sends command-line strings rather than structured addresses',
      note: 'A different philosophy: one address carrying a command string, rather than the command encoded in the address. <b>Both are valid OSC and they are completely different to integrate with.</b>',
    },
    {
      name: 'Media servers', short: 'Media', tone: 'safe',
      line: 'disguise, Resolume, Watchout and the rest.',
      addr: '<code>/composition/layers/1/clips/1/connect</code>',
      port: '7000, 7401, and others',
      note2: 'Deep hierarchical addresses that mirror the software\'s own object model',
      note: 'These addresses are usually generated from the software\'s internal structure, which makes them predictable once you have seen the pattern. <b>They also change between versions, which is the real cost.</b>',
    },
    {
      name: 'What this means', short: 'The cost', tone: 'fault',
      line: 'Every OSC integration is bespoke.',
      addr: 'There is no registry, no discovery and no assigned port',
      port: 'Each product picks its own',
      note2: 'The deliverable of an OSC integration is a documented address list kept with the show file',
      note: 'This is the real cost of OSC\'s flexibility, and it is worth saying out loud in a production meeting when somebody says "it speaks OSC so it will just work". <b>It also means an OSC integration can break on a firmware update in a way an MSC one does not.</b>',
    },
  ],
  footer: 'MSC has a specified message format two manufacturers can implement identically. OSC has a transport and leaves the vocabulary to each product. That is the whole trade.',
}));

register('psn-tracking', (host) => compare(host, {
  title: 'Following a performer',
  sub: 'A mature product category, and one open interchange format that decides whether any of it works together.',
  accent: 'signal',
  fields: [
    { key: 'tech', label: 'Technology' },
    { key: 'los', label: 'Needs line of sight?' },
    { key: 'out', label: 'Speaks' },
    { key: 'where', label: 'Where it is used' },
  ],
  items: [
    {
      name: 'PosiStageNet', short: 'PSN', tone: 'safe',
      line: 'The open interchange format, published free by VYV and MA Lighting.',
      tech: 'UDP multicast carrying tracker positions',
      los: '—',
      out: 'It is what the others speak <i>to</i> consoles, media servers and audio processors',
      where: 'The common language between any tracking system and anything that consumes positions',
      note: 'If a tracking system and a console both speak PSN, they interoperate. <b>If not, you are buying a manufacturer\'s bridge, and that is a line item and a dependency rather than a technicality.</b>',
    },
    {
      name: 'BlackTrax', short: 'BlackTrax', tone: 'signal',
      line: 'Active infrared beacons and a camera array.',
      tech: 'Active IR LED beacons, tracked by fixed cameras',
      los: '<b>Yes.</b> The cameras must see the beacon',
      out: 'PSN, and its own protocol',
      where: 'Touring, theatre, arena. The established one',
      note: 'Very accurate and it needs a rigging plan for the cameras. <b>A performer who walks behind scenery disappears, which has to be designed around rather than discovered.</b>',
    },
    {
      name: 'Zactrack', short: 'Zactrack', tone: 'safe',
      line: 'Ultra-wideband radio, often combined with IR.',
      tech: 'UWB ranging between a tag and fixed anchors',
      los: '<b>No</b>, which is the big practical difference',
      out: 'PSN',
      where: 'Theatre, television, anywhere sightlines are difficult',
      note: 'Not needing line of sight changes what is riggable. <b>UWB gives centimetre accuracy through scenery and people, which is exactly the case that defeats a camera system.</b>',
    },
    {
      name: 'Camera and markerless', short: 'Optical', tone: 'energy',
      line: 'Passive markers, or increasingly no markers at all.',
      tech: 'Computer vision, sometimes with machine learning',
      los: 'Yes',
      out: 'Varies. Often a bespoke bridge',
      where: 'Broadcast, virtual production, installations',
      note: 'Improving quickly and still the least predictable in a live environment. <b>Lighting changes are a genuine problem for a system whose sensor is a camera, which is an awkward constraint in a theatre.</b>',
    },
  ],
  footer: 'Ask any tracking supplier whether they output PSN. The answer decides how much integration work there is.',
}));

register('industrial-buses', (host) => compare(host, {
  title: 'The industrial world you will sit next to',
  sub: 'Themed entertainment and large installations put you beside automation engineers. Their vocabulary is different.',
  accent: 'signal',
  fields: [
    { key: 'is', label: 'What it is' },
    { key: 'det', label: 'Deterministic?' },
    { key: 'where', label: 'Where you meet it' },
    { key: 'learn', label: 'Worth learning?' },
  ],
  items: [
    {
      name: 'Modbus TCP', short: 'Modbus', tone: 'safe',
      line: 'Very simple register read and write, from 1979, still absolutely everywhere.',
      is: 'Read a register, write a register. That is essentially the whole protocol',
      det: 'No, but it is fast enough for supervisory work',
      where: 'Building systems, HVAC, simple machinery, sensors, house lighting panels',
      learn: '<b>Yes. This is the one to learn</b> if you go into themed entertainment',
      note: 'It is trivially simple, it is documented in a few pages, and it is often how a show controller reads a limit switch or writes a setpoint. <b>An afternoon with it is worth more than a week on any of the others.</b>',
    },
    {
      name: 'EtherCAT', short: 'EtherCAT', tone: 'energy',
      line: 'Very fast deterministic Ethernet-based fieldbus for motion.',
      is: 'A frame that passes through every device, each reading and writing on the fly',
      det: '<b>Yes, genuinely</b>, with cycle times in the tens of microseconds',
      where: 'Motion control, machinery, anything with a servo',
      learn: 'Recognise it. Its configuration is the machinery contractor\'s job',
      note: 'It uses Ethernet cabling and it is not an IP network: you cannot plug a laptop into it and expect anything. <b>Knowing that saves an embarrassing conversation.</b>',
    },
    {
      name: 'CANopen', short: 'CANopen', tone: 'signal',
      line: 'A deterministic bus from the automotive world, used for motion.',
      is: 'A short-message bus with priority arbitration',
      det: 'Yes, for its message classes',
      where: 'Motors, drives, animatronics',
      learn: 'Recognise it, and know it has a safety variant',
      note: 'CANopen Safety is one of the certified safety buses. <b>The ordinary version is not, and the distinction is not a configuration setting.</b>',
    },
    {
      name: 'OPC UA', short: 'OPC UA', tone: 'safe',
      line: 'A vendor-neutral industrial data model over TCP.',
      is: 'A structured, self-describing model of a plant\'s data, with security built in',
      det: 'No. It is a supervisory layer',
      where: 'Between PLCs and IT systems, dashboards, integration',
      learn: 'Yes, if you work on large permanent installations',
      note: 'This is the industrial world\'s answer to the problem this whole course is about: <b>a self-describing model so that two systems can interoperate without a bespoke integration.</b> It is what full ACN tried to be for entertainment.',
    },
    {
      name: 'MQTT', short: 'MQTT', tone: 'energy',
      line: 'Lightweight publish and subscribe over TCP.',
      is: 'Devices publish to topics on a broker; anything interested subscribes',
      det: 'No',
      where: 'Themed entertainment, installations, sensors and props reporting state across a large site',
      learn: 'Yes. It is increasingly how a large site knows what its own props are doing',
      note: 'The publish-and-subscribe model is a genuinely good fit for hundreds of small devices reporting status. <b>It is not a cue transport, and it is an excellent telemetry transport.</b>',
    },
    {
      name: 'BACnet, KNX, DALI-2', short: 'Building', tone: 'signal',
      line: 'The building\'s own systems, which your show will have to talk to.',
      is: 'HVAC, house lights, blinds, architectural fixtures',
      det: 'No',
      where: 'Front of house, foyers, anything the building owns rather than the production',
      learn: 'Know they exist and who owns them',
      note: 'House lights are frequently on a building system rather than on the lighting rig. <b>Finding out which, and who has to be asked, is a question for the survey rather than for the fit-up.</b>',
    },
  ],
  footer: 'If you go into themed entertainment, learn Modbus TCP properly and recognise the rest.',
}));

register('safety-levels', (host) => chain(host, {
  title: 'Why machinery safety is a separate discipline',
  sub: 'You will sit in meetings where this is discussed. Here is enough to be useful and to know where your responsibility stops.',
  tag: 'Step',
  accent: 'fault',
  stages: [
    {
      name: 'It is a calculated rating',
      body: 'Machinery that can hurt somebody is designed to a performance level under EN ISO 13849, or a safety integrity level under IEC 62061.',
      why: 'Those levels are calculated from the probability of a dangerous failure, not chosen from a menu.',
      note: 'That is the sentence that separates this from every other engineering decision in the building. <b>A performance level is a number that came out of a calculation about how often something will kill somebody, and it demands specific architectures.</b>',
    },
    {
      name: 'A single fault must be detected',
      body: 'Dual channels with cross-monitoring, so a shorted wire, a welded contact or a broken conductor is noticed before a second fault arrives.',
      why: 'A normally-open button on a cut cable reads as "not pressed", forever.',
      note: 'Safety circuits are wired so that a break reads as a <b>demand to stop</b>, which is the opposite convention from every convenience input in the building. <b>That inversion is deliberate and it is the whole idea.</b>',
    },
    {
      name: 'The standards that get cited',
      body: 'EN 17206 for machinery for stages and production areas in Europe. ANSI E1.6 for powered hoists, E1.43 for performer flying.',
      why: 'These will appear on any tender for powered flying, automation, lifts or revolves.',
      note: 'Knowing the numbers is worth real credibility in a production meeting. <b>Knowing that they exist and that somebody else signs them off is worth more.</b>',
    },
    {
      name: 'Safety buses are certified systems',
      body: 'PROFIsafe, Safety over EtherCAT, CIP Safety, CANopen Safety. Certified as a system, with the diagnostic coverage the standards require.',
      why: 'These are a different technology from the network in the rest of this module, not a configuration of it.',
      note: 'A safety bus is not something you set up. <b>It is designed and signed off by somebody qualified to do that, and the show network is not part of it.</b>',
    },
    {
      name: 'Your job is the boundary',
      body: 'The show network may send a machinery system a cue. It may read status back for display. Neither path may be capable of causing motion that the safety system would not permit.',
      why: 'Drawing that boundary explicitly is one of the most valuable lines on a system drawing.',
      note: 'You will be asked whether a stop can go on a VLAN because it is separate. <b>Say no in one sentence, and draw the boundary instead: a VLAN separates traffic on a shared best-effort infrastructure, and it does not make that infrastructure trustworthy when everything else has failed.</b>',
    },
  ],
  footer: 'Nothing that stops a machine to protect a person goes on the show network. Not a performance question, not a budget question.',
}));

register('media-over-ip', (host) => compare(host, {
  title: 'Media over IP, which is now most of the traffic',
  sub: 'The single biggest change since the standard text. Audio and video now share the network with control, and they dominate its load.',
  accent: 'signal',
  fields: [
    { key: 'layer', label: 'Layer' },
    { key: 'lat', label: 'Latency' },
    { key: 'clock', label: 'Clock' },
    { key: 'net', label: 'Network it needs' },
    { key: 'note2', label: 'The thing to know' },
  ],
  items: [
    {
      name: 'Dante', short: 'Dante', tone: 'safe',
      line: 'Proprietary, licensed to hundreds of manufacturers, overwhelmingly dominant in live audio.',
      layer: 'Layer 3, IP',
      lat: '0.25 to 5 ms, selectable',
      clock: 'PTPv2',
      net: 'Ordinary managed switches, with IGMP snooping and its own VLAN',
      note2: 'Dante redundancy is two physically separate networks, not a ring',
      note: 'Dante works on ordinary switches, which is the reason it won. <b>It also brought PTP into every venue, and with it a class of fault that had no precedent in analogue audio.</b>',
    },
    {
      name: 'AES67', short: 'AES67', tone: 'signal',
      line: 'The open interoperability standard between Dante, Ravenna, Livewire and Q-LAN.',
      layer: 'Layer 3, IP',
      lat: '0.25 to 5 ms',
      clock: 'PTPv2, media profile',
      net: 'The same, with the PTP profile matched',
      note2: '<b>A compatibility mode, not a product</b>',
      note: 'A Dante device in AES67 mode exchanges audio under restrictions: usually 48 kHz, usually 1 ms, often a subset of channels, and generally without Dante\'s own discovery and control. <b>Genuinely useful, and not the same as full interoperability.</b>',
    },
    {
      name: 'Milan / AVB', short: 'Milan', tone: 'safe',
      line: 'IEEE 802.1BA with genuine bandwidth reservation, and Milan is its certified professional profile.',
      layer: 'Layer 2',
      lat: 'Very low, and reserved',
      clock: 'gPTP, IEEE 802.1AS',
      net: '<b>AVB-capable switches end to end</b>',
      clockNote: '',
      note2: 'Genuinely deterministic, and that requirement slowed adoption for years',
      note: 'This is the only thing in this table that is actually deterministic rather than reliably fast. <b>The price is that every switch in the path must support it, which is exactly the constraint Ethernet won by not having.</b>',
    },
    {
      name: 'SMPTE ST 2110', short: 'ST 2110', tone: 'signal',
      line: 'Separate IP streams for video, audio and ancillary data.',
      layer: 'Layer 3, IP',
      lat: 'Sub-frame',
      clock: 'PTPv2 under ST 2059-2',
      net: '10 Gbit/s minimum, designed by somebody who does this',
      note2: 'ST 2110-7 is seamless protection: identical streams on two separate networks',
      note: 'Uncompressed 1080p60 is about 3 Gbit/s, so the network is not an afterthought. <b>A 2110 plant is a network engineering project with video attached, and the events industry mostly does not yet have that skill set.</b>',
    },
    {
      name: 'NDI', short: 'NDI', tone: 'energy',
      line: 'Compressed video that works on an ordinary gigabit network and finds itself.',
      layer: 'Layer 3, IP',
      lat: '1 to 3 frames',
      clock: 'None required',
      net: 'Ordinary gigabit, with mDNS discovery working',
      note2: 'Convenience bought with latency and a proprietary dependency',
      note: 'Full-bandwidth NDI at 1080p60 is roughly 100 to 150 Mbit/s, so sixteen sources is a real load. <b>NDI HX is a few Mbit/s and looks worse, and knowing which one somebody means is the whole capacity conversation.</b>',
    },
    {
      name: 'HDBaseT', short: 'HDBaseT', tone: 'fault',
      line: 'Not a network. A point-to-point cable extension for HDMI.',
      layer: 'Point to point, over Cat cable',
      lat: 'Sub-frame',
      clock: 'None',
      net: '<b>A dedicated cable run. It does not go through a switch</b>',
      note2: 'It uses RJ45 connectors and Cat cable, and it is not Ethernet',
      note: 'This confuses people every single year. <b>Plugging HDBaseT into a switch does not work, and the connector gives no clue, which is why it belongs on a labelled dedicated run.</b>',
    },
  ],
  footer: 'Audio and video are now the majority of the traffic on a show network, and they set the requirements the control traffic then has to live inside.',
}));

register('system-drawing', (host) => chain(host, {
  title: 'What a good system drawing has on it',
  sub: 'One page. This is the final exercise of the module, and it is a genuinely professional piece of work.',
  tag: 'Element',
  accent: 'safe',
  stages: [
    {
      name: 'One page, and it fits',
      body: 'If it needs three pages, it needs to be three drawings at different levels: an overview, a network detail, a control detail.',
      why: 'A drawing nobody can take in at a glance is a drawing nobody reads.',
      note: 'The overview is what goes on the machine room wall. <b>The details are what somebody opens when the overview has told them where to look.</b>',
    },
    {
      name: 'Names that match the labels',
      body: 'Every box is named the way it is labelled in the venue, and the way it is named in the software.',
      why: 'Three different names for one device is how an hour disappears.',
      note: 'A drawing whose names do not match the labels on the racks is <b>worse than no drawing</b>, because it actively misleads somebody under pressure.',
    },
    {
      name: 'Every line says what it is',
      body: 'sACN over fibre. MSC over RTP-MIDI. Contact closure. Dante primary. Dante secondary. DMX, universe 1 to 4.',
      why: 'This is the single highest-value thing on the page.',
      note: 'It is also the thing most drawings omit. <b>An unlabelled line tells you two boxes are connected, which you could have guessed. A labelled one tells you what to test.</b>',
    },
    {
      name: 'The three singular roles',
      body: 'DHCP server. IGMP querier. PTP grandmaster. Named, explicitly, on the drawing.',
      why: 'These are the three things nobody can find at 22:00, and each has a characteristic failure.',
      note: 'Two DHCP servers: some devices work and some do not, changing every power cycle. No querier: the rig degrades after five minutes. Two grandmasters: unexplained audio glitches. <b>Three lines prevent all three.</b>',
    },
    {
      name: 'The boundaries',
      body: 'Where the show network stops and the house network starts. Where the machinery contractor\'s safety system begins. Where the venue\'s responsibility ends and yours begins.',
      why: 'Every one of those boundaries is a place where two organisations assume the other one did it.',
      note: 'The machinery safety boundary is the most important line on the page. <b>Draw it, and write beside it that the show network may send a cue and read status and may not cause motion.</b>',
    },
    {
      name: 'The failure table',
      body: 'Every critical path: what happens if it fails, what the fallback is, and who acts.',
      why: 'This is the Five Questions applied to a system rather than to a protocol.',
      note: 'It is a page, it takes an hour, and it is <b>the document a production manager will actually read</b>. Very few people ever write one, and the ones who do get asked back.',
    },
  ],
  footer: 'Draw one for a production you have worked on. The lines you cannot label are the interesting ones.',
}));
