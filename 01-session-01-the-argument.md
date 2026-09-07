# Session 1 — The Argument, and Control Basics

> Every discipline in this building has spent forty years solving the same problem separately.
> This module is what happened when they had to share a cable.

## Before you come

### What you must already be able to do

Nothing. This is the opening session and it assumes only that you have stood in a venue while a
show was being made, and that you can multiply and divide without a calculator.

If you are reading this **after** the session, because you missed it or because Session 2 assumed
something you did not have, this page is the whole of it. Read the two figures on architectures and
the Five Questions carefully. Everything from Session 2 onwards is built on them.

### Three things to do

1. **Write down every device in one venue that receives an instruction.** Not every device: every
   device that is *told* something by something else. Consoles, dimmers, fixtures, media servers,
   amplifiers, motors, projectors, the house light panel, the show relay. You will be surprised how
   long the list is, and how few of the items on it are on the same system.
2. **Find one cue sheet or one show file** from a production you were on and read it as a document
   rather than as a task list. What is a cue on it? What triggers each one? How many different
   people press something?
3. **Ask one operator what happens when it fails.** Not what they do when it fails, what the
   *equipment* does. Does the light hold, go out, go to a look? Does the audio mute or continue?
   That single question is the most useful one in this module and almost nobody asks it.

### What to bring

A notebook you will keep for the whole module. Everything after this session produces a
measurement, a capture or a configuration, and the notes are the deliverable.

<!--ready:1-->

---

## Run of the session

| Min | Block | What happens |
| --- | --- | --- |
| 10 | Open | Why an artist is in a networking class |
| 35 | The idea | What entertainment control is: system, network, standard, and the argument for all of it |
| 35 | The idea | The nine disciplines and what each one actually needs from a control system |
| 15 | Break |  |
| 35 | The idea | Cues, cueing methods, operational modes, commands against data, feedback |
| 40 | Lab | Walk one venue and map its control paths onto the architecture diagram |
| 10 | Close | The Five Questions, and what Session 2 assumes |

---

## The one sentence

Everything in the next twenty one hours hangs off one sentence. You should be able to say it by the
end of today and defend it with a packet capture by the end of Session 8.

> **A show control system is a chain of agreements. Every link is two devices that agreed what a
> signal means, and nearly every failure you will chase is a link where that agreement was never
> actually made.**

That is not a metaphor. A contact closure is an agreement that a closed circuit means *go*. DMX512
is an agreement that the ninth byte after the break is the tilt of the third fixture. A subnet mask
is an agreement about which part of an address is the street and which is the house. sACN priority
is an agreement about who wins when two consoles disagree.

Take away the agreement and the electricity still flows, the packets still arrive, and nothing
works. That is why this subject is taught as protocols rather than as cables.

---

## What entertainment control actually is

### A system

A system is a set of parts that together do something none of them does alone. That definition is
tediously general until you notice what it excludes: a pile of correctly specified equipment is not
a system, and most of the trouble in this industry comes from people who bought the first and
believed they had the second.

The parts that matter in a show control system are always the same five:

- **A source of intent.** A person pressing GO, a timecode reader, a sensor, a schedule.
- **A controller.** The thing that turns intent into instructions. A lighting console, a show
  controller, a media server, a PLC.
- **A transport.** The thing the instruction travels on. A cable, a network, a radio link.
- **A device.** The thing that does something physical: a fixture, an amplifier, a motor, a valve.
- **Feedback, or the absence of it.** Whether the system can find out what actually happened.

The fifth is the one that separates the disciplines from each other, and it is why lighting and
stage machinery cannot use the same approach even when they could use the same cable.

<!--anim:system-parts-->

### A network

A network is a shared transport with addressing. That is the whole of it. The moment more than two
devices share a path, you need a way of saying which of them a message is for, and every difference
between the protocols in this course comes from a different answer to that question.

DMX512 answers it by *not* answering it: everything hears everything, and a device picks out the
bytes it was told to care about. IP answers it with a 32-bit address and a routing table. sACN
answers it with a multicast group per universe. Each answer buys something and costs something, and
knowing which is which is most of the skill.

### A standard

A standard is an agreement written down by people who will never meet you, so that two products
built by companies who dislike each other will work together. Four bodies matter in this industry:

| Body | What they publish here | Examples |
| --- | --- | --- |
| ESTA / PLASA | The E1 series, the entertainment ones | DMX512-A (E1.11), RDM (E1.20), sACN (E1.31), RDMnet (E1.33) |
| AES | Audio | AES3, AES67, AES70 |
| SMPTE | Picture and time | SMPTE 12M timecode, ST 2110, ST 2059 |
| IEEE | The network itself | 802.3 Ethernet, 802.1Q VLANs, 802.11 Wi-Fi, 1588 PTP |

