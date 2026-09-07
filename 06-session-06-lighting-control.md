# Session 6 — DMX512-A, RDM, RDMnet and sACN

> A protocol designed in 1986 to replace analogue dimmer wiring is still the last metre of almost
> every lighting system on earth. Understanding why is more useful than resenting it.

## Before you come

### What you must already be able to do

Read hex and binary. Calculate a multicast group address from a universe number will be taught here,
but the bitwise arithmetic behind it is assumed. Know what UDP is and why a streaming protocol uses
it. Know what IGMP snooping does.

You should also be able to patch and address a fixture on a console, or at least have watched
somebody do it and understood what the number meant.

### Three things to do

1. **Address a fixture by hand and write down its footprint.** Find any moving light or LED fixture,
   open its manual, find the DMX chart, count the channels in the mode it is in, and set an address.
   Then work out what the next fixture's address must be. This is the arithmetic the whole session
   assumes.
2. **Find a DMX terminator in your venue, and then find an unterminated line.** The second will take
   about four minutes. Photograph both.
3. **Download sACNView, or Wireshark with a capture of sACN**, and look at one packet. Do not try to
   understand every field. Find the universe number and the priority, which are the two you will use
   most in your career.

### What to bring

Laptop with Wireshark. Notebook. A DMX cable you trust, and one you do not.

<!--ready:6-->

---

## Run of the session

| Min | Block | What happens |
| --- | --- | --- |
| 10 | Open | Numbers quiz, and the fixture footprint you calculated |
| 40 | The idea | DMX512-A on the wire: the packet, addressing, topology, termination, start codes |
| 15 | Break |  |
| 40 | The idea | RDM and its discovery, RDMnet, ACN, sACN and its multicast arithmetic, Art-Net |
| 35 | Lab | Scope a live DMX line: break, mark, slot, whole packet, then change the channel count and measure again |
| 30 | Lab | Capture sACN, decode a packet by hand, then stage a priority fight between two sources |
| 10 | Close | What DMX still gets you, and where it stops |

---

## DMX512-A on the wire

<!--anim:dmx-packet-->

DMX512-A, published by ESTA as **E1.11**, is a continuously repeated broadcast of up to 512 bytes,
each 0 to 255, sent at 250 kbit/s over RS-485.

There is **no addressing in the protocol at all.** Every device on the line receives every byte and
picks out the ones starting at the address you set on it. That single design decision explains almost
everything about how DMX behaves.

A packet is:

1. **Break** — the line held low for at least 92 µs. The "a new packet starts now" marker. It is
   deliberately longer than any valid byte, so it cannot be mistaken for data.
2. **Mark after break** — high for at least 12 µs.
3. **Start code** — one byte. `0x00` means normal dimmer data.
4. **Up to 512 slots** — one byte each, each with a start bit and two stop bits.

Each slot takes **44 µs**: 11 bit times at 4 µs each. A full 512-slot packet plus its break is about
**22.7 ms**, giving a refresh rate of about **44 Hz**.

Send fewer channels and it refreshes faster. 256 channels is about 11.4 ms, so about 88 Hz. That is a
real, visible effect on fast moving-light chases, and it is why some consoles offer a channel limit.

### What "no addressing" costs you

- **Two fixtures on the same address both respond, identically, forever**, and nothing reports an
  error. There is no collision detection because there is no addressing to collide.
- **A fixture cannot tell the console anything.** DMX is simplex. Everything you believe about the
  state of the rig, you believe because you sent it.
- **There is no error detection.** No checksum, no CRC, no sequence number. A corrupted slot is
  delivered as a valid value and the fixture does it. The protocol relies entirely on the next
  complete picture arriving 22 ms later, which is why DMX faults look like flicker rather than errors.
- **The 513th byte does not exist.** A fixture at address 505 needing 16 channels does not fit, and it
  will behave strangely rather than refusing.

### Addressing and footprint

<!--anim:dmx-footprint-->

A fixture's **footprint** is how many consecutive slots it consumes, and it depends on its **mode** or
**personality**. The same fixture might be 8 channels in basic mode and 42 in extended mode.

The arithmetic is trivial and the mistakes are constant:

- Next address = this address + this fixture's footprint. Not + 1.
- A fixture in a different mode from the one the console is patched to is the classic fault: the
  colour wheel responds to what the console thinks is the gobo. Symptom is "everything is wrong by a
  few channels", cause is a personality mismatch.
