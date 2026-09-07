// Sessions 1 and 2: what a control system is made of, and what a signal is
// before anybody has agreed what it means.

import { register } from './anim-core.js';
import {
  figure, canvas, slider, toggle, choice, button, label, labelWrap, box, line,
  palette, alpha, fitter, compare, chain, role, node, arrow, flowDots, roundRect,
} from './anim-kit.js';

// ---------------------------------------------------------------------------
// Session 1
// ---------------------------------------------------------------------------

register('system-parts', (host) => chain(host, {
  title: 'The five parts of any control system',
  sub: 'Step through them. The fifth is the one that separates the disciplines from each other.',
  tag: 'Part',
  accent: 'signal',
  stages: [
    {
      name: 'Intent',
      body: 'A person pressing GO, a timecode reader reaching a value, a sensor closing, a schedule firing at 19:30.',
      why: 'Somebody or something decided that now is the moment. Everything downstream is plumbing.',
      note: 'Intent is where responsibility lives. <b>A change with nobody responsible for it is an automation, which is fine until it is wrong.</b>',
    },
    {
      name: 'Controller',
      body: 'The thing that turns intent into instructions: a lighting console, a show controller, a media server, a PLC.',
      why: 'This is where a cue becomes a set of values and messages aimed at specific devices.',
      note: 'The controller is not the system. <b>Calling the console "the show control system" is the commonest way a design ends up with a hole in it, because the parts nobody owns are exactly where it breaks.</b>',
    },
    {
      name: 'Transport',
      body: 'A cable, a network, a radio link. RS-485, Ethernet, a pair of wires, 2.4 GHz.',
      why: 'The layer this whole module is about, and the layer that has changed most in twenty years.',
      note: 'Transport is swappable, which is the point of layering. <b>DMX runs over copper, fibre, radio and IP, and the fixtures cannot tell the difference.</b>',
    },
    {
      name: 'Device',
      body: 'The thing that does something physical: a fixture strikes, an amplifier drives, a motor turns, a valve opens.',
      why: 'The only part the audience experiences. Everything else exists to get here.',
      note: 'A device has its own modes, and one of them is what it does when nothing is talking to it. <b>That mode is a menu setting somebody chose in a hurry, and almost nobody has written it down.</b>',
    },
    {
      name: 'Feedback',
      body: 'Whether the system can find out what actually happened. Closed loop, open loop, or telemetry that nothing acts on.',
      why: 'Machinery is always closed loop. Lighting is almost never. That single difference is why they cannot share a control approach.',
      note: 'Most reported state in this industry is telemetry: a human reads it and nothing acts on it. <b>Real closed-loop control exists in machinery and almost nowhere else in a show, and saying "the system monitors itself" implies something that is usually not true.</b>',
    },
  ],
  footer: 'The fifth part is the one that decides everything else. Ask it first.',
}));

register('discipline-map', (host) => compare(host, {
  title: 'Nine disciplines, and what each actually needs',
  sub: 'Read each one with a single question: what happens if a message is late, and what happens if it never arrives?',
  accent: 'signal',
  fields: [
    { key: 'posture', label: 'Posture' },
    { key: 'proto', label: 'Usually speaks' },
    { key: 'late', label: 'If a message is late' },
    { key: 'lost', label: 'If it never arrives', tone: 'fault' },
    { key: 'loop', label: 'Feedback' },
  ],
  items: [
    {
      name: 'Lighting', short: 'Lighting', tone: 'energy',
      line: 'Hundreds of devices, each with dozens of parameters, all changing continuously.',
      posture: 'State-based: the full picture, repeated about 44 times a second',
      proto: 'DMX512-A, sACN, Art-Net, RDM',
      late: 'A visible stutter on a fast chase, and nothing else',
      lost: 'Self-repairing. The next complete picture arrives in 22 ms',
      loop: 'Open loop. The console has no idea whether the lamp lit',
      note: 'Lighting is the type example of state-based control. <b>Because the whole picture repeats, a lost packet fixes itself, which is why DMX can get away with having no error detection at all.</b>',
    },
    {
      name: 'Audio', short: 'Audio', tone: 'signal',
      line: 'A continuous stream that must arrive in order, on time, and at the right sample.',
      posture: 'Streamed, plus state for the control surface',
      proto: 'Dante, AES67, MADI, AES3, plus a manufacturer control protocol',
      late: 'A click, then a mute if it continues',
      lost: 'Audible immediately. There is no repair',
      loop: 'Telemetry: level meters and device presence, not control coupling',
      note: 'Audio has the tightest deadline in the building, measured in fractions of a millisecond. <b>It is also the discipline that made PTP a show-critical service, because samples taken in different boxes have to line up.</b>',
    },
    {
      name: 'Video', short: 'Video', tone: 'signal',
      line: 'Very large, very time-sensitive, and increasingly on the same network as everything else.',
      posture: 'Streamed, plus event-based cueing',
      proto: 'SDI, ST 2110, NDI, HDMI, plus OSC or an API for control',
      late: 'A dropped frame, or a visible tear across a wall',
      lost: 'A frame is gone. On an LED wall it is seen by two thousand people',
      loop: 'Telemetry, plus genlock or PTP as a shared clock',
      note: '1080p60 uncompressed is about 3 Gbit/s, which is why almost everything is compressed and why ST 2110 needs 10 Gbit/s links. <b>Video is the traffic that changes what network you have to buy.</b>',
    },
    {
      name: 'Stage machinery', short: 'Machinery', tone: 'fault',
      line: 'Powered flying, revolves, lifts, tracks. Things that can kill somebody.',
      posture: 'Closed-loop motion control, with a separate certified safety system',
      proto: 'EtherCAT, CANopen, PROFINET, plus a rated safety bus. Never the show network',
      late: 'A position error, then a safety stop',
      lost: 'The machine stops and holds. That is the only acceptable answer',
      loop: 'Genuinely closed loop, with encoders and limits, always',
      note: 'Machinery is the only discipline here where the failure mode is a legal and physical safety question rather than an artistic one. <b>Its safety function is designed to a performance level under EN ISO 13849 and it does not go on your network, ever.</b>',
    },
    {
      name: 'Animatronics', short: 'Animatronics', tone: 'energy',
      line: 'Many small axes moving together to make something look alive.',
      posture: 'Streamed motion data, often at 30 to 60 Hz per axis',
      proto: 'Proprietary, CANopen, sometimes DMX for simple figures',
      late: 'The motion looks wrong, which is the entire product',
      lost: 'A visible glitch, and on a large figure a mechanical stress',
      loop: 'Closed loop on position, with limits',
      note: 'Animatronics is machinery with an artistic tolerance instead of an engineering one. <b>It is the discipline where "close enough" is measured by an audience rather than by an encoder, and that makes the deadline tighter, not looser.</b>',
    },
    {
      name: 'Lasers', short: 'Lasers', tone: 'fault',
      line: 'Beams that can damage an eye at a distance, steered by mirrors at kilohertz rates.',
      posture: 'Streamed scan data, plus a separate interlock chain',
      proto: 'ILDA, Ether Dream and similar, plus hardwired interlocks',
      late: 'Distorted geometry',
      lost: 'The beam must blank. This is a safety behaviour, not a preference',
      loop: 'Interlocks and beam-stop feedback, hardwired',
      note: 'Lasers are the discipline where the failure mode is designed first and the show second. <b>The interlock chain is hardwired for exactly the reason the machinery one is, and no amount of network quality changes that.</b>',
    },
    {
      name: 'Fog, fire and water', short: 'Fog / fire', tone: 'energy',
      line: 'Effects with a physical inertia measured in seconds, and a real fire risk.',
      posture: 'Event-based, with interlocks',
      proto: 'DMX, contact closure, industrial I/O',
      late: 'The effect happens at the wrong moment and cannot be recalled',
      lost: 'The effect does not happen, or worse, does not stop',
      loop: 'Level and pressure sensors, plus detection interlocks',
      note: 'These have the longest physical latency of anything in the building: seconds, not milliseconds. <b>Which means the interesting failure is not a missed start, it is a missed stop.</b>',
    },
    {
      name: 'Pyrotechnics', short: 'Pyro', tone: 'fault',
      line: 'One-shot, irreversible, and regulated in every jurisdiction.',
      posture: 'Event-based, with arming as a separate deliberate act',
      proto: 'Dedicated firing systems, hardwired or proprietary radio. Not your network',
      late: 'A cue that fires at the wrong moment, which cannot be undone',
      lost: 'It does not fire. Which is the safe failure, and the correct one',
      loop: 'Continuity testing of every circuit before arming',
      note: 'Pyro is the discipline that thought hardest about the fifth question. <b>Arming is a separate physical act, continuity is proved before it, and the safe failure is chosen deliberately as "nothing happens".</b>',
    },
    {
      name: 'Show control', short: 'Show control', tone: 'safe',
      line: 'The layer whose only job is making the other eight act together.',
      posture: 'Event-based: discrete moments, not continuous values',
      proto: 'MSC, OSC, HTTP, contact closure, timecode',
      late: 'Twenty to fifty milliseconds is invisible',
      lost: 'The cue never happens, and nothing anywhere reports it',
      loop: 'Usually none, which is the honest problem with the whole layer',
      note: 'Show control has a loose latency requirement and a catastrophic loss consequence, which is the opposite shape from audio. <b>That is exactly why it needs different handling rather than the same "make it fast" answer.</b>',
    },
  ],
  footer: 'Nine crafts, nine different answers, one set of cables. That is the whole problem this module exists to solve.',
}));

