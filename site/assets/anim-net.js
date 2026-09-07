// Session 4: Ethernet and IP. The network under every show.

import { register } from './anim-core.js';
import {
  figure, canvas, slider, toggle, choice, button, label, labelWrap, box, line,
  palette, alpha, fitter, compare, chain, role, node, arrow, flowDots, eng, sig,
} from './anim-kit.js';

const ipToInt = (ip) => ip.split('.').reduce((a, o) => a * 256 + (+o), 0) >>> 0;
const intToIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
const maskOf = (p) => (p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0);

register('osi-ladder', (host) => {
  let faultAt = 1;

  const LAYERS = [
    { n: 4, name: 'Transport', what: 'TCP or UDP, ports, and whether the program is listening', test: 'Is the port open? Does a capture show packets on it?', fail: 'The device is present and the application does not see it' },
    { n: 3, name: 'Network', what: 'IP addresses and routing between networks', test: 'ping the address, then ping the gateway', fail: 'No route, wrong mask, a firewall, or genuinely absent' },
    { n: 2, name: 'Data link', what: 'MAC addresses and Ethernet frames', test: 'arp -a, and look at the switch MAC table', fail: 'Present on the wire and not answering IP, or a duplicate address' },
    { n: 1, name: 'Physical', what: 'Copper, fibre, radio: voltages and light', test: 'Link light, and the switch port error counters', fail: 'Cable, port, transceiver, or the device is off' },
  ];

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Climbing the ladder',
    sub: 'Put the fault at a layer and watch the search stop there. That is what the model is for.',
    note: '',
  });

  const upd = () => {
    const L = LAYERS.find((l) => l.n === faultAt);
    setNote(`The fault is at layer ${faultAt}, ${L.name}. Starting at the bottom, every test below it passes and the test at ${L.name} fails, so you stop there and never waste time above it. <b>That is the whole value of the model: it turns "the lights are not working" into four tests, and the application is where the problem appears rather than where it is.</b>`);
    cv.once();
  };

  controls.append(choice('Put the fault at', LAYERS.slice().reverse().map((l) => [l.n, `${l.n} · ${l.name}`]), {
    value: 1, on: (v) => { faultAt = Number(v); upd(); },
  }).node);

  challenge('Put the fault at layer 4 and count how many tests pass before you find it.', () => faultAt === 4);

  let cvRef = null;
  const fit = fitter(() => cvRef);

  const cv = canvas(stage, {
    height: 300, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 14;
      const rowH = 62;
      let y = 26;

      label(g, 'start at the bottom, go up, stop at the first thing that fails', pad, 14,
        { color: p.muted, size: 10 });

      for (const L of LAYERS) {
        const isFault = L.n === faultAt;
        const below = L.n < faultAt;
        const tone = isFault ? R.fault : below ? R.safe : p.muted;
        box(g, pad, y, w - pad * 2, rowH - 8, {
          fill: alpha(tone, isFault ? 0.14 : below ? 0.08 : 0.03),
          stroke: alpha(tone, isFault ? 1 : below ? 0.5 : 0.25), r: 8, lw: isFault ? 2 : 1,
        });
        label(g, String(L.n), pad + 18, y + 26, { color: tone, size: 18, align: 'center', weight: 800 });
        label(g, L.name, pad + 38, y + 16, { color: isFault ? p.ink : p.ink2, size: 12.5, weight: 700, max: w * 0.3 });
        label(g, L.what, pad + 38, y + 32, { color: p.muted, size: 10.5, max: w * 0.42 });
        const rx = pad + Math.max(w * 0.46, 200);
        label(g, isFault ? 'FAILS HERE' : below ? 'passes' : 'never reached',
          rx, y + 16, { color: tone, size: 11, weight: 700, max: w - rx - pad - 8 });
        label(g, isFault ? L.fail : L.test, rx, y + 32, {
          color: isFault ? R.fault : p.muted, size: 10.5, max: w - rx - pad - 8,
        });
        y += rowH;
      }

      const done = LAYERS.filter((l) => l.n <= faultAt).length;
      labelWrap(g, `Found in ${done} test${done > 1 ? 's' : ''}. Layers above the fault are never touched, and the layers below are proved rather than assumed. Working downward from the application instead would have taken ${5 - done} tests to get here and left you unsure what was proved.`,
        pad, y + 12, { color: p.ink2, size: 11.5, max: w - pad * 2, maxLines: 3 });
      fit(y + 62);
    },
  });
  cvRef = cv;
  upd();
});

