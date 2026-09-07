# Session 7 — Cueing Between Systems

> A protocol written in 1983 to connect two synthesisers is still, in 2026, how a lighting console
> tells a playback machine to go. This session is why that happened, and what has quietly replaced it.

## Before you come

### What you must already be able to do

Read hex fluently. Understand the difference between a command and data from Session 1. Know what UDP
is, what a port is, and how to send a packet to one.

You should be able to answer, without looking: what does `byte & 0x80` test, and why does it matter?

### Three things to do

1. **Find MIDI on three different pieces of equipment in your venue.** A lighting console, a playback
   machine, a sound desk, a media server. Note which have 5-pin DIN, which have USB, and which offer
   "MIDI over network" or "RTP-MIDI". Note also which of them mention **MSC** in their manual.
2. **Install and open a MIDI monitor** — MIDI Monitor on macOS, MIDI-OX on Windows, or the monitor
   built into your DAW. Send it something and watch bytes appear. This is the whole session in one
   exercise.
3. **Read one page of a console manual's remote control section.** Almost every console has one, and
   almost nobody reads it. Find out what your house console can be told to do from outside, and by
   what: MSC, OSC, a string protocol over TCP, contact closure. Bring the answer.

### What to bring

Laptop, with a MIDI monitor and either QLab, Companion, or a simple OSC tool installed. Notebook.

<!--ready:7-->

---

## Run of the session

| Min | Block | What happens |
| --- | --- | --- |
| 10 | Open | Numbers quiz, and what your house console will accept from outside |
| 40 | The idea | MIDI as a stream of bytes: status and data, channel messages, system messages, SysEx, running status |
| 15 | Break |  |
| 40 | The idea | MIDI Show Control in full, MMC, and the OSC and HTTP layer that has replaced most of it |
| 35 | Lab | Build MSC messages by hand in hex, send them, and make a console fire a cue |
| 30 | Lab | Wire a cue path between two systems three different ways and compare what each costs |
| 10 | Close | Choosing a cue transport, on purpose |

---

## MIDI is a stream of bytes

Everything about MIDI follows from one design decision: at 31.25 kbit/s in 1983, **every byte was
expensive**, so the format is compressed to an extent that looks strange now and is completely
consistent once you see the rule.

<!--anim:midi-bytes-->

**The rule: the top bit tells you what kind of byte this is.**

- Top bit **set** — value 128 to 255, `0x80` to `0xFF` — this is a **status byte**. It says what kind
  of message is starting.
- Top bit **clear** — value 0 to 127, `0x00` to `0x7F` — this is a **data byte**. It belongs to the
  message that most recently started.

That is why MIDI data values only go to 127: the top bit is spent on this distinction. It is why a
MIDI velocity is 0 to 127 and a DMX level is 0 to 255, and students who have not met this rule find
that arbitrary forever.

Testing it is one operation: `byte & 0x80`. Non-zero means status.

### Channel voice messages

The status byte splits into two nibbles: the high nibble is the message type, the low nibble is the
channel, 0 to 15, displayed to humans as 1 to 16.

| Status | Message | Data bytes | What it means |
| --- | --- | --- | --- |
| `0x8n` | Note Off | note, velocity | Release note |
| `0x9n` | Note On | note, velocity | Press note. Velocity 0 is a Note Off, by convention |
| `0xAn` | Polyphonic Aftertouch | note, pressure | Per-note pressure |
| `0xBn` | Control Change | controller, value | The general purpose one, 0 to 127 controllers |
| `0xCn` | Program Change | program | Recall a preset. **Widely used to trigger show cues.** |
| `0xDn` | Channel Aftertouch | pressure | Whole-keyboard pressure |
| `0xEn` | Pitch Bend | LSB, MSB | 14 bits across two 7-bit bytes |

So `0x90 0x3C 0x64` is: Note On, channel 1, note 60 (middle C), velocity 100. Three bytes, and at
31.25 kbit/s with framing, about **960 µs**.

For show control, two of these matter far more than the rest:

- **Program Change**, `0xCn`, is the single most common way a MIDI-capable device is told to recall a
  cue, a snapshot or a preset. One status byte and one data byte, so 128 possible values per channel,
  and 16 channels gives 2048 distinct triggers. That is enough for a great many shows.
