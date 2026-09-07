// Session 3: how a bit crosses a gap. Layering, framing, error detection, and
// the three physical media.

import { register } from './anim-core.js';
import {
  figure, canvas, slider, toggle, choice, button, label, labelWrap, box, line,
  palette, alpha, fitter, compare, chain, ladder, role, node, arrow, flowDots, eng, sig,
} from './anim-kit.js';

register('layer-ladder', (host) => chain(host, {
  title: 'The ladder you climb when something breaks',
  sub: 'Not seven things to memorise. A search order: start at the bottom, go up, stop at the first thing that fails.',
  tag: 'Layer',
  accent: 'signal',
  stages: [
    {
      name: '1 · Physical',
      body: 'Copper, fibre, radio. Voltages, light, and whether anything is connected at all.',
      why: 'Test: is there a link light? Are the switch port counters clean?',
      note: 'Rising CRC errors on a switch port is a layer 1 fault, and no amount of configuration above it will help. <b>Read the counters early: they do not have opinions.</b>',
    },
    {
      name: '2 · Data link',
      body: 'MAC addresses and Ethernet frames. Getting a frame from one box to the next box on the same network.',
      why: 'Test: does the switch show the MAC? Does arp -a have an entry?',
      note: 'A device present at layer 2 and unreachable at layer 3 is a completely different fault from a device that is not there at all. <b>arp -a distinguishes them in four seconds.</b>',
    },
    {
      name: '3 · Network',
      body: 'IP addresses and routing. Getting a packet from one network to another.',
      why: 'Test: does it ping? Does it ping the gateway?',
      note: 'Many devices do not answer ping at all, by design or by firewall. <b>A device that ignores ping and works perfectly is common, which is why layer 2 gets checked before you conclude anything.</b>',
    },
    {
      name: '4 · Transport',
      body: 'TCP or UDP, ports, and whether the program at the far end is listening.',
      why: 'Test: is the port open? Does a capture show packets arriving on it?',
      note: 'This is where "the device is there and the application does not see it" gets resolved. <b>A capture on the right port is worth more than any amount of guessing at the application.</b>',
    },
    {
      name: '5, 6, 7 · The rest',
      body: 'Session, presentation and application. In practice these are absorbed into the software.',
      why: 'Test: does the console see the fixture? That is the symptom, not the fault.',
      note: 'Layer 7 is where the problem <b>appears</b>, not where it <b>is</b>. <b>Almost every fault reported as an application problem is resolved somewhere in layers 1 to 4.</b>',
    },
    {
      name: 'The property that matters',
      body: 'Each layer talks to the same layer at the far end as if the layers below did not exist, and any layer can be swapped without disturbing its neighbours.',
      why: 'This is why DMX runs over copper, fibre, radio and IP and the fixtures cannot tell.',
      note: 'Hold on to the swap property: it is the entire reason the second half of this course exists. <b>sACN is DMX\'s data model with the bottom layers replaced by Ethernet and IP.</b>',
    },
  ],
  footer: 'Four tests: link light, MAC, IP, port. That is the model earning its keep.',
}));

register('encoding-bytes', (host) => {
  let text = 'Cue 12';
  const SAMPLES = ['Cue 12', 'Café', '燈光', 'Cue 12 燈光'];
  let idx = 0;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'How many bytes is a character?',
    sub: 'UTF-8 gives plain English exactly one byte per character, and everything else more. A field that says "16 characters" often means 16 bytes.',
    note: '',
  });

  const bytesOf = (s) => Array.from(new TextEncoder().encode(s));

  const upd = () => {
    const chars = Array.from(text).length;
    const bytes = bytesOf(text).length;
    setNote(bytes === chars
      ? `Every character here is one byte, because the first 128 UTF-8 values are identical to ASCII. <b>This is why plain English text is byte-for-byte the same in both encodings, and why old equipment handles it correctly.</b>`
      : `${chars} characters, ${bytes} bytes. A field limited to 16 <i>bytes</i> would hold ${Math.floor(16 / (bytes / chars))} of these characters, and equipment that assumes one byte per character will truncate mid-character and show a replacement glyph. <b>Name things in ASCII in a show file: it is not a cultural statement, it is that the tenth device in the chain is running firmware from 2011.</b>`);
    cv.once();
  };

  controls.append(choice('Text', SAMPLES.map((s, i) => [i, s]), {
    value: 0, on: (v) => { idx = Number(v); text = SAMPLES[idx]; upd(); },
  }).node);

  challenge('Find a string where the byte count is more than double the character count.',
    () => bytesOf(text).length >= Array.from(text).length * 2);

  const cv = canvas(stage, {
    height: 300, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const chars = Array.from(text);
      const enc = new TextEncoder();

      label(g, `"${text}"  ·  ${chars.length} characters  ·  ${enc.encode(text).length} bytes`,
        pad, 22, { color: p.ink, size: 12, max: w - pad * 2 });

      let x = pad;
      const y = 50;
      for (const ch of chars) {
        const bs = Array.from(enc.encode(ch));
        const cw = Math.max(46, bs.length * 40);
        if (x + cw > w - pad) break;
        const multi = bs.length > 1;
        box(g, x, y, cw, 40, {
          fill: alpha(multi ? R.energy : R.signal, 0.14),
          stroke: multi ? R.energy : R.signal, r: 7,
        });
        label(g, ch, x + cw / 2, y + 20, { color: p.ink, size: 16, align: 'center', weight: 700, max: cw - 6 });
        // The bytes underneath.
        bs.forEach((b, i) => {
          const bx = x + (cw / bs.length) * i;
          const bwid = cw / bs.length;
          box(g, bx + 1, y + 48, bwid - 2, 30, { fill: p.raised, stroke: p.line, r: 4 });
          label(g, b.toString(16).toUpperCase().padStart(2, '0'), bx + bwid / 2, y + 57, {
            color: p.ink2, size: 10, align: 'center', mono: true, max: bwid - 4,
          });
          label(g, b.toString(2).padStart(8, '0').slice(0, 4), bx + bwid / 2, y + 70, {
            color: b & 0x80 ? R.energy : p.muted, size: 8.5, align: 'center', mono: true, max: bwid - 4,
          });
        });
        label(g, `${bs.length} B`, x + cw / 2, y + 88, {
          color: multi ? R.energy : p.muted, size: 9.5, align: 'center', weight: 600, max: cw,
        });
        x += cw + 6;
      }

      const rows = [
        ['ASCII, 7 bits', '0 to 127. Unaccented English and control characters.'],
        ['UTF-8', 'The first 128 values match ASCII exactly. Anything above uses 2 to 4 bytes with the top bit set.'],
        ['Why it matters', 'A "16 character" field is usually 16 bytes. Truncation mid-character shows a replacement glyph on one screen and looks fine on another.'],
      ];
      let ry = 168;
      const keyW = Math.min(140, w * 0.32);
      for (const [k, v] of rows) {
        label(g, k, pad, ry, { color: p.muted, size: 10.5, weight: 600, max: keyW - 8 });
        ry += labelWrap(g, v, pad + keyW, ry, { color: p.ink2, size: 11, max: w - pad * 2 - keyW, maxLines: 2 }) + 6;
      }
    },
  });
  upd();
});

