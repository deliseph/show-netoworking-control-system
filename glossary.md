# Glossary 詞彙表

Learn the English term as the operational one. Every menu, every error message and every conversation
on an international crew is in English. The Chinese is there to build the concept, not to replace it.

Where a term has a common Cantonese or Mandarin usage on a working floor that differs from the formal
translation, the working one is given.

---

## A. Numbers and fundamentals

| English | 中文 | What it means |
| --- | --- | --- |
| Bit | 位元 | One binary digit, 0 or 1. The smallest unit of information. |
| Byte | 位元組 | Eight bits. Holds 0 to 255 unsigned. |
| Nibble | 半位元組 | Four bits. Exactly one hexadecimal digit. |
| Binary | 二進位 | Base two. Each place is worth twice the one to its right. |
| Decimal | 十進位 | Base ten, the everyday one. |
| Hexadecimal | 十六進位 | Base sixteen, 0 to 9 then A to F. One digit is four bits. |
| BCD, binary-coded decimal | 二進碼十進數 | Each decimal digit stored in four bits. Used in timecode. |
| Two's complement | 二補數 | How negative numbers are stored. `0xFF` is 255 or −1 depending on the agreement. |
| Endianness | 位元組序 | Which byte of a multi-byte value goes first. Network order is big-endian. |
| Big-endian | 大端序 | Most significant byte first. Network byte order. |
| Little-endian | 小端序 | Least significant byte first. What most processors use internally. |
| Bitwise AND | 位元且運算 | Keeps a bit only where both are 1. The whole of subnetting. |
| Bitwise OR | 位元或運算 | Sets a bit where either is 1. |
| Bitwise XOR | 位元互斥或 | Sets a bit where exactly one is 1. Used in simple checksums. |
| Bit shift | 位移 | Moving bits left or right, which multiplies or divides by two. |
| Mask | 遮罩 | A pattern of bits used to select part of a value. |
| Least significant bit, LSB | 最低有效位元 | The rightmost bit, worth 1. |
| Most significant bit, MSB | 最高有效位元 | The leftmost bit, worth 128 in a byte. |
| ASCII | 美國資訊交換標準碼 | 7-bit character encoding, 0 to 127. |
| UTF-8 | UTF-8 編碼 | Variable-length character encoding. The first 128 values match ASCII. |
| Hertz, Hz | 赫茲 | Cycles per second. |
| Millisecond, ms | 毫秒 | One thousandth of a second. |
| Microsecond, µs | 微秒 | One millionth of a second. |
| Nanosecond, ns | 奈秒 | One thousand millionth of a second. |

---

## B. Signals, inputs and outputs

| English | 中文 | What it means |
| --- | --- | --- |
| Contact closure | 乾接點訊號 | Two contacts touching. The simplest control message there is. |
| GPI, general purpose input | 通用輸入 | A contact-closure input on a piece of show equipment. |
| GPO, general purpose output | 通用輸出 | A contact-closure output. |
| Dry contact | 乾接點 | A switch with no voltage of its own. The receiver supplies the voltage. |
| Wet contact | 濕接點 | An output that supplies its own voltage. |
| Sourcing output | 源型輸出 | Pushes the line up to the supply when active. PNP, active high. |
| Sinking output | 汲型輸出 | Pulls the line down to ground when active. NPN, open collector, active low. |
| Open collector | 開集極 | A transistor output that can only pull down. Needs a pull-up. |
| Pull-up resistor | 上拉電阻 | Gives a line a defined high state when nothing is driving it. |
| Pull-down resistor | 下拉電阻 | Gives a line a defined low state when nothing is driving it. |
| Floating input | 浮接輸入 | An input with no defined state. Picks up whatever is nearby. A fault. |
| Debounce | 消抖 | Ignoring the multiple make-and-break of a mechanical contact. |
| Relay | 繼電器 | A coil pulling contacts together. Isolated, slow, wears out. |
| Solid state relay, SSR | 固態繼電器 | Semiconductor switching. Silent and fast, and drops about 1 V as heat. |
| Form A contact | 常開接點 | Normally open. Closes on activation. |
| Form B contact | 常閉接點 | Normally closed. Opens on activation. |
| Form C contact | 轉換接點 | Changeover. Lets the receiver tell activated from disconnected. |
| Electrical isolation | 電氣隔離 | No conductive path between two circuits. |
| Optocoupler | 光耦合器 | Passes a signal by light across an isolation barrier. |
| Ground loop | 接地迴路 | Two ground paths at different potentials. A source of hum and of damage. |
| Differential signalling | 差動訊號 | Sending a signal as the difference between two wires, so interference cancels. |
| Single-ended signalling | 單端訊號 | Sending a signal measured against ground. |
| Characteristic impedance | 特性阻抗 | A cable's property. 110 Ω for DMX, 100 Ω for Cat, 75 Ω for video coax. |
| Termination | 終端電阻 | A matching resistor at the end of a line, so the signal does not reflect. |
| Reflection | 反射 | A signal bouncing back from an unmatched cable end. |
| Propagation velocity | 傳播速度 | About two thirds of light speed in copper, roughly 5 ns per metre. |
| Attenuation | 衰減 | Signal loss with distance, worse at higher frequencies. |

