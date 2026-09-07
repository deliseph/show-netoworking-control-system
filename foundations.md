# Foundations

Everything in this module is bytes, addresses and time. Nothing on this page is difficult, and all of
it is assumed in every session. Forty minutes here, done once, and the rest of the course stops
fighting you.

If you have already done the Electronics for Theatre or Computer Systems modules, most of this will
be revision. Do the powers of two and the hex table anyway; they need to be automatic rather than
derivable.

---

## Bits and bytes

A **bit** is one binary digit: 0 or 1. It is the smallest thing that can carry information, and every
protocol in this course is ultimately a stream of them.

A **byte** is eight bits. Eight bits have 2⁸ = **256** possible patterns, so one byte holds a value
from **0 to 255**. That number appears constantly: a DMX channel level, an octet of an IP address,
the maximum value of most things you will meet.

A **nibble** is four bits, so 0 to 15. It matters because one hexadecimal digit is exactly one
nibble.

### The unit trap

| Symbol | Name | What it is |
| --- | --- | --- |
| b | bit | One binary digit |
| B | byte | Eight bits |
| kbit/s | kilobit per second | 1000 bits per second |
| MB | megabyte | 1,000,000 bytes |
| MiB | mebibyte | 1,048,576 bytes, that is 2²⁰ |

**Network rates are in bits. File sizes are in bytes.** A 100 Mbit/s link moves at most about
12.5 MB/s, and the factor of eight between them is the single most common arithmetic error in this
subject. When a number looks eight times wrong, it is this.

The k/M/G prefixes are powers of ten in networking and storage, and powers of two in memory. The
Ki/Mi/Gi prefixes exist to say "powers of two" unambiguously, and hardly anybody uses them. Know that
the ambiguity exists and do not lose sleep over it: the difference is under 5 per cent at the
kilobyte scale and it is never what your problem is.

---

## Powers of two

<!--anim:powers-of-two-->

Learn these. Not derive them: know them, the way you know a phone number.

| n | 2ⁿ | Where it turns up |
| --- | --- | --- |
| 0 | 1 | |
| 1 | 2 | |
| 2 | 4 | |
| 3 | 8 | Bits in a byte |
| 4 | 16 | MIDI channels; one hex digit's worth |
| 5 | 32 | Devices on a DMX segment |
| 6 | 64 | Addresses in a /26 |
| 7 | 128 | The MIDI status/data boundary; half a byte's range |
| 8 | 256 | Values in one byte; addresses in a /24 |
| 9 | 512 | Slots in a DMX universe |
| 10 | 1024 | |
| 16 | 65536 | 16-bit values; the size of a /16 |

Two habits that make the rest easy:

- **Doubling upward** from a number you know is faster than starting at 1. From 256, double: 512,
  1024, 2048.
- **A power of two minus two** is the usable-host count of a subnet, and you will do that subtraction
  perhaps two thousand times in your career.

---

## Binary

Binary is base two. Each position is worth twice the one to its right.

```
  128   64   32   16    8    4    2    1
    1    0    1    1    0    1    1    1     =  183
```

128 + 32 + 16 + 4 + 2 + 1 = 183. That is the whole method, and reading the place values off the top
row is how you do it quickly.

Going the other way, from decimal to binary: **subtract the largest power of two that fits, and
repeat.**

```
183 − 128 = 55    →  1 in the 128 column
 55 −  64  no     →  0 in the 64 column
 55 −  32 = 23    →  1
 23 −  16 =  7    →  1
  7 −   8  no     →  0
  7 −   4 =  3    →  1
  3 −   2 =  1    →  1
  1 −   1 =  0    →  1
                     10110111
```

