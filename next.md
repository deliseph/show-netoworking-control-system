# Where to go next

Twenty four hours is an introduction: deliberately wide, deliberately shallow. By the end of it you
should know which direction you want to go deeper in.

Here is where each direction leads, what it costs, and what is free. Prices are indicative and in
2026 terms; check before you spend anything.

---

## First, the free things worth doing this month

| What | Cost | Why |
| --- | --- | --- |
| Read the actual standards you can get | Free | ESTA publishes several E1 documents at no charge. Reading a real standard once changes how you read every manual afterwards. |
| Wireshark, and its own documentation | Free | The single highest-value tool in this subject, and the free documentation is genuinely good. |
| Build a lab | £50 to £200 | A second-hand managed switch, two cheap Art-Net/sACN nodes, a Raspberry Pi. Everything in Sessions 4 to 6 can be done on this. |
| sACNView, Art-Net tools, OLA | Free | Open Lighting Architecture will generate, receive and inspect nearly every lighting protocol in this module. |
| Dante Certification levels 1 to 3 | Free, online | Audinate's own training. Level 1 and 2 are an afternoon each and are the industry's common vocabulary. |
| QLab, free tier | Free | The best way to practise cue design and OSC without a venue. |
| Bitfocus Companion | Free, open source | Install it and connect two things. It teaches integration faster than reading about it. |
| [Computer Science for Theatre](https://github.com/deliseph/Computer-Science) | Free | The endpoint at the other end of every protocol in this module: how to write it, how to read somebody else's, and how to verify what an AI wrote before it drives anything. A separate course by the same author; it does not assume this one. |

**If you do one thing:** build the lab. Everything in this module is more convincing when you have
broken it yourself, and the whole kit costs less than a night out.

---

## The standards themselves

Reading a standard is a skill and it is worth acquiring. They are precise, they are boring, and they
answer questions no forum post will.

| Body | What | Where |
| --- | --- | --- |
| ESTA / PLASA Technical Standards Program | The E1 series: DMX512-A, RDM, ACN, sACN, RDMnet, and the rigging and machinery standards | Several free, the rest reasonably priced |
| AES | AES3, AES67, AES70 | Free to AES members, purchasable otherwise |
| SMPTE | ST 2110, ST 2059, 12M timecode | Purchasable; some free to members |
| IEEE | 802.3 Ethernet, 802.1Q, 802.1AS, 1588 | Some available free through the GET program |
| IETF | RFCs, including RTP-MIDI (6295) | Always free |
| MMA | MIDI 1.0, MIDI 2.0, MSC (RP-002), MMC (RP-013) | Free |

**Start with the free ones.** ESTA's public documents and the MMA's MIDI specifications will keep
you occupied for a month, and the MSC document in particular is short, readable and directly useful.

---

## Certifications, and whether they are worth it

Honest assessments. Certifications matter in this industry in proportion to how much they let
somebody else take a risk on you.

| Certification | Cost | Time | Worth it if |
| --- | --- | --- | --- |
| **Dante Certification 1–3** | Free | A day total | Always. It is free, it is the common language of live audio, and level 3 is genuinely technical. |
| **AVIXA CTS** | Moderate | Weeks of study | You are heading into AV integration, corporate or installation work. Widely recognised by clients. |
| **CTS-D / CTS-I** | Higher | Months | You are designing or installing systems as a career. Real weight in tender documents. |
| **Cisco CCNA** | Moderate | Months | You want the networking to be genuinely solid. Overkill for lighting, transformative if you end up owning the network. |
| **Network+ (CompTIA)** | Moderate | Weeks | A lighter, vendor-neutral alternative to CCNA. Reasonable value. |
| **ETCP Entertainment Electrician / Rigger** | Moderate | Experience plus study | You work in the US market, or want a recognised safety credential. |
| **Manufacturer training** (ETC, MA, Avolites, Barco, disguise, Audinate) | Often free or cheap | Days | You use their kit. These are usually the best value training in the industry. |

**What is not worth paying for:** any certification that is essentially a product demonstration, and
anything promising to make you "network certified" in a weekend.

---

## The five directions this module opens

### 1. Show control and systems integration

Designing the systems rather than operating them. Where it leads: technical director, systems
designer, show control programmer, integrator.

- **Go deeper into**: Sessions 5, 7 and 8. Show controllers — Medialon, Alcorn McBride, Q-SYS,
  Pharos, 7thSense. Industrial control: Modbus, OPC UA, PLCs.
- **Learn**: one show controller properly, and enough PLC to talk to an automation engineer.
- **Read**: Huntington, *Show Networks and Control Systems*, which is this module's spine text and
  worth owning even where it has aged.
- **The market**: themed entertainment, cruise, large-scale attractions, permanent installations.
  Steady, well paid, and it rewards documentation skills more than any other branch.

### 2. Networking, properly

Owning the network rather than using it. Where it leads: network engineer for broadcast, live events
or venues, which is a genuinely scarce and well-paid specialism.

- **Go deeper into**: Sessions 4 and 5. Then routing, PIM, QoS design, ST 2110 network engineering.
- **Learn**: CCNA-level material, then broadcast IP specifically. Practise on real switches.
- **The market**: broadcast facilities, large venues, touring IT, and the growing category of
  "somebody who understands both a lighting rig and a routing table", which almost nobody is.

### 3. Audio networking

- **Go deeper into**: Dante certification 1 to 3, then AES67 and ST 2110-30. Milan if you are in the
  AVB world.
- **Learn**: PTP properly, because it is where the difficult faults live.
- **The market**: live sound, broadcast, installation. Dante skill is immediately employable.

### 4. Video and media systems

- **Go deeper into**: ST 2110, NDI, SDI, HDBaseT, media server platforms — disguise, Green Hippo,
  Resolume, Watchout, Notch.
- **Learn**: colour, frame rates and genlock alongside the networking; the two are inseparable.
- **The market**: touring, corporate, broadcast, virtual production. Fast moving and well paid.

### 5. Lighting control and networks

- **Go deeper into**: Session 6, then console programming on a platform — ETC Eos, MA, Avolites,
  Chamsys — plus pixel mapping and large-scale sACN design.
- **Learn**: RDMnet, because it is arriving and few people know it yet.
- **The market**: everywhere. The specialism worth having is being the person who can design the
  network the rig runs on, not just program the rig.

---

## Reading

**The spine text**

- John Huntington, *Show Networks and Control Systems*. The book this module's syllabus is specified
  against. Comprehensive on the protocols, and now more than a decade old in its networking and
  media-over-IP material, which is exactly the gap the sessions fill.

**Networking**

- Charles Kozierok, *The TCP/IP Guide*. Free online, enormous, and the best explanation of IP for
  somebody who wants the real mechanism.
- Kevin Fall and Richard Stevens, *TCP/IP Illustrated, Volume 1*. The reference. Hard going and
  definitive.
- Brian Ward, *How Linux Works*. Not about shows, and the best practical grounding in what a computer
  is actually doing on a network.

**Industry**

- Adam Bennette, *Recommended Practice for DMX512*. Short, practical, from the person who wrote much
  of the standard.
- Bob McCarthy, *Sound Systems: Design and Optimization*. For the audio direction, and the best book
  on thinking about systems in this industry regardless of discipline.
- ESTA's own technical standards, read directly.

**Thinking**

- Donella Meadows, *Thinking in Systems*. Not technical. It will change how you look at every
  drawing you make afterwards.

---

## Communities worth being in

- **ESTA / PLASA Technical Standards Program.** Working groups are open to participants. This is how
  the standards you use get written, and volunteers are genuinely welcome.
- **Control Freaks / show control forums.** Where the practitioners actually are.
- **Manufacturer forums**, particularly ETC's and MA's, which are unusually good.
- **Local trade associations and meetups.** In Hong Kong and Taiwan, the AV and entertainment
  technology associations are small enough that turning up matters.
- **LDI, PLASA, ISE, InfoComm, Prolight+Sound.** Trade shows are the fastest way to see a year of
  product development in three days. Go with questions, not with a shopping list.

---

## A last piece of advice

The most valuable thing this module can leave you with is not any of the protocols. It is the habit of
asking the Five Questions, and then asking the fifth one twice.

Almost everybody in this industry can look up a packet format. Very few can say, in a production
meeting, "if that link fails, this is what the audience sees, and here is what it costs to make that
not happen". That is a small skill, it is remarkably rare, and it is what people will pay you for.