- Leave gaps. Addressing at exactly the density that fits means the first change note breaks the plan.
  **Round up to a sensible boundary** — 1, 21, 41, 61 for a 16-channel fixture — and you can swap a
  fixture for a bigger one without repatching the rig.

### Topology and termination

<!--anim:dmx-topology-->

DMX is a **daisy chain**, not a star. One cable in, one cable out, device to device, terminator at the
far end.

| Rule | Number | What happens if you break it |
| --- | --- | --- |
| Devices per segment | 32 unit loads | Signal degrades; usually intermittent, worse when warm |
| Maximum run length | about 300 m | Errors accumulate, flicker appears at the far end |
| Terminator | 120 Ω across data + and − | Reflections; usually works and then does not |
| Topology | Daisy chain only | A star creates reflections at every stub |
| Cable | 110 Ω, twisted pair, screened | Microphone cable "works", until it does not |

**To split, use a splitter**, which is an active device that receives the signal and regenerates it
onto several isolated outputs. A passive Y-splitter is a star and it is a fault waiting for a warm
evening.

The termination argument is worth stating properly, because everybody has seen an unterminated line
working. Without a terminator the reflection is *present* and merely small enough to survive today.
Add 20 m, add a fixture, change the temperature, and it becomes intermittent flicker somewhere
apparently unrelated to what you changed. Termination is not about whether it works. It is about
whether it will still work in three weeks with a different rig on the end.

### The connector argument

DMX is specified on **5-pin XLR**. Pin 1 screen, pin 2 data −, pin 3 data +, pins 4 and 5 a second
data pair that almost nothing uses.

It is on five pins so that a DMX line cannot be plugged into a microphone input and a microphone
cannot be plugged into a dimmer. The two spare pins are the price of making a category error
physically impossible. A rig using 3-pin XLR for DMX often works electrically and has thrown that
safeguard away.

### Alternate start codes

<!--anim:startcode-->

The start code is what tells a receiver how to interpret the 512 bytes that follow. `0x00` is normal
dimmer data and is what everything sends by default.

| Start code | Meaning | Where you meet it |
| --- | --- | --- |
| `0x00` | Null start code: normal dimmer data | Everything |
| `0xCC` | RDM | Every RDM message shares the line with the DMX |
| `0x17` | Text packet, ASCII | Rare, occasionally in test equipment |
| `0x55` | Test packet | Test gear |
| `0x91` | Manufacturer-specific | A vendor's own extension |

The important operational point: **a device must ignore any start code it does not understand.** A
fixture that misbehaves when RDM traffic is present is a fixture with a firmware bug, and it is a
well-known category of problem, particularly on older kit. This is why the first thing to try when a
rig behaves strangely after you enable RDM is to turn RDM off.

---

## RDM: making DMX talk back

<!--anim:rdm-discovery-->

**RDM**, ESTA **E1.20**, adds a return path to DMX without changing the cable. The controller sends a
message with start code `0xCC`, then stops transmitting and listens. A fixture replies in the gap.

That is a half-duplex conversation on a line that was designed for one direction, and the timing is
tight, which is the source of every RDM problem.

### Discovery, which is the clever part

Every RDM device has a unique 48-bit **UID**: 16 bits of manufacturer ID and 32 bits of device ID.
The controller does not know what is out there, so it plays a guessing game:

1. Ask "everyone whose UID is between 0 and the maximum, reply."
2. If exactly one replies, cleanly, you have found a device. Record it and mute it so it stops
   answering.
3. If several reply, they collide and the answer is garbled. **Halve the range and ask each half
   separately.**
4. Repeat until every device has been found and muted.

That is a **binary search over the whole 48-bit address space**, and it finds any number of devices in
a number of steps proportional to the log of the range. It is the same halving method as the
fault-finding technique in Session 2, and it is genuinely elegant.

<!--anim:rdmnet-arch-->

### What RDM gets you, and what breaks it

It gets you: read and set the DMX address, read and set the personality, read the sensors — lamp
hours, temperature, fan speed — read the manufacturer and model, identify a fixture by making it
flash, and read the device's own status messages.

That is a serious amount of value. Setting three hundred addresses from the console rather than from
a ladder is a day of work saved on every fit-up.

What breaks it:

- **Everything in the path must pass it.** A splitter that is not RDM-capable blocks the return
  direction while passing DMX perfectly. The fixtures work and none of them are discoverable, and the
  symptom points at the fixtures while the cause is a box in the middle. This is the single most
  common RDM complaint.