Do it twenty times and it becomes automatic. The [number tool](/tools#tool-binhex) will check you.

---

## Hexadecimal

Hex is base sixteen, using 0 to 9 then A to F for ten to fifteen.

The reason it exists, and the only reason worth remembering: **one hex digit is exactly four bits, so
two hex digits are exactly one byte.** The correspondence is perfect, so converting is a lookup
rather than arithmetic.

| Hex | Binary | Decimal |
| --- | --- | --- |
| 0 | 0000 | 0 |
| 1 | 0001 | 1 |
| 2 | 0010 | 2 |
| 3 | 0011 | 3 |
| 4 | 0100 | 4 |
| 5 | 0101 | 5 |
| 6 | 0110 | 6 |
| 7 | 0111 | 7 |
| 8 | 1000 | 8 |
| 9 | 1001 | 9 |
| A | 1010 | 10 |
| B | 1011 | 11 |
| C | 1100 | 12 |
| D | 1101 | 13 |
| E | 1110 | 14 |
| F | 1111 | 15 |

So `0xB7` is `1011 0111`, which is 183. Split the byte into two nibbles, look each up, done. No
multiplication involved.

Going from hex to decimal when you need it: **first digit × 16, plus second digit.** `0xB7` is
11 × 16 + 7 = 176 + 7 = 183.

Values worth simply knowing on sight:

| Hex | Decimal | Meaning |
| --- | --- | --- |
| `0x00` | 0 | Zero, off, the DMX null start code |
| `0x0F` | 15 | Low nibble full |
| `0x10` | 16 | |
| `0x1F` | 31 | Five bits |
| `0x20` | 32 | ASCII space |
| `0x7F` | 127 | Seven bits; largest MIDI data byte |
| `0x80` | 128 | Top bit only; smallest MIDI status byte |
| `0xC0` | 192 | Top two bits |
| `0xF0` | 240 | Top nibble full; MIDI SysEx start |
| `0xFF` | 255 | All eight bits; DMX full |

---

## Reading a rate

<!--anim:rate-ladder-->

Rates in this course span nine orders of magnitude, from a MIDI cable to a broadcast backbone, and
being able to place a number on that scale is more useful than remembering any one of them.

| Rate | What runs at it |
| --- | --- |
| 31.25 kbit/s | MIDI 1.0 on a DIN cable |
| 250 kbit/s | DMX512 |
| 1.152 Mbit/s | One channel of 48 kHz, 24-bit audio |
| 10 Mbit/s | Very old Ethernet; a small sACN rig |
| 100 Mbit/s | Ethernet on older nodes and fixtures |
| 1 Gbit/s | The default network link |
| 3 Gbit/s | 1080p60 uncompressed video |
| 10 Gbit/s | Switch uplinks, media servers |
| 100 Gbit/s | Large broadcast plants |

### The one calculation you will do most

**Rate = size ÷ time**, and its two rearrangements. For a repeating stream:

```
rate = bytes per packet × 8 × packets per second
```

A DMX universe over sACN: about 638 bytes of sACN plus 42 bytes of headers, so 680 bytes, at 44
packets per second.

```
680 × 8 × 44  =  239,360 bit/s  ≈  240 kbit/s per universe
```

A hundred universes is 24 Mbit/s. That is the calculation Session 6 needs, and it is one
multiplication.

---

## Time, and the prefixes below one

| Prefix | Symbol | Value | An example from this course |
| --- | --- | --- | --- |
| milli | m | 10⁻³ | A DMX packet is 22.7 ms |
| micro | µ | 10⁻⁶ | A DMX slot is 44 µs; PTP is accurate to under a µs |
| nano | n | 10⁻⁹ | A signal takes about 5 ns per metre of copper |

Two conversions worth having instantly:

- **A frequency and a period are reciprocals.** 44 Hz is 1 ÷ 44 = 22.7 ms. 250 kbit/s means one bit
  takes 1 ÷ 250,000 = 4 µs.
- **1 ms is 1000 µs.** So a 22.7 ms packet is 22,700 µs, and 512 slots at 44 µs is 22,528 µs plus the
  break. The numbers agree, which is how you know you have understood the packet.

---

## Powers of ten without a calculator

Digits first, then count the zeros.

```
0.02 × 150   →   2 × 150 = 300,  and 0.02 is 2 × 10⁻²,  so 300 × 10⁻² = 3
```

```
44 µs × 512  →   44 × 512 = 22,528,  in µs,  so 22.528 ms
```

Getting this wrong by a factor of ten is the most common numerical error in this subject, and it is
always fixed by separating the digits from the zeros.

---

## Bitwise AND, which is all of subnetting

The AND of two bits is 1 only if both are 1.

```
Address  192.168.1.50   11000000 10101000 00000001 00110010
Mask     255.255.255.0  11111111 11111111 11111111 00000000
                        ────────────────────────────────────
Network  192.168.1.0    11000000 10101000 00000001 00000000
```

Where the mask has a 1, the address bit survives. Where it has a 0, the bit is zeroed. That is the
whole of it, and every subnetting question in this course is that one operation.

The shortcut for the octet where the mask is not 0 or 255: **the block size is 256 minus the mask
octet**, and the network is the address octet rounded down to a multiple of the block size.

```
Mask octet 192  →  block size 64  →  networks at 0, 64, 128, 192
Address octet 100  →  100 ÷ 64 = 1.56  →  round down to 1  →  network octet 64
```

Drill this until it is fast. The [subnetting trainer](/practice#subnetdrill) is endless and it is the
single highest-value twenty minutes a night in the whole module.

---

## What to do with this page

1. Learn the powers of two to 1024 and the hex table. Both are lookup, not derivation.
2. Do the [number tool](/tools#tool-binhex) until converting a byte takes five seconds.
3. Do the [subnetting trainer](/practice#subnetdrill) for twenty minutes a night for a week before
   Session 4. Not three hours the night before; the spacing is what makes it stick.
4. Come back here whenever a number looks eight times or ten times wrong, because it will be bits
   against bytes, or a misplaced power of ten.