register('encapsulation', (host) => {
  let peel = 0;

  const LAYERS = [
    { name: 'Ethernet frame', size: 14, tail: 4, col: 'energy', what: 'Destination MAC, source MAC, type. A switch reads this and nothing else.' },
    { name: 'IP header', size: 20, tail: 0, col: 'signal', what: 'Source and destination IP, TTL, protocol. A router reads this.' },
    { name: 'UDP header', size: 8, tail: 0, col: 'safe', what: 'Source port, destination port, length, checksum. Port 5568 means sACN.' },
    { name: 'sACN packet', size: 638, tail: 0, col: 'energy', what: 'Root layer, framing layer, DMP layer, then 512 slot values. The thing you actually wanted.' },
  ];

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'One universe, as it exists on the wire',
    sub: 'Peel the layers off. Each one is a header the layer below added, and each device in the path reads only its own.',
    note: '',
  });

  const upd = () => {
    setNote(peel === 0
      ? 'A universe of 512 slots costs 638 bytes of sACN plus 42 bytes of headers, so 680 bytes on the wire. At 44 Hz that is about 240 kbit/s per universe, not the 200 the payload alone suggests. <b>Across a hundred universes that difference is 4 Mbit/s, and it is the term people leave out of a capacity plan.</b>'
      : peel === 1
        ? 'The Ethernet header is gone, and with it everything a switch could see. <b>A switch reads the destination MAC and forwards, and that is all: it cannot tell sACN from a file copy, which is exactly why Session 5 has to teach it to.</b>'
        : peel === 2
          ? 'The IP header is gone. This is where a router made its decision, and where the DSCP priority marking lives. <b>A switch that does not trust DSCP on ingress rewrites it to zero here, and your careful QoS marking is gone before it has done anything.</b>'
          : peel === 3
            ? 'The UDP header is gone. Port 5568 was the only thing identifying this as sACN rather than as any other UDP traffic. <b>Learning four port numbers turns a wall of packets in Wireshark into an answer.</b>'
            : 'What is left is the thing you actually wanted: 512 byte values and the framing that says which universe they belong to. <b>Everything above it existed to get this here, and every protocol in this course fits inside one 1500-byte frame deliberately, because fragmented multicast is a reliable source of misery.</b>');
    cv.once();
  };

  controls.append(slider('Peel off', {
    min: 0, max: 4, step: 1, value: 0,
    fmt: (v) => (v === 0 ? 'nothing' : `${v} layer${v > 1 ? 's' : ''}`),
    on: (v) => { peel = v; upd(); },
  }).node);

  challenge('Peel everything back to the data the fixture actually cares about.', () => peel === 4);

  const cv = canvas(stage, {
    height: 296, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const visible = LAYERS.slice(peel);
      const total = visible.reduce((a, l) => a + l.size + l.tail, 0) || 1;

      // The bar, to scale, so the payload dominates as it should.
      //
      // The headers are tiny beside a 638-byte payload, so each gets a minimum
      // width to stay readable. That minimum has to come out of the payload's
      // share or the bar overflows the canvas, which is what the second pass
      // does: give every segment its true share, raise the small ones to the
      // floor, then take the difference back off the segments that can spare it.
      const barY = 46, barH = 46;
      const barW = w - pad * 2;
      const MINW = 30;
      const raw = visible.map((l) => (l.size / total) * barW);
      const widths = raw.map((v) => Math.max(MINW, v));
      const over = widths.reduce((a, b) => a + b, 0) - barW;
      if (over > 0) {
        // Only segments above the floor can give width back.
        const spare = widths.reduce((a, v) => a + Math.max(0, v - MINW), 0);
        if (spare > 0) {
          for (let i = 0; i < widths.length; i++) {
            widths[i] -= over * (Math.max(0, widths[i] - MINW) / spare);
          }
        }
      }
      let x = pad;
      visible.forEach((l, i) => {
        const lw = widths[i];
        box(g, x, barY, Math.max(4, lw - 2), barH, {
          fill: alpha(R[l.col], 0.2), stroke: R[l.col], r: 5,
        });
        label(g, `${l.size} B`, x + lw / 2, barY + barH / 2, {
          color: p.ink, size: 10.5, align: 'center', weight: 700, mono: true, max: lw - 6,
        });
        x += lw;
      });
      label(g, 'on the wire, to scale', pad, barY - 12, { color: p.muted, size: 9.5 });
      label(g, `${total} bytes`, w - pad, barY - 12, { color: p.ink2, size: 10.5, align: 'right', mono: true });

      // Who reads what.
      let y = barY + barH + 26;
      LAYERS.forEach((l, i) => {
        const gone = i < peel;
        label(g, gone ? '✕' : '▸', pad + 4, y + 8, {
          color: gone ? alpha(p.muted, 0.5) : R[l.col], size: 12, align: 'center', weight: 700,
        });
        label(g, l.name, pad + 18, y + 8, {
          color: gone ? alpha(p.muted, 0.5) : p.ink, size: 11.5, weight: 700, max: w * 0.3,
        });
        label(g, l.what, pad + Math.max(w * 0.34, 150), y + 8, {
          color: gone ? alpha(p.muted, 0.4) : p.ink2, size: 10.5,
          max: w - pad - Math.max(w * 0.34, 150) - 4,
        });
        y += 26;
      });

      const bits = total * 8 * 44;
      label(g, `At 44 Hz that is ${eng(bits, 'bit/s')} for one universe, and ${eng(bits * 100, 'bit/s')} for a hundred.`,
        pad, y + 12, { color: p.ink2, size: 11, max: w - pad * 2 });
      label(g, 'Standard Ethernet carries 1500 bytes of payload. Everything here fits in one frame on purpose.',
        pad, y + 32, { color: p.muted, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});

register('switch-learning', (host) => {
  let step = 0;
  const STEPS = [
    { t: 'A frame arrives on port 3 from MAC …0A, for MAC …0D', learn: [3, '0A'], out: 'flood' },
    { t: 'MAC …0D replies from port 7', learn: [7, '0D'], out: 'unicast' },
    { t: 'Another frame from …0A to …0D', learn: null, out: 'unicast' },
    { t: 'A broadcast frame from …0A', learn: null, out: 'broadcast' },
    { t: 'MAC …0D says nothing for 300 seconds', learn: 'age', out: 'flood' },
  ];

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'What a switch actually does with a frame',
    sub: 'Step through it. Almost everybody has a wrong model of the last two steps.',
    note: '',
  });

  const upd = () => {
    const s = STEPS[step];
    setNote(step === 0
      ? 'The destination is unknown, so the switch <b>floods</b>: out of every port except the one it arrived on. It also learns that …0A is on port 3, from the source address, for free, on every frame.'
      : step === 1
        ? 'Now it knows both. From here every frame between these two goes out one port and nobody else is disturbed. <b>This is forwarding, and it is the whole job.</b>'
        : step === 2
          ? 'Forwarded to port 7 alone. The other six devices never see it and their processors do no work at all. <b>This is why a switch replaced a hub and why "a switch broadcasts everything" is wrong.</b>'
          : step === 3
            ? 'A broadcast goes to every port <b>by design</b>. There is no table entry that would stop it, and every device must receive it and decide it does not care. <b>Everything reachable without a router is one broadcast domain, and a faster switch just delivers the broadcasts faster.</b>'
            : 'The entry aged out after 300 seconds of silence, so the next frame for …0D is flooded to the whole network again. <b>Silent devices are noisier on a network than chatty ones, which is unintuitive and true.</b>');
    cv.once();
  };

  const prev = button('← Back', () => { step = Math.max(0, step - 1); upd(); });
  const next = button('Next →', () => { step = Math.min(STEPS.length - 1, step + 1); upd(); });
  controls.append(prev.node, next.node);

  challenge('Reach the step where a device goes quiet and its traffic starts being flooded again.',
    () => step === 4);

  const cv = canvas(stage, {
    height: 300,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const s = STEPS[step];

      label(g, `Step ${step + 1} of ${STEPS.length}`, pad, 18, { color: p.muted, size: 10 });
      label(g, s.t, pad, 36, { color: p.ink, size: 12.5, weight: 600, max: w - pad * 2 });

      // The switch.
      const swY = 64, swH = 40;
      box(g, pad, swY, w - pad * 2, swH, { fill: p.raised, stroke: p.line, r: 8 });
      label(g, 'switch', pad + 12, swY + swH / 2, { color: p.ink2, size: 11, weight: 600 });

      // Eight ports.
      const N = 8;
      const pw = (w - pad * 2 - 80) / N;
      const px0 = pad + 74;
      const active = { flood: [0, 1, 2, 4, 5, 6, 7], unicast: [6], broadcast: [0, 1, 2, 3, 4, 5, 6, 7] }[s.out] || [];
      for (let i = 0; i < N; i++) {
        const x = px0 + i * pw;
        const isSrc = i === 2;
        const lit = active.includes(i) && !(s.out === 'unicast' && i !== 6);
        box(g, x + 2, swY + 8, pw - 6, swH - 16, {
          fill: isSrc ? alpha(R.energy, 0.25) : lit ? alpha(R.signal, 0.25) : p.surface,
          stroke: isSrc ? R.energy : lit ? R.signal : p.line, r: 4,
        });
        label(g, String(i + 1), x + pw / 2 - 1, swY + swH / 2, {
          color: isSrc ? R.energy : lit ? R.signal : p.muted, size: 10, align: 'center', weight: 700,
        });
        // Traffic dots leaving lit ports.
        if (lit) flowDots(g, x + pw / 2 - 1, swY + swH, x + pw / 2 - 1, swY + swH + 44, { color: R.signal, t, speed: 1.4, count: 2, r: 2.2 });
      }
      // Incoming.
      flowDots(g, px0 + 2 * pw + pw / 2 - 1, swY - 34, px0 + 2 * pw + pw / 2 - 1, swY, { color: R.energy, t, speed: 1.6, count: 2, r: 2.4 });

      // Devices below.
      for (let i = 0; i < N; i++) {
        const x = px0 + i * pw;
        const nm = ['0A', '0B', '0C', '0D', '0E', '0F', '10', '11'][i];
        const isTarget = i === 6;
        box(g, x + 2, swY + 90, pw - 6, 26, {
          fill: active.includes(i) ? alpha(R.signal, 0.12) : p.surface,
          stroke: isTarget && s.out !== 'broadcast' ? R.safe : p.line, r: 4,
        });
        label(g, `…${nm}`, x + pw / 2 - 1, swY + 103, {
          color: active.includes(i) ? p.ink : p.muted, size: 9, align: 'center', mono: true, max: pw - 8,
        });
      }

      // The MAC table.
      const ty = swY + 132;
      label(g, 'MAC table', pad, ty, { color: p.muted, size: 10, weight: 600 });
      const entries = [];
      if (step >= 0) entries.push(['…0A', 'port 3', true]);
      if (step >= 1 && step < 4) entries.push(['…0D', 'port 7', true]);
      if (step === 4) entries.push(['…0D', 'aged out after 300 s', false]);
      entries.forEach(([mac, port, live], i) => {
        const y = ty + 18 + i * 22;
        box(g, pad, y, Math.min(280, w - pad * 2), 19, {
          fill: alpha(live ? R.safe : R.fault, 0.1), stroke: alpha(live ? R.safe : R.fault, 0.5), r: 4,
        });
        label(g, `${mac}  →  ${port}`, pad + 8, y + 10, {
          color: live ? p.ink2 : R.fault, size: 10.5, mono: true, max: 260,
        });
      });

      const verdict = { flood: 'FLOOD — out of every port except the one it came in on',
        unicast: 'FORWARD — out of one port, and nobody else is disturbed',
        broadcast: 'BROADCAST — every port, by design, with no table entry that could stop it' }[s.out];
      const vcol = s.out === 'unicast' ? R.safe : s.out === 'broadcast' ? R.fault : R.energy;
      label(g, verdict, pad, ty + 18 + entries.length * 22 + 16, {
        color: vcol, size: 11.5, weight: 700, max: w - pad * 2,
      });
    },
  });
  upd();
});

