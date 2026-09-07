// Static site generator for Show Networking and Control Systems.
//
// Reads the authored markdown one directory up (single source of truth, no
// duplication), renders it, and emits a fully static site into ./public.
// Zero dependencies on purpose: Vercel runs `node build.mjs` with no install
// step, so there is nothing to go stale and nothing to break in CI.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { render, esc } from './lib/markdown.mjs';
import { selfTest, readiness, faultScenarios, decodeChecks, questionCards, questionMeta } from './data/interactive.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
// A deploy tree that carries its own copy under ./content wins, so the site can
// also be deployed standalone without the rest of the repo.
const LOCAL = path.join(HERE, 'content');
const SRC = fs.existsSync(LOCAL) ? LOCAL : path.resolve(HERE, '..');
const OUT = path.join(HERE, 'public');

const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

// ---------------------------------------------------------------------------
// Course shape
// ---------------------------------------------------------------------------
//
// Eight sessions of three hours: 24 hours. Session 1 has already been taught,
// and it is published anyway, because the seven that follow all assume it and a
// student who missed it needs somewhere to go.
//
// `covers` is the syllabus contract. The module is specified against the
// chapters of Huntington's Show Networks and Control Systems, and the build
// refuses to ship unless every chapter from 1 to 27 is claimed by exactly one
// session. The ORDER inside a session is ours, not the book's: the book is
// more than a decade old, and where the industry has moved on the session says
// so rather than teaching a museum piece.
//
// `lab` is the share of the three hours that is hands on kit, and it is stated
// on the page because it changes what you bring.

const UNITS = [
  { n: 1, title: 'Foundations', classes: [1, 2] },
  { n: 2, title: 'Data communication and networking', classes: [3, 4, 5] },
  { n: 3, title: 'Standards and protocols', classes: [6, 7, 8] },
];

const CLASSES = [
  {
    n: 1, slug: 'the-argument', file: '01-session-01-the-argument.md',
    title: 'The Argument, and Control Basics',
    strap: 'Already taught, published because everything else assumes it: the disciplines, what a cue is, and the architectures a show control system can have.',
    covers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    tools: ['units', 'latency'], practice: ['myths', 'questions', 'drill'],
  },
  {
    n: 2, slug: 'signals-numbers-principles', file: '02-session-02-signals-numbers-principles.md',
    title: 'Signals, Numbers and the Rules We Design By',
    strap: 'Contact closures and isolation, the number systems every protocol is written in, and the seven principles that decide whether a system survives contact with a show.',
    covers: [11, 12, 13],
    tools: ['binhex', 'bitwise', 'units'], practice: ['myths', 'decode', 'drill'],
  },
  {
    n: 3, slug: 'how-a-bit-crosses-a-gap', file: '03-session-03-how-a-bit-crosses-a-gap.md',
    title: 'How a Bit Crosses a Gap',
    strap: 'Layering, framing, error detection and determinism, then the wires themselves: RS-485, USB-C, fibre and radio, and why serial won.',
    covers: [14, 15],
    tools: ['serial', 'datarate', 'cable', 'latency'], practice: ['myths', 'decode', 'drill'],
  },
  {
    n: 4, slug: 'ethernet-and-ip', file: '04-session-04-ethernet-and-ip.md',
    title: 'Ethernet and IP: The Network Under Every Show',
    strap: 'The OSI ladder as a diagnostic tool, what a switch actually does, and IP addressing to the point where you can subnet a rig without looking it up.',
    covers: [16, 17],
    tools: ['subnet', 'split', 'poe', 'datarate'], practice: ['myths', 'subnetdrill', 'faults', 'drill'],
  },
  {
    n: 5, slug: 'running-a-show-network', file: '05-session-05-running-a-show-network.md',
    title: 'Running a Real Show Network',
    strap: 'Multicast and IGMP, VLANs and QoS, redundancy that works, PTP and the tyranny of clock, and the security posture this industry has been getting away without.',
    covers: [18],
    tools: ['vlan', 'subnet', 'ptp', 'pixels'], practice: ['myths', 'faults', 'questions', 'drill'],
  },
  {
    n: 6, slug: 'lighting-control', file: '06-session-06-lighting-control.md',
    title: 'DMX512-A, RDM, RDMnet and sACN',
    strap: 'The E1 family end to end: the packet on the wire, discovery that works by halving, and the multicast arithmetic that puts a universe on the network.',
    covers: [19, 20, 21],
    tools: ['universe', 'dmxtime', 'dip', 'sacn', 'pixels'], practice: ['myths', 'decode', 'faults', 'drill'],
  },
  {
    n: 7, slug: 'cueing-between-systems', file: '07-session-07-cueing-between-systems.md',
    title: 'Cueing Between Systems',
    strap: 'MIDI as a byte stream, MIDI Show Control in full, MMC, and the OSC, HTTP and Companion layer that has quietly replaced most of it.',
    covers: [22, 23, 24],
    tools: ['midi', 'msc', 'serial'], practice: ['myths', 'decode', 'questions', 'drill'],
  },
  {
    n: 8, slug: 'time-and-interchange', file: '08-session-08-time-and-interchange.md',
    title: 'Time, Interchange and Everything Else',
    strap: 'Timecode and drop-frame arithmetic, OSC properly, tracking, machinery buses, media over IP, and how to draw a whole system so somebody else can run it.',
    covers: [25, 26, 27],
    tools: ['timecode', 'ptp', 'latency', 'msc'], practice: ['myths', 'faults', 'questions', 'drill'],
  },
];

const HOURS = 3;
const TOTAL_HOURS = CLASSES.length * HOURS;

// The syllabus contract. A chapter claimed twice, or not at all, is a course
// that has quietly stopped covering what it says it covers.
{
  const seen = new Map();
  for (const c of CLASSES) {
    for (const ch of c.covers) {
      if (seen.has(ch)) throw new Error(`syllabus: chapter ${ch} is claimed by Session ${seen.get(ch)} and Session ${c.n}`);
      seen.set(ch, c.n);
    }
  }
  const missing = [];
  for (let ch = 1; ch <= 27; ch++) if (!seen.has(ch)) missing.push(ch);
  if (missing.length) throw new Error(`syllabus: no session covers chapter(s) ${missing.join(', ')}`);
}

for (const c of CLASSES) {
  const unit = UNITS.find((u) => u.classes.includes(c.n));
  if (!unit) throw new Error(`course: Session ${c.n} belongs to no unit`);
  c.unit = unit;
}
for (const u of UNITS) {
  for (const n of u.classes) {
    if (!CLASSES.some((c) => c.n === n)) throw new Error(`course: unit ${u.n} names Session ${n}, which does not exist`);
  }
}

const chapterRange = (covers) => {
  const runs = [];
  for (const ch of [...covers].sort((a, b) => a - b)) {
    const last = runs[runs.length - 1];
    if (last && ch === last[1] + 1) last[1] = ch;
    else runs.push([ch, ch]);
  }
  return runs.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ');
};

// ---------------------------------------------------------------------------
// Markdown section helpers
// ---------------------------------------------------------------------------

// Slice a markdown document at an h2 whose text starts with `key`.
function sliceSection(md, key) {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## ') && l.slice(3).trim().startsWith(key));
  if (start === -1) return '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { end = i; break; }
  }
  return lines.slice(start + 1, end).join('\n').replace(/\n---\s*$/, '').trim();
}

function removeSection(md, key) {
  const lines = md.split('\n');
  const start = lines.findIndex((l) => l.startsWith('## ') && l.slice(3).trim().startsWith(key));
  if (start === -1) return md;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].startsWith('## ')) { end = i; break; }
  }
  return [...lines.slice(0, start), ...lines.slice(end)].join('\n');
}

// The run of the session: the three hours, accounted for.
//
// A course that says "three hours" and then lists two lab blocks has not said
// where the other ninety minutes went. This parses the authored table and the
// caller checks it sums to the full session, so a session cannot quietly stop
// adding up.
function parsePlan(md, file) {
  const sec = sliceSection(md, 'Run of the session');
  if (!sec) throw new Error(`${file}: no "## Run of the session" section`);
  const rows = [];
  for (const line of sec.split('\n')) {
    if (!/^\|/.test(line)) continue;
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.length !== 3) continue;
    if (/^:?-+:?$/.test(cells[0]) || /^Min$/i.test(cells[0])) continue;
    const mins = Number(cells[0]);
    if (!Number.isFinite(mins) || mins <= 0) {
      throw new Error(`${file}: run of the session has a row whose first cell is not minutes: ${line}`);
    }
    rows.push({ mins, kind: cells[1], what: cells[2] });
  }
  if (!rows.length) throw new Error(`${file}: run of the session has no rows`);
  return rows;
}

