// Session 5: running a real show network. Multicast, VLANs, redundancy, clock
// and the security posture this industry has been getting away without.

import { register } from './anim-core.js';
import {
  figure, canvas, slider, toggle, choice, button, label, labelWrap, box, line,
  palette, alpha, fitter, compare, chain, plot, role, node, arrow, flowDots, eng, sig,
} from './anim-kit.js';

register('cast-types', (host) => {
  let kind = 'multi';
  let snoop = true;
  let receivers = 3;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'Unicast, broadcast, multicast, and what each costs a switch',
    sub: 'One console sending forty universes to twelve nodes. Three ways to do it, and only one is sensible.',
    note: '',
  });

  const upd = () => {
    setNote(kind === 'uni'
      ? 'Unicast to each receiver means one stream per receiver: 40 universes to 12 nodes is 480 streams, the console\'s port melts, and it must be told about every node in advance. <b>It also scales with the number of listeners, which is exactly the property you do not want.</b>'
      : kind === 'broad'
        ? 'Broadcast is one stream, and every device on the network receives all forty universes and discards them in software. Amplifiers, media servers, laptops: all of them doing real processor work on data they did not ask for. <b>This is what Art-Net does by default, and it is why Art-Net has a reputation for being hard on networks.</b>'
        : snoop
          ? 'Multicast with IGMP snooping working: one stream per universe, delivered only to the ports that joined that group. The console does not know or care how many listeners there are. <b>This is why sACN, Dante, AES67, ST 2110 and PTP are all multicast, and it is the single reason a modern show network scales.</b>'
          : '<b>Multicast on a switch with no IGMP snooping is flooded exactly like broadcast.</b> Every benefit disappears and you have all of broadcast\'s cost with none of its simplicity. This is the default on an unmanaged switch, and it is why "we use sACN so it is fine" is not a complete sentence.');
    cv.once();
  };

  controls.append(choice('Addressing', [['uni', 'Unicast'], ['broad', 'Broadcast'], ['multi', 'Multicast']], {
    value: 'multi', on: (v) => { kind = v; upd(); },
  }).node);
  controls.append(toggle('IGMP snooping on', { value: true, on: (v) => { snoop = v; upd(); } }).node);
  controls.append(slider('Devices that want it', { min: 1, max: 6, step: 1, value: 3, on: (v) => { receivers = v; upd(); } }).node);

  challenge('Turn multicast into broadcast without changing the protocol.', () => kind === 'multi' && !snoop);

  const cv = canvas(stage, {
    height: 292,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const N = 8;
      const bw = (w - pad * 2 - (N - 1) * 6) / N;
      const swY = 78;

      // Source.
      box(g, pad, 34, 120, 32, { fill: alpha(R.energy, 0.18), stroke: R.energy, r: 6 });
      label(g, 'console', pad + 60, 50, { color: R.energy, size: 11, align: 'center', weight: 700 });

      // Switch.
      box(g, pad, swY, w - pad * 2, 30, { fill: p.raised, stroke: p.line, r: 7 });
      label(g, 'switch', pad + 10, swY + 15, { color: p.muted, size: 10.5, weight: 600 });
      line(g, pad + 60, 66, pad + 60, swY, { color: R.energy, lw: 2 });
      flowDots(g, pad + 60, 66, pad + 60, swY, { color: R.energy, t, speed: 1.6, count: 2, r: 2.4 });

      // Ports and devices. The first `receivers` want the data.
      let streams = 0;
      let wasted = 0;
      for (let i = 0; i < N; i++) {
        const x = pad + i * (bw + 6);
        const wants = i < receivers;
        let gets;
        if (kind === 'uni') gets = wants;
        else if (kind === 'broad') gets = true;
        else gets = snoop ? wants : true;
        if (gets) streams++;
        if (gets && !wants) wasted++;

        const tone = gets && wants ? R.safe : gets ? R.fault : p.muted;
        if (gets) {
          line(g, x + bw / 2, swY + 30, x + bw / 2, 148, { color: alpha(tone, 0.7), lw: 2 });
          flowDots(g, x + bw / 2, swY + 30, x + bw / 2, 148, { color: tone, t, speed: 1.3, count: 2, r: 2.2 });
        }
        box(g, x, 148, bw, 44, {
          fill: alpha(tone, gets ? 0.14 : 0.04), stroke: alpha(tone, gets ? 0.8 : 0.3), r: 6,
        });
        label(g, wants ? 'node' : ['amp', 'server', 'laptop', 'AP', 'PC'][i % 5], x + bw / 2, 164, {
          color: gets ? p.ink : p.muted, size: 9.5, align: 'center', max: bw - 4,
        });
        label(g, gets && wants ? 'wanted' : gets ? 'unwanted' : 'quiet', x + bw / 2, 180, {
          color: tone, size: 9, align: 'center', weight: 600, max: bw - 4,
        });
      }

      // The count.
      const streamsFromSource = kind === 'uni' ? receivers : 1;
      const rows = [
        ['Streams leaving the console', String(streamsFromSource), streamsFromSource > 1 ? R.fault : R.safe],
        ['Ports the switch delivers to', String(streams), wasted ? R.fault : R.safe],
        ['Devices doing unwanted work', String(wasted), wasted ? R.fault : R.safe],
      ];
      let y = 212;
      const keyW = Math.min(230, w * 0.52);
      for (const [k, v, col] of rows) {
        label(g, k, pad, y, { color: p.muted, size: 10.5, max: keyW - 8 });
        label(g, v, pad + keyW, y, { color: col, size: 12, weight: 700, mono: true });
        y += 20;
      }
      label(g, kind === 'multi' && !snoop ? 'Multicast without snooping IS broadcast.' : '',
        pad + keyW + 60, 232, { color: R.fault, size: 11.5, weight: 700, max: w - pad - keyW - 70 });
    },
  });
  upd();
});