register('ethernet-family', (host) => compare(host, {
  title: 'Ethernet as it exists now',
  sub: 'What you will actually meet in a venue, and the practical notes that matter more than the rate.',
  accent: 'signal',
  fields: [
    { key: 'rate', label: 'Rate' },
    { key: 'med', label: 'Medium' },
    { key: 'reach', label: 'Reach' },
    { key: 'where', label: 'Where in a venue' },
    { key: 'watch', label: 'The practical note', tone: 'fault' },
  ],
  items: [
    {
      name: '100BASE-TX', short: '100M', tone: 'energy',
      line: 'Still everywhere, on nodes and fixtures that were specified years ago.',
      rate: '100 Mbit/s', med: 'Cat5e copper', reach: '100 m',
      where: 'Older nodes, fixtures, sensors, some consoles',
      watch: 'A gigabit device that has negotiated 100 Mbit/s is usually a cable fault, not a device limitation',
      note: 'A hundred megabits is still forty universes of sACN with room to spare. <b>The reason to care is that a device stuck at 100 when it should be at 1000 is telling you about the cable.</b>',
    },
    {
      name: '1000BASE-T', short: '1G', tone: 'safe',
      line: 'The default for effectively everything.',
      rate: '1 Gbit/s', med: 'Cat5e or Cat6 copper', reach: '100 m',
      where: 'Consoles, nodes, media servers, access points, everything',
      watch: 'Untwist over 13 mm at the plug and it links happily and drops packets under load over distance',
      note: 'A split pair, where pins 3 and 6 have been run in two different pairs, passes a continuity test and fails at gigabit over distance. <b>A cheap tester that only checks pin to pin calls that cable good.</b>',
    },
    {
      name: '2.5G and 5GBASE-T', short: '2.5/5G', tone: 'signal',
      line: 'The bridge between gigabit and ten gig, on existing copper.',
      rate: '2.5 or 5 Gbit/s', med: 'Cat5e or Cat6 copper', reach: '100 m',
      where: 'Wi-Fi 6E and 7 access points, mostly, and some media endpoints',
      watch: 'It exists because a Wi-Fi 7 access point can exceed a gigabit and rewiring a building cannot happen',
      note: 'This tier is almost entirely driven by wireless access points. <b>If you are specifying switches for a venue with modern Wi-Fi, this is the port type to look for on the access-point uplinks.</b>',
    },
    {
      name: '10GBASE-T', short: '10G copper', tone: 'signal',
      line: 'Ten gigabit on copper, with a real cabling requirement.',
      rate: '10 Gbit/s', med: '<b>Cat6a</b> copper', reach: '100 m',
      where: 'Switch uplinks, media servers, ST 2110 endpoints',
      watch: '10GBASE-T on Cat5e works on the bench and fails at 60 m, which is the worst possible failure mode',
      note: 'Use Cat6a for anything above a gigabit over any real distance. <b>The failure is not "it does not link", it is "it links and then behaves badly at exactly the length you installed", which is very expensive to diagnose after the fact.</b>',
    },
    {
      name: 'SFP+ / SFP28 optics', short: 'SFP', tone: 'safe',
      line: 'Pluggable transceivers: fibre, or a short direct-attach copper cable.',
      rate: '10 or 25 Gbit/s', med: 'Fibre, or DAC', reach: '300 m to 10 km',
      where: 'Uplinks, between racks, between buildings',
      watch: 'The transceiver must match the fibre type and the reach, and multimode and single-mode are not interchangeable',
      note: 'A DAC is a fixed-length cable with SFP ends, and it is cheap and reliable for under five metres between switches in a rack. <b>For anything longer, fibre buys you isolation as well as distance.</b>',
    },
  ],
  footer: 'Rising CRC errors on a switch port is a physical fault. No amount of configuration above layer 1 will help it.',
}));