---

## C. Data communication

| English | 中文 | What it means |
| --- | --- | --- |
| Protocol | 通訊協定 | An agreement about what a signal means. |
| Layering | 分層 | Structuring communication so each layer uses only the one below it. |
| Encapsulation | 封裝 | Wrapping data from one layer in the header of the layer below. |
| Header | 標頭 | The information a layer adds in front of the data it is carrying. |
| Payload | 酬載 | The actual data, as opposed to the headers around it. |
| Frame | 訊框 | A unit of data at layer 2, with a MAC header and a CRC. |
| Packet | 封包 | A unit of data at layer 3, with an IP header. |
| Datagram | 資料包 | A self-contained packet with no connection state. UDP sends datagrams. |
| Serial | 序列 | Sending bits one after another on one path. |
| Parallel | 並列 | Sending bits at the same time on several paths. Obsolete for distance. |
| Baud rate | 鮑率 | Symbols per second. For simple binary signalling, the same as bit rate. |
| Bit rate | 位元速率 | Bits per second. |
| Start bit | 起始位元 | The bit that marks the beginning of an asynchronous serial frame. |
| Stop bit | 停止位元 | The bit or bits that end a serial frame. |
| Data rate | 資料速率 | How many bits go past per second. |
| Bandwidth | 頻寬 | Strictly a range of frequencies; colloquially, capacity. |
| Latency | 延遲 | How long one message takes to arrive. |
| Jitter | 抖動 | How much the latency varies. |
| Determinism | 確定性 | Delivery within a guaranteed time, every time. |
| Best effort | 盡力而為 | Delivery as soon as convenient, with no guarantee. Ethernet's model. |
| Multiplexing | 多工 | Sharing one path between several conversations. |
| Time division multiplexing, TDM | 分時多工 | Each conversation gets the path for a slice of time. DMX works this way. |
| Wavelength division multiplexing, WDM | 分波多工 | Several colours of light on one fibre. |
| Statistical multiplexing | 統計多工 | Conversations take turns based on who has something to send. Packet switching. |
| Simplex | 單工 | One direction only. DMX is simplex. |
| Half duplex | 半雙工 | Both directions, one at a time, with a turnaround. RDM is half duplex. |
| Full duplex | 全雙工 | Both directions at once. |
| Parity | 同位檢查 | One bit that makes the count of ones odd or even. Catches single-bit errors. |
| Checksum | 檢查碼 | A sum of the data, sent alongside it, to detect corruption. |
| CRC | 循環冗餘檢查 | A polynomial check that catches essentially all burst errors. Ethernet uses CRC-32. |
| Flow control | 流量控制 | How a receiver tells a sender to slow down. |
| RS-232 | RS-232 | Single-ended serial, two devices, about 15 m. Service ports and projectors. |
| RS-422 | RS-422 | Differential serial, one driver, up to 1200 m. Sony 9-pin machine control. |
| RS-485 | RS-485 | Differential multi-drop serial, 32 unit loads, 1200 m. The layer under DMX512. |
| Unit load | 單位負載 | A measure of how much an RS-485 receiver loads the bus. 32 per segment. |
| USB | 通用序列匯流排 | Host-centric peripheral bus. Short, not isolated, unstable enumeration. |
| USB-C | USB-C 接頭 | A connector, not a speed. Carries USB, DisplayPort, Thunderbolt and power. |
| Fibre optic | 光纖 | Data as light. No electrical connection, no interference, long distances. |
| Multimode fibre | 多模光纖 | 50 µm core. Hundreds of metres. Inside a venue. |
| Single-mode fibre | 單模光纖 | 9 µm core. Kilometres. Between buildings. |
| SFP | 小型可插拔模組 | A pluggable optical or copper transceiver in a switch cage. |
| DAC, direct attach copper | 直接連接銅纜 | A short fixed cable with SFP ends. Cheap between racks. |

