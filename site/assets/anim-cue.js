// Session 7: cueing between systems. MIDI as bytes, MSC, MMC, and the layer
// that has quietly replaced most of it.

import { register } from './anim-core.js';
import {
  figure, canvas, slider, toggle, choice, button, label, labelWrap, box, line,
  palette, alpha, fitter, compare, chain, role, node, arrow, flowDots, eng, sig,
} from './anim-kit.js';

const hx = (v) => v.toString(16).toUpperCase().padStart(2, '0');

register('midi-bytes', (host) => {
  let status = 0x90;
  let d1 = 60;
  let d2 = 100;

  const TYPES = {
    0x8: ['Note Off', ['note', 'velocity']],
    0x9: ['Note On', ['note', 'velocity']],
    0xA: ['Poly Aftertouch', ['note', 'pressure']],
    0xB: ['Control Change', ['controller', 'value']],
    0xC: ['Program Change', ['program']],
    0xD: ['Channel Aftertouch', ['pressure']],
    0xE: ['Pitch Bend', ['LSB', 'MSB']],
  };

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'The one rule that makes MIDI readable',
    sub: 'The top bit of every byte says whether it is a status byte or a data byte. That is why data stops at 127.',
    note: '',
  });

  const upd = () => {
    const hi = (status >> 4) & 0xF;
    const t = TYPES[hi];
    setNote(hi === 0xC
      ? `Program Change is two bytes: one status, one data. <b>It is the single most common way a MIDI-capable device is told to recall a cue, a snapshot or a preset: 128 values per channel across 16 channels gives 2048 distinct triggers, which is enough for a great many shows.</b>`
      : `<code>0x${hx(status)}</code> has its top bit set, so it is a <b>status byte</b>: ${t[0]} on channel ${(status & 0xF) + 1}. The bytes after it have the top bit clear, so they are data, 0 to 127. <b>The whole test is <code>byte &amp; 0x80</code>, and once you know it the protocol reads itself.</b>`);
    cv.once();
  };

  controls.append(choice('Message', Object.entries(TYPES).map(([k, v]) => [Number(k) * 16, v[0]]), {
    value: 0x90, on: (v) => { status = (status & 0x0F) | Number(v); upd(); },
  }).node);
  controls.append(slider('Channel', {
    min: 1, max: 16, step: 1, value: 1, on: (v) => { status = (status & 0xF0) | (v - 1); upd(); },
  }).node);
  controls.append(slider('Data 1', { min: 0, max: 127, step: 1, value: 60, on: (v) => { d1 = v; upd(); } }).node);
  controls.append(slider('Data 2', { min: 0, max: 127, step: 1, value: 100, on: (v) => { d2 = v; upd(); } }).node);

  challenge('Build the message a console would send to recall preset 7.',
    () => ((status >> 4) & 0xF) === 0xC && d1 === 7);

  const cv = canvas(stage, {
    height: 292, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const hi = (status >> 4) & 0xF;
      const t = TYPES[hi];
      const bytes = hi === 0xC || hi === 0xD ? [status, d1] : [status, d1, d2];

      // The bytes, with their top bits highlighted.
      const bw = Math.min(150, (w - pad * 2 - 20) / 3);
      bytes.forEach((b, i) => {
        const x = pad + i * (bw + 10);
        const isStatus = !!(b & 0x80);
        box(g, x, 40, bw, 84, {
          fill: alpha(isStatus ? R.energy : R.signal, 0.14),
          stroke: isStatus ? R.energy : R.signal, r: 8, lw: 2,
        });
        label(g, `0x${hx(b)}`, x + bw / 2, 58, {
          color: p.ink, size: 17, align: 'center', weight: 700, mono: true, max: bw - 10,
        });
        // Bits, with the top one separated.
        const nb = 8, nbw = Math.min(15, (bw - 24) / nb);
        for (let k = 0; k < nb; k++) {
          const bit = (b >> (7 - k)) & 1;
          const bx = x + (bw - nb * nbw) / 2 + k * nbw + (k === 0 ? 0 : 4);
          box(g, bx, 70, nbw - 1, 18, {
            fill: bit ? alpha(k === 0 ? R.energy : p.ink2, 0.4) : alpha(p.line, 0.3), stroke: k === 0 ? alpha(R.energy, 0.8) : 'transparent', r: 2,
          });
          if (nbw > 10) {
            label(g, String(bit), bx + nbw / 2, 79, {
              color: bit ? p.ink : p.muted, size: 8.5, align: 'center', mono: true,
            });
          }
        }
        label(g, isStatus ? 'STATUS · top bit set' : 'data · top bit clear', x + bw / 2, 98, {
          color: isStatus ? R.energy : R.signal, size: 9.5, align: 'center', weight: 600, max: bw - 8,
        });
        label(g, isStatus ? `${t[0]}, ch ${(b & 0xF) + 1}` : `${t[1][i - 1]} = ${b}`, x + bw / 2, 114, {
          color: p.ink2, size: 10, align: 'center', max: bw - 8,
        });
      });

      // The decoded message.
      const dy = 142;
      box(g, pad, dy, w - pad * 2, 34, { fill: alpha(R.safe, 0.1), stroke: alpha(R.safe, 0.5), r: 7 });
      const argTxt = t[1].map((nm, i) => `${nm} ${bytes[i + 1]}`).join(', ');
      label(g, `${t[0]}, channel ${(status & 0xF) + 1}: ${argTxt}`, pad + 12, dy + 17, {
        color: R.safe, size: 12.5, weight: 700, max: w - pad * 2 - 24,
      });

      // The rule and the timing.
      const rows = [
        ['The test', 'byte & 0x80 — non-zero means status'],
        ['Status range', '0x80 to 0xFF, that is 128 to 255'],
        ['Data range', '0x00 to 0x7F, that is 0 to 127'],
        ['On the wire', `${bytes.length} bytes × 10 bits ÷ 31,250 = ${sig((bytes.length * 10 / 31250) * 1000)} ms`],
      ];
      let y = dy + 52;
      const keyW = Math.min(120, w * 0.28);
      for (const [k, v] of rows) {
        label(g, k, pad, y, { color: p.muted, size: 10.5, max: keyW - 8 });
        label(g, v, pad + keyW, y, { color: p.ink2, size: 10.5, mono: true, max: w - pad * 2 - keyW });
        y += 18;
      }
    },
  });
  upd();
});

