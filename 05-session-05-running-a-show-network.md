# Session 5 — Running a Real Show Network

> A show network is one set of cables carrying four kinds of traffic with incompatible requirements,
> owned by four departments who do not talk to each other. Everything in this session is a technique
> for stopping them from ruining each other's night.

## Before you come

### What you must already be able to do

Subnet without looking anything up: given an address and a mask, produce the network, the range and
the broadcast, in under a minute. Use `ping`, `arp` and Wireshark. Explain what a switch does with a
frame whose destination it does not know.

Session 4 is a hard prerequisite. If the arithmetic is still slow, do another four evenings on the
[subnetting trainer](/practice#subnetdrill) before this session, because today assumes it and moves
past it in the first ten minutes.

### Three things to do

1. **Get into a managed switch's web interface.** Any managed switch: the department's, a borrowed
   one, a second-hand one from an auction site for the price of a meal. Find the VLAN page, the IGMP
   page and the port statistics page. Do not change anything. Just find them, because in the lab you
   will be doing it under time pressure.
2. **Capture five minutes on a live show network** if you can get permission, or on any busy network
   if you cannot. In Wireshark, use `Statistics → Protocol Hierarchy` and write down the percentage
   that is broadcast and multicast. Most people are surprised.
3. **Find out what your venue's network actually is.** One flat network, or VLANs? Who administers
   it? Is there a diagram? If the answer to the last question is no, that is worth knowing before you
   need it at 22:00.

### What to bring

Laptop with Wireshark. Patch cables. Notebook. The address plan you made in Session 4.

<!--ready:5-->

---

## Run of the session

| Min | Block | What happens |
| --- | --- | --- |
| 10 | Open | Numbers quiz, and the protocol hierarchy you captured |
| 40 | The idea | Unicast, broadcast and multicast, what each costs a switch, and IGMP |
| 15 | Break |  |
| 40 | The idea | VLANs and trunks, QoS, redundancy that works, PTP, and the security posture |
| 35 | Lab | Build a two-VLAN show network on a managed switch, tag a trunk, prove the separation |
| 30 | Lab | Create a multicast storm, then fix it with snooping and a querier, and measure both |
| 10 | Close | The five things to check on any show network you inherit |

---

## Three ways to address a frame

Everything in this session starts here, because the difference between these three is what decides
how a show network behaves under load.

<!--anim:cast-types-->

| | Unicast | Broadcast | Multicast |
| --- | --- | --- | --- |
| Destination | One device | Every device | Every device that asked |
| MAC | The device's | `FF:FF:FF:FF:FF:FF` | `01:00:5E:xx:xx:xx` |
| Switch behaviour | Forwarded to one port | Flooded to all ports | **Depends entirely on configuration** |
| Cost to a device that does not want it | None | Full: the CPU must inspect it | None if snooping works, full if it does not |
| In shows | Console to a specific node, TCP sessions | ARP, DHCP discovery, Art-Net by default | **sACN, Dante, AES67, ST 2110, PTP, NDI discovery** |

The middle column is the villain of Session 4. This session is about the third.

### Multicast, and why this industry lives on it

Multicast solves a specific problem: one sender, many receivers, and the sender should not have to
know or care how many there are or where they are.

A lighting console sending forty universes to twelve nodes has two bad options and one good one:

- **Unicast to each**: 40 universes × 12 nodes = 480 streams. The console's network port melts, and
  it must be told about every node.
- **Broadcast**: one stream, and every device on the network — every amplifier, every media server,
  every laptop — receives all forty universes and discards them in software. This is what Art-Net
  does by default, and it is why Art-Net has a reputation for being hard on networks.
- **Multicast**: one stream per universe, sent to a group address. The network delivers it only to
  devices that joined that group. The console does not know who is listening.

That is why sACN, Dante, AES67, ST 2110 and PTP are all multicast, and it is why understanding IGMP
is not optional for anybody working on a show network in 2026.

### IGMP: how a device joins a group

<!--anim:igmp-snoop-->

Two pieces have to be present, and the second is the one that gets forgotten.

**IGMP snooping** is the switch listening in on the join and leave messages and building a table of
which port wants which group. With snooping on, multicast is forwarded only where it is wanted. With
it off, multicast is flooded exactly like broadcast.

**An IGMP querier** is the device that periodically asks "who still wants what?". Memberships expire.
Without a querier, every switch's table ages out — typically after 260 to 300 seconds — and the
switch reverts to flooding, or worse, to dropping.

That timing is why this fault is so unpleasant: **the rig works perfectly for four minutes and then
degrades.** Everything was proved at 14:00, and at 20:15 during the show, forty universes are
flooding every port. A significant fraction of "the network went strange during the show" stories are
exactly this.

The rules, and they are short:

1. **Snooping on, on every switch** carrying multicast.
2. **Exactly one querier per VLAN.** Usually the core switch, or the router if the VLAN is routed.
   Two queriers elect the lowest IP address, which works but is worth knowing about.
3. **Never a mix.** A network with snooping on some switches and off on others behaves differently
   in different places, which is a genuinely difficult fault to reason about.
4. **IGMPv2 is what most show gear speaks.** IGMPv3 adds source-specific joins and is what ST 2110
   plants use. Set the switch to the version your devices actually use; a version mismatch means
   joins are ignored.

> **The five-minute test.** Build the rig, prove it, then leave it running and untouched for ten
> minutes and prove it again. If it has degraded, you have a querier problem. This test costs ten
> minutes and it has saved more shows than any other single habit in this session.

---

## VLANs

<!--anim:vlan-tag-->

A VLAN turns one physical switch into several logical switches that cannot see each other. It is the
single most useful configuration in show networking, and it is the answer to the broadcast domain
problem from Session 4.

The mechanism is a four-byte **802.1Q tag** inserted into the Ethernet frame, carrying a 12-bit VLAN
ID — so 1 to 4094 — and a three-bit priority field that QoS uses.

Two kinds of port:

- **Access port**: belongs to one VLAN. The device plugged into it knows nothing about VLANs; frames
  arrive untagged and the switch adds and removes the tag. This is what a fixture, a node or a
  console plugs into.
- **Trunk port**: carries several VLANs, with the tag present, between switches. Every switch-to-
  switch link on a real show network is a trunk.

The mistake that eats an afternoon: **a device plugged into a trunk port**. It receives tagged frames
it does not understand and appears completely dead while every light on the switch says the link is
fine.

### A show VLAN plan you can actually use

This is a starting point, not a rule. Adjust the numbers to the house and write them down.

| VLAN | Name | Subnet | Carries | Why separate |
| --- | --- | --- | --- | --- |
| 10 | Lighting | 10.101.10.0/23 | sACN, Art-Net, RDMnet, console remote | Multicast heavy; must not see audio's clock traffic |
| 20 | Audio | 10.101.20.0/24 | Dante or AES67, and its PTP | **Its own PTP domain. This is the non-negotiable one.** |
| 30 | Video | 10.101.30.0/24 | NDI, ST 2110, media server control | Bursty and very large |
| 40 | Control | 10.101.40.0/24 | Show control, OSC, MSC over IP, timecode distribution | Small, critical, must never be congested |
| 50 | Management | 10.101.50.0/24 | Switch management, device web interfaces, monitoring | **The one that must not be on a show VLAN** |
| 60 | Wireless | 10.101.60.0/24 | Crew tablets and remotes | Untrusted by construction |
| 99 | Native / unused | — | Nothing | Default VLAN, deliberately empty |

Three principles behind it:

**Audio gets its own VLAN, always.** Dante and AES67 both run PTP, and two PTP domains fighting over
one broadcast domain is a real and common failure. If you take one thing from this session, take
this one.

**Management is separate.** Management traffic has no deadline and therefore no manners. A firmware
upload, a discovery scan or a monitoring poll will happily fill a link, and it does not care that a
cue is trying to get through. It also does not need to reach the show VLANs, and putting it there is
how a compromised laptop reaches a lighting rig.

**VLAN 1 is not used.** It is the default on every switch, it is what an unconfigured port lands in,
and a device plugged into a forgotten port should land somewhere harmless rather than in the middle
of your lighting network.

### Quality of service

<!--anim:qos-queue-->

QoS is how a switch decides what to send first when two frames want the same port at the same
microsecond. Without it the answer is "whichever arrived first", which is fine until it is not.

Traffic is marked with a **DSCP** value in the IP header, or an 802.1p priority in the VLAN tag, and
each switch maps those marks to output queues.

The values this industry has settled on:

| Traffic | DSCP | Name | Why |
| --- | --- | --- | --- |
| PTP clock | 46 | EF | The clock must be first or everything downstream drifts |
| Audio media | 46 | EF | Sub-millisecond budget, no room to queue |
| Video media | 34 | AF41 | Large and time-sensitive |
| sACN / lighting | 26 | AF31 | Time-sensitive but tolerant of a lost packet |
| Everything else | 0 | Best effort | It will get there |

Two warnings that matter more than the table:

- **QoS only helps when there is contention.** On an uncongested network it changes nothing, which is
  why it is easy to configure wrongly and never find out until the busiest moment.
- **Marks must be trusted end to end.** A switch that does not trust DSCP on ingress rewrites
  everything to zero and your careful marking is gone. This is a per-port setting and it is the
  usual reason QoS "does not work".

> **The honest ranking.** Over-provisioning beats QoS. A show network at 10 per cent utilisation
> never has contention, and 10 Gbit/s uplinks are now cheap. Configure QoS anyway, because the night
> somebody starts a 400 GB file copy is the night it earns its keep.

---

## Redundancy that works

<!--anim:stp-converge-->

The instinct is to run a second cable. The instinct is right and the implementation matters enormously.

**A loop in an Ethernet network is catastrophic.** Broadcast frames have no hop count, so a loop
means a broadcast circulates forever, multiplying at each switch, until the network is entirely
saturated in a second or two. Every device stops. This is a broadcast storm and it is the fastest
way to take a venue down.

**Spanning Tree** exists to prevent it. Switches elect a root, work out the topology, and block ports
that would create a loop. If an active link fails, a blocked port unblocks.

| Version | Convergence after a failure | Use |
| --- | --- | --- |
| STP (802.1D) | 30 to 50 seconds | Obsolete. Never deploy it. |
| RSTP (802.1w) | 1 to 6 seconds | The minimum acceptable |
| MSTP (802.1s) | 1 to 6 seconds, per VLAN group | What a multi-VLAN show network should use |

Even RSTP's few seconds is a lot of dropped audio. So for the disciplines that cannot accept it,
the industry does something different:

**Two completely separate networks.** Dante redundancy, ST 2110-7 seamless protection and SMPTE
2022-7 all work this way: the device has two network ports on two physically separate networks, sends
identical streams on both, and the receiver takes whichever arrives. There is no convergence time
because there is no reconvergence: both paths were already live.

That is the right model for audio and video media. It costs a second switch and a second cable run,
and it is the only redundancy that is genuinely seamless.

**LACP** is a third thing and is often confused with the other two. It bonds two or more links
between the same pair of devices into one logical link, giving both more capacity and failover. It
does not protect against a switch failing, only a cable or a port.

> **The design summary.** MSTP for the control and lighting VLANs, dual separate networks for audio
> and video media, LACP on the uplinks that need capacity. Not one mechanism everywhere.

---

## Routing, and when not to

<!--anim:routing-hop-->

VLANs cannot see each other. Sometimes they need to: the show control machine on VLAN 40 needs to
reach a media server on VLAN 30, and the monitoring system on VLAN 50 needs to reach everything.

A **layer 3 switch** or a router joins them. Each VLAN gets a gateway address, usually `.1`, and the
router forwards between them.

What this buys you: control over what crosses. A router is a natural place for an access list, so
"VLAN 60 wireless may reach the media server's web interface on port 80 and nothing else" is one
line of configuration rather than a hope.

What it costs you, and this is the important part: **routers do not forward multicast by default.**
Multicast between VLANs needs PIM, and PIM on a show network is a specialist configuration that
usually is not worth it. So:

> **Keep each multicast stream inside one VLAN.** Lighting multicast on the lighting VLAN, audio on
> audio, video on video. Route the unicast control traffic between them if you need to. Trying to
> route sACN between VLANs is a common design that produces a lot of unnecessary difficulty.

### IPv6, briefly and honestly

IPv6 is 128 bits instead of 32, it has no broadcast at all, it uses multicast for what IPv4 used
broadcast for, and every device gets a link-local address automatically.

Its position in this industry in 2026: **present but not used.** Every operating system runs it,
every laptop on your show network has an IPv6 link-local address right now, and almost no show
protocol uses it. sACN, Art-Net and Dante are IPv4. ST 2110 has an IPv6 mode that is beginning to
appear in large facilities.

The practical consequence is narrow and worth knowing: IPv6 neighbour discovery multicast appears in
every capture you take, and it is not a fault. If your show network does not use it, disabling IPv6
on show-critical interfaces removes a small amount of noise and one class of confusing capture.

---

## Time on the network

This is the part of the session that has changed most since the standard text, and it is now
central rather than a footnote.

<!--anim:ptp-exchange-->

Modern media over IP does not merely need low latency. It needs every device to agree what time it
is, to within microseconds, so that samples taken at different boxes can be lined up.

| Protocol | Accuracy | Used by |
| --- | --- | --- |
| NTP | 1 to 50 ms | Log timestamps, schedules, anything human-scale |
| PTPv2, IEEE 1588-2019 | Sub-microsecond | Dante, AES67, ST 2110, ST 2059-2 |
| gPTP, 802.1AS | Sub-microsecond, tighter profile | AVB and Milan |
| Genlock / black burst | Sub-line | Legacy video, still everywhere in broadcast |
| Word clock / AES3 | Sample-accurate | Legacy digital audio |

**How PTP works**, in four messages, and this is worth understanding because it explains every PTP
fault you will meet:

1. The grandmaster sends **Sync** with the time it thinks it is.
2. It sends **Follow_Up** with the exact moment Sync actually left, measured in hardware.
3. The slave sends **Delay_Req** and notes when it left.
4. The grandmaster replies **Delay_Resp** with when it arrived.

From those four timestamps the slave can calculate both the offset and the one-way delay, and correct
itself. Do that a few times a second and every device in the building agrees on the time.

<!--anim:clock-drift-->

The failures, all of which you will see:

- **Two grandmasters.** The Best Master Clock Algorithm elects one, and if two devices are configured
  with the same priority the election can flap. Symptom: audio glitches at intervals with nothing
  else changing. Set priorities deliberately: one preferred grandmaster, one backup, everything else
  a slave.
- **PTP crossing a router.** PTP is multicast and its accuracy depends on symmetric path delay. A
  router adds asymmetric delay and usually does not forward it. **Keep PTP inside one VLAN.**
- **Non-PTP-aware switches in the path.** A switch that queues a Sync message for a few hundred
  microseconds adds error. Boundary clocks and transparent clocks fix this by correcting the
  timestamps as they pass. For a small rig an ordinary switch is usually fine; for a large one it is
  not, and that is what the "PTP aware" line on a switch datasheet is selling you.
- **Two profiles.** AES67, SMPTE 2059-2 and the default PTP profile use different message rates and
  domain numbers. Two devices on different profiles will not lock, and each will insist it is
  correct.

> **The rule of thumb.** One clock domain per VLAN, one designated grandmaster, one backup, and never
> across a router. Write down which device is the grandmaster on the system drawing, because when it
> goes wrong nobody will remember.

---

## Security

<!--anim:attack-surface-->

The position this industry is in, stated plainly: **essentially none of the protocols in this course
authenticate anything.**

- Anyone who can put a packet on the lighting VLAN can send sACN at priority 200 and own the rig.
  There is no credential involved, because the protocol has no concept of one.
- Anyone on the control VLAN can send OSC to a playback machine and fire cues.
- Anyone on the audio VLAN can use the manufacturer's control protocol to mute or reroute.
- RDM can rewrite fixture addresses and personalities, with no authentication whatsoever.

None of that is a defect in the protocols; they were designed for a closed world of dedicated cables
and it is not reasonable to retrofit cryptography into a 1986 design. It does mean that **network
access control is the entire security model**, and it is therefore worth doing properly.

### What "properly" means, concretely

1. **Physical.** Racks locked. No live ports in public or backstage circulation areas. Unused ports
   administratively shut down, not merely unpatched.
2. **Segmentation.** The show network is not the office network, and there is no path between them
   that is not deliberate, documented and filtered. Not "the office network but a different subnet".
3. **No route to the internet from a show VLAN.** If a device needs updates, it gets them on a
   different network, or through a documented and monitored path opened for the purpose.
4. **Management separated**, as above, and reachable only from a management workstation.
5. **Wireless is untrusted.** Its own VLAN, WPA3, and an access list saying exactly what it may reach.
   The crew SSID is not the guest SSID, and neither is on a show VLAN.
6. **Remote access through a VPN**, with named accounts and MFA. Not a port forward, not a
   manufacturer's cloud tunnel that nobody has reviewed, and never a device with its web interface
   on a public address.
7. **Default credentials changed** on every device that has any, and the new ones somewhere the next
   technician can find them. A password only you know is not security, it is a hostage situation.
8. **Know what is on it.** An inventory and a diagram. You cannot defend a network you cannot list.

### The threat that is actually likely

Not a targeted attacker. In practice it is:

- **A contractor's laptop** with something unpleasant on it, plugged into a show VLAN to configure
  one device.
- **A second DHCP server** arriving on somebody's travel router.
- **Ransomware from the office network** reaching a media server because the two networks were joined
  "temporarily" during install and never separated.
- **A visiting engineer's rig** brought in with the same address range as yours.

All four are prevented by segmentation and an inventory, which is why those are the two that matter.

---

## Documentation, which is a technical deliverable

<!--anim:network-plan-->

A show network that only its builder understands has failed principle three, and it will be handed to
somebody else eventually, probably at short notice.

The minimum set, and none of these takes long:

- **A one-page diagram.** Switches, uplinks, VLANs, what is where. On one page, printable, on the
  wall of the machine room.
- **An address plan.** Every static address, every reservation, every subnet, every gateway. A
  spreadsheet is fine. The important property is that it is where somebody else will look.
- **A port map.** Which switch port goes where and which VLAN it is in. Labels on the patch panel
  matching labels on the diagram.
- **The grandmaster, the DHCP server and the querier**, each named explicitly. These are the three
  singular roles on a show network and the three things nobody can find at 22:00.
- **The failure behaviours.** What each critical device does when it loses the network. This is the
  fifth of the Five Questions, written down for the specific rig.

---

## Extension: five things to check on a network you have inherited

You arrive on a production and there is a network. In twenty minutes:

1. **Protocol hierarchy in Wireshark.** How much is broadcast and multicast? If it is more than a few
   per cent, find out why.
2. **Is there a querier?** Filter `igmp` and look for queries. No queries means the rig will degrade
   after five minutes and nobody has noticed yet because nobody left it running.
3. **How many DHCP servers?** Filter `dhcp` and count who answers an offer. More than one is an
   emergency.
4. **Is PTP stable?** Filter `ptp` and look for the announce messages. Count distinct grandmaster
   identities. More than one alternating is your audio glitch.
5. **Switch port errors.** Log in and read the counters. Rising CRC errors on any port is a physical
   fault that no amount of configuration will fix, and it is usually one cable.

Write the five answers in your notebook. That is a network assessment, it takes twenty minutes, and
it is genuinely valuable work that most productions never have done.

---

## Common misconceptions

- **"IGMP snooping is enabled, so multicast is handled."** Snooping without a querier is a timer
  running out. Memberships expire after four or five minutes and the switch reverts to flooding, so
  the rig works during the check and degrades during the show. One querier per VLAN is the other
  half of the configuration.
- **"VLANs are for security."** VLANs are for containing broadcast and separating traffic with
  different requirements. They provide separation, which contributes to security, but a VLAN is not
  a firewall and traffic that is routed between VLANs is not filtered unless you filter it.
- **"Spanning tree gives us redundancy."** RSTP gives you reconvergence in a few seconds, which is
  fine for lighting and unacceptable for audio. Seamless redundancy for media is two physically
  separate networks carrying identical streams, which is what Dante redundancy and ST 2110-7 do.
- **"QoS will fix our latency."** QoS only acts when two frames contend for the same port at the same
  instant. On an uncongested network it does nothing, and if any switch in the path does not trust
  the DSCP marks, it does nothing anywhere. Over-provisioning is the more reliable fix; do both.
- **"PTP just works if the switches support it."** PTP needs one designated grandmaster, one profile,
  one domain, and a path with symmetric delay. Two grandmasters flapping, a router in the path, or an
  AES67 device meeting an ST 2059 device are all common and all present as unexplained audio glitches.
- **"Our show network is secure because it is not connected to the internet."** Almost every protocol
  here has no authentication at all, so "not connected" is doing all the work. One contractor's
  laptop, one travel router, one temporary link to the office that never got removed, and there is
  nothing else defending it.
- **"We can route sACN between VLANs."** You can, with PIM, and on a show network it is rarely worth
  the complexity. Keep each multicast stream inside the VLAN it belongs to and route only the unicast
  control traffic that genuinely has to cross.

---

## Numbers from this session

| Quantity | Value |
| --- | --- |
| Multicast MAC prefix for IPv4 | `01:00:5E` |
| Broadcast MAC address | `FF:FF:FF:FF:FF:FF` |
| IGMP membership timeout, typical | 260 to 300 s |
| Queriers needed per VLAN | exactly one |
| 802.1Q tag length | 4 bytes |
| VLAN ID range | 1 to 4094 |
| Bits in a VLAN ID | 12 |
| Priority bits in an 802.1Q tag | 3 |
| RSTP convergence | 1 to 6 s |
| Legacy STP convergence | 30 to 50 s |
| DSCP for PTP and audio media | 46, expedited forwarding |
| DSCP for video media | 34, AF41 |
| DSCP for sACN | 26, AF31 |
| NTP accuracy | 1 to 50 ms |
| PTPv2 accuracy | sub-microsecond |
| PTP standard | IEEE 1588-2019 |
| PTP messages in one exchange | Sync, Follow_Up, Delay_Req, Delay_Resp |
| PTP profile for broadcast video | SMPTE ST 2059-2 |
| PTP profile for AVB and Milan | IEEE 802.1AS, gPTP |
| Seamless media redundancy | ST 2110-7, SMPTE 2022-7, Dante redundancy |
| Recommended show network utilisation | under 20 per cent |
| Singular roles to write on the drawing | DHCP server, IGMP querier, PTP grandmaster |
