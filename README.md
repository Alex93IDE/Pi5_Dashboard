# Pi5 Dashboard

A single-page dashboard for a Raspberry Pi 5 in a Pironman5 case. It subscribes to MQTT, draws what the Pi is doing, and lets you drive the case hardware from the browser.

It's the front end for [Pi5_MQTT](https://github.com/Alex93IDE/Pi5_MQTT), the daemon that actually reads the machine and publishes it. This repo only listens and renders — it never touches the Pi directly, so everything it shows is whatever the publisher decided to send.

![The dashboard](docs/dashboard.png)

## What you get

Metrics arrive on two topics and land in a Pinia store, so every card updates on its own as messages come in — no polling, no refresh button.

**Live, once a second:** CPU load, frequency and temperature, fan RPM, RAM, disk usage, uptime, local IP, and how many VPN peers are currently up.

**Every 30 seconds:** NVMe health straight from SMART — temperature, spare capacity, wear, power-on hours, unsafe shutdowns, media errors — plus ban counters from Fail2ban and CrowdSec, systemd status for whatever services the publisher watches, and the firewall ruleset.

The header carries the things you want to see without reading a card: uptime, last message time, VPN peers, and the two ban counters, which go amber the moment they're non-zero. The dot on the right is the broker connection, and the switch beside it disconnects and reconnects without reloading the page.

### The firewall table

![Firewall rules](docs/firewall.png)

`ufw status numbered` puts the rule comment inline, in the middle of the source column — `192.168.1.0/24 # SSH`. The table splits it back out, so the source and the label each get a column and the `#` disappears. Rules are sorted by port rather than by rule number, which is how you actually read a firewall: everything on port 53 sits together regardless of the order it was added.

### Case controls

![Pironman controls](docs/pironman.png)

The Pironman card publishes to the control topic and the daemon relays it to the case: OLED on and off, RGB on and off, colour, animation style, brightness, and the fan between always-on and auto.

Nothing is optimistic — a control sends its command and then waits for the next status message before it moves. If a command doesn't land, the switch stays where it was instead of lying to you.

## Requirements

Node 20 or newer, a broker with a **WebSocket listener** (browsers can't speak raw MQTT on 1883), and [Pi5_MQTT](https://github.com/Alex93IDE/Pi5_MQTT) running on the Pi.

For Mosquitto, that listener is two lines in `mosquitto.conf`:

```
listener 9001
protocol websockets
```

## Getting it running

```bash
git clone https://github.com/Alex93IDE/Pi5_Dashboard.git
cd Pi5_Dashboard
npm install
cp .env.example .env
```

Point `.env` at your broker, then:

```bash
npm run dev
```

To build and serve it from somewhere permanent:

```bash
npm run build
```

That leaves a static bundle in `dist/` — any web server will do, including the Pi itself. There's also an rsync shortcut if you deploy over SSH: set `DEPLOY_TARGET` in your `.env` (`user@host:/path` of the directory nginx serves), then run:

```bash
npm run deploy
```

## Configuration

Everything lives in `.env` and is read at build time, not runtime — rebuild after changing it.

| variable | default | |
|---|---|---|
| `VITE_MQTT_PROTOCOL` | `ws` | `ws`, or `wss` if the page is served over HTTPS |
| `VITE_MQTT_HOST` | `localhost` | broker host |
| `VITE_MQTT_PORT` | `9001` | broker WebSocket port |
| `VITE_MQTT_USER` | — | MQTT username |
| `VITE_MQTT_PASS` | — | MQTT password |
| `VITE_TOPIC_FAST` | `pi5/fast` | fast metrics topic |
| `VITE_TOPIC_SLOW` | `pi5/slow` | slow metrics topic |
| `VITE_TOPIC_CTRL` | `pi5/control/pironman` | control topic |
| `VITE_SERVICE_LABELS` | — | display names for the services card |

The three topics have to match the publisher's `TOPIC_FAST`, `TOPIC_SLOW` and `TOPIC_CTRL`.

The services card renders whatever `svc_*` fields turn up in the payload, so adding a service to the publisher's `SERVICES` makes it appear here with no code change. `VITE_SERVICE_LABELS` only decides how the names are printed — comma-separated `alias:Label` pairs:

```
VITE_SERVICE_LABELS=mqtt:MQTT,adguard:AdGuard,f2b:Fail2ban
```

Anything you leave out is shown capitalised, exactly as it arrived.

## Security notes

Worth reading before you host this anywhere.

**The credentials end up in the bundle.** Vite inlines `VITE_*` variables at build time, so anyone who can load the page can read the broker username and password out of the JavaScript. That's true of every browser MQTT client, not something this project does wrong, but it does mean the page belongs on your LAN or behind your VPN and not on the open internet. Give it its own broker user with read access to the two metric topics and write access to the control topic, and nothing else.

**What's on screen is a map of your machine.** Local IP, open ports, firewall sources, which services are running. Useful to you, useful to anyone else too.

**Use `wss` if the page is served over HTTPS.** Browsers block plain `ws://` from an HTTPS origin, and it's unencrypted either way — over `ws`, your broker password crosses the network in the clear.

**There's no auth layer here, by design.** The dashboard assumes it's sitting somewhere already private.

## Layout

```
src/
  config.ts               reads .env — broker, topics, service labels
  composables/mqtt.ts     connection, subscriptions, publishing
  stores/mqtt.ts          the payload shapes and where they live
  layouts/                header with the at-a-glance stats
  views/                  the dashboard page
  components/
    CpuCard.vue           load, frequency, temperature, fan
    RamCard.vue           memory
    DiskNetCard.vue       disk usage and NVMe health
    ServicesCard.vue      systemd status
    UfwCard.vue           firewall rules
    PironmanControl.vue   case controls
```

Vue 3 with `<script setup>`, TypeScript, Pinia, Vue Router, Vite, and [lucide](https://lucide.dev) for icons. Styling is plain CSS with custom properties in `src/style.css` — change the palette there and the whole thing follows.

The screenshots above were taken with mock data, so the addresses and rules in them are made up.

## License

MIT — see [LICENSE](LICENSE). Do what you like with it.