register('running-status', (host) => {
  let on = false;
  let joinLate = false;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Running status, and why a parser has to be a state machine',
    sub: 'An optimisation from when bytes were expensive. Turn it on, then join the stream halfway through.',
    note: '',
  });

  const upd = () => {
    setNote(!on
      ? 'Every message carries its own status byte, so a receiver joining at any point can find its place at the next byte with the top bit set. <b>Verbose, and completely self-describing.</b>'
      : joinLate
        ? '<b>A receiver that joins mid-run has no status byte and cannot parse anything until the next one arrives.</b> It sees a stream of data bytes belonging to a message it never saw. This is why a MIDI parser must be a state machine remembering the last status byte, and it is a real source of bugs.'
        : 'With running status, consecutive messages of the same type omit the repeated status byte, saving a third of the bandwidth on dense data. <b>You will not use it deliberately. You need to recognise it in a monitor, where a stream of bare data bytes is not a fault.</b>');
    cv.once();
  };

  controls.append(toggle('Running status', { value: false, on: (v) => { on = v; upd(); } }).node);
  controls.append(toggle('Receiver joins mid-stream', { value: false, on: (v) => { joinLate = v; upd(); } }).node);

  challenge('Show a receiver that cannot parse a perfectly valid stream.', () => on && joinLate);

  const cv = canvas(stage, {
    height: 292, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const NOTES = [[60, 100], [62, 96], [64, 92], [65, 88]];

      const stream = [];
      NOTES.forEach(([n, v], i) => {
        if (!on || i === 0) stream.push({ b: 0x90, s: true });
        stream.push({ b: n, s: false });
        stream.push({ b: v, s: false });
      });

      const joinAt = joinLate ? 4 : 0;
      const bw = Math.min(48, (w - pad * 2 - (stream.length - 1) * 4) / stream.length);
      const y = 56;

      label(g, on ? 'with running status' : 'every message carries its status byte', pad, 26,
        { color: p.ink2, size: 11.5, weight: 600, max: w - pad * 2 });

      stream.forEach((x, i) => {
        const bx = pad + i * (bw + 4);
        const before = i < joinAt;
        const tone = x.s ? R.energy : R.signal;
        box(g, bx, y, bw, 40, {
          fill: alpha(before ? p.muted : tone, before ? 0.05 : 0.16),
          stroke: alpha(before ? p.muted : tone, before ? 0.25 : 0.7), r: 5,
        });
        label(g, hx(x.b), bx + bw / 2, y + 15, {
          color: before ? p.muted : p.ink, size: 11, align: 'center', weight: 600, mono: true, max: bw - 4,
        });
        label(g, x.s ? 'status' : 'data', bx + bw / 2, y + 30, {
          color: before ? p.muted : tone, size: 8.5, align: 'center', max: bw - 4,
        });
      });

      if (joinLate) {
        const jx = pad + joinAt * (bw + 4) - 2;
        line(g, jx, y - 12, jx, y + 52, { color: R.fault, lw: 2 });
        label(g, 'receiver joins here', jx + 4, y - 18, { color: R.fault, size: 10, weight: 600, max: w - jx - pad });
      }

      // What the receiver makes of it.
      const ry = y + 72;
      label(g, 'what the receiver can parse', pad, ry, { color: p.muted, size: 10, weight: 600 });
      const visible = stream.slice(joinAt);
      let lastStatus = null;
      const parsed = [];
      let pending = [];
      for (const x of visible) {
        if (x.s) { lastStatus = x.b; pending = []; continue; }
        if (lastStatus === null) { parsed.push({ ok: false, t: `${hx(x.b)} — orphan` }); continue; }
        pending.push(x.b);
        if (pending.length === 2) { parsed.push({ ok: true, t: `Note On ${pending[0]} vel ${pending[1]}` }); pending = []; }
      }
      if (!parsed.length) parsed.push({ ok: false, t: 'nothing at all' });
      parsed.slice(0, 5).forEach((x, i) => {
        const py = ry + 14 + i * 22;
        box(g, pad, py, Math.min(320, w - pad * 2), 18, {
          fill: alpha(x.ok ? R.safe : R.fault, 0.1), stroke: alpha(x.ok ? R.safe : R.fault, 0.55), r: 4,
        });
        label(g, x.t, pad + 8, py + 10, { color: x.ok ? p.ink2 : R.fault, size: 10.5, mono: true, max: 300 });
      });

      const saved = on ? NOTES.length - 1 : 0;
      label(g, on
        ? `${saved} status byte${saved === 1 ? '' : 's'} saved, which is ${sig((saved / (NOTES.length * 3)) * 100)}% of the stream. At 31.25 kbit/s in 1983 that mattered a great deal.`
        : 'Self-describing at every byte, at the cost of a third more traffic.',
      pad, ry + 14 + Math.min(parsed.length, 5) * 22 + 12, { color: p.muted, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});

register('midi-transports', (host) => compare(host, {
  title: 'Four ways to carry MIDI',
  sub: 'The 1983 connector has one genuine advantage that none of its replacements have.',
  accent: 'signal',
  fields: [
    { key: 'rate', label: 'Rate' },
    { key: 'lat', label: 'Latency' },
    { key: 'iso', label: 'Isolation' },
    { key: 'where', label: 'Where it belongs' },
    { key: 'watch', label: 'Watch out for', tone: 'fault' },
  ],
  items: [
    {
      name: '5-pin DIN', short: 'DIN', tone: 'safe',
      line: 'Current loop at 31.25 kbit/s, and still on show equipment forty years later.',
      rate: '31.25 kbit/s',
      lat: 'About 1 ms for a three-byte message',
      iso: '<b>Opto-isolated by specification</b>',
      where: 'Between two pieces of show equipment in the same area',
      watch: 'Practical length is around 15 m; a longer run through a patch panel corrupts occasional SysEx messages',
      note: 'The isolation is not a small thing in this industry. <b>A DIN MIDI link between a lighting console and a sound rack introduces no ground path, which is more than can be said for a USB cable or, in many installations, an Ethernet cable.</b>',
    },
    {
      name: 'USB-MIDI', short: 'USB', tone: 'energy',
      line: 'The default for anything involving a computer.',
      rate: 'USB speed, so effectively unlimited for MIDI',
      lat: 'Sub-millisecond',
      iso: 'None. The device shares ground with the host',
      where: 'A control surface on a desk next to the machine',
      watch: 'Enumeration is not stable across a power glitch: a device can come back as a different port name, and show software addressing it by port has now lost it',
      note: 'Fine where it is short and where a human is present. <b>As the transport for a cue that has to happen, it is a last resort, because both its failure modes are silent.</b>',
    },
    {
      name: 'RTP-MIDI', short: 'RTP-MIDI', tone: 'safe',
      line: 'RFC 6295. MIDI over UDP with sequence numbers and recovery, built into macOS and Windows.',
      rate: 'Network speed',
      lat: 'Sub-millisecond plus the network',
      iso: 'Whatever the network provides, which on fibre is complete',
      where: '<b>MIDI between positions in a venue, in 2026</b>',
      watch: 'It is a network service, so it inherits the network\'s problems: VLANs, discovery, and a switch that has to be configured',
      note: 'This is the modern answer to the distance and cable-count problem, and it is a published RFC rather than a manufacturer\'s idea. <b>An increasing amount of show equipment supports it directly.</b>',
    },
    {
      name: 'MIDI 2.0 / UMP', short: 'MIDI 2.0', tone: 'signal',
      line: '32-bit resolution, bidirectional negotiation, 256 channels, and a new packet format.',
      rate: 'Varies by transport',
      lat: 'Varies',
      iso: 'Varies',
      where: 'Instruments and operating systems today. Not yet show control',
      watch: 'No console or show controller has shipped an MSC-over-MIDI-2.0 implementation, and MSC itself has not been revised',
      note: 'Real, ratified and shipping, and not yet relevant to this session. <b>Watch it; do not design around it. What will change show control in the next few years is that everything now has an Ethernet port and an API.</b>',
    },
  ],
  footer: 'For MIDI between two rooms in a venue today, RTP-MIDI. For a cue that must not fail, a contact closure alongside whatever else you chose.',
}));

register('msc-message', (host) => {
  let dev = 1;
  let fmt = 0x01;
  let cmd = 0x01;
  let cue = '12.5';

  const FMT = { 0x01: 'Lighting, general', 0x02: 'Moving lights', 0x05: 'Lasers', 0x10: 'Sound, general', 0x20: 'Machinery, general', 0x30: 'Video, general', 0x60: 'Pyrotechnics', 0x7F: 'All types' };
  const CMD = { 0x01: 'GO', 0x02: 'STOP', 0x03: 'RESUME', 0x04: 'TIMED_GO', 0x05: 'LOAD', 0x07: 'FIRE', 0x08: 'ALL_OFF' };

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Build an MSC message by hand',
    sub: 'A System Exclusive message with a reserved ID. Build one, send it once, and the protocol becomes permanent.',
    note: '',
  });

  const bytes = () => {
    const out = [0xF0, 0x7F, dev, 0x02, fmt, cmd];
    for (const ch of cue.replace(/[^0-9.]/g, '')) out.push(ch.charCodeAt(0));
    out.push(0xF7);
    return out;
  };

  const upd = () => {
    const b = bytes();
    setNote(!cue
      ? 'With no cue data at all, the message means <b>"the next cue"</b>, which is how most simple MSC integrations actually run: a single repeated GO. <b>It is also fire and forget: there is no acknowledgement in any implementation you will meet, so nothing tells you whether it happened.</b>'
      : `${b.length} bytes, ${sig((b.length * 10 / 31250) * 1000)} ms on a DIN cable. The cue number is <b>ASCII digits and full stops</b>, which is why "${cue}" becomes ${cue.split('').map((c) => hx(c.charCodeAt(0))).join(' ')}. <b>Device ${dev === 0x7F ? '127 is all-call, so every device acts on it, filtered only by the command format' : `${dev} is the only device that acts on it`}.</b>`);
    cv.once();
  };

  controls.append(slider('Device ID', { min: 0, max: 127, step: 1, value: 1, fmt: (v) => (v === 127 ? '127 all-call' : String(v)), on: (v) => { dev = v; upd(); } }).node);
  controls.append(choice('Format', Object.entries(FMT).map(([k, v]) => [k, v.split(',')[0]]), {
    value: '1', on: (v) => { fmt = Number(v); upd(); },
  }).node);
  controls.append(choice('Command', Object.entries(CMD).map(([k, v]) => [k, v]), {
    value: '1', on: (v) => { cmd = Number(v); upd(); },
  }).node);
  controls.append(choice('Cue', [['12.5', '12.5'], ['7', '7'], ['', 'none — next cue']], {
    value: '12.5', on: (v) => { cue = v; upd(); },
  }).node);

  challenge('Send a GO to every device on the line at once.', () => dev === 127 && cmd === 0x01);

  const cv = canvas(stage, {
    height: 300, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const b = bytes();

      const roles = [
        { i: 0, n: 'F0', d: 'SysEx start', col: R.energy },
        { i: 1, n: '7F', d: 'universal real-time', col: R.energy },
        { i: 2, n: hx(dev), d: `device ${dev === 127 ? '127, all-call' : dev}`, col: R.signal },
        { i: 3, n: '02', d: 'sub-ID: this is MSC', col: R.energy },
        { i: 4, n: hx(fmt), d: FMT[fmt] || 'format', col: R.safe },
        { i: 5, n: hx(cmd), d: CMD[cmd] || 'command', col: R.safe },
      ];
      const cueBytes = b.slice(6, b.length - 1);
      cueBytes.forEach((cb, k) => roles.push({ i: 6 + k, n: hx(cb), d: `'${String.fromCharCode(cb)}'`, col: p.ink2 }));
      roles.push({ i: b.length - 1, n: 'F7', d: 'SysEx end', col: R.energy });

      // The byte strip.
      const bw = Math.min(46, (w - pad * 2 - (roles.length - 1) * 4) / roles.length);
      roles.forEach((r, k) => {
        const x = pad + k * (bw + 4);
        box(g, x, 44, bw, 36, { fill: alpha(r.col, 0.16), stroke: alpha(r.col, 0.7), r: 5 });
        label(g, r.n, x + bw / 2, 62, {
          color: p.ink, size: 12, align: 'center', weight: 700, mono: true, max: bw - 4,
        });
      });
      label(g, 'the message on the wire', pad, 32, { color: p.muted, size: 10 });

      // The field key.
      let y = 100;
      const keyW = 44;
      roles.forEach((r) => {
        if (y > 286) return;
        label(g, r.n, pad, y, { color: r.col, size: 11, weight: 700, mono: true, max: keyW - 6 });
        label(g, r.d, pad + keyW, y, { color: p.ink2, size: 10.5, max: w * 0.45 });
        y += 17;
      });

      // Summary panel.
      const sx = pad + Math.max(w * 0.5, 230);
      const sw = w - sx - pad;
      if (sw > 130) {
        box(g, sx, 100, sw, 128, { fill: alpha(p.line, 0.2), stroke: p.line, r: 8 });
        const rows = [
          ['Bytes', String(b.length)],
          ['On DIN', `${sig((b.length * 10 / 31250) * 1000)} ms`],
          ['Confirmed?', 'No. Fire and forget'],
          ['Error check', 'None'],
          ['Data encoding', 'ASCII, 0x00 separated'],
          ['Minimum set', 'GO, STOP, RESUME'],
        ];
        let sy = 118;
        rows.forEach(([k, v]) => {
          label(g, k, sx + 10, sy, { color: p.muted, size: 10, max: sw * 0.5 });
          label(g, v, sx + sw - 10, sy, { color: p.ink2, size: 10.5, align: 'right', mono: true, max: sw * 0.5 });
          sy += 19;
        });
      }
    },
  });
  upd();
});