register('poe-tiers', (host) => {
  let std = 25.5;
  let n = 12;
  let budget = 370;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'A PoE budget, and the two ways it catches people out',
    sub: 'The switch budget is not the sum of the port ratings. Add devices until it stops.',
    note: '',
  });

  const upd = () => {
    const draw = std * n;
    const pct = (draw / budget) * 100;
    setNote(pct > 100
      ? `Over budget. The switch will power devices until it runs out and then refuse the rest, usually the ones that boot last. <b>That makes it look as though those particular devices are faulty, which is the fault this figure exists to prevent you spending an afternoon on.</b>`
      : pct > 80
        ? `${sig(pct)} per cent used. Leave headroom: PoE devices draw more at startup than in steady state, and the next change note will add one. <b>Design to 80 per cent of the budget, not to 100.</b>`
        : `${sig(pct)} per cent used, which is comfortable. <b>Note the gap between the ${sig(std * 1.18)} W the switch sources and the ${sig(std)} W the device gets: that difference is loss in up to 100 m of copper, which is why a device that boots on a short cable and fails on a long one is a cable length problem rather than a switch problem.</b>`);
    cv.once();
  };

  controls.append(choice('Standard', [
    ['12.95', '802.3af'], ['25.5', '802.3at'], ['51', 'bt Type 3'], ['71.3', 'bt Type 4'],
  ], { value: '25.5', on: (v) => { std = Number(v); upd(); } }).node);
  controls.append(slider('Devices', { min: 1, max: 48, step: 1, value: 12, on: (v) => { n = v; upd(); } }).node);
  controls.append(slider('Switch budget', { min: 60, max: 1000, step: 10, value: 370, fmt: (v) => `${v} W`, on: (v) => { budget = v; upd(); } }).node);

  challenge('Exceed the budget with 802.3bt Type 4 devices.', () => std === 71.3 && std * n > budget);

  const cv = canvas(stage, {
    height: 272, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const draw = std * n;
      const pct = Math.min(160, (draw / budget) * 100);

      // The budget bar.
      const bx = pad, bw = w - pad * 2, by = 44, bh = 34;
      box(g, bx, by, bw, bh, { fill: alpha(p.line, 0.3), stroke: p.line, r: 7 });
      const safeW = bw * 0.8;
      line(g, bx + safeW, by - 6, bx + safeW, by + bh + 6, { color: alpha(R.energy, 0.7), lw: 1.5, dash: [4, 3] });
      label(g, '80%', bx + safeW, by - 12, { color: R.energy, size: 9.5, align: 'center' });
      const fillW = Math.min(bw, (draw / budget) * bw);
      const tone = pct > 100 ? R.fault : pct > 80 ? R.energy : R.safe;
      box(g, bx + 1, by + 1, Math.max(2, fillW - 2), bh - 2, { fill: alpha(tone, 0.4), stroke: 'transparent', r: 6 });
      label(g, `${sig(draw)} W of ${sig(budget)} W`, bx + 10, by + bh / 2, {
        color: p.ink, size: 12, weight: 700, mono: true,
      });
      label(g, `${sig((draw / budget) * 100)}%`, bx + bw - 10, by + bh / 2, {
        color: tone, size: 12, weight: 700, align: 'right', mono: true,
      });

      // Devices as blocks.
      const dy = by + bh + 26;
      const cols = Math.min(24, Math.max(8, Math.floor(bw / 26)));
      const dw = bw / cols;
      let used = 0;
      for (let i = 0; i < n; i++) {
        const r = Math.floor(i / cols), c = i % cols;
        used += std;
        const over = used > budget;
        box(g, bx + c * dw + 1, dy + r * 22, dw - 3, 18, {
          fill: alpha(over ? R.fault : R.safe, 0.2), stroke: alpha(over ? R.fault : R.safe, 0.7), r: 3,
        });
      }
      const rows = Math.ceil(n / cols);
      label(g, `${n} devices at ${sig(std)} W each`, bx, dy - 10, { color: p.muted, size: 10 });

      const y2 = dy + rows * 22 + 20;
      const fit = Math.floor(budget / std);
      const safeFit = Math.floor((budget * 0.8) / std);
      const rowsOut = [
        ['At the device', `${sig(std)} W`],
        ['Sourced at the switch', `${sig(std * 1.18)} W approximately`],
        ['Fits at 100 per cent', `${fit} devices`],
        ['Fits at 80 per cent', `${safeFit} devices — the number to design to`],
      ];
      let yy = y2;
      const keyW = Math.min(190, w * 0.44);
      for (const [k, v] of rowsOut) {
        label(g, k, pad, yy, { color: p.muted, size: 10.5, max: keyW - 8 });
        label(g, v, pad + keyW, yy, { color: p.ink2, size: 11, mono: true, max: w - pad * 2 - keyW });
        yy += 20;
      }
    },
  });
  upd();
});

register('wifi-reality', (host) => compare(host, {
  title: 'Wi-Fi, honestly',
  sub: 'Wi-Fi 6E and 7 are genuinely good. None of that changes the structural problem.',
  accent: 'fault',
  fields: [
    { key: 'ok', label: 'Acceptable for' },
    { key: 'no', label: 'Not acceptable for', tone: 'fault' },
    { key: 'why', label: 'Why' },
  ],
  items: [
    {
      name: 'The structural problem', short: 'The problem', tone: 'fault',
      line: 'You do not control the medium.',
      ok: 'Nothing changes this. Not a generation number, not a configuration',
      no: 'Any assumption that a transmission will get through on the first attempt',
      why: 'Any device belonging to anybody can transmit on your channel, and the standard\'s response is to wait and retry',
      note: 'A retry is latency you did not budget for. <b>An audience of two thousand people with phones is two thousand transmitters, and they arrive at exactly the moment the show starts.</b>',
    },
    {
      name: 'A human holding a device', short: 'Human in loop', tone: 'safe',
      line: 'Remote focus, a tablet running a console app, a monitoring dashboard.',
      ok: 'Yes. This is what wireless is genuinely good for',
      no: 'Nothing, provided the human would notice a failure and there is a wired fallback',
      why: 'A person notices a stall and repeats the action. The system does not depend on any single packet',
      note: 'Remote focus over Wi-Fi has saved an enormous amount of ladder time in this industry. <b>The property that makes it safe is that a human is watching, not that the network is fast.</b>',
    },
    {
      name: 'A cue path', short: 'Cue path', tone: 'fault',
      line: 'A GO travelling over wireless to a playback machine.',
      ok: 'Nothing',
      no: '<b>Any cue the show depends on</b>',
      why: 'A cue is an event: lose it and it never happened, and nothing at either end notices',
      note: 'This is the fifth question meeting the medium you least control. <b>If a cue must happen, it goes on copper, and ideally on a contact closure as well.</b>',
    },
    {
      name: 'Audio, video, timecode', short: 'Media', tone: 'fault',
      line: 'Streams with a hard deadline and no tolerance of jitter.',
      ok: 'Nothing show-critical. Talkback and monitoring in some cases',
      no: 'Dante, AES67, ST 2110, NDI, LTC, PTP',
      why: 'A retry is jitter, and these have a jitter budget measured in microseconds',
      note: 'PTP over Wi-Fi is a particularly bad idea, because its accuracy depends on symmetric path delay and wireless has none. <b>Media over IP assumes a wired, switched path and it is not a preference.</b>',
    },
    {
      name: 'If you must', short: 'If you must', tone: 'energy',
      line: 'The configuration that makes it as good as it can be.',
      ok: 'A documented, surveyed, dedicated deployment with a fallback somebody has practised',
      no: 'Still not a cue path',
      why: 'Reducing the risk is worth doing and it does not remove the dependency',
      note: '5 or 6 GHz, a dedicated SSID on its own VLAN, WPA3, a channel you surveyed rather than one that was on by default, and an access list saying what it may reach. <b>The crew SSID is not the guest SSID, and neither is on a show VLAN.</b>',
    },
  ],
  footer: 'Acceptable where a human is in the loop and would notice. Unacceptable where a cue depends on it.',
}));

