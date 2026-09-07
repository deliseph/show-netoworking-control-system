// Interactive practice: the numbers drill, spot the myth, byte decoding, the
// Five Questions sort, the subnetting trainer, the fault diagnosis simulator,
// the readiness checks and the glossary tools.
//
// Everything is self-graded and stored per browser. Nothing is reported
// anywhere, which is the point: a drill you are being marked on is a test, and
// people stop taking risks on tests.

import { due, counts, grade as gradeCard, nextDue, describeWhen, cardId, reset as resetReview } from './review.js';

const $ = (s, r = document) => r.querySelector(s);
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((p) => p[1]);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// The decode deck is authored with `code` spans and **bold**, because a byte
// value that is not in a monospace face is much harder to read.
const mdInline = (t) => esc(t)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

let DATA = null;
const loadData = async () => (DATA ||= await (await fetch('/assets/data.json')).json());

const statKey = (k) => `snc-stat-${k}`;
const getStat = (k) => { try { return JSON.parse(localStorage.getItem(statKey(k))) || { right: 0, wrong: 0 }; } catch { return { right: 0, wrong: 0 }; } };
const setStat = (k, v) => { try { localStorage.setItem(statKey(k), JSON.stringify(v)); } catch { /* ignore */ } };

const scorebar = (right, wrong, extra = '') => `<div class="scorebar">
  <span class="score good">✓ ${right}</span>
  <span class="score bad">✗ ${wrong}</span>${extra}</div>`;

// ============================================================================
// IPv4 helpers, duplicated deliberately so practice works without tools.js
// ============================================================================

const ipToInt = (ip) => ip.trim().split('.').reduce((a, o) => a * 256 + (+o), 0) >>> 0;
const intToIp = (n) => [24, 16, 8, 0].map((s) => (n >>> s) & 255).join('.');
const maskOf = (p) => (p === 0 ? 0 : (0xFFFFFFFF << (32 - p)) >>> 0);
const netOf = (ip, p) => (ipToInt(ip) & maskOf(p)) >>> 0;
const bcastOf = (ip, p) => (netOf(ip, p) | (~maskOf(p) >>> 0)) >>> 0;
const normIp = (s) => s.trim().replace(/\s+/g, '').replace(/^\/+/, '');

// ============================================================================
// Subnetting trainer
// ============================================================================

const PREFIXES = [22, 23, 24, 25, 26, 27, 28, 29, 30];

function randomAddress() {
  const base = pick([
    () => `10.${rnd(0, 254)}.${rnd(0, 254)}.${rnd(1, 254)}`,
    () => `192.168.${rnd(0, 254)}.${rnd(1, 254)}`,
    () => `172.${rnd(16, 31)}.${rnd(0, 254)}.${rnd(1, 254)}`,
  ]);
  return base();
}
const rnd = (lo, hi) => lo + Math.floor(Math.random() * (hi - lo + 1));