register('msc-commands', (host) => compare(host, {
  title: 'The MSC commands, and which ones actually exist',
  sub: 'The specification is generous. Implementations are not, and there is a recommended minimum for a reason.',
  accent: 'safe',
  fields: [
    { key: 'code', label: 'Code' },
    { key: 'does', label: 'What it does' },
    { key: 'real', label: 'Support in practice' },
  ],
  items: [
    {
      name: 'GO, STOP, RESUME', short: 'The minimum', tone: 'safe',
      line: 'The recommended minimum set. What a device must implement to claim MSC support.',
      code: '<code>0x01</code>, <code>0x02</code>, <code>0x03</code>',
      does: 'Execute the cue, halt, continue from a halt',
      real: 'Effectively universal. If a product claims MSC, it has these',
      note: 'Design around these three and nothing else, unless you have tested the rest on the actual equipment. <b>Anything beyond the minimum set is a question to ask the manufacturer rather than an assumption to make.</b>',
    },
    {
      name: 'TIMED_GO and LOAD', short: 'Timed, load', tone: 'signal',
      line: 'Execute over a specified time, or prepare a cue without executing it.',
      code: '<code>0x04</code>, <code>0x05</code>',
      does: 'A fade time in the message; or arm the cue so the GO is instantaneous',
      real: 'Partial. Common on lighting consoles, rarer elsewhere',
      note: 'LOAD is genuinely useful for anything with a long preparation, such as a media server that has to seek. <b>Check it works before the technical rehearsal rather than during it.</b>',
    },
    {
      name: 'SET and FIRE', short: 'Set, fire', tone: 'energy',
      line: 'Set a control to a value, or run a macro.',
      code: '<code>0x06</code>, <code>0x07</code>',
      does: 'The only way MSC can express a value rather than an event',
      real: 'Sparse and inconsistent',
      note: 'MSC is a pure command protocol with SET bolted on, and it shows. <b>If you need to send values, you want OSC, not MSC.</b>',
    },
    {
      name: 'ALL_OFF, RESTORE, RESET', short: 'Panic', tone: 'fault',
      line: 'Everything off non-destructively, undo that, or return to a defined state.',
      code: '<code>0x08</code>, <code>0x09</code>, <code>0x0A</code>',
      does: 'The panic and recovery commands',
      real: 'Variable, and the behaviour differs enough between products to be dangerous',
      note: 'These are exactly the commands you would want to rely on in an emergency, and exactly the ones least consistently implemented. <b>Test them, on the actual rig, and write down what each device does.</b>',
    },
    {
      name: 'Cue list management', short: 'Lists', tone: 'fault',
      line: 'Open, close and go with explicit cue lists and paths.',
      code: '<code>0x10</code> to <code>0x1F</code>',
      does: 'Multi-list operation, for systems running several sequences at once',
      real: 'Rare, and two products that both claim MSC will disagree about it',
      note: 'This is where MSC interoperability actually breaks down. <b>Two products that both implement MSC will differ on whether the cue number is required, what happens on an unknown command, and how a cue list is addressed.</b>',
    },
  ],
  footer: 'The command format field means one MIDI cable can carry cues for several departments and each ignores the others.',
}));

