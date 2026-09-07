# The design principles

Seven rules and a method. Print this, put it in the front of the notebook, and read it again before
every system you design.

Every one of these exists because something went wrong. Not hypothetically: a show stopped, somebody
was hurt, a system nobody could understand had to be rebuilt in the week before opening, or a
production paid twice for the same thing.

---

## The seven, in one line each

1. **Ensure safety.** Nothing else on this list outranks it, and safety functions do not go on the
   show network.
2. **The show must go on.** Design the failure, not just the success. Name the single point of
   failure out loud.
3. **Simpler is always better.** The system a competent stranger can fix at 02:00 beats the elegant
   one only you understand.
4. **Strive for elegance.** Make the structure of the system match the structure of the problem, so
   the obvious guess about how it works is right.
5. **Complexity is inevitable, convolution is not.** Complexity comes from the show. Convolution
   comes from the process. Only one of them is yours to remove.
6. **Make it scalable, and leave room.** Every show grows. Address space, universes, ports and rack
   units are all trivially cheap now and painful to retrofit.
7. **Ensure security.** Nearly every protocol in this industry has no authentication at all, so
   network access control is the entire security model. Make it a real one.

---

## 1. Ensure safety

**The rule.** If the control system can move something, heat something, fire something or drop
something, safety is a design constraint before it is a feature.

**In practice:**

- Safety functions — emergency stop, guards, interlocks, limits — are **hardwired or on a rated
  safety bus**. Never on the show network. Not because the network is slow, but because a safety
  function has to work when everything else has failed, which is exactly when a shared best-effort
  network is least trustworthy.
- Machinery that can hurt somebody is designed to a **performance level** under EN ISO 13849 or a
  **safety integrity level** under IEC 62061, by somebody qualified to do it. In Europe, for stage
  machinery, that means **EN 17206**. ESTA's **E1.6** covers powered hoists and **E1.43** covers
  performer flying.
- **Every device's behaviour on loss of control is defined, documented and tested.** Not assumed. A
  fixture may hold its last look, fade out, or go dark, and which one is a menu setting somebody set
  in a hurry.
- The system cannot be put into an unsafe state by a plausible operator error, and "plausible" means
  what a tired person does at 23:00, not what a careful person does in a demonstration.
- **A single fault must be detected.** Dual channels with cross-monitoring exist so that a shorted
  wire, a welded contact or a broken conductor is noticed before a second fault arrives.

**The boundary to draw on every system drawing:** where the show control system stops and the
machinery contractor's safety system begins. The show network may send a cue and may read status
back. Neither path may be capable of causing motion that the safety system would not permit.

**The one sentence.** *Nothing that stops a machine to protect a person goes on the show network.*

---

## 2. The show must go on

**The rule.** A show is not a system that can be taken down for maintenance. Design the failure.

**The three questions to ask about any system:**

1. **What is the single point of failure?** There is always one. If you cannot name it, you have not
   looked hard enough, and the honest answer is often "the show control laptop" or "the one person
   who knows how it works".
2. **What is the manual fallback, and has anybody ever practised it?** An untested fallback is a
   hope. Ten minutes in a technical rehearsal is what turns it into a plan.
3. **Can a component be replaced during a performance?** Hot-swappable is a real property and it is
   worth paying for on the things that fail.

**The specific measures that earn their keep:**

- A backup console holding the same show file, sending sACN at a lower priority. No changeover to
  operate: if the main console stops, the backup's data takes over within the source timeout.
- Two physically separate networks for audio and video media, with identical streams on both. This
  is what Dante redundancy and ST 2110-7 do, and it is the only genuinely seamless redundancy.
- A contact closure alongside the network cue for the one moment that absolutely must happen.
- A spare of anything that is a laptop.

**Write the failure table.** Every critical path, what happens if it fails, what the fallback is, and
who acts. It is a page, it takes an hour, and it is the document a production manager will actually
read.

---

## 3. Simpler is always better

**The rule.** The system somebody else can understand at 02:00 is better than the elegant one only
you can.

**The test:** can a competent stranger, using the documentation you actually wrote rather than the
documentation you intended to write, find and fix a fault in this system? If not, it is too
complicated, regardless of how well it works today.

**What this looks like as a decision:**

- Fewer boxes. Every protocol conversion is a place for an agreement to be wrong, and a device that
  can fail.
- Fewer protocols. A rig that speaks sACN everywhere is easier to reason about than one that speaks
  sACN, Art-Net and DMX in three places for historical reasons.
- One addressing scheme, applied consistently, even where a cleverer scheme would have been tighter.
- Delete the old path when you add the new one. A cue route that goes through four boxes because
  nobody removed the previous version is the commonest form of accidental complexity.

You will be tempted to build the clever thing. The question to ask is not whether it works. It is
whether you would like to be handed it, on the phone, on a day when you are not involved.

---

## 4. Strive for elegance

**The rule.** Elegance is not aesthetics. It is when the structure of the system matches the
structure of the problem, so the obvious guess about how it works is right.

**What that means concretely:**

- Universes grouped the way the rig is grouped, so "the upstage bar" is a range you can state.
- VLAN numbers that match the department numbers people already use.
- IP addresses whose third octet is the VLAN and whose fourth octet has a pattern: `.1` is the
  gateway, `.10` to `.19` are consoles, `.20` to `.99` are nodes, `.100` upward is DHCP.
- Cue numbers that match the script, so the stage manager and the console agree.
- Labels on the racks that match the labels on the drawing that match the names in the software.

An elegant system is one where somebody can guess correctly. That is worth more than any single
clever feature, because guessing correctly is what people do under pressure.

---

## 5. Complexity is inevitable, convolution is not