register('posture-compare', (host) => {
  let posture = 'state';
  let dropAt = 0;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Three postures, one dropped message',
    sub: 'Drop a message from each and watch what the receiving device does about it.',
    note: '',
  });

  const upd = () => {
    setNote(posture === 'state'
      ? 'State-based control sends the whole picture every time, so a lost message is overwritten by the next one 22 ms later. <b>This is why DMX can have no error detection whatsoever and still be the most trusted protocol in the building.</b>'
      : posture === 'event'
        ? 'Event-based control sends the instruction once. A lost message is a cue that never happened, and the sender has no way to know. <b>This is the failure that stops a show, and it is why the one cue that must not fail gets a contact closure alongside the network path.</b>'
        : 'A stream must arrive in order and on time. A lost packet is a click or a dropped frame, and a late packet is exactly as bad as a lost one. <b>Retransmission does not help: by the time the replacement arrives it is stale, which is why every real-time protocol in this course uses UDP.</b>');
    cv.once();
  };

  controls.append(choice('Posture', [['state', 'State-based'], ['event', 'Event-based'], ['stream', 'Streamed']], {
    value: 'state', on: (v) => { posture = v; upd(); },
  }).node);
  controls.append(slider('Drop message number', {
    min: 0, max: 8, step: 1, value: 0, fmt: (v) => (v ? `#${v}` : 'none'),
    on: (v) => { dropAt = v; upd(); },
  }).node);

  challenge('Drop a message from the event-based posture and read what the device ends up believing.',
    () => posture === 'event' && dropAt > 0);

  const cv = canvas(stage, {
    height: 260, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 14;
      const N = 8;
      const trackY = 78;
      const bw = (w - pad * 2 - (N - 1) * 6) / N;

      label(g, posture === 'state' ? 'The controller sends the complete picture, every time'
        : posture === 'event' ? 'The controller sends each instruction once'
          : 'The controller sends a continuous ordered stream', pad, 22,
      { color: p.ink2, size: 11.5, max: w - pad * 2 });

      // Messages on the wire.
      for (let i = 0; i < N; i++) {
        const x = pad + i * (bw + 6);
        const dropped = dropAt === i + 1;
        const txt = posture === 'state' ? `ch1=${40 + i * 20}` : posture === 'event' ? `CUE ${i + 1}` : `pkt ${i + 1}`;
        box(g, x, trackY, bw, 34, {
          fill: dropped ? alpha(p.red, 0.14) : alpha(R.signal, 0.14),
          stroke: dropped ? R.fault : alpha(R.signal, 0.6), r: 6,
        });
        label(g, txt, x + bw / 2, trackY + 17, {
          color: dropped ? R.fault : p.ink, size: 10, align: 'center', weight: 600, max: bw - 6,
        });
        if (dropped) {
          line(g, x + 4, trackY + 4, x + bw - 4, trackY + 30, { color: R.fault, lw: 2 });
          line(g, x + bw - 4, trackY + 4, x + 4, trackY + 30, { color: R.fault, lw: 2 });
        }
      }
      label(g, 'on the wire', pad, trackY - 10, { color: p.muted, size: 9.5 });

      // What the device believes, after each message.
      const belY = 150;
      let held = 40;
      let cueCount = 0;
      for (let i = 0; i < N; i++) {
        const x = pad + i * (bw + 6);
        const dropped = dropAt === i + 1;
        let txt, tone;
        if (posture === 'state') {
          if (!dropped) held = 40 + i * 20;
          txt = `${held}`;
          tone = dropped ? p.muted : R.safe;
        } else if (posture === 'event') {
          if (!dropped) cueCount = i + 1;
          txt = `at ${cueCount}`;
          tone = dropAt > 0 && i + 1 >= dropAt ? R.fault : R.safe;
        } else {
          txt = dropped ? 'click' : 'ok';
          tone = dropped ? R.fault : R.safe;
        }
        box(g, x, belY, bw, 30, { fill: alpha(tone, 0.12), stroke: alpha(tone, 0.6), r: 6 });
        label(g, txt, x + bw / 2, belY + 15, { color: tone, size: 10.5, align: 'center', weight: 700, max: bw - 6 });
      }
      label(g, 'what the device now believes', pad, belY - 10, { color: p.muted, size: 9.5 });

      const verdict = dropAt === 0 ? 'Nothing dropped yet. Move the slider.'
        : posture === 'state' ? `Message ${dropAt} lost. The device held the old value for 22 ms, then message ${dropAt + 1} corrected it. Nothing to report.`
          : posture === 'event' ? `Cue ${dropAt} lost. The device is permanently one cue behind, and neither end knows.`
            : `Packet ${dropAt} lost. An audible click. A retransmission would arrive too late to be worth having.`;
      labelWrap(g, verdict, pad, belY + 52, {
        color: dropAt === 0 ? p.muted : posture === 'state' ? R.safe : R.fault,
        size: 11.5, max: w - pad * 2, maxLines: 2,
      });
    },
  });
  upd();
});

register('cue-anatomy', (host) => chain(host, {
  title: 'What a cue is actually made of',
  sub: 'A change, at a moment, that somebody is responsible for. All three parts, or it is something else.',
  tag: 'Part',
  accent: 'energy',
  stages: [
    {
      name: 'A change',
      body: 'Something in the world is different afterwards: a look, a level, a position, a state.',
      why: 'Without a change there is nothing to cue. A cue that changes nothing is a placeholder.',
      note: 'A change on its own, with no moment attached, is a <b>preset</b>. Useful, and not a cue.',
    },
    {
      name: 'At a moment',
      body: 'A specific instant, decided by a person, a clock, a sensor, a previous cue, or a schedule.',
      why: 'The moment is the thing a trigger delivers. The trigger and the cue are not the same object.',
      note: '"The video cue" is not a cue: it is a device receiving one. <b>The cue is the moment, and it belongs to whoever called it.</b>',
    },
    {
      name: 'Somebody responsible',
      body: 'A named person who decided this should happen and can be asked why.',
      why: 'This is what separates a designed system from an accumulation of automations.',
      note: 'A moment with nobody responsible is an automation. <b>Automations are fine, and shows get hurt by the ones nobody remembers agreeing to.</b>',
    },
    {
      name: 'The trigger',
      body: 'Manual GO, timecode, auto-follow, an external message, a sensor, a schedule. Six kinds, and a system usually has several.',
      why: 'Choosing the trigger is choosing what the cue depends on, which is choosing its failure mode.',
      note: 'Each trigger brings its own dependency. <b>A manual GO depends on a person watching; timecode depends on a clock; a network trigger depends on the network being healthy at that instant.</b>',
    },
    {
      name: 'The failure behaviour',
      body: 'What happens if this cue does not fire, and who notices.',
      why: 'The part almost nobody writes down, and the part a production manager actually needs.',
      note: 'Write this one down for every critical cue in the show. <b>It is a single page, it takes an hour, and it is the document that gets read.</b>',
    },
  ],
  footer: 'The trigger and the cue are different things. Confusing them is the commonest vocabulary error in a production meeting.',
}));

