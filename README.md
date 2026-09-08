# Show Networking and Control Systems

An interactive teaching platform for a module of **eight three-hour sessions**, from a contact
closure to a converged show network carrying audio, video, lighting and cues on one set of cables.

It answers one question, repeatedly, from different angles:

> Why does a signal that leaves a console correctly arrive at a fixture wrong, and how do you find
> out which of the twenty agreements between them was never actually made?

---

## The spine

Everything hangs off one sentence, which students should be able to say by the end of Session 1 and
defend with a packet capture by the end of Session 8:

> **A show control system is a chain of agreements. Every link is two devices that agreed what a
> signal means, and nearly every failure you will chase is a link where that agreement was never
> actually made.**

Under it sits one model that recurs in every session, **the Five Questions**. Ask them of any
protocol and you have understood it well enough to design with it:

1. **What is a message?** Where does one start and stop, how big is it, what is in it?
2. **Who is it for?** Broadcast, unicast, a group, or nobody in particular?
3. **When must it arrive?** Hard deadline, soft, or whenever?
4. **How do you know it arrived?** Acknowledged, repeated, or never confirmed at all?
5. **What happens when it does not?**

The fifth is the professional one, and it is the one specified in a sentence or not at all. Anybody
can look up a packet format. Knowing that a fixture holds its last look, that an amplifier mutes a
few seconds after losing clock, and that a hoist stops and holds, is what makes somebody useful in a
production meeting.

---

## The module

Twenty four hours in three units. **Session 1 has already been taught**; it is published because the
seven that follow all assume it and a student who missed it needs somewhere to go.

| Unit | # | Session | Chapters |
|---|---|---------|---|
| 1 · Foundations | 1 | The Argument, and Control Basics | 1–10 |
| | 2 | Signals, Numbers and the Rules We Design By | 11–13 |
| 2 · Data communication and networking | 3 | How a Bit Crosses a Gap | 14–15 |
| | 4 | Ethernet and IP: The Network Under Every Show | 16–17 |
| | 5 | Running a Real Show Network | 18 |
| 3 · Standards and protocols | 6 | DMX512-A, RDM, RDMnet and sACN | 19–21 |
| | 7 | Cueing Between Systems | 22–24 |
| | 8 | Time, Interchange and Everything Else | 25–27 |

Each session is 180 minutes, accounted for on the page: roughly 75 to 80 minutes on the idea, 60 to
75 on real kit, a break, and ten minutes at each end. **The build fails if a session's plan does not
add up to three hours.**

### The syllabus contract

The module is specified against the twenty seven chapters of the standard text, John Huntington's
*Show Networks and Control Systems*. Each session declares the chapters it discharges, and
**the build refuses to ship unless every chapter from 1 to 27 is claimed by exactly one session.**

The **order inside a session is not the book's**. It follows a signal from a switch contact to a
fixture across a network, which puts the number work and the design principles first, the network in
the middle, and the protocols last in the order they sit in a signal path.

### What is brought up to date

The text is more than a decade old, and where the industry has moved on the session says so and
teaches current practice rather than a museum piece:

| Area | What the sessions add |
|---|---|
| Lighting | **RDMnet (E1.33, 2019)** and **sACN E1.31-2018**, both of which postdate the text; Art-Net 4; pixel-scale rigs and what they do to a network |
| Networks | IGMPv3, MSTP, LACP, DSCP, 802.3bt PoE, multi-gigabit copper, and the current diagnostic toolset |
| Time | **PTPv2 (IEEE 1588-2019)**, SMPTE ST 2059-2, gPTP, and the three ways a PTP domain actually goes wrong |
| Cueing | MIDI 2.0 and UMP, **RTP-MIDI (RFC 6295)**, and the OSC, HTTP, WebSocket and Companion layer that has quietly replaced most MSC integrations |
| Media | Dante, AES67, Milan, **ST 2110**, NDI, SRT, and why HDBaseT is not a network |
| Interchange | **PosiStageNet** and current tracking, MQTT, OPC UA, Modbus TCP |
| Safety | **EN 17206**, EN ISO 13849, IEC 62061, rated safety buses, and the boundary between a show network and a machinery safety system drawn explicitly |
| Security | Treated as a design principle rather than an afterthought, on the honest basis that almost no protocol here authenticates anything |

---

## What is in the platform

- **92 interactive explainers**, placed inline where each idea is taught. Every one shows a real
  mechanism with the numbers used in the prose beside it, and the controls exist to *break* it:
  remove a pull-up and watch an input pick up the room, defeat a 5 kV optocoupler with one rack
  screw, drag a subnet boundary through 32 bits, let IGMP memberships age out four minutes after the
  rig was proved, make a PTP path asymmetric and watch the error appear with nothing reporting it,
  drop a cue and watch a device stay permanently one behind.
- **20 calculators**, each printing its working, because the assessment awards method marks: subnets
  and splits, VLAN plans, PoE budgets, DMX timing, universe and sACN multicast addressing, pixel
  loads, MIDI and MSC messages, timecode with drop-frame arithmetic, and clock drift.
- **Teach mode**, a projector view with one idea per screen, two clocks, a whiteboard overlay, and
  every figure live with the same controls.