**The rule.** A show system is genuinely complicated because shows are. That is complexity and you
cannot design it away. **Convolution** is complication that came from the process rather than the
problem.

| Complexity, which is earned | Convolution, which is inherited |
| --- | --- |
| Six departments with different requirements | Two addressing schemes because two people built halves |
| Media that must be frame-accurate | Three protocol conversions because of a purchasing decision |
| A rig that changes between shows | A cue path through four boxes because the old one was never removed |
| Machinery that must be safe | A VLAN that exists because of a problem that was fixed in 2019 |

**The audit.** Take a system you have inherited, list everything in the signal path, and for each one
ask: *is this here because the show needs it, or because of how we got here?* The second list is
usually longer than anybody expects and every item on it is a candidate for deletion.

---

## 6. Make it scalable, and leave room

**The rule.** Every show grows. A design at 100 per cent of capacity on opening night is a design
that the first change note compromises.

**The cheap version, which costs nothing at design time:**

- **Plan addressing at half density.** Address fixtures on round boundaries with gaps, so a fixture
  can be replaced with a larger one without repatching the rig.
- **Leave universes.** Number them in groups with gaps between departments.
- **Leave switch ports.** A 24-port switch that is full on day one is a 48-port switch you should
  have bought, and the difference is small.
- **Leave subnet space.** A `/23` costs the same as a `/24` and holds twice as much.
- **Leave rack units and power.** Both get consumed faster than anybody plans for.

**What is genuinely painful to retrofit**, and is therefore what to be generous with now: address
space, universe numbering, cable routes, switch ports, and any documentation scheme. Everything else
can be added later.

---

## 7. Ensure security

**The rule.** Nearly every protocol in this industry has no authentication whatsoever, so **network
access control is the entire security model.** Make it a real one.

**The uncomfortable facts.** Anyone who can put a packet on your show network can:

- Take over a lighting rig with sACN at a high priority. No credential exists in the protocol.
- Fire cues on a playback machine with OSC.
- Mute or reroute a PA over its control protocol.
- Rewrite fixture addresses and personalities over RDM.

None of that is a defect in the protocols. They were designed for a closed world of dedicated cables,
and it is not reasonable to retrofit cryptography into a 1986 design. It does mean the perimeter is
everything.

**The checklist:**

- [ ] **Physical.** Racks locked. No live ports in public or backstage circulation. Unused ports
      administratively shut down, not merely unpatched.
- [ ] **Segmentation.** The show network is not the office network. Any path between them is
      deliberate, documented and filtered.
- [ ] **No route to the internet** from a show VLAN. Updates come through a different network or a
      documented, monitored path opened for the purpose.
- [ ] **Management separated.** Switch management and device web interfaces on their own VLAN,
      reachable from a management workstation.
- [ ] **Wireless untrusted.** Its own VLAN, WPA3, an access list, and not the SSID you gave the
      caterers.
- [ ] **Remote access through a VPN**, with named accounts and MFA. Not a port forward. Not an
      unreviewed manufacturer cloud tunnel.
- [ ] **Default credentials changed** on everything that has them, with the new ones somewhere the
      next technician can find them.
- [ ] **An inventory and a diagram.** You cannot defend a network you cannot list.

**The threat that is actually likely** is not a targeted attacker. It is a contractor's laptop with
something unpleasant on it, a second DHCP server on somebody's travel router, ransomware reaching a
media server through a link to the office that was made during install and never removed, or a
visiting rig using the same address range as yours. All four are prevented by segmentation and an
inventory.

---

## Finding faults: the method

More show time is lost to disordered searching than to missing knowledge, every year, by a wide
margin. This is the method. It works when you are tired, which is when you need it.

### 1. Establish the boundary

What is working and what is not? Every test should move that boundary. **A test that could not have
changed your mind, whatever its result, was a wasted test**, however interesting the reading.

### 2. Ask what changed

A system that worked yesterday and does not work today has had something done to it. The person who
did it is often in the room and does not know it was relevant. This is the single most efficient
question in fault-finding and it is not technical.

### 3. Work from the known good

Start at an end you are sure about and move toward the fault. Starting in the middle of the thing you
suspect is how an hour disappears.

### 4. Halve the system

If the signal is good here and bad there, test in the middle. Twelve devices take four tests, not
twelve. This is the same binary search RDM uses to discover fixtures, and it is the difference
between a systematic search and a hopeful one.

### 5. Change one thing at a time

And put it back if it did not help. Two simultaneous changes give a result you cannot attribute to
either.

### 6. Climb the ladder

Layer 1 first, then 2, then 3, then 4. Link light, MAC, IP, port. Stop at the first thing that fails.
The application is where the problem *appears*, not where it *is*.

### 7. Prove the fix by reintroducing the fault

If you cannot make it fail again, you did not find it: you disturbed it. This is the step everybody
skips and it is the difference between a fix and a coincidence.

### 8. Write it down

What the symptom was, what it turned out to be, and how long it took. Your own fault log is the most
valuable revision material you will ever have, and it is specific to how *you* actually search.

---

## The five-minute network triage

Arriving on a show network you did not build. In twenty minutes, in this order:

1. **Wireshark, Protocol Hierarchy.** How much is broadcast and multicast? More than a few per cent
   wants explaining.
2. **Filter `igmp`.** Are there queries? No queries means the rig degrades after four or five
   minutes and nobody has noticed because nobody left it running.
3. **Filter `dhcp`.** How many servers answer an offer? More than one is an emergency.
4. **Filter `ptp`.** How many distinct grandmaster identities, and is it flapping? That is your audio
   glitch.
5. **Switch port counters.** Rising CRC errors on a port is a physical fault, and no configuration
   change will help it.

Five answers in your notebook is a network assessment. It takes twenty minutes and most productions
have never had one done.