register('igmp-snoop', (host) => {
  let minutes = 0;
  let querier = false;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'The five-minute fault',
    sub: 'Snooping is on. Run the clock forward with and without a querier, and watch the rig degrade at exactly the moment nobody is testing it.',
    note: '',
  });

  const TIMEOUT = 5; // minutes, roughly the 260 to 300 s membership timeout

  const expired = () => !querier && minutes >= TIMEOUT;

  const upd = () => {
    setNote(querier
      ? `A querier asks "who still wants what?" about every 60 seconds, so memberships are refreshed and never expire. At ${minutes} minutes the table is intact and multicast is still going only where it was asked for. <b>Exactly one querier per VLAN, normally the core switch. Two of them elect the lowest IP address, which works and is worth knowing about.</b>`
      : expired()
        ? `<b>At ${minutes} minutes the memberships have aged out</b> and the switch has reverted to flooding every group to every port. Nothing was changed, nothing reports an error, and the rig was proved perfect at 14:00. <b>A significant fraction of "the network went strange during the show" stories are exactly this.</b>`
        : `${minutes} minutes in and the table is still populated. Memberships expire after about 260 to 300 seconds, so this looks completely healthy right up until it does not. <b>The test that catches it costs ten minutes: prove the rig, leave it untouched, and prove it again.</b>`);
    cv.once();
  };

  controls.append(toggle('IGMP querier present', { value: false, on: (v) => { querier = v; upd(); } }).node);
  controls.append(slider('Minutes since the last join', {
    min: 0, max: 12, step: 1, value: 0, fmt: (v) => `${v} min`, on: (v) => { minutes = v; upd(); },
  }).node);

  challenge('Reproduce the fault: leave it long enough with no querier.', () => expired());

  const cv = canvas(stage, {
    height: 300,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const gone = expired();

      // Timeline.
      const tx = pad, tw = w - pad * 2, ty = 40;
      box(g, tx, ty, tw, 22, { fill: alpha(p.line, 0.3), stroke: p.line, r: 5 });
      const mark = tx + (minutes / 12) * tw;
      const expiry = tx + (TIMEOUT / 12) * tw;
      if (!querier) {
        box(g, expiry, ty, tw - (expiry - tx), 22, { fill: alpha(R.fault, 0.18), stroke: 'transparent', r: 0 });
        line(g, expiry, ty - 6, expiry, ty + 28, { color: R.fault, lw: 1.5, dash: [4, 3] });
        label(g, 'memberships expire', expiry + 4, ty - 12, { color: R.fault, size: 9.5, max: tw - (expiry - tx) });
      } else {
        // Queries at intervals.
        for (let m = 0; m <= 12; m++) {
          const qx = tx + (m / 12) * tw;
          line(g, qx, ty + 4, qx, ty + 18, { color: alpha(R.safe, 0.7), lw: 1.5 });
        }
        label(g, 'a query about every 60 seconds, refreshing every membership', tx, ty - 12,
          { color: R.safe, size: 9.5, max: tw });
      }
      line(g, mark, ty - 4, mark, ty + 26, { color: p.ink, lw: 2 });
      // A centre-aligned label at the very left of the canvas has no room on
      // that side, and label() would clip it to an ellipsis. Keep the anchor
      // far enough in that the whole caption fits.
      label(g, `${minutes} min`, Math.min(tx + tw - 26, Math.max(mark, tx + 26)), ty + 38,
        { color: p.ink, size: 10, align: 'center', max: 70 });

      // The switch's group table.
      const gy = 92;
      label(g, 'switch multicast group table', pad, gy, { color: p.muted, size: 10, weight: 600 });
      const groups = [['239.255.0.1', 'port 3'], ['239.255.0.2', 'port 3, 7'], ['239.255.1.44', 'port 11']];
      groups.forEach(([grp, ports], i) => {
        const y = gy + 14 + i * 24;
        box(g, pad, y, Math.min(330, w - pad * 2), 20, {
          fill: alpha(gone ? R.fault : R.safe, 0.1), stroke: alpha(gone ? R.fault : R.safe, 0.55), r: 4,
        });
        label(g, gone ? `${grp}   — expired —` : `${grp}   ${ports}`, pad + 8, y + 11, {
          color: gone ? R.fault : p.ink2, size: 10.5, mono: true, max: 310,
        });
      });

      // Ports, and where the traffic goes.
      const py = gy + 100;
      const N = 10;
      const bw = (w - pad * 2 - (N - 1) * 5) / N;
      label(g, gone ? 'traffic now goes everywhere' : 'traffic goes only where it was asked for',
        pad, py - 10, { color: gone ? R.fault : R.safe, size: 11, weight: 600, max: w - pad * 2 });
      for (let i = 0; i < N; i++) {
        const x = pad + i * (bw + 5);
        const wanted = [3, 7, 11].map((n) => n % N).includes(i);
        const gets = gone || wanted;
        const tone = gets && wanted ? R.safe : gets ? R.fault : p.muted;
        box(g, x, py, bw, 34, {
          fill: alpha(tone, gets ? 0.2 : 0.04), stroke: alpha(tone, gets ? 0.8 : 0.3), r: 5,
        });
        label(g, String(i + 1), x + bw / 2, py + 17, {
          color: gets ? tone : p.muted, size: 10, align: 'center', weight: 600,
        });
        if (gets) flowDots(g, x + bw / 2, py + 34, x + bw / 2, py + 56, { color: tone, t, speed: 1.4, count: 2, r: 2 });
      }

      label(g, gone
        ? 'Nothing was changed. Nothing reported an error. It was proved perfect six hours ago.'
        : querier ? 'The querier is the other half of the configuration, and it is the half people forget.'
          : 'Healthy, for now. Leave it alone for another few minutes.',
      pad, py + 74, {
        color: gone ? R.fault : querier ? R.safe : p.muted, size: 11.5, weight: 600, max: w - pad * 2,
      });
    },
  });
  upd();
});