register('command-vs-data', (host) => {
  let mode = 'data';
  let loss = 0;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'A command and a value, both lost',
    sub: 'Turn up the loss and watch what each one does to the state at the far end.',
    note: '',
  });

  const upd = () => {
    setNote(mode === 'data'
      ? 'Data is state, and state is repeated. Losing copies makes the far end briefly stale and then correct again, and at any loss rate short of total it converges. <b>This is why DMX, sACN and Dante can be sent over UDP with no acknowledgement and still be trusted.</b>'
      : 'A command is an event. It happens once, and a lost one is a cue that did not happen, with nothing at either end to notice. <b>Loss does not average out for commands: every lost message is a permanent divergence, which is why they need a different transport or a repeat.</b>');
    cv.once();
  };

  controls.append(choice('Sending', [['data', 'Data, a repeated value'], ['cmd', 'A command, once']], {
    value: 'data', on: (v) => { mode = v; upd(); },
  }).node);
  controls.append(slider('Packet loss', {
    min: 0, max: 60, step: 5, value: 0, fmt: (v) => `${v}%`, on: (v) => { loss = v; upd(); },
  }).node);

  challenge('Find a loss rate that ruins the command path and leaves the data path usable.',
    () => mode === 'cmd' && loss >= 20);

  const cv = canvas(stage, {
    height: 250, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 14;
      const N = 20;
      // Deterministic pseudo-random so the picture does not change on repaint.
      const lost = (i) => ((i * 2654435761) % 100) < loss;

      label(g, mode === 'data' ? 'Sender: "channel 1 is at 200", forty four times a second'
        : 'Sender: GO, once, when the operator presses it',
      pad, 20, { color: p.ink2, size: 11.5, max: w - pad * 2 });

      const bw = (w - pad * 2) / N;
      const y = 62;
      let arrived = 0, dropped = 0;
      for (let i = 0; i < N; i++) {
        const x = pad + i * bw;
        const isLost = lost(i);
        if (isLost) dropped++; else arrived++;
        box(g, x + 1, y, bw - 2, 26, {
          fill: isLost ? alpha(p.red, 0.16) : alpha(R.signal, 0.16),
          stroke: isLost ? alpha(R.fault, 0.7) : alpha(R.signal, 0.5), r: 4,
        });
        if (isLost) {
          line(g, x + 4, y + 4, x + bw - 5, y + 22, { color: R.fault, lw: 1.5 });
        }
      }
      label(g, `${arrived} arrived, ${dropped} lost`, pad, y + 42, { color: p.muted, size: 10.5 });

      // The state at the far end, over time.
      const gy = 120, gh = 76;
      box(g, pad, gy, w - pad * 2, gh, { fill: alpha(p.line, 0.3), stroke: p.line, r: 6 });
      g.save();
      g.beginPath();
      g.rect(pad, gy, w - pad * 2, gh);
      g.clip();
      g.strokeStyle = mode === 'data' ? R.safe : (loss > 0 ? R.fault : R.safe);
      g.lineWidth = 2.5;
      g.beginPath();
      let val = 0;
      let fired = false;
      for (let i = 0; i < N; i++) {
        const x = pad + i * bw + bw / 2;
        if (mode === 'data') {
          if (!lost(i)) val = 1;
        } else if (!lost(i) && !fired) { val = 1; fired = true; }
        const yy = gy + gh - 10 - val * (gh - 24);
        if (i === 0) g.moveTo(pad, yy);
        g.lineTo(x, yy);
      }
      g.stroke();
      g.restore();

      label(g, mode === 'data' ? 'state at the far end: correct as soon as any copy lands'
        : fired ? 'state at the far end: the cue fired on the first copy that arrived'
          : 'state at the far end: the cue never happened',
      pad + 8, gy + 14, {
        color: mode === 'data' || fired ? R.safe : R.fault, size: 11, weight: 600, max: w - pad * 2 - 16,
      });
      label(g, mode === 'data'
        ? `At ${loss}% loss the far end is briefly stale and then correct. It converges.`
        : loss === 0 ? 'At 0% loss it fires. That tells you nothing about the design.'
          : `At ${loss}% loss there is a real chance the only copy was the lost one, and nothing reports it.`,
      pad, gy + gh + 22, { color: p.muted, size: 11, max: w - pad * 2 });
    },
  });
  upd();
});

register('feedback-loop', (host) => compare(host, {
  title: 'Open loop, closed loop, and the thing in between',
  sub: 'Most of a modern rig is the third one, and it is routinely described as the second.',
  accent: 'safe',
  fields: [
    { key: 'what', label: 'What comes back' },
    { key: 'acts', label: 'What acts on it' },
    { key: 'where', label: 'Where you meet it' },
    { key: 'fails', label: 'How it fails', tone: 'fault' },
  ],
  items: [
    {
      name: 'Open loop', short: 'Open', tone: 'fault',
      line: 'Send the instruction and assume it worked.',
      what: 'Nothing at all',
      acts: 'Nothing. There is nothing to act on',
      where: 'Almost all lighting control. DMX, sACN, Art-Net',
      fails: 'Silently, and everything you believe about the rig you believe because you sent it',
      note: 'Open loop is not a defect: it is the correct trade for something that repeats its whole state 44 times a second. <b>It becomes a defect the moment somebody says "the console will tell us if a fixture is out".</b>',
    },
    {
      name: 'Telemetry', short: 'Telemetry', tone: 'energy',
      line: 'Reported state that a human reads and nothing acts on.',
      what: 'Lamp hours, temperature, device presence, disc space, link status',
      acts: 'A person, if they are looking at the right screen',
      where: 'RDM sensors, Dante Controller, media server status, SNMP monitoring',
      fails: 'It reports correctly to a screen nobody is watching at the moment it matters',
      note: 'Telemetry is worth more than people think and less than the marketing says. <b>It is the difference between finding a fault in the rig check and finding it in the show, and it is not feedback, because nothing in the control path uses it.</b>',
    },
    {
      name: 'Closed loop', short: 'Closed', tone: 'safe',
      line: 'The system finds out what happened and the control acts on it.',
      what: 'Position, velocity, limits, load, from encoders and switches',
      acts: 'The controller, continuously, within milliseconds',
      where: 'Stage machinery, animatronics, anything that moves and could hurt somebody',
      fails: 'Detectably. A position error becomes a safety stop, which is the designed behaviour',
      note: 'Machinery is closed loop because the alternative is unacceptable, not because it is better engineering. <b>The cost is a completely different control architecture, which is why machinery does not use the same approach as lighting even when it could use the same cable.</b>',
    },
  ],
  footer: 'Saying "the system monitors itself" usually means telemetry. Ask what acts on it.',
}));

register('architectures', (host) => compare(host, {
  title: 'Three architectures, three ways of failing',
  sub: 'How the intelligence is distributed decides how the system fails, which is the only thing about it worth remembering.',
  accent: 'signal',
  fields: [
    { key: 'shape', label: 'Shape' },
    { key: 'fail', label: 'How it fails', tone: 'fault' },
    { key: 'diag', label: 'Time to diagnose' },
    { key: 'good', label: 'Right when' },
    { key: 'bad', label: 'Wrong when' },
  ],
  items: [
    {
      name: 'Centralised', short: 'Centralised', tone: 'energy',
      line: 'One controller knows everything and drives everything.',
      shape: 'A single show controller or console, with devices that only obey',
      fail: 'Completely, and obviously. The show stops and everybody knows why in ten seconds',
      diag: 'Seconds. There is one thing to look at',
      good: 'A one-off event with a technician present; anything where a rehearsed changeover to a spare is realistic',
      bad: 'A permanent installation that must degrade rather than stop',
      note: 'Total, obvious failure is underrated. <b>The clarity is worth real money, and the fix is a spare box and a changeover somebody has actually practised.</b>',
    },
    {
      name: 'Distributed', short: 'Distributed', tone: 'signal',
      line: 'Intelligence sits in each zone, and each keeps going on its own.',
      shape: 'A controller per zone or per device, each holding its own logic and content',
      fail: 'Partially, and confusingly. Three of eight zones stop and the rest look fine',
      diag: 'Half an hour the show does not have',
      good: 'A permanent installation, an attraction, anything unattended that must keep most of itself running',
      bad: 'A one-off with a technician per zone anyway, where the diagnosis cost outweighs the resilience',
      note: 'Distributed systems degrade instead of stopping, which sounds strictly better and is not. <b>You trade a clear failure for a confusing one, and confusion is expensive on a show floor.</b>',
    },
    {
      name: 'Hybrid', short: 'Hybrid', tone: 'safe',
      line: 'A central controller for the show, with local intelligence that holds when it is lost.',
      shape: 'What almost every real system actually is, whether or not the drawing says so',
      fail: 'In parts. The centre stops and the zones hold their last state, or fall back to a local look',
      diag: 'Depends entirely on whether the drawing says which parts are which',
      good: 'Nearly everything, if it is drawn honestly',
      bad: 'When it happened by accident and nobody documented which parts are autonomous',
      note: 'Almost every real system is hybrid. <b>The failure is not the architecture, it is not saying so on the drawing, which is why nobody can find the thing that broke.</b>',
    },
  ],
  footer: 'Ask of any system: when this stops, what keeps going, and does anybody know?',
}));