register('rate-vs-bandwidth', (host) => compare(host, {
  title: 'Rate, bandwidth, latency and jitter',
  sub: 'Four different things, routinely used as one word, and only two of them decide whether audio works.',
  accent: 'signal',
  fields: [
    { key: 'is', label: 'What it is' },
    { key: 'unit', label: 'Measured in' },
    { key: 'decides', label: 'What it decides' },
    { key: 'trap', label: 'The trap', tone: 'fault' },
  ],
  items: [
    {
      name: 'Data rate', short: 'Rate', tone: 'signal',
      line: 'How many bits go past per second.',
      is: 'A count of bits over time',
      unit: 'bit/s, kbit/s, Mbit/s, Gbit/s',
      decides: 'Whether the traffic fits on the link at all',
      trap: 'Rates are in bits and file sizes are in bytes. A factor of eight, and it is the commonest arithmetic error in the subject',
      note: 'This is the one you calculate a load with. <b>One sACN universe is about 240 kbit/s on the wire including headers, and a hundred universes is 24 Mbit/s, which is nothing for gigabit and everything if it is being broadcast to every device.</b>',
    },
    {
      name: 'Bandwidth', short: 'Bandwidth', tone: 'energy',
      line: 'Strictly, the range of frequencies a channel can carry.',
      is: 'A property of the physical path',
      unit: 'Hz',
      decides: 'The ceiling on the rate the path can support',
      trap: 'Colloquially it now means capacity, and you will not win that argument',
      note: 'Bandwidth limits rate and the relationship is not one to one: modulation buys more bits per hertz at the cost of noise margin. <b>That is why gigabit fits on cable specified for 100 Mbit/s, and why it fails on a marginal cable in a way 100 Mbit/s did not.</b>',
    },
    {
      name: 'Latency', short: 'Latency', tone: 'safe',
      line: 'How long one message takes to get there.',
      is: 'A delay',
      unit: 'ms, µs',
      decides: 'Whether audio, video and cues arrive in time',
      trap: 'A link with plenty of spare capacity can still be too slow, and adding capacity does not reduce latency',
      note: 'Latency and rate are independent. <b>A 10 Gbit/s link that is idle can still deliver a packet late, and no amount of headroom will fix a device that takes 40 ms to process.</b>',
    },
    {
      name: 'Jitter', short: 'Jitter', tone: 'fault',
      line: 'How much the latency varies from packet to packet.',
      is: 'The variation in a delay',
      unit: 'ms, µs',
      decides: 'Whether a stream can be reassembled without a buffer, and how big that buffer must be',
      trap: 'It is invisible on an idle network and appears exactly when the network is busy, which is the night it matters',
      note: 'A 10 Gbit/s link with 40 ms of jitter is useless for audio and perfectly fine for a file copy. <b>Jitter is what a receive buffer exists to absorb, and every millisecond of buffer is a millisecond of latency you have chosen to accept.</b>',
    },
  ],
  footer: 'Capacity, delay and the variation in the delay. Say which one you mean.',
}));

register('determinism-band', (host) => ladder(host, {
  title: 'How deterministic does this actually need to be?',
  sub: 'Drag across nine orders of magnitude and read what lives at each. Show traffic is not one requirement.',
  unit: 's',
  min: 1e-7,
  max: 10,
  start: 0.02,
  sliderLabel: 'Deadline',
  bands: [
    { from: 1e-7, to: 1e-5, name: 'Clock accuracy', tone: 'safe', what: 'PTP holds devices within a microsecond of each other. Below this, samples taken in different boxes line up.' },
    { from: 1e-5, to: 1e-3, name: 'Sample and slot', tone: 'signal', what: 'One audio sample at 48 kHz is 21 µs. One DMX slot is 44 µs. This is the scale protocols are built at.' },
    { from: 1e-3, to: 0.02, name: 'Audio and video', tone: 'signal', what: 'Dante and AES67 run at 0.25 to 5 ms. A video frame at 50 fps is 20 ms. Nothing here tolerates a queue.' },
    { from: 0.02, to: 0.1, name: 'Lighting and cues', tone: 'energy', what: 'A DMX packet is 22.7 ms. A cue tolerates 20 to 50 ms comfortably. Perceptible to an audience starts around 100 ms.' },
    { from: 0.1, to: 2, name: 'Human scale', tone: 'energy', what: 'An operator noticing, a fixture striking, a motor accelerating, a fog effect building. Physical latency dominates here.' },
    { from: 2, to: 10, name: 'No deadline at all', tone: 'fault', what: 'Discovery, monitoring, firmware uploads, file copies. Management traffic, which has no deadline and therefore no manners.' },
  ],
  readout: (v, b) => `At ${eng(v, 's')} you are in <b>${b.name}</b>. ${b.what} ${b.name === 'No deadline at all' ? '<b>This is the traffic that belongs on its own VLAN, because it will happily fill a link and does not care that a cue is trying to get through.</b>' : ''}`,
  footer: 'Ethernet is best-effort by design. A well-built show network is not deterministic, it is reliably fast enough, and the difference shows on the busiest night.',
}));