register('mmc-transport', (host) => compare(host, {
  title: 'MMC, and the one thing it has that MSC does not',
  sub: 'MIDI Machine Control was for tape machines, and that world has gone. One feature is worth knowing about.',
  accent: 'signal',
  fields: [
    { key: 'code', label: 'Code' },
    { key: 'does', label: 'What it does' },
    { key: 'now', label: 'Where you meet it now' },
  ],
  items: [
    {
      name: 'Transport commands', short: 'Transport', tone: 'signal',
      line: 'STOP, PLAY, DEFERRED PLAY, FAST FORWARD, REWIND, RECORD, PAUSE.',
      code: '<code>0x01</code> to <code>0x09</code>',
      does: 'Drives a machine\'s transport, the way a remote drives a tape deck',
      now: 'DAWs controlling each other, some playback software, older broadcast and installation equipment',
      note: 'Same SysEx structure as MSC: <code>F0 7F device 06 command F7</code>. <b>Sub-ID 06 is a command and 07 is a response, which is the interesting part.</b>',
    },
    {
      name: 'LOCATE', short: 'LOCATE', tone: 'energy',
      line: 'Go to a specified timecode position.',
      code: '<code>0x44</code>',
      does: 'Carries a timecode value, so the machine can seek rather than shuttle',
      now: 'Anywhere a controller needs to put a playback machine at a specific point',
      note: 'This is the command that made MMC useful, because it is the difference between "rewind" and "go to 01:23:45:00". <b>It is also why MMC and timecode are usually discussed together.</b>',
    },
    {
      name: 'The response mechanism', short: 'Responses', tone: 'safe',
      line: 'Sub-ID 07 messages carry replies, so a controller can ask a machine where it is.',
      code: '<code>F0 7F dev 07 …</code>',
      does: 'A genuine return path, which MSC does not have at all',
      now: 'Used more for synchronisation than for show control',
      note: 'This is the fourth of the Five Questions, answered by a 1992 protocol in a way MSC never was. <b>MMC can tell you where the machine actually is; MSC cannot tell you whether the cue happened.</b>',
    },
    {
      name: 'Why it faded', short: 'Why it faded', tone: 'fault',
      line: 'Its job was controlling tape machines from a sequencer.',
      code: '—',
      does: '—',
      now: 'The world it was built for no longer exists',
      note: 'File-based playback removed the transport as a physical thing to control. <b>What replaced it is a manufacturer\'s API, or OSC, and the modern equivalent of LOCATE is an HTTP request that returns a status code.</b>',
    },
  ],
  footer: 'Recognise it, and reach for OSC or an API instead unless you are talking to something old.',
}));

