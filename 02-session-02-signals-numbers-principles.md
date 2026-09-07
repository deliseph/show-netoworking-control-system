# Session 2 — Signals, Numbers and the Rules We Design By

> The simplest control message in the industry is two pieces of metal touching. Everything else in
> this module is that idea with more agreements bolted onto it.

## Before you come

### What you must already be able to do

Read a value with a prefix and know what it means: 4.7 kΩ, 250 kbit/s, 22.7 ms, 5 V. Understand that
a circuit needs a complete path. Multiply and divide powers of two in your head up to 1024.

If any of that is shaky, [Foundations](/foundations) is forty minutes and it is the whole
prerequisite for this module.

### Three things to do

1. **Find a GPI or GPO port on real equipment.** Lighting consoles, media servers, playback
   machines, sound desks and show controllers nearly all have them, usually on a D-sub or a phoenix
   block on the back, usually unused. Photograph one, find its page in the manual, and write down
   whether it wants a **dry contact** or a **voltage**. That single distinction is the most common
   way a GPI is wired wrong.
2. **Count in binary to 32 on your fingers.** Thumb is 1, index 2, middle 4, ring 8, little 16. It
   takes ten minutes and it makes the whole of Session 4 easier. Then write the numbers 0 to 20 in
   hexadecimal.
3. **Find one incident report or one story** about a show system that failed, from anywhere:
   a colleague, a forum, a conference talk, an accident report. Bring it. We will place it against
   the seven principles and you will find it violates at least two.

### What to bring

Notebook. A multimeter if you own one, with a continuity beep. Laptop.

<!--ready:2-->

---

## Run of the session

| Min | Block | What happens |
| --- | --- | --- |
| 10 | Open | Numbers quiz, and the GPI port you found |
| 35 | The idea | Contact closures, inputs, outputs, and what isolation is actually protecting |
| 30 | The idea | Binary, hex, BCD, two's complement, endianness, and the bitwise operations |
| 15 | Break |  |
| 25 | The idea | The seven design principles, and a method for finding faults |
| 30 | Lab | Wire, prove and then deliberately defeat an isolated GPI |
| 25 | Lab | Decode real bytes: a DMX slot, a MIDI status byte, an IP mask, a MAC address |
| 10 | Close | Where each number system shows up from here on |

---

## Two pieces of metal

A contact closure is a switch. A wire is either connected or it is not, and a device somewhere else
notices. It is the oldest control interface in this industry, it predates all the electronics in
this building, and it is still, in 2026, the single most reliable way to get a cue from one system
to another.

That is worth sitting with. A modern venue can carry a cue on a network with time synchronisation
accurate to a microsecond, or on a pair of wires that close a circuit. On the night, the pair of
wires is more likely to work, and every experienced technician knows it.

<!--anim:contact-closure-->

Why it survives:

- **No agreement to get wrong.** Closed means go. There is no baud rate, no address, no IP
  configuration, no firmware version, no subnet.
- **It has no state to lose.** Nothing to boot, nothing to time out, nothing to negotiate.
- **It fails visibly.** A broken wire does not close, and a shorted wire closes and stays closed.
  Both are diagnosable with a meter in four seconds.
- **It crosses ownership boundaries.** Two contractors who will not give each other network access
  will both accept a pair of wires.

Its limits are equally clear: one bit of information, one direction, no identity, and no way to say
*which* cue. That is why the rest of this module exists.

### Dry contacts and wet contacts

This is the distinction that gets GPI wiring wrong more than anything else.

- A **dry contact** is a switch with no voltage of its own. It is a relay contact or a pair of
  terminals. The receiving device supplies the voltage and detects the current.
- A **wet contact** supplies its own voltage. The sender puts, say, 24 V on the line and the
  receiver detects it.

Connect a wet output to a wet input and you have two sources fighting. Connect a dry output to a dry
input and nothing happens at all, because nobody is supplying the voltage. Both are extremely common
and the second is the one people spend an afternoon on, because it looks like a fault rather than
like a category error.

**Read the manual for both ends.** The words to look for are *dry contact*, *volt-free*, *isolated
contact* on one side, and *contact closure input*, *requires external voltage*, *sinking*, *sourcing*
on the other.