- **It shares the line's time budget.** Discovery is chatty and it steals slots from the DMX.
  **Discover during the rig check, not during the show.**
- **Support is partial.** The standard is large. A fixture that discovers but will not accept an
  address change is behaving badly rather than being broken, and there is not much you can do.
- **The timing is unforgiving.** A device that is slow to release the line breaks the conversation for
  everything downstream of it.

### RDMnet, the one the old books do not have

**RDMnet**, ESTA **E1.33**, published in 2019, is RDM carried over an IP network instead of over the
DMX line. It is genuinely important and it is not in older textbooks at all.

The architecture is different from everything else in this session:

- A **broker** is a rendezvous point on the network. Devices register with it.
- **Controllers** connect to the broker and reach devices through it, over **TCP**, so messages are
  acknowledged and ordered.
- **LLRP**, low-level recovery protocol, is a multicast side channel that can reach a device even if
  its IP configuration is wrong. This is the feature that matters most in practice: it is how you fix
  a node that somebody set to the wrong static address, without a ladder.

Why it is better than RDM over DMX: no time budget shared with lighting data, no half-duplex
turnaround, no splitter transparency problem, reliable transport, and it scales to a whole building
rather than to one line of 32 devices.

Why it is not everywhere yet: it needs support in the gateway and in the controller, and the installed
base of fixtures is enormous. Expect it in new nodes and consoles, and expect RDM over DMX to remain
the last metre for a long time.

---

## ACN and sACN

**ACN**, ESTA **E1.17**, is the full Architecture for Control Networks: a complete, self-describing
device control architecture with device description language, discovery, sessions and reliable
transport. It is technically excellent and it was too much for the market. Almost nothing implements
full ACN.

What the industry took from it is one part: **E1.31, Streaming ACN, universally called sACN.** It is
DMX data, carried over UDP multicast, using ACN's packet framing. It is now the dominant way lighting
data crosses a network, and the current revision is **E1.31-2018**.

### The multicast arithmetic

<!--anim:sacn-multicast-->

This is the calculation to be able to do in your head, because it is how you write a Wireshark filter
and how you understand what a switch is doing.

sACN universes map onto multicast group addresses in `239.255.0.0/16`:

```
Group address = 239.255.<high byte of universe>.<low byte of universe>
```

So:

| Universe | High byte | Low byte | Multicast group |
| --- | --- | --- | --- |
| 1 | 0 | 1 | `239.255.0.1` |
| 2 | 0 | 2 | `239.255.0.2` |
| 255 | 0 | 255 | `239.255.0.255` |
| 256 | 1 | 0 | `239.255.1.0` |
| 300 | 1 | 44 | `239.255.1.44` |
| 512 | 2 | 0 | `239.255.2.0` |
| 63999 | 249 | 255 | `239.255.249.255` |

Universe numbers run 1 to 63999. Universe 64000 and above are reserved.

The consequence that matters: **a device that has joined only the groups for its own universes
receives only those universes.** That is the whole reason sACN is kinder to a network than broadcast
Art-Net, and it is also why IGMP snooping has to be working for that benefit to exist. Without
snooping, every universe reaches every device and sACN behaves exactly like broadcast.

### Priority, and the fight between two consoles

<!--anim:sacn-priority-->

Every sACN packet carries a **priority** from 0 to 200, default 100. Where two sources send the same
universe, the higher priority wins, completely. Equal priorities means the receiver must merge or
must pick, and different manufacturers do different things, which is exactly the ambiguity you want
to avoid.

The operational uses:

- **A backup console at a lower priority**, say 90, sending the same universes continuously. If the
  main console stops, the backup's data takes over within a source timeout, with no changeover to
  operate.
- **A test or focus tool at a higher priority**, say 150, that takes control of a universe while
  somebody is working, and releases it by stopping.
- **Per-address priority**, an optional part of the standard using start code `0xDD`, which sets a
  priority for each slot rather than for the whole universe. Powerful, less widely supported, and
  worth checking before you design around it.

**Source timeout** is 2.5 seconds. If a receiver hears nothing from a source for that long, it
considers the source gone. What it then does with the levels is a device setting and it is the fifth
of the Five Questions, so find out for your fixtures: hold last look, fade out, or go dark.

### Synchronisation

E1.31-2018 includes **universe synchronisation**: a source sends data for several universes, then
sends a sync packet on a synchronisation address, and receivers hold their new data until it arrives.

This solves a real problem on large pixel rigs, where universes arriving a few milliseconds apart
produces a visible tear across an LED wall. Support is patchy. If you need it, test it on the actual
kit before you rely on it.