register('five-questions', (host) => chain(host, {
  title: 'The Five Questions',
  sub: 'Ask these of any protocol and you have understood it well enough to design with it.',
  tag: 'Question',
  accent: 'signal',
  stages: [
    {
      name: 'What is a message?',
      body: 'Where does one start and stop? How big is it? What is inside it?',
      why: 'Framing. A receiver that joins the conversation late has to be able to find its place.',
      note: 'DMX marks a message with a break longer than any valid byte. MIDI marks it with the top bit of a status byte. sACN puts one in each UDP packet. <b>Three different answers to the same question, and each one shapes everything else about the protocol.</b>',
    },
    {
      name: 'Who is it for?',
      body: 'Broadcast to everybody, addressed to one device, sent to a group, or aimed at nobody in particular?',
      why: 'Addressing is what makes a shared transport usable, and every protocol answers it differently.',
      note: 'DMX answers it by refusing to: everything hears everything and the device picks out its own bytes. <b>That single decision is why two fixtures on one address both respond forever with nothing reporting an error.</b>',
    },
    {
      name: 'When must it arrive?',
      body: 'A hard deadline, a soft one, or whenever it gets there?',
      why: 'This is what decides whether best-effort networking is acceptable, and what QoS is for.',
      note: 'Audio is a quarter of a millisecond. A cue is fifty. Management traffic has no deadline at all. <b>Management is the villain: no deadline means no manners, which is why it gets its own VLAN.</b>',
    },
    {
      name: 'How do you know it arrived?',
      body: 'Acknowledged, repeated until it must have, or never confirmed at all?',
      why: 'It decides the transport. TCP acknowledges; UDP does not; DMX repeats instead.',
      note: 'Most protocols in this course never confirm anything, and repeat instead. <b>For state that works perfectly. For a command it means nobody, at either end, knows whether the cue happened.</b>',
    },
    {
      name: 'What happens when it does not?',
      body: 'The device holds, fades, goes dark, mutes, stops, or does something a menu setting decided years ago.',
      why: 'The professional question, and the one specified in a sentence or not at all.',
      note: 'Anybody can look up a packet format. <b>Knowing that a fixture holds its last look, that an amplifier mutes after a few seconds without clock, and that a hoist stops and holds, is what makes you useful in a production meeting.</b>',
    },
  ],
  footer: 'Every protocol section in this module ends with its five answers. The comparison between them is the actual content of the course.',
}));

// ---------------------------------------------------------------------------
// Session 2
// ---------------------------------------------------------------------------