register('cue-paths', (host) => compare(host, {
  title: 'Seven ways to get a cue from A to B',
  sub: 'Choose on purpose. For each one, write down what happens if it is lost.',
  accent: 'signal',
  fields: [
    { key: 'lat', label: 'Latency' },
    { key: 'conf', label: 'Confirmed?' },
    { key: 'dep', label: 'Depends on' },
    { key: 'use', label: 'Use it when' },
    { key: 'lost', label: 'If it is lost', tone: 'fault' },
  ],
  items: [
    {
      name: 'Contact closure', short: 'Contact', tone: 'safe',
      line: 'Two pieces of metal. Closed means go.',
      lat: 'Sub-millisecond',
      conf: 'No',
      dep: 'A pair of wires. Nothing else',
      use: '<b>The one cue that absolutely must happen</b>',
      lost: 'A cut cable does not close, and a shorted one closes and stays closed. Both are diagnosable with a meter in four seconds',
      note: 'It carries one bit, which is exactly the right amount for GO. <b>Its limitation is expressiveness, not reliability, and on the night it is the thing most likely to work.</b>',
    },
    {
      name: 'MSC over DIN', short: 'MSC DIN', tone: 'signal',
      line: 'A SysEx message on a 5-pin MIDI cable.',
      lat: '2 to 5 ms',
      conf: 'No',
      dep: 'A MIDI cable under about 15 m, and both products implementing MSC compatibly',
      use: 'Two pieces of show equipment that both support it, with no network needed',
      lost: 'The cue never happened, and nothing at either end notices',
      note: 'Opto-isolated by specification, which is a real advantage. <b>Beyond about 15 m, particularly through a patch panel, occasional SysEx messages arrive truncated and are silently discarded.</b>',
    },
    {
      name: 'MSC over RTP-MIDI', short: 'MSC net', tone: 'signal',
      line: 'The same message, carried over the network.',
      lat: '1 to 5 ms',
      conf: 'No',
      dep: 'The control VLAN being healthy',
      use: 'The same integration, across a building',
      lost: 'The cue never happened',
      note: 'This removes the distance and cable-count problem entirely and keeps the protocol compatibility. <b>It is the right way to run MSC in 2026.</b>',
    },
    {
      name: 'OSC over UDP', short: 'OSC UDP', tone: 'energy',
      line: 'A human-readable address and typed arguments, sent to a port.',
      lat: 'Under 5 ms',
      conf: 'No',
      dep: 'The network, and a documented address list for that specific product',
      use: 'The general case. Fast, flexible, and bespoke per product',
      lost: 'The cue never happened',
      note: 'OSC specifies an encoding, not a vocabulary. <b>Every integration is bespoke and its deliverable is a documented address list kept with the show file.</b>',
    },
    {
      name: 'OSC over TCP', short: 'OSC TCP', tone: 'energy',
      line: 'The same message on a connection that acknowledges.',
      lat: '5 to 30 ms',
      conf: 'Delivery only, not execution',
      dep: 'The network, plus a connection that must be established and maintained',
      use: 'When loss is unacceptable and a few milliseconds does not matter',
      lost: 'Retransmitted, or the connection drops and you find out',
      note: 'Two framings exist for OSC over TCP, length-prefixed and SLIP, <b>and they are not compatible</b>. That is a real interoperability trap.',
    },
    {
      name: 'HTTP or WebSocket', short: 'HTTP', tone: 'safe',
      line: 'A request to a device\'s API, which returns a status code.',
      lat: '10 to 100 ms',
      conf: '<b>Yes, with a status code</b>',
      dep: 'The network and the device\'s web service',
      use: 'Configuration, arming, loading, anything not tightly timed that you want to log',
      lost: 'You know. That property is rare and valuable',
      note: 'Too slow for a tightly timed cue and completely fine for "load the next scene". <b>It is the only common option that tells you whether it worked.</b>',
    },
    {
      name: 'Timecode', short: 'Timecode', tone: 'signal',
      line: 'Not a cue at all: a clock everything runs against.',
      lat: 'Frame accurate',
      conf: 'No',
      dep: 'A generator, and every device agreeing the frame rate and the drop-frame setting',
      use: 'Anything locked to fixed media',
      lost: 'Devices freewheel, then stop, and somebody calls it manually',
      note: 'Timecode is a clock, not an event, and that distinction causes a great many design mistakes. <b>Using an event where a clock was needed shows as things that start together and drift.</b>',
    },
  ],
  footer: 'For any cue path, write down which of these it is and what happens if it is lost. If the answer is "the show stops", it should be on a contact closure or have one alongside.',
}));

