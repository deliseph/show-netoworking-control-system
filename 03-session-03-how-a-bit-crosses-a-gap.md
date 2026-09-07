# Session 3 — How a Bit Crosses a Gap

> Two devices, one wire, and no shared clock. Everything in data communication is the set of tricks
> that makes that work, and every one of those tricks is still visible in the protocols you use.

## Before you come

### What you must already be able to do

Read binary and hex fluently enough to convert a byte in your head. Know what a volt is and what a
ground is. Know that a signal takes time to travel down a cable.

Session 2's number work is a hard prerequisite here. If `0xB7` does not immediately read as
`1011 0111`, spend twenty minutes with the [number tool](/tools#tool-binhex) before you arrive,
because this session decodes bytes in front of you.

### Three things to do

1. **Find every different data connector in one venue and photograph it.** XLR 5-pin, XLR 3-pin,
   RJ45, USB-A, USB-C, D-sub 9, BNC, LC fibre, SFP cage, phoenix block, TRS. For each, write down
   what you think travels on it. You will be wrong about at least two, which is the point.
2. **Look up one device's manual and find its data specification.** The words to hunt for are the
   rate (bit/s or baud), the interface (RS-232, RS-485, USB, Ethernet), and the connector. Note how
   often the manual gives you two of the three and leaves you to guess the last.
3. **Open a fixture's manual and find a table of DMX channels.** Do not learn it. Just notice that
   it is a list of byte positions and meanings, which is exactly what a protocol specification is.

### What to bring

Notebook, laptop. If you own a USB logic analyser or a pocket scope, bring it; there are shared ones
but there are not enough.

<!--ready:3-->

---

## Run of the session

| Min | Block | What happens |
| --- | --- | --- |
| 10 | Open | Numbers quiz, and the connectors you photographed |
| 40 | The idea | Layering, encoding, rate against bandwidth, determinism, multiplexing, duplex |
| 15 | Break |  |
| 35 | The idea | Error detection, flow control, and the three media: copper, light, radio |
| 30 | Lab | Put a scope on a serial line, measure a bit, calculate the rate, decode a byte by hand |
| 40 | Lab | Build an RS-485 link, prove differential rejection, then remove the terminator and measure the reflection |
| 10 | Close | Why serial won, and what Session 4 does with all of this |

---

## Layering, and why you should care

Layering is the single most useful idea in this module, and it is usually taught as a diagram to
memorise, which wastes it.

Here is what it is actually for. When something does not work, layering tells you **what to test
next**, because each layer depends only on the one below it. If the layer below is proved good, the
fault is at or above where you are standing. That turns a vague "the lights are not working" into a
sequence of four tests that each eliminate half the system.

<!--anim:layer-ladder-->

The general principle, before any specific model:

- Each layer provides a service to the one above and uses the service of the one below.
- Each layer talks to *the same layer* at the far end, as if the layers below did not exist. That is
  called a **peer relationship** and it is why you can reason about IP without thinking about copper.
- A layer can be swapped without disturbing its neighbours. This is why DMX512 runs over RS-485
  copper, over fibre, over radio and over IP, and why the fixtures do not know the difference.

Hold on to the swap property. It is the entire reason the second half of this course exists: sACN is
DMX's data model with the bottom layers replaced by Ethernet and IP.

### Character encoding

Bytes are numbers. Text is an agreement about what those numbers mean, and there have been several.

**ASCII** uses the low 7 bits, so 0 to 127, and covers unaccented English plus control characters.
Everything in this industry that sends text — OSC addresses, console command lines, telnet control
protocols — assumes ASCII at minimum.

**UTF-8** is the modern answer and it is what you should assume everywhere now. Its trick is that
the first 128 values are identical to ASCII, so plain English text is byte-for-byte the same, and
anything beyond that uses two, three or four bytes with the top bit set.

<!--anim:encoding-bytes-->

Why a technician cares:

- A fixture label, a cue name or a Dante device name in 中文 is **not one byte per character**. A
  field that accepts "16 characters" may accept five Chinese characters, or may accept sixteen and
  then truncate mid-character and show a replacement glyph.
- Old equipment that assumes one byte per character will mangle anything non-ASCII, and the failure
  is silent: the name looks wrong on one screen and fine on another.
- **The practical rule for show files: name things in ASCII.** It is not a cultural statement, it is
  that the tenth device in the chain is running firmware from 2011.

---

## Rate, bandwidth, and the difference

These get used interchangeably and they are not the same thing.

- **Data rate** is how many bits go past per second. Measured in bit/s, and in this industry usually
  kbit/s, Mbit/s or Gbit/s. It is what you calculate a load with.
- **Bandwidth**, strictly, is the range of frequencies a channel can carry, in Hz. It is a property
  of the physical path.

Bandwidth limits rate, and the relationship is not one to one: modulation schemes get more bits per
hertz, at the cost of noise margin. That is why gigabit Ethernet fits on cable originally specified
for 100 Mbit/s, and why it fails on a bad cable in a way that 100 Mbit/s did not.

In everyday use "bandwidth" has come to mean "capacity" and you will not win that argument. What you
must not lose is the underlying distinction:

<!--anim:rate-vs-bandwidth-->

> A link that is not busy can still be too slow, because rate is not the only thing that matters.
> **Latency** is how long one message takes to get there, and **jitter** is how much that varies.
> A 10 Gbit/s link with 40 ms of jitter is useless for audio and fine for a file copy.

### The numbers you should be able to produce without help

- A **DMX universe** is 512 slots at 250 kbit/s, refreshing at about 44 Hz. As a network payload it
  is roughly **200 kbit/s** including headers.
- A channel of **48 kHz, 24-bit audio** is 48000 × 24 = **1.152 Mbit/s** before any packet overhead.
  Sixty four channels is about 74 Mbit/s of payload, and about 90 Mbit/s on the wire.
- **1080p60 uncompressed** at 8 bits per component is about **3 Gbit/s**. This is why uncompressed
  video over IP needs 10 Gbit/s links and why everything else is compressed.
- **NDI** at 1080p60 is roughly **100 to 150 Mbit/s** for full-bandwidth NDI, and a few Mbit/s for
  NDI HX. The difference matters enormously when you have sixteen sources.

---

## Determinism

This is the concept the entertainment industry cares about more than almost anyone else, and it is
badly served by consumer networking vocabulary.

A **deterministic** system delivers a message within a guaranteed time, every time. A
**best-effort** system delivers it as soon as it conveniently can, usually very fast, occasionally
not.

<!--anim:determinism-band-->

Ethernet and IP are best-effort by design. That is not a defect, it is the trade that made them
cheap and universal. What the industry has done about it, in increasing order of strength:

1. **Over-provision.** Run the network at 5 per cent of capacity so congestion never happens. Crude,
   effective, and by far the most common real answer.
2. **Prioritise.** QoS: mark the important traffic and let switches serve it first. Session 5.
3. **Separate.** Put the critical traffic on its own physical network. Still the standard answer for
   ST 2110 and for machinery.
4. **Reserve.** AVB/TSN actually reserves bandwidth end to end, with time-aware shaping. Genuinely
   deterministic, requires every switch in the path to support it, and that requirement is why
   adoption has been slower than the technology deserved.

The honest engineering position in 2026: **a well-designed show network is not deterministic, it is
reliably fast enough**, and the difference matters on the night you find out.

### What each discipline can tolerate

| Traffic | Tolerable latency | Tolerable jitter | What loss does |
| --- | --- | --- | --- |
| Lighting, DMX/sACN | 20 to 40 ms | Loose | Nothing: the next packet repairs it |
| Audio, Dante/AES67 | 0.25 to 5 ms typical | Very tight | Audible click, then a mute |
| Video over IP | 1 frame or less | Tight | Dropped frame or a visible artefact |
| Timecode | Sub-frame | Tight | Loss of sync, then a freewheel |
| Machinery feedback | Sub-10 ms | Tight | Safety stop |
| Cues, MSC/OSC | 10 to 50 ms | Loose | **The cue never happens** |
| Management, discovery, file copy | Seconds | None | Nothing |

The last two rows are the interesting ones. A cue has a *loose* latency requirement and a
*catastrophic* loss consequence, which is the opposite shape from audio, and it is why the two need
different handling rather than the same "make it fast" answer.

---

## Multiplexing

Multiplexing is sharing one path between several conversations. Three mechanisms, all of them in use
in a venue tonight:

<!--anim:multiplex-->

- **Time division.** Each conversation gets the whole path for a slice of time. DMX512 is pure TDM:
  512 slots, each getting 44 µs of the wire, in a fixed repeating order. So is a Socapex cable in a
  loose sense, and so is every digital audio multicore.
- **Frequency or wavelength division.** Each conversation gets a different frequency band on the
  same path. Radio microphones on one antenna distribution. WDM on one fibre, where eight colours of
  light carry eight independent links down one strand.
- **Statistical.** Conversations take turns based on who has something to say. This is packet
  switching, and it is what Ethernet does. It is far more efficient than TDM when traffic is bursty,
  and it is why a network is best-effort: two devices can want the wire at the same moment.

The trade is exactly the determinism one. TDM gives you a guaranteed slot whether you need it or not.
Statistical gives you the whole wire when nobody else wants it and a queue when they do.

## Communications mode

<!--anim:duplex-->

- **Simplex**: one direction, always. DMX512 is simplex, which is why a fixture cannot tell a console
  anything, including that it exists.
- **Half duplex**: both directions, one at a time, with a turnaround. RDM is half duplex over the
  same pair DMX uses, and the turnaround timing is why RDM is fussy about splitters.
- **Full duplex**: both directions simultaneously. Ethernet over twisted pair since 100BASE-TX, using
  separate pairs or echo cancellation.

Half duplex is where the subtle faults live, because the turnaround has a timing budget. A device
that is a fraction slow to release the line, or a splitter that does not pass the reverse direction,
breaks the conversation while every device on it appears healthy.

---

## Error detection

You cannot prevent errors. You can only notice them, and then decide what to do.

<!--anim:crc-catch-->

| Method | Catches | Misses | Where you meet it |
| --- | --- | --- | --- |
| Parity | Any odd number of flipped bits | Any even number | Serial links, RS-232 configuration |
| Checksum, sum of bytes | Most single errors | Reordering, and compensating errors | MIDI SysEx, many simple protocols |
| XOR of all bytes | Single-bit errors in one position | A lot | Older industrial protocols |
| CRC | Essentially all burst errors up to its width | Vanishingly little | Ethernet (CRC-32), USB, most modern protocols |

The critical thing to internalise: **detection is not correction.** Ethernet's CRC-32 detects a
corrupted frame and the switch silently drops it. Nothing retransmits it unless a higher layer asks,
and UDP does not ask. So a corrupted sACN packet is a lost sACN packet, which is fine, and a
corrupted OSC cue is a cue that never happened, which is not.

That is the same asymmetry as the latency table above, arriving from a different direction, and it
is the argument for sending critical cues over TCP or for repeating them.

**DMX512 has no error detection at all.** Not a weak one: none. There is no checksum, no CRC, no
sequence number. A corrupted slot value is delivered as a valid value, and the fixture does it. The
protocol relies entirely on repeating the whole picture 44 times a second, so a bad value is
overwritten in 22 milliseconds. That is a legitimate design, and it explains every DMX symptom you
will ever see: a single flicker rather than an error message.

### Flow control

Flow control is how a receiver says *slow down*. Two families:

- **Hardware**, using extra wires. RTS/CTS on RS-232. Reliable, needs the wires, and is the reason
  a nine-pin serial cable has nine pins for a three-pin job.
- **Software**, using in-band characters. XON/XOFF sends `0x11` and `0x13` in the data stream, which
  means those two byte values cannot appear in your data. Fine for text, disastrous for binary.

At the network level, TCP does flow control with a **window**: the receiver advertises how much it
can accept, and the sender must not exceed it. UDP does none at all, which is why a UDP sender can
comfortably overrun a receiver and never find out.

---

## Getting a signal down a physical thing

### Electricity

<!--anim:differential-->

Two ways to put a signal on copper:

- **Single-ended**: one signal wire, measured against ground. Cheap, and it assumes the two ends
  share a ground, which over any distance in a real building they do not.
- **Differential**: two wires carrying opposite versions of the signal, and the receiver looks only
  at the *difference*. Interference lands on both equally and subtracts out. Ground offset does the
  same.

That one idea is why RS-485, DMX512, balanced audio and every twisted pair in an Ethernet cable
work at all. It is the single highest-value physical-layer concept in this course.

The other physical concepts you need:

- **Impedance and termination.** A cable has a characteristic impedance: 110 Ω for DMX cable, 100 Ω
  for Cat cable, 75 Ω for video coax. A signal reaching an unmatched end reflects back down the
  cable and interferes with what follows. A terminator is a resistor of the matching value that
  absorbs it. Session 6 measures this.
- **Propagation velocity.** A signal travels at roughly two thirds the speed of light in copper,
  about 200 metres per microsecond, or **5 nanoseconds per metre**. You can locate a fault by timing
  its reflection, which is exactly how a cable fault locator works and what the lab does today.
- **Attenuation.** Signal shrinks with distance, and faster at higher frequencies. This is why
  100 m is the Ethernet copper limit and why exceeding it fails at gigabit before it fails at
  100 Mbit/s.

### Light

Fibre carries data as pulses of light, and it solves three problems at once: no electrical
connection, so no ground loops and no isolation problem; no electromagnetic pickup at all; and
distances of kilometres.

| Type | Core | Reach | Where |
| --- | --- | --- | --- |
| OM3/OM4 multimode | 50 µm | 300 to 400 m at 10G | Inside a venue, between racks |
| OS2 single-mode | 9 µm | 10 km and beyond | Between buildings, broadcast, long tours |
| Tactical / expanded beam | Either | Deployable | Touring, outdoor events, anything that gets stood on |

Practical points that catch people out: fibre connectors must be **clean**, and a dirty LC ferrule is
the single most common fibre fault; a transceiver is an **SFP** module you buy separately and match
to the fibre type and the reach; and multimode and single-mode are not interchangeable even though
the connectors fit.

### Radio

<!--anim:media-compare-->

Radio is a shared medium with no owner, which makes it the opposite of everything else in this
course. Anyone can transmit on your frequency and there is no mechanism by which they will not.

| Technology | Band | Use in shows | The honest position |
| --- | --- | --- | --- |
| Wi-Fi 6 / 6E / 7 | 2.4, 5, 6 GHz | Crew tablets, remote focus, audience interaction | Fine for a human holding a device, never for a cue path |
| Wireless DMX | 2.4 GHz, proprietary | Fixtures with no cable route, temporary rigs | Works well, is a real product category, and still shares a band with every phone in the room |
| Radio microphones | UHF, and increasingly 1.9 GHz DECT | Everywhere | A licensing and coordination discipline of its own |
| UWB | 6 to 8 GHz | Position tracking, BlackTrax and similar | Centimetre accuracy, and Session 8 comes back to it |
| Bluetooth LE | 2.4 GHz | Configuration, sensors, props | Short range, low rate, and increasingly the way a fixture is set up |
| LoRa, Zigbee, Thread | Sub-GHz and 2.4 | Installations, sensors, building systems | Long battery life, low rate, not for anything time-critical |

**The rule for radio in show control**: it is acceptable where a human is in the loop and would
notice a failure, and unacceptable where a cue depends on it. There is no configuration that changes
this, because you do not control the spectrum.

---

## Point to point: the interfaces themselves

### Why serial won

<!--anim:serial-frame-->

Parallel interfaces send eight or more bits at once on separate wires. Faster per clock, and they
are gone from everything except very short board-to-board runs, for two reasons:

- **Skew.** Eight wires do not deliver eight bits at exactly the same moment, and the faster you go
  the more that matters. At some rate the bits arrive in the wrong clock cycle.
- **Cost and bulk.** Eight conductors plus grounds, at every connector, every metre.

Serial sends one bit at a time down one path, so there is no skew, and the whole engineering effort
goes into making that one path fast. It won completely: USB, SATA, PCIe, HDMI, DisplayPort, Ethernet
and every protocol in this course are serial.

The basic **asynchronous serial frame** — one start bit, eight data bits sent least significant first,
one or two stop bits — is worth knowing in your hands, because you will see it on a scope. There is
no clock line: both ends agree a rate in advance and the receiver samples in the middle of each bit,
using the start bit's falling edge to synchronise.

That agreement is why **a wrong baud rate gives you garbage rather than nothing.** The receiver is
sampling at the wrong moments and assembling bytes that are valid values and completely meaningless.
"There is data but it is nonsense" is a rate problem far more often than a wiring one.

### The TIA serial standards

<!--anim:tia-standards-->

| Standard | Signalling | Devices | Distance | Where it lives now |
| --- | --- | --- | --- | --- |
| RS-232 | Single-ended, ±3 to ±15 V | 2 | 15 m at 19.2 kbit/s | Console service ports, projectors, legacy show control, USB adapters |
| RS-422 | Differential, one driver | 1 driver, 10 receivers | 1200 m | Sony 9-pin machine control, some industrial |
| RS-485 | Differential, multi-drop | 32 unit loads per segment | 1200 m | **DMX512, RDM**, Modbus RTU, and a great deal of industrial control |

**RS-485 is the electrical layer under DMX512, and the two are constantly confused.** RS-485 says
what the voltages are and how the wires are arranged. DMX512 says what the bits mean. A DMX problem
is nearly always an RS-485 problem, and the RS-485 problems are a short list: no termination, wrong
cable impedance, too many devices on a segment, a star instead of a daisy chain, or a broken screen.

Learning that distinction is worth an hour of anybody's fault-finding time, every year, forever.

### USB, which is not a control interface and is used as one

<!--anim:usb-family-->

USB was designed to connect peripherals to one computer, and everything about it reflects that: it
is host-centric, it is short, and it is not isolated.

| Generation | Rate | Notes for our purposes |
| --- | --- | --- |
| USB 2.0 | 480 Mbit/s | Still what most MIDI and DMX interfaces actually use |
| USB 3.2 | 5 to 20 Gbit/s | Capture devices, fast storage |
| USB4 / Thunderbolt 4 and 5 | 40 to 120 Gbit/s | Docks, displays, external GPUs, and increasingly the only port on a laptop |
| USB-C | The connector, not a speed | Carries USB, DisplayPort, Thunderbolt and up to 240 W of power, and the cable decides which |

The things that catch shows out:

- **5 m is the practical passive limit** for USB 2.0, and much less for USB 3 and above. Beyond that
  you need an active extender, and the cheap ones are a documented source of intermittent faults.
- **No isolation.** A USB device shares ground with the host, so a USB MIDI interface on a stage box
  ties the console's ground to whatever else is on that ground. This is a real cause of hum and of
  equipment damage.
- **USB-C tells you nothing.** Two identical-looking cables can be a 480 Mbit/s charging cable and a
  40 Gbit/s Thunderbolt cable. Label them or buy them in one colour per type.
- **Enumeration is not deterministic.** A USB device that reappears after a glitch may come back as a
  different port name, and any show software that addressed it by port has now lost it.

> **For a show-critical path, USB is a last resort.** It is fine for a control surface on a desk next
> to the machine. It is not fine as the transport for a cue that has to happen.

---

## Extension: what actually replaced all of this

If you were designing a device today and needed it to be controllable, you would not choose any of
the interfaces in the table above. You would put an **Ethernet port** on it and speak IP, and you
would probably expose an **HTTP or WebSocket API** as well as whatever industry protocol applies.

That is what has happened across the whole market since the standard text was written. A modern
moving light has an Ethernet port. A modern amplifier has one. A modern hoist controller has one. A
modern media server has four. RS-485 survives underneath, as the last metre from a node to a fixture,
and RS-232 survives on service ports and projectors.

The rest of the course is therefore mostly about what happens on that Ethernet port, which is why
Session 4 is where the work is.

---

## Common misconceptions

- **"Bandwidth and data rate are the same thing."** Bandwidth is a frequency range and a property of
  the path; rate is bits per second. They are related but not equal, and more usefully: neither of
  them tells you the latency or the jitter, which are what decide whether audio and video work.
- **"Ethernet is deterministic enough now that it does not matter."** Ethernet is best-effort by
  design. A well-built show network is reliably fast rather than deterministic, and the difference
  is invisible until the night the network is busy. Real determinism needs reservation, which needs
  every switch in the path to support it.
- **"A checksum means the data is correct."** A checksum means an error was not detected. Detection
  is not correction: a corrupted Ethernet frame is silently dropped, and if nothing above asks for a
  retransmission, that data is simply gone.
- **"DMX has error checking because it works so reliably."** DMX512 has no error detection of any
  kind. Its reliability comes entirely from repeating the complete picture about forty four times a
  second, so a bad value is replaced 22 milliseconds later. This is why DMX faults present as flicker
  rather than as errors.
- **"RS-485 and DMX512 are the same thing."** RS-485 defines voltages and wiring; DMX512 defines what
  the bits mean. Many protocols run over RS-485. Knowing the distinction is what lets you diagnose a
  DMX fault as a termination problem rather than as a fixture problem.
- **"USB is fine, it is a modern interface."** It is host-centric, unisolated, limited to about five
  metres passive, and its device enumeration is not guaranteed to be stable across a power glitch.
  It is excellent on a desk and a poor choice for a cue path.
- **"Fibre is only for long distances."** Fibre's other two properties matter more in a venue:
  complete electrical isolation, so no ground loops and no shared fault paths, and total immunity to
  the electromagnetic environment created by dimmers, motors and LED drivers.

---

## Numbers from this session

| Quantity | Value |
| --- | --- |
| ASCII range | 0 to 127, seven bits |
| UTF-8 bytes per character | 1 to 4, and the first 128 match ASCII |
| Signal velocity in copper | about two thirds of c, roughly 5 ns per metre |
| Ethernet copper distance limit | 100 m |
| DMX cable characteristic impedance | 110 Ω |
| Cat cable characteristic impedance | 100 Ω |
| Video coax characteristic impedance | 75 Ω |
| DMX512 bit rate | 250 kbit/s |
| DMX512 as a network payload | about 200 kbit/s per universe |
| One channel of 48 kHz 24-bit audio | 1.152 Mbit/s |
| 1080p60 uncompressed | about 3 Gbit/s |
| NDI full bandwidth, 1080p60 | about 100 to 150 Mbit/s |
| MIDI 1.0 DIN bit rate | 31.25 kbit/s |
| RS-232 practical distance | 15 m |
| RS-422 and RS-485 distance | 1200 m |
| RS-485 unit loads per segment | 32 |
| USB 2.0 rate | 480 Mbit/s |
| USB 2.0 passive cable limit | about 5 m |
| USB4 and Thunderbolt 4 rate | 40 Gbit/s |
| OM3 multimode reach at 10G | about 300 m |
| OS2 single-mode reach | 10 km and beyond |
| Audio over IP typical latency | 0.25 to 5 ms |
| Lighting acceptable latency | 20 to 40 ms |
| Ethernet frame check | CRC-32 |
| DMX512 error detection | none |