register('ip-bits', (host) => {
  let addr = ipToInt('192.168.1.50');
  let prefix = 24;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'An IP address is one 32-bit number',
    sub: 'Drag the mask boundary through the bits. The dots are punctuation, and the boundary does not respect them.',
    note: '',
  });

  const upd = () => {
    const m = maskOf(prefix);
    const net = (addr & m) >>> 0;
    const bc = (net | (~m >>> 0)) >>> 0;
    const usable = Math.max(0, 2 ** (32 - prefix) - 2);
    setNote(prefix % 8 === 0
      ? `The boundary is on a byte edge, so the network reads straight off the dotted notation: <b>${intToIp(net)}/${prefix}, holding ${usable.toLocaleString()} usable addresses.</b> This is the easy case, and it is why people think the dots mean something.`
      : `The boundary falls <b>inside</b> the ${Math.floor(prefix / 8) + 1}th byte, so the dotted notation tells you almost nothing and the arithmetic is the only way. Network ${intToIp(net)}, broadcast ${intToIp(bc)}, ${usable.toLocaleString()} usable. <b>Block size is 256 minus ${(m >>> (8 * (3 - Math.min(3, Math.floor(prefix / 8))))) & 255}, which is ${256 - (((m >>> (8 * (3 - Math.min(3, Math.floor(prefix / 8))))) & 255) || 256)}.</b>`);
    cv.once();
  };

  controls.append(choice('Address', [
    ['192.168.1.50', '192.168.1.50'], ['10.101.7.150', '10.101.7.150'], ['172.20.14.200', '172.20.14.200'],
  ], { value: '192.168.1.50', on: (v) => { addr = ipToInt(v); upd(); } }).node);
  controls.append(slider('Prefix', {
    min: 8, max: 30, step: 1, value: 24, fmt: (v) => `/${v}  ${intToIp(maskOf(v))}`,
    on: (v) => { prefix = v; upd(); },
  }).node);

  challenge('Put the mask boundary somewhere that is not a byte edge.', () => prefix % 8 !== 0);

  const cv = canvas(stage, {
    height: 320, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 12;
      const m = maskOf(prefix);
      const net = (addr & m) >>> 0;
      const bc = (net | (~m >>> 0)) >>> 0;
      const bw = (w - pad * 2 - 3 * 6) / 32;
      const y0 = 52;

      label(g, 'Address, as 32 bits. The dots are punctuation.', pad, 22, { color: p.muted, size: 10.5 });

      const drawRow = (y, val, nm, colOn, colOff) => {
        label(g, nm, pad, y - 8, { color: p.muted, size: 9.5 });
        for (let i = 0; i < 32; i++) {
          const bit = (val >>> (31 - i)) & 1;
          const gap = Math.floor(i / 8) * 6;
          const x = pad + i * bw + gap;
          const isNet = i < prefix;
          box(g, x, y, bw - 0.5, 26, {
            fill: bit ? alpha(isNet ? colOn : colOff, 0.3) : alpha(p.line, 0.25),
            stroke: 'transparent', r: 2,
          });
          if (bw > 9) {
            label(g, String(bit), x + bw / 2, y + 13, {
              color: bit ? (isNet ? colOn : colOff) : p.muted, size: 9, align: 'center', weight: 600, mono: true,
            });
          }
        }
      };

      drawRow(y0, addr, 'address', R.energy, R.signal);
      drawRow(y0 + 44, m, 'mask', R.safe, p.muted);
      drawRow(y0 + 88, net, 'network = address AND mask', R.safe, p.muted);

      // The boundary line.
      const bx = pad + prefix * bw + Math.floor(prefix / 8) * 6 - 1;
      line(g, bx, y0 - 14, bx, y0 + 118, { color: R.fault, lw: 2 });
      label(g, `/${prefix}`, bx, y0 - 22, { color: R.fault, size: 11, align: 'center', weight: 700 });
      const onEdge = prefix % 8 === 0;
      label(g, onEdge ? 'on a byte edge' : 'inside a byte', bx + 4, y0 + 132, {
        color: onEdge ? p.muted : R.fault, size: 10, weight: 600, max: w - bx - pad,
      });

      // The dotted readings.
      const rows = [
        ['Address', intToIp(addr), p.ink],
        ['Mask', `${intToIp(m)}  =  /${prefix}`, p.ink2],
        ['Network', intToIp(net), R.safe],
        ['Broadcast', intToIp(bc), R.fault],
        ['Usable', `${intToIp(net + 1)} to ${intToIp(bc - 1)}  ·  ${Math.max(0, 2 ** (32 - prefix) - 2).toLocaleString()}`, p.ink2],
      ];
      let y = y0 + 152;
      const keyW = Math.min(96, w * 0.24);
      for (const [k, v, col] of rows) {
        label(g, k, pad, y, { color: p.muted, size: 10.5, max: keyW - 6 });
        label(g, v, pad + keyW, y, { color: col, size: 11.5, mono: true, max: w - pad * 2 - keyW });
        y += 19;
      }
    },
  });
  upd();
});

