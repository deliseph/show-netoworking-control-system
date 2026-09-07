# Session 4 — Ethernet and IP: The Network Under Every Show

> One cable standard beat every purpose-built alternative this industry ever designed, and it did it
> by being mediocre at everything and cheap at all of it.

## Before you come

### What you must already be able to do

Convert between binary, decimal and hex without a calculator. Know the powers of two to 256 by
heart: 1, 2, 4, 8, 16, 32, 64, 128, 256. Understand a bitwise AND.

**This is the session that punishes an unprepared student.** Subnetting is arithmetic and it does not
absorb in one sitting. Spread the preparation over three or four evenings and you will spend this
session learning the network. Leave it to the night before and you will spend it doing sums.

### Three things to do

1. **Run the [subnetting trainer](/practice#subnetdrill) for twenty minutes a night for at least
   four nights.** Not three hours the day before. This is the one piece of preparation in the module
   where the spacing genuinely matters, and it is the difference between a comfortable session and a
   miserable one.
2. **Find your own machine's address, mask, gateway and MAC.** On Windows `ipconfig /all`, on macOS
   and Linux `ifconfig` or `ip addr`. Write all four down. Then work out, by hand, what network your
   machine is on. The [field card](/field) has the commands.
3. **Install Wireshark and capture sixty seconds of your home or campus network.** Do not try to
   understand it. Just look at it, notice that most of it is not addressed to you, and find one ARP
   packet and one DHCP packet by using the filter box.

### What to bring

Laptop with Wireshark installed and a working Ethernet port or a USB-C adapter that you have already
tested. A patch cable. Notebook. If you have a managed switch of your own, bring it.

<!--ready:4-->

---

## Run of the session

| Min | Block | What happens |
| --- | --- | --- |
| 10 | Open | Numbers quiz, and the address you wrote down |
| 40 | The idea | The OSI ladder as a diagnostic tool, frames, what a switch does, Ethernet and PoE, and Wi-Fi's honest limits |
| 15 | Break |  |
| 40 | The idea | The 32 bits, masks and CIDR, DHCP against static against link-local, ARP, TCP against UDP, ports |
| 35 | Lab | Address a rig by hand from a plan, prove it with ping and arp, then break it four ways |
| 30 | Lab | Wireshark: find the ARP exchange, the DHCP conversation, and the broadcast traffic nobody asked for |
| 10 | Close | What this network is about to be asked to carry |

---

## The ladder

The OSI model is seven layers, and it is taught as seven things to memorise, which is why most people
who can recite it cannot use it.

Use it like this instead: **when something does not work, you are standing on a ladder, and the
question is always whether the rung below you is sound.**

<!--anim:osi-ladder-->

| Layer | Name | What it does | How you test it |
| --- | --- | --- | --- |
| 7 | Application | The thing you actually wanted | Does the console see the fixture? |
| 6 | Presentation | Format, encoding, encryption | Rarely a separate box in practice |
| 5 | Session | Conversations between applications | Rarely separate in practice |
| 4 | Transport | TCP or UDP, ports, reliability | Is the port open? `telnet host port` |
| 3 | Network | IP addresses, routing between networks | `ping` the far address |
| 2 | Data link | MAC addresses, Ethernet frames, switching | `arp -a`, does the switch show a MAC? |
| 1 | Physical | Copper, fibre, radio, voltages | Is there a link light? |

In real fault-finding you use four of them: link light, MAC, IP, port. Layers 5 and 6 are largely
absorbed into applications, and layer 7 is where the problem *appears* rather than where it *is*.

**The method:** start at the bottom, go up, and stop at the first thing that fails. That is the
whole value of the model, and it turns "the lights are not working" into four tests.

### Frames, packets and encapsulation

<!--anim:encapsulation-->

Each layer wraps the layer above in a header, sends it, and the far end unwraps it. Your sACN packet,
travelling from a console to a node, physically looks like this on the wire:

```
[ Ethernet header ][ IP header ][ UDP header ][ sACN packet ][ Ethernet CRC ]
   14 bytes           20 bytes     8 bytes      up to 638        4 bytes
   MAC src/dst        IP src/dst   ports        512 slots
```

Three things follow from that picture, and all three matter operationally:

- **Overhead is real.** A universe of 512 slots costs about 638 bytes of sACN plus 42 bytes of
  headers plus framing. At 44 Hz that is roughly 240 kbit/s per universe on the wire, not 200. When
  you plan a hundred universes, that difference is 4 Mbit/s.
- **Each layer only reads its own header.** A switch reads the Ethernet header and nothing else. A
  router reads the IP header. This is why a switch cannot tell sACN from a file copy, and why
  Session 5 has to teach it to.
- **The MTU is a real limit.** Standard Ethernet carries 1500 bytes of payload. Anything larger is
  fragmented by IP, and fragmented multicast is a reliable source of misery. Every protocol in this
  course fits inside one frame deliberately.

---

## What a switch actually does

This is the most useful five minutes in the session, because almost everybody has a wrong model.

<!--anim:switch-learning-->

A switch has one job: **get a frame to the port the destination is on, and nowhere else.** It does it
with a table it builds by watching:

1. A frame arrives on port 3 with source MAC `00:1a:2b:...`. The switch writes down "that MAC is on
   port 3". This is **learning**, and it happens on every frame, for free.
2. A frame arrives for destination MAC `00:4c:5d:...`. The switch looks it up.
   - **Known**: send it only out that port. Nobody else is disturbed. This is **forwarding**.
   - **Unknown**: send it out *every* port except the one it came in on. This is **flooding**, and it
     is what a switch does when it does not know.
3. Entries age out, typically after 300 seconds of silence.

Now the consequences, which are the actual content:

- **Broadcast is not flooding.** A broadcast frame (destination `FF:FF:FF:FF:FF:FF`) goes to every
  port by design and there is no table entry that would stop it. Every device must receive it, and
  every device's processor must look at it and decide it does not care.
- **Multicast without snooping behaves like broadcast.** A dumb switch floods multicast, which is why
  forty universes of sACN on an unmanaged switch reaches every device on the network. Session 5 is
  largely about fixing this.
- **A switch is not a hub.** A hub repeated everything to everyone, half duplex, with collisions.
  Switches killed hubs in the 1990s and you should treat "hub" as a word for a device to remove.
- **Unknown-unicast flooding is a real diagnostic.** If a device goes quiet for five minutes and then
  receives traffic, the first frames were flooded to the whole network. Silent devices are noisier
  than chatty ones, which is unintuitive and true.

### The one figure worth internalising: a broadcast domain

Everything reachable without passing through a router is one **broadcast domain**. Every broadcast
sent by any device in it is processed by every other device in it.

That is why a show network with two hundred devices on one flat network spends real CPU on traffic
nobody wanted, and why the fix is VLANs or routers rather than a faster switch. A faster switch moves
the broadcast faster.

---

## Ethernet, as it exists now

<!--anim:ethernet-family-->

| Name | Rate | Medium | Reach | Where in a venue |
| --- | --- | --- | --- | --- |
| 100BASE-TX | 100 Mbit/s | Cat5e copper | 100 m | Old nodes, fixtures, some sensors. Still everywhere. |
| 1000BASE-T | 1 Gbit/s | Cat5e/6 copper | 100 m | The default for everything. |
| 2.5G and 5GBASE-T | 2.5 / 5 Gbit/s | Cat5e/6 copper | 100 m | Wi-Fi 6E and 7 access points, mostly |
| 10GBASE-T | 10 Gbit/s | Cat6a copper | 100 m | Switch uplinks, media servers, ST 2110 endpoints |
| 10G / 25G SFP+ / SFP28 | 10 / 25 Gbit/s | Fibre or DAC | 300 m to 10 km | Uplinks, between racks, between buildings |
| 100G QSFP28 | 100 Gbit/s | Fibre | Varies | Broadcast facilities, large ST 2110 plants |

Practical notes worth more than the table:

- **Cat6a for anything above 1 Gbit/s** over any real distance. 10GBASE-T on Cat5e works on the
  bench and fails at 60 m, which is the worst possible failure mode.
- **Untwist under 13 mm at the plug.** The twist is the whole mechanism by which a pair rejects
  interference. A cable terminated with 30 mm of untwist will link at gigabit and drop packets under
  load, which presents to everybody as a software fault.
- **Split pairs pass a continuity test and fail under load.** Pins 3 and 6 must be one pair. A cheap
  tester that only checks pin-to-pin calls a split-pair cable good.
- **A DAC** (direct-attach copper) is a fixed-length cable with SFP ends, cheap and reliable for
  under 5 m between switches in a rack.

### Power over Ethernet

<!--anim:poe-tiers-->

PoE carries power and data on the same cable, which in a venue removes a whole category of local
power problems.

| Standard | Common name | At the source | At the device | Typical loads |
| --- | --- | --- | --- | --- |
| 802.3af | PoE | 15.4 W | 12.95 W | Phones, small access points, some sensors |
| 802.3at | PoE+ | 30 W | 25.5 W | Access points, PTZ cameras, small nodes |
| 802.3bt Type 3 | PoE++ / 4PPoE | 60 W | 51 W | Larger cameras, small displays, LED drivers |
| 802.3bt Type 4 | PoE++ | 90 W | 71.3 W | Architectural fixtures, PoE lighting, thin clients |

The two mistakes:

- **The switch budget is not the sum of the port ratings.** A 24-port switch advertising 30 W per
  port may have a 370 W total budget, which is twelve ports, not twenty four. Read the *power
  budget* figure, add up your actual loads, and leave 20 per cent.
- **Cable resistance eats the difference.** The gap between 30 W and 25.5 W is loss in 100 m of
  copper. On a long run with thin conductors it is worse, and a device that boots on a short cable
  and fails on a long one is this, every time.

### Wi-Fi, honestly

<!--anim:wifi-reality-->

Wi-Fi 6E and Wi-Fi 7 are genuinely good. The 6 GHz band has room, the throughput is high, and the
latency under light load is decent. None of that changes the structural problem:

**You do not control the medium.** Any device, belonging to anybody, can transmit on your channel,
and the standard's response to that is to wait and retry. A retry is latency you did not budget for,
and an audience of two thousand people with phones is two thousand transmitters.

So the working rule, unchanged by any generation of the standard:

- **Yes** for a human holding a device: remote focus, a tablet running a console app, a monitoring
  dashboard, a stage manager's cue light app with a wired fallback.
- **No** for any path a cue depends on, any audio, any timecode, any machinery, anything where a
  200 ms stall is a show problem.
- **If you must**, use 5 or 6 GHz, a dedicated SSID on its own VLAN, WPA3, a channel you surveyed,
  and a documented fallback that somebody has practised.

---

## The 32 bits

An IPv4 address is a 32-bit number. It is written as four decimal numbers because 3232235826 is
unreadable, but the dots are punctuation and the number is one number.

<!--anim:ip-bits-->

`192.168.1.50` is `11000000 10101000 00000001 00110010`.

Every piece of subnetting is the same operation: **some of those 32 bits identify the network, and
the rest identify the host on it.** The mask says where the boundary is.

### The mask

A mask is 32 bits too, and it is all ones then all zeros. Ones mark the network part.

```
Address  192.168.1.50   11000000 10101000 00000001 00110010
Mask     255.255.255.0  11111111 11111111 11111111 00000000
AND ---------------------------------------------------------
Network  192.168.1.0    11000000 10101000 00000001 00000000
```

That AND is the whole of it. **A device decides "is this address on my network?" by ANDing both
addresses with its own mask and comparing.** If they match, it sends the frame directly. If not, it
sends it to its gateway. Every routing decision an endpoint makes is that comparison.

<!--anim:mask-drag-->

### CIDR: counting the ones

Writing `255.255.255.0` is tedious, so we write `/24`: twenty four network bits. The table you should
know cold:

| CIDR | Mask | Host bits | Usable addresses | Where it fits |
| --- | --- | --- | --- | --- |
| /30 | 255.255.255.252 | 2 | 2 | A point-to-point link between two routers |
| /29 | 255.255.255.248 | 3 | 6 | A tiny corner: two consoles and a node |
| /28 | 255.255.255.240 | 4 | 14 | A small department |
| /27 | 255.255.255.224 | 5 | 30 | A rack |
| /26 | 255.255.255.192 | 6 | 62 | A department on a mid-size show |
| /24 | 255.255.255.0 | 8 | 254 | The default. One department, one VLAN. |
| /23 | 255.255.254.0 | 9 | 510 | A big lighting rig with pixel nodes |
| /22 | 255.255.252.0 | 10 | 1022 | A large converged show network |
| /16 | 255.255.0.0 | 16 | 65534 | Art-Net's default world, and usually a mistake |

**Usable is two fewer than total**, always: the all-zeros host is the network itself and the all-ones
host is the directed broadcast.

Three shortcuts that make this fast in your head:

1. Hosts = 2 to the power of the host bits, minus 2. `/26` has 6 host bits, so 64 − 2 = 62.
2. The block size in the last non-255 octet is 256 minus that octet. `/26` is `.192`, and
   256 − 192 = 64, so the networks are `.0`, `.64`, `.128`, `.192`.
3. Which network is an address in? Divide by the block size and round down.
   `192.168.1.100` in a `/26`: 100 ÷ 64 = 1.56, so it is in the second block, `192.168.1.64/26`,
   whose range is `.64` to `.127` and whose broadcast is `.127`.

Do that third one until it takes five seconds. It is the exam question and it is the venue question.

### The addresses that are already spoken for

| Range | What it is | Note |
| --- | --- | --- |
| `10.0.0.0/8` | Private | 16.7 million addresses. Common on large installations. |
| `172.16.0.0/12` | Private | `172.16` to `172.31`. Less used, which makes it useful. |
| `192.168.0.0/16` | Private | The one everything defaults to, which is exactly why not to use it on a show network. |
| `169.254.0.0/16` | Link-local | Self-assigned when DHCP fails. See below. |
| `127.0.0.0/8` | Loopback | `127.0.0.1` is this machine. |
| `2.x.x.x` and `10.x.x.x` | Art-Net convention | Art-Net's documented default range, a historical decision |
| `239.255.0.0/16` | sACN multicast | Session 6 does the arithmetic |
| `224.0.0.0/4` | All multicast | Not host addresses at all |

> **A recommendation you can use tonight.** Do not build a show network on `192.168.0.x` or
> `192.168.1.x`. Every domestic router, every laptop hotspot and every contractor's spare access
> point defaults into that range, and the day one of them appears on your network you will have two
> devices at the same address and a very confusing afternoon. Pick something deliberate:
> `10.101.x.x`, `172.20.x.x`, anything that could not have arrived by accident.

---

## How a device gets an address

<!--anim:dhcp-dance-->

Three mechanisms, and a show network usually uses all three at once.

### DHCP

A device broadcasts asking for an address, a server offers one, the device requests it, the server
acknowledges. Discover, Offer, Request, Acknowledge: **DORA**, and it is worth remembering because
Wireshark labels the packets with those words.

The address is a **lease** with a duration. The device renews at half the lease time.

- **Good for**: laptops, tablets, anything that comes and goes, and large rigs where hand-addressing
  three hundred nodes is a day of work and a source of typos.
- **Bad for**: anything another device is configured to reach by address. If the console is patched
  to `10.101.5.20` and that node gets a different address after a power cut, the rig is dark and
  nothing reports an error.
- **The middle answer, and the right one for most rigs**: DHCP with **reservations**. The server hands
  out addresses, but each known MAC always gets the same one. You get central management and stable
  addressing, and a replacement device needs one line changed rather than a visit to a truss.

**One DHCP server per network. Exactly one.** A second one, usually a contractor's router plugged in
"just to charge something", will hand out addresses on a different range with a different gateway, to
whichever devices ask it first. The symptom is that some devices work and some do not, changing
each time anything is power cycled, and it is one of the genuinely nastiest faults in this business.

### Static

You type the address in. Absolute control, no dependency, and no negotiation to fail.

Use it for: anything with a fixed role that other things address by number. Consoles, gateways,
servers, processors, the switch itself.

The discipline it demands is **documentation**. A static plan that lives only in the heads of the
people who built it is a system nobody else can work on, which is principle three failing.

### Link-local, or how a device tells you DHCP failed

If a device is set to DHCP and no server answers, it gives itself an address in `169.254.x.x`.

**Seeing 169.254 is a diagnosis, not a configuration.** It means: this device wanted an address, it
asked, and nothing answered. The causes are, in order of likelihood: no DHCP server, a broken link
between the device and the server, or a VLAN misconfiguration that put the device somewhere the
server is not.

Two devices that both fall back to link-local can often still talk to each other, which produces the
worst version of this fault: half the rig works, on the wrong network, and the console cannot see any
of it.

---

## ARP: the join between layer 3 and layer 2

<!--anim:arp-exchange-->

A device knows the destination *IP address*. To put a frame on the wire it needs the destination
*MAC address*. ARP is how it asks.

1. "Who has `10.101.5.20`? Tell `10.101.5.10`." Broadcast, so everybody hears it.
2. The device that has that address replies directly with its MAC.
3. The asker caches the answer, usually for a few minutes.

Why you care:

- **`arp -a` is one of the four commands you should know by heart.** It shows you which addresses
  your machine has actually spoken to, and their MACs. A missing ARP entry means the device is not
  answering at layer 2, which is a very different fault from an application not responding.
- **Duplicate addresses show up here first.** Two devices with the same IP means the ARP cache flips
  between two MACs, and the symptom is intermittent everything.
- **A wrong mask breaks ARP in a characteristic way.** If your mask says the destination is on your
  network and it is not, you will ARP for it forever and never send the frame to the gateway. The
  symptom is "I can ping some things and not others", and the cause is arithmetic.

---

## TCP, UDP and ports

<!--anim:tcp-udp-->

| | TCP | UDP |
| --- | --- | --- |
| Connection | Yes, a handshake first | No, just send |
| Delivery | Guaranteed, with retransmission | Not guaranteed |
| Order | Guaranteed | Not guaranteed |
| Flow control | Yes, a window | None |
| Overhead | 20 byte header, plus state | 8 byte header |
| Behaviour under loss | Slows down and retries | Carries on, oblivious |
| Where in shows | Console remote control, file transfer, web interfaces, RDMnet | **sACN, Art-Net, Dante audio, OSC by default, ST 2110** |

The choice looks obvious and is not. **Retransmission is worse than loss for real-time data.** A
lighting level from 40 ms ago is not useful; a fresh one is arriving now. An audio sample that
arrives late is a click either way. So the streaming protocols in this course all use UDP on purpose,
and they handle loss by repeating rather than by asking again.

TCP is right where the message is a *command* that must not be lost, and where a small delay is
acceptable: sending a cue list, changing a fixture's address over RDMnet, driving a console's remote
protocol.

> **This is the fourth of the Five Questions, arriving as a design decision.** "How do you know it
> arrived?" is answered by the transport, and every protocol in the rest of this course has picked
> one and lives with the consequences.

### Ports and sockets

<!--anim:ports-sockets-->

An IP address gets you to a machine. A **port** gets you to a program on it. The pair — address plus
port — is a **socket**, and that is the actual endpoint of any conversation.

Ports you will meet in this industry, and should recognise on sight:

| Port | Protocol | What |
| --- | --- | --- |
| 5568 | UDP | **sACN**, E1.31 |
| 6454 | UDP | **Art-Net** |
| 8000 | UDP | OSC, common default, but OSC has no assigned port |
| 53000 / 53001 | UDP/TCP | QLab OSC in and reply |
| 3333 / 3032 | UDP/TCP | ETC Eos OSC and remote |
| 5353 | UDP | mDNS, Bonjour, how Dante and NDI find each other |
| 4440–4455 | UDP | Dante control and monitoring |
| 319 / 320 | UDP | **PTP**, event and general messages |
| 123 | UDP | NTP |
| 161 / 162 | UDP | SNMP and traps |
| 5900 | TCP | VNC |
| 80 / 443 | TCP | HTTP and HTTPS device web interfaces |
| 22 / 23 | TCP | SSH and telnet |

Learning the first four is worth a genuine amount of time, because a Wireshark filter of
`udp.port == 5568` turns a wall of packets into an answer.

---

## Extension: the tools that answer the question

You will do all of these in the lab. Learn what each one *proves*, not just what it prints.

| Tool | Question it answers | What a failure means |
| --- | --- | --- |
| Link light | Is layer 1 alive? | Cable, port, or the device is off |
| `ping` | Can layer 3 reach it? | No route, wrong mask, firewall, or genuinely absent |
| `arp -a` | Is it answering at layer 2? | Present but not responding to IP, or a duplicate address |
| `ipconfig` / `ip addr` | What do I actually think my address is? | 169.254 means DHCP failed |
| `traceroute` / `tracert` | Which routers is it going through? | Shows where it stops |
| Wireshark | What is *really* on the wire? | Everything else is an opinion; this is the evidence |
| `iperf3` | How much can this link actually carry? | Distinguishes a slow network from a slow application |
| Switch port statistics | Is this port dropping or erroring? | CRC errors are always a physical fault |

Two habits worth more than any tool: **capture before you change anything**, so you can prove what
you improved, and **look at the switch's own counters**, because a port with rising CRC errors has a
cable fault and nothing you do above layer 1 will help.

---

## Common misconceptions

- **"A switch broadcasts everything to every port."** A switch learns which MAC is on which port and
  forwards to that port alone. It floods only when the destination is unknown, and it floods
  broadcasts and, unless configured otherwise, multicast. That last exception is what Session 5 is
  about.
- **"A faster switch will fix the broadcast traffic."** A faster switch delivers the broadcasts
  faster. Every device in a broadcast domain must process every broadcast, so the fix is a smaller
  broadcast domain: VLANs or routing, not more gigabits.
- **"The dots in an IP address separate four numbers."** They separate four bytes of one 32-bit
  number. Subnetting only makes sense once you see it as one number, because the mask boundary
  routinely falls in the middle of a byte.
- **"Usable addresses in a /24 is 256."** It is 254. The all-zeros host is the network address and
  the all-ones host is the broadcast address, and neither can be assigned to a device.
- **"169.254 is a valid address for a device."** It is a device telling you that DHCP failed. Two
  devices on link-local can even talk to each other, which is why half a rig can appear to work while
  the console sees none of it.
- **"DHCP is easier so use it everywhere."** DHCP is right for devices that come and go, and wrong
  for any device another device addresses by number. Reservations give you both, and a second DHCP
  server on the same network is one of the worst faults in this business.
- **"UDP is unreliable so TCP is better."** For streaming data, retransmission is worse than loss:
  a lighting level from 40 ms ago is not worth having, because a fresh one is on its way. Every
  real-time protocol in this course uses UDP deliberately.
- **"If it links at gigabit the cable is fine."** A cable with excessive untwist or a split pair will
  link and then drop packets under load over distance, which presents as an intermittent application
  fault. Read the switch port's CRC error counter, which does not have opinions.

---

## Numbers from this session

| Quantity | Value |
| --- | --- |
| Bits in an IPv4 address | 32 |
| Bits in a MAC address | 48 |
| Ethernet copper distance limit | 100 m |
| Maximum untwist at an RJ45 termination | 13 mm |
| Standard Ethernet MTU | 1500 bytes |
| Ethernet header plus CRC | 18 bytes |
| IP header | 20 bytes |
| UDP header | 8 bytes |
| TCP header | 20 bytes |
| Usable addresses in a /24 | 254 |
| Usable addresses in a /26 | 62 |
| Usable addresses in a /30 | 2 |
| Block size for a /26 | 64 |
| Private ranges | `10/8`, `172.16/12`, `192.168/16` |
| Link-local range | `169.254.0.0/16` |
| Loopback address | `127.0.0.1` |
| Broadcast MAC address | `FF:FF:FF:FF:FF:FF` |
| sACN port | UDP 5568 |
| Art-Net port | UDP 6454 |
| PTP ports | UDP 319 and 320 |
| mDNS port | UDP 5353 |
| Typical MAC table ageing time | 300 s |
| 802.3af PoE at the device | 12.95 W |
| 802.3at PoE+ at the device | 25.5 W |
| 802.3bt Type 4 at the device | 71.3 W |
| DHCP exchange | Discover, Offer, Request, Acknowledge |