There is a fifth category worth naming because it is where a lot of real work now happens:
**de facto standards with no body at all.** Art-Net is published by one company. OSC is a paper from
a university music lab. NDI is owned by a manufacturer. Dante is a proprietary product licensed to
hundreds of makers. All four are more widely deployed than several ratified standards, and none of
them owes you compatibility.

> **The practical difference.** A ratified standard has a document you can cite in a contract and a
> process for fixing it when it is wrong. A de facto standard has a company. When the company
> changes its mind, your rig is what changes.

---

## The nine disciplines, and what each one needs

The reason this subject exists is that nine separate crafts, each with its own history, ended up
needing to talk to each other. They do not want the same things from a control system, and pretending
otherwise is how a system gets designed that serves none of them.

<!--anim:discipline-map-->

Read that figure with one question in mind: *what happens on this discipline if a message is late,
and what happens if it never arrives?* The answers range from "nobody notices" to "somebody is
crushed", and that range is the entire argument for keeping certain traffic off certain networks.

### The pattern underneath

Strip the equipment away and there are only three postures:

- **State-based.** The controller continuously says what the world should look like *right now*.
  Lighting is the type example: DMX repeats the full picture forty times a second. A lost packet is
  self-healing, because another complete picture arrives 22 milliseconds later.
- **Event-based.** The controller says *do this thing now* and then says nothing. MIDI Show Control
  is the type example. A lost message is not self-healing: the cue simply never happened, and the
  system has no idea.
- **Streamed.** A continuous flow that must arrive in order and on time: audio, video, timecode. A
  lost packet is a click or a dropped frame, and lateness is as bad as loss.

Almost every design mistake in this industry is treating one of those as another. Sending lighting
levels as events, so a missed one sticks. Sending a cue as state, so it fires forever. Putting a
stream on a link with no reservation and being surprised on the busiest night.

<!--anim:posture-compare-->

---

## Cues

A cue is the unit of intent in live performance. Everything else is plumbing.

Formally: a cue is **a change, at a moment, that somebody is responsible for.** All three parts
matter. A change with no moment is a preset. A moment with no responsible person is an automation,
which is fine until it is wrong. And a change nobody is responsible for is how shows hurt people.

### How cues get triggered

| Method | What triggers it | Where it is right |
| --- | --- | --- |
| Manual | A person presses GO | Anything with a human judgement in it, which is most theatre |
| Timecode | A clock running against a recording | Anything locked to fixed media: musicals with tracks, arena tours |
| Follow / auto-follow | The previous cue finishing | Chained looks inside one moment |
| Trigger, external | A contact closure, MIDI, OSC, a network message from another system | Cross-discipline handoffs |
| Sensor | A limit switch, a beam break, a tracking system | Interactive and themed entertainment |
| Schedule | A clock and a calendar | Attractions, installations, retail, architectural |

The important observation is that **the trigger and the cue are different things**, and confusing
them is common. "The video cue" is not a cue: it is a device receiving a cue. The cue is the moment.

<!--anim:cue-anatomy-->

### Operational modes

Nearly every controllable device has more modes than an operator knows about, and the ones that
cause trouble are the ones that look identical from the front:

- **Manual** — a human drives it directly, and the control system is out of the loop.
- **Programmed / playback** — it runs a stored sequence.
- **Remote / slaved** — it does what an external system says.
- **Standalone / fallback** — what it does when the external system stops talking.
- **Service / test** — what a technician put it in at 14:00 and forgot about.

The fourth is the one worth writing down for every device in a rig, and the fifth is the one that
ruins a technical rehearsal.

---

## Commands, data, and the difference

This distinction runs through the whole module.

- A **command** says *do something*: GO, STOP, FIRE, OPEN. It is an event. It happens once. If it is
  missed, nothing recovers it.
- **Data** says *this is the value*: channel 42 is at 173, fader 3 is at −6 dB, the axis is at
  2.41 m. It is state. It is usually repeated. If a copy is missed, the next one fixes it.

<!--anim:command-vs-data-->

Protocols are usually good at one and bad at the other. DMX512 is a pure data protocol with a
crowbar for commands hammered in later. MIDI Show Control is a pure command protocol with no way to
express a value. OSC will carry either and gives you no help deciding which you sent.

### Data relationships

When two systems share a value, one of them has to be right. The three arrangements:

- **Master / slave (better: source and follower).** One system owns the value, the other reflects
  it. Simple, and the only one worth using if you can.
- **Peer.** Both may change it, and you need a rule for who wins. sACN priority is exactly this
  rule, written down.