register('contact-closure', (host) => {
  let closed = false;
  let pullup = true;
  let bounce = false;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'A contact closure, and the two ways to get it wrong',
    sub: 'Close the switch. Then remove the pull-up, and then add the bounce a real switch has.',
    note: '',
  });

  const upd = () => {
    setNote(!pullup
      ? 'With no pull-up the input is floating whenever the switch is open. It is not off: it is undefined, and it reads whatever the dimmer next to the cable is doing. <b>An input that triggers when somebody walks past the cable is always a missing pull-up or pull-down.</b>'
      : bounce
        ? 'Mechanical contacts bounce: several makes and breaks over 1 to 20 ms before settling. A controller polling at 1 kHz sees five triggers where a person pressed once. <b>The fix is a 20 to 50 ms debounce window, and a GPI that occasionally fires twice is this about nine times out of ten.</b>'
        : 'One bit of information, one direction, no identity, and no agreement to get wrong. Closed means go. <b>It is the most reliable cue transport in the building and every experienced technician knows it, which is why it is still specified on major productions in 2026.</b>');
    cv.once();
  };

  controls.append(toggle('Switch closed', { value: false, on: (v) => { closed = v; upd(); } }).node);
  controls.append(toggle('Pull-up fitted', { value: true, on: (v) => { pullup = v; upd(); } }).node);
  controls.append(toggle('Show contact bounce', { value: false, on: (v) => { bounce = v; upd(); } }).node);

  challenge('Remove the pull-up and read what the input is actually doing.', () => !pullup);

  const cv = canvas(stage, {
    height: 300,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;

      // Circuit.
      const railY = 46;
      const gndY = 148;
      const midX = Math.min(300, w * 0.46);

      label(g, '+5 V', pad, railY - 16, { color: R.energy, size: 10.5, weight: 600 });
      line(g, pad, railY, w - pad, railY, { color: R.energy, lw: 2 });
      line(g, pad, gndY, w - pad, gndY, { color: R.safe, lw: 2 });
      label(g, '0 V', pad, gndY + 14, { color: R.safe, size: 10.5, weight: 600 });

      // Pull-up resistor.
      const rx = midX;
      if (pullup) {
        line(g, rx, railY, rx, railY + 20, { color: R.energy, lw: 2 });
        box(g, rx - 9, railY + 20, 18, 30, { fill: p.raised, stroke: p.ink2, r: 3 });
        label(g, '10k', rx + 16, railY + 35, { color: p.ink2, size: 10, mono: true });
        line(g, rx, railY + 50, rx, 96, { color: R.signal, lw: 2 });
      } else {
        line(g, rx, railY, rx, railY + 14, { color: alpha(p.muted, 0.4), lw: 2, dash: [3, 3] });
        label(g, 'no pull-up', rx + 16, railY + 22, { color: R.fault, size: 10.5, weight: 600 });
        line(g, rx, 96, rx, 96, { color: R.signal, lw: 2 });
      }

      // The input node.
      const inX = Math.min(w - pad - 110, midX + 90);
      line(g, rx, 96, inX, 96, { color: pullup || closed ? R.signal : alpha(R.fault, 0.7), lw: 2, dash: pullup || closed ? null : [4, 4] });
      node(g, inX, 78, 100, 36, 'GPI input', {
        fill: p.raised, stroke: p.line, color: p.ink, size: 11,
      });

      // The switch, down to ground.
      line(g, rx, 96, rx, 120, { color: R.signal, lw: 2 });
      const swY = 120;
      g.strokeStyle = closed ? R.safe : p.muted;
      g.lineWidth = 2.5;
      g.beginPath();
      g.moveTo(rx - 16, swY);
      if (closed) g.lineTo(rx + 16, swY);
      else g.lineTo(rx + 14, swY - 14);
      g.stroke();
      g.fillStyle = closed ? R.safe : p.muted;
      for (const cx of [rx - 16, rx + 16]) { g.beginPath(); g.arc(cx, swY, 3, 0, Math.PI * 2); g.fill(); }
      line(g, rx - 16, swY, rx - 16, gndY, { color: R.safe, lw: 2 });
      line(g, rx + 16, swY, rx + 16, 96, { color: R.signal, lw: 2 });
      label(g, closed ? 'closed' : 'open', rx, swY + 22, { color: closed ? R.safe : p.muted, size: 10.5, align: 'center', weight: 600 });

      // What the input actually reads.
      const state = !pullup && !closed ? 'undefined' : closed ? 'LOW — active' : 'HIGH — idle';
      const tone = !pullup && !closed ? R.fault : closed ? R.safe : p.ink2;
      label(g, `reads: ${state}`, inX + 50, 130, { color: tone, size: 11.5, align: 'center', weight: 700, max: 140 });

      // Timing trace.
      const ty = 190, th = 60;
      box(g, pad, ty, w - pad * 2, th, { fill: alpha(p.line, 0.25), stroke: p.line, r: 6 });
      label(g, 'what the controller samples', pad + 8, ty - 8, { color: p.muted, size: 9.5 });
      g.save();
      g.beginPath(); g.rect(pad, ty, w - pad * 2, th); g.clip();
      g.strokeStyle = !pullup && !closed ? R.fault : R.signal;
      g.lineWidth = 2;
      g.beginPath();
      const hi = ty + 12, lo = ty + th - 12;
      const px0 = pad + 6, px1 = w - pad - 6;
      const press = px0 + (px1 - px0) * 0.4;
      for (let x = px0; x <= px1; x += 1.5) {
        let y;
        if (!pullup && !closed) {
          // Floating: noise.
          y = (hi + lo) / 2 + Math.sin(x * 0.35 + t * 4) * 12 + Math.sin(x * 1.1) * 5;
        } else if (!closed) {
          y = hi;
        } else if (x < press) {
          y = hi;
        } else if (bounce && x < press + 26) {
          y = Math.floor((x - press) / 4) % 2 === 0 ? lo : hi;
        } else {
          y = lo;
        }
        if (x === px0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
      g.restore();
      if (closed && bounce) {
        label(g, '1 to 20 ms of bounce', press + 30, ty + 14, { color: R.fault, size: 10, weight: 600, max: w - press - pad - 40 });
      }
      label(g, !pullup && !closed ? 'floating: reads whatever is nearby'
        : closed ? (bounce ? 'a single press, read as several closures' : 'clean, one closure')
          : 'idle high, defined by the pull-up',
      pad, ty + th + 18, { color: p.muted, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});

register('sourcing-sinking', (host) => compare(host, {
  title: 'Sourcing, sinking, dry and wet',
  sub: 'The vocabulary every automation integrator will use, and the reason half of all GPI wiring does not work first time.',
  accent: 'energy',
  fields: [
    { key: 'does', label: 'What it does' },
    { key: 'also', label: 'Also called' },
    { key: 'needs', label: 'The other end needs' },
    { key: 'wrong', label: 'What goes wrong', tone: 'fault' },
  ],
  items: [
    {
      name: 'Dry contact output', short: 'Dry out', tone: 'safe',
      line: 'A switch with no voltage of its own: a relay contact or a pair of terminals.',
      does: 'Connects two terminals together, and supplies nothing',
      also: 'Volt-free, isolated contact, potential-free',
      needs: 'An input that supplies its own voltage and detects the current',
      wrong: 'Connected to another dry input, nobody supplies the voltage and nothing happens at all',
      note: 'Dry to dry is the fault people spend an afternoon on, because it looks like a broken device rather than a category error. <b>Read both manuals before you strip anything.</b>',
    },
    {
      name: 'Wet contact output', short: 'Wet out', tone: 'energy',
      line: 'An output that supplies its own voltage, typically 12 or 24 V.',
      does: 'Puts a voltage on the line when active',
      also: 'Powered output, voltage output',
      needs: 'An input that detects a voltage and supplies nothing',
      wrong: 'Connected to another wet output, two sources fight, and in a bad case something is damaged',
      note: 'Wet to wet is the more expensive mistake, because two supplies driving one line can destroy an output stage. <b>If either manual is ambiguous, meter the terminals before you connect them.</b>',
    },
    {
      name: 'Sinking output', short: 'Sinking', tone: 'signal',
      line: 'Pulls the line down to ground when active. It can only pull down.',
      does: 'Connects the line to 0 V through a transistor',
      also: 'Open collector, open drain, NPN, active low',
      needs: 'A pull-up resistor somewhere, so the line has a defined state when the output is off',
      wrong: 'With no pull-up the input floats and triggers on whatever is nearby',
      note: 'This is the commonest electronics-to-electronics arrangement, and it is why the pull-up matters. <b>Every input must have a defined state when nothing is driving it, and you must know which state that is.</b>',
    },
    {
      name: 'Sourcing output', short: 'Sourcing', tone: 'signal',
      line: 'Pushes the line up to the supply when active. It can only pull up.',
      does: 'Connects the line to the positive rail through a transistor',
      also: 'PNP, active high',
      needs: 'A pull-down resistor so the line is defined when the output is off',
      wrong: 'Same floating-input problem, in the other direction',
      note: 'Sourcing and sinking are mirror images, and a sourcing output into a sinking-expecting input does nothing. <b>The words are worth learning because the industrial world uses them constantly and the entertainment world often does not.</b>',
    },
    {
      name: 'Form C contact', short: 'Form C', tone: 'safe',
      line: 'A changeover: common, normally open and normally closed, all three brought out.',
      does: 'Moves the common from one terminal to the other',
      also: 'SPDT, changeover, transfer contact',
      needs: 'An input that watches both, so it can tell activated from disconnected',
      wrong: 'Nothing, which is the point. This is the arrangement to specify for anything critical',
      note: 'With a Form A contact a cut cable and an inactive output look identical, forever. <b>Form C is a few pence more and it is the difference between a fault you find in the rig check and one you find in the show.</b>',
    },
  ],
  footer: 'Read the manual for both ends. The words to hunt for are dry, volt-free, sourcing, sinking, and Form A, B or C.',
}));

register('output-types', (host) => compare(host, {
  title: 'Four ways to close something in the world',
  sub: 'The word "relay" on a datasheet tells you almost nothing. These four behave completely differently.',
  accent: 'energy',
  fields: [
    { key: 'is', label: 'What it is' },
    { key: 'speed', label: 'Speed' },
    { key: 'iso', label: 'Isolation' },
    { key: 'cost', label: 'What it costs you', tone: 'fault' },
    { key: 'use', label: 'Where it belongs' },
  ],
  items: [
    {
      name: 'Mechanical relay', short: 'Relay', tone: 'energy',
      line: 'A coil pulling physical contacts together.',
      is: 'A coil, an armature and a set of contacts',
      speed: '5 to 15 ms to operate, and it bounces',
      iso: 'Genuine galvanic isolation, thousands of volts',
      cost: 'Wears out, is slow, is audible, and needs a flyback diode across the coil',
      use: 'Anything mains, anything genuinely isolated, anything infrequent',
      note: 'A relay is the only one of these four whose isolation you can see. <b>The contacts are physically apart, which is why it remains the answer for anything mains-adjacent, and the flyback diode across the coil is not optional.</b>',
    },
    {
      name: 'Solid state relay', short: 'SSR', tone: 'signal',
      line: 'A triac or MOSFET behind an optocoupler.',
      is: 'Semiconductor switching with an optical isolation barrier',
      speed: 'Microseconds, silent, no bounce, no wear',
      iso: 'Optical, typically several kV, provided nothing bridges the grounds',
      cost: 'Drops about 1 to 1.5 V while conducting, so 10 A is 10 to 15 W of heat and a heatsink',
      use: 'Frequent switching, silence, anything that must not wear out',
      note: 'The commonest SSR failure is thermal, from mounting it on nothing. <b>A mechanical relay dissipates almost nothing while closed; an SSR dissipates continuously, and the datasheet assumes you read the heatsink section.</b>',
    },
    {
      name: 'Open collector', short: 'Open collector', tone: 'signal',
      line: 'A transistor that pulls a line down to ground and nothing else.',
      is: 'One transistor, no isolation, no supply of its own',
      speed: 'Microseconds',
      iso: 'None. Shares a ground with whatever it is driving',
      cost: 'Needs a pull-up at the far end, and cannot source any current at all',
      use: 'Talking to another piece of electronics over a short distance',
      note: 'This is what most GPO ports on show equipment actually are, whatever the manual calls them. <b>If the far end has no pull-up, nothing happens, and both devices are working perfectly.</b>',
    },
    {
      name: 'Logic level', short: 'Logic', tone: 'fault',
      line: 'A pin sitting at 0 V or 3.3 V, driven directly.',
      is: 'A processor pin, or a buffer on one',
      speed: 'Nanoseconds',
      iso: 'None whatsoever',
      cost: 'No isolation, no protection, no distance. A fault on the far end reaches the processor',
      use: 'Board to board, inside one box, and nowhere else',
      note: 'A logic-level output leaving an enclosure is a design error. <b>It has no protection against anything: a static discharge, a ground offset or a miswire reaches the processor directly.</b>',
    },
  ],
  footer: 'Form A is normally open, Form B is normally closed, Form C is a changeover. Specify the form, not just the current rating.',
}));

register('isolation-defeated', (host) => {
  let sharedPsu = false;
  let rackScrew = false;
  let benchEarth = false;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'How a 5 kV optocoupler ends up providing no isolation',
    sub: 'The component is perfect in every case below. Add one convenience path at a time.',
    note: '',
  });

  const paths = () => [sharedPsu, rackScrew, benchEarth].filter(Boolean).length;

  const upd = () => {
    const n = paths();
    setNote(n === 0
      ? 'Two circuits with no conductive path between them. The signal crosses by light, so a ground offset of hundreds of volts on the load side cannot reach the control side. <b>This is the case that is drawn on the schematic and it is rarely the case that is built.</b>'
      : `${n === 1 ? 'One path' : `${n} paths`} around the outside of the optocoupler, and the isolation is gone. The component is still working perfectly and there is still no conductive path across the package. <b>Isolation is a property of the whole system, and the only test that proves it is resistance between the two grounds, with everything connected, at the end of the build. It should read open.</b>`);
    cv.once();
  };

  controls.append(toggle('Shared power supply ground', { value: false, on: (v) => { sharedPsu = v; upd(); } }).node);
  controls.append(toggle('Rack screw across both planes', { value: false, on: (v) => { rackScrew = v; upd(); } }).node);
  controls.append(toggle('Bench earth left from commissioning', { value: false, on: (v) => { benchEarth = v; upd(); } }).node);

  challenge('Defeat the isolation with a single convenience path.', () => paths() >= 1);

  const cv = canvas(stage, {
    height: 290,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const half = w / 2;
      const broken = paths() > 0;

      // The two islands.
      box(g, pad, 40, half - pad - 14, 130, {
        fill: alpha(R.safe, 0.07), stroke: alpha(R.safe, 0.5), r: 10,
      });
      box(g, half + 14, 40, half - pad - 14, 130, {
        fill: alpha(R.energy, 0.07), stroke: alpha(R.energy, 0.5), r: 10,
      });
      label(g, 'Control side', pad + 12, 58, { color: R.safe, size: 12, weight: 700 });
      label(g, 'a person can touch this', pad + 12, 74, { color: p.muted, size: 10 });
      label(g, 'Load side', half + 26, 58, { color: R.energy, size: 12, weight: 700 });
      label(g, 'mains, motors, a hostile ground', half + 26, 74, { color: p.muted, size: 10 });

      // The optocoupler across the gap.
      const ox = half - 26, ow = 52;
      box(g, ox, 96, ow, 44, { fill: p.raised, stroke: p.ink2, r: 6 });
      label(g, 'opto', ox + ow / 2, 112, { color: p.ink, size: 10, align: 'center', weight: 600 });
      label(g, '5 kV', ox + ow / 2, 126, { color: R.safe, size: 9.5, align: 'center', mono: true });
      // Light crossing.
      for (let i = 0; i < 3; i++) {
        const x = ox + 14 + ((t * 26 + i * 12) % 24);
        g.fillStyle = alpha(R.signal, 0.9);
        g.beginPath(); g.arc(x, 118, 2, 0, Math.PI * 2); g.fill();
      }
      line(g, pad + 40, 118, ox, 118, { color: R.signal, lw: 2 });
      line(g, ox + ow, 118, w - pad - 40, 118, { color: R.energy, lw: 2 });

      // Ground bars.
      const gyL = 158, gyR = 158;
      line(g, pad + 20, gyL, half - 30, gyL, { color: R.safe, lw: 3 });
      line(g, half + 30, gyR, w - pad - 20, gyR, { color: R.energy, lw: 3 });
      label(g, 'control 0 V', pad + 20, gyL + 14, { color: p.muted, size: 9.5 });
      label(g, 'load 0 V', w - pad - 20, gyR + 14, { color: p.muted, size: 9.5, align: 'right' });

      // The convenience paths, each looping under the barrier.
      const drawPath = (yy, lbl, on) => {
        if (!on) return;
        g.save();
        g.strokeStyle = R.fault;
        g.lineWidth = 2.5;
        g.setLineDash([]);
        g.beginPath();
        g.moveTo(pad + 40, gyL);
        g.lineTo(pad + 40, yy);
        g.lineTo(w - pad - 40, yy);
        g.lineTo(w - pad - 40, gyR);
        g.stroke();
        g.restore();
        label(g, lbl, half, yy - 8, { color: R.fault, size: 10, align: 'center', weight: 600, max: w - 80 });
        // Current flowing round the outside.
        flowDots(g, pad + 40, yy, w - pad - 40, yy, { color: R.fault, t, speed: 0.8, count: 8, r: 2.4 });
      };
      drawPath(196, 'shared power supply ground', sharedPsu);
      drawPath(224, 'rack screw touching both ground planes', rackScrew);
      drawPath(252, 'bench earth, connected during commissioning and left', benchEarth);

      // The verdict banner.
      const msg = broken
        ? `Isolation defeated by ${paths()} path${paths() > 1 ? 's' : ''} around the component`
        : 'Isolated: no conductive path between the two sides';
      box(g, pad, 8, w - pad * 2, 24, {
        fill: alpha(broken ? R.fault : R.safe, 0.12), stroke: alpha(broken ? R.fault : R.safe, 0.5), r: 6,
      });
      label(g, msg, w / 2, 20, {
        color: broken ? R.fault : R.safe, size: 11.5, align: 'center', weight: 700, max: w - pad * 2 - 16,
      });
    },
  });
  upd();
});

register('estop-chain', (host) => chain(host, {
  title: 'Why an emergency stop is not a network message',
  sub: 'Step through what a safety function actually has to survive.',
  tag: 'Reason',
  accent: 'fault',
  stages: [
    {
      name: 'It works when nothing else does',
      body: 'A safety function has to operate at the exact moment the rest of the system has failed: congested, misconfigured, rebooting, or full of a media server\'s discovery traffic.',
      why: 'That is precisely when a shared best-effort network is least trustworthy.',
      note: 'This is not an argument about latency. <b>A network could be a hundred times faster and the argument would be identical, because the problem is dependency, not speed.</b>',
    },
    {
      name: 'A single fault must be detected',
      body: 'A broken wire, a shorted wire, a welded contact. Each must be noticed before a second fault can accumulate on top of it.',
      why: 'Dual-channel circuits with cross-monitoring exist for exactly this, and a single message on a network has no equivalent.',
      note: 'A normally-open button on a cut cable reads as "not pressed", forever. <b>Safety circuits are wired so that a break reads as a demand to stop, which is the opposite convention from every convenience input in the building.</b>',
    },
    {
      name: 'It is certified, not configured',
      body: 'Performance levels under EN ISO 13849, safety integrity levels under IEC 62061, calculated from the probability of a dangerous failure.',
      why: 'Those numbers demand specific architectures. They are not achievable by a protocol choice.',
      note: 'For entertainment machinery in Europe the standard is <b>EN 17206</b>, and it will be cited on any tender for powered flying, automation or lifts. <b>ESTA\'s E1.6 covers powered hoists and E1.43 covers performer flying.</b>',
    },
    {
      name: 'Where it does use a bus, the bus is rated',
      body: 'PROFIsafe, Safety over EtherCAT, CIP Safety, CANopen Safety. Certified as a system, with diagnostic coverage the standards require.',
      why: 'These are a different technology from the network in the rest of this module, not a configuration of it.',
      note: 'A safety bus is not something you set up. <b>It is designed and signed off by somebody qualified to do that, and the show network is not part of it.</b>',
    },
    {
      name: 'Your job is the boundary',
      body: 'The show network may send a machinery system a cue. It may read status back for display. Neither path may be capable of causing motion the safety system would not permit.',
      why: 'Drawing that boundary explicitly is one of the most valuable lines on a system drawing.',
      note: 'You will sit in meetings where somebody proposes putting a stop on a VLAN because it is separate. <b>Say no, in one sentence, and draw the boundary instead.</b>',
    },
  ],
  footer: 'Nothing that stops a machine to protect a person goes on the show network. It is not a performance question and it is not a budget question.',
}));

register('byte-explorer', (host) => {
  let v = 0xB7;

  const { controls, stage, setNote } = figure(host, {
    title: 'One byte, five ways',
    sub: 'The same eight bits. Everything else is an agreement about how to read them.',
    note: '',
  });

  const upd = () => {
    setNote(v === 0
      ? 'Zero. As DMX this is the null start code, meaning ordinary dimmer data follows. As a channel level it is off. <b>The same eight bits mean different things because two devices agreed different things about them, which is this whole module in miniature.</b>'
      : v & 0x80
        ? `The top bit is set. As MIDI this is a <b>status byte</b>, which is why MIDI data values stop at 127: the top bit is spent distinguishing the two. As an unsigned byte it is ${v}; as signed two's complement it is ${v - 256}.`
        : `The top bit is clear. As MIDI this is a <b>data byte</b>, value ${v}. As an unsigned byte and as a signed one it reads the same, because the sign bit is the top bit and it is not set.`);
    cv.once();
  };

  controls.append(slider('Value', {
    min: 0, max: 255, step: 1, value: 0xB7,
    fmt: (x) => `${x}  ·  0x${x.toString(16).toUpperCase().padStart(2, '0')}`,
    on: (x) => { v = x; upd(); },
  }).node);
  controls.append(button('0x00', () => { v = 0; upd(); }).node);
  controls.append(button('0x7F', () => { v = 0x7F; upd(); }).node);
  controls.append(button('0x80', () => { v = 0x80; upd(); }).node);
  controls.append(button('0xFF', () => { v = 255; upd(); }).node);

  const cv = canvas(stage, {
    height: 300, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 14;
      const bw = Math.min(46, (w - pad * 2 - 7 * 5) / 8);
      const x0 = pad;
      const y0 = 44;

      label(g, 'place value', x0, y0 - 24, { color: p.muted, size: 9.5 });
      for (let i = 0; i < 8; i++) {
        const bit = (v >> (7 - i)) & 1;
        const place = 2 ** (7 - i);
        const x = x0 + i * (bw + 5);
        // A visible gap between the two nibbles: one hex digit each.
        const nx = x + (i >= 4 ? 10 : 0);
        box(g, nx, y0, bw, 42, {
          fill: bit ? alpha(R.energy, 0.25) : p.raised,
          stroke: bit ? R.energy : p.line, r: 6, lw: bit ? 2 : 1,
        });
        label(g, String(bit), nx + bw / 2, y0 + 21, {
          color: bit ? R.energy : p.muted, size: 17, align: 'center', weight: 800, mono: true,
        });
        label(g, String(place), nx + bw / 2, y0 - 10, {
          color: bit ? p.ink2 : p.muted, size: 9.5, align: 'center', mono: true,
        });
      }
      const nibW = 4 * bw + 3 * 5;
      label(g, `high nibble = 0x${((v >> 4) & 15).toString(16).toUpperCase()}`, x0 + nibW / 2, y0 + 56,
        { color: p.muted, size: 10, align: 'center', mono: true });
      label(g, `low nibble = 0x${(v & 15).toString(16).toUpperCase()}`, x0 + nibW + 10 + nibW / 2, y0 + 56,
        { color: p.muted, size: 10, align: 'center', mono: true });

      // The five readings.
      const rows = [
        ['Decimal, unsigned', String(v), p.ink],
        ['Decimal, signed', String(v > 127 ? v - 256 : v), p.ink],
        ['Hexadecimal', `0x${v.toString(16).toUpperCase().padStart(2, '0')}`, R.signal],
        ['ASCII', v >= 32 && v < 127 ? `'${String.fromCharCode(v)}'` : 'not printable', p.ink2],
        ['As MIDI', v & 0x80
          ? `status: ${['Note Off', 'Note On', 'Poly AT', 'Control Change', 'Program Change', 'Chan AT', 'Pitch Bend', 'System'][Math.min(7, ((v >> 4) & 15) - 8)]}, ch ${(v & 15) + 1}`
          : `data byte, ${v}`, v & 0x80 ? R.energy : R.safe],
        ['As a DMX level', v === 0 ? 'off, or the null start code' : v === 255 ? 'full' : `${Math.round((v / 255) * 100)}% of full`, R.safe],
      ];
      let y = y0 + 82;
      const keyW = Math.min(150, w * 0.36);
      for (const [k, val, col] of rows) {
        line(g, pad, y - 6, w - pad, y - 6, { color: alpha(p.line, 0.7), lw: 1 });
        label(g, k, pad, y + 8, { color: p.muted, size: 11, weight: 600, max: keyW - 8 });
        label(g, val, pad + keyW, y + 8, { color: col, size: 12, mono: true, max: w - pad * 2 - keyW });
        y += 24;
      }
    },
  });
  upd();
});