- **Control Change**, `0xBn`, is used for continuous values: a fader on a remote, a level, a
  crossfade position. Controllers 0 to 31 have an optional fine partner at 32 to 63 giving 14-bit
  resolution.

### System messages

| Status | Message | What |
| --- | --- | --- |
| `0xF0` | System Exclusive start | Manufacturer-specific, any length. **MSC lives here.** |
| `0xF1` | MIDI Time Code quarter frame | Session 8 |
| `0xF2` | Song Position Pointer | Where in a sequence |
| `0xF3` | Song Select | Which sequence |
| `0xF7` | End of System Exclusive | Closes a SysEx message |
| `0xF8` | Timing Clock | 24 per quarter note |
| `0xFA` `0xFB` `0xFC` | Start, Continue, Stop | Transport |
| `0xFE` | Active Sensing | "I am still here" |
| `0xFF` | System Reset | Everything to default |

**Active Sensing** is worth a paragraph because it confuses everybody who opens a MIDI monitor for
the first time. A device that uses it sends `0xFE` about every 300 ms when nothing else is happening.
If the receiver has seen one and then hears nothing for about 300 ms, it assumes the cable is broken
and silences everything. It is a keep-alive, it fills your monitor with noise, and it is the fourth
of the Five Questions actually being answered by a 1983 protocol, which is more than most of the
protocols in this course manage.

### System Exclusive

`0xF0`, then a manufacturer ID, then any number of data bytes, then `0xF7`. This is the escape hatch:
anything a manufacturer wants that the standard does not cover.

Because the terminator is `0xF7` and every byte in between must have its top bit clear, **SysEx can
only carry 7-bit data.** Anything larger has to be split across bytes, which is why SysEx messages
carrying 8-bit values are always longer than you expect.

MIDI Show Control is a SysEx message with a reserved, non-manufacturer ID. That is its entire
mechanism.

### Running status

<!--anim:running-status-->

An optimisation from the era when bytes were expensive: **if consecutive messages have the same
status byte, you may omit it.** So a run of note-ons becomes one status byte followed by pairs of
data bytes.

It saves a third of the bandwidth on dense musical data. For our purposes it does two things:

1. It makes a raw byte stream harder to read, because you have to remember the last status byte seen.
2. It is the reason a MIDI parser must be a state machine rather than a loop over triples, and it is
   the source of a certain class of bug where a device that joins the stream mid-run mis-parses until
   the next status byte.

You will not use running status deliberately. You need to recognise it in a monitor.

### The transports

<!--anim:midi-transports-->

| Transport | Rate | Latency | Where it is now |
| --- | --- | --- | --- |
| 5-pin DIN, current loop | 31.25 kbit/s | About 1 ms per 3-byte message | Still on consoles and show equipment. Opto-isolated by specification, which is a genuine virtue. |
| USB-MIDI | USB speed | Sub-millisecond | The default for computers. Not isolated, and enumeration is not stable across a glitch. |
| RTP-MIDI, RFC 6295 | Network | Sub-millisecond, plus network | **Network MIDI.** Built into macOS and Windows, supported by an increasing amount of show equipment. |
| MIDI 2.0 / UMP | Varies | Varies | 32-bit resolution, bidirectional negotiation, backwards compatible. Real, shipping, and not yet in show control equipment. |

Two things worth stating clearly:

**DIN MIDI is opto-isolated by specification.** That is not a small thing in this industry. A 5-pin
DIN MIDI link between a lighting console and a sound rack introduces no ground path, which is more
than can be said for a USB cable or, in many installations, an Ethernet cable. It is a real reason
the old connector survives.

**RTP-MIDI is the modern answer** for MIDI between rooms. It carries MIDI over UDP with sequence
numbers and recovery, it is a published RFC, it is built into both major operating systems, and it
removes the distance and cable-count problem entirely. If you need MIDI between two positions in a
venue in 2026, this is the way to do it.

---

## MIDI Show Control

<!--anim:msc-message-->

**MSC** is not part of MIDI 1.0. It is MMA Recommended Practice **RP-002**, published in 1991, and it
is a SysEx message with a reserved ID. It was written specifically for this industry, by this
industry, and it is the only protocol in this course designed from the start to carry a *cue* rather
than a value.

The message format:

```
F0 7F <device_ID> 02 <command_format> <command> <data> F7
```

