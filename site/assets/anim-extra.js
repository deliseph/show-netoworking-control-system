// Foundations and the lineage page.
//
// The lineage figures are all the same shape on purpose: a problem, an answer,
// and what the answer charged for itself. Reading six of them in the same shape
// is what makes the pattern visible.

import { register } from './anim-core.js';
import {
  figure, canvas, slider, toggle, choice, button, label, labelWrap, box, line,
  palette, alpha, fitter, chain, ladder, role, eng, sig,
} from './anim-kit.js';

// ---------------------------------------------------------------------------
// Foundations
// ---------------------------------------------------------------------------

register('powers-of-two', (host) => {
  let n = 9;

  const WHERE = {
    0: '', 1: '', 2: '', 3: 'bits in a byte',
    4: 'MIDI channels; one hex digit\'s worth of values',
    5: 'devices on a DMX segment',
    6: 'usable addresses in a /26, plus two',
    7: 'the MIDI status and data boundary',
    8: 'values in one byte; addresses in a /24',
    9: 'slots in a DMX universe',
    10: 'the kibibyte, and a /22',
    11: '', 12: '', 13: '', 14: '', 15: '',
    16: '16-bit values; the size of a /16',
  };

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'The powers of two, and where each one turns up',
    sub: 'Learn these as a lookup rather than a calculation. Every number in this module is built from them.',
    note: '',
  });

  const upd = () => {
    const v = 2 ** n;
    setNote(WHERE[n]
      ? `2<sup>${n}</sup> is ${v.toLocaleString()}, and you meet it as <b>${WHERE[n]}</b>. Doubling upward from a number you already know is faster than starting at 1.`
      : `2<sup>${n}</sup> is ${v.toLocaleString()}. <b>The habit worth building is doubling upward from a number you know: from 256, double to 512, 1024, 2048.</b>`);
    cv.once();
  };

  controls.append(slider('Exponent', {
    min: 0, max: 16, step: 1, value: 9, fmt: (v) => `2^${v} = ${(2 ** v).toLocaleString()}`,
    on: (v) => { n = v; upd(); },
  }).node);

  challenge('Find the one that is the number of slots in a DMX universe.', () => n === 9);

  const cv = canvas(stage, {
    height: 240, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const MAX = 16;
      const bw = (w - pad * 2) / (MAX + 1);

      label(g, 'each bar is twice the one before it', pad, 22, { color: p.muted, size: 10 });

      for (let i = 0; i <= MAX; i++) {
        const x = pad + i * bw;
        // Logarithmic height, since the values span five orders of magnitude.
        const hgt = 6 + (i / MAX) * 96;
        const on = i === n;
        box(g, x + 1, 140 - hgt, bw - 2, hgt, {
          fill: alpha(on ? R.energy : R.signal, on ? 0.5 : 0.18),
          stroke: on ? R.energy : 'transparent', r: 2, lw: on ? 2 : 0,
        });
        if (i % 2 === 0 || on) {
          label(g, String(i), x + bw / 2, 152, {
            color: on ? R.energy : p.muted, size: 9, align: 'center', weight: on ? 700 : 500, max: bw * 2,
          });
        }
      }
      label(g, 'exponent', pad, 168, { color: p.muted, size: 9.5 });

      const v = 2 ** n;
      label(g, `2^${n}  =  ${v.toLocaleString()}`, pad, 194, {
        color: p.ink, size: 15, weight: 700, mono: true, max: w * 0.5,
      });
      label(g, `binary: 1 followed by ${n} zero${n === 1 ? '' : 's'}`, pad, 214, {
        color: p.muted, size: 10.5, mono: true, max: w * 0.5,
      });
      if (WHERE[n]) {
        labelWrap(g, WHERE[n], pad + w * 0.5, 194, {
          color: R.energy, size: 11.5, max: w * 0.5 - pad, maxLines: 2,
        });
      }
      label(g, 'A power of two minus two is a subnet\'s usable host count, and you will do that subtraction two thousand times.',
        pad, 232, { color: p.muted, size: 10, max: w - pad * 2 });
    },
  });
  upd();
});