function makeSubnetQuestion() {
  const kind = pick(['network', 'broadcast', 'hosts', 'range', 'talk', 'mask', 'prefix', 'fit', 'split']);
  const ip = randomAddress();
  const p = pick(PREFIXES);
  const net = intToIp(netOf(ip, p));
  const bc = intToIp(bcastOf(ip, p));
  const usable = 2 ** (32 - p) - 2;
  const blockOctet = Math.min(3, Math.floor(p / 8));
  const maskOctet = (maskOf(p) >>> (8 * (3 - blockOctet))) & 255;
  const block = 256 - maskOctet;

  const working = (extra) => `  Mask for /${p} is ${intToIp(maskOf(p))}
  Block size = 256 − ${maskOctet} = ${block}
  ${ip} falls in the block starting ${net.split('.')[blockOctet]}
  Network   ${net}
  Broadcast ${bc}
  Usable    ${intToIp(netOf(ip, p) + 1)} to ${intToIp(bcastOf(ip, p) - 1)}   (${usable.toLocaleString()} addresses)${extra || ''}`;

  switch (kind) {
    case 'network':
      return { prompt: `What is the <b>network address</b> of <code>${ip}/${p}</code>?`, tag: 'Network address', answer: net, check: (v) => normIp(v) === net, working: working() };
    case 'broadcast':
      return { prompt: `What is the <b>broadcast address</b> of <code>${ip}/${p}</code>?`, tag: 'Broadcast address', answer: bc, check: (v) => normIp(v) === bc, working: working() };
    case 'hosts':
      return { prompt: `How many <b>usable host addresses</b> are in <code>${ip}/${p}</code>?`, tag: 'Host count', answer: String(usable), check: (v) => v.replace(/[,\s]/g, '') === String(usable), working: `  Usable = 2^(32−${p}) − 2 = ${(2 ** (32 - p)).toLocaleString()} − 2 = ${usable.toLocaleString()}\n  The two you never assign are the network address and the broadcast address.` };
    case 'range': {
      const ans = `${intToIp(netOf(ip, p) + 1)}-${intToIp(bcastOf(ip, p) - 1)}`;
      return { prompt: `Give the <b>first and last usable host</b> in <code>${ip}/${p}</code>. Write them as <code>first-last</code>.`, tag: 'Usable range', answer: ans, check: (v) => normIp(v).replace(/\s*(to|-|–)\s*/gi, '-') === ans, working: working() };
    }
    case 'mask':
      return { prompt: `Write <code>/${p}</code> as a <b>dotted decimal subnet mask</b>.`, tag: 'Prefix to mask', answer: intToIp(maskOf(p)), check: (v) => normIp(v) === intToIp(maskOf(p)), working: `  /${p} means ${p} ones followed by ${32 - p} zeros.\n  ${intToIp(maskOf(p))}\n  Bit values to recognise: 0 128 192 224 240 248 252 254 255` };
    case 'prefix':
      return { prompt: `Write the mask <code>${intToIp(maskOf(p))}</code> as a <b>CIDR prefix</b>.`, tag: 'Mask to prefix', answer: `/${p}`, check: (v) => normIp(v).replace('/', '') === String(p), working: `  Count the ones: ${intToIp(maskOf(p))} is /${p}.\n  Bit values: 128=1 192=2 224=3 240=4 248=5 252=6 254=7 255=8 ones.` };
    case 'talk': {
      const same = Math.random() < 0.5;
      const a = ip;
      let b;
      if (same) b = intToIp(netOf(a, p) + rnd(1, Math.max(1, 2 ** (32 - p) - 2)));
      else b = intToIp((bcastOf(a, p) + rnd(1, 40)) >>> 0);
      const canTalk = netOf(a, p) === netOf(b, p);
      return {
        prompt: `Can <code>${a}/${p}</code> talk directly to <code>${b}/${p}</code>?`,
        tag: 'Can these two talk?', answer: canTalk ? 'yes' : 'no',
        choices: ['Yes', 'No'],
        check: (v) => v.trim().toLowerCase().startsWith(canTalk ? 'y' : 'n'),
        working: `  Apply the mask to both addresses.\n  ${a} → network ${intToIp(netOf(a, p))}\n  ${b} → network ${intToIp(netOf(b, p))}\n  The network portions ${canTalk ? 'MATCH, so yes' : 'DIFFER, so no. No cable will change this.'}`,
      };
    }
    case 'fit': {
      const need = pick([6, 12, 25, 50, 60, 100, 200, 300, 500]);
      let pr = 30;
      while (2 ** (32 - pr) - 2 < need && pr > 8) pr--;
      return {
        prompt: `You need one network holding <b>${need} devices</b>. What is the <b>smallest prefix</b> that works?`,
        tag: 'Sizing a network', answer: `/${pr}`,
        check: (v) => normIp(v).replace('/', '') === String(pr),
        working: `  /${pr} gives 2^(32−${pr}) − 2 = ${(2 ** (32 - pr) - 2).toLocaleString()} usable, which holds ${need}.\n  /${pr + 1} would give only ${(2 ** (32 - pr - 1) - 2).toLocaleString()}, which does not.`,
      };
    }
    default: {
      const want = pick([2, 4, 8, 16]);
      const basep = pick([22, 23, 24]);
      const bits = Math.log2(want);
      const np = basep + bits;
      return {
        prompt: `You have a <code>/${basep}</code> and you need <b>${want} equal subnets</b>. What prefix do you use?`,
        tag: 'Splitting a range', answer: `/${np}`,
        check: (v) => normIp(v).replace('/', '') === String(np),
        working: `  ${want} subnets needs enough borrowed bits that 2^bits ≥ ${want}.\n  2^${bits} = ${want}, so borrow ${bits} bits.\n  /${basep} + ${bits} = /${np}   mask ${intToIp(maskOf(np))}\n  Each holds ${(2 ** (32 - np) - 2).toLocaleString()} usable addresses.`,
      };
    }
  }
}