register('multiplex', (host) => {
  let kind = 'tdm';
  let load = 3;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Three ways to share one path',
    sub: 'Add conversations and watch what each mechanism does with them.',
    note: '',
  });

  const upd = () => {
    setNote(kind === 'tdm'
      ? 'Time division gives each conversation a fixed slot whether it needs one or not. Guaranteed, and wasteful when a slot is empty. <b>DMX512 is pure TDM: 512 slots, each getting 44 µs of the wire, in a fixed repeating order, forever.</b>'
      : kind === 'fdm'
        ? 'Frequency or wavelength division gives each conversation its own band on the same path, all at once. <b>This is radio microphones on one antenna distribution, and WDM on one fibre where eight colours of light carry eight independent links down one strand.</b>'
        : `Statistical multiplexing lets whoever has something to say take the wire. Far more efficient when traffic is bursty${load > 6 ? ', and at this load two senders want it at the same moment and one has to queue' : ''}. <b>This is packet switching, this is Ethernet, and this is exactly why a network is best-effort rather than deterministic.</b>`);
    cv.once();
  };

  controls.append(choice('Mechanism', [['tdm', 'Time division'], ['fdm', 'Frequency / wavelength'], ['stat', 'Statistical']], {
    value: 'tdm', on: (v) => { kind = v; upd(); },
  }).node);
  controls.append(slider('Conversations', { min: 1, max: 8, step: 1, value: 3, on: (v) => { load = v; upd(); } }).node);

  challenge('Push the statistical case until two senders collide.', () => kind === 'stat' && load >= 7);

  const cv = canvas(stage, {
    height: 250,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const COLS = [R.signal, R.energy, R.safe, p.ink2, R.fault, R.signal, R.energy, R.safe];
      const gx = pad, gw = w - pad * 2, gy = 60, gh = 110;

      box(g, gx, gy, gw, gh, { fill: alpha(p.line, 0.22), stroke: p.line, r: 8 });
      label(g, 'one shared path', gx + 8, gy - 10, { color: p.muted, size: 10 });

      if (kind === 'tdm') {
        const slots = 16;
        const sw = gw / slots;
        for (let i = 0; i < slots; i++) {
          const who = i % load;
          const x = gx + i * sw;
          box(g, x + 1, gy + 10, sw - 2, gh - 20, { fill: alpha(COLS[who], 0.3), stroke: alpha(COLS[who], 0.7), r: 3 });
          label(g, String(who + 1), x + sw / 2, gy + gh / 2, { color: COLS[who], size: 11, align: 'center', weight: 700 });
        }
        label(g, `${load} conversations, ${slots} slots, in a fixed repeating order`, gx, gy + gh + 20,
          { color: p.ink2, size: 11, max: gw });
        label(g, 'Each gets its slot whether it has anything to send or not. Guaranteed, and wasteful.',
          gx, gy + gh + 40, { color: p.muted, size: 10.5, max: gw });
      } else if (kind === 'fdm') {
        const bh = (gh - 16) / load;
        for (let i = 0; i < load; i++) {
          const y = gy + 8 + i * bh;
          box(g, gx + 6, y + 1, gw - 12, bh - 3, { fill: alpha(COLS[i], 0.22), stroke: alpha(COLS[i], 0.6), r: 3 });
          // A continuous wave in each band.
          g.strokeStyle = COLS[i];
          g.lineWidth = 1.6;
          g.beginPath();
          for (let x = gx + 10; x < gx + gw - 10; x += 2) {
            const yy = y + bh / 2 + Math.sin((x * (0.3 + i * 0.12)) + t * 2.4) * Math.min(7, bh / 3);
            if (x === gx + 10) g.moveTo(x, yy); else g.lineTo(x, yy);
          }
          g.stroke();
          label(g, `band ${i + 1}`, gx + 12, y + bh / 2, { color: COLS[i], size: 9.5, weight: 600 });
        }
        label(g, `${load} conversations, all transmitting at once, in separate bands`, gx, gy + gh + 20,
          { color: p.ink2, size: 11, max: gw });
        label(g, 'Radio microphones on one antenna. Eight colours of light down one fibre.',
          gx, gy + gh + 40, { color: p.muted, size: 10.5, max: gw });
      } else {
        const slots = 20;
        const sw = gw / slots;
        let queued = 0;
        for (let i = 0; i < slots; i++) {
          const x = gx + i * sw;
          // Deterministic pseudo-random demand.
          const demand = [];
          for (let c = 0; c < load; c++) if (((i * 7 + c * 13 + 5) % 11) < 3) demand.push(c);
          if (demand.length === 0) {
            box(g, x + 1, gy + 10, sw - 2, gh - 20, { fill: alpha(p.muted, 0.06), stroke: alpha(p.line, 0.6), r: 3 });
            continue;
          }
          const who = demand[0];
          queued += demand.length - 1;
          box(g, x + 1, gy + 10, sw - 2, gh - 20, {
            fill: alpha(COLS[who], 0.3), stroke: demand.length > 1 ? R.fault : alpha(COLS[who], 0.7), r: 3, lw: demand.length > 1 ? 2 : 1,
          });
          label(g, String(who + 1), x + sw / 2, gy + gh / 2 - 6, { color: COLS[who], size: 10, align: 'center', weight: 700 });
          if (demand.length > 1) {
            label(g, `+${demand.length - 1}`, x + sw / 2, gy + gh / 2 + 10, { color: R.fault, size: 9, align: 'center', weight: 700 });
          }
        }
        label(g, `${load} conversations taking turns as they have something to send`, gx, gy + gh + 20,
          { color: p.ink2, size: 11, max: gw });
        label(g, queued > 0
          ? `${queued} moments where two wanted the wire at once, so one queued. That queue is the jitter.`
          : 'Nobody collided at this load. Empty slots are wasted by TDM and used here.',
        gx, gy + gh + 40, { color: queued > 0 ? R.fault : R.safe, size: 10.5, max: gw });
      }

      label(g, kind === 'tdm' ? 'Time division multiplexing'
        : kind === 'fdm' ? 'Frequency or wavelength division multiplexing' : 'Statistical multiplexing',
      pad, 24, { color: p.ink, size: 13, weight: 700, max: w - pad * 2 });
    },
  });
  upd();
});

