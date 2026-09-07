# How we got here

None of this was designed. It accumulated, one problem at a time, and most of it is still carrying
the shape of a constraint that stopped existing in 1995.

Knowing why something exists tells you what it refuses to do, and that knowledge outlives the product
names. Every entry here follows the same shape: **the problem, the answer, and what the answer
charged for itself.**

---

## Lighting control: from a wire per dimmer to a packet per universe

### The problem, 1970

A dimmer needed a control voltage. One wire per dimmer, from the control desk to the dimmer room. A
96-way rig was 96 conductors in a multicore as thick as your wrist, and every change meant more
copper.

### 0 to 10 V analogue

One wire per channel, 0 volts is off and 10 volts is full. Simple, immediate, and completely
deterministic: there is no packet, no delay and nothing to go wrong except the wire.

**What it charged.** Copper by the kilometre, a connector per channel, and no way to add a channel
without adding a cable. And it was analogue, so a long run arrived slightly dimmer than it left.

### AMX192, 1975

Multiplexing arrives: send the channels one after another down one pair, with an analogue level for
each and a clock to say when the next one starts. 192 channels on four conductors.

**What it charged.** Still analogue, so still degraded with distance. And 192 channels was generous
in 1975 and absurd by 1985.

### DMX512, 1986

<!--anim:lineage-dmx-->

Go digital. 512 channels, 8 bits each, at 250 kbit/s on RS-485, repeated continuously about 44 times
a second. USITT published it, ESTA maintains it, and it is now ANSI E1.11.

The design decisions that still shape your working life:

- **No addressing in the protocol.** Everything hears everything. Cheap to implement in 1986, and
  the reason two fixtures on the same address both respond forever with nothing reporting an error.
- **No error detection.** Not a weak one: none. Reliability comes from repeating the full picture
  every 22.7 ms. This is why DMX faults present as flicker rather than as errors.
- **One direction only.** A fixture cannot say anything, including that it exists.
- **512 slots.** Generous in 1986 when a channel was a dimmer. Absurd once one moving light is 40
  channels and one LED tape run is two universes.

**What it charged.** Everything above, plus a topology that must be a daisy chain with a terminator,
which is the single most-violated rule in this industry.

### RDM, 2006

Add a return path without changing the cable: a different start code, half-duplex turnaround, and a
binary search to discover devices. ANSI E1.20.

**What it charged.** Timing so tight that any device in the path which does not pass the return
direction breaks it silently. Every non-RDM splitter in the world became a fault that points at the
wrong place.

### ACN, 2006, and sACN, 2009

<!--anim:lineage-acn-->

Do it properly: a full device control architecture with description language, discovery, sessions and
reliable transport. ANSI E1.17.

The market did not take it. It was a great deal of engineering for a problem most people solved by
sending DMX down a wire.

What the market *did* take was one streaming component: **E1.31, sACN.** DMX data over UDP multicast,
using ACN's framing, with a priority field. It is now how lighting data crosses a network, and the
full architecture it came from is essentially unused.

**What it charged.** All of the network's problems become yours: IGMP snooping, queriers, VLANs, and
a class of failure that did not exist when the cable was the network.

### Art-Net, 1998

<!--anim:lineage-artnet-->

Artistic Licence got there first, by a decade. DMX over UDP, published free for anyone to implement,
with discovery and configuration built in. Now at version 4, and enormously widely deployed.

**What it charged.** It broadcasts by default, so every device on the network processes every
universe. On eight universes nobody notices; on two hundred it is a real load on every device in the
building. Modern nodes support unicast and multicast and most rigs never turn it on.

### RDMnet, 2019

RDM over IP, with a broker, TCP transport and a low-level recovery channel that reaches a device
whose IP configuration is wrong. ANSI E1.33. This is the one the older textbooks do not have and the
one that will matter most over the next decade.

**What it charged.** It needs support at both ends, and there are tens of millions of fixtures that
will never have it.

---

## Cue interchange: from a bell to an API

### The problem

Two departments have to do something at the same moment, and their equipment was made by different
people who had never heard of each other.

### The cue light, 1900-ish

A bulb. The stage manager presses, the operator sees, the operator acts. Still installed in every
theatre, still used every night, and still the most reliable cue system ever built because the
decoding is done by a person.

**What it charged.** A human in the loop, and one bit of information.

### The contact closure

Two pieces of metal. Closed means go. No agreement to get wrong, no configuration, no firmware.

**What it charged.** One bit, one direction, no identity. It cannot say *which* cue.

### MIDI, 1983, and MSC, 1991

<!--anim:lineage-midi-->

MIDI was designed to connect two synthesisers at 31.25 kbit/s, and every byte was expensive, which is
why the top bit of every byte distinguishes status from data and why MIDI values stop at 127.

The industry noticed that MIDI cables were already in every venue and that System Exclusive was an
open escape hatch. **MIDI Show Control**, MMA RP-002, is a SysEx message with a reserved ID that
carries GO, STOP, RESUME and a cue number as ASCII.

It became the industry's cue interchange for thirty years, and it is still in the manuals.

**What it charged.** Fire and forget: no acknowledgement in any implementation you will meet. Seven-
bit data. 31.25 kbit/s. And enough implementation variation that two products both claiming MSC
support will disagree about cue lists.

### OSC, 1997

A paper from a university music lab, proposing a replacement for MIDI with human-readable addresses,
typed arguments and a network transport.

It became the industry's general-purpose control protocol almost by accident, because it is easy to
implement and it goes wherever the network goes.