register('rate-ladder', (host) => ladder(host, {
  title: 'Nine orders of magnitude, on one axis',
  sub: 'Being able to place a rate on this scale is more useful than remembering any single one of them.',
  unit: 'bit/s',
  min: 1e4,
  max: 1e11,
  start: 250000,
  sliderLabel: 'Rate',
  bands: [
    { from: 1e4, to: 1e5, name: 'Control, serial', tone: 'energy', what: 'MIDI at 31.25 kbit/s. Slow, and completely adequate for cues, which is the point.' },
    { from: 1e5, to: 1e6, name: 'Lighting', tone: 'energy', what: 'DMX512 at 250 kbit/s, and about 240 kbit/s per sACN universe on the wire including headers.' },
    { from: 1e6, to: 1e8, name: 'Audio and older Ethernet', tone: 'signal', what: 'One channel of 48 kHz 24-bit audio is 1.152 Mbit/s. 100 Mbit/s Ethernet, which is still on plenty of nodes.' },
    { from: 1e8, to: 3e9, name: 'The default network', tone: 'safe', what: 'Gigabit, and the compressed video that fits comfortably on it: NDI at 100 to 150 Mbit/s per stream.' },
    { from: 3e9, to: 2e10, name: 'Uncompressed video', tone: 'fault', what: '1080p60 uncompressed is about 3 Gbit/s. This is why ST 2110 needs 10 Gbit/s links and why everything else is compressed.' },
    { from: 2e10, to: 1e11, name: 'Facility backbone', tone: 'fault', what: '25 and 100 Gbit/s. Large broadcast plants, and the uplinks between them.' },
  ],
  readout: (v, b) => `${eng(v, 'bit/s')} sits in <b>${b.name}</b>. ${b.what}`,
  footer: 'Rates are in bits and file sizes are in bytes. When a number looks eight times wrong, that is why.',
}));

// ---------------------------------------------------------------------------
// Lineage
//
// Same shape every time: the problem, the answer, and what the answer charged.
// ---------------------------------------------------------------------------

register('lineage-dmx', (host) => chain(host, {
  title: 'From a wire per dimmer to a packet per universe',
  sub: 'Four steps, forty years, and every decision still visible in the protocol you use tonight.',
  tag: 'Step',
  accent: 'energy',
  stages: [
    {
      name: '0 to 10 V analogue',
      body: 'One wire per dimmer. Zero volts is off, ten volts is full. A 96-way rig is 96 conductors from the control desk to the dimmer room.',
      why: 'Simple, immediate, and completely deterministic: no packet, no delay, nothing to go wrong except the wire.',
      note: 'What it charged: copper by the kilometre, a connector per channel, and no way to add a channel without adding a cable. <b>And it was analogue, so a long run arrived slightly dimmer than it left.</b>',
    },
    {
      name: 'AMX192, 1975',
      body: 'Multiplexing arrives. Send the channels one after another down one pair, with an analogue level for each and a clock to say when the next one starts. 192 channels on four conductors.',
      why: 'The cable problem is solved, and the analogue problem is not.',
      note: 'What it charged: still analogue, so still degraded with distance. <b>And 192 channels was generous in 1975 and absurd by 1985.</b>',
    },
    {
      name: 'DMX512, 1986',
      body: 'Go digital. 512 channels, eight bits each, at 250 kbit/s over RS-485, repeated about forty four times a second. Now ANSI E1.11.',
      why: 'It solved the problem completely, and four of its decisions still shape your working life.',
      note: 'What it charged: <b>no addressing in the protocol</b>, so two fixtures on one address both respond forever with nothing reporting an error; <b>no error detection at all</b>; <b>one direction only</b>; and <b>512 slots</b>, which was generous when a channel was a dimmer and is absurd when one moving light is forty.',
    },
    {
      name: 'RDM, 2006',
      body: 'Add a return path without changing the cable: a different start code, a half-duplex turnaround, and a binary search to find devices. ANSI E1.20.',
      why: 'It removes a day of ladder work from every fit-up, which is a genuinely large saving.',
      note: 'What it charged: timing so tight that <b>any device in the path which does not pass the return direction breaks it silently</b>. Every non-RDM splitter in the world became a fault that points at exactly the wrong place.',
    },
  ],
  footer: 'DMX is no longer the transport for a rig. It is the last metre, from a node to the fixtures on one bar, and in that role it is excellent.',
}));

