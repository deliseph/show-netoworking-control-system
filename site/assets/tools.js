// The calculators.
//
// Every tool prints its working, not just its answer. That is deliberate: the
// assessment awards method marks, and a student who reads only the result has
// outsourced the one skill being examined. It is also the honest thing to do in
// a venue, where the number matters less than being able to defend it.

const $ = (sel, root = document) => root.querySelector(sel);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
const int = (v, d = 0) => (Number.isFinite(+v) ? Math.round(+v) : d);

// --- Shared formatting ------------------------------------------------------

const sig = (v, n = 3) => {
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

// Engineering notation, because that is how a value is spoken and written:
// 250 kbit/s, not 250000 bits per second.
function eng(v, unit = '') {
  if (!Number.isFinite(v)) return '—';
  const a = Math.abs(v);
  const steps = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
  for (const [mul, pre] of steps) {
    if (a >= mul) return `${sig(v / mul)} ${pre}${unit}`.trim();
  }
  return `${sig(v)} ${unit}`.trim();
}

const hex = (v, pad = 2) => `0x${(v >>> 0).toString(16).toUpperCase().padStart(pad, '0')}`;
const bin8 = (v) => (v & 255).toString(2).padStart(8, '0').replace(/(\d{4})(\d{4})/, '$1 $2');

// --- Shared field builders --------------------------------------------------

// The label a sighted user reads and the label a screen reader announces have
// to be the same one, so the label is joined to its control by id.
const field = (label, inner, hint) => {
  const id = /\bid="([^"]+)"/.exec(inner)?.[1];
  return `<div class="field"><label${id ? ` for="${id}"` : ''}>${label}</label>${inner}${hint ? `<span class="field-hint">${hint}</span>` : ''}</div>`;
};
const inp = (id, val, attrs = '') => `<input id="${id}" value="${val}" ${attrs}>`;
const sel = (id, opts, cur) =>
  `<select id="${id}">${opts.map(([v, l]) => `<option value="${v}"${String(v) === String(cur) ? ' selected' : ''}>${l}</option>`).join('')}</select>`;

const readout = (big, sub, cls = '') =>
  `<div class="readout ${cls}"><div class="readout-big">${big}</div><div class="readout-sub">${sub}</div></div>`;

const table = (rows) => `<div class="table-wrap"><table><tbody>${rows
  .map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</tbody></table></div>`;

// A note that is a warning rather than a result. Used wherever the arithmetic is
// correct and the answer is still unacceptable.
const warn = (t) => `<p class="tool-warn"><b>Check this.</b> ${t}</p>`;
const good = (t) => `<p class="tool-good">${t}</p>`;

// --- IPv4 helpers -----------------------------------------------------------

const ipToInt = (ip) => {
  const parts = String(ip).trim().split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = Number(p);
    if (!Number.isInteger(o) || o < 0 || o > 255) return null;
    n = n * 256 + o;
  }
  return n >>> 0;
};
const intToIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
const maskOf = (p) => (p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0);
const netOf = (n, p) => (n & maskOf(p)) >>> 0;
const bcastOf = (n, p) => (netOf(n, p) | (~maskOf(p) >>> 0)) >>> 0;

// ============================================================================
// Tools
// ============================================================================

const TOOLS = {};

// --- Bits, bytes, prefixes and time -----------------------------------------