**What it charged.** It specifies an encoding, not a vocabulary. No registry, no assigned port, no
discovery, so every product invents its own address scheme and every OSC integration is bespoke.
Flexibility, purchased with interoperability.

### HTTP, WebSocket, and the integration layer, 2015 onward

Everything now has an Ethernet port and a web interface, so a cue becomes an HTTP request that
returns a status code. It is the only common cue path that actually tells you whether it worked.

And between all of them sits a translation layer — Companion, QLab, a show controller — because
fifteen pairwise integrations is worse than one box that knows about six protocols.

**What it charged.** Latency measured in tens of milliseconds rather than in bytes, and a single
point of failure that is very often a laptop.

---

## The network: from a purpose-built bus to Ethernet everywhere

### The problem

Every discipline built its own transport, and by 1995 a venue had six incompatible cable systems.

### The alternatives that lost

<!--anim:lineage-network-->

Token Ring was deterministic and elegant. ARCNET was reliable and industrial. LocalTalk was cheap and
built into every Mac. FDDI was fast and ran on fibre. AES/EBU multicores, MADI, Sony 9-pin, RS-422
machine control, proprietary lighting networks from every console manufacturer: all of them were, on
some axis, better than Ethernet.

**Ethernet won because it was mediocre at everything and cheap at all of it.** Volume from the office
market made the silicon nearly free, and free beat better, comprehensively, everywhere.

The consequence you live with: **this industry's real-time requirements run on a transport designed
for best-effort office traffic.** Everything in Session 5 — QoS, VLANs, IGMP, PTP, redundant networks
— exists to make a best-effort medium behave well enough for a show.

### Audio over IP

CobraNet in 1996 put audio on Ethernet at layer 2, and it worked, and it needed dedicated hardware.
EtherSound followed. AVB was standardised properly by the IEEE with genuine bandwidth reservation and
required every switch in the path to support it, which slowed it down for years.

**Dante** arrived in 2006, layer 3, on ordinary switches, with a licensing model that put it in
hundreds of manufacturers' products. It is proprietary and it is overwhelmingly dominant.

**AES67**, 2013, is the open interoperability standard that lets Dante, Ravenna, Livewire and Q-LAN
exchange audio. It is a compatibility mode rather than a product, and it is genuinely useful.

**What it charged.** PTP. Once audio devices must share a clock to sub-microsecond accuracy, the
network's timing behaviour becomes a show-critical property, and a class of faults arrived that had
no precedent in analogue audio.

### Video over IP

SDI ruled for thirty years because it is a single coax, uncompressed, with no configuration. It still
does much of the work.

**ST 2110** is the standards-based answer: separate streams for video, audio and data, on IP, locked
to PTP under ST 2059-2. It is what large broadcast plants are building, and it needs 10 Gbit/s
minimum and a network designed by somebody who does this.

**NDI** is the pragmatic answer: compressed, works on an ordinary gigabit network, discovers itself,
and is now everywhere in live events and corporate. It costs a frame or two of latency, which for
most of what it does is irrelevant.

**What it charged.** In 2110's case: a network that must be right, a PTP domain, and an engineering
skill set the events industry did not have. In NDI's case: latency, and a proprietary dependency.

---

## Time: from a sprocket hole to a nanosecond

### SMPTE timecode, 1969

<!--anim:lineage-time-->

Editing film and tape needed a way to name a moment. Eighty bits per frame, biphase mark encoded so
it is self-clocking and polarity independent and readable at any speed, on an audio track.

Then colour television arrived and pulled the NTSC frame rate down by 1000/1001 to fit the colour
subcarrier in, and the timecode clock started running 3.6 seconds an hour slow. **Drop frame** skips
frame numbers to correct it, and fifty years later students are still learning why 29.97 is not 30.

**What it charged.** Two incompatible ways of counting the same frames, and a class of fault where
two sources both look healthy and drift apart over an hour.

### MIDI Time Code, 1987

Carry SMPTE over MIDI. At 31.25 kbit/s the only way is one nibble per quarter frame, so a full
timecode value takes two frames.

**What it charged.** MTC is inherently two frames behind, forever.

### PTP, 2002 and 2008 and 2019

<!--anim:lineage-ptp-->

Once media is packets, frame accuracy is not enough: samples taken in different boxes must line up to
the microsecond. IEEE 1588 exchanges four timestamps and calculates both the offset and the path
delay.

It works beautifully, and it introduced three new singular roles to every show network: the
grandmaster, the profile, and the domain. Get any of them wrong twice and you have unexplained audio
glitches.

**What it charged.** A clock hierarchy that must be designed, one grandmaster that must be chosen,
and a profile that must match, on a network where nobody used to have to think about time at all.

---

## The pattern

Read those six stories together and the same shape appears every time.

1. A discipline has a problem and solves it with something purpose-built and excellent.
2. The purpose-built thing is expensive, so a general-purpose thing that is worse arrives and is
   cheaper.
3. The cheap thing wins on volume.
4. The industry then spends twenty years adding back, in configuration, the properties the
   purpose-built thing had for free.

DMX had guaranteed 44 Hz determinism. sACN gets it back with QoS and over-provisioning. A dedicated
audio multicore had no clock problem. Dante gets it back with PTP. A cue light needed no
configuration. A network cue path needs a VLAN, an address plan and a fallback.

None of that is an argument against the modern way. It is enormously more capable and it costs far
less. It is an argument for knowing **what was traded away**, because that is exactly the list of
things you now have to provide yourself.

That list is the syllabus.