| Field | Values | What it is |
| --- | --- | --- |
| `F0` | | SysEx start |
| `7F` | | Universal real-time SysEx |
| `device_ID` | `00` to `7F` | Which device this is for. `7F` is all-call. |
| `02` | | The sub-ID meaning "this is MSC" |
| `command_format` | `01` to `7F` | Which *kind* of device: lighting, sound, machinery… |
| `command` | `01` to `7F` | GO, STOP, RESUME, and the rest |
| `data` | ASCII, `00`-separated | Cue number, cue list, cue path |
| `F7` | | SysEx end |

### Command formats

The command format says which discipline the message is aimed at, so a single MIDI cable can carry
cues for several departments and each ignores the others.

| Format | Discipline |
| --- | --- |
| `0x01` | Lighting, general |
| `0x02` | Moving lights |
| `0x03` | Colour changers |
| `0x04` | Strobes |
| `0x05` | Lasers |
| `0x06` | Chasers |
| `0x10` | Sound, general |
| `0x11` | Music |
| `0x12` | CD players |
| `0x14` | Audio tape |
| `0x20` | Machinery, general |
| `0x30` | Video, general |
| `0x40` | Projection, general |
| `0x50` | Process control |
| `0x60` | Pyrotechnics, general |
| `0x7F` | All types |

That table is a period piece — `0x12` is CD players — and it also still works, because the general
categories are what anybody actually uses.

### Commands

<!--anim:msc-commands-->

| Command | Name | What it does |
| --- | --- | --- |
| `0x01` | GO | Execute the cue |
| `0x02` | STOP | Halt |
| `0x03` | RESUME | Continue from a stop |
| `0x04` | TIMED_GO | Execute over a specified time |
| `0x05` | LOAD | Prepare a cue without executing it |
| `0x06` | SET | Set a control to a value |
| `0x07` | FIRE | Run a macro |
| `0x08` | ALL_OFF | Everything off, non-destructively |
| `0x09` | RESTORE | Undo an ALL_OFF |
| `0x0A` | RESET | Return to a defined state |
| `0x0B` | GO_OFF | Cue off |
| `0x10`–`0x1F` | Cue list and cue path management | Open, close, and go with lists |

**The recommended minimum set** — GO, STOP, RESUME — is what a device must implement to claim MSC
support, and it is what nearly every implementation actually has. Anything beyond that, check before
you design around it.

### The data field

Cue number, cue list and cue path, as **ASCII digits and full stops**, separated by `0x00`.

So "GO cue 12.5 in list 3", to lighting, device 1:

```
F0 7F 01 02 01 01 31 32 2E 35 00 33 F7
              │  │  └─ "12.5" ─┘    └─ "3"
              │  └─ GO
              └─ lighting
```

`31` is ASCII "1", `32` is "2", `2E` is ".", `35` is "5". Building one of these by hand once makes
the whole protocol permanent, which is why the lab does it.

Omit the data entirely and it means "the next cue", which is how most simple MSC integrations
actually run: a single repeated GO with no cue number.

### What MSC gets wrong

<!--anim:mmc-transport-->

Being honest about it, because you will be asked to choose:

- **No acknowledgement.** MSC over DIN MIDI is fire and forget. The sender never learns whether the
  cue happened. There is a two-phase confirmed variant in the specification and effectively nothing
  implements it.
- **No error detection.** A corrupted SysEx message is either dropped as malformed or, worse,
  interpreted as a different cue.
- **Seven-bit data.** Everything must fit in 0 to 127 per byte.
- **The device ID space is small.** 112 real device IDs plus group and all-call.
- **31.25 kbit/s on DIN.** A long SysEx string takes a few milliseconds, and a burst of them queues.
- **Implementations vary.** Two products that both claim MSC will disagree about cue list handling,
  about whether the cue number is required, and about what happens on an unknown command.

None of that stopped it becoming the industry's cue interchange for thirty years, because the
alternative was a contact closure, and MSC can at least say *which* cue.

---

## MIDI Machine Control

**MMC**, MMA RP-013, is the transport-control sibling: STOP, PLAY, FAST FORWARD, REWIND, RECORD,
LOCATE. Same SysEx structure, sub-ID `06` for commands and `07` for responses.

```
F0 7F <device_ID> 06 <command> F7
```