register('duplex', (host) => compare(host, {
  title: 'Simplex, half duplex, full duplex',
  sub: 'Half duplex is where the subtle faults live, because the turnaround has a timing budget nobody thinks about.',
  accent: 'signal',
  fields: [
    { key: 'how', label: 'How it works' },
    { key: 'where', label: 'Where in shows' },
    { key: 'fault', label: 'The characteristic fault', tone: 'fault' },
  ],
  items: [
    {
      name: 'Simplex', short: 'Simplex', tone: 'energy',
      line: 'One direction, always. There is no return path at all.',
      how: 'The sender transmits; the receiver receives; that is the whole arrangement',
      where: 'DMX512, and timecode distribution',
      fault: 'You cannot tell whether anything is listening, ever, including whether it is plugged in',
      note: 'Simplex is why a DMX fixture cannot tell a console anything. <b>Everything you believe about the state of a rig, you believe because you sent it.</b>',
    },
    {
      name: 'Half duplex', short: 'Half', tone: 'signal',
      line: 'Both directions, one at a time, with a turnaround between them.',
      how: 'One end stops transmitting and releases the line; the other end has a window in which to reply',
      where: 'RDM, over the same pair DMX uses. Modbus RTU. Some radio links',
      fault: 'A device slow to release the line, or a box in the path that does not pass the reverse direction, breaks the conversation while everything looks healthy',
      note: 'The turnaround is the fragile part and it has a real timing budget. <b>A DMX splitter that is not RDM-capable passes the forward direction perfectly and blocks the return, so every fixture works and none is discoverable.</b>',
    },
    {
      name: 'Full duplex', short: 'Full', tone: 'safe',
      line: 'Both directions simultaneously, on separate pairs or with echo cancellation.',
      how: 'Each end can transmit whenever it likes without waiting for the other to finish',
      where: 'Ethernet since 100BASE-TX. Effectively everything modern',
      fault: 'A port that has negotiated half duplex when the other end thinks it is full: collisions, retries, and a link that works badly rather than not at all',
      note: 'A duplex mismatch is now rare and it is worth recognising, because the symptom is a link that passes small tests and collapses under load. <b>Read the port status: a 100 Mbit/s half-duplex link on a modern network is a fault.</b>',
    },
  ],
  footer: 'Ask which one a protocol is before you ask anything else about it. It decides what a fault can even look like.',
}));

