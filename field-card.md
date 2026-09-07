# The field card

The commands you type and the settings you change while standing in a venue with somebody waiting.
Print it, fold it, keep it in the jacket you wear to work.

**Learn the first eight by heart.** Look the rest up.

---

## The eight

| # | Command | What it proves |
| --- | --- | --- |
| 1 | `ipconfig /all` (Win) · `ifconfig` or `ip addr` (mac/Linux) | What address, mask, gateway and MAC this machine actually has |
| 2 | `ping <address>` | Whether layer 3 can reach it at all |
| 3 | `arp -a` | Whether it is answering at layer 2, and whether two devices share an address |
| 4 | `ping <gateway>` | Whether the problem is local or beyond the gateway |
| 5 | `tracert <address>` (Win) · `traceroute <address>` | Which hop it stops at |
| 6 | `nslookup <name>` · `dig <name>` | Whether a name resolves, and to what |
| 7 | `netstat -an` · `ss -tunlp` | What this machine is listening on and connected to |
| 8 | `ping -t` (Win) · `ping` (mac/Linux, runs until stopped) | Whether the fault is intermittent, while you wiggle the cable |

---

## Reading your own configuration

### Windows

```
ipconfig /all                  address, mask, gateway, DNS, MAC, DHCP server
ipconfig /release              give up the DHCP lease
ipconfig /renew                ask again
ipconfig /flushdns             clear the name cache
arp -a                         the ARP table
arp -d *                       clear it (admin)
route print                    the routing table
getmac /v                      MACs with adapter names
```

### macOS and Linux

```
ifconfig                       the classic; still on macOS
ip addr                        the modern Linux one
ip route                       the routing table
netstat -rn                    the routing table, portable
arp -a                         the ARP table
sudo arp -d -a                 clear it
ipconfig getpacket en0         macOS: the actual DHCP response received
networksetup -listallhardwareports    macOS: which interface is which
```

**The first thing to read** is the address. If it starts `169.254`, DHCP failed and everything else
you were about to test is downstream of that.

---

## Proving reachability

```
ping 10.101.10.20              can I reach it?
ping -t 10.101.10.20           Windows: keep going, for wiggling cables
ping -c 100 10.101.10.20       mac/Linux: a hundred, then statistics
ping -s 1472 10.101.10.20      mac/Linux: a full-MTU packet, finds MTU problems
ping -f -l 1472 10.101.10.20   Windows: same, don't fragment
```

**What a ping failure does not tell you.** Many devices do not answer ping at all, by design or by
firewall. A device that does not answer ping and works perfectly is common. Use `arp -a` to find out
whether it is present at layer 2 before concluding it is absent.

```
arp -a | findstr 10.101.10     Windows: only this subnet
arp -a | grep 10.101.10        mac/Linux
```

**Two MACs alternating for one IP** in the ARP table is a duplicate address, and it is the cause of
"it works sometimes".

---

## Multicast

```
netsh interface ipv4 show joins        Windows: which groups this machine joined
netstat -gn                            mac/Linux: same
ip maddr                               Linux: multicast addresses per interface
```

In Wireshark, the filters that matter:

```
ip.dst == 239.255.0.1        one sACN universe
udp.port == 5568             all sACN
udp.port == 6454             all Art-Net
igmp                         joins, leaves and queries
ptp                          all PTP
udp.port == 5353             mDNS, so Dante and NDI discovery
eth.dst == ff:ff:ff:ff:ff:ff broadcast only
```

**Filter `igmp` and look for queries.** If there are none, there is no querier and the rig will
degrade in four or five minutes.

---

## sACN universe to multicast address

```
239.255.<universe ÷ 256, rounded down>.<universe mod 256>
```

| Universe | Group |
| --- | --- |
| 1 | `239.255.0.1` |
| 16 | `239.255.0.16` |
| 255 | `239.255.0.255` |
| 256 | `239.255.1.0` |
| 300 | `239.255.1.44` |
| 512 | `239.255.2.0` |
| 1000 | `239.255.3.232` |

---

## Subnetting, in the venue

**Block size** = 256 − the mask octet. **The network** is the address octet rounded down to a
multiple of the block size.

| CIDR | Mask | Block | Usable |
| --- | --- | --- | --- |
| /30 | 255.255.255.252 | 4 | 2 |
| /29 | 255.255.255.248 | 8 | 6 |
| /28 | 255.255.255.240 | 16 | 14 |
| /27 | 255.255.255.224 | 32 | 30 |
| /26 | 255.255.255.192 | 64 | 62 |
| /25 | 255.255.255.128 | 128 | 126 |
| /24 | 255.255.255.0 | 256 | 254 |
| /23 | 255.255.254.0 | — | 510 |
| /22 | 255.255.252.0 | — | 1022 |

---