### Sourcing, sinking and the pull-up

<!--anim:sourcing-sinking-->

The vocabulary comes from industrial control and it is worth learning because every automation
integrator you ever work with will use it:

- A **sinking** output pulls the line down to ground when active. Also called *open collector*,
  *open drain*, *NPN*, or *active low*.
- A **sourcing** output pushes the line up to the supply when active. Also *PNP*, or *active high*.

A sinking output needs a **pull-up resistor** somewhere so the line has a defined voltage when the
output is off. Without it the input is floating, and a floating input is not off: it is undefined,
and it will pick up whatever the dimmer next to it is doing. A floating input that triggers when
somebody walks past the cable is a real fault and it is always a missing pull-up or pull-down.

> **The rule.** Every input must have a defined state when nothing is driving it, and you must know
> which state that is. This is the same argument as the fifth of the Five Questions, one layer down.

### Debounce

Mechanical contacts bounce. A switch pressed once makes and breaks contact several times over
roughly 1 to 20 milliseconds before settling. A microcontroller polling at 1 kHz sees five cue
triggers where a human pressed one button.

The fixes, in order of how much you should like them:

1. **Filter in software.** Ignore any change for 20 to 50 ms after a change. Free, adjustable, and
   what nearly everything does now.
2. **Filter in hardware.** An RC network, or a Schmitt trigger input. Costs a few components and
   works before any code runs, which matters for a safety-adjacent input.
3. **Use a better switch.** Sealed, gold-plated, or optical. Expensive, and it does not remove the
   need for the first one.

A GPI that occasionally fires twice is a debounce problem roughly nine times out of ten. The tenth
is a genuinely noisy cable, and the two are distinguished by whether the double-fire is always
within 20 ms of the first.

---

## Outputs

An output is the same problem in reverse: the control system has to close something in the world.

<!--anim:output-types-->

| Type | What it is | Where it belongs | The catch |
| --- | --- | --- | --- |
| Mechanical relay | A coil pulling contacts together | Anything mains, anything you need genuinely isolated, anything infrequent | Wears out, is slow (5 to 15 ms), and bounces |
| Solid state relay | A triac or MOSFET behind an opto | Frequent switching, silence, no wear | Drops about 1 V while on, so 10 A means 10 to 15 W of heat and a heatsink |
| Open collector | A transistor pulling a line to ground | Talking to another piece of electronics | Needs a pull-up at the far end; cannot source anything |
| Logic level | A pin at 0 V or 3.3/5 V | Board to board, inside a box | No isolation, no distance, and no protection at all |

The word "relay" on a spec sheet tells you almost nothing. What you need is the **form**:

- **Form A** — normally open. Closes on activation. One make contact.
- **Form B** — normally closed. Opens on activation.
- **Form C** — changeover. One common, one normally open, one normally closed.

Form C is what you want for anything that matters, because it lets the receiving end distinguish
*activated* from *disconnected*. With a Form A contact, a cut cable and an inactive output look
identical, forever.

---

## Isolation, and how it gets defeated

Electrical isolation means there is no conductive path between two circuits. Signals cross by
light, magnetism or capacitance instead of by copper.

Why a control system needs it:

- **Ground potential difference.** Two devices 80 m apart in a steel building do not share a ground.
  The difference can be volts, and under a fault it can be hundreds of volts. Without isolation that
  difference appears across your signal.
- **Fault containment.** A mains fault on the load side of an isolated output cannot reach the
  console, or the operator touching it.
- **Noise.** A dimmer's switching noise couples onto a shared ground and rides straight into a data
  line. Break the ground path and it has nowhere to go.

<!--anim:isolation-defeated-->

The thing to understand, and the thing that figure exists to make unforgettable, is that **isolation
is a property of the whole system, not of a component.** A correctly specified 5 kV optocoupler
provides no isolation at all if somebody has connected the two grounds anywhere else: at a shared
power supply, through a rack screw, through the shield of a cable running the same route, or through
a bench earth that was "just for testing" during commissioning.

The measurement that proves it is resistance between the two grounds, with everything connected, at
the end of the build. It should read open. If it reads anything, find out why before anybody signs
anything.

### Where this stops being a control problem

<!--anim:estop-chain-->