---

## D. Networking

| English | 中文 | What it means |
| --- | --- | --- |
| Ethernet | 乙太網路 | The dominant wired networking standard, IEEE 802.3. |
| OSI model | OSI 七層模型 | Seven layers, used in practice as a diagnostic ladder. |
| MAC address | 實體位址 | A 48-bit hardware address, unique per network interface. |
| Switch | 交換器 | Forwards frames to the port the destination is on. |
| Learning | 學習 | A switch recording which MAC is on which port. |
| Flooding | 泛洪 | Sending a frame out every port because the destination is unknown. |
| Broadcast domain | 廣播網域 | Everything reachable without passing through a router. |
| Router | 路由器 | Forwards packets between networks, at layer 3. |
| Gateway | 閘道 | The router a device sends anything off its own network to. |
| IP address | IP 位址 | A 32-bit layer 3 address, in IPv4. |
| Subnet mask | 子網路遮罩 | Which bits of an address are the network and which are the host. |
| CIDR notation | CIDR 表示法 | Writing a mask as a count of network bits, like /24. |
| Network address | 網路位址 | The all-zeros host in a subnet. Not assignable. |
| Broadcast address | 廣播位址 | The all-ones host in a subnet. Not assignable. |
| Octet | 八位元組 | One of the four bytes in an IPv4 address. |
| DHCP | 動態主機設定協定 | A server hands out addresses on request. Discover, Offer, Request, Acknowledge. |
| DHCP reservation | DHCP 保留位址 | The server always gives a known MAC the same address. |
| Static address | 靜態位址 | An address typed into the device. |
| Link-local address | 鏈路本地位址 | 169.254.x.x, self-assigned when DHCP fails. A diagnosis, not a configuration. |
| ARP | 位址解析協定 | Finding the MAC address that goes with an IP address. |
| TCP | 傳輸控制協定 | Connection-oriented, guaranteed delivery, ordered, with flow control. |
| UDP | 使用者資料包協定 | Connectionless, no guarantee, no ordering, minimal overhead. |
| Port | 通訊埠 | A number identifying a program on a machine. |
| Socket | 通訊端 | An address and a port together. The endpoint of a conversation. |
| MTU | 最大傳輸單元 | The largest payload a frame can carry. 1500 bytes on standard Ethernet. |
| Unicast | 單播 | Addressed to one device. |
| Broadcast | 廣播 | Addressed to every device. Every device must process it. |
| Multicast | 多播 | Addressed to a group. Only devices that joined should receive it. |
| IGMP | 網際網路群組管理協定 | How a device joins and leaves a multicast group. |
| IGMP snooping | IGMP 窺探 | A switch listening to joins so it forwards multicast only where wanted. |
| IGMP querier | IGMP 查詢器 | The device that periodically asks who still wants what. Exactly one per VLAN. |
| VLAN | 虛擬區域網路 | One physical switch divided into separate logical networks. |
| 802.1Q tag | 802.1Q 標籤 | The four bytes carrying a VLAN ID and a priority in a frame. |
| Access port | 存取埠 | A switch port belonging to one VLAN, carrying untagged frames. |
| Trunk port | 幹線埠 | A switch port carrying several VLANs, with tags. |
| Native VLAN | 原生 VLAN | The VLAN untagged frames on a trunk belong to. |
| QoS | 服務品質 | Deciding what a switch sends first when two frames contend. |
| DSCP | 差異化服務碼點 | The priority marking in an IP header. 46 for clock and audio. |
| Spanning tree, STP | 生成樹協定 | Blocking ports to prevent loops. Obsolete; use RSTP or MSTP. |
| RSTP | 快速生成樹 | Rapid spanning tree. Converges in seconds rather than tens of seconds. |
| MSTP | 多重生成樹 | Spanning tree per group of VLANs. What a show network should use. |
| Broadcast storm | 廣播風暴 | A loop causing broadcasts to circulate and multiply. Takes a network down in seconds. |
| LACP | 鏈路聚合控制協定 | Bonding several links between two devices into one. |
| PoE | 乙太網路供電 | Power and data on the same cable. |
| Wi-Fi | 無線網路 | IEEE 802.11 wireless networking. |
| Wireshark | Wireshark 封包分析器 | The packet capture tool. The evidence, as opposed to opinions. |
| Ping | Ping 測試 | Testing whether layer 3 can reach an address. |
| Traceroute | 路由追蹤 | Showing which routers a packet passes through. |
| Mirror port, SPAN | 鏡射埠 | A switch port that copies another port's traffic, for capture. |
| CRC error | CRC 錯誤 | A frame that failed its check. Always a physical fault. |
| IPv6 | IPv6 | 128-bit addressing, no broadcast. Present everywhere, used by almost no show protocol. |