## Setting an address on four things

### Windows

Settings → Network → adapter → IP settings → Edit → Manual. Or:

```
netsh interface ip set address "Ethernet" static 10.101.10.50 255.255.255.0 10.101.10.1
netsh interface ip set address "Ethernet" dhcp
```

### macOS

System Settings → Network → adapter → Details → TCP/IP → Configure IPv4 → Manually.

Make a **Location** for each show and switch between them from the Apple menu. This is the single
most useful macOS network feature nobody uses.

### A lighting console

Almost always under Setup or System → Network. Look for: the interface, DHCP or static, the address,
and separately, **which interface outputs sACN or Art-Net**, which is a distinct setting from the
address and is the one people miss.

Also find: the **output protocol**, the **universe mapping**, and the **priority**.

### A node or gateway

Web interface at its address, or the manufacturer's discovery tool, or over RDMnet LLRP if it
supports it. Nearly all of them have a **factory reset** that also resets the address, and a physical
button to do it, and the manual will tell you the default address it returns to.

If you cannot find a node's address: put your laptop on `2.0.0.10/8` and look for Art-Net devices,
then on `10.0.0.10/8`, then run the manufacturer's tool. Those two ranges cover most defaults.

---

## Switch commands

Vendors differ. These are the concepts to hunt for in any web interface or CLI.

| What you want | Where it lives | What to look for |
| --- | --- | --- |
| Which VLAN is this port in | VLAN → port membership | Access vs trunk, PVID |
| Is IGMP snooping on | Multicast → IGMP snooping | Per VLAN, plus **querier** |
| Who is the querier | Multicast → IGMP snooping → querier | Exactly one per VLAN |
| Is this port erroring | Statistics / port counters | **CRC errors**, alignment errors |
| Is this port full duplex at the right speed | Port status | A 100 Mbit/s half-duplex link is a fault |
| Spanning tree state | STP / RSTP / MSTP | Which port is blocking, and who is root |
| PoE draw and budget | PoE → status | Per-port watts and the total budget |
| Mirror a port for capture | Mirroring / SPAN | Source port, destination port |

**Set up a mirror port before you need one.** Capturing on the machine you are diagnosing changes
what you see; capturing from a mirror does not.

---

## Wireshark, the twelve filters worth knowing

```
ip.addr == 10.101.10.20              everything to or from one device
udp.port == 5568                     sACN
udp.port == 6454                     Art-Net
ip.dst == 239.255.0.1                one universe
igmp                                 joins, leaves, queries
dhcp                                 the DORA exchange; count the servers
arp                                  who is asking for whom
ptp                                  clock traffic
mdns                                 Dante and NDI discovery
eth.dst == ff:ff:ff:ff:ff:ff         broadcast only
tcp.flags.reset == 1                 connections being refused
frame.len > 1400                     the big ones
```

Then: `Statistics → Protocol Hierarchy` for what is on the network, and
`Statistics → Conversations` for who is talking to whom and how much.

---

## Timecode

| Rate | Frames | Notes |
| --- | --- | --- |
| 24 | Film | |
| 25 | Europe, most of Asia | **No drop frame exists at 25** |
| 29.97 DF | Broadcast NTSC | Skips numbers 00 and 01 each minute, except every tenth |
| 29.97 ND | Audio, NTSC territories | Runs 3.6 s per hour behind the wall clock |
| 30 | US audio | |

**Frames to seconds:** frames ÷ rate. **Seconds to frames:** seconds × rate.

At 25 fps a frame is **40 ms**. At 29.97 a frame is **33.37 ms**. At 24 it is **41.67 ms**.

---

## Ports worth recognising

| Port | Protocol |
| --- | --- |
| 5568 UDP | sACN |
| 6454 UDP | Art-Net |
| 5353 UDP | mDNS: Dante, NDI discovery |
| 319 / 320 UDP | PTP |
| 123 UDP | NTP |
| 161 / 162 UDP | SNMP and traps |
| 53000 UDP | QLab OSC |
| 3032 UDP | ETC Eos OSC |
| 8000 UDP | OSC, common default |
| 4440–4455 UDP | Dante control |
| 5900 TCP | VNC |
| 80 / 443 TCP | Device web interfaces |
| 22 / 23 TCP | SSH and telnet |

---

## When you have five minutes and no idea

1. **Link light.** Is layer 1 alive at both ends?
2. **`ipconfig`.** Is my own address what I think it is? `169.254` means DHCP failed.
3. **`ping` the gateway.** Local problem or beyond?
4. **`arp -a`.** Is the device present at layer 2 at all?
5. **Switch port counters.** CRC errors mean a cable, and nothing above layer 1 will help.
6. **Wireshark on a mirror port.** Everything else is an opinion; this is the evidence.

Then: **what changed?**