An **emergency stop** is not a control signal. It is a safety function, it is governed by a
different body of standards, and it does not go on your show network.

The reasoning is short. A show network is a shared, best-effort transport that can be congested,
misconfigured, or full of a media server's discovery traffic. A safety function has to work when
everything else has failed, which is precisely when a network is least likely to be healthy.

Safety-rated machinery control uses **hardwired dual-channel circuits** with monitoring, so that a
single fault, a shorted wire, a welded contact, a broken conductor, is detected rather than ignored.
Where it does travel on a bus, it travels on a rated safety bus — PROFIsafe, Safety over EtherCAT,
CIP Safety, CANopen Safety — which is a different technology from the network in the rest of this
module, certified to a performance level under EN ISO 13849 or a safety integrity level under
IEC 62061, and it is designed and signed off by somebody qualified to do that.

For entertainment machinery specifically, **EN 17206** is the current European standard, and it will
appear on any tender for powered flying, automation or lifts. Sessions 5 and 8 come back to this.
For now, one sentence to carry:

> **Nothing that stops a machine to protect a person goes on the show network. Ever. It is not a
> performance question and it is not a budget question.**

---

## The numbers everything is written in

Every protocol in the rest of this module is a stream of bytes, and you cannot read a stream of
bytes without being fluent in three representations of the same thing.

<!--anim:byte-explorer-->

### Why hexadecimal, and not something sensible

Because one hex digit is exactly four bits, and two hex digits are exactly one byte. That
correspondence is the entire reason. `0xB7` is `1011 0111`, and you can convert it by eye once you
have done it fifty times. `183` is the same number and tells you nothing about the bits.

You will see hex everywhere: DMX start codes (`0x00`, `0x17`, `0xCC`), MIDI status bytes (`0x90` is
note on channel 1), MAC addresses, RDM manufacturer IDs, IP masks written the hard way, and every
byte in every packet capture you ever open.

| Decimal | Binary | Hex | Where you meet it |
| --- | --- | --- | --- |
| 0 | `0000 0000` | `0x00` | DMX null start code; a channel at zero |
| 127 | `0111 1111` | `0x7F` | The largest MIDI data byte; loopback network |
| 128 | `1000 0000` | `0x80` | The smallest MIDI status byte; the top bit set |
| 170 | `1010 1010` | `0xAA` | The alternating test pattern you will send on a scope |
| 192 | `1100 0000` | `0xC0` | Two bits set; the first octet of 192.168.x.x |
| 240 | `1111 0000` | `0xF0` | MIDI system exclusive; a /28 mask's last octet |
| 255 | `1111 1111` | `0xFF` | A DMX channel at full; a broadcast octet |

### BCD, which refuses to die

Binary-coded decimal stores each decimal digit in four bits: 47 becomes `0100 0111`, not `0010 1111`.
It wastes space and makes arithmetic awkward, and it exists because it converts to a display without
any division.

You still meet it in **SMPTE timecode**, in some **MIDI** contexts, and in a great deal of older
industrial equipment. Session 8 needs it, which is why it is here.

### Two's complement, and negative numbers

A byte holds 0 to 255 if you read it as unsigned, or −128 to +127 if you read it as signed two's
complement. The same eight bits. The difference is purely the agreement about how to read them, which
is this module's whole theme in miniature.

`0xFF` is 255 or −1 depending on the agreement. A pan offset, a trim value or a temperature reading
that jumps to 255 when it should be −1 is a signedness bug, and you will meet one.

### Endianness

<!--anim:endianness-->

When a value is bigger than a byte, which byte goes first? Two answers, both in use:

- **Big-endian**, most significant byte first. This is *network byte order*: everything in an IP
  header, and most protocols in this course, including sACN and Art-Net's packet lengths.
- **Little-endian**, least significant byte first. This is what your laptop's processor uses
  internally, and it is what Art-Net uses for its port addresses, inconsistently with its own
  other fields.

A 16-bit value read with the wrong endianness is not slightly wrong. Universe 1 becomes universe 256.
A pan of 32768 becomes 128. It is one of the more satisfying bugs to find because the wrongness is so
characteristic.

### Bitwise operations

<!--anim:bitmask-->