### Art-Net, and the honest comparison

<!--anim:artnet-vs-sacn-->

**Art-Net** is not a standard. It is a protocol published by Artistic Licence, free to implement, now
at version 4, and it is enormously widely deployed. It predates sACN and it is not going away.

| | sACN, E1.31 | Art-Net 4 |
| --- | --- | --- |
| Status | ESTA standard | Published by one company, freely available |
| Transport | UDP 5568 | UDP 6454 |
| Default addressing | Multicast | **Broadcast**, with unicast and multicast available |
| Universes | 1 to 63999 | 32768, in nets, sub-nets and universes |
| Priority | Yes, 0 to 200 | No, not in the protocol |
| Sync | Yes, optional | Yes, ArtSync |
| Discovery | No | Yes, ArtPoll and ArtPollReply |
| Configuration | Nothing to configure | Devices can be configured over the protocol |

The difference that matters operationally is the third row. **Art-Net's default is broadcast**, which
means every device on the network processes every universe. On a rig of eight universes nobody
notices. On a rig of two hundred, every device on the network is doing real work discarding data it
does not want, and it is a known cause of media servers glitching on a shared network.

Art-Net 4 supports unicast and multicast and most modern nodes will do it. **Configure it.** The
default is the problem, not the protocol.

Art-Net's advantage is genuine: ArtPoll gives you discovery and configuration in the protocol itself,
so a node can be found and set up without a separate tool. sACN has nothing equivalent, which is part
of why RDMnet exists.

> **The recommendation.** New designs: sACN, with IGMP snooping and a querier. Existing Art-Net rigs:
> leave them, but turn off broadcast and check the node's universe mapping, because Art-Net's
> net/sub-net/universe numbering and a console's flat universe numbering disagree constantly and
> off-by-one universe errors are the result.

---

## Scale: what a pixel rig does to all of this

<!--anim:pixel-load-->

A moving light is 20 to 40 channels. A pixel tape is 3 channels per pixel, or 4 with white, and a
pixel is 25 mm long.

The arithmetic, and it is worth doing once so the number lands:

- One universe of 512 channels holds **170 RGB pixels**, with 2 channels spare.
- A 5 m run of 60-pixel-per-metre tape is 300 pixels, so **two universes**.
- A 4 m by 3 m LED wall at 50 mm pitch is 80 × 60 = 4800 pixels, so **29 universes** for RGB.
- A modest architectural install of a few hundred metres of tape is comfortably **a hundred universes**.

At a hundred universes, at 44 Hz, with headers, you are moving about **24 Mbit/s** of continuous
multicast. That is not a lot for a gigabit network, and it is a great deal if it is being broadcast
to every device including your media servers.

This is the point at which the network configuration in Session 5 stops being good practice and starts
being the difference between a rig that works and one that does not.

### Merging

<!--anim:merge-modes-->

Two sources, one output. Somebody has to decide.

- **HTP**, highest takes precedence, per channel. Traditional for dimmers: if either source says
  full, it is full. Safe and intuitive, and wrong for anything where a low value is meaningful, like
  a colour mix or a pan position.
- **LTP**, latest takes precedence. Whoever moved it last owns it. Right for moving lights, and it
  means a source that stops sending keeps control until something else claims it.
- **Priority**, as in sACN: the higher number wins outright, no merging.

A gateway or node usually offers HTP or LTP merging of two DMX or sACN inputs. **Know which one is
set**, because a rig that behaves oddly when two consoles are connected is nearly always a merge mode
that does not match the intent.

---

## The Five Questions, answered

| | DMX512-A | RDM | sACN | Art-Net |
| --- | --- | --- | --- | --- |
| What is a message? | Break, start code, up to 512 slots | A framed message with start code `0xCC` and a checksum | A UDP packet: framing, DMP, up to 512 slots | A UDP packet with an opcode |
| Who is it for? | Everyone; there is no address | A 48-bit UID, or broadcast | A multicast group per universe | Broadcast by default; unicast or multicast if configured |
| When must it arrive? | Continuously, about 44 Hz | Between DMX packets, tight turnaround | Continuously, typically 30 to 44 Hz | Same |
| How do you know? | You do not | A response, with a checksum | You do not, but it repeats | You do not, but it repeats |
| What if it does not? | Fixture holds, fades or goes dark: **a device setting** | Discovery fails, or a device is missed | Source times out after 2.5 s, then the device setting applies | Node-dependent, usually holds |