TOOLS.units = (root) => {
  root.append(h(`<p class="tool-sub">The two errors that cost the most time in this subject are a
    factor of eight, from confusing bits with bytes, and a factor of a thousand, from a misread
    prefix. This converts between all of them and shows the working.</p>`));
  root.append(h(`<div class="fields">
    ${field('Value', inp('u-v', '250', 'type="number" step="any"'))}
    ${field('Unit', sel('u-u', [
    ['bit', 'bit'], ['kbit', 'kbit'], ['Mbit', 'Mbit'], ['Gbit', 'Gbit'],
    ['B', 'byte'], ['kB', 'kByte'], ['MB', 'MByte'], ['GB', 'GByte'],
  ], 'kbit'))}
    ${field('Per', sel('u-per', [['s', 'second (a rate)'], ['1', 'nothing (a quantity)']], 's'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const MUL = { bit: 1, kbit: 1e3, Mbit: 1e6, Gbit: 1e9, B: 8, kB: 8e3, MB: 8e6, GB: 8e9 };

  const run = () => {
    const v = num($('#u-v').value, 0);
    const u = $('#u-u').value;
    const per = $('#u-per').value === 's';
    const bits = v * MUL[u];
    const suffix = per ? '/s' : '';

    out.innerHTML = readout(`${eng(bits, 'bit')}${suffix}`, `${sig(v)} ${u}${suffix}, expressed in bits`)
      + table([
        [`bit${suffix}`, `<code>${eng(bits, 'bit')}${suffix}</code>`],
        [`byte${suffix}`, `<code>${eng(bits / 8, 'B')}${suffix}</code>`],
        ['As kbit', `<code>${sig(bits / 1e3)} kbit${suffix}</code>`],
        ['As Mbit', `<code>${sig(bits / 1e6)} Mbit${suffix}</code>`],
        ['As MB', `<code>${sig(bits / 8e6)} MB${suffix}</code>`],
        ...(per ? [
          ['Per minute', `<code>${eng(bits * 60 / 8, 'B')}</code>`],
          ['Per hour', `<code>${eng(bits * 3600 / 8, 'B')}</code>`],
        ] : [
          ['Time at 100 Mbit/s', `<code>${eng(bits / 1e8, 's')}</code>`],
          ['Time at 1 Gbit/s', `<code>${eng(bits / 1e9, 's')}</code>`],
        ]),
      ])
      + `<pre class="working">${sig(v)} ${u} = ${sig(v)} × ${MUL[u]} = ${sig(bits)} bits
bytes = bits ÷ 8 = ${sig(bits / 8)}

Rates are in BITS. File sizes are in BYTES. When a number looks
eight times wrong, this is why.</pre>`;
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Binary, decimal, hex and BCD -------------------------------------------

TOOLS.binhex = (root) => {
  root.append(h(`<p class="tool-sub">One hex digit is exactly four bits, which is the whole reason
    hex exists and the reason every protocol specification is written in it. Type in any base.</p>`));
  root.append(h(`<div class="fields">
    ${field('Base', sel('bh-base', [['10', 'Decimal'], ['2', 'Binary'], ['16', 'Hexadecimal']], '10'))}
    ${field('Value', inp('bh-v', '183', 'autocomplete="off" spellcheck="false"'), 'Hex may be written with or without 0x')}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = () => {
    const base = Number($('#bh-base').value);
    const raw = $('#bh-v').value.trim().replace(/^0x/i, '').replace(/\s+/g, '');
    const v = parseInt(raw, base);

    if (!Number.isFinite(v) || v < 0) {
      out.innerHTML = readout('Not a number in that base', 'Check the digits against the base you chose.', 'fail');
      return;
    }
    if (v > 0xFFFFFFFF) {
      out.innerHTML = readout('Too large', 'This tool works up to 32 bits, which covers everything in the module.', 'fail');
      return;
    }

    const bytes = [];
    let t = v;
    do { bytes.unshift(t & 255); t = Math.floor(t / 256); } while (t > 0);
    const oneByte = v <= 255;
    // BCD only makes sense for a value whose decimal digits fit the nibbles.
    const dec = String(v);
    const bcdOk = dec.length <= 8;
    const bcd = bcdOk ? dec.split('').map((d) => Number(d).toString(2).padStart(4, '0')).join(' ') : '—';

    out.innerHTML = readout(hex(v, Math.max(2, bytes.length * 2)), `${v} decimal, ${bytes.length} byte${bytes.length > 1 ? 's' : ''}`)
      + table([
        ['Decimal', `<code>${v}</code>`],
        ['Hex', `<code>${hex(v, Math.max(2, bytes.length * 2))}</code>`],
        ['Binary', `<code>${bytes.map(bin8).join('  ')}</code>`],
        ['Bytes, big-endian', `<code>${bytes.map((b) => hex(b)).join(' ')}</code>`],
        ['Bytes, little-endian', `<code>${[...bytes].reverse().map((b) => hex(b)).join(' ')}</code>`],
        ['BCD of the decimal digits', `<code>${bcd}</code>`],
        ...(oneByte ? [
          ['As a signed byte', `<code>${v > 127 ? v - 256 : v}</code>`],
          ['Top bit', `<code>${v & 0x80 ? 'set — a MIDI status byte' : 'clear — a MIDI data byte'}</code>`],
          ['As ASCII', `<code>${v >= 32 && v < 127 ? `'${String.fromCharCode(v)}'` : 'not printable'}</code>`],
        ] : []),
      ])
      + `<pre class="working">${bytes.map((b) => `${hex(b)}  =  ${bin8(b)}  =  ${b}`).join('\n')}

Split each byte into two nibbles and look each one up.
No multiplication is involved, which is the point of hex.</pre>`
      + (oneByte && (v & 0x80)
        ? good('Top bit set. In MIDI this is a status byte, so the next bytes belong to it.')
        : '');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Bitwise operations and masks -------------------------------------------

TOOLS.bitwise = (root) => {
  root.append(h(`<p class="tool-sub">AND masks, OR sets, XOR toggles and checksums, and a shift moves
    bits into position. Every subnet calculation and every protocol flag test is one of these.</p>`));
  root.append(h(`<div class="fields">
    ${field('A', inp('bw-a', '0xB7', 'autocomplete="off" spellcheck="false"'), 'Decimal, or 0x for hex')}
    ${field('Operation', sel('bw-op', [
    ['and', 'AND — keep bits set in both'], ['or', 'OR — set bits from either'],
    ['xor', 'XOR — set bits in exactly one'], ['shl', 'Shift left'], ['shr', 'Shift right'],
  ], 'and'))}
    ${field('B, or shift amount', inp('bw-b', '0x80', 'autocomplete="off" spellcheck="false"'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const parse = (s) => {
    const t = String(s).trim().replace(/\s+/g, '');
    if (/^0x/i.test(t)) return parseInt(t.slice(2), 16);
    if (/^0b/i.test(t)) return parseInt(t.slice(2), 2);
    return Number(t);
  };

  const run = () => {
    const a = parse($('#bw-a').value);
    const b = parse($('#bw-b').value);
    const op = $('#bw-op').value;
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      out.innerHTML = readout('Not two numbers', 'Use decimal, or 0x for hex, or 0b for binary.', 'fail');
      return;
    }
    const A = a >>> 0, B = b >>> 0;
    let r, sym, note;
    if (op === 'and') { r = (A & B) >>> 0; sym = '&'; note = 'Masking: a bit survives only where both have it set.'; }
    else if (op === 'or') { r = (A | B) >>> 0; sym = 'OR'; note = 'Setting: a bit is set if either has it set.'; }
    else if (op === 'xor') { r = (A ^ B) >>> 0; sym = '^'; note = 'Toggling: a bit is set where exactly one has it. XOR of every byte is the simplest checksum there is.'; }
    else if (op === 'shl') { r = (A << (B & 31)) >>> 0; sym = '<<'; note = `Shifting left by ${B & 31} multiplies by ${2 ** (B & 31)}.`; }
    else { r = A >>> (B & 31); sym = '>>'; note = `Shifting right by ${B & 31} divides by ${2 ** (B & 31)}, discarding the remainder.`; }

    const width = Math.max(A, B, r) > 255 ? 32 : 8;
    const show = (v) => (width === 8 ? bin8(v) : (v >>> 0).toString(2).padStart(32, '0').replace(/(\d{8})(?=\d)/g, '$1 '));

    out.innerHTML = readout(hex(r, width / 4), `${r} decimal`)
      + `<pre class="working">A      ${show(A)}   ${hex(A, width / 4)}   ${A}
B      ${show(B)}   ${hex(B, width / 4)}   ${B}
${sym.padEnd(6)} ${'-'.repeat(width === 8 ? 9 : 35)}
=      ${show(r)}   ${hex(r, width / 4)}   ${r}</pre>`
      + `<p class="tool-good">${note}</p>`
      + (op === 'and' && B === 0x80
        ? good('This is the MIDI status test. A non-zero result means the byte starts a message.')
        : '');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Serial framing and bit time --------------------------------------------

TOOLS.serial = (root) => {
  root.append(h(`<p class="tool-sub">There is no clock line on an asynchronous serial link: both ends
    agree a rate and the receiver samples in the middle of each bit. Measure one bit on a scope and
    this gives you the rate, which is a genuinely useful ten-second diagnostic.</p>`));
  root.append(h(`<div class="fields">
    ${field('Bit rate (bit/s)', sel('sr-preset', [
    ['31250', '31,250 — MIDI'], ['250000', '250,000 — DMX512'],
    ['9600', '9,600 — RS-232 common'], ['19200', '19,200'], ['38400', '38,400'],
    ['57600', '57,600'], ['115200', '115,200'], ['custom', 'Custom…'],
  ], '250000'))}
    ${field('Custom rate', inp('sr-rate', '250000', 'type="number" step="1"'))}
    ${field('Bits per frame', inp('sr-frame', '11', 'type="number" step="1" min="7" max="13"'), 'DMX is 1 start + 8 data + 2 stop = 11')}
    ${field('Bytes to send', inp('sr-n', '513', 'type="number" step="1" min="1"'), 'A DMX packet is a start code plus 512 slots')}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = () => {
    const preset = $('#sr-preset').value;
    if (preset !== 'custom') $('#sr-rate').value = preset;
    const rate = Math.max(1, num($('#sr-rate').value, 250000));
    const frame = Math.max(7, int($('#sr-frame').value, 11));
    const n = Math.max(1, int($('#sr-n').value, 1));

    const bitTime = 1 / rate;
    const frameTime = bitTime * frame;
    const total = frameTime * n;
    const payload = (n * 8) / total;
    const overhead = ((frame - 8) / frame) * 100;

    out.innerHTML = readout(eng(bitTime, 's'), `one bit at ${eng(rate, 'bit/s')}`)
      + table([
        ['One bit', `<code>${eng(bitTime, 's')}</code>`],
        ['One byte, with framing', `<code>${eng(frameTime, 's')}</code>`],
        [`${n} bytes`, `<code>${eng(total, 's')}</code>`],
        ['Repetitions per second', `<code>${sig(1 / total)} Hz</code>`],
        ['Payload rate', `<code>${eng(payload, 'bit/s')}</code>`],
        ['Framing overhead', `<code>${sig(overhead)} %</code>`],
      ])
      + `<pre class="working">bit time  = 1 ÷ ${sig(rate)} = ${eng(bitTime, 's')}
frame     = ${frame} bits × ${eng(bitTime, 's')} = ${eng(frameTime, 's')}
message   = ${n} × ${eng(frameTime, 's')} = ${eng(total, 's')}
rate      = 1 ÷ ${eng(total, 's')} = ${sig(1 / total)} Hz</pre>`
      + (rate === 250000 && frame === 11
        ? good('This is DMX512. Add the break of at least 92 µs and the mark of at least 12 µs to get the full packet time.')
        : '');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Data rate and payload --------------------------------------------------

TOOLS.datarate = (root) => {
  root.append(h(`<p class="tool-sub">A repeating stream's load on a network. The answer is always
    bytes per packet × 8 × packets per second, and the part everybody forgets is the 42 bytes of
    Ethernet, IP and UDP headers on every one.</p>`));
  root.append(h(`<div class="fields">
    ${field('What', sel('dr-kind', [
    ['sacn', 'sACN universe'], ['artnet', 'Art-Net universe'], ['audio', 'Audio channel'],
    ['custom', 'Custom stream'],
  ], 'sacn'))}
    ${field('Payload bytes per packet', inp('dr-bytes', '638', 'type="number" step="1" min="1"'))}
    ${field('Packets per second', inp('dr-pps', '44', 'type="number" step="any" min="0.1"'))}
    ${field('How many streams', inp('dr-n', '1', 'type="number" step="1" min="1"'))}
    ${field('Add headers', sel('dr-hdr', [['42', 'Ethernet + IP + UDP (42 B)'], ['0', 'None, payload only']], '42'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const PRESETS = {
    sacn: { bytes: 638, pps: 44, note: 'One sACN universe: 512 slots plus the E1.31 framing and DMP layers.' },
    artnet: { bytes: 530, pps: 44, note: 'One Art-Net universe: 512 slots plus an 18-byte ArtDmx header.' },
    audio: { bytes: 288, pps: 4000, note: 'One channel of 48 kHz 24-bit audio at 1 ms packets, as Dante or AES67 would send it.' },
    custom: null,
  };
  let last = 'sacn';

  const run = (e) => {
    const kind = $('#dr-kind').value;
    if (kind !== last && PRESETS[kind]) {
      $('#dr-bytes').value = PRESETS[kind].bytes;
      $('#dr-pps').value = PRESETS[kind].pps;
    }
    last = kind;
    if (e && e.target && /dr-(bytes|pps)/.test(e.target.id) && kind !== 'custom') {
      $('#dr-kind').value = 'custom';
      last = 'custom';
    }

    const bytes = Math.max(1, int($('#dr-bytes').value, 638));
    const pps = Math.max(0.1, num($('#dr-pps').value, 44));
    const n = Math.max(1, int($('#dr-n').value, 1));
    const hdr = int($('#dr-hdr').value, 42);

    const onWire = bytes + hdr;
    const one = onWire * 8 * pps;
    const total = one * n;
    const pctGig = (total / 1e9) * 100;

    out.innerHTML = readout(eng(total, 'bit/s'), `${n} stream${n > 1 ? 's' : ''} of ${eng(one, 'bit/s')}`)
      + table([
        ['On the wire, per packet', `<code>${onWire} bytes</code>`],
        ['One stream', `<code>${eng(one, 'bit/s')}</code>`],
        [`All ${n}`, `<code>${eng(total, 'bit/s')}</code>`],
        ['Packets per second, total', `<code>${sig(pps * n)}</code>`],
        ['Share of a 1 Gbit/s link', `<code>${sig(pctGig)} %</code>`],
        ['Share of a 10 Gbit/s link', `<code>${sig(pctGig / 10)} %</code>`],
      ])
      + `<pre class="working">on the wire = ${bytes} payload + ${hdr} headers = ${onWire} bytes
one stream  = ${onWire} × 8 × ${sig(pps)} = ${eng(one, 'bit/s')}
${n} streams  = ${eng(total, 'bit/s')}</pre>`
      + (pctGig > 20
        ? warn(`That is ${sig(pctGig)} per cent of a gigabit link, and a show network should sit under 20 per cent so that congestion never happens. Split it across VLANs, move to a 10 Gbit/s uplink, or check that the switch is not flooding this to ports that never asked for it.`)
        : good(`Comfortable on a gigabit link. Confirm IGMP snooping is on, or this reaches every port regardless of the number.`));
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Cable length, delay and termination ------------------------------------

TOOLS.cable = (root) => {
  root.append(h(`<p class="tool-sub">A signal travels down copper at about two thirds the speed of
    light, so about 5 nanoseconds per metre. That is how you locate a fault from the timing of its
    reflection, and it is how a cable fault locator works.</p>`));
  root.append(h(`<div class="fields">
    ${field('Know', sel('cb-k', [['len', 'The length, want the delay'], ['t', 'The reflection time, want the length']], 't'))}
    ${field('Value', inp('cb-v', '1', 'type="number" step="any" min="0"'))}
    ${field('Unit', sel('cb-u', [['m', 'metres'], ['us', 'microseconds'], ['ns', 'nanoseconds']], 'us'))}
    ${field('Velocity factor', sel('cb-vf', [
    ['0.66', '0.66 — typical twisted pair'], ['0.78', '0.78 — foam coax'],
    ['0.85', '0.85 — some data cable'], ['0.67', '0.67 — optical fibre'],
  ], '0.66'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);
  const C = 299792458;

  const run = () => {
    const k = $('#cb-k').value;
    const v = Math.max(0, num($('#cb-v').value, 0));
    const u = $('#cb-u').value;
    const vf = num($('#cb-vf').value, 0.66);
    const speed = C * vf;
    const nsPerM = 1e9 / speed;

    let length, oneWay;
    if (k === 'len') {
      length = u === 'm' ? v : 0;
      if (u !== 'm') {
        out.innerHTML = readout('Choose metres', 'You said you know the length, so give it in metres.', 'fail');
        return;
      }
      oneWay = length / speed;
    } else {
      const seconds = u === 'us' ? v * 1e-6 : u === 'ns' ? v * 1e-9 : NaN;
      if (!Number.isFinite(seconds)) {
        out.innerHTML = readout('Choose a time unit', 'You said you know the reflection time, so give it in µs or ns.', 'fail');
        return;
      }
      // The reflection made the trip twice.
      oneWay = seconds / 2;
      length = oneWay * speed;
    }

    out.innerHTML = readout(k === 'len' ? eng(oneWay * 2, 's') : `${sig(length)} m`,
      k === 'len' ? 'round trip, which is what a reflection takes' : 'to the discontinuity')
      + table([
        ['Cable length', `<code>${sig(length)} m</code>`],
        ['One-way delay', `<code>${eng(oneWay, 's')}</code>`],
        ['Round trip', `<code>${eng(oneWay * 2, 's')}</code>`],
        ['Delay per metre', `<code>${sig(nsPerM)} ns/m</code>`],
        ['Signal speed', `<code>${eng(speed, 'm/s')}</code>`],
      ])
      + `<pre class="working">speed  = c × ${vf} = ${eng(speed, 'm/s')}
       = ${sig(nsPerM)} ns per metre
${k === 'len'
        ? `one way   = ${sig(length)} ÷ ${sig(speed)} = ${eng(oneWay, 's')}
round trip = ${eng(oneWay * 2, 's')}`
        : `one way = ${eng(oneWay * 2, 's')} ÷ 2 = ${eng(oneWay, 's')}
length  = ${eng(oneWay, 's')} × ${sig(speed)} = ${sig(length)} m`}</pre>`
      + table([
        ['DMX cable impedance', '<code>110 Ω</code>, terminate with <code>120 Ω</code>'],
        ['Cat cable impedance', '<code>100 Ω</code>'],
        ['Video coax impedance', '<code>75 Ω</code>'],
        ['Maximum DMX run', '<code>about 300 m</code>'],
        ['Maximum Ethernet copper run', '<code>100 m</code>'],
      ]);
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Latency budget ---------------------------------------------------------

TOOLS.latency = (root) => {
  root.append(h(`<p class="tool-sub">Latency adds up along a chain, and the number that matters is
    the total from the moment somebody presses a button to the moment the audience notices. Add the
    stages and compare against what the discipline actually tolerates.</p>`));
  root.append(h(`<div class="fields">
    ${field('Source, sensor or operator (ms)', inp('lt-a', '5', 'type="number" step="any" min="0"'))}
    ${field('Controller processing (ms)', inp('lt-b', '10', 'type="number" step="any" min="0"'))}
    ${field('Network transport (ms)', inp('lt-c', '2', 'type="number" step="any" min="0"'))}
    ${field('Device processing (ms)', inp('lt-d', '20', 'type="number" step="any" min="0"'))}
    ${field('Physical response (ms)', inp('lt-e', '30', 'type="number" step="any" min="0"'), 'A lamp striking, a motor accelerating, a shutter opening')}
    ${field('Compare against', sel('lt-cmp', [
    ['5', 'Audio, 5 ms'], ['20', 'Video, one frame at 50 fps'], ['40', 'Lighting, 40 ms'],
    ['50', 'A cue, 50 ms'], ['100', 'Perceptible by an audience, 100 ms'],
  ], '50'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = () => {
    const parts = [
      ['Source or operator', num($('#lt-a').value, 0)],
      ['Controller', num($('#lt-b').value, 0)],
      ['Network', num($('#lt-c').value, 0)],
      ['Device', num($('#lt-d').value, 0)],
      ['Physical', num($('#lt-e').value, 0)],
    ];
    const total = parts.reduce((a, [, v]) => a + v, 0);
    const budget = num($('#lt-cmp').value, 50);
    const worst = parts.slice().sort((a, b) => b[1] - a[1])[0];

    out.innerHTML = readout(`${sig(total)} ms`, `against a ${budget} ms budget`, total > budget ? 'fail' : '')
      + table([
        ...parts.map(([k, v]) => [k, `<code>${sig(v)} ms</code> · ${sig(total ? (v / total) * 100 : 0)}%`]),
        ['<b>Total</b>', `<code><b>${sig(total)} ms</b></code>`],
        ['Frames at 25 fps', `<code>${sig(total / 40)}</code>`],
        ['Frames at 50 fps', `<code>${sig(total / 20)}</code>`],
      ])
      + `<pre class="working">${parts.map(([k, v]) => `${k.padEnd(20)} ${String(sig(v)).padStart(7)} ms`).join('\n')}
${'-'.repeat(31)}
${'total'.padEnd(20)} ${String(sig(total)).padStart(7)} ms</pre>`
      + (total > budget
        ? warn(`Over budget by ${sig(total - budget)} ms. The largest single contributor is <b>${worst[0]}</b> at ${sig(worst[1])} ms, so that is where to look first. Network latency is usually the smallest term and the one people try to fix.`)
        : good(`Within budget. Note that the largest contributor is <b>${worst[0]}</b> at ${sig(worst[1])} ms: if this needs to get faster, that is the term to attack, not the network.`));
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Subnet calculator ------------------------------------------------------

TOOLS.subnet = (root) => {
  root.append(h(`<p class="tool-sub">Every routing decision an endpoint makes is one bitwise AND.
    This shows it, in binary, because seeing the boundary fall inside a byte is what makes subnetting
    stop being a lookup table.</p>`));
  root.append(h(`<div class="fields">
    ${field('Address', inp('sn-ip', '10.101.7.150', 'autocomplete="off" spellcheck="false"'))}
    ${field('Prefix', sel('sn-p', Array.from({ length: 25 }, (_, i) => {
    const p = i + 8;
    return [p, `/${p}  ${intToIp(maskOf(p))}`];
  }), '26'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const bits32 = (n) => (n >>> 0).toString(2).padStart(32, '0').replace(/(\d{8})(?=\d)/g, '$1 ');

  const run = () => {
    const ipn = ipToInt($('#sn-ip').value);
    const p = int($('#sn-p').value, 24);
    if (ipn === null) {
      out.innerHTML = readout('Not an IPv4 address', 'Four numbers from 0 to 255, separated by dots.', 'fail');
      return;
    }
    const mask = maskOf(p);
    const net = netOf(ipn, p);
    const bc = bcastOf(ipn, p);
    const total = 2 ** (32 - p);
    const usable = Math.max(0, total - 2);
    const blockOctet = Math.min(3, Math.floor(p / 8));
    const maskOctet = (mask >>> (8 * (3 - blockOctet))) & 255;
    const block = 256 - maskOctet;

    out.innerHTML = readout(`${intToIp(net)}/${p}`, `${usable.toLocaleString()} usable addresses`)
      + table([
        ['Network address', `<code>${intToIp(net)}</code> — not assignable`],
        ['First usable', `<code>${intToIp(net + 1)}</code>`],
        ['Last usable', `<code>${intToIp(bc - 1)}</code>`],
        ['Broadcast address', `<code>${intToIp(bc)}</code> — not assignable`],
        ['Subnet mask', `<code>${intToIp(mask)}</code>`],
        ['Wildcard', `<code>${intToIp(~mask >>> 0)}</code>`],
        ['Total addresses', `<code>${total.toLocaleString()}</code>`],
        ['Usable addresses', `<code>${usable.toLocaleString()}</code>`],
        ['Block size', `<code>${block}</code> in octet ${blockOctet + 1}`],
      ])
      + `<pre class="working">Address    ${bits32(ipn)}   ${intToIp(ipn)}
Mask /${String(p).padEnd(2)}   ${bits32(mask)}   ${intToIp(mask)}
AND        ${'-'.repeat(35)}
Network    ${bits32(net)}   ${intToIp(net)}
Broadcast  ${bits32(bc)}   ${intToIp(bc)}

Shortcut:  block size = 256 − ${maskOctet} = ${block}
           ${String(ipn >>> (8 * (3 - blockOctet)) & 255)} ÷ ${block} = ${Math.floor(((ipn >>> (8 * (3 - blockOctet))) & 255) / block)} remainder, so the block starts at ${Math.floor(((ipn >>> (8 * (3 - blockOctet))) & 255) / block) * block}
Usable  =  2^(32−${p}) − 2 = ${total.toLocaleString()} − 2 = ${usable.toLocaleString()}</pre>`
      + (p >= 30 ? good('A /30 is the classic point-to-point link between two routers: exactly two usable addresses.') : '')
      + (p <= 16 ? warn('A network this large is one enormous broadcast domain. Every broadcast is processed by every device in it, which is the argument for VLANs rather than for a bigger subnet.') : '');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Subnet splitter --------------------------------------------------------

TOOLS.split = (root) => {
  root.append(h(`<p class="tool-sub">You have a range and you need to divide it between departments.
    Borrow bits from the host part: each bit borrowed doubles the number of subnets and halves the
    size of each.</p>`));
  root.append(h(`<div class="fields">
    ${field('Starting network', inp('sp-ip', '10.101.0.0', 'autocomplete="off" spellcheck="false"'))}
    ${field('Starting prefix', sel('sp-p', Array.from({ length: 17 }, (_, i) => {
    const p = i + 8;
    return [p, `/${p}`];
  }), '16'))}
    ${field('How to divide it', sel('sp-mode', [['count', 'Into this many subnets'], ['size', 'Into subnets holding this many devices']], 'count'))}
    ${field('Number', inp('sp-n', '8', 'type="number" step="1" min="1"'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = () => {
    const ipn = ipToInt($('#sp-ip').value);
    const p = int($('#sp-p').value, 16);
    const mode = $('#sp-mode').value;
    const n = Math.max(1, int($('#sp-n').value, 8));
    if (ipn === null) {
      out.innerHTML = readout('Not an IPv4 address', 'Four numbers from 0 to 255, separated by dots.', 'fail');
      return;
    }
    const base = netOf(ipn, p);

    let np, bits, why;
    if (mode === 'count') {
      bits = Math.ceil(Math.log2(n));
      np = p + bits;
      why = `${n} subnets needs enough borrowed bits that 2^bits ≥ ${n}.\n2^${bits} = ${2 ** bits}, so borrow ${bits} bits.`;
    } else {
      let hostBits = 1;
      while (2 ** hostBits - 2 < n && hostBits < 24) hostBits++;
      np = 32 - hostBits;
      bits = np - p;
      why = `${n} devices needs 2^hostBits − 2 ≥ ${n}.\n2^${hostBits} − 2 = ${(2 ** hostBits - 2).toLocaleString()}, so ${hostBits} host bits, which is /${np}.`;
    }

    if (np > 30 || np <= p) {
      out.innerHTML = readout('Does not divide', np <= p
        ? 'The result would be no smaller than what you started with. Start from a larger range or ask for more subnets.'
        : 'That leaves fewer than two usable addresses per subnet.', 'fail');
      return;
    }

    const count = 2 ** bits;
    const size = 2 ** (32 - np);
    const usable = size - 2;
    const show = Math.min(count, 16);
    const rows = [];
    for (let i = 0; i < show; i++) {
      const s = (base + i * size) >>> 0;
      rows.push([`Subnet ${i + 1}`, `<code>${intToIp(s)}/${np}</code> · ${intToIp(s + 1)} to ${intToIp(s + size - 2)}`]);
    }
    if (count > show) rows.push([`…and ${count - show} more`, `<code>up to ${intToIp((base + (count - 1) * size) >>> 0)}/${np}</code>`]);

    out.innerHTML = readout(`${count} × /${np}`, `${usable.toLocaleString()} usable addresses each`)
      + table([
        ['New prefix', `<code>/${np}</code> — mask ${intToIp(maskOf(np))}`],
        ['Bits borrowed', `<code>${bits}</code>`],
        ['Subnets', `<code>${count.toLocaleString()}</code>`],
        ['Addresses each', `<code>${size.toLocaleString()}</code>, ${usable.toLocaleString()} usable`],
        ['Block step', `<code>${size >= 256 ? `${size / 256} in the third octet` : `${size} in the fourth octet`}</code>`],
      ])
      + `<pre class="working">${why}
/${p} + ${bits} = /${np}   mask ${intToIp(maskOf(np))}
each holds 2^(32−${np}) − 2 = ${usable.toLocaleString()} usable</pre>`
      + table(rows)
      + good('Leave gaps. Assigning every subnet on day one means the first change note has nowhere to go, and address space is the cheapest thing in a design and the most painful to retrofit.');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- VLAN and address plan --------------------------------------------------

TOOLS.vlan = (root) => {
  root.append(h(`<p class="tool-sub">A starting plan for a show network, generated from one base
    range. Adjust the numbers to the house and then write it down, because a plan that lives only in
    the heads of the people who built it is a system nobody else can work on.</p>`));
  root.append(h(`<div class="fields">
    ${field('Base range', inp('vl-base', '10.101.0.0', 'autocomplete="off" spellcheck="false"'))}
    ${field('Subnet size', sel('vl-size', [['24', '/24 — 254 devices'], ['23', '/23 — 510 devices'], ['22', '/22 — 1022 devices']], '24'))}
    ${field('Third octet step', inp('vl-step', '10', 'type="number" step="1" min="1" max="50"'), 'VLAN 10 lands on x.x.10.0, VLAN 20 on x.x.20.0')}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const PLAN = [
    { id: 10, name: 'Lighting', carries: 'sACN, Art-Net, RDMnet, console remote', why: 'Multicast heavy. Must not share a broadcast domain with the audio clock.' },
    { id: 20, name: 'Audio', carries: 'Dante or AES67, and its PTP', why: 'Its own PTP domain. This is the separation that is not negotiable.' },
    { id: 30, name: 'Video', carries: 'NDI, ST 2110, media server control', why: 'Bursty and very large. Isolate it so a file copy cannot reach a cue.' },
    { id: 40, name: 'Control', carries: 'Show control, OSC, MSC over IP, timecode', why: 'Small, critical, and must never be congested.' },
    { id: 50, name: 'Management', carries: 'Switch management, device web interfaces, monitoring', why: 'No deadline, therefore no manners. Keep it off the show VLANs.' },
    { id: 60, name: 'Wireless', carries: 'Crew tablets and remotes', why: 'Untrusted by construction. Access list to exactly what it needs.' },
  ];

  const run = () => {
    const base = ipToInt($('#vl-base').value);
    const size = int($('#vl-size').value, 24);
    const step = Math.max(1, int($('#vl-step').value, 10));
    if (base === null) {
      out.innerHTML = readout('Not an IPv4 address', 'Four numbers from 0 to 255, separated by dots.', 'fail');
      return;
    }
    const b = netOf(base, 16);
    const usable = 2 ** (32 - size) - 2;

    const rows = PLAN.map((v, i) => {
      const third = (i + 1) * step;
      const net = (b + third * 256) >>> 0;
      return `<tr>
        <td><code>${v.id}</code></td>
        <td>${v.name}</td>
        <td><code>${intToIp(net)}/${size}</code></td>
        <td><code>${intToIp(net + 1)}</code></td>
        <td>${v.carries}</td>
      </tr>`;
    }).join('');

    out.innerHTML = readout(`${PLAN.length} VLANs`, `${usable.toLocaleString()} devices each, from ${intToIp(b)}`)
      + `<div class="table-wrap"><table>
        <thead><tr><th>VLAN</th><th>Name</th><th>Subnet</th><th>Gateway</th><th>Carries</th></tr></thead>
        <tbody>${rows}</tbody></table></div>`
      + `<pre class="working">Convention used here:
  .1              the gateway
  .10 to .19      consoles and controllers, static
  .20 to .99      nodes, gateways and fixed devices, DHCP reservation
  .100 upward     DHCP pool for laptops and tablets
  VLAN 1          left empty on purpose: it is where an
                  unconfigured port lands, and that should be harmless</pre>`
      + table(PLAN.map((v) => [`<b>VLAN ${v.id} · ${v.name}</b>`, v.why]))
      + warn('Three roles are singular and belong on the drawing by name: the <b>DHCP server</b>, the <b>IGMP querier</b> (exactly one per VLAN) and the <b>PTP grandmaster</b>. They are the three things nobody can find at 22:00.');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- PoE budget -------------------------------------------------------------

TOOLS.poe = (root) => {
  root.append(h(`<p class="tool-sub">A switch's power budget is not the sum of its port ratings. Add
    up what you actually intend to plug in, and leave headroom, because the failure mode is that the
    last devices to boot do not.</p>`));
  root.append(h(`<div class="fields">
    ${field('Switch power budget (W)', inp('pe-budget', '370', 'type="number" step="1" min="1"'), 'The total figure on the datasheet, not the per-port rating')}
    ${field('Standard', sel('pe-std', [
    ['12.95', '802.3af PoE — 12.95 W at the device'],
    ['25.5', '802.3at PoE+ — 25.5 W at the device'],
    ['51', '802.3bt Type 3 — 51 W at the device'],
    ['71.3', '802.3bt Type 4 — 71.3 W at the device'],
    ['custom', 'Measured draw…'],
  ], '25.5'))}
    ${field('Watts per device', inp('pe-w', '25.5', 'type="number" step="any" min="0.1"'))}
    ${field('How many devices', inp('pe-n', '12', 'type="number" step="1" min="1"'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = (e) => {
    const std = $('#pe-std').value;
    if (std !== 'custom' && (!e || e.target.id === 'pe-std')) $('#pe-w').value = std;
    if (e && e.target && e.target.id === 'pe-w' && std !== 'custom') $('#pe-std').value = 'custom';

    const budget = Math.max(1, num($('#pe-budget').value, 370));
    const w = Math.max(0.1, num($('#pe-w').value, 25.5));
    const n = Math.max(1, int($('#pe-n').value, 12));
    const draw = w * n;
    const pct = (draw / budget) * 100;
    const fit = Math.floor(budget / w);
    const safeFit = Math.floor((budget * 0.8) / w);

    out.innerHTML = readout(`${sig(draw)} W`, `${n} devices against a ${sig(budget)} W budget`, pct > 100 ? 'fail' : '')
      + table([
        ['Total draw', `<code>${sig(draw)} W</code>`],
        ['Share of the budget', `<code>${sig(pct)} %</code>`],
        ['Headroom', `<code>${sig(budget - draw)} W</code>`],
        ['Devices that fit at 100 %', `<code>${fit}</code>`],
        ['Devices that fit at 80 %', `<code>${safeFit}</code> — the number to design to`],
      ])
      + `<pre class="working">draw     = ${sig(w)} W × ${n} = ${sig(draw)} W
budget   = ${sig(budget)} W
used     = ${sig(pct)} %
at 80%   = ${sig(budget * 0.8)} W, which is ${safeFit} devices</pre>`
      + (pct > 100
        ? warn('Over budget. The switch will power devices until it runs out and then refuse the rest, usually the ones that boot last, which makes it look like those devices are faulty.')
        : pct > 80
          ? warn(`Over 80 per cent. Leave headroom: PoE devices draw more at startup than in steady state, and the next change note will add a device.`)
          : good('Comfortable. Remember that the gap between the source rating and the device rating is loss in up to 100 m of copper, so a device that boots on a short cable and fails on a long one is a cable length problem, not a switch problem.'));
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Clock accuracy and drift -----------------------------------------------

TOOLS.ptp = (root) => {
  root.append(h(`<p class="tool-sub">Two clocks that are not disciplined to each other drift apart at
    a rate set by their accuracy. This is why media over IP needs PTP rather than NTP, and why a
    timecode chain that is a fraction out is invisible for the first ten minutes.</p>`));
  root.append(h(`<div class="fields">
    ${field('Clock accuracy', sel('pt-acc', [
    ['0.0000001', 'PTP, 100 ns'],
    ['0.001', 'NTP on a LAN, 1 ms'],
    ['0.05', 'NTP over the internet, 50 ms'],
    ['custom', 'A stated ppm figure…'],
  ], '0.0000001'))}
    ${field('Or, parts per million', inp('pt-ppm', '0', 'type="number" step="any" min="0"'), 'A free-running crystal is typically 20 to 50 ppm')}
    ${field('Over how long', inp('pt-t', '3', 'type="number" step="any" min="0.01"'))}
    ${field('Unit', sel('pt-u', [['h', 'hours'], ['min', 'minutes'], ['d', 'days']], 'h'))}
    ${field('Frame rate, for context', sel('pt-fps', [['25', '25 fps'], ['29.97', '29.97 fps'], ['24', '24 fps'], ['48000', '48 kHz samples']], '25'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = () => {
    const accSel = $('#pt-acc').value;
    const ppm = Math.max(0, num($('#pt-ppm').value, 0));
    const t = Math.max(0.01, num($('#pt-t').value, 3));
    const u = $('#pt-u').value;
    const fps = num($('#pt-fps').value, 25);
    const seconds = u === 'h' ? t * 3600 : u === 'min' ? t * 60 : t * 86400;

    let drift, method;
    if (accSel === 'custom' || ppm > 0) {
      drift = seconds * (ppm / 1e6);
      method = `drift = ${sig(seconds)} s × ${sig(ppm)} ÷ 1,000,000 = ${eng(drift, 's')}`;
    } else {
      drift = Number(accSel);
      method = `A disciplined clock does not accumulate: it is corrected continuously,\nso the error stays at about ${eng(drift, 's')} however long it runs.`;
    }
    const frames = drift * fps;

    out.innerHTML = readout(eng(drift, 's'), `${accSel === 'custom' || ppm > 0 ? 'accumulated' : 'steady-state error'} over ${sig(t)} ${u}`)
      + table([
        ['Error', `<code>${eng(drift, 's')}</code>`],
        [fps > 1000 ? 'Samples at 48 kHz' : `Frames at ${fps} fps`, `<code>${sig(frames)}</code>`],
        ['Audible as a click?', `<code>${drift > 0.000021 ? 'Yes, past one sample at 48 kHz' : 'No'}</code>`],
        ['Visible as a frame slip?', `<code>${frames >= 1 ? 'Yes' : 'No'}</code>`],
      ])
      + `<pre class="working">${method}
${fps > 1000 ? 'samples' : 'frames'} = ${eng(drift, 's')} × ${sig(fps)} = ${sig(frames)}</pre>`
      + (accSel !== 'custom' && ppm === 0 && Number(accSel) < 1e-6
        ? good('This is why media over IP uses PTP. A disciplined clock does not accumulate error: the four-message exchange corrects it several times a second, forever.')
        : warn('A free-running clock accumulates. This is exactly the drop-frame problem in Session 8: two sources both reporting healthy, separating steadily, and invisible until it has added up.'));
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- DMX universe and address planner ---------------------------------------

TOOLS.universe = (root) => {
  root.append(h(`<p class="tool-sub">Next address is this address plus the footprint, not plus one.
    This lays a rig out, tells you where it overflows a universe, and shows what it costs to leave
    gaps, which is what makes a rig survive a change note.</p>`));
  root.append(h(`<div class="fields">
    ${field('Fixtures', inp('un-n', '24', 'type="number" step="1" min="1"'))}
    ${field('Channels each', inp('un-f', '16', 'type="number" step="1" min="1" max="512"'))}
    ${field('Start address', inp('un-s', '1', 'type="number" step="1" min="1" max="512"'))}
    ${field('Round each up to', sel('un-round', [['1', 'No gap, packed tight'], ['10', 'A multiple of 10'], ['20', 'A multiple of 20'], ['0', 'The next power of two'], ['32', 'A multiple of 32']], '20'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = () => {
    const n = Math.max(1, int($('#un-n').value, 24));
    const f = Math.min(512, Math.max(1, int($('#un-f').value, 16)));
    const s = Math.min(512, Math.max(1, int($('#un-s').value, 1)));
    const r = int($('#un-round').value, 20);

    const stride = r === 0 ? 2 ** Math.ceil(Math.log2(f)) : Math.max(f, Math.ceil(f / r) * r);
    const perUniverse = Math.floor((512 - s + 1) / stride);
    const universes = perUniverse > 0 ? Math.ceil(n / perUniverse) : Infinity;

    if (perUniverse <= 0) {
      out.innerHTML = readout('Nothing fits', `A stride of ${stride} does not fit between address ${s} and 512.`, 'fail');
      return;
    }

    const rows = [];
    let addr = s, uni = 1, placed = 0;
    for (let i = 0; i < Math.min(n, 20); i++) {
      if (addr + stride - 1 > 512) { uni++; addr = s; }
      rows.push([`Fixture ${i + 1}`, `<code>Universe ${uni} · ${addr}</code>${f !== stride ? ` <span style="color:var(--muted)">(uses ${addr}–${addr + f - 1}, ${stride - f} spare)</span>` : ''}`]);
      addr += stride; placed++;
    }
    if (n > 20) rows.push([`…and ${n - 20} more`, `<code>ending in universe ${universes}</code>`]);

    out.innerHTML = readout(`${universes} universe${universes > 1 ? 's' : ''}`, `${perUniverse} fixtures each at a stride of ${stride}`)
      + table([
        ['Footprint', `<code>${f} channels</code>`],
        ['Stride used', `<code>${stride}</code>${stride > f ? ` — ${stride - f} spare per fixture` : ' — packed tight'}`],
        ['Fixtures per universe', `<code>${perUniverse}</code>`],
        ['Universes needed', `<code>${universes}</code>`],
        ['Channels used per universe', `<code>${perUniverse * f} of 512</code> · ${sig((perUniverse * f / 512) * 100)}%`],
        ['Channels reserved as gaps', `<code>${perUniverse * (stride - f)}</code>`],
      ])
      + `<pre class="working">stride  = ${r === 0 ? `next power of two ≥ ${f}` : r === 1 ? 'the footprint itself' : `${f} rounded up to a multiple of ${r}`} = ${stride}
per uni = (512 − ${s} + 1) ÷ ${stride} = ${perUniverse} fixtures
total   = ${n} ÷ ${perUniverse} = ${universes} universe${universes > 1 ? 's' : ''}</pre>`
      + table(rows)
      + (stride === f
        ? warn('Packed tight. It fits, and the first fixture swapped for a larger one repatches everything after it. Rounding each fixture up to a round boundary costs a few channels and saves an afternoon.')
        : good(`Each fixture has ${stride - f} spare channels, so a fixture can be replaced with a larger one without moving anything else. That is the cheapest resilience in a lighting design.`));
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- DMX512 timing and refresh ----------------------------------------------

TOOLS.dmxtime = (root) => {
  root.append(h(`<p class="tool-sub">A full universe is about 22.7 ms, so about 44 Hz. Fewer channels
    refresh faster, and that is a real effect on fast moving-light chases rather than a curiosity.</p>`));
  root.append(h(`<div class="fields">
    ${field('Channels sent', inp('dt-n', '512', 'type="number" step="1" min="1" max="512"'))}
    ${field('Break (µs)', inp('dt-brk', '92', 'type="number" step="1" min="92"'), 'Minimum 92 µs')}
    ${field('Mark after break (µs)', inp('dt-mab', '12', 'type="number" step="1" min="12"'), 'Minimum 12 µs')}
    ${field('Inter-slot idle (µs)', inp('dt-idle', '0', 'type="number" step="1" min="0"'), 'Some transmitters add idle time between slots')}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = () => {
    const n = Math.min(512, Math.max(1, int($('#dt-n').value, 512)));
    const brk = Math.max(92, num($('#dt-brk').value, 92));
    const mab = Math.max(12, num($('#dt-mab').value, 12));
    const idle = Math.max(0, num($('#dt-idle').value, 0));

    const bitUs = 4;
    const slotUs = 11 * bitUs + idle;
    // The start code is a slot too.
    const packetUs = brk + mab + (n + 1) * slotUs;
    const hz = 1e6 / packetUs;
    const fullUs = brk + mab + 513 * slotUs;

    out.innerHTML = readout(`${sig(hz)} Hz`, `${sig(packetUs / 1000)} ms per packet with ${n} channels`)
      + table([
        ['One bit', `<code>${bitUs} µs</code>`],
        ['One slot, with framing', `<code>${sig(slotUs)} µs</code>`],
        ['Break', `<code>${sig(brk)} µs</code>`],
        ['Mark after break', `<code>${sig(mab)} µs</code>`],
        ['Start code plus slots', `<code>${sig((n + 1) * slotUs)} µs</code>`],
        ['<b>Whole packet</b>', `<code><b>${sig(packetUs)} µs</b></code> = ${sig(packetUs / 1000)} ms`],
        ['<b>Refresh rate</b>', `<code><b>${sig(hz)} Hz</b></code>`],
        ['A full 512 for comparison', `<code>${sig(fullUs / 1000)} ms, ${sig(1e6 / fullUs)} Hz</code>`],
        ['Speed-up against a full universe', `<code>${sig(hz / (1e6 / fullUs))}×</code>`],
      ])
      + `<pre class="working">bit    = 1 ÷ 250,000 = 4 µs
slot   = 11 bits × 4 µs${idle ? ` + ${sig(idle)} µs idle` : ''} = ${sig(slotUs)} µs
packet = ${sig(brk)} break + ${sig(mab)} mark + (${n} + 1) × ${sig(slotUs)}
       = ${sig(packetUs)} µs
rate   = 1,000,000 ÷ ${sig(packetUs)} = ${sig(hz)} Hz</pre>`
      + (n < 512
        ? good(`Sending ${n} channels instead of 512 gives ${sig(hz)} Hz instead of ${sig(1e6 / fullUs)} Hz, which is ${sig(hz / (1e6 / fullUs))} times faster. This is why some consoles offer a channel limit and why it is worth using on a fast chase.`)
        : '');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- DIP switch addressing --------------------------------------------------

TOOLS.dip = (root) => {
  root.append(h(`<p class="tool-sub">A DIP block is a binary number written in plastic. Switch 1 is
    worth 1, switch 2 is worth 2, and so on doubling. Some fixtures add one to the total and some do
    not, which is where the off-by-one comes from.</p>`));
  root.append(h(`<div class="fields">
    ${field('Direction', sel('dp-dir', [['toDip', 'Address to switches'], ['toAddr', 'Switches to address']], 'toDip'))}
    ${field('DMX address', inp('dp-addr', '181', 'type="number" step="1" min="1" max="512"'))}
    ${field('Switches on, comma separated', inp('dp-sw', '1,3,5,6,8', 'autocomplete="off" spellcheck="false"'))}
    ${field('Fixture convention', sel('dp-conv', [['0', 'Switches give the address directly'], ['1', 'Switches give address − 1']], '0'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = (e) => {
    const dir = $('#dp-dir').value;
    const conv = int($('#dp-conv').value, 0);
    let addr;

    if (dir === 'toDip') {
      addr = Math.min(512, Math.max(1, int($('#dp-addr').value, 1)));
    } else {
      const on = $('#dp-sw').value.split(/[,\s]+/).map((x) => int(x, 0)).filter((x) => x >= 1 && x <= 10);
      const val = on.reduce((a, b) => a + 2 ** (b - 1), 0);
      addr = val + conv;
      if (e && e.target && e.target.id !== 'dp-addr') $('#dp-addr').value = addr;
    }

    const val = Math.max(0, addr - conv);
    const on = [];
    for (let i = 0; i < 10; i++) if (val & (1 << i)) on.push(i + 1);
    if (dir === 'toDip' && (!e || e.target.id !== 'dp-sw')) $('#dp-sw').value = on.join(',');

    const strip = Array.from({ length: 10 }, (_, i) => {
      const isOn = on.includes(i + 1);
      return `<span style="display:inline-block;width:34px;text-align:center;padding:6px 0;margin:2px;border-radius:5px;font:600 12px/1 var(--mono);background:${isOn ? 'var(--amber)' : 'var(--raised)'};color:${isOn ? 'var(--ground)' : 'var(--muted)'};border:1px solid var(--line)">${i + 1}<br><small>${isOn ? 'ON' : 'off'}</small></span>`;
    }).join('');

    out.innerHTML = readout(`Address ${addr}`, `switches ${on.length ? on.join(', ') : 'none'} on`)
      + `<div style="margin:12px 0">${strip}</div>`
      + table([
        ['Address', `<code>${addr}</code>`],
        ['Binary value set', `<code>${val} = ${val.toString(2).padStart(10, '0')}</code>`],
        ['Switches on', `<code>${on.length ? on.join(', ') : 'none'}</code>`],
        ['Convention', `<code>${conv ? 'switches = address − 1' : 'switches = address'}</code>`],
        ['The other convention would give', `<code>${conv ? addr - 1 : addr + 1}</code>`],
      ])
      + `<pre class="working">${on.length
        ? on.map((s) => `switch ${String(s).padStart(2)} = ${String(2 ** (s - 1)).padStart(4)}`).join('\n')
        : 'no switches on'}
${'-'.repeat(20)}
${'total'.padEnd(9)} = ${String(val).padStart(4)}${conv ? `\n+ 1 (this fixture's convention)\n${'address'.padEnd(9)} = ${String(addr).padStart(4)}` : ''}</pre>`
      + warn('Two fixtures on the same address both respond, identically, forever, and nothing reports an error. Check the fixture manual for which convention it uses, because being one out is the commonest addressing fault there is.');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- sACN and Art-Net universe addressing -----------------------------------

TOOLS.sacn = (root) => {
  root.append(h(`<p class="tool-sub">A universe number maps onto a multicast group address, and being
    able to do that in your head is how you write a Wireshark filter that isolates one universe out
    of a hundred.</p>`));
  root.append(h(`<div class="fields">
    ${field('Universe', inp('sa-u', '300', 'type="number" step="1" min="1" max="63999"'))}
    ${field('Art-Net net', inp('sa-net', '0', 'type="number" step="1" min="0" max="127"'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = () => {
    const u = Math.min(63999, Math.max(1, int($('#sa-u').value, 1)));
    const hi = Math.floor(u / 256);
    const lo = u % 256;
    const group = `239.255.${hi}.${lo}`;
    // Art-Net's port address is 15 bits: net (7) : sub-net (4) : universe (4).
    const anet = Math.min(127, Math.max(0, int($('#sa-net').value, 0)));
    const port = (u - 1) & 0x7FFF;
    const aSub = (port >> 4) & 0x0F;
    const aUni = port & 0x0F;
    const mac = `01:00:5E:${(0x7F & 255).toString(16).toUpperCase().padStart(2, '0')}:${hi.toString(16).toUpperCase().padStart(2, '0')}:${lo.toString(16).toUpperCase().padStart(2, '0')}`;

    out.innerHTML = readout(group, `sACN multicast group for universe ${u}`)
      + table([
        ['Universe', `<code>${u}</code>`],
        ['High byte', `<code>${hi}</code> = ${u} ÷ 256, rounded down`],
        ['Low byte', `<code>${lo}</code> = ${u} mod 256`],
        ['<b>Multicast group</b>', `<code><b>${group}</b></code>`],
        ['Multicast MAC', `<code>${mac}</code>`],
        ['sACN port', '<code>UDP 5568</code>'],
        ['Wireshark filter', `<code>ip.dst == ${group}</code>`],
        ['Art-Net port address', `<code>net ${anet} : sub-net ${aSub} : universe ${aUni}</code>`],
        ['Art-Net port', '<code>UDP 6454</code>'],
      ])
      + `<pre class="working">sACN:
  ${u} ÷ 256 = ${hi} remainder ${lo}
  group = 239.255.${hi}.${lo}

Art-Net numbers from zero, in a 15-bit port address split
into net : sub-net : universe, which is why console universe
${u} and Art-Net universe ${aUni} are the same thing and off-by-one
universe errors are constant between the two.</pre>`
      + good('A device that has joined only its own universes receives only those. That is the whole advantage of sACN over broadcast Art-Net, and it exists only if IGMP snooping is working and a querier is present.');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Pixel load and universe count ------------------------------------------

TOOLS.pixels = (root) => {
  root.append(h(`<p class="tool-sub">One universe of 512 channels holds 170 RGB pixels with two
    channels spare. Everything about a large pixel rig follows from that number and from the network
    load it produces.</p>`));
  root.append(h(`<div class="fields">
    ${field('Shape', sel('px-shape', [['tape', 'A run of tape'], ['wall', 'A wall or panel']], 'wall'))}
    ${field('Width (m) or length (m)', inp('px-w', '4', 'type="number" step="any" min="0.01"'))}
    ${field('Height (m), for a wall', inp('px-h', '3', 'type="number" step="any" min="0.01"'))}
    ${field('Pitch (mm) or pixels per metre', inp('px-p', '50', 'type="number" step="any" min="1"'), 'A wall is a pitch in mm; tape is pixels per metre')}
    ${field('Channels per pixel', sel('px-c', [['3', '3 — RGB'], ['4', '4 — RGBW'], ['6', '6 — RGB 16-bit']], '3'))}
    ${field('Refresh (Hz)', inp('px-hz', '44', 'type="number" step="any" min="1" max="60"'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const run = () => {
    const shape = $('#px-shape').value;
    const w = Math.max(0.01, num($('#px-w').value, 4));
    const hgt = Math.max(0.01, num($('#px-h').value, 3));
    const p = Math.max(1, num($('#px-p').value, 50));
    const cpp = int($('#px-c').value, 3);
    const hz = Math.max(1, num($('#px-hz').value, 44));

    let pixels, how;
    if (shape === 'wall') {
      const cols = Math.floor((w * 1000) / p);
      const rows = Math.floor((hgt * 1000) / p);
      pixels = cols * rows;
      how = `${w} m ÷ ${p} mm = ${cols} columns\n${hgt} m ÷ ${p} mm = ${rows} rows\npixels = ${cols} × ${rows} = ${pixels.toLocaleString()}`;
    } else {
      pixels = Math.floor(w * p);
      how = `${w} m × ${p} pixels/m = ${pixels.toLocaleString()} pixels`;
    }

    const perUniverse = Math.floor(512 / cpp);
    const universes = Math.ceil(pixels / perUniverse);
    const channels = pixels * cpp;
    // 638 bytes of sACN plus 42 of headers.
    const bits = universes * (638 + 42) * 8 * hz;

    out.innerHTML = readout(`${universes} universe${universes === 1 ? '' : 's'}`, `${pixels.toLocaleString()} pixels, ${channels.toLocaleString()} channels`)
      + table([
        ['Pixels', `<code>${pixels.toLocaleString()}</code>`],
        ['Channels per pixel', `<code>${cpp}</code>`],
        ['Total channels', `<code>${channels.toLocaleString()}</code>`],
        ['Pixels per universe', `<code>${perUniverse}</code>`],
        ['<b>Universes</b>', `<code><b>${universes}</b></code>`],
        ['Channels wasted per universe', `<code>${512 - perUniverse * cpp}</code>`],
        ['Network load at ' + sig(hz) + ' Hz', `<code>${eng(bits, 'bit/s')}</code>`],
        ['Share of a gigabit link', `<code>${sig((bits / 1e9) * 100)} %</code>`],
      ])
      + `<pre class="working">${how}
per universe = 512 ÷ ${cpp} = ${perUniverse} pixels
universes    = ${pixels.toLocaleString()} ÷ ${perUniverse} = ${universes}
network      = ${universes} × 680 bytes × 8 × ${sig(hz)} Hz = ${eng(bits, 'bit/s')}</pre>`
      + (universes > 40
        ? warn(`${universes} universes is where network configuration stops being good practice and starts being the difference between a rig that works and one that does not. IGMP snooping with a querier, sACN rather than broadcast Art-Net, and the media servers on a different VLAN.`)
        : good('Comfortable, provided multicast is being delivered only where it is wanted. Without IGMP snooping every one of these universes reaches every device on the network.'));
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- MIDI message decoder ---------------------------------------------------

TOOLS.midi = (root) => {
  root.append(h(`<p class="tool-sub">Paste bytes from a monitor and read what they are. The whole
    protocol turns on one rule: the top bit of a byte says whether it is a status byte or a data
    byte, which is why data values stop at 127.</p>`));
  root.append(h(`<div class="fields">
    ${field('Bytes', inp('mi-b', '90 3C 64', 'autocomplete="off" spellcheck="false"'), 'Hex, space separated. Decimal also works.')}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const CH = {
    0x8: ['Note Off', ['note', 'velocity']],
    0x9: ['Note On', ['note', 'velocity']],
    0xA: ['Polyphonic Aftertouch', ['note', 'pressure']],
    0xB: ['Control Change', ['controller', 'value']],
    0xC: ['Program Change', ['program']],
    0xD: ['Channel Aftertouch', ['pressure']],
    0xE: ['Pitch Bend', ['LSB', 'MSB']],
  };
  const SYS = {
    0xF0: 'System Exclusive start — manufacturer or universal data follows until F7',
    0xF1: 'MIDI Time Code quarter frame',
    0xF2: 'Song Position Pointer',
    0xF3: 'Song Select',
    0xF6: 'Tune Request',
    0xF7: 'End of System Exclusive',
    0xF8: 'Timing Clock — 24 per quarter note',
    0xFA: 'Start',
    0xFB: 'Continue',
    0xFC: 'Stop',
    0xFE: 'Active Sensing — a keep-alive, about every 300 ms',
    0xFF: 'System Reset',
  };
  const NOTE = (n) => `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][n % 12]}${Math.floor(n / 12) - 1}`;

  const run = () => {
    const bytes = $('#mi-b').value.trim().split(/[\s,]+/).filter(Boolean).map((t) => {
      const s = t.replace(/^0x/i, '');
      const v = /^[0-9a-f]+$/i.test(s) && (s.length > 1 || /[a-f]/i.test(s)) ? parseInt(s, 16) : Number(t);
      return Number.isFinite(v) ? v & 255 : NaN;
    });
    if (!bytes.length || bytes.some(Number.isNaN)) {
      out.innerHTML = readout('Not readable bytes', 'Give hex bytes separated by spaces, such as 90 3C 64.', 'fail');
      return;
    }

    const rows = bytes.map((b) => {
      const status = !!(b & 0x80);
      let what;
      if (!status) what = `data byte, value ${b}`;
      else if (b >= 0xF0) what = SYS[b] || 'undefined system message';
      else {
        const hiN = (b >> 4) & 0xF;
        what = `${CH[hiN] ? CH[hiN][0] : 'unknown'}, channel ${(b & 0x0F) + 1}`;
      }
      return [`<code>${hex(b)}</code>`, `<code>${bin8(b)}</code> · ${b} · ${status ? '<b>status</b>' : 'data'} · ${what}`];
    });

    // Interpret the first complete message.
    let verdict = '';
    const s0 = bytes[0];
    if (s0 & 0x80 && s0 < 0xF0) {
      const hiN = (s0 >> 4) & 0xF;
      const def = CH[hiN];
      if (def) {
        const args = def[1].map((n, i) => `${n} ${bytes[i + 1] ?? '—'}`).join(', ');
        verdict = `<b>${def[0]}</b> on channel ${(s0 & 0x0F) + 1}: ${args}`;
        if (hiN === 0x9) {
          verdict += `. Note ${bytes[1]} is ${NOTE(bytes[1] ?? 0)}`;
          if (bytes[2] === 0) verdict += ', and velocity 0 conventionally means Note Off';
        }
        if (hiN === 0xC) verdict += '. Program Change is the most common way a show cue is recalled over plain MIDI';
        if (hiN === 0xE && bytes.length >= 3) verdict += `. Combined 14-bit value ${(bytes[2] << 7) | bytes[1]}`;
      }
    } else if (s0 === 0xF0) {
      verdict = bytes[1] === 0x7F && bytes[3] === 0x02
        ? `<b>MIDI Show Control</b>, device ${bytes[2]}. Open the MSC tool to build or read it.`
        : '<b>System Exclusive.</b> Manufacturer or universal data, ending at F7.';
    } else if (s0 >= 0xF0) {
      verdict = `<b>${SYS[s0] || 'System message'}</b>`;
    } else {
      verdict = 'Starts with a data byte, so either this is running status, or you have caught the stream mid-message.';
    }

    out.innerHTML = readout(`${bytes.length} byte${bytes.length > 1 ? 's' : ''}`, verdict)
      + table(rows)
      + `<pre class="working">The one test: byte & 0x80
  non-zero → status byte, this starts a message
  zero     → data byte, it belongs to the last status

Data has seven bits, so 0 to 127.
Time on a DIN cable: ${sig((bytes.length * 10) / 31250 * 1000)} ms at 31.25 kbit/s</pre>`;
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- MIDI Show Control message builder --------------------------------------

TOOLS.msc = (root) => {
  root.append(h(`<p class="tool-sub">MSC is a System Exclusive message with a reserved ID. Build one
    here, then send it by hand once, and the protocol becomes permanent.</p>`));
  root.append(h(`<div class="fields">
    ${field('Device ID', inp('ms-dev', '1', 'type="number" step="1" min="0" max="127"'), '127 is all-call')}
    ${field('Command format', sel('ms-fmt', [
    ['1', '0x01 — Lighting, general'], ['2', '0x02 — Moving lights'], ['3', '0x03 — Colour changers'],
    ['5', '0x05 — Lasers'], ['16', '0x10 — Sound, general'], ['17', '0x11 — Music'],
    ['32', '0x20 — Machinery, general'], ['48', '0x30 — Video, general'], ['64', '0x40 — Projection'],
    ['80', '0x50 — Process control'], ['96', '0x60 — Pyrotechnics'], ['127', '0x7F — All types'],
  ], '1'))}
    ${field('Command', sel('ms-cmd', [
    ['1', '0x01 — GO'], ['2', '0x02 — STOP'], ['3', '0x03 — RESUME'], ['4', '0x04 — TIMED_GO'],
    ['5', '0x05 — LOAD'], ['6', '0x06 — SET'], ['7', '0x07 — FIRE'], ['8', '0x08 — ALL_OFF'],
    ['9', '0x09 — RESTORE'], ['10', '0x0A — RESET'], ['11', '0x0B — GO_OFF'],
  ], '1'))}
    ${field('Cue number', inp('ms-cue', '12.5', 'autocomplete="off" spellcheck="false"'), 'Leave empty to mean "the next cue"')}
    ${field('Cue list', inp('ms-list', '', 'autocomplete="off" spellcheck="false"'), 'Optional')}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const FMT = {
    1: 'Lighting, general', 2: 'Moving lights', 3: 'Colour changers', 5: 'Lasers',
    16: 'Sound, general', 17: 'Music', 32: 'Machinery, general', 48: 'Video, general',
    64: 'Projection, general', 80: 'Process control', 96: 'Pyrotechnics, general', 127: 'All types',
  };
  const CMD = {
    1: 'GO', 2: 'STOP', 3: 'RESUME', 4: 'TIMED_GO', 5: 'LOAD', 6: 'SET',
    7: 'FIRE', 8: 'ALL_OFF', 9: 'RESTORE', 10: 'RESET', 11: 'GO_OFF',
  };

  const run = () => {
    const dev = Math.min(127, Math.max(0, int($('#ms-dev').value, 1)));
    const fmt = int($('#ms-fmt').value, 1);
    const cmd = int($('#ms-cmd').value, 1);
    const cue = $('#ms-cue').value.trim().replace(/[^0-9.]/g, '');
    const list = $('#ms-list').value.trim().replace(/[^0-9.]/g, '');

    const bytes = [0xF0, 0x7F, dev, 0x02, fmt, cmd];
    const ascii = [];
    if (cue) {
      for (const ch of cue) { bytes.push(ch.charCodeAt(0)); ascii.push([ch, ch.charCodeAt(0)]); }
      if (list) {
        bytes.push(0x00);
        for (const ch of list) { bytes.push(ch.charCodeAt(0)); ascii.push([ch, ch.charCodeAt(0)]); }
      }
    }
    bytes.push(0xF7);

    const hexStr = bytes.map((b) => hex(b).slice(2)).join(' ');
    const ms = (bytes.length * 10) / 31250 * 1000;

    out.innerHTML = readout(`<code style="font-size:0.75em">${hexStr}</code>`, `${bytes.length} bytes, ${sig(ms)} ms on a DIN cable`)
      + table([
        ['F0', 'System Exclusive start'],
        ['7F', 'Universal real-time'],
        [hex(dev).slice(2), `Device ID ${dev}${dev === 127 ? ' — all-call' : ''}`],
        ['02', 'Sub-ID: this is MIDI Show Control'],
        [hex(fmt).slice(2), `Command format: ${FMT[fmt]}`],
        [hex(cmd).slice(2), `Command: ${CMD[cmd]}`],
        ...(cue ? [[ascii.map(([, c]) => hex(c).slice(2)).join(' '), `Cue data as ASCII: "${cue}"${list ? ` in list "${list}"` : ''}`]] : []),
        ['F7', 'End of System Exclusive'],
      ])
      + `<pre class="working">${hexStr}
${cue ? `\nASCII: ${ascii.map(([ch, c]) => `${hex(c).slice(2)} = "${ch}"`).join('   ')}` : '\nNo cue data, which means "the next cue".'}

Time on a DIN cable: ${bytes.length} bytes × 10 bits ÷ 31,250 = ${sig(ms)} ms</pre>`
      + warn('MSC over DIN is fire and forget. There is no acknowledgement in any implementation you will meet, so nothing tells you whether the cue happened. If confirmation matters, use a path that returns a status, or build a return path yourself.')
      + (cmd <= 3 ? good('GO, STOP and RESUME are the recommended minimum set, so this is the part of MSC that is most likely to be implemented correctly at the far end.') : '');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// --- Timecode and drop-frame calculator -------------------------------------

TOOLS.timecode = (root) => {
  root.append(h(`<p class="tool-sub">Add and subtract timecode, convert to and from frames and
    seconds, and see the drop-frame correction happen. Drop frame skips frame numbers, never
    frames.</p>`));
  root.append(h(`<div class="fields">
    ${field('Timecode A', inp('tc-a', '01:23:45:12', 'autocomplete="off" spellcheck="false"'), 'hh:mm:ss:ff')}
    ${field('Operation', sel('tc-op', [['none', 'Just analyse A'], ['add', 'A + B'], ['sub', 'A − B']], 'none'))}
    ${field('Timecode B', inp('tc-b', '00:00:10:00', 'autocomplete="off" spellcheck="false"'))}
    ${field('Frame rate', sel('tc-fps', [
    ['25', '25 — Europe, most of Asia'], ['24', '24 — film'],
    ['29.97df', '29.97 drop frame'], ['29.97nd', '29.97 non-drop'],
    ['30', '30'], ['50', '50'], ['60', '60'],
  ], '25'))}
  </div>`));
  const out = h('<div></div>');
  root.append(out);

  const parseTc = (s) => {
    const m = /^(\d{1,2})[:;.](\d{1,2})[:;.](\d{1,2})[:;.](\d{1,3})$/.exec(String(s).trim());
    if (!m) return null;
    return { h: +m[1], m: +m[2], s: +m[3], f: +m[4] };
  };
  const fmt = (t, df) => `${String(t.h).padStart(2, '0')}:${String(t.m).padStart(2, '0')}:${String(t.s).padStart(2, '0')}${df ? ';' : ':'}${String(t.f).padStart(2, '0')}`;

  // Drop frame numbers frames as if 30 fps but skips 00 and 01 each minute
  // except every tenth. This converts a timecode to a frame count and back.
  const toFrames = (t, nominal, df) => {
    let n = ((t.h * 60 + t.m) * 60 + t.s) * nominal + t.f;
    if (df) {
      const totalMinutes = t.h * 60 + t.m;
      n -= 2 * (totalMinutes - Math.floor(totalMinutes / 10));
    }
    return n;
  };
  const fromFrames = (n, nominal, df) => {
    if (df) {
      const framesPer10Min = nominal * 60 * 10 - 18 * 2;
      const framesPerMin = nominal * 60 - 2;
      const d = Math.floor(n / framesPer10Min);
      let m = n % framesPer10Min;
      if (m >= nominal * 60) {
        m -= nominal * 60;
        n += 18 * 2 * d + 2 * (1 + Math.floor(m / framesPerMin));
      } else {
        n += 18 * 2 * d;
      }
    }
    const f = n % nominal;
    const s = Math.floor(n / nominal) % 60;
    const mi = Math.floor(n / (nominal * 60)) % 60;
    const hh = Math.floor(n / (nominal * 3600)) % 24;
    return { h: hh, m: mi, s, f };
  };

  const run = () => {
    const fpsSel = $('#tc-fps').value;
    const df = fpsSel === '29.97df';
    const nominal = /^29\.97/.test(fpsSel) ? 30 : Number(fpsSel);
    const real = /^29\.97/.test(fpsSel) ? 30000 / 1001 : Number(fpsSel);

    const A = parseTc($('#tc-a').value);
    const B = parseTc($('#tc-b').value);
    if (!A) {
      out.innerHTML = readout('Not a timecode', 'Write it as hh:mm:ss:ff.', 'fail');
      return;
    }
    if (A.f >= nominal || A.m > 59 || A.s > 59) {
      out.innerHTML = readout('Out of range', `At this rate the frames field runs 0 to ${nominal - 1}.`, 'fail');
      return;
    }

    const op = $('#tc-op').value;
    const fa = toFrames(A, nominal, df);
    let frames = fa, label = 'A';
    if (op !== 'none' && B) {
      const fb = toFrames(B, nominal, df);
      frames = op === 'add' ? fa + fb : Math.max(0, fa - fb);
      label = op === 'add' ? 'A + B' : 'A − B';
    }
    const result = fromFrames(frames, nominal, df);
    const seconds = frames / real;

    // How far a non-drop count would have wandered from real time.
    const ndSeconds = frames / nominal;
    const slip = /^29\.97/.test(fpsSel) && !df ? seconds - ndSeconds : 0;

    out.innerHTML = readout(fmt(result, df), `${label} at ${fpsSel.replace('df', ' drop frame').replace('nd', ' non-drop')}`)
      + table([
        ['Total frames', `<code>${frames.toLocaleString()}</code>`],
        ['Real elapsed time', `<code>${sig(seconds)} s</code> = ${fmt(fromFrames(Math.round(seconds * nominal), nominal, false), false)} at ${nominal} fps`],
        ['One frame lasts', `<code>${sig(1000 / real)} ms</code>`],
        ['Actual frame rate', `<code>${sig(real, 7)} fps</code>`],
        ...(df ? [['Frame numbers skipped so far', `<code>${(2 * ((A.h * 60 + A.m) - Math.floor((A.h * 60 + A.m) / 10))).toLocaleString()}</code>`]] : []),
        ...(slip ? [['Behind the wall clock', `<code>${sig(slip)} s</code>`]] : []),
      ])
      + `<pre class="working">frames = ((${result.h} × 60 + ${result.m}) × 60 + ${result.s}) × ${nominal} + ${result.f}${df ? `
       − 2 × (minutes − minutes÷10)   ← the drop-frame correction` : ''}
       = ${frames.toLocaleString()}
seconds = ${frames.toLocaleString()} ÷ ${sig(real, 7)} = ${sig(seconds)} s</pre>`
      + (df
        ? good('Drop frame skips frame numbers 00 and 01 at the start of every minute except every tenth, which is 108 numbers an hour. Every frame of the recording is present; only the numbering skips.')
        : /^29\.97/.test(fpsSel)
          ? warn('Non-drop at 29.97 counts every frame number, so it falls about 3.6 seconds behind the wall clock every hour. That is fine for a music session and wrong when it has to match a broadcast clock, and it is the classic long-show drift.')
          : nominal === 25
            ? good('At 25 fps there is no drop frame, because 25 is exactly 25. A device offering drop frame at this rate has been misconfigured.')
            : '');
  };
  root.addEventListener('input', run);
  root.addEventListener('change', run);
  run();
};

// ============================================================================
// Mount
// ============================================================================

for (const node of document.querySelectorAll('.tool[data-tool]')) {
  if (node.dataset.mounted) continue;
  const fn = TOOLS[node.dataset.tool];
  if (!fn) { node.remove(); continue; }
  node.dataset.mounted = '1';
  try {
    fn(node);
  } catch (err) {
    console.error('tool failed:', node.dataset.tool, err);
    node.remove();
  }
}