register('vlan-tag', (host) => {
  let portType = 'access';
  let deviceUnderstands = false;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'What an 802.1Q tag is, and the fault that eats an afternoon',
    sub: 'Four bytes inserted into the frame. Plug a normal device into a trunk port and watch what happens.',
    note: '',
  });

  const broken = () => portType === 'trunk' && !deviceUnderstands;

  const upd = () => {
    setNote(portType === 'access'
      ? 'An access port belongs to one VLAN. The device plugged into it knows nothing about VLANs: frames arrive untagged and the switch adds and removes the tag on its behalf. <b>This is what a fixture, a node or a console plugs into, and it is the normal case.</b>'
      : deviceUnderstands
        ? 'A trunk port carries several VLANs with the tag present, between switches, or to a device that understands tagging such as a hypervisor or a multi-VLAN server. <b>Every switch-to-switch link on a real show network is a trunk.</b>'
        : '<b>The device receives tagged frames it does not understand and appears completely dead, while every light on the switch says the link is fine.</b> This is the fault that eats an afternoon, and the fix is one line of switch configuration. Always check which VLAN a port is in before you check anything else.');
    cv.once();
  };

  controls.append(choice('Port type', [['access', 'Access port'], ['trunk', 'Trunk port']], {
    value: 'access', on: (v) => { portType = v; upd(); },
  }).node);
  controls.append(toggle('Device understands tags', { value: false, on: (v) => { deviceUnderstands = v; upd(); } }).node);

  challenge('Reproduce the fault where the link light is on and the device is dead.', () => broken());

  const cv = canvas(stage, {
    height: 292, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const tagged = portType === 'trunk';

      // The frame, with and without the tag.
      const parts = tagged
        ? [['dst MAC', 6, 'signal'], ['src MAC', 6, 'signal'], ['802.1Q tag', 4, 'energy'], ['type', 2, 'signal'], ['payload', 20, 'safe'], ['CRC', 4, 'signal']]
        : [['dst MAC', 6, 'signal'], ['src MAC', 6, 'signal'], ['type', 2, 'signal'], ['payload', 20, 'safe'], ['CRC', 4, 'signal']];
      const total = parts.reduce((a, x) => a + x[1], 0);
      let x = pad;
      const fw = w - pad * 2;
      const fy = 46;
      parts.forEach(([nm, sz, col]) => {
        const pw = (sz / total) * fw;
        const isTag = nm.startsWith('802');
        box(g, x, fy, pw - 2, 40, {
          fill: alpha(R[col], isTag ? 0.32 : 0.14), stroke: isTag ? R.energy : alpha(R[col], 0.6), r: 5, lw: isTag ? 2 : 1,
        });
        label(g, nm, x + pw / 2, fy + 15, { color: p.ink, size: 9.5, align: 'center', weight: 600, max: pw - 4 });
        label(g, `${sz} B`, x + pw / 2, fy + 30, { color: p.muted, size: 9, align: 'center', mono: true, max: pw - 4 });
        x += pw;
      });
      label(g, tagged ? 'on a trunk: the tag is present' : 'on an access port: no tag on the wire',
        pad, fy - 12, { color: tagged ? R.energy : p.muted, size: 10.5, max: fw });

      // What is inside the tag.
      if (tagged) {
        const ty = fy + 56;
        box(g, pad, ty, fw, 46, { fill: alpha(R.energy, 0.08), stroke: alpha(R.energy, 0.5), r: 7 });
        const fields = [['TPID 0x8100', 16], ['priority (PCP)', 3], ['DEI', 1], ['VLAN ID', 12]];
        const bits = 32;
        let fx = pad + 6;
        fields.forEach(([nm, b]) => {
          const bwid = ((b / bits) * (fw - 12));
          box(g, fx, ty + 8, bwid - 3, 30, { fill: p.surface, stroke: p.line, r: 4 });
          label(g, nm, fx + bwid / 2, ty + 18, { color: p.ink2, size: 9, align: 'center', max: bwid - 6 });
          label(g, `${b} bits`, fx + bwid / 2, ty + 30, { color: p.muted, size: 8.5, align: 'center', mono: true, max: bwid - 6 });
          fx += bwid;
        });
        label(g, '12 bits of VLAN ID gives 1 to 4094; the 3 priority bits are what QoS uses at layer 2',
          pad, ty + 60, { color: p.muted, size: 10.5, max: fw });
      }

      // The device's verdict.
      const vy = tagged ? fy + 176 : fy + 76;
      box(g, pad, vy, fw, 40, {
        fill: alpha(broken() ? R.fault : R.safe, 0.12), stroke: alpha(broken() ? R.fault : R.safe, 0.6), r: 8,
      });
      label(g, broken()
        ? 'Device: link light on, receiving frames it cannot parse, completely dead'
        : tagged ? 'Device: understands the tag, and can be in several VLANs at once'
          : 'Device: receives an ordinary untagged frame and works normally',
      w / 2, vy + 20, {
        color: broken() ? R.fault : R.safe, size: 11.5, align: 'center', weight: 700, max: fw - 16,
      });
    },
  });
  upd();
});

