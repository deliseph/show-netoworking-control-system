// Interactive practice: the numbers drill, spot the myth, component
// identification, the fault diagnosis simulator, and the glossary tools.
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

let DATA = null;
const loadData = async () => (DATA ||= await (await fetch('/assets/data.json')).json());

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

async function mountParts(root) {
  const d = await loadData();
  const cards = d.benchChecks.map((b) => ({ ...b, tag: b.tag || 'Components' }));

  root.append(h(`<p class="tool-sub">A marking, a package or a symptom. Name the part, its value and
    how it fails. The markings here are the ones that are not obvious, because the obvious ones do
    not need practising.</p>`));

  const host = h('<div></div>');
  root.append(host);
  deckShell(host, {
    cards,
    gradeLabels: ['Did not know it', 'Knew it'],
    renderFront: (c) => `<p class="deck-q">${esc(c.q)}</p><p class="deck-tag">${esc(c.tag)}</p>`,
    renderBack: (c) => `<p class="deck-a">${esc(c.a)}</p>${c.fails ? `<p class="deck-extra"><b>Fails by:</b> ${esc(c.fails)}</p>` : ''}`,
  });
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
  parts: mountParts,
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