Four operations, and you need all four to read a protocol specification:

- **AND**, written `&`. Masking: keep the bits you care about and zero the rest. `addr & mask` is
  the whole of subnetting, and it is one instruction.
- **OR**, written with a single vertical bar. Setting: turn bits on without disturbing the others.
- **XOR**, written `^`. Toggling, and checksums. XOR of every byte in a message is the simplest
  error check there is, and several protocols in this course use exactly that.
- **Shift**, written `<<` and `>>`. Moving bits into position. `1 << 5` is 32. Shifting left
  multiplies by two, shifting right divides by two, and both are free.

Two you will use by name in this module:

- `192.168.1.50 & 255.255.255.0` gives `192.168.1.0`, the network. That is Session 4's core skill and
  it is one AND.
- A MIDI status byte is identified by `byte & 0x80`: if the top bit is set it is a status byte, and if
  it is clear it is data. That is Session 7's core skill and it is one AND.

---

## The seven principles

Everything above is technique. This is judgement, and it is the part of the session that will still
be useful in twenty years when every protocol here has been replaced.

<!--anim:principles-tour-->

They are printed in full, with the reason each one exists, on the
[design principles card](/principles). Read them there and print it. Here is the argument for each.

### 1. Ensure safety

First, and not negotiable. If the control system can move something, heat something, fire something
or drop something, then safety is a design constraint before it is a feature. In practice:

- Safety functions are hardwired or on a rated safety bus, never on the show network.
- Every device's behaviour on loss of control is defined, documented and *tested*, not assumed.
- The system cannot be put into an unsafe state by a plausible operator error, and "plausible" means
  what a tired person does at 23:00, not what a careful person does in a demonstration.

### 2. The show must go on

The show is not a system that can be taken down for maintenance. Design for failure:

- What is the single point of failure? There is always one. Name it out loud.
- What is the manual fallback, and has anybody ever practised it?
- Can a component be replaced during a performance, or does replacing it stop the show?

This is the principle that argues for a spare console at the same show file, for a second network
path, and for the humble contact closure alongside the network cue.

### 3. Simpler is always better

The system somebody else can understand at 02:00 is better than the elegant one only you can.
Fewer boxes, fewer protocol conversions, fewer places for an agreement to be wrong.

The test: **can a competent stranger, with the documentation you actually wrote, find and fix a
fault in this system?** If not, it is too complicated regardless of how well it works today.

### 4. Strive for elegance

Elegance here is not aesthetics. It is when the structure of the system matches the structure of the
problem: universes grouped the way the rig is grouped, VLANs that match departments, cue numbers that
match the script. An elegant system is one where the obvious guess about how it works is right.

### 5. Complexity is inevitable, convolution is not

A show system is genuinely complicated because shows are. That is complexity, and you cannot design
it away. **Convolution** is complication that came from the process rather than the problem: three
protocol conversions because of a purchasing decision, two addressing schemes because two people
built halves of it, a cue path that goes through four boxes because nobody deleted the old one.

Complexity is earned. Convolution is inherited. Auditing which is which is a genuinely useful thing
to do to a system you have taken over.

### 6. Make it scalable, and leave room

Every show grows. Leave address space, leave universes, leave switch ports, leave rack space, leave
DSP headroom. A design at 100 per cent of capacity on opening night is a design that will be
compromised by the first change note.

The cheap version of this principle: **plan addressing at half density**. It costs nothing at design
time and it is nearly impossible to retrofit.

### 7. Ensure security

This is the principle that has changed most since the standard text was written, and the one this
industry is most exposed on.

The uncomfortable facts. Almost every protocol in this module has **no authentication whatsoever**.
Anyone who can put a packet on your show network can take over a lighting rig with sACN, drive a
media server with OSC, mute a PA over its control protocol, or reconfigure a fixture over RDM. There
is no password. There is no signature. There is no mechanism by which the fixture could tell your
console from an attacker's laptop, because the protocols were designed for a closed world of trusted
cables.

So security here is not about the protocols. It is about **who can reach the network**:

- Physical: locked racks, no live ports in public areas, no unattended patch panels.
- Logical: the show network is not the office network and is not the internet, and there is no
  route between them that is not deliberate and documented.