register('qos-queue', (host) => {
  let qos = true;
  let load = 60;

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'QoS, and the two things that stop it working',
    sub: 'Load the link up. QoS does nothing at all until there is contention, and then it decides everything.',
    note: '',
  });

  const upd = () => {
    setNote(load < 70
      ? 'At this load nothing contends for the port, so QoS changes nothing whatever it is set to. <b>This is exactly why QoS is easy to configure wrongly and never find out until the busiest moment of the run.</b>'
      : qos
        ? 'Contention, and the clock and audio marked EF go first. A file copy waits, which is the correct outcome and is invisible to everybody. <b>QoS earns its keep on the night somebody starts a 400 GB transfer during a show.</b>'
        : '<b>Contention with no priority: whichever frame arrived first goes first.</b> The clock queues behind a file copy, the audio buffer runs out, and an amplifier mutes. The file copy finishes slightly sooner, which is nobody\'s objective.');
    cv.once();
  };

  controls.append(toggle('QoS configured and trusted', { value: true, on: (v) => { qos = v; upd(); } }).node);
  controls.append(slider('Link load', { min: 10, max: 110, step: 5, value: 60, fmt: (v) => `${v}%`, on: (v) => { load = v; upd(); } }).node);

  challenge('Find the load at which QoS starts to matter, then turn it off.', () => load >= 70 && !qos);

  const cv = canvas(stage, {
    height: 324,
    draw(g, w, hh, t) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const contending = load >= 70;

      const CLASSES = [
        { n: 'PTP clock', dscp: 46, col: R.safe, size: 1 },
        { n: 'Audio media', dscp: 46, col: R.safe, size: 3 },
        { n: 'Video media', dscp: 34, col: R.signal, size: 5 },
        { n: 'sACN lighting', dscp: 26, col: R.energy, size: 2 },
        { n: 'File copy', dscp: 0, col: p.muted, size: 9 },
      ];

      label(g, `Link at ${load}%${contending ? ' — frames are contending for the port' : ' — no contention'}`,
        pad, 22, { color: contending ? R.energy : p.muted, size: 11.5, weight: 600, max: w - pad * 2 });

      // Queues.
      const qy = 42;
      const rowH = 30;
      const keyW = Math.min(150, w * 0.34);
      CLASSES.forEach((c, i) => {
        const y = qy + i * rowH;
        label(g, c.n, pad, y + 14, { color: p.ink2, size: 10.5, weight: 600, max: keyW - 30 });
        label(g, `DSCP ${qos ? c.dscp : 0}`, pad + keyW - 26, y + 14, {
          color: qos && c.dscp ? c.col : p.muted, size: 9.5, align: 'right', mono: true,
        });
        const qx = pad + keyW;
        const qw = w - pad - qx;
        box(g, qx, y + 2, qw, 24, { fill: alpha(p.line, 0.25), stroke: p.line, r: 4 });
        // Frames waiting.
        const waiting = contending ? c.size : Math.max(1, Math.round(c.size / 3));
        for (let k = 0; k < waiting; k++) {
          const fx = qx + 3 + k * 13;
          if (fx > qx + qw - 12) break;
          box(g, fx, y + 5, 10, 18, { fill: alpha(c.col, 0.55), stroke: 'transparent', r: 2 });
        }
      });

      // The output port, serving in order.
      const oy = qy + CLASSES.length * rowH + 14;
      label(g, 'output port, one frame at a time', pad, oy, { color: p.muted, size: 10, weight: 600 });
      const order = qos
        ? [0, 1, 0, 1, 2, 3, 2, 4, 4, 4]
        : [4, 2, 4, 0, 4, 1, 2, 4, 3, 4];
      const ow = (w - pad * 2) / order.length;
      order.forEach((ci, i) => {
        const c = CLASSES[ci];
        const x = pad + i * ow;
        const phase = ((t * 3) % order.length);
        const active = Math.floor(phase) === i;
        box(g, x + 1, oy + 10, ow - 3, 24, {
          fill: alpha(c.col, active ? 0.7 : 0.3), stroke: active ? c.col : 'transparent', r: 3,
        });
      });

      // Verdict.
      const vy = oy + 46;
      const clockPos = order.indexOf(0);
      label(g, contending
        ? (qos
          ? `Clock and audio served first. The file copy waits ${order.length - 2} slots and finishes a moment later, which nobody notices.`
          : `The clock waits ${clockPos} slots behind a file copy. The audio buffer runs out and an amplifier mutes.`)
        : 'Everything is served immediately. QoS is doing nothing, correctly, because there is nothing to decide.',
      pad, vy, { color: contending ? (qos ? R.safe : R.fault) : p.muted, size: 11.5, weight: 600, max: w - pad * 2 });

      labelWrap(g, qos
        ? 'The other way QoS fails: a switch that does not trust DSCP on ingress rewrites every mark to zero, and your careful marking is gone before it has done anything. It is a per-port setting.'
        : 'Over-provisioning beats QoS: a network at 10 per cent never contends. Configure QoS anyway, because the night somebody starts a 400 GB copy is the night it earns its keep.',
      pad, vy + 22, { color: p.muted, size: 10.5, max: w - pad * 2, maxLines: 3 });
    },
  });
  upd();
});