| Command | Name |
| --- | --- |
| `0x01` | STOP |
| `0x02` | PLAY |
| `0x03` | DEFERRED PLAY |
| `0x04` | FAST FORWARD |
| `0x05` | REWIND |
| `0x06` | RECORD STROBE |
| `0x07` | RECORD EXIT |
| `0x09` | PAUSE |
| `0x44` | LOCATE, with a timecode position |

Its historical job was controlling tape machines from a sequencer, and that world has gone. Where you
still meet it: DAWs controlling each other, some playback software, and older broadcast and
installation equipment.

MMC has an important property MSC lacks: **it has a response mechanism.** Sub-ID `07` messages carry
replies, so a controller can ask a machine where it is. In practice this is used more for
synchronisation than for show control.

---

## What has actually replaced MSC

This is the part the older textbooks cannot have, and it is what you will use.

<!--anim:cue-paths-->

### OSC

**Open Sound Control** is the modern default, and Session 8 covers it properly. For cueing:

- It is UDP or TCP, so it goes anywhere the network goes, with no cable count.
- Its addresses are human-readable strings: `/cue/12.5/go`, `/eos/key/go`, `/dmx/1/255`.
- It carries typed arguments: integers, floats, strings, blobs.
- It has no assigned port, no standard address scheme, and no discovery.

That last point is the whole trade. MSC has a specified message format that two products from
different manufacturers can implement identically. OSC has a *transport* and leaves the vocabulary to
each product, so **every OSC integration is a bespoke integration**, and you find the address list in
each manufacturer's documentation.

In practice this is fine, because the documentation exists and it is a text string rather than a hex
byte. It is also why OSC integrations break on a firmware update in a way MSC ones do not.

### HTTP and WebSocket APIs

An increasing number of devices expose a web API. A cue becomes an HTTP request:

```
POST /api/v1/cue/12.5/go
GET  http://10.101.30.20/api/playback/go?cue=12.5
```

This is genuinely good for anything that is not tightly timed: it is documented, testable from a
browser, works from any language, and returns a status code so you actually know whether it worked.
That last property is rare and valuable.

WebSocket does the same thing with a persistent connection, which removes the per-request overhead
and allows the device to push state back. This is how most modern console remote interfaces work
under the surface.

**The catch is latency and jitter.** TCP with a connection setup is tens of milliseconds and
occasionally much more. Excellent for "load the next scene", wrong for "fire on this beat".

### The integration layer

<!--anim:companion-layer-->

The practical reality of cue interchange in 2026 is that a piece of middleware sits between systems
and speaks everything.

- **Bitfocus Companion** with a Stream Deck is now extremely common. It has hundreds of device
  modules and turns any button into any protocol. It is free, open source, and on a very large number
  of productions.
- **Show controllers** — Medialon, Alcorn McBride, Pharos, 7thSense, Q-SYS — do the same job for
  permanent installations, with real reliability engineering and a price to match.
- **QLab** is frequently the de facto show controller in theatre, because it can send OSC, MIDI, MSC,
  network and timecode cues alongside its audio and video.

Why the layer exists: **it is one place where the translation lives**, so a system with six protocols
has one box that knows about all six rather than fifteen pairwise integrations. That is principle
five from Session 2 in action: complexity contained rather than convoluted.

The risk is equally clear: it is a single point of failure, and it is often a laptop. Treat it like
one. A spare, a documented configuration in version control, and a rehearsed fallback.

### Choosing, on purpose

| Path | Latency | Confirmed? | When to use it |
| --- | --- | --- | --- |
| Contact closure | Sub-millisecond | No | The one cue that absolutely must happen. Simple, reliable, no dependencies. |
| MSC over DIN | 2 to 5 ms | No | Two pieces of show equipment that both support it, isolated, no network needed |
| MSC over RTP-MIDI | 1 to 5 ms | No | The same, across a building |
| OSC over UDP | Under 5 ms | No | The general case. Fast, flexible, bespoke per product. |
| OSC over TCP | 5 to 30 ms | Delivery only | When loss is unacceptable and a few ms is fine |
| HTTP / WebSocket | 10 to 100 ms | **Yes, with a status code** | Configuration, non-timed actions, anything you want to log |
| Timecode | Frame-accurate | No | Anything locked to fixed media |