register('companion-layer', (host) => chain(host, {
  title: 'Why a translation layer exists, and what it costs',
  sub: 'The practical reality of cue interchange in 2026 is a box in the middle that speaks everything.',
  tag: 'Step',
  accent: 'energy',
  stages: [
    {
      name: 'The problem: n squared',
      body: 'Six systems, each speaking a different protocol, needs up to fifteen pairwise integrations, and each one has to be built, tested and maintained.',
      why: 'Every pair is a separate piece of work, and every firmware update can break any of them.',
      note: 'This is complexity that came from the process rather than from the show. <b>It is principle five: convolution, inherited, and it is a candidate for deletion.</b>',
    },
    {
      name: 'The answer: one translator',
      body: 'One box knows about all six protocols. Six integrations instead of fifteen, and one place to look when something is wrong.',
      why: 'The translation lives in one documented place rather than being spread across six devices.',
      note: 'Complexity contained rather than convoluted. <b>This is principle five in action, and it is why every serious installation has one of these whether or not anybody calls it that.</b>',
    },
    {
      name: 'What that box actually is',
      body: 'Bitfocus Companion with a Stream Deck, free and open source, on a very large number of productions. Or a show controller: Medialon, Alcorn McBride, Pharos, 7thSense, Q-SYS. Or QLab, which is the de facto show controller in a great deal of theatre.',
      why: 'The difference between them is reliability engineering and price, not capability.',
      note: 'Companion has hundreds of device modules and turns any button into any protocol. <b>A show controller for a permanent installation is a different product with a different lifetime, and the price reflects that rather than the feature list.</b>',
    },
    {
      name: 'The cost: a single point of failure',
      body: 'Everything now goes through one box, and that box is very often a laptop.',
      why: 'Principle two: name the single point of failure out loud.',
      note: 'Treat it like one. <b>A spare, a configuration in version control, and a fallback somebody has actually practised.</b> A Companion configuration is a file: back it up the way you back up a show file.',
    },
    {
      name: 'And the cue that must not fail',
      body: 'Alongside all of it, a contact closure for the one moment where nothing else will do.',
      why: 'It has no dependencies at all: no network, no configuration, no firmware, no box in the middle.',
      note: 'This is not nostalgia. <b>It is the fifth question answered honestly for the one cue whose failure stops the show, and it costs a pair of wires.</b>',
    },
  ],
  footer: 'One translator, backed up and rehearsed, plus a hard-wired path for the moment that matters.',
}));