register('stp-converge', (host) => compare(host, {
  title: 'Three kinds of redundancy, and which discipline each is for',
  sub: 'A loop is catastrophic and a second cable is right. The implementation is what matters.',
  accent: 'signal',
  fields: [
    { key: 'how', label: 'How it works' },
    { key: 'time', label: 'Recovery time' },
    { key: 'ok', label: 'Acceptable for' },
    { key: 'not', label: 'Not acceptable for', tone: 'fault' },
  ],
  items: [
    {
      name: 'RSTP / MSTP', short: 'Spanning tree', tone: 'energy',
      line: 'Switches elect a root and block ports that would create a loop. A blocked port unblocks when an active link fails.',
      how: 'Detect the failure, recompute the topology, unblock a port',
      time: '1 to 6 seconds. Legacy STP was 30 to 50, and should never be deployed',
      ok: 'Lighting, control, management. Anything that tolerates a few seconds',
      not: 'Audio and video media, where a few seconds is a very long silence',
      note: 'A loop with no spanning tree is catastrophic: broadcast frames have no hop count, so one circulates forever, multiplying at each switch, and the network is saturated in a second or two. <b>That is a broadcast storm and it is the fastest way to take a venue down.</b>',
    },
    {
      name: 'Two separate networks', short: 'Dual network', tone: 'safe',
      line: 'Identical streams on two physically separate networks, and the receiver takes whichever arrives.',
      how: 'Nothing reconverges, because both paths were already live',
      time: 'Zero. There is no changeover',
      ok: '<b>Audio and video media.</b> Dante redundancy, ST 2110-7, SMPTE 2022-7',
      not: 'Nothing, except that it costs a second switch and a second cable run',
      note: 'This is the only genuinely seamless redundancy in the building. <b>It is also the one people skip on budget, and then discover that RSTP\'s two seconds is two seconds of silence in front of an audience.</b>',
    },
    {
      name: 'LACP', short: 'LACP', tone: 'signal',
      line: 'Two or more links between the same pair of devices, bonded into one logical link.',
      how: 'Traffic is distributed across the members; a failed member is removed from the bundle',
      time: 'Sub-second, and no topology change',
      ok: 'Uplinks that need both capacity and resilience against a cable or port failure',
      not: 'Protection against a switch failing, because both ends of the bundle are the same two devices',
      note: 'LACP is routinely confused with the other two. <b>It protects a cable and a port. It does not protect a switch, and it is not a substitute for either mechanism above.</b>',
    },
  ],
  footer: 'MSTP for control and lighting, two separate networks for audio and video media, LACP on the uplinks that need capacity. Not one mechanism everywhere.',
}));