---

## E. Lighting control

| English | 中文 | What it means |
| --- | --- | --- |
| DMX512-A | DMX512-A | ANSI E1.11. 512 slots at 250 kbit/s over RS-485, repeated about 44 times a second. |
| Universe | 宇宙 / 燈光線路 | One set of 512 DMX slots. |
| Slot | 通道格 | One byte position in a DMX packet. |
| Channel | 通道 | A DMX slot as a console addresses it, 1 to 512. |
| DMX address | DMX 位址 | The first slot a fixture responds to. |
| Footprint | 通道佔用數 | How many consecutive slots a fixture uses in its current mode. |
| Personality, mode | 模式 / 個性檔 | A fixture's channel layout. A mismatch shifts everything. |
| Break | 中斷訊號 | The line held low for at least 92 µs, marking a new DMX packet. |
| Mark after break, MAB | 中斷後標記 | The high period after a break, at least 12 µs. |
| Start code | 起始碼 | The byte saying how to interpret the packet. `0x00` is normal data. |
| Null start code | 空起始碼 | `0x00`. Normal dimmer data. |
| Daisy chain | 菊鏈 | Device to device in a line, which is the only legal DMX topology. |
| Splitter, opto-splitter | 分配器 | An active device regenerating DMX onto several isolated outputs. |
| Terminator | 終端器 | 120 Ω across the DMX data pair at the far end of a run. |
| RDM | 遠端裝置管理 | ANSI E1.20. A return path over the DMX cable for configuration and status. |
| UID | 裝置唯一識別碼 | An RDM device's 48-bit unique ID: 16 bits manufacturer, 32 bits device. |
| PID, parameter ID | 參數識別碼 | Which property an RDM message is reading or setting. |
| Discovery | 裝置探索 | Finding devices on a bus or network. RDM does it by binary search. |
| RDMnet | RDMnet | ANSI E1.33. RDM over IP, with a broker and TCP. |
| LLRP | 低階復原協定 | RDMnet's multicast side channel, which reaches a device with wrong IP settings. |
| ACN | 控制網路架構 | ANSI E1.17. The full architecture. Almost nothing implements all of it. |
| sACN | 串流 ACN | ANSI E1.31. DMX data over UDP multicast. How lighting crosses a network. |
| sACN priority | sACN 優先權 | 0 to 200, default 100. The higher source wins outright. |
| Source timeout | 來源逾時 | 2.5 s of silence before an sACN receiver considers a source gone. |
| Universe synchronisation | 宇宙同步 | Holding new data until a sync packet arrives, so universes update together. |
| Art-Net | Art-Net | A widely deployed free protocol from one company. Broadcasts by default. |
| Node, gateway | 節點 / 閘道器 | A box converting network lighting data to DMX outputs. |
| HTP | 最高優先 | Highest takes precedence, per channel. Traditional for dimmers. |
| LTP | 最新優先 | Latest takes precedence. Right for moving lights. |
| Merging | 合併 | Combining two sources into one output. |
| Pixel mapping | 像素映射 | Treating many small LEDs as a canvas and driving them from an image. |
| Console | 控台 | The lighting control desk. |