- **Practice**: an endless subnetting trainer, a fault diagnosis simulator scored on **the order you
  investigate in**, the Five Questions sort over 32 real answers, a 35-card byte-decoding deck, spot
  the myth, and flashcards for every examinable number.
- **A preparation path.** Every session states what you must already be able to do, three concrete
  tasks, and what to bring. A five-question readiness check tests the *prerequisite* rather than the
  content and names the exact thing to go and fix.
- **A printable design principles card**, a printable field card of the commands you type in a
  venue, a generated numbers card, and a **bilingual glossary of 286 terms**, English and 繁體中文.

Nothing is scored, reported or compared. Everything a student does is stored in their own browser
and never leaves the device.

---

## Repo layout

| Path | What |
|------|------|
| `01` to `08` | The eight sessions, one markdown file each |
| `foundations.md` | Bits, bytes, powers of two, binary and hex. The arithmetic every session assumes |
| `principles.md` | The seven design principles and the troubleshooting method. Printable |
| `field-card.md` | The commands you type and the settings you change in a venue. Printable |
| `lineage.md` | Why each technology exists and what it charged for itself |
| `glossary.md` | 286 terms, EN and 繁中 |
| `next.md` | Standards, certifications, kit and reading |
| `site/` | The static site generator and the platform itself |

Each session file carries its own `## Before you come`, `## Run of the session`,
`## Common misconceptions` and `## Numbers from this session` sections. The build turns those into
the prepare page, the session plan, the myth deck and the numbers card respectively, so **none of
them can drift from what is actually taught**.

---

## Running it

Zero dependencies. Node 18 or newer.

```bash
node site/build.mjs     # renders the markdown into site/public
node site/serve.mjs     # http://localhost:4173
```

## Deploying

`vercel.json` at the repository root configures the build:

```
buildCommand      node site/build.mjs
outputDirectory   site/public
installCommand    echo 'no dependencies'
```

Root directory stays the repository root on purpose. Pointing Vercel at `site/` would cut the build
off from `../*.md`, and the markdown must not be duplicated to work around that. `site/vercel.json`
carries the equivalent settings for deploying that folder standalone; in that case put a copy of the
markdown in `site/content/`, which `build.mjs` prefers over `../` when it exists.

---

## Design notes

**The markdown is the single source of truth.** The generator reads it and emits static HTML. The
numbers card, the flashcard deck and the myth deck are all generated from the session files at build
time, so a reworded table changes every place that number appears.

**The build refuses to ship something broken.** It fails on: a session plan that does not total three
hours; a chapter claimed twice or not at all; a `<!--anim:id-->` marker not alone on its line; a
figure named in the prose that no module registers; a missing required section; a misconception
bullet that is not `- **"claim"** correction`; a readiness pointer that resolves to a route or an id
that does not exist; a repeated element id on a linkable page; and a figure whose module gives it no
title, which would leave the map labelling it by its section heading.

**Figures show mechanisms, not decoration.** Four rules they all follow: the numbers in a figure are
the numbers in the prose beside it; the controls exist to push the system into the failure the
session is about; colour means one thing everywhere (amber is energy and anything live, cyan is
signal and data, green is safe or verified, red is a fault); and everything pauses off screen and
honours `prefers-reduced-motion`, because a page of running canvases on a projector laptop is a real
cost.

**They are verified in a browser, not by reading.** Every route is loaded, every figure mounted,
every slider driven to both extremes and every toggle and option clicked, with console errors
treated as failures. Two automated checks then look for ink in the bottom and right edges of each
canvas at 1100px and at 420px, which is how about twenty clipped reference tables and one overflowing
bar were found.

**No dependencies, deliberately.** A hand-rolled markdown subset parser and vanilla JavaScript, so
the site builds anywhere Node runs with nothing to install and nothing to go stale.

**Nothing phones home.** No analytics, no third-party requests, no accounts. Progress, the spaced
repetition state and the theme are stored per browser and never leave the device.

---

## Where this sits, and the other three courses

**This one is an elective, and it assumes none of the others.** That is a design constraint rather
than a disclaimer: a room here can contain a Technical Direction student who has done Electronics, a
Media Design student who has done Computer Systems, and somebody who has done neither, all at once.
Session 1 therefore starts from nothing, and every session says what it assumes.

Three doors people arrive through, and what each brings:

| If you came from | You already have | What will be new |
|---|---|---|
| [Electronics for Theatre](https://github.com/deliseph/electronics-for-theatre) (TD year 1) | The physical layer: RS-485, termination, what is on the pair | Everything above the wire: the agreements themselves |
| [Computer Systems and Networking](https://github.com/deliseph/theatre-computer-systems) (MDT year 1) | Subnets, VLANs, multicast, the OSI ladder | The protocols riding on them, and what each specifies on loss |
| [Computer Science for Theatre](https://computer-science-theatre.vercel.app/) (TD year 2) | What the endpoint's code does with a message | What the message is required to be |
| Neither | The foundations page here is complete on its own | All of it, and Session 1 assumes nothing |

Where two of these reach the same object they reach it from different positions. DMX here is a
standard with a specified behaviour on loss; in Electronics it is a differential pair on a scope; in
Computer Systems it is a quantity of data. The full map is
[how the four relate](https://computer-science-theatre.vercel.app/alignment).

---

## Licence

Not yet chosen. Until one is added here, treat this as **all rights reserved**: readable, not
licensed for reuse.