register('mask-drag', (host) => {
  let a = ipToInt('10.101.7.150');
  let b = ipToInt('10.101.7.200');
  let prefix = 26;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Can these two talk directly?',
    sub: 'Every routing decision an endpoint makes is this one comparison. Move the mask and watch the answer flip.',
    note: '',
  });

  const upd = () => {
    const m = maskOf(prefix);
    const same = ((a & m) >>> 0) === ((b & m) >>> 0);
    setNote(same
      ? `The network portions match, so the sending device ARPs for the destination and puts the frame on the wire directly. <b>No router is involved and none is needed.</b>`
      : `The network portions differ, so the sending device sends the frame to its <b>gateway</b> instead. If no gateway is set, or the wrong one, the packet goes nowhere and the symptom is "I can ping some things and not others". <b>That symptom is arithmetic, not cabling, and no cable will change it.</b>`);
    cv.once();
  };

  controls.append(choice('Device A', [
    ['10.101.7.150', '10.101.7.150'], ['10.101.7.60', '10.101.7.60'], ['192.168.1.10', '192.168.1.10'],
  ], { value: '10.101.7.150', on: (v) => { a = ipToInt(v); upd(); } }).node);
  controls.append(choice('Device B', [
    ['10.101.7.200', '10.101.7.200'], ['10.101.7.100', '10.101.7.100'], ['10.101.8.10', '10.101.8.10'],
  ], { value: '10.101.7.200', on: (v) => { b = ipToInt(v); upd(); } }).node);
  controls.append(slider('Mask', {
    min: 16, max: 30, step: 1, value: 26, fmt: (v) => `/${v}  ${intToIp(maskOf(v))}`,
    on: (v) => { prefix = v; upd(); },
  }).node);

  challenge('Find a mask that puts two devices on the same network and another that separates them.',
    () => ((a & maskOf(prefix)) >>> 0) !== ((b & maskOf(prefix)) >>> 0));

  const cv = canvas(stage, {
    height: 268,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const m = maskOf(prefix);
      const na = (a & m) >>> 0, nb = (b & m) >>> 0;
      const same = na === nb;

      const boxW = Math.min(190, (w - pad * 2 - 40) / 2);
      const drawDev = (x, ip, netv, nm) => {
        box(g, x, 40, boxW, 62, { fill: p.raised, stroke: p.line, r: 8 });
        label(g, nm, x + 10, 56, { color: p.muted, size: 10 });
        label(g, intToIp(ip), x + 10, 74, { color: p.ink, size: 13, weight: 700, mono: true, max: boxW - 20 });
        label(g, `network ${intToIp(netv)}`, x + 10, 92, {
          color: same ? R.safe : R.fault, size: 10, mono: true, max: boxW - 20,
        });
      };
      drawDev(pad, a, na, 'Device A');
      drawDev(w - pad - boxW, b, nb, 'Device B');

      // The path between them.
      const y = 71;
      const x1 = pad + boxW, x2 = w - pad - boxW;
      if (same) {
        line(g, x1, y, x2, y, { color: R.safe, lw: 2.5 });
        flowDots(g, x1, y, x2, y, { color: R.safe, t, speed: 1.4, count: 5, r: 2.6 });
        label(g, 'direct', (x1 + x2) / 2, y - 14, { color: R.safe, size: 11, align: 'center', weight: 700 });
      } else {
        const gx = (x1 + x2) / 2;
        box(g, gx - 34, y - 18, 68, 36, { fill: alpha(R.energy, 0.15), stroke: R.energy, r: 6 });
        label(g, 'gateway', gx, y, { color: R.energy, size: 10.5, align: 'center', weight: 700 });
        line(g, x1, y, gx - 34, y, { color: R.energy, lw: 2, dash: [5, 4] });
        line(g, gx + 34, y, x2, y, { color: R.energy, lw: 2, dash: [5, 4] });
        label(g, 'must be routed', gx, y - 30, { color: R.energy, size: 10.5, align: 'center', weight: 600, max: 160 });
      }

      // The bitwise working.
      const bits = (v) => (v >>> 0).toString(2).padStart(32, '0').replace(/(\d{8})(?=\d)/g, '$1 ');
      const rows = [
        ['A       ', bits(a), intToIp(a)],
        ['mask    ', bits(m), intToIp(m)],
        ['A net   ', bits(na), intToIp(na)],
        ['B net   ', bits(nb), intToIp(nb)],
      ];
      let ry = 130;
      for (const [k, bs, dotted] of rows) {
        label(g, k, pad, ry, { color: p.muted, size: 10, mono: true });
        label(g, bs, pad + 58, ry, { color: p.ink2, size: 9.5, mono: true, max: w - pad * 2 - 160 });
        label(g, dotted, w - pad, ry, { color: p.ink2, size: 10, mono: true, align: 'right' });
        ry += 18;
      }

      box(g, pad, ry + 6, w - pad * 2, 30, {
        fill: alpha(same ? R.safe : R.fault, 0.12), stroke: alpha(same ? R.safe : R.fault, 0.6), r: 7,
      });
      label(g, same
        ? 'Networks match — they can talk directly, with no router involved'
        : 'Networks differ — every packet must go through a gateway, and no cable will change that',
      w / 2, ry + 21, {
        color: same ? R.safe : R.fault, size: 11.5, align: 'center', weight: 700, max: w - pad * 2 - 16,
      });
    },
  });
  upd();
});

register('dhcp-dance', (host) => chain(host, {
  title: 'DORA, and the fault that lives in it',
  sub: 'Discover, Offer, Request, Acknowledge. Wireshark labels the packets with those words, which is why the acronym is worth having.',
  tag: 'Step',
  accent: 'signal',
  stages: [
    {
      name: 'Discover',
      body: 'The device broadcasts: "is there a DHCP server?" It has no address yet, so it can only broadcast.',
      why: 'Every device on the broadcast domain receives this, including any server that should not be there.',
      note: 'Filter <code>dhcp</code> in Wireshark and this is the first thing you see. <b>Count how many different servers respond to it: more than one is an emergency.</b>',
    },
    {
      name: 'Offer',
      body: 'A server replies with an address, a mask, a gateway, DNS servers and a lease time.',
      why: 'The offer carries the whole configuration, not just the address, which is why a rogue server does so much damage.',
      note: 'A second DHCP server, usually on somebody\'s travel router, offers a different range <i>and a different gateway</i>. <b>Some devices work and some do not, changing every time anything is power cycled, and it is one of the nastiest faults in this business.</b>',
    },
    {
      name: 'Request',
      body: 'The device broadcasts that it accepts a specific offer, which also tells any other server that its offer was declined.',
      why: 'Still a broadcast, because the device still does not have the address it is asking for.',
      note: 'If two servers offered, the device takes whichever arrived first. <b>Which is why the same rig comes up differently after each power cycle: the race is genuinely a race.</b>',
    },
    {
      name: 'Acknowledge',
      body: 'The server confirms, and the lease starts. The device renews at half the lease time.',
      why: 'A lease is time-limited, so a device that comes back after a long absence may get a different address.',
      note: 'That is the argument against plain DHCP for anything another device addresses by number. <b>If a node gets a new address after a power cut, the rig is dark and nothing reports an error.</b>',
    },
    {
      name: 'The right answer for a rig',
      body: 'DHCP with reservations: the server hands out addresses, and each known MAC always gets the same one.',
      why: 'Central management and stable addressing at once, and replacing a device is one line changed rather than a visit to a truss.',
      note: 'Static for anything with a fixed role that others address by number: consoles, gateways, servers, the switch itself. <b>Reservations for the fleet. Plain DHCP for laptops and tablets, and a pool that does not overlap either.</b>',
    },
    {
      name: 'When it fails: 169.254',
      body: 'No answer, so the device gives itself a link-local address in 169.254.x.x.',
      why: 'It is a diagnosis, not a configuration: this device wanted an address, asked, and nothing answered.',
      note: 'In order of likelihood: no server on that network, a broken link, or a VLAN misconfiguration that put the device somewhere the server is not. <b>Two devices on link-local can often still talk to each other, which produces the worst version: half the rig works, on the wrong network, and the console sees none of it.</b>',
    },
  ],
  footer: 'One DHCP server per network. Exactly one. Write down which device it is.',
}));

