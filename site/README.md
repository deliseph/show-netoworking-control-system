# Teaching platform

The interactive site for the eight sessions. Static, zero dependencies.

## Local

```bash
node build.mjs      # renders ../*.md into ./public
node serve.mjs      # http://localhost:4173
```

## How it is built

`build.mjs` reads the authored markdown one directory up, so the markdown stays the single source of
truth and nothing is duplicated. It emits 28 static routes into `public/`.

| Piece | File |
|-------|------|
| Markdown subset parser | `lib/markdown.mjs` |
| Site generator, routes, syllabus contract, cross-reference checks, search index | `build.mjs` |
| Exercise data written by hand | `data/interactive.mjs` |
| Shell: theme, nav, tabs, search, progress | `assets/app.js` |
| Figure framework: canvas, controls, palette, mounting | `assets/anim-core.js` |
| Three reusable figure shapes: chain, compare, ladder, plus plot | `assets/anim-kit.js` |
| 92 figures, grouped by session | `assets/anim-basics.js`, `anim-comms.js`, `anim-net.js`, `anim-shownet.js`, `anim-lighting.js`, `anim-cue.js`, `anim-time.js`, `anim-extra.js` |
| 20 calculators | `assets/tools.js` |
| Spaced decks, subnetting trainer, fault simulator, readiness checks, glossary | `assets/practice.js` |
| Leitner box for the decks | `assets/review.js` |
| Projector mode, block clock | `assets/teach.js` |
| Whiteboard overlay for the projector | `assets/board.js` |
| The module map | `assets/map.js` |
| Design system | `assets/styles.css` |

The numbers card, the flashcard deck, the myth deck and the session plans are all generated from the
session files at build time, so none of them can drift from what is taught.

`data/interactive.mjs` holds only what the prose cannot supply: model answers for the self tests, the
readiness questions with their distractors, the fault scenarios with a time cost on each step, the
byte-decoding deck, and the Five Questions cards.

## The checks the build runs

The build fails rather than shipping something broken:

- A session whose `## Run of the session` does not total 180 minutes.
- A chapter of the syllabus claimed by two sessions, or by none.
- A `<!--anim:id-->`, `<!--ready:n-->` or `<!--video:…-->` marker not alone on its line.
- A figure named in the prose that no module ever `register()`s.
- A session file with no `## Before you come` or `## Numbers from this session` section.
- A misconception bullet that is not `- **"claim"** correction`.
- A readiness pointer that resolves to a route or an id that does not exist.
- A repeated element id anywhere on a page that other pages link into.
- A figure on a session page whose module does not give it a title.

## Adding a session

1. Write the markdown alongside the others, with the four required sections.
2. Add an entry to `CLASSES` in `build.mjs`: file, title, strap, the chapters it covers, and which
   tools and practice widgets the page should carry.
3. Add it to a unit in `UNITS`, and make sure the chapters it claims are not claimed elsewhere.

## Adding a figure

1. `register('some-id', (host) => { … })` in the module for its session, giving it a `title`.
2. Put `<!--anim:some-id-->` alone on its own line in the prose, exactly where the idea is
   introduced. It is carried into teach mode and onto the module map for free.

For a figure whose subject is a sequence, a set of options or a range of magnitudes, use `chain`,
`compare` or `ladder` from `anim-kit.js` rather than drawing it by hand: one interaction learned once
is worth more to a student than ninety slightly different ones.

Hand-drawn figures use a fixed canvas height, so after adding one, check that it does not paint past
the bottom or right edge at both a laptop and a phone width. That is a real and easy mistake, and it
silently eats the last rows of a reference table.