register('endianness', (host) => {
  let value = 300;
  let big = true;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Which byte goes first',
    sub: 'A 16-bit value on the wire. Read it the wrong way round and it is not slightly wrong.',
    note: '',
  });

  const upd = () => {
    const hi = (value >> 8) & 255, lo = value & 255;
    const other = (lo << 8) | hi;
    setNote(big
      ? `Big-endian puts the most significant byte first, and this is <b>network byte order</b>: every IP header, and most protocols in this module including sACN. Read little-endian instead, ${value} becomes ${other}.`
      : `Little-endian puts the least significant byte first, which is what your laptop's processor uses internally and what Art-Net uses for its port addresses. Read big-endian instead, ${value} becomes ${other}. <b>Universe 1 becoming universe 256 is exactly this bug, and it is satisfying to find because the wrongness is so characteristic.</b>`);
    cv.once();
  };

  controls.append(slider('16-bit value', {
    min: 0, max: 65535, step: 1, value: 300, fmt: (x) => `${x}  ·  0x${x.toString(16).toUpperCase().padStart(4, '0')}`,
    on: (x) => { value = x; upd(); },
  }).node);
  controls.append(choice('Byte order', [['big', 'Big-endian (network)'], ['little', 'Little-endian']], {
    value: 'big', on: (x) => { big = x === 'big'; upd(); },
  }).node);

  challenge('Find the value that reads as 1 one way round and 256 the other.', () => value === 1 || value === 256);

  const cv = canvas(stage, {
    height: 230, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const hi = (value >> 8) & 255, lo = value & 255;
      const onWire = big ? [hi, lo] : [lo, hi];
      const wrong = (onWire[0] << 8) | onWire[1];
      const correct = big ? value : value;

      label(g, `The value: ${value}  ·  0x${value.toString(16).toUpperCase().padStart(4, '0')}  ·  ${value.toString(2).padStart(16, '0').replace(/(\d{8})(\d{8})/, '$1 $2')}`,
        pad, 22, { color: p.ink, size: 11.5, mono: true, max: w - pad * 2 });

      // The two bytes as they go on the wire.
      const bw = Math.min(140, (w - pad * 2 - 20) / 2);
      const y = 50;
      onWire.forEach((b, i) => {
        const x = pad + i * (bw + 20);
        box(g, x, y, bw, 56, { fill: alpha(R.signal, 0.14), stroke: R.signal, r: 8 });
        label(g, `0x${b.toString(16).toUpperCase().padStart(2, '0')}`, x + bw / 2, y + 20, {
          color: p.ink, size: 16, align: 'center', weight: 700, mono: true,
        });
        label(g, b.toString(2).padStart(8, '0'), x + bw / 2, y + 40, {
          color: p.muted, size: 10, align: 'center', mono: true,
        });
        label(g, i === 0 ? 'first on the wire' : 'second on the wire', x + bw / 2, y - 8, {
          color: p.muted, size: 9.5, align: 'center', max: bw,
        });
        label(g, (big ? i === 0 : i === 1) ? 'most significant' : 'least significant', x + bw / 2, y + 68, {
          color: (big ? i === 0 : i === 1) ? R.energy : p.ink2, size: 10, align: 'center', weight: 600, max: bw,
        });
      });

      // Two readers.
      const ry = 146;
      const readers = [
        ['A big-endian reader', (onWire[0] << 8) | onWire[1]],
        ['A little-endian reader', (onWire[1] << 8) | onWire[0]],
      ];
      readers.forEach(([nm, got], i) => {
        const x = pad + i * (bw + 20);
        const ok = got === value;
        box(g, x, ry, bw, 46, {
          fill: alpha(ok ? R.safe : R.fault, 0.1), stroke: alpha(ok ? R.safe : R.fault, 0.6), r: 8,
        });
        label(g, nm, x + bw / 2, ry + 15, { color: p.ink2, size: 10, align: 'center', max: bw - 8 });
        label(g, `reads ${got}`, x + bw / 2, ry + 33, {
          color: ok ? R.safe : R.fault, size: 13, align: 'center', weight: 700, mono: true, max: bw - 8,
        });
      });

      label(g, big
        ? 'Big-endian is network byte order: IP headers, sACN, most of this module.'
        : 'Little-endian is what a processor uses internally, and what Art-Net uses for its port addresses.',
      pad, ry + 66, { color: p.muted, size: 10.5, max: w - pad * 2 });
    },
  });
  upd();
});