register('arp-exchange', (host) => {
  let state = 0;
  let dup = false;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'ARP: the join between layer 3 and layer 2',
    sub: 'A device knows the IP address and needs the MAC. This is how it asks, and how a duplicate address shows itself.',
    note: '',
  });

  const upd = () => {
    setNote(dup
      ? 'Two devices answered for one address, so the ARP cache flips between two MACs. The symptom is intermittent everything: it works, then it does not, then it works again, and which one you reach depends on which reply arrived last. <b>arp -a is where a duplicate address shows itself first, and it is one of the four commands worth knowing by heart.</b>'
      : state < 2
        ? 'The question is a <b>broadcast</b>: every device on the network receives it and all but one discard it. That is why ARP traffic scales with the size of a broadcast domain, and why a flat network of two hundred devices spends real processor time on questions nobody asked.'
        : 'The answer comes back as a unicast, straight to the asker, and is cached for a few minutes. <b>A missing ARP entry means the device is not answering at layer 2, which is a completely different fault from an application not responding, and arp -a distinguishes them in four seconds.</b>');
    cv.once();
  };

  const prev = button('← Back', () => { state = Math.max(0, state - 1); upd(); });
  const next = button('Next →', () => { state = Math.min(3, state + 1); upd(); });
  controls.append(prev.node, next.node);
  controls.append(toggle('Duplicate address on the network', { value: false, on: (v) => { dup = v; upd(); } }).node);

  challenge('Create a duplicate address and read what the cache does.', () => dup);

  const cv = canvas(stage, {
    height: 260,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const N = 5;
      const bw = (w - pad * 2 - (N - 1) * 8) / N;
      const y = 62;
      const names = ['.10\nasking', '.11', '.20\nanswers', '.30', dup ? '.20\nALSO' : '.40'];

      for (let i = 0; i < N; i++) {
        const x = pad + i * (bw + 8);
        const isAsker = i === 0;
        const isTarget = i === 2 || (dup && i === 4);
        const lit = state >= 1 && !isAsker;
        const answering = state >= 2 && isTarget;
        const tone = isAsker ? R.energy : answering ? (dup && i === 4 ? R.fault : R.safe) : lit ? R.signal : p.muted;
        box(g, x, y, bw, 52, {
          fill: alpha(tone, answering ? 0.22 : lit ? 0.1 : 0.05),
          stroke: alpha(tone, isAsker || answering ? 1 : 0.4), r: 7, lw: isAsker || answering ? 2 : 1,
        });
        const parts = names[i].split('\n');
        label(g, parts[0], x + bw / 2, y + (parts[1] ? 20 : 26), {
          color: tone, size: 12, align: 'center', weight: 700, mono: true, max: bw - 6,
        });
        if (parts[1]) label(g, parts[1], x + bw / 2, y + 36, { color: p.muted, size: 9, align: 'center', max: bw - 6 });
      }

      // The broadcast.
      if (state >= 1) {
        const ax = pad + bw / 2;
        for (let i = 1; i < N; i++) {
          const tx = pad + i * (bw + 8) + bw / 2;
          line(g, ax, y - 12, tx, y - 12, { color: alpha(R.energy, 0.5), lw: 1.5, dash: [4, 3] });
          flowDots(g, ax, y - 12, tx, y - 12, { color: R.energy, t, speed: 1.2, count: 2, r: 2 });
        }
        label(g, 'BROADCAST: "who has 10.101.7.20? tell 10.101.7.10"', pad, y - 26, {
          color: R.energy, size: 11, weight: 600, max: w - pad * 2,
        });
      }
      // The reply or replies.
      if (state >= 2) {
        const ax = pad + bw / 2;
        const responders = dup ? [2, 4] : [2];
        for (const i of responders) {
          const tx = pad + i * (bw + 8) + bw / 2;
          const col = dup && i === 4 ? R.fault : R.safe;
          line(g, tx, y + 66, ax, y + 66, { color: col, lw: 2 });
          flowDots(g, tx, y + 66, ax, y + 66, { color: col, t, speed: 1.4, count: 3, r: 2.4 });
        }
        label(g, dup ? 'TWO unicast replies, from two different MACs' : 'unicast reply, direct to the asker',
          pad, y + 84, { color: dup ? R.fault : R.safe, size: 11, weight: 600, max: w - pad * 2 });
      }

      // The cache.
      const cy = y + 108;
      label(g, 'arp -a on the asking device', pad, cy, { color: p.muted, size: 10, weight: 600 });
      const entries = state >= 3
        ? (dup
          ? [['10.101.7.20', '00:1a:2b:3c:4d:5e', false], ['10.101.7.20', 'aa:bb:cc:dd:ee:ff', false]]
          : [['10.101.7.20', '00:1a:2b:3c:4d:5e', true]])
        : state >= 2 ? [['10.101.7.20', 'learning…', true]] : [];
      if (!entries.length) {
        label(g, '(no entry for 10.101.7.20 yet)', pad, cy + 20, { color: p.muted, size: 10.5, max: w - pad * 2 });
      }
      entries.forEach(([ip, mac, ok], i) => {
        const yy = cy + 14 + i * 24;
        box(g, pad, yy, Math.min(360, w - pad * 2), 20, {
          fill: alpha(ok ? R.safe : R.fault, 0.1), stroke: alpha(ok ? R.safe : R.fault, 0.6), r: 4,
        });
        label(g, `${ip}   ${mac}`, pad + 8, yy + 11, {
          color: ok ? p.ink2 : R.fault, size: 10.5, mono: true, max: 340,
        });
      });
      if (dup && state >= 3) {
        label(g, 'Two MACs for one address. The cache flips, and so does the fault.',
          pad, cy + 14 + entries.length * 24 + 14, { color: R.fault, size: 11, max: w - pad * 2 });
      }
    },
  });
  upd();
});