function mountSubnetTrainer(root) {
  const stat = getStat('subnet');
  let streak = 0;
  let q = null;
  const box = h('<div></div>');
  root.append(h(`<p class="tool-sub">Endless generated questions. Twenty minutes a night for a week
    beats three hours the day before. Aim for ten right in a row, twice.</p>`), box);

  const next = () => {
    q = makeSubnetQuestion();
    box.innerHTML = scorebar(stat.right, stat.wrong, `<span class="score">in a row ${streak}</span>`) + `
      <div class="q-card">
        <div class="q-meta">${q.tag}</div>
        <p class="q-prompt">${q.prompt}</p>
        ${q.choices
          ? `<div class="opts">${q.choices.map((c) => `<button class="opt" data-v="${c}"><span class="opt-k">${c[0]}</span>${c}</button>`).join('')}</div>`
          : `<div class="fields" style="margin:0"><div class="field">
              <input id="sq-in" placeholder="Your answer" autocomplete="off" spellcheck="false"></div></div>
             <div class="chip-row" style="margin:12px 0 0"><button class="chip on" id="sq-go">Check</button>
             <button class="chip" id="sq-skip">Show me</button></div>`}
      </div>`;
    // preventScroll: focusing on mount otherwise yanks the page down to the
    // answer box, hiding the class title on arrival.
    $('#sq-in', box)?.focus({ preventScroll: true });
  };

  const grade = (value, gaveUp) => {
    const right = !gaveUp && q.check(value);
    if (gaveUp) { stat.wrong++; streak = 0; }
    else if (right) { stat.right++; streak++; }
    else { stat.wrong++; streak = 0; }
    setStat('subnet', stat);

    const card = $('.q-card', box);
    card.querySelectorAll('button, input').forEach((b) => { b.disabled = true; });
    card.append(h(`<div class="q-answer">
      <p><b style="color:var(--${right ? 'green' : 'red'})">${gaveUp ? 'The answer' : right ? '✓ Correct' : '✗ Not that one'}</b>
      ${right ? '' : ` — the answer is <code>${q.answer}</code>`}</p>
      <pre class="working">${q.working}</pre>
      <div class="chip-row" style="margin:12px 0 0"><button class="chip on" id="sq-next">Next question →</button></div>
    </div>`));
    $('#sq-next', box).focus({ preventScroll: true });
  };

  box.addEventListener('click', (e) => {
    if (e.target.closest('#sq-next')) return next();
    if (e.target.closest('#sq-go')) return grade($('#sq-in', box).value, false);
    if (e.target.closest('#sq-skip')) return grade('', true);
    const opt = e.target.closest('.opt');
    if (opt) return grade(opt.dataset.v, false);
  });
  box.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if ($('#sq-next', box)) next();
    else if ($('#sq-in', box)) grade($('#sq-in', box).value, false);
  });
  next();
}

// ============================================================================
// The spaced deck shell
//
// Three decks share this: the numbers drill, spot the myth and component ID.
// A sitting is short and it ENDS, which is the whole design: the due count goes
// to zero and the page says so, rather than offering another infinite round.
// ============================================================================