register('routing-hop', (host) => chain(host, {
  title: 'When to route between VLANs, and when not to',
  sub: 'VLANs cannot see each other. Sometimes they need to, and the multicast answer is different from the unicast one.',
  tag: 'Step',
  accent: 'signal',
  stages: [
    {
      name: 'Two VLANs, no path',
      body: 'VLAN 40 control and VLAN 30 video cannot reach each other at all, by construction.',
      why: 'That is the point of a VLAN: separate broadcast domains that share physical switches.',
      note: 'This separation is what keeps a video server\'s discovery traffic out of the control VLAN. <b>It is also what stops the show control machine from reaching the media server, which is a problem you are about to have to solve.</b>',
    },
    {
      name: 'A gateway per VLAN',
      body: 'A layer 3 switch or a router gets an address in each VLAN, conventionally .1, and forwards between them.',
      why: 'Each device sends anything not on its own network to its gateway, which is what the Session 4 comparison decided.',
      note: 'Naming the gateway .1 in every VLAN is elegance in the Session 2 sense: <b>the obvious guess about the address is right, which is what people need under pressure.</b>',
    },
    {
      name: 'An access list at the boundary',
      body: '"VLAN 60 wireless may reach the media server on port 80 and nothing else." One line of configuration rather than a hope.',
      why: 'A router is the natural place to filter, and it is the only place where the filtering can actually happen.',
      note: 'This is what makes segmentation into security rather than just tidiness. <b>A VLAN is not a firewall; the access list at the routed boundary is.</b>',
    },
    {
      name: 'Where it stops: multicast',
      body: 'Routers do not forward multicast by default. Getting it across needs PIM, and PIM on a show network is a specialist configuration.',
      why: 'sACN, Dante, AES67, ST 2110 and PTP are all multicast, so this is not an edge case.',
      note: '<b>Keep each multicast stream inside one VLAN.</b> Lighting multicast on the lighting VLAN, audio on audio, video on video. Route the unicast control traffic between them if you must.',
    },
    {
      name: 'And PTP especially',
      body: 'PTP\'s accuracy depends on symmetric path delay, and a router adds asymmetric delay it cannot account for.',
      why: 'A clock that has been routed is a clock with an error nobody can measure.',
      note: 'Keep PTP inside one VLAN, with one grandmaster and one backup. <b>Crossing a router is one of the three commonest PTP faults, alongside two grandmasters and two profiles.</b>',
    },
  ],
  footer: 'Route the unicast control traffic. Keep the multicast where it belongs. That one rule removes a great deal of unnecessary difficulty.',
}));

register('ptp-exchange', (host) => {
  let step = 0;
  let asym = 0;

  const MSGS = [
    { n: 'Sync', from: 'gm', why: 'The grandmaster sends the time it thinks it is. Hardware notes the exact moment it left.' },
    { n: 'Follow_Up', from: 'gm', why: 'It sends that exact departure time, measured in hardware rather than in software.' },
    { n: 'Delay_Req', from: 'sl', why: 'The slave sends a request and notes when it left.' },
    { n: 'Delay_Resp', from: 'gm', why: 'The grandmaster replies with when that request arrived.' },
  ];

  const { controls, stage, setNote, challenge } = figure(host, {
    title: 'PTP in four messages',
    sub: 'Step through the exchange, then make the path asymmetric and watch the error appear with nothing reporting it.',
    note: '',
  });

  const upd = () => {
    setNote(step < 3
      ? `${MSGS[step].why} <b>From four timestamps the slave can calculate both the offset and the one-way delay, and correct itself. Do that a few times a second and every device in the building agrees on the time to within a microsecond.</b>`
      : asym > 0
        ? `The path is asymmetric by ${asym} µs, and the calculation assumes it is symmetric. The slave computes an offset that is wrong by half of that, ${sig(asym / 2)} µs, and <b>nothing anywhere reports an error</b>. This is why a router in the PTP path is a fault, and why "PTP aware" on a switch datasheet is selling you boundary or transparent clocks that correct for their own queueing.`
        : 'Four timestamps, one calculation, and every device in the building agrees. <b>The three ways it goes wrong are two grandmasters flapping, a router in the path adding asymmetric delay, and two devices on different profiles insisting they are both correct.</b>');
    cv.once();
  };

  const prev = button('← Back', () => { step = Math.max(0, step - 1); upd(); });
  const next = button('Next →', () => { step = Math.min(3, step + 1); upd(); });
  controls.append(prev.node, next.node);
  controls.append(slider('Path asymmetry', {
    min: 0, max: 200, step: 10, value: 0, fmt: (v) => `${v} µs`, on: (v) => { asym = v; upd(); },
  }).node);

  challenge('Make the path asymmetric and read the error it creates.', () => asym > 0 && step >= 3);

  const cv = canvas(stage, {
    height: 350, animated: false,
    draw(g, w) {
      const p = palette();
      const R = role(p);
      const pad = 16;
      const lx = pad + 60, rx = w - pad - 60;
      const top = 52, bot = 190;

      label(g, 'Grandmaster', lx, top - 20, { color: R.energy, size: 11, align: 'center', weight: 700 });
      label(g, 'Slave', rx, top - 20, { color: R.signal, size: 11, align: 'center', weight: 700 });
      line(g, lx, top, lx, bot, { color: alpha(R.energy, 0.5), lw: 2 });
      line(g, rx, top, rx, bot, { color: alpha(R.signal, 0.5), lw: 2 });

      const ys = [top + 20, top + 52, top + 86, top + 118];
      MSGS.forEach((m, i) => {
        const shown = i <= step;
        if (!shown) return;
        const y = ys[i];
        const fromLeft = m.from === 'gm';
        const x1 = fromLeft ? lx : rx;
        const x2 = fromLeft ? rx : lx;
        // Asymmetry: the slave-to-master direction is slower.
        const slant = fromLeft ? 14 : 14 + asym * 0.06;
        const col = i === step ? R.safe : alpha(p.ink2, 0.55);
        arrow(g, x1, y, x2, y + slant, { color: col, lw: i === step ? 2.5 : 1.5, head: 7 });
        label(g, m.n, (x1 + x2) / 2, y + slant / 2 - 10, {
          color: col, size: 10.5, align: 'center', weight: i === step ? 700 : 500, max: rx - lx - 20,
        });
      });

      // Timestamps.
      const ts = [
        ['t1', 'Sync left the master', step >= 0],
        ['t2', 'Sync arrived at the slave', step >= 0],
        ['t3', 'Delay_Req left the slave', step >= 2],
        ['t4', 'Delay_Req arrived at the master', step >= 3],
      ];
      let y = bot + 14;
      const keyW = 30;
      ts.forEach(([k, v, on]) => {
        label(g, k, pad, y, { color: on ? R.safe : p.muted, size: 11, weight: 700, mono: true });
        label(g, v, pad + keyW, y, { color: on ? p.ink2 : p.muted, size: 10.5, max: w - pad * 2 - keyW });
        y += 17;
      });

      if (step >= 3) {
        const err = asym / 2;
        box(g, pad, y + 4, w - pad * 2, 30, {
          fill: alpha(asym ? R.fault : R.safe, 0.12), stroke: alpha(asym ? R.fault : R.safe, 0.6), r: 6,
        });
        label(g, asym
          ? `offset is wrong by ${sig(err)} µs, and nothing reports it`
          : 'offset and one-way delay both solved, to under a microsecond',
        w / 2, y + 19, {
          color: asym ? R.fault : R.safe, size: 11.5, align: 'center', weight: 700, max: w - pad * 2 - 16,
        });
      }
    },
  });
  upd();
});