---

## F. Cue and machine control

| English | 中文 | What it means |
| --- | --- | --- |
| Cue | 提示 / Cue | A change, at a moment, that somebody is responsible for. |
| Cue list | 提示表 | An ordered set of cues. |
| GO | 執行 | The instruction to run the next cue. |
| Trigger | 觸發 | Whatever causes a cue to run. Not the same thing as the cue. |
| Follow, auto-follow | 自動接續 | A cue triggered by the previous one finishing. |
| Open loop | 開迴路 | Sending an instruction and assuming it worked. Most lighting control. |
| Closed loop | 閉迴路 | Finding out what actually happened. All machinery control. |
| Feedback | 回授 | Information coming back from a device about its actual state. |
| Telemetry | 遙測 | Reported state with no control coupling. Useful, and not feedback. |
| Command | 指令 | An instruction to do something. An event. Happens once. |
| Data, state | 資料 / 狀態 | A value. Usually repeated, so a lost copy repairs itself. |
| MIDI | 樂器數位介面 | 31.25 kbit/s serial protocol from 1983, still carrying show cues. |
| Status byte | 狀態位元組 | A MIDI byte with the top bit set, `0x80` to `0xFF`. Starts a message. |
| Data byte | 資料位元組 | A MIDI byte with the top bit clear, `0x00` to `0x7F`. |
| Note On | 音符開啟 | MIDI `0x9n`. Note number and velocity. |
| Control Change, CC | 控制變更 | MIDI `0xBn`. A controller number and a value. |
| Program Change | 音色變更 | MIDI `0xCn`. The most common way to recall a show cue over MIDI. |
| System Exclusive, SysEx | 系統專屬訊息 | MIDI `0xF0` to `0xF7`. Manufacturer-specific, any length. MSC lives here. |
| Running status | 連續狀態 | Omitting a repeated MIDI status byte to save bandwidth. |
| Active sensing | 主動偵測 | MIDI `0xFE`, sent about every 300 ms as a keep-alive. |
| MSC, MIDI Show Control | MIDI 演出控制 | MMA RP-002. GO, STOP and RESUME with a cue number, inside SysEx. |
| Command format | 指令格式 | The MSC field saying which discipline a message is for. |
| Device ID | 裝置識別碼 | The MSC field saying which device a message is for. `0x7F` is all-call. |
| MMC, MIDI Machine Control | MIDI 機器控制 | MMA RP-013. Transport control: play, stop, locate. |
| RTP-MIDI | 網路 MIDI | RFC 6295. MIDI over a network, built into macOS and Windows. |
| MIDI 2.0, UMP | MIDI 2.0 | 32-bit resolution and bidirectional negotiation. Not yet in show control. |
| OSC | 開放聲音控制 | Human-readable addresses and typed arguments over UDP or TCP. |
| Address pattern | 位址模式 | An OSC message's path, like `/cue/12.5/go`. |
| Type tag string | 型別標籤 | The OSC field saying what the arguments are, beginning with a comma. |
| Bundle | 束包 | Several OSC messages with one time tag, executed together. |
| Time tag | 時間標籤 | A 64-bit NTP timestamp in an OSC bundle. `1` means immediately. |
| Show controller | 演出控制器 | A device or program whose job is triggering other systems. |
| Companion | Companion | Open source protocol translation software, usually with a Stream Deck. |