register('lineage-acn', (host) => chain(host, {
  title: 'ACN, and the one part of it the market took',
  sub: 'A great deal of engineering, and the industry adopted about five per cent of it.',
  tag: 'Step',
  accent: 'signal',
  stages: [
    {
      name: 'The ambition',
      body: 'A complete device control architecture: a device description language, discovery, sessions, reliable transport, the lot. ANSI E1.17, 2006.',
      why: 'It was the right answer to the problem this whole course is about: two systems interoperating without a bespoke integration.',
      note: 'It is technically excellent and it is essentially unused. <b>The industrial world\'s OPC UA is the same idea, arrived at independently, and it has done rather better.</b>',
    },
    {
      name: 'Why it did not take',
      body: 'It was a great deal of engineering for a problem most people solved by sending DMX down a wire.',
      why: 'The cost of implementing it fell on manufacturers, and the benefit was diffuse.',
      note: 'This is a recurring shape: <b>the comprehensive standard loses to the partial one that is cheap to implement.</b> It happened to ACN, and it happened to AVB, and it will happen again.',
    },
    {
      name: 'What the market did take',
      body: 'One streaming component: E1.31, Streaming ACN, universally called sACN. DMX data over UDP multicast, using ACN\'s packet framing, with a priority field.',
      why: 'It solves the one problem everybody actually had: getting lighting data across a network.',
      note: 'sACN is now how lighting crosses a network, and the full architecture it came from is unused. <b>Its current revision is E1.31-2018, which added universe synchronisation.</b>',
    },
    {
      name: 'What it charged',
      body: 'All of the network\'s problems become yours.',
      why: 'IGMP snooping, queriers, VLANs, QoS, and a class of failure that did not exist when the cable was the network.',
      note: 'A DMX line has no configuration to get wrong. <b>An sACN rig has a switch configuration, a multicast plan and a querier, and every one of those is a way for it to work perfectly at 14:00 and degrade at 20:15.</b>',
    },
  ],
  footer: 'sACN, E1.31, is one small streaming part of the full ACN architecture. Almost nothing implements full ACN; effectively everything implements sACN.',
}));

register('lineage-artnet', (host) => chain(host, {
  title: 'Art-Net got there first',
  sub: 'One company, published free, a decade before the standard, and still everywhere.',
  tag: 'Step',
  accent: 'energy',
  stages: [
    {
      name: '1998: a company solves it',
      body: 'Artistic Licence publishes Art-Net: DMX over UDP, free for anyone to implement, with discovery and configuration built into the protocol.',
      why: 'It was a decade ahead of sACN and it filled the gap while ACN was being designed.',
      note: 'It is a <b>de facto standard</b>: widely deployed, owned by one company, and it owes you nothing. <b>That category also contains NDI, Dante and OSC, and between them they carry more real traffic than several ratified standards.</b>',
    },
    {
      name: 'What it does better',
      body: 'ArtPoll and ArtPollReply give you discovery and configuration in the protocol itself, so a node can be found and set up without a separate tool.',
      why: 'sACN has nothing equivalent, which is part of why RDMnet had to be invented.',
      note: 'This is a genuine advantage and it is why Art-Net has not gone away. <b>A node you can find and configure over the protocol is a node you do not need a manufacturer\'s utility for.</b>',
    },
    {
      name: 'What it charged',
      body: 'It broadcasts by default, so every device on the network processes every universe.',
      why: 'On eight universes nobody notices. On two hundred it is real work on every device in the building.',
      note: 'Art-Net 4 supports unicast and multicast and most modern nodes will do it. <b>Configure it. The default is the problem, not the protocol.</b>',
    },
    {
      name: 'And the numbering',
      body: 'Art-Net numbers from zero, in a 15-bit port address split into net, sub-net and universe. Consoles number from one, flat.',
      why: 'The two disagree constantly.',
      note: 'Off-by-one universe errors between a console and an Art-Net node are a standing feature of this industry. <b>Check the mapping on the node, not on the console, because the node is where the translation happens.</b>',
    },
  ],
  footer: 'New designs: sACN with snooping and a querier. Existing Art-Net rigs: leave them, turn off broadcast, and check the universe mapping.',
}));