register('crc-catch', (host) => {
  let method = 'crc';
  let flips = 1;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Which errors each check actually catches',
    sub: 'Flip bits in the message and see whether the check notices. Then remember that noticing is not fixing.',
    note: '',
  });

  // Deterministic message so the picture is stable.
  const MSG = [0x02, 0xB7, 0x40, 0x91, 0x0C, 0x55, 0xFE, 0x33];

  const flipped = () => {
    const out = MSG.slice();
    // Flip `flips` bits at fixed pseudo-random positions.
    for (let i = 0; i < flips; i++) {
      const idx = (i * 3 + 1) % out.length;
      const bit = (i * 5 + 2) % 8;
      out[idx] ^= (1 << bit);
    }
    return out;
  };

  const parityOf = (bytes) => bytes.reduce((acc, b) => {
    let x = b, n = 0;
    while (x) { n ^= x & 1; x >>= 1; }
    return acc ^ n;
  }, 0);
  const sumOf = (bytes) => bytes.reduce((a, b) => (a + b) & 255, 0);
  const xorOf = (bytes) => bytes.reduce((a, b) => a ^ b, 0);
  const crcOf = (bytes) => {
    let c = 0xFFFF;
    for (const b of bytes) {
      c ^= b << 8;
      for (let i = 0; i < 8; i++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF;
    }
    return c;
  };

  const caught = () => {
    const bad = flipped();
    if (flips === 0) return null;
    if (method === 'parity') return parityOf(MSG) !== parityOf(bad);
    if (method === 'sum') return sumOf(MSG) !== sumOf(bad);
    if (method === 'xor') return xorOf(MSG) !== xorOf(bad);
    return crcOf(MSG) !== crcOf(bad);
  };

  const upd = () => {
    const c = caught();
    setNote(flips === 0
      ? 'No errors yet. Move the slider and see which checks notice.'
      : c
        ? `Caught. But <b>detection is not correction</b>: Ethernet detects a corrupted frame with its CRC-32 and silently drops it. Nothing retransmits unless a higher layer asks, and UDP does not ask, so a corrupted sACN packet is simply a lost one.`
        : `<b>Missed.</b> ${method === 'parity' ? 'Parity catches any odd number of flipped bits and misses every even number.' : method === 'xor' ? 'A byte-wise XOR misses errors that cancel in the same bit position.' : 'A simple sum misses reordering and compensating errors.'} <b>This is why modern protocols use a CRC and older ones spend a lot of time being mysteriously unreliable.</b>`);
    cv.once();
  };

  controls.append(choice('Check', [['parity', 'Parity'], ['sum', 'Checksum'], ['xor', 'XOR'], ['crc', 'CRC-16']], {
    value: 'crc', on: (v) => { method = v; upd(); },
  }).node);
  controls.append(slider('Bits flipped', { min: 0, max: 6, step: 1, value: 1, on: (v) => { flips = v; upd(); } }).node);

  challenge('Find a case where parity misses an error that CRC catches.',
    () => method === 'parity' && flips > 0 && !caught());

  const cv = canvas(stage, {
    height: 250, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const bad = flipped();
      const bw = Math.min(58, (w - pad * 2 - 7 * 5) / 8);
      const c = caught();

      const row = (y, bytes, nm, ref) => {
        label(g, nm, pad, y - 10, { color: p.muted, size: 9.5 });
        bytes.forEach((b, i) => {
          const changed = ref && ref[i] !== b;
          const x = pad + i * (bw + 5);
          box(g, x, y, bw, 34, {
            fill: changed ? alpha(R.fault, 0.18) : alpha(R.signal, 0.1),
            stroke: changed ? R.fault : alpha(R.signal, 0.5), r: 5, lw: changed ? 2 : 1,
          });
          label(g, b.toString(16).toUpperCase().padStart(2, '0'), x + bw / 2, y + 12, {
            color: changed ? R.fault : p.ink, size: 11, align: 'center', weight: 600, mono: true,
          });
          label(g, b.toString(2).padStart(8, '0'), x + bw / 2, y + 26, {
            color: p.muted, size: 8, align: 'center', mono: true, max: bw - 4,
          });
        });
      };

      row(36, MSG, 'as sent');
      row(96, bad, flips ? `as received, ${flips} bit${flips > 1 ? 's' : ''} flipped` : 'as received, intact', MSG);

      // The check values.
      const checks = [
        ['Parity', parityOf(MSG), parityOf(bad), method === 'parity'],
        ['Checksum', sumOf(MSG), sumOf(bad), method === 'sum'],
        ['XOR', xorOf(MSG), xorOf(bad), method === 'xor'],
        ['CRC-16', crcOf(MSG), crcOf(bad), method === 'crc'],
      ];
      let y = 156;
      const cw = (w - pad * 2 - 18) / 4;
      checks.forEach(([nm, sent, got, on], i) => {
        const x = pad + i * (cw + 6);
        const differ = sent !== got;
        box(g, x, y, cw, 56, {
          fill: on ? alpha(differ ? R.safe : R.fault, 0.14) : alpha(p.line, 0.2),
          stroke: on ? (differ ? R.safe : R.fault) : p.line, r: 7, lw: on ? 2 : 1,
        });
        label(g, nm, x + cw / 2, y + 14, { color: on ? p.ink : p.muted, size: 11, align: 'center', weight: 700, max: cw - 6 });
        label(g, `${sent.toString(16).toUpperCase()} → ${got.toString(16).toUpperCase()}`, x + cw / 2, y + 31, {
          color: p.ink2, size: 10, align: 'center', mono: true, max: cw - 6,
        });
        label(g, flips === 0 ? 'no error' : differ ? 'caught' : 'MISSED', x + cw / 2, y + 46, {
          color: flips === 0 ? p.muted : differ ? R.safe : R.fault, size: 10.5, align: 'center', weight: 700, max: cw - 6,
        });
      });

      label(g, c === false
        ? 'A check that misses an error reports success. The receiver acts on corrupted data believing it is correct.'
        : 'DMX512 has no error detection at all. It relies entirely on repeating the whole picture every 22.7 ms.',
      pad, y + 76, { color: c === false ? R.fault : p.muted, size: 11, max: w - pad * 2 });
    },
  });
  upd();
});

