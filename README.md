# Pi5 Dashboard

A small web dashboard for a Raspberry Pi 5 in a Pironman5 case. It subscribes to MQTT, shows what the Pi is doing, and lets you drive the case hardware from the browser.

It's the front end for [Pi5_MQTT](https://github.com/Alex93IDE/Pi5_MQTT), the daemon that actually reads the machine and publishes it. This repo only listens and renders — it never touches the Pi directly, so everything it shows is whatever the publisher decided to send.

![The dashboard](docs/dashboard.png)

## What you get

Everything arrives over MQTT and updates on its own as messages come in — no polling, no refresh button.

A bar across the top carries the things you want to see without opening anything: local IP, uptime, last message time, VPN peers, and the Fail2ban and CrowdSec ban counters, which go amber the moment they're non-zero. The dot on the right is the broker connection, and the switch beside it disconnects and reconnects without reloading the page.

Below it, a menu splits the rest into five tabs.

### Home

The overview: CPU (load, frequency, temperature, fan), RAM, disk usage with NVMe health straight from SMART (temperature, spare capacity, wear, power-on hours, unsafe shutdowns, media errors), and an **Alerts** card.

Alerts is the one to glance at. It collects everything that needs attention in one place, errors in red at the top, warnings in amber below, and a green check when there's nothing to report. Most entries are links to the tab where you can look closer. The browser tab follows along too — the title becomes `(3) Pi5 Dashboard` and the icon gets a red or amber dot — so you notice from another tab.

| | error | warning |
|---|---|---|
| Connection | broker disconnected | no metrics from the publisher for 15 s |
| systemd | any unit `failed`, or a starred one that isn't `active` | — |
| Docker | `dead`, `restarting`, or a starred one that isn't running | any other container that isn't running |
| Firewall | UFW not `active` | — |
| Hardware | NVMe media errors, NVMe spare ≤ 10 % | CPU ≥ 80 °C, RAM ≥ 90 %, disk ≥ 90 %, NVMe ≥ 70 °C, NVMe wear ≥ 90 % |

An `inactive` systemd unit doesn't raise anything on its own. A typical Pi has a couple of hundred units and most of them are supposed to be inactive — oneshots that already ran, services for hardware you don't have. If you care whether one in particular is up, star it.

### Services and Docker

Every systemd unit and every Docker container the publisher reports, in alphabetical order, with a search box and a few filters (all, active or running, failed or stopped, favorites). The counter in the corner is how many are up out of the total.

Each systemd row also shows its unit file state — `enabled`, `static`, `disabled`, `masked` — as a small grey tag. That's for information only; it never makes anything red. A oneshot that is `active` / `exited` shows green, because that's a unit that ran and finished fine.

The star marks a favorite. Favorites are stored by the publisher, not in your browser, so they follow you from the laptop to the phone. They're what the Alerts card watches most closely.

### UFW

![Firewall rules](docs/firewall.png)

`ufw status numbered` puts the rule comment inline, in the middle of the source column — `192.168.1.0/24 # SSH`. The table splits it back out, so the source and the label each get a column and the `#` disappears. Rules are sorted by port rather than by rule number, which is how you actually read a firewall: everything on port 53 sits together regardless of the order it was added.

### Pironman

![Pironman controls](docs/pironman.png)

Case controls, relayed to the hardware by the daemon: OLED on and off, RGB on and off, colour, animation style, brightness, and the fan between always-on and auto.

### Nothing is optimistic

Every control — the Pironman switches and the favorite stars alike — sends its command and then waits for the publisher to report the new state before it moves. A star pulses while it waits. If a command doesn't land, the control stays where it was instead of lying to you.

## Requirements

- Node 20 or newer, to build it.
- A broker with a **WebSocket listener** — browsers can't speak raw MQTT on 1883. For Mosquitto that's two lines in `mosquitto.conf`:

  ```
  listener 9001
  protocol websockets
  ```