register('lineage-midi', (host) => chain(host, {
  title: 'From a bell to an API',
  sub: 'Cue interchange, in five steps, and the first one is still installed in every theatre.',
  tag: 'Step',
  accent: 'signal',
  stages: [
    {
      name: 'The cue light',
      body: 'A bulb. The stage manager presses, the operator sees, the operator acts.',
      why: 'Still installed in every theatre, still used every night, and still the most reliable cue system ever built.',
      note: 'The decoding is done by a person, which is why it never fails in a confusing way. <b>What it charged: a human in the loop, and one bit of information.</b>',
    },
    {
      name: 'The contact closure',
      body: 'Two pieces of metal. Closed means go. No agreement to get wrong, no configuration, no firmware.',
      why: 'It removed the human from the loop and kept the reliability.',
      note: 'What it charged: <b>one bit, one direction, no identity. It cannot say which cue.</b> That single limitation is why the rest of this session exists.',
    },
    {
      name: 'MIDI, 1983',
      body: 'Designed to connect two synthesisers at 31.25 kbit/s, where every byte was expensive.',
      why: 'Which is why the top bit of every byte distinguishes status from data, and why MIDI values stop at 127.',
      note: 'Nothing about MIDI was designed for shows. <b>The industry adopted it because MIDI cables were already in every venue and System Exclusive was an open escape hatch.</b>',
    },
    {
      name: 'MIDI Show Control, 1991',
      body: 'MMA RP-002: a SysEx message with a reserved ID, carrying GO, STOP, RESUME and a cue number as ASCII.',
      why: 'The only protocol in this course designed from the start to carry a cue rather than a value.',
      note: 'It became the industry\'s cue interchange for thirty years. <b>What it charged: fire and forget with no acknowledgement in any implementation you will meet, seven-bit data, 31.25 kbit/s, and enough implementation variation that two products both claiming MSC will disagree about cue lists.</b>',
    },
    {
      name: 'OSC, HTTP, and the layer in the middle',
      body: 'A university music lab\'s replacement for MIDI, then everything getting an Ethernet port and a web API, then a translation box that speaks all of it.',
      why: 'Flexibility, purchased with interoperability.',
      note: 'OSC specifies an encoding and not a vocabulary, so <b>every integration is bespoke</b>. HTTP is the only common cue path that tells you whether it worked. <b>And the box in the middle is a single point of failure that is very often a laptop.</b>',
    },
  ],
  footer: 'Every step bought expressiveness and paid for it in dependencies. The cue light still has none.',
}));

register('lineage-network', (host) => chain(host, {
  title: 'Why Ethernet won',
  sub: 'Every alternative was better on some axis. It did not help any of them.',
  tag: 'Step',
  accent: 'safe',
  stages: [
    {
      name: 'The problem, 1995',
      body: 'Every discipline had built its own transport, and a venue had six incompatible cable systems.',
      why: 'Audio multicores, lighting multicores, video coax, machine control, and a proprietary lighting network per console manufacturer.',
      note: 'The pressure was not technical, it was economic. <b>Six cable systems is six installations, six spares holdings and six people who understand one of them.</b>',
    },
    {
      name: 'The alternatives that lost',
      body: 'Token Ring was deterministic and elegant. ARCNET was reliable and industrial. LocalTalk was cheap and built into every Mac. FDDI was fast and ran on fibre.',
      why: 'All of them were, on some axis, better than Ethernet.',
      note: 'Determinism, reliability, cost, speed: each alternative won on one of them. <b>None of them won on volume, and volume is what mattered.</b>',
    },
    {
      name: 'Ethernet won on price',
      body: 'It was mediocre at everything and cheap at all of it. Volume from the office market made the silicon nearly free.',
      why: 'Free beat better, comprehensively, everywhere.',
      note: 'This is the single most important commercial fact in this course. <b>It also explains why the same story is now playing out between AVB, which reserves bandwidth properly, and Dante, which works on ordinary switches.</b>',
    },
    {
      name: 'What it charged',
      body: 'This industry\'s real-time requirements now run on a transport designed for best-effort office traffic.',
      why: 'Ethernet has no guarantee of delivery, no guarantee of timing, and no reservation.',
      note: 'Everything in Session 5 exists to make a best-effort medium behave well enough for a show: <b>QoS, VLANs, IGMP, PTP, over-provisioning and redundant networks. Every one of those is a property the purpose-built systems had for free.</b>',
    },
  ],
  footer: 'The list of things that were traded away is exactly the list of things you now have to provide yourself. That list is the syllabus.',
}));