function deckShell(root, {
  cards, title, newBatch = 8, renderFront, renderBack, gradeLabels = ['Missed it', 'Got it'],
}) {
  if (!cards.length) {
    root.append(h(`<p class="tool-sub">Nothing in this deck yet.</p>`));
    return;
  }

  const wrap = h(`<div class="deck-ui"></div>`);
  root.append(wrap);

  let queue = [];
  let current = null;
  let showing = false;
  let sessionRight = 0, sessionWrong = 0;
  let introduced = 0;

  const build = () => {
    const { fresh, ready } = due(cards);
    queue = ready.slice();
    return { fresh, ready };
  };

  const summary = () => {
    const c = counts(cards);
    const when = describeWhen(nextDue(cards));
    return `<div class="deck-summary">
      <div class="deck-stat"><b>${c.ready}</b><span>due now</span></div>
      <div class="deck-stat"><b>${c.fresh}</b><span>not started</span></div>
      <div class="deck-stat"><b>${c.landing}</b><span>still landing</span></div>
      <div class="deck-stat"><b>${c.known}</b><span>settled</span></div>
    </div>${when && !c.ready ? `<p class="deck-when">Next cards come back ${when}.</p>` : ''}`;
  };

  const paint = () => {
    if (current) {
      wrap.innerHTML = `<div class="deck-card">
        <div class="deck-front">${renderFront(current)}</div>
        ${showing ? `<div class="deck-back">${renderBack(current)}</div>` : ''}
      </div>
      <div class="deck-actions">
        ${showing
    ? `<button class="btn deck-wrong">${gradeLabels[0]}</button>
             <button class="btn btn-primary deck-right">${gradeLabels[1]}</button>`
    : '<button class="btn btn-primary deck-show">Show the answer</button>'}
      </div>
      <div class="deck-foot">
        <span>${queue.length} left in this sitting</span>
        <span class="deck-score">✓ ${sessionRight} · ✗ ${sessionWrong}</span>
      </div>`;
      return;
    }

    const { fresh, ready } = build();
    wrap.innerHTML = summary() + (ready.length
      ? `<div class="deck-actions"><button class="btn btn-primary deck-start">Start · ${ready.length} due</button></div>`
      : fresh.length
        ? `<p class="deck-done"><b>Nothing is due.</b> ${sessionRight + sessionWrong ? `You did ${sessionRight + sessionWrong} card${sessionRight + sessionWrong === 1 ? '' : 's'} just now. ` : ''}There are ${fresh.length} cards you have not started. New cards are never pushed at you; take a batch when you want them.</p>
           <div class="deck-actions"><button class="btn btn-primary deck-new">Start ${Math.min(newBatch, fresh.length)} new cards</button></div>`
        : `<p class="deck-done"><b>Nothing due and nothing new.</b> ${describeWhen(nextDue(cards)) ? `The deck comes back ${describeWhen(nextDue(cards))}.` : ''} That is the sitting finished.</p>`)
      + `<p class="deck-reset"><button class="btn btn-quiet deck-forget">Forget my progress on every deck</button></p>`;
  };

  wrap.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('.deck-start')) {
      build();
      current = queue.shift() || null;
      showing = false;
      paint();
      return;
    }
    if (t.closest('.deck-new')) {
      const { fresh } = due(cards);
      queue = shuffle(fresh).slice(0, newBatch);
      introduced += queue.length;
      current = queue.shift() || null;
      showing = false;
      paint();
      return;
    }
    if (t.closest('.deck-show')) { showing = true; paint(); return; }
    if (t.closest('.deck-right') || t.closest('.deck-wrong')) {
      const right = !!t.closest('.deck-right');
      gradeCard(current, right);
      if (right) sessionRight++; else { sessionWrong++; queue.push(current); }
      current = queue.shift() || null;
      showing = false;
      paint();
      return;
    }
    if (t.closest('.deck-forget')) {
      if (confirm('Forget every card’s history, on every deck, in this browser?')) {
        resetReview();
        sessionRight = 0; sessionWrong = 0;
        current = null;
        paint();
      }
    }
  });

  paint();
}