- [Pi5_MQTT](https://github.com/Alex93IDE/Pi5_MQTT) running on the Pi, recent enough to publish `pi5/services` and `pi5/docker`. With an older publisher the Services and Docker tabs just sit on "Waiting for data…"; everything else still works.

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

To build it for good:

```bash
npm run build
```

That leaves a static bundle in `dist/` — any web server will do, including the Pi itself. There's also an rsync shortcut if you deploy over SSH: set `DEPLOY_TARGET` in your `.env` (`user@host:/path` of the directory nginx serves), then run:

```bash
npm run deploy
```

Each tab has its own address (`/services`, `/ufw`…), so the web server has to hand `index.html` back for paths it doesn't know. Otherwise reloading any tab but Home gives you a 404. In nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

The footer shows when the bundle was built, as a single number like `202610041530` — handy for checking that the phone isn't showing you a cached copy of last week's deploy.

## Configuration

Everything lives in `.env` and is read at build time, not runtime — rebuild after changing it.

| variable | default | |
|---|---|---|
| `VITE_MQTT_PROTOCOL` | `ws` | `ws`, or `wss` if the page is served over HTTPS |
| `VITE_MQTT_HOST` | `localhost` | broker host |
| `VITE_MQTT_PORT` | `9001` | broker WebSocket port |
| `VITE_MQTT_USER` | — | MQTT username |
| `VITE_MQTT_PASS` | — | MQTT password |
| `VITE_TOPIC_FAST` | `pi5/fast` | metrics, once a second |
| `VITE_TOPIC_SLOW` | `pi5/slow` | NVMe, bans and firewall, every 30 s |
| `VITE_TOPIC_SERVICES` | `pi5/services` | systemd units, every 30 s |
| `VITE_TOPIC_DOCKER` | `pi5/docker` | Docker containers, every 30 s |
| `VITE_TOPIC_CTRL` | `pi5/control/pironman` | case commands |
| `VITE_TOPIC_CTRL_SERVICES` | `pi5/control/services` | favorite commands |

The topics have to match the publisher's. If you never changed them there, leave them alone here too.

### Broker permissions

Give the dashboard its own broker user that can read the status topics, write the two control topics, and do nothing else. In Mosquitto that's an entry in the file your `acl_file` points to:

```
user <dashboard_user>
topic read  pi5/fast
topic read  pi5/slow
topic read  pi5/services
topic read  pi5/docker
topic write pi5/control/pironman
topic write pi5/control/services
```

Restart Mosquitto after editing it. A topic missing from the list fails silently — the subscription is accepted and simply never delivers anything — so if a tab stays empty, this is the first place to look.

### Upgrading from an older version

Service status used to ride along in `pi5/slow` as `svc_*` fields, renamed through `VITE_SERVICE_LABELS`. Both are gone: services now come complete on their own topic, with systemd's description as the label. Update the publisher, add the new topics to `.env` and the broker ACL, and delete `VITE_SERVICE_LABELS` if you had it.

## Security notes

Worth reading before you host this anywhere.

**The credentials end up in the bundle.** Vite inlines `VITE_*` variables at build time, so anyone who can load the page can read the broker username and password out of the JavaScript. That's true of every browser MQTT client, not something this project does wrong, but it does mean the page belongs on your LAN or behind your VPN and not on the open internet. The ACL above is what limits the damage: with it, someone holding those credentials can read your metrics and flip your favorites or your case LEDs, and nothing more.

**What's on screen is a map of your machine.** Local IP, open ports, firewall sources, every service and container you run. Useful to you, useful to anyone else too.

**Use `wss` if the page is served over HTTPS.** Browsers block plain `ws://` from an HTTPS origin, and it's unencrypted either way — over `ws`, your broker password crosses the network in the clear.

**There's no auth layer here, by design.** The dashboard assumes it's sitting somewhere already private.

## Layout

```
src/
  config.ts               reads .env — broker and topics
  composables/
    mqtt.ts               connection, subscriptions, publishing
    alerts.ts             the rules behind the Alerts card and tab title
  stores/mqtt.ts          the payload shapes and where they live
  router/                 one route per tab
  layouts/                top bar and tab menu
  views/                  Home, Services, UFW, Docker, Pironman
  utils/
    units.ts              systemd/Docker state → colour, rows for the lists
    number.ts             turns smartctl's "3,234" or "100%" into numbers
  components/
    CpuCard.vue           load, frequency, temperature, fan
    RamCard.vue           memory
    DiskNetCard.vue       disk usage and NVMe health
    AlertsCard.vue        everything that needs attention
    UnitList.vue          searchable list with stars, used by Services and Docker
    UfwCard.vue           firewall rules
    PironmanControl.vue   case controls
```

Vue 3 with `<script setup>`, TypeScript, Pinia, Vue Router, Vite, and [lucide](https://lucide.dev) for icons. Styling is plain CSS with custom properties in `src/style.css` — change the palette there and the whole thing follows.

The screenshots were taken with mock data, so the addresses, rules and services in them are made up.

## License

MIT — see [LICENSE](LICENSE). Do what you like with it.