register('differential', (host) => {
  let differentialOn = true;
  let noise = 50;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Why RS-485 survives a building',
    sub: 'The same trick as balanced audio, applied to data. Add interference and watch which one still decodes.',
    note: '',
  });

  const upd = () => {
    setNote(differentialOn
      ? 'Interference lands on both conductors equally, and the receiver looks only at the <i>difference</i>, so it cancels. Ground offset between the two ends cancels the same way. <b>This one idea is why 1200 m runs are possible in an electrically hostile building, and why DMX uses a twisted pair rather than a wire and a ground.</b>'
      : 'Single-ended, the interference adds straight onto the signal and the receiver has nothing to subtract it from. Above a certain level the decoded bits are wrong. <b>RS-485 says what the voltages are; DMX512 says what the bits mean, and a DMX problem is nearly always an RS-485 problem.</b>');
    cv.once();
  };

  controls.append(toggle('Differential pair', { value: true, on: (v) => { differentialOn = v; upd(); } }).node);
  controls.append(slider('Interference', { min: 0, max: 100, step: 5, value: 50, on: (v) => { noise = v; upd(); } }).node);

  challenge('Push the interference to maximum and still decode the data correctly.',
    () => differentialOn && noise >= 95);

  const cv = canvas(stage, {
    height: 280,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const x0 = pad + 8, x1 = w - pad - 8;
      const bits = [1, 0, 1, 1, 0, 0, 1, 0];
      const bitAt = (x) => bits[Math.min(bits.length - 1, Math.floor(((x - x0) / (x1 - x0)) * bits.length))];
      const nz = (x) => (noise / 100) * 26 * Math.sin(x * 0.22 + t * 3.4) + (noise / 100) * 10 * Math.sin(x * 0.61 - t * 2.1);

      const trace = (y, amp, fn, col, lw = 2) => {
        g.strokeStyle = col;
        g.lineWidth = lw;
        g.beginPath();
        for (let x = x0; x <= x1; x += 1.5) {
          const yy = y - fn(x) * amp;
          if (x === x0) g.moveTo(x, yy); else g.lineTo(x, yy);
        }
        g.stroke();
      };

      if (differentialOn) {
        label(g, 'A (data +)', pad, 26, { color: R.signal, size: 10.5, weight: 600 });
        trace(48, 14, (x) => (bitAt(x) ? 1 : -1) + nz(x) / 14, R.signal);
        label(g, 'B (data −)', pad, 82, { color: R.energy, size: 10.5, weight: 600 });
        trace(104, 14, (x) => (bitAt(x) ? -1 : 1) + nz(x) / 14, R.energy);
        label(g, 'A − B, what the receiver sees', pad, 140, { color: R.safe, size: 10.5, weight: 600 });
        trace(166, 14, (x) => (bitAt(x) ? 2 : -2), R.safe, 2.5);
        line(g, x0, 166, x1, 166, { color: alpha(p.line, 0.8), lw: 1, dash: [3, 3] });
        label(g, 'The interference is identical on both, so subtracting removes it entirely.',
          pad, 208, { color: R.safe, size: 11, max: w - pad * 2 });
      } else {
        label(g, 'signal, measured against ground', pad, 26, { color: R.signal, size: 10.5, weight: 600 });
        trace(64, 14, (x) => (bitAt(x) ? 1 : -1) + nz(x) / 14, R.signal);
        label(g, 'the decision threshold', pad, 118, { color: p.muted, size: 10.5 });
        line(g, x0, 130, x1, 130, { color: alpha(p.muted, 0.8), lw: 1, dash: [4, 4] });
        // The decoded result.
        label(g, 'decoded', pad, 160, { color: p.ink2, size: 10.5, weight: 600 });
        const bw = (x1 - x0) / bits.length;
        let wrong = 0;
        bits.forEach((b, i) => {
          const cx = x0 + i * bw + bw / 2;
          const v = (b ? 1 : -1) * 14 + nz(cx) * 1.0;
          const got = v > 0 ? 1 : 0;
          if (got !== b) wrong++;
          box(g, x0 + i * bw + 2, 172, bw - 4, 28, {
            fill: alpha(got === b ? R.safe : R.fault, 0.16),
            stroke: got === b ? alpha(R.safe, 0.6) : R.fault, r: 4,
          });
          label(g, String(got), cx, 186, {
            color: got === b ? R.safe : R.fault, size: 13, align: 'center', weight: 700, mono: true,
          });
        });
        label(g, wrong
          ? `${wrong} bit${wrong > 1 ? 's' : ''} decoded wrongly. The receiver has no way to know.`
          : 'Still decoding correctly, for now. Turn the interference up.',
        pad, 216, { color: wrong ? R.fault : p.muted, size: 11, max: w - pad * 2 });
      }

      label(g, `Interference: ${noise}%`, w - pad, 26, { color: p.muted, size: 10.5, align: 'right' });
      label(g, differentialOn
        ? 'RS-485, balanced audio and every twisted pair in an Ethernet cable use this.'
        : 'Over any distance in a real building, two ends do not share a ground.',
      pad, 246, { color: p.muted, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});

register('serial-frame', (host) => {
  let byteVal = 0x4B;
  let baudRight = true;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'One byte, start bit to stop bit',
    sub: 'There is no clock line. Both ends agree a rate, and the receiver samples in the middle of each bit.',
    note: '',
  });

  const upd = () => {
    setNote(baudRight
      ? 'A start bit, eight data bits sent least significant first, then two stop bits. At 250 kbit/s each bit is 4 µs and the whole frame is 44 µs. <b>Measure one bit on a scope and you can calculate the rate: that is a genuinely useful diagnostic and it takes ten seconds.</b>'
      : 'At the wrong rate the receiver samples at the wrong moments and assembles bytes that are technically valid values and completely meaningless. <b>A wrong baud rate gives you garbage rather than nothing, which is why "there is data but it is nonsense" is a rate problem far more often than a wiring one.</b>');
    cv.once();
  };

  controls.append(slider('Byte value', {
    min: 0, max: 255, step: 1, value: 0x4B,
    fmt: (v) => `${v} · 0x${v.toString(16).toUpperCase().padStart(2, '0')}`,
    on: (v) => { byteVal = v; upd(); },
  }).node);
  controls.append(toggle('Receiver at the right rate', { value: true, on: (v) => { baudRight = v; upd(); } }).node);

  challenge('Send the DMX null start code, 0x00.', () => byteVal === 0);

  const cv = canvas(stage, {
    height: 250, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const bits = [{ v: 0, n: 'start' }];
      for (let k = 0; k < 8; k++) bits.push({ v: (byteVal >> k) & 1, n: `d${k}` });
      bits.push({ v: 1, n: 'stop' }, { v: 1, n: 'stop' });

      const gL = pad, gT = 40, gW = w - pad * 2, gH = 56;
      const bw = gW / bits.length;
      const hi = gT, lo = gT + gH;

      g.strokeStyle = R.signal;
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(gL, hi);
      let x = gL, prev = 1;
      for (const b of bits) {
        const y = b.v ? hi : lo;
        if (b.v !== prev) g.lineTo(x, y);
        g.lineTo(x + bw, y);
        prev = b.v;
        x += bw;
      }
      g.lineTo(gL + gW, hi);
      g.stroke();

      bits.forEach((b, k) => {
        const bx = gL + k * bw;
        line(g, bx, gT - 8, bx, lo + 8, { color: alpha(p.line, 0.9), lw: 1 });
        const isFrame = k === 0 || k > 8;
        label(g, isFrame ? b.n : String(b.v), bx + bw / 2, lo + 18, {
          color: isFrame ? p.muted : p.ink, size: 10, align: 'center', weight: isFrame ? 500 : 700, mono: true,
        });
        if (!isFrame) label(g, b.n, bx + bw / 2, lo + 32, { color: p.muted, size: 8.5, align: 'center', mono: true });
        const off = baudRight ? 0.5 : 0.5 + (k - 4) * 0.11;
        const sx = bx + bw * off;
        if (sx > gL && sx < gL + gW) {
          const correct = off > 0.1 && off < 0.9;
          g.fillStyle = correct ? R.safe : R.fault;
          g.beginPath(); g.arc(sx, b.v ? hi : lo, 3.5, 0, Math.PI * 2); g.fill();
        }
      });
      label(g, 'idle high', gL, gT - 16, { color: p.muted, size: 9.5 });
      label(g, baudRight ? 'sampled in the middle of each bit' : 'sampling drifts: the wrong rate',
        gL + gW, gT - 16, {
          color: baudRight ? R.safe : R.fault, size: 9.5, align: 'right', weight: 600, max: gW - 80,
        });

      const wy = lo + 56;
      label(g, `Value  ${byteVal}  ·  0x${byteVal.toString(16).toUpperCase().padStart(2, '0')}  ·  ${byteVal.toString(2).padStart(8, '0')}  ·  ${byteVal >= 32 && byteVal < 127 ? `'${String.fromCharCode(byteVal)}'` : 'not printable'}`,
        pad, wy, { color: p.ink, size: 11.5, mono: true, max: w - pad * 2 });
      label(g, 'At 250 kbit/s:  one bit 4 µs  ·  one frame 44 µs  ·  512 frames plus break, 22.7 ms',
        pad, wy + 20, { color: p.ink2, size: 11, mono: true, max: w - pad * 2 });
      label(g, baudRight
        ? 'Data bits go least significant first, which is why the picture reads backwards from the number.'
        : 'The bytes that come out will be valid values. They will just be the wrong ones.',
      pad, wy + 40, { color: baudRight ? p.muted : R.fault, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});

register('tia-standards', (host) => compare(host, {
  title: 'RS-232, RS-422 and RS-485',
  sub: 'Three TIA standards, three different jobs, and the one distinction that speeds up every DMX diagnosis you will ever do.',
  accent: 'signal',
  fields: [
    { key: 'sig', label: 'Signalling' },
    { key: 'dev', label: 'Devices' },
    { key: 'dist', label: 'Distance' },
    { key: 'lives', label: 'Where it lives now' },
    { key: 'note2', label: 'The thing to know' },
  ],
  items: [
    {
      name: 'RS-232', short: 'RS-232', tone: 'energy',
      line: 'Single-ended, ±3 to ±15 V, point to point.',
      sig: 'Single-ended against ground',
      dev: 'Two, and only two',
      dist: 'About 15 m at 19.2 kbit/s',
      lives: 'Console service ports, projectors, legacy show control, USB adapters',
      note2: 'It survives because it is trivially simple and every device still has one somewhere',
      note: 'RS-232 is single-ended, so it assumes both ends share a ground, which over any real distance they do not. <b>That is the whole reason its distance limit is 15 m and RS-485\'s is 1200 m.</b>',
    },
    {
      name: 'RS-422', short: 'RS-422', tone: 'signal',
      line: 'Differential, one driver, up to ten receivers.',
      sig: 'Differential pair',
      dev: 'One driver, ten receivers',
      dist: '1200 m',
      lives: 'Sony 9-pin machine control, some industrial equipment',
      note2: 'One transmitter only, so no bus arbitration is needed and none exists',
      note: 'RS-422 is the one-way version of RS-485. <b>You will mostly meet it as Sony 9-pin machine control, which is obsolete and worth recognising when you find one in an old facility.</b>',
    },
    {
      name: 'RS-485', short: 'RS-485', tone: 'safe',
      line: 'Differential, multi-drop, up to 32 unit loads on a segment.',
      sig: 'Differential pair, with drivers that can release the line',
      dev: '32 unit loads per segment',
      dist: '1200 m',
      lives: '<b>DMX512 and RDM</b>, Modbus RTU, and a great deal of industrial control',
      note2: 'This is the electrical layer under DMX, and the two are constantly confused',
      note: 'RS-485 says what the voltages are and how the wires are arranged; DMX512 says what the bits mean. <b>A DMX problem is nearly always an RS-485 problem, and the RS-485 problems are a short list: no termination, wrong cable impedance, too many devices, a star topology, or a broken screen.</b>',
    },
  ],
  footer: 'Learning the RS-485 and DMX512 distinction is worth an hour of anybody\'s fault-finding time, every year, forever.',
}));

register('usb-family', (host) => compare(host, {
  title: 'USB, which is not a control interface and is used as one',
  sub: 'Designed to connect peripherals to one computer, and everything about it reflects that.',
  accent: 'energy',
  fields: [
    { key: 'rate', label: 'Rate' },
    { key: 'reach', label: 'Practical reach' },
    { key: 'use', label: 'Where it is used here' },
    { key: 'catch', label: 'What catches shows out', tone: 'fault' },
  ],
  items: [
    {
      name: 'USB 2.0', short: 'USB 2.0', tone: 'signal',
      line: 'Still what most MIDI and DMX interfaces actually use.',
      rate: '480 Mbit/s',
      reach: 'About 5 m passive',
      use: 'MIDI interfaces, DMX widgets, control surfaces, dongles',
      catch: 'Beyond 5 m you need an active extender, and the cheap ones are a documented source of intermittent faults',
      note: 'Plenty fast for anything in this course. <b>Its problems are never bandwidth: they are distance, isolation and the stability of device enumeration.</b>',
    },
    {
      name: 'USB 3.2', short: 'USB 3.2', tone: 'signal',
      line: 'Faster, and shorter.',
      rate: '5 to 20 Gbit/s',
      reach: 'Around 2 to 3 m passive',
      use: 'Capture devices, fast storage, camera interfaces',
      catch: 'The reach is worse than USB 2.0, and a USB 3 device on a long cable may negotiate down to USB 2 silently',
      note: 'A device that mysteriously runs at a fraction of its rated speed is usually on a cable it has quietly renegotiated on. <b>Check what speed the host actually enumerated it at rather than what the box said.</b>',
    },
    {
      name: 'USB4 / Thunderbolt', short: 'USB4', tone: 'safe',
      line: 'Docks, displays, external GPUs, and increasingly the only port on a laptop.',
      rate: '40 to 120 Gbit/s',
      reach: 'Under 1 m passive; active cables beyond',
      use: 'Media server storage, docks that carry the whole show computer\'s connections',
      catch: 'A dock is now a single point of failure carrying network, display and storage at once',
      note: 'Consolidating everything onto one port is convenient and it concentrates risk. <b>A show computer whose network, display and storage all arrive through one dock has a new single point of failure that nobody has written down.</b>',
    },
    {
      name: 'USB-C, the connector', short: 'USB-C', tone: 'fault',
      line: 'A connector, not a speed. It tells you nothing.',
      rate: 'Anything from 480 Mbit/s to 120 Gbit/s',
      reach: 'Depends entirely on the cable',
      use: 'Everything, which is exactly the problem',
      catch: 'Two identical-looking cables can be a 480 Mbit/s charging cable and a 40 Gbit/s Thunderbolt cable',
      note: 'Label them, or buy one colour per type. <b>An afternoon lost to a charging cable in a data role is a rite of passage and it does not need to be yours.</b>',
    },
    {
      name: 'What USB is not', short: 'Not isolated', tone: 'fault',
      line: 'No isolation, and no stable identity across a glitch.',
      rate: '—',
      reach: '—',
      use: 'Fine on a desk next to the machine',
      catch: 'A USB device shares ground with the host, and a device that reappears after a glitch may come back as a different port name',
      note: 'A USB MIDI interface on a stage box ties the console\'s ground to whatever else is on that ground, which is a real cause of hum and of damage. <b>For a show-critical cue path, USB is a last resort.</b>',
    },
  ],
  footer: 'DIN MIDI is opto-isolated by specification. That is a genuine advantage USB does not have, and it is why the old connector survives.',
}));

register('media-compare', (host) => compare(host, {
  title: 'Copper, light and radio',
  sub: 'Three media, and the honest position on each for a path a cue depends on.',
  accent: 'signal',
  fields: [
    { key: 'reach', label: 'Reach' },
    { key: 'iso', label: 'Isolation' },
    { key: 'imm', label: 'Immunity' },
    { key: 'use', label: 'Use it for' },
    { key: 'not', label: 'Do not use it for', tone: 'fault' },
  ],
  items: [
    {
      name: 'Twisted pair copper', short: 'Copper', tone: 'energy',
      line: 'The default. Cheap, universal, and carries power as well as data.',
      reach: '100 m for Ethernet, 1200 m for RS-485',
      iso: 'None. Both ends share a ground path',
      imm: 'Good, from the twist and from differential signalling',
      use: 'Almost everything inside one building, and PoE where power and data share a route',
      not: 'Between buildings, across a lightning risk, or anywhere the two ends are on different electrical supplies',
      note: 'The twist is the entire mechanism by which a pair rejects interference. <b>Untwist more than 13 mm at a termination and the cable will link at gigabit and drop packets under load, which presents to everybody as a software fault.</b>',
    },
    {
      name: 'Multimode fibre', short: 'Multimode', tone: 'signal',
      line: 'OM3 or OM4, 50 µm core, for inside a venue.',
      reach: '300 to 400 m at 10 Gbit/s',
      iso: 'Complete. There is no electrical connection at all',
      imm: 'Total. Dimmers, motors and LED drivers are irrelevant to it',
      use: 'Between racks, between floors, anywhere a ground loop or interference is a risk',
      not: 'Between buildings at distance, or anywhere you need to carry power on the same run',
      note: 'Fibre\'s distance is the least interesting of its three advantages in a venue. <b>The other two, complete isolation and total immunity to the electromagnetic environment, are why it belongs inside a building and not only between them.</b>',
    },
    {
      name: 'Single-mode fibre', short: 'Single-mode', tone: 'safe',
      line: 'OS2, 9 µm core, for anything long.',
      reach: '10 km and well beyond',
      iso: 'Complete',
      imm: 'Total',
      use: 'Between buildings, broadcast contribution, long touring runs',
      not: 'Situations where you are matching an existing multimode plant, because they are not interchangeable',
      note: 'Multimode and single-mode connectors fit each other and the link will not work. <b>A dirty LC ferrule is the single most common fibre fault, and a cleaning kit is cheaper than one call-out.</b>',
    },
    {
      name: 'Wi-Fi', short: 'Wi-Fi', tone: 'fault',
      line: '6 and 7 are genuinely good, and none of it changes the structural problem.',
      reach: 'Tens of metres, and it depends on who else is transmitting',
      iso: 'Complete, being radio',
      imm: 'None. Anyone can transmit on your channel and the standard\'s response is to wait and retry',
      use: 'A human holding a device: remote focus, a tablet, a monitoring dashboard',
      not: '<b>Any path a cue depends on. Any audio. Any timecode. Any machinery.</b>',
      note: 'You do not control the medium, and an audience of two thousand people with phones is two thousand transmitters. <b>A retry is latency you did not budget for, and no configuration or generation number changes that.</b>',
    },
    {
      name: 'Other radio', short: 'Other radio', tone: 'energy',
      line: 'Wireless DMX, UWB, Bluetooth LE, DECT, LoRa.',
      reach: 'Metres to kilometres depending on the technology',
      iso: 'Complete',
      imm: 'Varies. UWB and DECT are far better behaved than 2.4 GHz',
      use: 'Wireless DMX for fixtures with no cable route, UWB for position tracking, BLE for configuration',
      not: 'Anything time-critical on a shared band, which in practice means anything at 2.4 GHz in a full venue',
      note: 'Wireless DMX is a real, well-engineered product category that works. <b>It still shares 2.4 GHz with every phone in the room, so it earns its place where cabling is impossible, not where cabling is inconvenient.</b>',
    },
  ],
  footer: 'Radio is acceptable where a human is in the loop and would notice a failure. It is not acceptable where a cue depends on it.',
}));