// ============================================================================
// Numbers drill
// ============================================================================

async function mountDrill(root, cls) {
  const d = await loadData();
  const all = d.drillCards;
  const cards = cls > 0 ? all.filter((c) => c.tag === `Class ${cls}`) : all;

  root.append(h(`<p class="tool-sub">Every examinable number in ${cls > 0 ? `Class ${cls}` : 'the course'},
    generated from the classes themselves so a card can never say something you were not taught.
    ${cls > 0 ? '' : `<span class="deck-chips">${['All', ...d.classes.map((c) => `Class ${c.n}`)]
      .map((n, i) => `<button class="chip${i === 0 ? ' on' : ''}" data-chip="${i === 0 ? '' : n}">${n.replace('Class ', '')}</button>`).join('')}</span>`}</p>`));

  const host = h('<div></div>');
  root.append(host);

  const build = (filter) => {
    host.innerHTML = '';
    deckShell(host, {
      cards: filter ? all.filter((c) => c.tag === filter) : cards,
      renderFront: (c) => `<p class="deck-q">${c.q}</p><p class="deck-tag">${esc(c.tag)}</p>`,
      renderBack: (c) => `<p class="deck-a">${c.a}</p>`,
    });
  };
  build(null);

  root.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    root.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === chip));
    build(chip.dataset.chip || null);
  });
}

// ============================================================================
// Spot the myth
//
// Two thirds of the claims are false, deliberately: a deck where most things
// are true trains you to say yes.
// ============================================================================

async function mountMyths(root, cls) {
  const d = await loadData();
  const myths = (cls > 0 ? d.myths.filter((m) => m.cls === cls) : d.myths)
    .map((m) => ({ ...m, tag: `Class ${m.cls}` }));

  root.append(h(`<p class="tool-sub">Every one of these is something somebody says on a production.
    Decide whether it holds before you open the answer. They are all false, and the useful part is
    being able to say exactly why.</p>`));

  const host = h('<div></div>');
  root.append(host);
  deckShell(host, {
    cards: myths,
    gradeLabels: ['I would have believed it', 'I could explain why not'],
    renderFront: (c) => `<p class="deck-claim">“${esc(c.claim)}”</p><p class="deck-tag">${esc(c.tag)}</p>`,
    renderBack: (c) => `<p class="deck-a">${esc(c.fix)}</p>`,
  });
}

// ============================================================================
// Component identification
// ============================================================================

async function mountDecode(root) {
  const d = await loadData();
  const cards = d.decodeChecks.map((b) => ({ ...b, tag: b.tag || 'Bytes' }));

  root.append(h(`<p class="tool-sub">Raw bytes out of a capture or a scope. Say what it is before you
    turn the card over. Fluency here is a real diagnostic advantage: a technician who can read a
    packet without a decoder finds faults that a decoder would have hidden behind a friendly name.</p>`));

  const host = h('<div></div>');
  root.append(host);
  deckShell(host, {
    cards,
    gradeLabels: ['Could not read it', 'Read it'],
    renderFront: (c) => `<p class="deck-q">${mdInline(c.q)}</p><p class="deck-tag">${esc(c.tag)}</p>`,
    renderBack: (c) => `<p class="deck-a">${mdInline(c.a)}</p>${c.note ? `<p class="deck-extra"><b>Why it matters:</b> ${mdInline(c.note)}</p>` : ''}`,
  });
}

// ============================================================================
// The Five Questions
//
// The recurring model of the module, drilled as a sort. The explanation after
// each answer is the actual teaching, which is why it appears whether you were
// right or wrong.
// ============================================================================