register('bitmask', (host) => {
  let a = 0xB7;
  let b = 0x80;
  let op = 'and';

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'The four bitwise operations',
    sub: 'AND masks, OR sets, XOR toggles, and a shift moves. Every subnet calculation and every flag test is one of these.',
    note: '',
  });

  const compute = () => {
    if (op === 'and') return (a & b) & 255;
    if (op === 'or') return (a | b) & 255;
    if (op === 'xor') return (a ^ b) & 255;
    if (op === 'shl') return (a << (b & 7)) & 255;
    return (a >> (b & 7)) & 255;
  };

  const upd = () => {
    const r = compute();
    setNote(op === 'and' && b === 0x80
      ? `AND with 0x80 keeps only the top bit, which is ${r ? 'set' : 'clear'}. <b>This is the MIDI status test: a non-zero result means the byte starts a message, and it is the only test you need to make the whole protocol readable.</b>`
      : op === 'and'
        ? `AND keeps a bit only where both operands have it set. <b>Applying a mask to an address is this operation and nothing else, which is why subnetting is one instruction rather than arithmetic.</b>`
        : op === 'or'
          ? `OR sets a bit wherever either operand has it. <b>This is how you turn a flag on without disturbing the other seven, which is what a protocol specification means when it says "set bit 3".</b>`
          : op === 'xor'
            ? `XOR sets a bit where exactly one operand has it. <b>XOR of every byte in a message is the simplest checksum there is, and several protocols in this course use exactly that.</b>`
            : `Shifting ${op === 'shl' ? 'left' : 'right'} by ${b & 7} ${op === 'shl' ? 'multiplies' : 'divides'} by ${2 ** (b & 7)}. <b>Bits shifted off the end are gone, which is why a shift is destructive and an AND is not.</b>`);
    cv.once();
  };

  controls.append(slider('A', { min: 0, max: 255, step: 1, value: 0xB7, fmt: (v) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`, on: (v) => { a = v; upd(); } }).node);
  controls.append(choice('Operation', [['and', 'AND'], ['or', 'OR'], ['xor', 'XOR'], ['shl', '<<'], ['shr', '>>']], {
    value: 'and', on: (v) => { op = v; upd(); },
  }).node);
  controls.append(slider('B, or shift', { min: 0, max: 255, step: 1, value: 0x80, fmt: (v) => `0x${v.toString(16).toUpperCase().padStart(2, '0')}`, on: (v) => { b = v; upd(); } }).node);

  challenge('Use AND to test whether A is a MIDI status byte.', () => op === 'and' && b === 0x80);

  const cv = canvas(stage, {
    height: 230, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const r = compute();
      const isShift = op === 'shl' || op === 'shr';
      const bw = Math.min(40, (w - pad * 2 - 110 - 7 * 4) / 8);
      const labW = 96;

      const row = (y, nm, val, col, dim) => {
        label(g, nm, pad, y + 18, { color: p.muted, size: 11, weight: 600, max: labW - 8 });
        for (let i = 0; i < 8; i++) {
          const bit = (val >> (7 - i)) & 1;
          const x = pad + labW + i * (bw + 4);
          box(g, x, y, bw, 34, {
            fill: bit ? alpha(col, dim ? 0.12 : 0.28) : p.raised,
            stroke: bit ? alpha(col, dim ? 0.4 : 1) : p.line, r: 5, lw: bit && !dim ? 2 : 1,
          });
          label(g, String(bit), x + bw / 2, y + 17, {
            color: bit ? col : p.muted, size: 14, align: 'center', weight: 700, mono: true,
          });
        }
        const rx = pad + labW + 8 * (bw + 4) + 8;
        label(g, `0x${val.toString(16).toUpperCase().padStart(2, '0')}`, rx, y + 12, { color: p.ink2, size: 11, mono: true });
        label(g, String(val), rx, y + 26, { color: p.muted, size: 10.5, mono: true });
      };

      row(20, 'A', a, R.signal, false);
      row(64, isShift ? `shift ${b & 7}` : 'B', isShift ? (b & 7) : b, R.energy, isShift);
      line(g, pad, 108, w - pad, 108, { color: p.line, lw: 1.5 });
      label(g, { and: '&', or: 'OR', xor: '^', shl: '<<', shr: '>>' }[op], pad + labW - 18, 108,
        { color: p.ink, size: 14, weight: 800, align: 'right', mono: true });
      row(120, 'result', r, R.safe, false);

      labelWrap(g, op === 'and' ? 'A bit survives only where both have it set. This is a mask.'
        : op === 'or' ? 'A bit is set wherever either has it. This turns flags on.'
          : op === 'xor' ? 'A bit is set where exactly one has it. This toggles, and it checksums.'
            : `Bits move ${op === 'shl' ? 'left' : 'right'} by ${b & 7}, and anything past the end is gone.`,
      pad, 172, { color: p.muted, size: 11, max: w - pad * 2, maxLines: 2 });
    },
  });
  upd();
});

register('principles-tour', (host) => chain(host, {
  title: 'The seven principles',
  sub: 'Each one exists because something went wrong. Step through them and place a system you know against each.',
  tag: 'Principle',
  accent: 'safe',
  stages: [
    {
      name: '1 · Ensure safety',
      body: 'If the control system can move, heat, fire or drop something, safety is a design constraint before it is a feature.',
      why: 'Safety functions are hardwired or on a rated safety bus; every device\'s loss-of-control behaviour is defined, documented and tested.',
      note: 'Not negotiable, and it outranks everything else on this list. <b>Nothing that stops a machine to protect a person goes on the show network.</b>',
    },
    {
      name: '2 · The show must go on',
      body: 'A show is not a system that can be taken down for maintenance. Design the failure, not just the success.',
      why: 'Name the single point of failure out loud. Know the manual fallback, and check whether anybody has practised it.',
      note: 'This principle is what argues for a backup console at a lower sACN priority, two separate media networks, and a contact closure alongside the network cue. <b>An untested fallback is a hope.</b>',
    },
    {
      name: '3 · Simpler is always better',
      body: 'The system somebody else can understand at 02:00 beats the elegant one only you can.',
      why: 'Fewer boxes, fewer conversions, fewer places for an agreement to be wrong.',
      note: 'The test: can a competent stranger, with the documentation you actually wrote, find and fix a fault in this system? <b>If not, it is too complicated regardless of how well it works today.</b>',
    },
    {
      name: '4 · Strive for elegance',
      body: 'Elegance is not aesthetics. It is when the structure of the system matches the structure of the problem.',
      why: 'Universes grouped like the rig, VLANs matching departments, cue numbers matching the script.',
      note: 'An elegant system is one where the obvious guess about how it works is right. <b>Guessing correctly is what people do under pressure, so it is worth more than any single clever feature.</b>',
    },
    {
      name: '5 · Complexity yes, convolution no',
      body: 'A show system is genuinely complicated because shows are. That is complexity and you cannot design it away.',
      why: 'Convolution is complication that came from the process: three conversions because of a purchasing decision, two addressing schemes because two people built halves.',
      note: 'Complexity is earned; convolution is inherited. <b>Auditing which is which on a system you have taken over is genuinely useful work, and the convolution list is always longer than anybody expects.</b>',
    },
    {
      name: '6 · Scale, and leave room',
      body: 'Every show grows. Leave address space, universes, switch ports, rack units and DSP headroom.',
      why: 'A design at 100 per cent of capacity on opening night is compromised by the first change note.',
      note: 'The cheap version: <b>plan addressing at half density.</b> It costs nothing at design time and it is nearly impossible to retrofit.',
    },
    {
      name: '7 · Ensure security',
      body: 'Nearly every protocol here has no authentication at all, so network access control is the entire security model.',
      why: 'Anyone who can put a packet on your lighting VLAN can own the rig with sACN at priority 200, and there is no credential involved.',
      note: 'The threat that is actually likely is not an attacker: it is a contractor\'s laptop, a second DHCP server on a travel router, or a link to the office made during install and never removed. <b>Segmentation and an inventory prevent all of them.</b>',
    },
  ],
  footer: 'Take one incident you know about and place it against these seven. It will violate at least two.',
}));

register('troubleshoot-method', (host) => chain(host, {
  title: 'A method for finding faults that works when you are tired',
  sub: 'More show time is lost to disordered searching than to missing knowledge, every year, by a wide margin.',
  tag: 'Step',
  accent: 'signal',
  stages: [
    {
      name: 'Establish the boundary',
      body: 'What is working and what is not? Every test should move that boundary.',
      why: 'A test that could not have changed your mind, whatever its result, was a wasted test however interesting the reading.',
      note: 'Before each test, say out loud what each possible result would tell you. <b>If both answers leave you in the same place, do not run it.</b>',
    },
    {
      name: 'Ask what changed',
      body: 'A system that worked yesterday and does not work today has had something done to it.',
      why: 'The person who did it is often in the room and does not know it was relevant.',
      note: 'This is the single most efficient question in fault-finding and it is not technical. <b>"Somebody plugged something in to charge a laptop" is a complete diagnosis of a second-DHCP-server fault, delivered in one sentence.</b>',
    },
    {
      name: 'Work from the known good',
      body: 'Start at an end you are sure about and move toward the fault.',
      why: 'Starting in the middle of the thing you suspect is how an hour disappears.',
      note: 'The known good end is usually the one you can see: the link light, the console output, your own laptop. <b>Prove it, then move one step.</b>',
    },
    {
      name: 'Halve the system',
      body: 'If the signal is good here and bad there, test in the middle. Twelve devices take four tests, not twelve.',
      why: 'This is the same binary search RDM uses to discover fixtures, and it is what separates a systematic search from a hopeful one.',
      note: 'Halving turns a linear search into a logarithmic one. <b>On a run of thirty two devices that is five tests instead of thirty two, and the difference is a technical rehearsal.</b>',
    },
    {
      name: 'Climb the ladder',
      body: 'Layer 1 first, then 2, then 3, then 4. Link light, MAC, IP, port. Stop at the first thing that fails.',
      why: 'The application is where the problem appears, not where it is.',
      note: 'Read the switch port error counters early. <b>Rising CRC errors are a physical fault, and nothing you do above layer 1 will help it.</b>',
    },
    {
      name: 'Change one thing at a time',
      body: 'And put it back if it did not help.',
      why: 'Two simultaneous changes give a result you cannot attribute to either.',
      note: 'This is the step people abandon first under pressure, and it is the one that makes the difference. <b>A change you did not undo is now part of the system and nobody knows why.</b>',
    },
    {
      name: 'Prove the fix by breaking it again',
      body: 'Reintroduce the fault. If you cannot make it fail again, you did not find it: you disturbed it.',
      why: 'This is the step everybody skips and it is the difference between a fix and a coincidence.',
      note: 'It costs sixty seconds and it converts a hopeful "that seems better" into a fact. <b>On a fault that has recurred twice already, it is the only thing that will stop it recurring a third time.</b>',
    },
    {
      name: 'Write it down',
      body: 'What the symptom was, what it turned out to be, and how long it took.',
      why: 'Your own fault log is specific to how you actually search, which is what improves.',
      note: 'It is the most valuable revision material you will ever have. <b>Nobody else\'s notes will tell you which of your own habits costs you the most time.</b>',
    },
  ],
  footer: 'Steps 1 and 2 cost nothing and save the most. Step 7 is the one that stops a fault coming back.',
}));