- Wireless: if there is Wi-Fi on the show network at all, it is WPA3, it is a separate SSID, and it
  is not the one the crew give the caterers.
- Remote access: through a VPN, with named accounts, or not at all. Not a port forward.
- Defaults: every device with a password gets a new one, and the list lives somewhere the next
  technician can find it.

Session 5 takes this properly. For now: **the show network is a trusted network, so make it one.**

---

## Finding faults

<!--anim:troubleshoot-method-->

More marks, and more show time, are lost to disordered searching than to missing knowledge. Every
year, by a wide margin. The method:

1. **Establish the boundary.** What is working and what is not? Every test should move that boundary.
   A test that could not have changed your mind, whatever its result, was a wasted test.
2. **Change one thing at a time**, and put it back if it did not help. Two simultaneous changes give
   you a result you cannot attribute.
3. **Work from the known good.** Start at an end you are sure about and move toward the fault, rather
   than starting in the middle of the thing you suspect.
4. **Halve the system.** If the signal is good here and bad there, test in the middle. Twelve devices
   take four tests, not twelve. This is the same binary search RDM uses to find fixtures in Session 6.
5. **Prove the fix by reintroducing the fault.** If you cannot make it fail again, you did not find
   it: you disturbed it. This is the step everybody skips and it is the difference between a fix and
   a coincidence.
6. **Write it down.** What the symptom was, what it turned out to be, and how long it took. Your own
   fault log is the most valuable revision material you will ever have.

The single most useful question, and it is not technical: **what changed?** Systems that worked
yesterday and do not work today have had something done to them, and the person who did it is often
in the room and does not know it was relevant.

---

## Common misconceptions

- **"A contact closure is too primitive for a modern system."** It is the most reliable cue transport
  in the building and it is used in that role on major productions every night. It carries one bit,
  which is exactly the right amount for GO. Its limitation is expressiveness, not reliability.
- **"An optocoupler makes the circuit isolated."** It makes that path isolated. Isolation is a
  property of the whole system, and a single shared ground anywhere — a rack screw, a common supply,
  a cable shield — removes it entirely while every component still works perfectly.
- **"A floating input reads as off."** A floating input reads as whatever the surrounding electrical
  environment says. Every input needs a pull-up or a pull-down so that "nothing connected" has a
  defined value, and an input that triggers when somebody walks past the cable is always this.
- **"Hex is just a different way of writing numbers."** It is a way of writing *bits*. One hex digit
  is exactly four bits, which is why every protocol specification is written in it and why a value
  in decimal tells you nothing about the flags inside it.
- **"An emergency stop can go on the network if the network is fast enough."** Speed is not the
  argument. A safety function must work when everything else has failed, which is exactly when a
  shared best-effort network is least trustworthy. Safety functions are hardwired or on a rated
  safety bus, and that is a certification question rather than an engineering preference.
- **"Security is not really an issue, it is a closed network."** Nearly every protocol here has no
  authentication at all, so "closed" is doing every bit of the work. The moment one laptop, one
  wireless bridge or one contractor's port forward is on that network, there is nothing else
  defending it.

---

## Numbers from this session

| Quantity | Value |
| --- | --- |
| Bits in a byte | 8 |
| Values one byte can hold | 256, that is 0 to 255 |
| Values one byte holds signed | −128 to +127, two's complement |
| Bits in one hex digit | 4 |
| Bytes shown by two hex digits | 1 |
| DMX null start code | `0x00` |
| Full DMX channel value | 255, `0xFF` |
| Smallest MIDI status byte | 128, `0x80` |
| Largest MIDI data byte | 127, `0x7F` |
| Typical mechanical switch bounce | 1 to 20 ms |
| Usual software debounce window | 20 to 50 ms |
| Mechanical relay operate time | about 5 to 15 ms |
| Solid state relay voltage drop | about 1 to 1.5 V while conducting |
| Relay contact forms | A normally open, B normally closed, C changeover |
| Common optocoupler isolation | about 5 kV |
| Network byte order | big-endian, most significant byte first |
| Design principles | seven, safety first |
| European entertainment machinery standard | EN 17206 |
| Machinery safety standards for performance level | EN ISO 13849, IEC 62061 |