register('lineage-time', (host) => chain(host, {
  title: 'From a sprocket hole to a nanosecond',
  sub: 'Naming a moment, four times, each one solving the previous one\'s problem and creating a new one.',
  tag: 'Step',
  accent: 'signal',
  stages: [
    {
      name: 'SMPTE timecode, 1969',
      body: 'Editing film and tape needed a way to name a moment. Eighty bits per frame, biphase mark encoded onto an audio track.',
      why: 'Self-clocking, polarity independent, and readable at any speed, forwards or backwards.',
      note: 'The encoding choices are all about surviving a real facility: a patch bay that reverses a cable, a machine shuttling, a track that is not perfectly level. <b>It is a very well-designed thing and it is still everywhere.</b>',
    },
    {
      name: 'Then colour television',
      body: 'NTSC colour pulled the frame rate down by exactly 1000/1001 to fit the colour subcarrier in without interfering with the sound.',
      why: 'So 30 became 29.97, and a timecode clock counting 30 numbers per second started running 3.6 seconds an hour slow.',
      note: 'Drop frame skips frame numbers to correct it. <b>Fifty years later students are still learning why 29.97 is not 30, because of a decision made in 1953 about a television system that no longer exists.</b>',
    },
    {
      name: 'MIDI Time Code, 1987',
      body: 'Carry SMPTE over MIDI. At 31.25 kbit/s the only way is one nibble per quarter frame.',
      why: 'A full timecode value takes eight quarter-frame messages, which is two frames.',
      note: 'What it charged: <b>MTC is inherently two frames behind, forever.</b> A good implementation compensates for the known offset; not all do.',
    },
    {
      name: 'PTP, and the microsecond',
      body: 'Once media is packets, frame accuracy is not enough: samples taken in different boxes must line up to the microsecond.',
      why: 'IEEE 1588 exchanges four timestamps and calculates both the offset and the path delay.',
      note: 'It works beautifully, and it introduced three new singular roles to every show network: <b>the grandmaster, the profile and the domain. Get any of them wrong twice and you have unexplained audio glitches with nothing reporting an error.</b>',
    },
  ],
  footer: 'Two incompatible ways of counting the same frames, and a clock hierarchy that has to be designed. Both are the price of naming a moment precisely.',
}));

register('lineage-ptp', (host) => chain(host, {
  title: 'What PTP asked the industry to take on',
  sub: 'It solved a genuine problem and handed every venue three new singular roles.',
  tag: 'Role',
  accent: 'safe',
  stages: [
    {
      name: 'The grandmaster',
      body: 'One device is the clock everything else follows, elected by the Best Master Clock Algorithm.',
      why: 'Two devices at equal priority keep re-electing each other, and every election steps the clock.',
      note: 'Set priorities deliberately: <b>one preferred grandmaster, one backup, everything else a slave.</b> Then write which device it is on the system drawing, because when it goes wrong nobody will remember.',
    },
    {
      name: 'The profile',
      body: 'AES67, SMPTE ST 2059-2 and the default all use different message rates and domain numbers.',
      why: 'Two devices on different profiles will not lock, and each will insist it is correct.',
      note: 'This is a genuinely confusing fault because <b>both devices report healthy</b>. The only way to see it is to read the profile setting on each, which is buried on a different menu page on every product.',
    },
    {
      name: 'The path',
      body: 'PTP\'s accuracy depends on symmetric path delay, and it is multicast.',
      why: 'A router adds asymmetric delay it cannot account for, and usually does not forward it anyway.',
      note: '<b>Keep PTP inside one VLAN.</b> A switch that queues a Sync message for a few hundred microseconds also adds error, which is what boundary and transparent clocks exist to correct, and what "PTP aware" on a datasheet is selling you.',
    },
    {
      name: 'And what it gave back',
      body: 'Every device in the building agreeing on the time to under a microsecond, several times a second, forever.',
      why: 'Without it there is no Dante, no AES67, no ST 2110 and no media over IP at all.',
      note: 'The trade is honest: <b>a clock hierarchy that must be designed, in exchange for audio and video on the same cheap network as everything else.</b> That is the whole pattern of this page, one more time.',
    },
  ],
  footer: 'One grandmaster, one profile, one domain, one VLAN. Write the grandmaster on the drawing.',
}));