async function mountQuestions(root) {
  const { questionCards, questionMeta } = await loadData();
  const box = h('<div></div>');
  root.append(h(`<p class="tool-sub">Every protocol in this module is an answer to the same five
    questions. Here are ${questionCards.length} real answers: sort each into the question it belongs to.
    Read the explanation even when you are right, because that is where the teaching is.</p>`), box);

  let deck = [], i = 0, right = 0, placed = [];

  const start = () => { deck = shuffle([...questionCards]); i = 0; right = 0; placed = []; paint(); };

  const paint = () => {
    const cols = Object.entries(questionMeta).map(([k, v]) => `<div class="sortcol ${k}">
        <h4>${esc(v.label)}</h4><p>${esc(v.hint)}</p>
        ${placed.filter((pp) => pp.q === k).map((pp) => `<span class="sorted ${pp.ok ? 'right' : 'wrong'}">${esc(pp.t)}</span>`).join('')}
      </div>`).join('');

    if (i >= deck.length) {
      box.innerHTML = `<div class="q-card"><div class="q-meta">Finished</div>
        <p class="q-prompt">${right} out of ${deck.length}</p>
        <p>${right === deck.length
          ? 'Every one. You can now interrogate a protocol you have never met, which is the whole point of the model.'
          : right >= deck.length * 0.75
            ? 'Solid. Look back at the ones marked red and read why, particularly any in the fifth column.'
            : 'Worth another run. These five questions are the frame every session in the module hangs on.'}</p>
        <div class="chip-row" style="margin:12px 0 0"><button class="chip on" id="fq-again">Shuffle and go again</button></div></div>
        <div class="sortgrid">${cols}</div>`;
      return;
    }

    const c = deck[i];
    box.innerHTML = `<div class="scorebar"><span class="score">${i + 1} of ${deck.length}</span>
        <span class="score good">\u2713 ${right}</span></div>
      <div class="q-card"><div class="q-meta">Which question is this an answer to?</div>
        <p class="q-prompt">${esc(c.t)}</p>
        <div class="opts">${Object.entries(questionMeta).map(([k, v]) =>
          `<button class="opt" data-q="${k}"><span class="opt-k">\u25b8</span>${esc(v.label)}</button>`).join('')}</div>
      </div>
      <div class="sortgrid">${cols}</div>`;
  };

  box.addEventListener('click', (e) => {
    if (e.target.closest('#fq-again')) return start();
    const btn = e.target.closest('.opt[data-q]');
    if (!btn) return;
    const c = deck[i];
    const ok = btn.dataset.q === c.q;
    if (ok) right++;
    placed.push({ t: c.t, q: c.q, ok });

    const card = $('.q-card', box);
    card.querySelectorAll('.opt').forEach((b) => {
      b.disabled = true;
      if (b.dataset.q === c.q) b.classList.add('right');
      else if (b === btn) b.classList.add('wrong');
    });
    card.append(h(`<div class="q-answer">
      <p><b style="color:var(--${ok ? 'green' : 'red'})">${ok ? '\u2713' : '\u2717'} ${esc(questionMeta[c.q].label)}.</b> ${esc(c.why)}</p>
      <div class="chip-row" style="margin:10px 0 0"><button class="chip on" id="fq-next">Next \u2192</button></div></div>`));
    $('#fq-next', box).onclick = () => { i++; paint(); };
    $('#fq-next', box).focus({ preventScroll: true });
  });

  start();
}

// ============================================================================
// Fault diagnosis simulator
//
// Scored on the ORDER you investigate in, not on whether you eventually
// guessed. That is the whole point: a method that works on faults nobody has
// seen is worth more than a memory of this particular one.
// ============================================================================