The last row is the one to write on a production drawing for the specific fixtures in the specific
rig, because it varies by manufacturer and by menu setting, and the difference between "holds last
look" and "goes dark" is the difference between a recoverable moment and a blackout.

---

## Extension: what DMX still gets you

It would be easy to read this session as an argument that DMX is obsolete. It is not, and the reasons
are worth stating:

- **It has no dependencies.** No IP configuration, no switch, no DHCP, no clock. Two devices and a
  cable.
- **It is genuinely deterministic.** A fixed 44 Hz, a fixed slot order, no queue, no contention. Very
  few things in this course can say that.
- **Its failure mode is well understood** by every technician in the industry, which is worth a lot at
  22:00.
- **The installed base is tens of millions of devices** and they will be working in twenty years.

What has changed is its role. DMX is no longer the transport for a rig. It is **the last metre**, from
a node on the network to the fixtures on one bar, and in that role it is excellent.

---

## Common misconceptions

- **"DMX is a network."** It is a one-way repeated broadcast with no addressing, no error checking and
  no return path. Nothing on a DMX line can tell you anything, including whether it is there.
- **"A terminator is optional if it works without one."** Without one the reflection is present and
  merely small enough to survive today. Add cable, add a fixture, change the temperature, and it
  becomes intermittent flicker somewhere unrelated to what you changed.
- **"More channels means a slower rig."** More channels means a lower refresh rate on that universe:
  512 channels at about 44 Hz, and proportionally faster with fewer. It is a real effect on fast
  chases and it is why some consoles offer a channel limit.
- **"Art-Net and sACN are two names for the same thing."** They are different protocols with different
  ports, different addressing and different universe numbering. The difference that matters
  operationally is that Art-Net broadcasts by default, so every device processes every universe.
- **"sACN is fine on any switch because it is multicast."** Multicast on a switch without IGMP
  snooping is flooded exactly like broadcast, so you get none of the benefit. Snooping needs a querier
  or the memberships expire after a few minutes and it silently reverts.
- **"RDM is not working, so the fixtures do not support it."** Far more often something in the path
  does not pass the return direction: a non-RDM splitter, a node with RDM disabled, or a cable with an
  open screen. The fixtures work perfectly and none of them are discoverable, which points at exactly
  the wrong place.
- **"ACN and sACN are the same standard."** sACN, E1.31, is one small streaming part of the full ACN
  architecture, E1.17. Almost nothing implements full ACN; effectively everything implements sACN.
- **"Priority 200 is the safe choice for my console."** It is the safe choice for taking over a rig
  and the worst choice for a system with a backup, because nothing can ever override you, including
  the person trying to fix a problem you caused. Default 100, backup lower, override tools higher.

---

## Numbers from this session

| Quantity | Value |
| --- | --- |
| DMX512-A standard number | ANSI E1.11 |
| DMX512 bit rate | 250 kbit/s |
| DMX bit duration | 4 µs |
| DMX slot duration with framing | 44 µs |
| DMX break, minimum | 92 µs |
| Mark after break, minimum | 12 µs |
| Slots in one universe | 512 |
| Full universe packet time | about 22.7 ms |
| Full universe refresh rate | about 44 Hz |
| DMX null start code | `0x00` |
| RDM start code | `0xCC` |
| sACN per-address priority start code | `0xDD` |
| DMX cable impedance | 110 Ω |
| DMX terminator | 120 Ω across the data pair |
| Devices per DMX segment | 32 unit loads |
| Maximum DMX run length | about 300 m |
| DMX connector | 5-pin XLR |
| DMX pinout | 1 screen, 2 data −, 3 data + |
| RDM standard number | ANSI E1.20 |
| RDM UID length | 48 bits: 16 manufacturer, 32 device |
| RDMnet standard number | ANSI E1.33 |
| RDMnet transport | TCP, with LLRP over multicast |
| ACN standard number | ANSI E1.17 |
| sACN standard number | ANSI E1.31-2018 |
| sACN port | UDP 5568 |
| sACN multicast range | `239.255.0.0/16` |
| sACN universe range | 1 to 63999 |
| sACN priority range | 0 to 200, default 100 |
| sACN source timeout | 2.5 s |
| Art-Net port | UDP 6454 |
| Art-Net default addressing | broadcast |
| RGB pixels in one universe | 170 |
| Universes for a 4 m by 3 m wall at 50 mm pitch | 29 |
| Merge modes | HTP, LTP, priority |