- **Merged.** Both contribute and an algorithm combines them: highest takes precedence, latest takes
  precedence, or a weighted sum. Powerful and, in a fault, extremely confusing to diagnose.

### Feedback

Feedback is the difference between control and hope.

An **open loop** system sends an instruction and assumes it worked. Almost all lighting control is
open loop: the console has no idea whether the lamp lit. A **closed loop** system finds out. Stage
machinery is always closed loop, because the alternative is unacceptable.

The middle case, which is most of a modern rig, is **reported state without control coupling**: RDM
tells you a fixture's lamp hours, Dante Controller shows you a device dropped off the network, a
media server reports it is out of disc. That is telemetry, not feedback, and it is worth more than
people think and less than the marketing says.

<!--anim:feedback-loop-->

---

## System architectures

How the intelligence is distributed decides how the system fails, which is the only thing about it
worth remembering.

<!--anim:architectures-->

Three real observations, none of which are in a manufacturer's brochure:

**Centralised systems fail completely and obviously.** One box knows everything, and when it stops,
so does the show, and everybody in the building knows why within ten seconds. That clarity is
underrated. The fix is a spare box and a rehearsed changeover.

**Distributed systems fail partially and confusingly.** Three of eight zones stop, or one fixture
type behaves strangely, and finding out why takes an hour that the show does not have. In exchange
they degrade instead of stopping, which is usually the right trade for a permanent installation and
usually the wrong one for a one-off event where you have a technician per zone anyway.

**Almost every real system is hybrid**, and the failure to say so on the drawing is why nobody can
find the thing that broke.

---

## The Five Questions

Here is the tool you will use for the rest of the module, and for the rest of your working life
whenever somebody hands you a protocol you have never met.

<!--anim:five-questions-->

Ask these five questions of any control protocol and you have understood it well enough to design
with it:

1. **What is a message?** Where does one start and stop, how big is it, what is in it?
2. **Who is it for?** Broadcast to everybody, addressed to one, a group, or nobody in particular?
3. **When must it arrive?** Hard deadline, soft deadline, or whenever?
4. **How do you know it arrived?** Acknowledged, repeated, or never confirmed at all?
5. **What happens when it does not?** The one nobody documents.

Every protocol page in this module ends with its five answers. By Session 8 you will have twenty of
them, and the comparison between them is the actual content of the course.

> **The fifth question is the professional one.** Anybody can look up a packet format. Knowing that
> a fixture holds its last look when DMX stops, that an amplifier on Dante mutes after a few seconds
> of no clock, and that a hoist under a lost network connection stops and holds rather than
> continuing, is what makes you useful in a production meeting.

---

## Extension: what this module is not

It is not a networking qualification. It is not an installation course. It will not make you a
lighting programmer, and it does not cover the interior of any one console.

What it does is make you the person in the room who can say, with reasons, "that will not work, and
here is the number", and be right. That is a smaller skill than it sounds and it is remarkably rare.

---

## Common misconceptions

- **"Show control is for big shows."** The smallest useful show control system is a contact closure
  from a lighting console to a sound playback machine, and it costs almost nothing. Scale is not
  what decides whether you need it; the number of moments that have to happen together is.
- **"If everything is on the network, it will all work together."** Sharing a cable is not the same
  as sharing an agreement. Two systems on one switch that speak different protocols are exactly as
  incompatible as they were before, plus they can now interfere with each other.
- **"The console is the show control system."** The console is one controller. The show control
  system is everything from the intent to the device, including the parts nobody owns, which is
  usually where it breaks.
- **"Feedback means the system checks itself."** Most reported state in this industry is telemetry
  with no control coupling: it tells a human something, and nothing acts on it. Real closed-loop
  control exists in machinery and almost nowhere else in a show.
- **"A standard means it will interoperate."** A standard means there is a document. Partial
  implementations, optional features and vendor extensions are the normal case, and two certified
  products failing to work together is an ordinary Tuesday.

---

## Numbers from this session

| Quantity | Value |
| --- | --- |
| Chapters this session covers | 1 to 10 |
| Parts in any control system | five: intent, controller, transport, device, feedback |
| Control postures | three: state-based, event-based, streamed |
| The Five Questions | message, address, deadline, feedback, failure |
| Standards bodies that matter here | ESTA/PLASA, AES, SMPTE, IEEE |
| ESTA lighting data standard | E1.11, DMX512-A |
| ESTA device management standard | E1.20, RDM |
| ESTA streaming standard | E1.31, sACN |
| ESTA networked device management | E1.33, RDMnet |
| Typical DMX refresh rate, full universe | about 44 Hz |
| Data relationships | source and follower, peer, merged |
| Architectures | centralised, distributed, hybrid |