async function mountFaults(root, cls) {
  const d = await loadData();
  const pool = cls > 0 ? d.faultScenarios.filter((s) => s.cls === cls || !s.cls) : d.faultScenarios;
  if (!pool.length) { root.remove(); return; }

  root.append(h(`<p class="tool-sub">A symptom, and eight things you could do about it. Each test
    costs time. You are scored on the order you investigate in, because that is the part that
    transfers to a fault nobody has seen.</p>`));

  const host = h('<div class="fault-sim"></div>');
  root.append(host);

  let scenario = null;
  let done = [];
  let finished = false;

  const start = () => {
    scenario = pick(pool);
    done = [];
    finished = false;
    paint();
  };

  const cost = () => done.reduce((s, i) => s + scenario.steps[i].cost, 0);

  const paint = () => {
    if (!scenario) { start(); return; }
    const best = scenario.steps.filter((s) => s.good).reduce((a, b) => a + b.cost, 0);
    host.innerHTML = `
      <div class="fault-head">
        <p class="fault-symptom"><b>Reported:</b> ${esc(scenario.symptom)}</p>
        <p class="fault-context">${esc(scenario.context)}</p>
      </div>
      <ol class="fault-steps">
        ${scenario.steps.map((s, i) => {
    const used = done.includes(i);
    return `<li class="fault-step${used ? ' used' : ''}${used && s.good ? ' good' : ''}${used && !s.good ? ' waste' : ''}">
            <button class="fault-btn" data-step="${i}"${used || finished ? ' disabled' : ''}>
              <span class="fault-t">${esc(s.text)}</span>
              <span class="fault-c">${s.cost} min</span>
            </button>
            ${used ? `<p class="fault-result">${esc(s.result)}</p>` : ''}
          </li>`;
  }).join('')}
      </ol>
      <div class="fault-foot">
        <span class="fault-clock">${cost()} minutes spent${finished ? '' : ` · best possible ${best}`}</span>
        ${finished
    ? `<button class="btn btn-primary fault-next">Another fault</button>`
    : `<button class="btn fault-reveal">I know the cause</button>`}
      </div>
      ${finished ? `<div class="fault-verdict">
        <p><b>The cause.</b> ${esc(scenario.cause)}</p>
        <p><b>The fix.</b> ${esc(scenario.fix)}</p>
        <p><b>Prevention.</b> ${esc(scenario.prevent)}</p>
        <p class="fault-score">${verdict(cost(), best)}</p>
      </div>` : ''}`;
  };

  const verdict = (spent, best) => {
    const wasted = done.filter((i) => !scenario.steps[i].good).length;
    if (wasted === 0) return `No wasted tests. ${spent} minutes against a best possible ${best}. That is the method working.`;
    if (wasted <= 2) return `${wasted} test${wasted === 1 ? '' : 's'} that could not have narrowed the boundary. ${spent} minutes against ${best}.`;
    return `${wasted} tests that did not narrow anything. Establish the boundary first: what works, what does not, and where the line between them is. The fault is on that line.`;
  };

  host.addEventListener('click', (e) => {
    const b = e.target.closest('.fault-btn');
    if (b) { done.push(Number(b.dataset.step)); paint(); return; }
    if (e.target.closest('.fault-reveal')) { finished = true; paint(); return; }
    if (e.target.closest('.fault-next')) { start(); }
  });

  start();
}

// ============================================================================
// Readiness check
//
// It tests the PREREQUISITE, not the content, and every wrong answer names the
// exact thing to go and fix rather than reporting a score.
// ============================================================================