register('clock-drift', (host) => plot(host, {
  title: 'What an undisciplined clock does over a show',
  sub: 'A disciplined clock is corrected continuously and does not accumulate. A free-running one does, invisibly, until it has.',
  xLabel: 'minutes into the show',
  yLabel: 'error (ms)',
  xMin: 0, xMax: 180, yMin: 0, yMax: 400,
  controls: (state, redraw, setNote) => {
    state.ppm = 30;
    const s = slider('Free-running clock accuracy', {
      min: 5, max: 100, step: 5, value: 30, fmt: (v) => `${v} ppm`,
      on: (v) => {
        state.ppm = v;
        setNote(`A ${v} ppm crystal accumulates ${sig(v * 0.06)} ms every minute, so after a three hour show it is ${sig(v * 0.06 * 180)} ms out. At 25 fps that is ${sig((v * 0.06 * 180) / 40)} frames. <b>PTP is the flat line: it is corrected several times a second, so its error never accumulates however long the show runs.</b>`);
        redraw();
      },
    });
    return [s.node];
  },
  curves: (state) => [
    { f: (x) => x * 60 * ((state.ppm || 30) / 1e6) * 1000, tone: 'fault', label: 'free-running crystal' },
    { f: () => 0.0001, tone: 'safe', label: 'disciplined by PTP', lw: 2.5 },
    { f: () => 40, tone: 'energy', dash: [5, 4], label: 'one frame at 25 fps' },
  ],
  cursor: (state) => ({
    x: 180,
    y: 180 * 60 * ((state.ppm || 30) / 1e6) * 1000,
    text: `${sig(180 * 60 * ((state.ppm || 30) / 1e6) * 1000)} ms at the end`,
  }),
  footer: 'This is the drop-frame problem in Session 8 arriving from a different direction: two sources both reporting healthy, separating steadily, invisible until it has added up.',
}));