// Which colour band a block gets. Hands-on time is the expensive kind, so it is
// the one the eye should find first.
const planTone = (kind) => (/^lab/i.test(kind) ? 'bench'
  : /^break$/i.test(kind) ? 'break'
    : /^watch$/i.test(kind) ? 'watch'
      : /^(open|close)$/i.test(kind) ? 'edge' : 'idea');

// ---------------------------------------------------------------------------
// Flashcards generated from the per-session reference tables, so a card can
// never drift out of sync with what the session actually teaches.
// ---------------------------------------------------------------------------

// `code`, **bold** and *italic* inside a table cell have to be rendered or the
// card shows its own backticks and asterisks.
const inlineMd = (t) => esc(t)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
  .replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>');

function twoColumnCards(md, tag) {
  const cards = [];
  const rows = md.match(/^\|[^\n]*\|$/gm) || [];
  for (const row of rows) {
    const cells = row.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.length !== 2) continue;
    if (/^:?-+:?$/.test(cells[0]) || /^:?-+:?$/.test(cells[1])) continue;
    if (/^(Thing|Quantity|English|Term|#)$/i.test(cells[0])) continue;
    if (!cells[0] || !cells[1]) continue;
    cards.push({ q: inlineMd(cells[0]), a: inlineMd(cells[1]), tag });
  }
  return cards;
}

function glossaryCards(md) {
  const cards = [];
  let section = '';
  for (const line of md.split('\n')) {
    const hh = /^##\s+(.*)$/.exec(line);
    if (hh) section = hh[1].replace(/^[A-Z]\.\s*/, '').trim();
    if (!/^\|/.test(line)) continue;
    const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
    if (cells.length !== 3) continue;
    if (/^:?-+:?$/.test(cells[0])) continue;
    if (cells[0] === 'English') continue;
    if (!cells[0] || !cells[2]) continue;
    cards.push({ q: cells[0], zh: cells[1], a: cells[2], tag: section });
  }
  return cards;
}

// The "Common misconceptions" bullets are uniform: `- **"claim"** correction`.
// Parsing them is the whole content pipeline for Spot the myth, so a reworded
// bullet must fail the build loudly rather than silently vanish from the deck.
function parseMyths(md, n, file) {
  const sec = sliceSection(md, 'Common misconceptions');
  if (!sec) return [];
  const out = [];
  const items = sec.split(/\n(?=-\s)/);
  for (const item of items) {
    const text = item.replace(/^-\s+/, '').replace(/\n\s+/g, ' ').trim();
    if (!text) continue;
    const m = /^\*\*[“"](.+?)[”"]\*\*\s+(.+)$/s.exec(text);
    if (!m) throw new Error(`${file}: misconception bullet is not \`- **"claim"** correction\`:\n  ${text.slice(0, 90)}`);
    out.push({ cls: n, claim: m[1].trim(), fix: m[2].trim() });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Build stamp
// ---------------------------------------------------------------------------

function buildStamp() {
  const env = process.env;
  let sha = env.VERCEL_GIT_COMMIT_SHA || '';
  if (!sha) {
    try {
      sha = execSync('git rev-parse HEAD', { cwd: HERE, stdio: ['ignore', 'pipe', 'ignore'] })
        .toString().trim();
    } catch { sha = ''; }
  }
  return {
    commit: sha ? sha.slice(0, 7) : 'unknown',
    branch: env.VERCEL_GIT_COMMIT_REF || null,
    builtAt: new Date().toISOString(),
    source: env.VERCEL_GIT_COMMIT_SHA ? 'git' : env.VERCEL ? 'manual upload' : 'local',
  };
}
const STAMP = buildStamp();

// ---------------------------------------------------------------------------
// Page shell
// ---------------------------------------------------------------------------

const AUTHOR = {
  name: 'Migu Mianizt Leung',
  links: [
    ['mi2.dev', 'https://www.mi2.dev'],
    ['LinkedIn', 'https://www.linkedin.com/in/mi2dev/'],
    ['Medium', 'https://medium.com/@mi2dev'],
    ['Instagram', 'https://instagram.com/mi2.dev'],
  ],
  work: [
    ['showstack', 'https://showstack-inky.vercel.app/', 'the open index of live entertainment technology'],
    ['showstack on GitHub', 'https://github.com/deliseph/showstack', 'MIT code, CC BY 4.0 data'],
    ['mi2.dev', 'https://www.mi2.dev', 'the practice these modules come out of'],
  ],
};

const NAV_GROUPS = [
  ['Before a session', [
    ['/prepare', 'Prepare', 'What to do before each session'],
    ['/foundations', 'Foundations', 'The arithmetic every session assumes'],
  ]],
  ['While you work', [
    ['/tools', 'Calculators', 'Every calculation, with the working shown'],
    ['/practice', 'Practice', 'Drills, claims, decoding, fault sim'],
    ['/map', 'The map', 'Every figure and card, and the ones you have opened'],
  ]],
  ['Look it up', [
    ['/principles', 'Design principles', 'The seven rules, and the troubleshooting method'],
    ['/numbers', 'Numbers', 'The reference card, examinable'],
    ['/field', 'Field card', 'The commands you type in a venue'],
    ['/glossary', 'Glossary', 'Bilingual term list'],
  ]],
  ['Going further', [
    ['/lineage', 'How we got here', 'Why each protocol exists, and what it refuses to do'],
    ['/next', 'Where to go next', 'Standards, certifications, kit and reading'],
  ]],
];

// ---------------------------------------------------------------------------
// The other courses
//
// Four separate courses, taught by the same person, plus the open index they
// all check their numbers against. They are not one programme and none of them
// requires another: each takes the same body of knowledge and goes deeper from
// its own position in the signal path. Rendering the list on every site means
// a student who wants the same idea from a different angle can find where that
// angle is taught, rather than discovering three years later that it existed.
// ---------------------------------------------------------------------------

const PROGRAMME = [
  { id: 'electronics', name: 'Electronics for Theatre', href: 'https://github.com/deliseph/electronics-for-theatre',
    what: 'What happens below the connector, with a bench and a meter. 64 hours.' },
  { id: 'systems', name: 'Computer Systems and Networking', href: 'https://github.com/deliseph/theatre-computer-systems',
    what: 'The machine and the network under the show, for first year media design students.' },
  { id: 'compsci', name: 'Computer Science for Theatre', href: 'https://github.com/deliseph/Computer-Science',
    what: 'The instructions themselves: code, AI, and animation as a program, for technical direction.' },
  { id: 'shownet', name: 'Show Networking and Control Systems', href: 'https://github.com/deliseph/show-netoworking-control-system',
    what: 'The agreements between devices, protocol by protocol, against the standard text.' },
  { id: 'showstack', name: 'showstack', href: 'https://showstack-inky.vercel.app/',
    what: 'The open index the numbers and the bilingual terms are checked against.' },
];

function programmeHtml(here) {
  return `<section class="programme">
    <h2 class="sched-h">The same knowledge, from four positions</h2>
    <p class="programme-sub">Four separate courses, taught by the same person. None of them requires
      another and none is a sequel: each takes a position in the signal path and goes deep from
      there, so the same idea looks different in each. Where two of them touch, they say so and point
      at the one that goes furthest, rather than repeating it in a worse form.</p>
    <ul class="programme-list">
      ${PROGRAMME.map((m) => (m.id === here
    ? `<li class="programme-row on"><span class="programme-n">This one</span>
        <span class="programme-t">${esc(m.name)}</span><span class="programme-w">${esc(m.what)}</span></li>`
    : `<li class="programme-row"><span class="programme-n">→</span>
        <a class="programme-t" href="${m.href}" rel="noopener" target="_blank">${esc(m.name)}</a>
        <span class="programme-w">${esc(m.what)}</span></li>`)).join('')}
    </ul>
  </section>`;
}

function shell({ title, desc, body, active = '', bodyClass = '', bodyAttrs = '', scripts = [] }) {
  const navClasses = UNITS.map((u) => `<p class="side-u">Unit ${u.n} · ${esc(u.title)}</p>` +
    u.classes.map((n) => {
      const c = CLASSES.find((x) => x.n === n);
      return `<a class="nv${active === `class-${c.n}` ? ' on' : ''}" href="/session/${c.n}">
        <span class="nv-n">${c.n}</span>
        <span class="nv-t">${esc(c.title)}</span>
        </a>`;
    }).join('')).join('');

  const navRes = NAV_GROUPS.map(
    ([group, items]) => `<p class="side-g">${esc(group)}</p>${items.map(
      ([href, lbl, d]) => `<a class="nv nv-res${active === href ? ' on' : ''}" href="${href}">
        <span class="nv-t">${esc(lbl)}</span>
        <span class="nv-d">${esc(d)}</span></a>`
    ).join('')}`
  ).join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · Show Networking and Control Systems</title>
<meta name="description" content="${esc(desc || '')}">
<meta name="color-scheme" content="dark light">
<link rel="stylesheet" href="/assets/styles.css?v=${STAMP.commit}">
<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#0d0f13"/>' +
    '<circle cx="16" cy="7" r="3" fill="#f0a038"/><circle cx="7" cy="24" r="3" fill="#5cbdd2"/>' +
    '<circle cx="25" cy="24" r="3" fill="#5cbdd2"/>' +
    '<path d="M16 10v6M16 16 8.5 21.5M16 16l7.5 5.5" stroke="#6cc47f" stroke-width="2" fill="none" stroke-linecap="round"/></svg>'
  )}">
</head>
<body class="${bodyClass}"${bodyAttrs}>
<a class="skip" href="#main">Skip to content</a>

<header class="topbar">
  <button class="icon-btn menu-btn" aria-label="Menu" aria-expanded="false">☰</button>
  <a class="brand" href="/">
    <span class="brand-mark" aria-hidden="true"></span>
    <span class="brand-txt"><b>Show Networking</b><i>and Control Systems</i></span>
  </a>
  <div class="topbar-sp"></div>
  <button class="search-open icon-btn" aria-label="Search">
    <span class="sr">Search</span>⌕<kbd>/</kbd>
  </button>
  <button class="theme-btn icon-btn" aria-label="Toggle theme">◐</button>
</header>

<div class="layout">
  <nav class="side" aria-label="Course navigation">
    <p class="side-h">Eight sessions</p>
    ${navClasses}
    ${navRes}
    <div class="side-foot">
      <p>Eight sessions of three hours. Session 1 has already run; it is published because the seven
      that follow all assume it.</p>
      <p class="side-by">Built by <a href="${AUTHOR.links[0][1]}" rel="noopener" target="_blank">${AUTHOR.name}</a>
        · ${AUTHOR.links.slice(1).map(([n, u]) => `<a href="${u}" rel="noopener" target="_blank">${n}</a>`).join(' · ')}</p>
      <p class="side-build" title="Which commit is serving, and how it got here">
        build <code>${STAMP.commit}</code>${STAMP.branch ? ` · ${esc(STAMP.branch)}` : ''} · via ${STAMP.source}</p>
    </div>
  </nav>
  <main id="main">${body}</main>
</div>

<div class="search-modal" hidden>
  <div class="search-box" role="dialog" aria-modal="true" aria-label="Search the course">
    <input type="search" class="search-input" placeholder="Search every session, tool and term…" autocomplete="off">
    <div class="search-results"></div>
    <p class="search-hint"><kbd>↑</kbd><kbd>↓</kbd> move · <kbd>↵</kbd> open · <kbd>esc</kbd> close</p>
  </div>
</div>

<script src="/assets/app.js?v=${STAMP.commit}" type="module"></script>
${scripts.map((s) => `<script src="${s}?v=${STAMP.commit}" type="module"></script>`).join('\n')}
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

const PAGES = new Map();

const write = (route, html) => {
  const dir = route === '/' ? OUT : path.join(OUT, route.replace(/^\//, ''));
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  PAGES.set(route, html);
};

const searchIndex = [];
const addSearch = (route, title, section, text) => {
  const clean = String(text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (clean.length < 20) return;
  searchIndex.push({ r: route, t: title, s: section, x: clean.slice(0, 260) });
};

// --- Tool and practice registries -------------------------------------------

const TOOL_TITLES = {
  units: 'Bits, bytes, prefixes and time',
  binhex: 'Binary, decimal, hex and BCD',
  bitwise: 'Bitwise operations and masks',
  serial: 'Serial framing and bit time',
  datarate: 'Data rate and payload',
  cable: 'Cable length, delay and termination',
  latency: 'Latency budget',
  subnet: 'Subnet calculator',
  split: 'Subnet splitter',
  vlan: 'VLAN and address plan',
  poe: 'PoE budget',
  ptp: 'Clock accuracy and drift',
  universe: 'DMX universe and address planner',
  dmxtime: 'DMX512 timing and refresh',
  dip: 'DIP switch addressing',
  sacn: 'sACN and Art-Net universe addressing',
  pixels: 'Pixel load and universe count',
  midi: 'MIDI message decoder',
  msc: 'MIDI Show Control message builder',
  timecode: 'Timecode and drop-frame calculator',
};

const PRACTICE_TITLES = {
  drill: 'Numbers drill',
  myths: 'Spot the myth',
  decode: 'Decode the bytes',
  questions: 'The Five Questions',
  subnetdrill: 'Subnetting trainer',
  faults: 'Fault diagnosis simulator',
};

function toolsHtml(ids) {
  return ids.map((id) => {
    if (!TOOL_TITLES[id]) throw new Error(`tools: unknown tool "${id}"`);
    return `<div class="tool" data-tool="${id}"><h3 class="tool-h" id="tool-${id}">${TOOL_TITLES[id]}</h3></div>`;
  }).join('');
}

function practiceHtml(ids, n) {
  return ids.filter((id) => id !== 'selftest').map((id) => {
    if (!PRACTICE_TITLES[id]) throw new Error(`practice: unknown widget "${id}"`);
    return `<div class="practice" data-practice="${id}" data-class="${n}">
      <h3 class="tool-h" id="${id}">${PRACTICE_TITLES[id]}</h3></div>`;
  }).join('');
}

// The session plan, drawn as a proportional strip plus its rows. The strip is
// to scale, so a session that is mostly lab looks mostly lab.
function planHtml(plan, total) {
  const strip = plan.map((b) => {
    const pct = (b.mins / total) * 100;
    const tone = planTone(b.kind);
    return `<span class="plan-seg plan-${tone}" style="width:${pct.toFixed(3)}%"
      title="${esc(b.kind)} · ${b.mins} min">${pct > 7 ? `<b>${b.mins}</b>` : ''}</span>`;
  }).join('');

  const rows = plan.map((b) => `<li class="plan-row plan-${planTone(b.kind)}">
      <span class="plan-min">${b.mins}<i>min</i></span>
      <span class="plan-kind">${esc(b.kind)}</span>
      <span class="plan-what">${b.what ? esc(b.what) : '&mdash;'}</span>
    </li>`).join('');

  const lab = plan.filter((b) => planTone(b.kind) === 'bench').reduce((a, b) => a + b.mins, 0);
  const idea = plan.filter((b) => planTone(b.kind) === 'idea').reduce((a, b) => a + b.mins, 0);

  return `<section class="plan">
    <header class="plan-head">
      <h2 class="plan-h" id="run-of-the-session">Run of the session
        <a class="anchor" href="#run-of-the-session" aria-label="Link to this section">#</a></h2>
      <p class="plan-tot"><b>${total} minutes</b> · ${lab} on kit · ${idea} on the idea</p>
    </header>
    <div class="plan-strip">${strip}</div>
    <ol class="plan-rows">${rows}</ol>
    <p class="plan-note">Blocks are an order of work rather than a timetable: a session that runs
      long on a lab block is usually a session that is going well. The minutes are here so you know
      what you are trading against when it does.</p>
  </section>`;
}

function selfTestHtml(n) {
  const items = selfTest[n];
  if (!items) return '';
  const qs = items.map((it, i) => `<li class="qa">
      <button class="qa-q" aria-expanded="false"><span class="qa-n">${i + 1}</span>${esc(it.q)}</button>
      <div class="qa-a" hidden><p>${esc(it.a)}</p></div>
    </li>`).join('');
  return `<h2 class="hd hd-2" id="model-answers">Self test with model answers</h2>
  <p>Answer it yourself first, out loud or on paper, then open the answer. Reading the answer
  without attempting the question teaches you almost nothing.</p>
  <ol class="qa-list">${qs}</ol>
  <p class="note"><b>Note.</b> These are model answers, not the only correct ones. If yours differs
  and you can defend it with the arithmetic or a packet capture, that is worth more than matching
  the wording.</p>`;
}

// --- Session pages ----------------------------------------------------------

let animRendered = 0;
const myths = [];
const drillCards = [];
const classData = [];

for (const c of CLASSES) {
  const raw = read(c.file);

  // Every marker must sit alone on its line, or it lands inside a paragraph and
  // silently never mounts. Fail the build rather than ship a page with a hole.
  for (const [i, line] of raw.split('\n').entries()) {
    if (/<!--\s*(anim|ready|video):/.test(line) && !/^<!--\s*(anim|ready|video):[^>]*-->$/.test(line.trim())) {
      throw new Error(`${c.file}:${i + 1}: marker must be alone on its line`);
    }
  }

  const prepMd = sliceSection(raw, 'Before you come');
  if (!prepMd) throw new Error(`${c.file}: no "## Before you come" section`);

  // Every session is the same length, so every plan has to reach it. A session
  // that does not add up is a session somebody will run out of material in.
  const plan = parsePlan(raw, c.file);
  const planned = plan.reduce((a, x) => a + x.mins, 0);
  if (planned !== HOURS * 60) {
    throw new Error(`${c.file}: run of the session totals ${planned} min, not the ${HOURS * 60} min the session actually is`);
  }
  const labPlanned = plan.filter((x) => planTone(x.kind) === 'bench').reduce((a, x) => a + x.mins, 0);
  const numbersMd = sliceSection(raw, 'Numbers from this session');
  if (!numbersMd) throw new Error(`${c.file}: no "## Numbers from this session" section`);

  myths.push(...parseMyths(raw, c.n, c.file));
  drillCards.push(...twoColumnCards(numbersMd, `Session ${c.n}`));

  // The body is everything except the blocks that are re-presented elsewhere:
  // preparation has its own tab and its own page, and misconceptions become the
  // Spot the myth deck rather than a list nobody rereads.
  let bodyMd = raw.replace(/^#\s+[^\n]*\n/, '');
  bodyMd = removeSection(bodyMd, 'Before you come');
  bodyMd = removeSection(bodyMd, 'Run of the session');
  bodyMd = removeSection(bodyMd, 'Common misconceptions');

  const doc = render(bodyMd);
  const prep = render(prepMd);
  animRendered += (doc.html.match(/class="anim"/g) || []).length;

  classData.push({ ...c, doc, prep, numbersMd, plan, labPlanned });
}

for (const c of classData) c.labHours = Math.round((c.labPlanned / 60) * 2) / 2;

const animExpected = CLASSES.reduce((a, c) => a + (read(c.file).match(/^<!--\s*anim:/gm) || []).length, 0);

for (const c of classData) {
  const route = `/session/${c.n}`;
  const toc = c.doc.headings
    .filter((hh) => hh.level === 2)
    .map((hh) => `<a href="#${hh.id}"${hh.ext ? ' class="toc-ext"' : ''}>${esc(hh.text)}</a>`)
    .join('');

  const tabs = [
    ['read', 'The session'],
    ['plan', 'Run of it'],
    ['prepare', 'Prepare'],
    ...(c.tools.length ? [['tools', 'Calculators']] : []),
    ...(c.practice.length ? [['practice', 'Practice']] : []),
  ];

  const prev = CLASSES.find((x) => x.n === c.n - 1);
  const next = CLASSES.find((x) => x.n === c.n + 1);

  const body = `<article class="doc class-page">
  <header class="page-head">
    <p class="eyebrow">
      <span class="pill">Session ${c.n} of ${CLASSES.length}</span>
      <span class="pill">Unit ${c.unit.n} · ${esc(c.unit.title)}</span>
      <span class="pill pill-q">${HOURS} hours · ${c.labHours} on kit</span>
    </p>
    <h1>${esc(c.title)}</h1>
    <p class="strap">${esc(c.strap)}</p>
    <p class="covers">Covers the syllabus at <b>chapters ${chapterRange(c.covers)}</b>, reordered and
      brought up to date where the industry has moved on.</p>
    <div class="head-actions">
      <a class="btn btn-primary" href="/teach/${c.n}">Teach mode</a>
      <button class="btn js-done" data-class="${c.n}">Mark as studied</button>
      <a class="btn" href="/principles">Design principles</a>
    </div>
  </header>

  <nav class="tabs" aria-label="Sections of this session">
    ${tabs.map(([id, lbl], i) => `<button class="tab${i === 0 ? ' on' : ''}" data-tab="${id}">${lbl}</button>`).join('')}
  </nav>

  <section class="panel on" data-panel="read">
    <nav class="toc" aria-label="On this page"><p class="toc-h">On this page</p>${toc}</nav>
    ${c.doc.html}
    ${selfTestHtml(c.n)}
    <nav class="pager">
      ${prev ? `<a class="pager-prev" href="/session/${prev.n}"><span>Previous</span><b>${c.n - 1}. ${esc(prev.title)}</b></a>` : '<span></span>'}
      ${next ? `<a class="pager-next" href="/session/${next.n}"><span>Next</span><b>${c.n + 1}. ${esc(next.title)}</b></a>` : '<span></span>'}
    </nav>
  </section>

  <section class="panel" data-panel="plan">
    <p class="lede">The three hours, accounted for. This is the lecturer's view of the session, and
    it is here rather than hidden in a pack because a student who can see where the time goes can
    see what the session is actually for.</p>
    ${planHtml(c.plan, HOURS * 60)}
  </section>

  <section class="panel" data-panel="prepare">
    <p class="lede">Three hours goes fast, and a good share of it is on kit. What you do before the
    session is what decides whether you spend those hours learning or catching up.</p>
    ${c.prep.html}
  </section>

  ${c.tools.length ? `<section class="panel" data-panel="tools">
    <p class="lede">The calculations this session asks for, with the working shown. Use them to check
    your arithmetic, never to replace it: the assessment asks for the method.</p>
    ${toolsHtml(c.tools)}
  </section>` : ''}

  ${c.practice.length ? `<section class="panel" data-panel="practice">
    <p class="lede">Retrieval, not rereading. Everything here is self-graded, stored in this browser
    only, and reported to nobody.</p>
    ${practiceHtml(c.practice, c.n)}
  </section>` : ''}
</article>`;

  write(route, shell({
    title: `Session ${c.n}: ${c.title}`,
    desc: c.strap,
    body,
    active: `class-${c.n}`,
    bodyAttrs: ` data-cls="${c.n}"`,
    scripts: ['/assets/anim.js', '/assets/tools.js', '/assets/practice.js'],
  }));

  for (const b of c.doc.blocks) addSearch(route, `Session ${c.n}: ${c.title}`, b.title, b.html);
  addSearch(`${route}#tab=prepare`, `Session ${c.n}: ${c.title}`, 'Prepare', c.prep.html);

  // --- Teach mode ------------------------------------------------------------
  //
  // A projector view: one idea per screen, very large type, with two clocks and
  // a whiteboard. It is the lecturer's own notes made legible from the back of a
  // room, not an attempt to auto-generate slides that would be worse than the
  // notes.

  // A heading with nothing under it spends a whole projected screen announcing
  // a title the toolbar already shows. Fold those into the screen that follows.
  const merged = [];
  for (const b of c.doc.blocks) {
    const bare = b.html.replace(/<h[23][\s\S]*?<\/h[23]>/, '');
    const words = (bare.replace(/<[^>]+>/g, ' ').match(/\S+/g) || []).length;
    const prevB = merged[merged.length - 1];
    if (prevB && prevB.level === 2 && prevB.thin && b.level === 3) {
      b.html = prevB.html + b.html;
      merged[merged.length - 1] = b;
      continue;
    }
    merged.push({ ...b, thin: b.level === 2 && words < 25 });
  }

  const slides = merged.map((b, i) => {
    const cont = b.pages > 1 && b.page > 1;
    const lbl = b.pages > 1 ? `${b.title} (${b.page}/${b.pages})` : b.title;
    // On a continuation screen the heading is repeated small, so the room still
    // knows which section it is in without spending a title line on it.
    const inner = cont ? b.html.replace(/<h([23]) ([^>]*)>/, '<h$1 $2 data-cont="1">') : b.html;
    const hasFig = /<div class="(anim|practice)"/.test(b.html);
    return `<section class="slide" data-i="${i}" data-title="${esc(lbl)}"
        data-block="${esc(b.parent)}" data-level="${b.level}"${cont ? ' data-cont="1"' : ''}${hasFig ? ' data-fig="1"' : ''}>
        <div class="slide-inner">${inner}</div></section>`;
  }).join('');

  write(`/teach/${c.n}`, shell({
    title: `Teach · Session ${c.n}`,
    desc: `Projector view for Session ${c.n}.`,
    bodyClass: 'teach-mode',
    bodyAttrs: ` data-cls="${c.n}"`,
    body: `
<div class="teach" data-class="${c.n}">
  <header class="teach-bar">
    <a class="teach-exit" href="/session/${c.n}" title="Exit teach mode">✕</a>
    <h1 class="teach-title">Session ${c.n} · ${esc(c.title)}</h1>
    <span class="teach-when">${HOURS} h · ${c.labHours} on kit</span>
    <span class="teach-block" id="tblock"></span>
    <span class="teach-sub" id="tsub"></span>
    <div class="teach-sp"></div>
    <button class="teach-btn" id="tstart" title="Runs for the whole session. The block figure beside it restarts at each block.">▶ Start stopwatch</button>
    <span class="teach-clock" id="tclock">00:00</span>
    <span class="teach-bclock" id="tbclock" hidden></span>
    <span class="teach-pos" id="tpos"></span>
    <button class="teach-btn" id="tfull" title="Full screen">⛶</button>
  </header>
  <div class="teach-track" id="ttrack">${slides}</div>
  <footer class="teach-foot">
    <button class="teach-nav" id="tprev">← Previous</button>
    <div class="teach-dots" id="tdots"></div>
    <span class="teach-next" id="tnextup" hidden></span>
    <span class="teach-loc" id="tloc" hidden title="The same page on a phone. Press l to show it big for the room."><span class="teach-loc-p" id="tlocp"></span><kbd>l</kbd></span>
    <button class="teach-btn" id="tboard" title="A surface to draw on, over this screen. What you draw stays until you clear it.">✎ Board <kbd>w</kbd></button>
    <button class="teach-btn" id="tgrid" title="Overview of every screen (o)">▦ Overview <kbd>o</kbd></button>
    <button class="teach-btn" id="tanswers" aria-pressed="true" title="Hold each figure&#39;s conclusion until you press n. Your choice is remembered on this laptop."><span>Answers: held</span> <kbd>a</kbd></button>
    <button class="teach-nav" id="tnext">Next →</button>
  </footer>
</div>`,
    scripts: ['/assets/teach.js', '/assets/anim.js'],
  }));
}

// ---------------------------------------------------------------------------
// Resource pages
// ---------------------------------------------------------------------------

const glossaryMd = read('glossary.md');
const glossCards = glossaryCards(glossaryMd);

const docPage = (file, { route, title, eyebrow, h1, strap, actions = '', scripts = [], cls = '' }) => {
  const doc = render(read(file).replace(/^#\s+[^\n]*\n/, ''));
  write(route, shell({
    title, desc: strap.replace(/<[^>]+>/g, ''),
    body: `<article class="doc ${cls}"><header class="page-head">
      <p class="eyebrow">${eyebrow}</p>
      <h1>${h1}</h1>
      <p class="strap">${strap}</p>
      ${actions ? `<div class="head-actions">${actions}</div>` : ''}
    </header>${doc.html}</article>`,
    active: route,
    scripts,
  }));
  for (const b of doc.blocks) addSearch(route, h1.replace(/<[^>]+>/g, ''), b.title, b.html);
  return doc;
};

docPage('foundations.md', {
  route: '/foundations',
  title: 'Foundations',
  eyebrow: '<span class="pill">Do this first</span>',
  h1: 'Foundations',
  strap: `Bits and bytes, powers of two, binary and hex, and how to read a rate. Nothing here is
    difficult and all of it is assumed everywhere else. A student who has not met it spends
    Session 4 fighting the arithmetic instead of learning the network.`,
  actions: `<a class="btn btn-primary" href="/tools#tool-binhex">Open the number tool</a>
    <a class="btn" href="/practice#drill">Drill the numbers</a>`,
  scripts: ['/assets/anim.js', '/assets/tools.js', '/assets/practice.js'],
});

docPage('principles.md', {
  route: '/principles',
  title: 'The design principles',
  eyebrow: '<span class="pill">Not negotiable</span><span class="pill pill-q">Examinable</span>',
  h1: 'The design principles',
  strap: `Seven rules and a troubleshooting method. Every one of them exists because a show stopped,
    somebody was hurt, or a system nobody could understand had to be rebuilt the week before opening.`,
  actions: `<button class="btn btn-primary" onclick="window.print()">Print this card</button>
    <a class="btn" href="/session/2">Where this is taught</a>`,
  scripts: ['/assets/anim.js'],
  cls: 'safety-page',
});

docPage('field-card.md', {
  route: '/field',
  title: 'The field card',
  eyebrow: '<span class="pill">Reference</span><span class="pill pill-q">Examinable</span>',
  h1: 'The field card',
  strap: `The commands you type and the settings you change while standing in a venue with somebody
    waiting. Learn the first eight by heart. Look the rest up.`,
  actions: `<button class="btn btn-primary" onclick="window.print()">Print this card</button>
    <a class="btn" href="/session/4">Where this is taught</a>`,
});

docPage('lineage.md', {
  route: '/lineage',
  title: 'How we got here',
  eyebrow: '<span class="pill">Reference</span>',
  h1: 'How we got here',
  strap: `None of this was designed. It accumulated, one problem at a time, and most of it is still
    carrying the shape of a constraint that stopped existing in 1995. Knowing why something exists
    tells you what it refuses to do, and that outlives the product names.`,
  scripts: ['/assets/anim.js'],
});

docPage('next.md', {
  route: '/next',
  title: 'Where to go next',
  eyebrow: '<span class="pill">Reference</span>',
  h1: 'Where to go next',
  strap: `Twenty four hours is an introduction. By the end of it you should know which direction you
    want to go deeper in. Here is where each one leads, what it costs, and what is free.`,
});

// The numbers card is generated from the per-session tables, so the printable
// reference and the flashcard deck cannot say different things.
const numbersBody = classData.map((c) => `<h2 class="hd hd-2" id="numbers-session-${c.n}">Session ${c.n} · ${esc(c.title)}
  <a class="anchor" href="#numbers-session-${c.n}" aria-label="Link to this section">#</a></h2>
  ${render(c.numbersMd).html}`).join('');

write('/numbers', shell({
  title: 'Numbers to know',
  desc: 'The reference card. Every examinable number in the course, generated from the sessions themselves.',
  body: `<article class="doc"><header class="page-head">
      <p class="eyebrow"><span class="pill">Reference</span><span class="pill pill-q">Examinable</span></p>
      <h1>Numbers to know</h1>
      <p class="strap">Every number the course expects you to have, in session order. It is generated
      from the sessions themselves, so it cannot drift from what you were actually taught. There is a
      five minute verbal quiz at the top of every session.</p>
      <div class="head-actions"><button class="btn btn-primary" onclick="window.print()">Print this card</button>
      <a class="btn" href="/practice#drill">Drill these</a></div>
    </header>${numbersBody}</article>`,
  active: '/numbers',
}));
for (const c of classData) addSearch('/numbers', 'Numbers to know', `Session ${c.n}: ${c.title}`, c.numbersMd);

const glossDoc = render(glossaryMd.replace(/^#\s+[^\n]*\n/, ''));
write('/glossary', shell({
  title: 'Glossary',
  desc: 'Bilingual glossary, English and 繁體中文, of every term used in the course.',
  body: `<article class="doc glossary-page"><header class="page-head">
      <p class="eyebrow"><span class="pill">${glossCards.length} terms</span><span class="pill pill-q">EN · 繁中</span></p>
      <h1>Glossary 詞彙表</h1>
      <p class="strap">Learn the English term as the operational one: every menu, every error message
      and every conversation on an international crew is in English. The Chinese is there to build
      the concept, not to replace it.</p>
      <div class="gloss-controls">
        <input type="search" id="gloss-filter" placeholder="Filter ${glossCards.length} terms, English or 中文…" autocomplete="off">
        <button class="btn" id="gloss-cards">Flashcard mode</button>
        <span class="gloss-count" id="gloss-count"></span>
      </div>
    </header>
    <div id="gloss-flash" hidden></div>
    <div id="gloss-body">${glossDoc.html}</div></article>`,
  active: '/glossary',
  scripts: ['/assets/practice.js'],
}));
for (const b of glossDoc.blocks) addSearch('/glossary', 'Glossary', b.title, b.html);

write('/tools', shell({
  title: 'Calculators',
  desc: 'Every calculation in the course: subnets, universes, DMX timing, sACN multicast, MIDI, timecode, PoE, latency.',
  body: `<article class="doc"><header class="page-head">
      <p class="eyebrow"><span class="pill">Used in the lab and in the assessment</span></p>
      <h1>Calculators</h1>
      <p class="strap">Every calculation the course asks for, with the working shown. They exist to
      check your arithmetic, never to replace it. The assessment asks for the method, and a right
      answer with no method is worth less than a wrong one with a good one.</p>
    </header>${toolsHtml(Object.keys(TOOL_TITLES))}</article>`,
  active: '/tools',
  scripts: ['/assets/tools.js'],
}));
for (const [id, t] of Object.entries(TOOL_TITLES)) {
  addSearch(`/tools#tool-${id}`, 'Calculators', t, `${t}: a calculator that shows its working, used in the lab and in the assessment.`);
}

write('/practice', shell({
  title: 'Practice',
  desc: 'Numbers drill, spot the myth, byte decoding, the Five Questions, a subnetting trainer and a fault diagnosis simulator.',
  body: `<article class="doc"><header class="page-head">
      <p class="eyebrow"><span class="pill">Repetition is the point</span></p>
      <h1>Practice</h1>
      <p class="strap">All of this rewards doing it badly at first. Twenty minutes a night for a week
      beats three hours the day before, and that is not a motivational line, it is how the spacing
      works. The subnetting trainer in particular does not absorb in one sitting.</p>
      <p class="note"><b>The cards come back on their own.</b> A card you get right returns in a few
      days, then a week, then three. A card you miss comes back tomorrow, and again before you
      leave. So a sitting is short and it <b>ends</b>: the due count goes to zero and the page says
      so. New cards are never pushed at you. Miss a week and nothing is lost or broken, there are
      simply more waiting. None of it leaves your browser.</p>
    </header>
    <div class="practice" data-practice="subnetdrill" data-class="4"><h3 class="tool-h" id="subnetdrill">Subnetting trainer</h3></div>
    <div class="practice" data-practice="faults" data-class="0"><h3 class="tool-h" id="faults">Fault diagnosis simulator</h3></div>
    <div class="practice" data-practice="questions" data-class="0"><h3 class="tool-h" id="questions">The Five Questions</h3></div>
    <div class="practice" data-practice="decode" data-class="0"><h3 class="tool-h" id="decode">Decode the bytes</h3></div>
    <div class="practice" data-practice="myths" data-class="0"><h3 class="tool-h" id="myths">Spot the myth</h3></div>
    <div class="practice" data-practice="drill" data-class="0"><h3 class="tool-h" id="drill">Numbers drill</h3></div>
    </article>`,
  active: '/practice',
  scripts: ['/assets/practice.js'],
}));

write('/map', shell({
  title: 'The map',
  desc: 'Every figure and every card in the course, in the order they are taught.',
  body: `<article class="doc"><header class="page-head">
      <p class="eyebrow"><span class="pill">The whole course</span></p>
      <h1>The map</h1>
      <p class="strap">Every figure and every card, in the order they are taught. It is here so you
      can get back to the one you half remember. The ones you have driven are filled in, and the
      cards you have met are marked; nothing is counted and there is nothing to finish.</p>
      <p class="note">This is read from your own browser and never leaves it. On a different device,
      or after clearing your site data, the map starts empty again.</p>
    </header><div id="modulemap" class="mp"></div></article>`,
  active: '/map',
  scripts: ['/assets/map.js'],
}));
addSearch('/map', 'The map', 'The whole course',
  'Every figure and every card in the course in the order they are taught, with the ones you have opened filled in');

// The prepare page collects every pre-session block in one place. Each one
// collapses and app.js opens the one the reader actually needs.
const prepCards = classData.map((c) => `<section class="prep-block" data-prep="${c.n}">
    <header class="prep-head">
      <span class="prep-n">${c.n}</span>
      <div>
        <h2 class="hd hd-2" id="prepare-session-${c.n}" style="margin:0;border:0;padding:0">${esc(c.title)}</h2>
        <p class="prep-meta">Session ${c.n} · Unit ${c.unit.n} · ${c.labHours} of ${HOURS} hours on kit</p>
      </div>
      <a class="btn" href="/session/${c.n}#tab=prepare">Open Session ${c.n} →</a>
      <button class="btn prep-toggle" aria-expanded="false" data-prep-toggle="${c.n}">Show</button>
    </header>
    <div class="prep-body" hidden>${c.prep.html}</div>
  </section>`).join('');

write('/prepare', shell({
  title: 'Prepare',
  desc: 'What to do before each session: what you must already be able to do, three tasks, what to bring, and a readiness check.',
  body: `<article class="doc"><header class="page-head">
      <p class="eyebrow"><span class="pill">Before you walk in</span></p>
      <h1>Prepare</h1>
      <p class="strap">Three hours is not long, and a good share of it is on real kit with real
      switches. Every block below says what you must already be able to do, three things to actually
      go and do, and what to bring.</p>
      <div class="head-actions">
        <a class="btn btn-primary" href="#" data-prep-open="next">Open the one I need</a>
        <a class="btn" href="/foundations">Foundations, if the arithmetic is new</a>
        <a class="btn" href="/field">The field card</a>
      </div>
    </header>
    <div class="note" style="margin-bottom:28px"><b>The two that matter.</b> Session 4 is IP
    addressing, and subnetting does not absorb in one sitting: spread its preparation over several
    evenings or you will spend the session doing arithmetic instead of learning the network.
    Session 6 assumes you can already patch and address a fixture. If you only prepare properly for
    two, prepare for those.</div>
    ${prepCards}</article>`,
  active: '/prepare',
  scripts: ['/assets/practice.js', '/assets/anim.js'],
}));
for (const c of classData) addSearch(`/prepare#prepare-session-${c.n}`, 'Prepare', `Session ${c.n}: ${c.title}`, c.prep.html);

// --- Home -------------------------------------------------------------------

const spine = `A show control system is a chain of agreements. Every link is two devices that agreed
what a signal means, and nearly every failure you will chase is a link where that agreement was
never actually made.`;

const unitBlocks = UNITS.map((u) => `<section class="unit">
  <h3 class="unit-h"><span class="unit-n">Unit ${u.n}</span>${esc(u.title)}</h3>
  <div class="cards cards-sm">
    ${u.classes.map((n) => {
    const c = classData.find((x) => x.n === n);
    return `<a class="card" href="/session/${c.n}">
      <span class="card-n">${c.n}</span>
      <h3>${esc(c.title)}</h3>
      <p>${esc(c.strap)}</p>
      <span class="card-foot"><span class="card-hrs">ch ${chapterRange(c.covers)}</span>
      <span class="card-go">Open →</span></span></a>`;
  }).join('')}
  </div></section>`).join('');

write('/', shell({
  title: 'Show Networking and Control Systems',
  desc: 'An interactive course: eight three-hour sessions on show networks, DMX512-A, RDM, sACN, MIDI Show Control, OSC, timecode and PTP, with animated explainers, calculators and drills.',
  body: `
<article class="doc home">
  <header class="hero">
    <p class="eyebrow"><span class="pill">Entertainment technology</span><span class="pill pill-q">8 sessions · ${TOTAL_HOURS} hours</span></p>
    <h1>Show Networking<br><span class="hero-sub">and Control Systems</span></h1>
    <blockquote class="spine"><p>${spine}</p></blockquote>
    <p class="strap">Eight three-hour sessions, from a contact closure to a converged show network
    carrying audio, video, lighting and cues on one set of cables. Every session has an idea to
    understand and kit to put it on.</p>
    <div class="head-actions">
      <a class="btn btn-primary" href="/session/2">Start with Session 2</a>
      <a class="btn" href="/session/1">Session 1, the recap</a>
      <a class="btn" href="/principles">The design principles</a>
    </div>
  </header>

  <section class="progress-strip" id="progress-strip"
    data-classes='${esc(JSON.stringify(CLASSES.map((c) => ({ n: c.n, title: c.title }))))}'></section>

  <section class="sched" id="shape">
    <h2 class="sched-h">The shape of the course</h2>
    <p class="sched-sub">Three units. The first puts the vocabulary and the rules in place, the
    second builds the network everything now runs on, and the third is the protocols themselves,
    taught in the order a signal actually travels rather than the order they were standardised in.</p>
    <ol class="unit-list">
      ${UNITS.map((u) => `<li class="unit-row">
        <span class="unit-row-n">Unit ${u.n}</span>
        <span class="unit-row-t">${esc(u.title)}</span>
        <span class="unit-row-c">${u.classes.map((n) => `<a href="/session/${n}">${n}</a>`).join('')}</span>
        <span class="unit-row-h">${u.classes.length * HOURS} h</span>
      </li>`).join('')}
    </ol>
  </section>

  <h2 class="hd hd-2" id="sessions">The eight sessions</h2>
  ${unitBlocks}

  <h2 class="hd hd-2" id="five-questions">The model that runs through every session</h2>
  <p>Every protocol in this course is a different answer to the same five questions. Learn to ask
  them and a protocol you have never met becomes a form to fill in rather than a manual to read.</p>
  <div class="flows">
    ${Object.entries(questionMeta).map(([k, v]) => `<div class="flow flow-${k}">
      <h3>${v.label}</h3><p>${esc(v.hint)}</p></div>`).join('')}
  </div>
  <p class="note"><b>The one people skip.</b> The fifth. Almost every protocol here is specified in
  detail for the case where everything works, and in one sentence or not at all for the case where
  it stops. That sentence is the one a production manager actually needs.
  <a href="/practice#questions">Answer them for twenty real protocols →</a></p>

  <h2 class="hd hd-2" id="coverage">What it covers</h2>
  <p>The module is specified against the twenty seven chapters of the standard text. The order here
  is not the book's: it follows a signal from a switch contact to a fixture across a network, and
  where the book is out of date the session says so and teaches what the industry actually does now.
  The build refuses to ship unless every chapter is claimed by exactly one session.</p>
  <div class="table-wrap"><table>
    <thead><tr><th>Chapters</th><th>Session</th><th>Brought up to date with</th></tr></thead>
    <tbody>
      <tr><td>1&ndash;10</td><td><a href="/session/1">1. The Argument, and Control Basics</a></td><td>Current console, media server and machinery practice</td></tr>
      <tr><td>11&ndash;13</td><td><a href="/session/2">2. Signals, Numbers and the Rules We Design By</a></td><td>Safety-rated I/O, and security as a design principle rather than an afterthought</td></tr>
      <tr><td>14&ndash;15</td><td><a href="/session/3">3. How a Bit Crosses a Gap</a></td><td>USB-C and USB4, SFP optics, Wi-Fi 6E and 7, UWB</td></tr>
      <tr><td>16&ndash;17</td><td><a href="/session/4">4. Ethernet and IP</a></td><td>Multi-gigabit copper, 802.3bt PoE, current diagnostic tooling</td></tr>
      <tr><td>18</td><td><a href="/session/5">5. Running a Real Show Network</a></td><td>IGMPv3, MSTP, LACP, DSCP, PTPv2 and SMPTE 2059-2, real segmentation</td></tr>
      <tr><td>19&ndash;21</td><td><a href="/session/6">6. DMX512-A, RDM, RDMnet and sACN</a></td><td>E1.31-2018, RDMnet E1.33, Art-Net 4, pixel-scale rigs</td></tr>
      <tr><td>22&ndash;24</td><td><a href="/session/7">7. Cueing Between Systems</a></td><td>MIDI 2.0 and UMP, RTP-MIDI, OSC, HTTP and WebSocket APIs, Companion</td></tr>
      <tr><td>25&ndash;27</td><td><a href="/session/8">8. Time, Interchange and Everything Else</a></td><td>PosiStageNet, Dante and AES67, ST 2110, NDI, MQTT, OPC UA, EN 17206</td></tr>
    </tbody>
  </table></div>

  <h2 class="hd hd-2" id="how">How every session runs</h2>
  <div class="cards cards-sm">
    <div class="card card-plain"><h3>Ninety minutes of why</h3><p>The idea, with figures you can
      break. The controls exist so you can push the system into the failure the session is about,
      which is the only way the numbers stop being decoration.</p></div>
    <div class="card card-plain"><h3>An hour on real kit</h3><p>A managed switch, a console, a node,
      a laptop with Wireshark. Every session produces a capture, a configuration or a measurement
      you wrote down and can defend.</p></div>
    <div class="card card-plain"><h3>A quiz you have already seen</h3><p>Five minutes of numbers at
      the top of every session, drawn from the same deck that is on this site. Nothing is a surprise
      and nothing is a trick.</p></div>
  </div>

  <h2 class="hd hd-2" id="whats-here">What is on this platform</h2>
  <div class="cards cards-sm">
    <a class="card" href="/prepare"><h3>A preparation path</h3><p>What to do before each session,
      what you must already be able to do, and a readiness check that names the exact thing to go and
      fix rather than telling you a score.</p></a>
    <a class="card" href="/foundations"><h3>Foundations</h3><p>Bits, bytes, powers of two, binary and
      hex, and how to read a rate. Forty minutes, done once, and the rest of the course stops
      fighting you.</p></a>
    <a class="card" href="/principles"><h3>The design principles</h3><p>Seven rules and a
      troubleshooting method, printable, with the reason each one exists and the failure it is
      there to prevent.</p></a>
    <a class="card" href="/tools"><h3>${Object.keys(TOOL_TITLES).length} calculators</h3><p>Subnets and splits, VLAN plans,
      PoE budgets, DMX timing, universe and sACN addressing, pixel loads, MIDI and MSC messages,
      timecode and clock drift. Each shows its working.</p></a>
    <a class="card" href="/practice"><h3>Six drills</h3><p>A subnetting trainer, a fault simulator
      scored on the order you investigate in, the Five Questions, byte decoding, spot the myth, and
      flashcards for every examinable number.</p></a>
    <a class="card" href="/glossary"><h3>${glossCards.length} terms, bilingual</h3><p>English and 繁體中文,
      grouped by domain, with a live filter and a flashcard mode.</p></a>
  </div>

  ${programmeHtml('shownet')}

  <section class="byline" id="who">
    <h2 class="sched-h">Who made this</h2>
    <blockquote class="byline-line"><p>The design test &mdash; if an ordinary person can&rsquo;t feel it,
      it failed.</p><cite>Migu Mianizt Leung, <a href="https://www.mi2.dev" rel="noopener" target="_blank">mi2.dev</a></cite></blockquote>
    <p class="byline-p">Built and maintained by
      <a href="${AUTHOR.links[0][1]}" rel="noopener" target="_blank">${AUTHOR.name}</a>, who teaches the
      course it belongs to. Questions are welcome, and so is a correction: if something here does not
      hold up against a packet capture or a current standard, please do get in touch.</p>
    <p class="byline-links">${AUTHOR.links.map(([n, u]) => `<a href="${u}" rel="noopener" target="_blank">${n}</a>`).join('')}</p>
    <ul class="byline-work">
      ${AUTHOR.work.map(([n, u, d]) => `<li><a href="${u}" rel="noopener" target="_blank">${n}</a> <span>${d}</span></li>`).join('')}
    </ul>
  </section>
</article>`,
  active: '/',
  scripts: ['/assets/practice.js'],
}));

addSearch('/#shape', 'Home', 'The shape of the course',
  UNITS.map((u) => `Unit ${u.n} ${u.title}: ${u.classes.map((n) => CLASSES.find((c) => c.n === n).title).join(', ')}`).join(' · '));
addSearch('/#coverage', 'Home', 'What it covers',
  CLASSES.map((c) => `Chapters ${chapterRange(c.covers)}: Session ${c.n}, ${c.title}`).join(' · '));

// ---------------------------------------------------------------------------
// Cross-reference pass
//
// A link the site promises has to land. Every figure named in the map, every
// readiness pointer and every fault-sim reference is checked against the pages
// that were just generated, and the build fails rather than shipping a link to
// nothing.
// ---------------------------------------------------------------------------

const LINKABLE = [...CLASSES.map((c) => `/session/${c.n}`), '/foundations', '/principles', '/numbers', '/field'];
const PAGE_NAME = {
  '/foundations': 'Foundations',
  '/principles': 'Design principles',
  '/numbers': 'Numbers to know',
  '/field': 'Field card',
  ...Object.fromEntries(CLASSES.map((c) => [`/session/${c.n}`, `Session ${c.n}`])),
};

// mountAll() removes a host whose figure was never registered, so a link to one
// would land on nothing. Read the register calls rather than trusting the name.
const REGISTERED = new Set();
const FIG_TITLE = new Map();
for (const f of fs.readdirSync(path.join(HERE, 'assets')).filter((n) => /^anim-.*\.js$/.test(n))) {
  const src = fs.readFileSync(path.join(HERE, 'assets', f), 'utf8');
  for (const m of src.matchAll(/register\('([a-z0-9-]+)'/g)) REGISTERED.add(m[1]);
  for (const m of src.matchAll(/register\('([a-z0-9-]+)'[\s\S]{0,9000}?title:\s*'((?:[^'\\]|\\.)*)'/g)) {
    if (!FIG_TITLE.has(m[1])) FIG_TITLE.set(m[1], m[2].replace(/\\'/g, "'"));
  }
}

// Every figure the prose asks for must exist, or the page shows a hole.
const missingFigs = [];
for (const c of CLASSES) {
  for (const m of read(c.file).matchAll(/^<!--\s*anim:([a-z0-9-]+)\s*-->$/gm)) {
    if (!REGISTERED.has(m[1])) missingFigs.push(`${c.file}: anim:${m[1]}`);
  }
}
if (missingFigs.length) throw new Error(`figures named in the prose that nothing registers:\n  ${missingFigs.join('\n  ')}`);

const HEADINGS = new Map();
for (const route of LINKABLE) {
  const html = PAGES.get(route);
  if (!html) throw new Error(`xref: no page built for ${route}`);
  const list = [];
  for (const m of html.matchAll(/<h([234]) id="([^"]+)"[^>]*>([\s\S]*?)<a class="anchor"/g)) {
    list.push({
      index: m.index,
      id: m[2],
      text: m[3].replace(/<span class="ext-badge">[\s\S]*?<\/span>/g, '')
        .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim(),
    });
  }
  HEADINGS.set(route, list);
  const ids = (html.match(/ id="[^"]+"/g) || []);
  const seen = new Set();
  for (const rawId of ids) {
    if (seen.has(rawId)) throw new Error(`xref: ${route} repeats${rawId}`);
    seen.add(rawId);
  }
}

function resolve(route, id) {
  if (!LINKABLE.includes(route)) throw new Error(`xref: ${route} is not linkable (id ${id})`);
  const html = PAGES.get(route);
  const at = html.indexOf(`id="${id}"`);
  if (at < 0) throw new Error(`xref: ${route} has no id "${id}"`);
  if (id.startsWith('fig-') && !REGISTERED.has(id.slice(4))) {
    throw new Error(`xref: ${route}#${id} names a figure that is never registered`);
  }
  const list = HEADINGS.get(route);
  const own = list.find((hh) => hh.id === id);
  let lbl = own ? own.text : '';
  if (!own) {
    let best = null;
    for (const hh of list) { if (hh.index < at) best = hh; else break; }
    if (!best) throw new Error(`xref: ${route}#${id} sits above every heading`);
    lbl = best.text;
  }
  if (lbl.length > 58) lbl = `${lbl.slice(0, lbl.lastIndexOf(' ', 58)).trim()}…`;
  return { to: `${route}#${id}`, label: `${PAGE_NAME[route]} · ${lbl}` };
}

const mapFigures = [];
for (const c of CLASSES) {
  const route = `/session/${c.n}`;
  const html = PAGES.get(route);
  for (const m of html.matchAll(/ id="fig-([a-z0-9-]+)"/g)) {
    const id = `fig-${m[1]}`;
    const { to, label } = resolve(route, id);
    const t = FIG_TITLE.get(m[1]);
    if (!t) {
      console.error(`  ! no title found for figure ${m[1]}; the map would label it by its section`);
      process.exitCode = 1;
    }
    mapFigures.push({ cls: c.n, name: m[1], to, label: t || label.replace(/^Session \d+ · /, '') });
  }
}

for (const n of Object.keys(readiness)) {
  for (const q of readiness[n]) {
    if (q.to) { q.src = resolve(q.to.route, q.to.id); delete q.to; }
  }
}

// Which session page carries which deck, so the map can send somebody to the
// right place rather than always to /practice.
const classLinks = Object.fromEntries(CLASSES.map((c) => [c.n, {
  drill: c.practice.includes('drill') ? `/session/${c.n}#drill` : '/practice#drill',
  myths: c.practice.includes('myths') ? `/session/${c.n}#myths` : '/practice#myths',
}]));

// --- Data and assets --------------------------------------------------------

fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });
for (const f of fs.readdirSync(path.join(HERE, 'assets'))) {
  fs.copyFileSync(path.join(HERE, 'assets', f), path.join(OUT, 'assets', f));
}

fs.writeFileSync(path.join(OUT, 'assets', 'data.json'), JSON.stringify({
  classes: CLASSES.map((c) => ({ n: c.n, title: c.title, slug: c.slug, unit: c.unit.n, covers: c.covers })),
  units: UNITS,
  drillCards, glossCards, myths, mapFigures, classLinks, readiness, faultScenarios,
  decodeChecks, questionCards, questionMeta,
  hours: HOURS, totalHours: TOTAL_HOURS,
}));
fs.writeFileSync(path.join(OUT, 'search-index.json'), JSON.stringify(searchIndex));
fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\n');
fs.writeFileSync(path.join(OUT, 'version.json'), JSON.stringify(STAMP, null, 2));

const routes = ['/', '/prepare', '/map', '/foundations', '/principles', '/field', '/tools', '/practice',
  '/glossary', '/numbers', '/lineage', '/next',
  ...CLASSES.map((c) => `/session/${c.n}`), ...CLASSES.map((c) => `/teach/${c.n}`)];

console.log(`Built ${routes.length} routes`);
console.log(`  sessions       : ${CLASSES.length} in ${UNITS.length} units, ${TOTAL_HOURS} hours`);
console.log(`  syllabus       : chapters 1-27, each claimed exactly once`);
console.log(`  search entries : ${searchIndex.length}`);
console.log(`  drill cards    : ${drillCards.length}`);
console.log(`  myth cards     : ${myths.length}`);
console.log(`  map figures    : ${mapFigures.length}`);
console.log(`  glossary cards : ${glossCards.length}`);
console.log(`  fault cases    : ${faultScenarios.length}`);
console.log(`  decode cards   : ${decodeChecks.length}`);
console.log(`  question cards : ${questionCards.length}`);
console.log(`  registered     : ${REGISTERED.size} figures in the modules`);
console.log(`  build          : ${STAMP.commit} via ${STAMP.source}${STAMP.branch ? ` (${STAMP.branch})` : ''}`);
console.log(`  explainers     : ${animRendered}${animRendered === animExpected ? '' : ` of ${animExpected} EXPECTED`}`);
if (animRendered !== animExpected) process.exitCode = 1;