async function mountReady(root, cls) {
  const d = await loadData();
  const qs = d.readiness[cls];
  if (!qs || !qs.length) { root.remove(); return; }

  root.append(h(`<p class="tool-sub">Five questions about what this class <em>assumes</em>, not about
    what it teaches. There is no score. Each wrong answer names the one thing to go and fix.</p>`));

  const host = h('<div class="ready-quiz"></div>');
  root.append(host);
  const answers = new Array(qs.length).fill(null);

  const paint = () => {
    host.innerHTML = qs.map((q, i) => {
      const a = answers[i];
      return `<div class="ready-q${a == null ? '' : a === q.correct ? ' right' : ' wrong'}">
        <p class="ready-text"><span class="ready-n">${i + 1}</span>${esc(q.q)}</p>
        <div class="ready-opts">
          ${q.options.map((o, k) => `<button class="ready-opt${a === k ? (k === q.correct ? ' on-right' : ' on-wrong') : ''}${a != null && k === q.correct ? ' is-right' : ''}"
            data-q="${i}" data-o="${k}"${a == null ? '' : ' disabled'}>${esc(o)}</button>`).join('')}
        </div>
        ${a == null ? '' : `<p class="ready-why">${esc(a === q.correct ? q.why : q.fix)}${q.src ? ` <a href="${q.src.to}">${esc(q.src.label)} →</a>` : ''}</p>`}
      </div>`;
    }).join('') + (answers.every((a) => a != null)
      ? `<p class="ready-done">${answers.filter((a, i) => a === qs[i].correct).length === qs.length
        ? '<b>Ready.</b> Nothing here needs fixing before the class.'
        : '<b>Two or three of these are worth an hour before the class.</b> Each answer above names the specific thing, and the link goes straight to where it is covered.'}</p>`
      : '');
  };

  host.addEventListener('click', (e) => {
    const b = e.target.closest('.ready-opt');
    if (!b) return;
    answers[Number(b.dataset.q)] = Number(b.dataset.o);
    paint();
  });
  paint();
}

// ============================================================================
// Glossary
// ============================================================================

function mountGlossary() {
  const filter = $('#gloss-filter');
  const body = $('#gloss-body');
  const count = $('#gloss-count');
  const cardsBtn = $('#gloss-cards');
  const flash = $('#gloss-flash');
  if (!filter || !body) return;

  const rows = [...body.querySelectorAll('tbody tr')];
  const total = rows.length;
  const setCount = (n) => { if (count) count.textContent = n === total ? `${total} terms` : `${n} of ${total}`; };
  setCount(total);

  filter.addEventListener('input', () => {
    const q = filter.value.trim().toLowerCase();
    let shown = 0;
    for (const r of rows) {
      const hit = !q || r.textContent.toLowerCase().includes(q);
      r.hidden = !hit;
      if (hit) shown++;
    }
    // A section with nothing left in it is noise.
    for (const tbl of body.querySelectorAll('.table-wrap')) {
      const any = [...tbl.querySelectorAll('tbody tr')].some((r) => !r.hidden);
      tbl.hidden = !any;
      let prev = tbl.previousElementSibling;
      while (prev && !/^H[23]$/.test(prev.tagName)) prev = prev.previousElementSibling;
      if (prev) prev.hidden = !any;
    }
    setCount(shown);
  });

  if (!cardsBtn || !flash) return;
  let on = false;
  cardsBtn.addEventListener('click', async () => {
    on = !on;
    cardsBtn.textContent = on ? 'Back to the list' : 'Flashcard mode';
    body.hidden = on;
    flash.hidden = !on;
    if (on && !flash.dataset.mounted) {
      flash.dataset.mounted = '1';
      const d = await loadData();
      deckShell(flash, {
        cards: d.glossCards,
        gradeLabels: ['Did not know it', 'Knew it'],
        renderFront: (c) => `<p class="deck-q">${esc(c.q)}</p><p class="deck-tag">${esc(c.tag)}</p>`,
        renderBack: (c) => `<p class="deck-zh">${esc(c.zh)}</p><p class="deck-a">${esc(c.a)}</p>`,
      });
    }
  });
}

// ============================================================================
// Mount
// ============================================================================

const WIDGETS = {
  drill: mountDrill,
  myths: mountMyths,
  decode: mountDecode,
  questions: mountQuestions,
  subnetdrill: mountSubnetTrainer,
  faults: mountFaults,
  ready: mountReady,
};

for (const node of document.querySelectorAll('.practice[data-practice]')) {
  if (node.dataset.mounted) continue;
  const fn = WIDGETS[node.dataset.practice];
  if (!fn) { node.remove(); continue; }
  node.dataset.mounted = '1';
  Promise.resolve(fn(node, Number(node.dataset.class) || 0)).catch((err) => {
    console.error('practice failed:', node.dataset.practice, err);
    node.remove();
  });
}

mountGlossary();