register('attack-surface', (host) => compare(host, {
  title: 'What somebody on your show network can do',
  sub: 'Not a hypothetical. Almost none of the protocols in this course authenticate anything at all.',
  accent: 'fault',
  fields: [
    { key: 'can', label: 'What they can do' },
    { key: 'cred', label: 'Credential needed' },
    { key: 'why', label: 'Why it is like this' },
    { key: 'fix', label: 'The only defence' },
  ],
  items: [
    {
      name: 'Take over the lighting rig', short: 'Lighting', tone: 'fault',
      line: 'Send sACN at priority 200 to the universes you care about.',
      can: 'Blackout, full white, anything, from a laptop',
      cred: '<b>None. The protocol has no concept of one</b>',
      why: 'sACN was designed for a closed world of dedicated cables in which everything on the network was trusted',
      fix: 'Nobody untrusted can reach the lighting VLAN',
      note: 'There is no password, no signature, and no mechanism by which a fixture could tell your console from an attacker\'s laptop. <b>That is not a defect: it is a design from an era where the cable was the perimeter.</b>',
    },
    {
      name: 'Fire cues', short: 'Cues', tone: 'fault',
      line: 'Send OSC or MSC to a playback machine.',
      can: 'Start, stop, jump, or run the wrong cue at the wrong moment',
      cred: 'None',
      why: 'OSC has no authentication in the protocol, and MSC predates the idea',
      fix: 'The control VLAN is reachable only from the show control machines',
      note: 'A modern console will often accept OSC on a documented port with no credential at all. <b>Turn off remote control on anything that does not need it, which is a five minute audit nobody does.</b>',
    },
    {
      name: 'Mute or reroute the PA', short: 'Audio', tone: 'fault',
      line: 'Use the manufacturer\'s control protocol on the audio VLAN.',
      can: 'Mute, change gain, repatch, reconfigure',
      cred: 'Often none; sometimes a default password',
      why: 'Audio control protocols assume a dedicated, physically secure network',
      fix: 'Audio on its own VLAN, and default credentials changed on everything',
      note: 'Dante Domain Manager and equivalents exist precisely because the underlying control had no security model. <b>If it is available, use it, and if not, the VLAN boundary is your entire defence.</b>',
    },
    {
      name: 'Rewrite fixture addresses', short: 'RDM', tone: 'fault',
      line: 'Send RDM or RDMnet SET commands.',
      can: 'Change every address and personality in the rig',
      cred: 'None',
      why: 'RDM was designed to remove a ladder from the fit-up, not to resist an attacker',
      fix: 'Physical and logical access control, and RDM disabled during a show',
      note: 'Discovering during a rig check and disabling during the show is good practice for a bandwidth reason anyway. <b>It happens to close this as well.</b>',
    },
    {
      name: 'The threat that is actually likely', short: 'Likely', tone: 'energy',
      line: 'Not a targeted attacker. Four ordinary things.',
      can: 'A contractor\'s laptop with something unpleasant on it; a second DHCP server on a travel router; ransomware reaching a media server through a link to the office made during install; a visiting rig on the same address range',
      cred: '—',
      why: 'All four are accidents, and all four have taken shows down',
      fix: '<b>Segmentation and an inventory.</b> Both prevent all four',
      note: 'You cannot defend a network you cannot list. <b>An address plan, a port map and a one-page diagram are security documents as much as they are engineering ones.</b>',
    },
  ],
  footer: 'Network access control is the entire security model, so make it a real one.',
}));

register('network-plan', (host) => compare(host, {
  title: 'The five documents, and the three singular roles',
  sub: 'None of these takes long. All of them are what somebody else needs at 22:00 when you are not there.',
  accent: 'safe',
  fields: [
    { key: 'what', label: 'What it is' },
    { key: 'time', label: 'Time to make' },
    { key: 'when', label: 'When it saves you', tone: 'fault' },
  ],
  items: [
    {
      name: 'One-page diagram', short: 'Diagram', tone: 'safe',
      line: 'Switches, uplinks, VLANs, and what is where. On one page, printed, on the machine room wall.',
      what: 'The overview. If it needs three pages it needs to be three drawings at different levels',
      time: 'An hour, once, then minutes to update',
      when: 'The moment somebody who did not build it has to find something',
      note: '<b>Every line says what protocol it is</b>, and its medium if that is not obvious: sACN over fibre, MSC over RTP-MIDI, contact closure, Dante primary, Dante secondary. That is the highest-value thing on the page and the thing most drawings omit.',
    },
    {
      name: 'Address plan', short: 'Addresses', tone: 'safe',
      line: 'Every static address, every reservation, every subnet, every gateway.',
      what: 'A spreadsheet is fine. The important property is that it is where somebody else will look',
      time: 'It writes itself as you build, if you start it on day one',
      when: 'Every time a device is replaced, and every time two things collide',
      note: 'A plan that lives only in the heads of the people who built it is a system nobody else can work on. <b>That is principle three failing, and it fails at the worst possible moment.</b>',
    },
    {
      name: 'Port map', short: 'Port map', tone: 'signal',
      line: 'Which switch port goes where, and which VLAN it is in.',
      what: 'Labels on the patch panel matching labels on the diagram matching names in the software',
      time: 'An hour during the fit-up',
      when: 'The first time a device is dead with a link light, which is a VLAN fault about half the time',
      note: 'This is the document that turns "which VLAN is this port in?" from an investigation into a lookup. <b>It is also what stops an unused port quietly becoming a live one on the lighting network.</b>',
    },
    {
      name: 'The three singular roles', short: 'The three', tone: 'energy',
      line: 'DHCP server. IGMP querier. PTP grandmaster.',
      what: 'Each of these must be exactly one device, and the drawing must name it',
      time: 'Three lines',
      when: 'These are the three things nobody can find at 22:00, and each has a characteristic failure',
      note: 'Two DHCP servers: some devices work and some do not, changing every power cycle. No querier: the rig degrades after five minutes. Two grandmasters: unexplained audio glitches. <b>Three lines on a drawing prevent all three.</b>',
    },
    {
      name: 'The failure table', short: 'Failures', tone: 'fault',
      line: 'Every critical path, what happens if it fails, the fallback, and who acts.',
      what: 'Four columns. Console to lighting; show control to playback; grandmaster; timecode',
      time: 'An hour',
      when: 'In the production meeting, before anything has gone wrong',
      note: 'This is the Five Questions applied to a system rather than to a protocol. <b>It is the document a production manager will actually read, and very few people ever write one.</b>',
    },
  ],
  footer: 'A show network that only its builder understands has failed principle three, and it will be handed to somebody else eventually.',
}));