register('tcp-udp', (host) => compare(host, {
  title: 'TCP and UDP, and why the obvious choice is wrong',
  sub: 'Reliable sounds better. For streaming data, retransmission is worse than loss.',
  accent: 'signal',
  fields: [
    { key: 'conn', label: 'Connection' },
    { key: 'del', label: 'Delivery' },
    { key: 'ord', label: 'Order' },
    { key: 'hdr', label: 'Header' },
    { key: 'loss', label: 'Under loss', tone: 'fault' },
    { key: 'shows', label: 'In shows' },
  ],
  items: [
    {
      name: 'TCP', short: 'TCP', tone: 'safe',
      line: 'Connection oriented, guaranteed, ordered, flow controlled.',
      conn: 'A three-way handshake first, and state at both ends',
      del: 'Guaranteed, with retransmission',
      ord: 'Guaranteed',
      hdr: '20 bytes, plus the connection state',
      loss: 'Slows down and retries. The stream stalls while it recovers',
      shows: 'Console remote control, file transfer, web interfaces, RDMnet',
      note: 'TCP is right where the message is a <b>command that must not be lost</b> and a small delay is acceptable. <b>Sending a cue list, changing a fixture address over RDMnet, driving a console\'s remote protocol.</b>',
    },
    {
      name: 'UDP', short: 'UDP', tone: 'signal',
      line: 'No connection, no guarantee, no ordering, minimal overhead.',
      conn: 'None. Just send',
      del: 'Not guaranteed',
      ord: 'Not guaranteed',
      hdr: '8 bytes, and no state at all',
      loss: 'Carries on, oblivious. The next packet arrives on time',
      shows: '<b>sACN, Art-Net, Dante, AES67, ST 2110, OSC by default</b>',
      note: 'A lighting level from 40 ms ago is not worth having, because a fresh one is arriving now. <b>Every real-time protocol in this course uses UDP on purpose, and handles loss by repeating rather than by asking again.</b>',
    },
    {
      name: 'The asymmetry', short: 'The trap', tone: 'fault',
      line: 'The same loss has opposite consequences depending on what you sent.',
      conn: '—',
      del: '—',
      ord: '—',
      hdr: '—',
      loss: 'For <b>state</b>: self-repairing in 22 ms. For a <b>command</b>: the cue never happened',
      shows: 'This is why a cue and a lighting level need different handling, not the same "make it fast"',
      note: 'A cue has a loose latency requirement and a catastrophic loss consequence, which is the opposite shape from audio. <b>That asymmetry is the argument for sending critical cues over TCP, or for repeating them, or for a contact closure alongside.</b>',
    },
  ],
  footer: 'The fourth of the Five Questions arriving as a design decision. Every protocol here has picked one and lives with it.',
}));

register('ports-sockets', (host) => {
  let port = 5568;

  const PORTS = [
    { p: 5568, n: 'sACN, E1.31', proto: 'UDP', why: 'Streaming lighting data over multicast. The single most useful filter in this industry.', tone: 'signal' },
    { p: 6454, n: 'Art-Net', proto: 'UDP', why: 'The other lighting protocol. Broadcasts by default, which is why it shows up everywhere in a capture.', tone: 'energy' },
    { p: 5353, n: 'mDNS / Bonjour', proto: 'UDP', why: 'How Dante and NDI find each other. A large amount of any show-network capture is this.', tone: 'safe' },
    { p: 319, n: 'PTP event', proto: 'UDP', why: 'The timestamped messages. Filter this when audio is glitching and count grandmaster identities.', tone: 'safe' },
    { p: 53000, n: 'QLab OSC', proto: 'UDP', why: 'One of many OSC ports, because OSC has no assigned port and every product picks its own.', tone: 'energy' },
    { p: 3032, n: 'ETC Eos OSC', proto: 'UDP', why: 'A different product, a different port, a different address scheme. This is the OSC dialect problem.', tone: 'energy' },
    { p: 161, n: 'SNMP', proto: 'UDP', why: 'Monitoring. Traps arrive on 162. A cheap way to know a rack is overheating before the show does.', tone: 'signal' },
    { p: 443, n: 'HTTPS', proto: 'TCP', why: 'Device web interfaces, and increasingly the API a modern device is actually controlled through.', tone: 'safe' },
  ];

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'An address gets you to the machine. A port gets you to the program.',
    sub: 'The pair is a socket, and it is the actual endpoint of any conversation.',
    note: '',
  });

  const upd = () => {
    const e = PORTS.find((x) => x.p === port);
    setNote(`<code>10.101.10.20:${port}</code> is a socket: one program, on one machine. ${e.why} <b>The Wireshark filter is <code>${e.proto.toLowerCase()}.port == ${port}</code>, and learning four of these turns a wall of packets into an answer.</b>`);
    cv.once();
  };

  controls.append(choice('Port', PORTS.map((x) => [x.p, `${x.p}`]), {
    value: 5568, on: (v) => { port = Number(v); upd(); },
  }).node);

  challenge('Find the port that carries lighting data over multicast.', () => port === 5568);

  const cv = canvas(stage, {
    height: 270, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const e = PORTS.find((x) => x.p === port);

      // The machine, with programs behind ports.
      const mw = w - pad * 2;
      box(g, pad, 40, mw, 96, { fill: alpha(p.line, 0.2), stroke: p.line, r: 10 });
      label(g, '10.101.10.20', pad + 14, 58, { color: p.ink, size: 13, weight: 700, mono: true });
      label(g, 'one machine, at one IP address', pad + 14, 74, { color: p.muted, size: 10 });

      const shown = PORTS.slice(0, Math.min(8, Math.floor(mw / 74)));
      const pw = (mw - 28) / shown.length;
      shown.forEach((x, i) => {
        const px = pad + 14 + i * pw;
        const on = x.p === port;
        box(g, px, 90, pw - 6, 36, {
          fill: on ? alpha(R[x.tone], 0.28) : p.surface,
          stroke: on ? R[x.tone] : p.line, r: 5, lw: on ? 2 : 1,
        });
        label(g, String(x.p), px + (pw - 6) / 2, 102, {
          color: on ? p.ink : p.muted, size: 10.5, align: 'center', weight: 700, mono: true, max: pw - 10,
        });
        label(g, x.n.split(',')[0].split(' ')[0], px + (pw - 6) / 2, 116, {
          color: on ? R[x.tone] : p.muted, size: 8.5, align: 'center', max: pw - 10,
        });
      });

      // The socket.
      box(g, pad, 152, mw, 40, { fill: alpha(R[e.tone], 0.12), stroke: alpha(R[e.tone], 0.6), r: 8 });
      label(g, `${e.proto}   10.101.10.20 : ${e.p}`, pad + 14, 172, {
        color: p.ink, size: 14, weight: 700, mono: true, max: mw - 28,
      });
      label(g, 'a socket', w - pad - 14, 172, { color: p.muted, size: 10.5, align: 'right' });

      label(g, e.n, pad, 214, { color: R[e.tone], size: 13, weight: 700, max: mw });
      labelWrap(g, e.why, pad, 234, { color: p.ink2, size: 11, max: mw, maxLines: 2 });
      label(g, `Wireshark:  ${e.proto.toLowerCase()}.port == ${e.p}`, pad, 262, {
        color: p.muted, size: 10.5, mono: true, max: mw,
      });
    },
  });
  upd();
});