---

## G. Time and synchronisation

| English | 中文 | What it means |
| --- | --- | --- |
| Timecode | 時間碼 | Hours, minutes, seconds and frames, naming a moment. |
| SMPTE timecode | SMPTE 時間碼 | SMPTE 12M. The standard the industry runs on. |
| LTC, linear timecode | 線性時間碼 | Timecode as an audio signal, biphase mark encoded. |
| VITC | 垂直間隔時間碼 | Timecode in the invisible lines of a video signal. Readable when paused. |
| MTC, MIDI Time Code | MIDI 時間碼 | Timecode over MIDI, one nibble per quarter frame. Two frames behind. |
| Frame rate | 影格率 | Frames per second. 25 in Europe and most of Asia, 29.97 in NTSC territories. |
| Drop frame | 丟格 | Skipping frame numbers so 29.97 fps counting matches the wall clock. |
| Non-drop frame | 非丟格 | Counting every frame number. Runs 3.6 s per hour behind at 29.97. |
| Biphase mark encoding | 雙相標記編碼 | A transition every bit, plus one mid-bit for a one. Self-clocking. |
| Freewheel | 自走 | Continuing to count when incoming timecode is lost. |
| Chase | 追蹤同步 | A device following incoming timecode. |
| Genlock | 同步鎖定 | Locking video devices to a common reference signal. |
| Black burst, tri-level | 黑訊 / 三階同步 | The video reference signals used for genlock. |
| Word clock | 字元時鐘 | A sample-rate clock shared between digital audio devices. |
| NTP | 網路時間協定 | Network time to within milliseconds. For logs and schedules. |
| PTP | 精密時間協定 | IEEE 1588. Sub-microsecond network time. What media over IP runs on. |
| Grandmaster | 主時鐘 | The device every other clock follows. Exactly one per domain. |
| Best Master Clock Algorithm | 最佳主時鐘演算法 | How PTP devices elect a grandmaster. |
| PTP domain | PTP 網域 | A number separating independent PTP clock hierarchies. |
| PTP profile | PTP 設定檔 | A set of PTP parameters. AES67, ST 2059-2 and gPTP are different profiles. |
| Boundary clock | 邊界時鐘 | A switch that terminates and regenerates PTP, removing its own queueing error. |
| Transparent clock | 透明時鐘 | A switch that corrects PTP timestamps for its own delay. |
| gPTP | 通用精密時間協定 | IEEE 802.1AS. The PTP profile AVB and Milan use. |
| Ableton Link | Ableton Link | Shared musical tempo across a network. Beat, not time. |

---

## H. Media over IP

| English | 中文 | What it means |
| --- | --- | --- |
| Dante | Dante | Proprietary layer 3 audio over IP. Dominant in live audio. |
| AES67 | AES67 | The open audio-over-IP interoperability standard. |
| AVB | 音視訊橋接 | IEEE 802.1BA. Layer 2 with genuine bandwidth reservation. |
| Milan | Milan | A certified profile of AVB for professional audio. |
| ST 2110 | SMPTE ST 2110 | Separate IP streams for video, audio and data. Broadcast standard. |
| ST 2059-2 | SMPTE ST 2059-2 | The PTP profile for broadcast video. |
| ST 2110-7 | SMPTE ST 2110-7 | Seamless protection: identical streams on two separate networks. |
| NDI | NDI | Compressed video over ordinary networks. Convenient, one to three frames of latency. |
| SRT | SRT | Reliable video transport over unreliable links. Contribution and remote. |
| SDI | 序列數位介面 | Uncompressed video on one coax. Still the backbone of much of broadcast. |
| HDBaseT | HDBaseT | Point-to-point HDMI extension over Cat cable. **Not a network protocol.** |
| MADI | MADI | AES10. 64 channels of digital audio on one coax or fibre. |
| Redundancy, seamless | 無縫備援 | Two separate networks carrying identical streams, with no changeover time. |