> **The design habit.** For any cue path, write down which of these it is and what happens if it is
> lost. If the answer to the second is "the show stops", it should be on a contact closure or should
> have one alongside it. That sentence is worth more than any protocol knowledge in this session.

---

## Extension: MIDI 2.0, and whether to care yet

MIDI 2.0 is real. It has been ratified, it ships in operating systems and in instruments, and it
fixes the things this session has been complaining about:

- **32-bit resolution** instead of 7-bit.
- **Bidirectional negotiation**: devices discover each other's capabilities and agree a profile.
- **Per-note controllers**, and 256 channels via 16 groups of 16.
- **UMP**, the Universal MIDI Packet, a new packet format that carries both MIDI 1.0 and 2.0 messages.

For show control specifically: **not yet.** No console or show controller has shipped an MSC-over-
MIDI-2.0 implementation, and MSC itself has not been revised. Watch it. Do not design around it.

The thing that will change show control in the next few years is not MIDI 2.0. It is that everything
now has an Ethernet port and an API, and the interesting question is becoming which API rather than
which cable.

---

## Common misconceptions

- **"MIDI values go to 127 because of an arbitrary limit."** The top bit of every byte distinguishes a
  status byte from a data byte, so data has seven bits. Once you know that rule the whole protocol is
  readable, and `byte & 0x80` is the only test you need.
- **"MSC is part of the MIDI standard."** It is MMA Recommended Practice RP-002, carried inside a
  System Exclusive message. That is why a device can support MIDI fully and support no MSC at all.
- **"MSC confirms the cue happened."** MSC over DIN is fire and forget. There is a two-phase confirmed
  mode in the specification and effectively nothing implements it. If you need to know a cue landed,
  you need a different transport or a return path you built yourself.
- **"OSC is a standard so two products will interoperate."** OSC specifies a transport and a message
  encoding, not a vocabulary. Every product invents its own address scheme, so every OSC integration
  is bespoke and lives in that product's documentation.
- **"USB-MIDI is the modern replacement for DIN."** For a computer on a desk, yes. DIN MIDI is
  opto-isolated by specification and USB is not, and USB device enumeration is not stable across a
  power glitch. For MIDI between positions in a venue, RTP-MIDI is the modern answer, not USB.
- **"Companion is just a fancy button box."** It is a protocol translation layer, and that means it is
  a single point of failure in the cue path. It deserves a spare, a version-controlled configuration,
  and a rehearsed fallback, the same as any other show-critical device.
- **"HTTP is too slow for show control."** It is too slow for a tightly timed cue and completely fine
  for loading a scene, arming a system or setting a level between moments. It is also the only common
  option that tells you whether it worked, which for non-timed actions is worth more than speed.

---

## Numbers from this session

| Quantity | Value |
| --- | --- |
| MIDI 1.0 DIN bit rate | 31.25 kbit/s |
| MIDI bytes in a Note On | 3 |
| Time for a 3-byte MIDI message on DIN | about 960 µs |
| MIDI status byte range | `0x80` to `0xFF` |
| MIDI data byte range | `0x00` to `0x7F` |
| Test for a status byte | `byte & 0x80` |
| MIDI channels | 16 |
| MIDI Note On status | `0x9n` |
| MIDI Control Change status | `0xBn` |
| MIDI Program Change status | `0xCn` |
| System Exclusive start and end | `0xF0` and `0xF7` |
| Active Sensing byte and interval | `0xFE`, about every 300 ms |
| MIDI DIN isolation | opto-isolated by specification |
| MSC document | MMA RP-002 |
| MSC SysEx prefix | `F0 7F <device> 02` |
| MSC all-call device ID | `0x7F` |
| MSC lighting command format | `0x01` |
| MSC sound command format | `0x10` |
| MSC machinery command format | `0x20` |
| MSC GO, STOP, RESUME | `0x01`, `0x02`, `0x03` |
| MSC recommended minimum set | GO, STOP, RESUME |
| MSC data encoding | ASCII digits, `0x00` separated |
| MMC document | MMA RP-013 |
| MMC SysEx command sub-ID | `06`, responses `07` |
| RTP-MIDI document | RFC 6295 |
| Typical contact closure cue latency | sub-millisecond |
| Typical OSC over UDP cue latency | under 5 ms |
| Typical HTTP cue latency | 10 to 100 ms |