---

## I. Machinery, safety and standards

| English | 中文 | What it means |
| --- | --- | --- |
| Emergency stop, E-stop | 緊急停止 | A safety function. Hardwired or on a rated safety bus. Never on a show network. |
| Interlock | 連鎖裝置 | A device preventing operation while a guard is open. |
| Dual channel | 雙通道 | Two independent circuits, cross-monitored, so a single fault is detected. |
| Performance level, PL | 性能等級 | The safety rating under EN ISO 13849. |
| Safety integrity level, SIL | 安全完整性等級 | The safety rating under IEC 62061. |
| Safety bus | 安全匯流排 | A certified network for safety signals: PROFIsafe, FSoE, CIP Safety. |
| EN 17206 | EN 17206 | The European standard for machinery for stages and production areas. |
| ANSI E1.6 | ANSI E1.6 | The ESTA standard series for powered hoist systems. |
| ANSI E1.43 | ANSI E1.43 | The ESTA standard for performer flying systems. |
| PLC | 可程式邏輯控制器 | An industrial controller. What runs most show machinery. |
| Modbus | Modbus | A very simple industrial register protocol, in RTU and TCP forms. |
| CANopen | CANopen | A deterministic bus used for motion control. |
| EtherCAT | EtherCAT | A very fast deterministic Ethernet-based fieldbus for motion. |
| OPC UA | OPC UA | A vendor-neutral industrial data model over TCP. |
| MQTT | MQTT | Lightweight publish and subscribe over TCP. Common in installations. |
| BACnet | BACnet | Building automation: HVAC, house lights, blinds. |
| DALI-2, D4i | DALI-2 | Addressable architectural lighting control. |
| ESTA / PLASA | ESTA / PLASA | The body that publishes the E1 entertainment standards. |
| AES | 音訊工程學會 | Audio Engineering Society. Publishes AES3, AES67, AES70. |
| SMPTE | SMPTE | Society of Motion Picture and Television Engineers. Timecode and ST 2110. |
| IEEE | IEEE | Publishes Ethernet, VLANs, Wi-Fi and PTP. |
| De facto standard | 事實標準 | Widely used, owned by one company, and it owes you nothing. |

---

## J. Practice, roles and method

| English | 中文 | What it means |
| --- | --- | --- |
| Show control | 演出控制 | Connecting separate entertainment systems so they act together. |
| Show network | 演出網路 | The network carrying a production's control and media traffic. |
| Single point of failure | 單一故障點 | The one thing whose failure stops everything. There is always one. |
| Failure mode | 失效模式 | What a device does when it loses its control input. |
| Fallback | 備援方案 | What you do instead when the primary path fails. |
| Over-provisioning | 超額配置 | Running a network far below capacity so congestion never happens. |
| Segmentation | 網路分割 | Separating a network into parts that cannot reach each other. |
| Address plan | 位址規劃 | The document listing every subnet, static address and reservation. |
| Port map | 埠位對照表 | The document listing which switch port goes where and in which VLAN. |
| System drawing | 系統圖 | One page showing boxes, links and the protocol on every line. |
| Boundary | 界線 | In fault-finding, the line between what works and what does not. |
| Binary search | 二分搜尋 | Halving the search space each test. Four tests for twelve devices. |
| Fault log | 故障紀錄 | Your own record of symptom, cause and time taken. The best revision material. |
| Convolution | 迂迴複雜 | Complication that came from the process rather than from the problem. |
| Complexity | 複雜性 | Complication that the show genuinely requires. |
| Elegance | 優雅 | When the structure of the system matches the structure of the problem. |
| Commissioning | 竣工測試 | Proving a system works, against a written test, before handover. |
| Handover | 交接 | Giving a system to the people who will run it, with the documentation they need. |
