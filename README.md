# Pi5 Dashboard

A live web dashboard for a Raspberry Pi 5 in a Pironman5 case, fed by MQTT.

It's the front end for [Pi5_MQTT](https://github.com/Alex93IDE/Pi5_MQTT), the daemon that reads the Pi and publishes its state. The dashboard only listens and renders — and sends case commands back over MQTT. It never touches the Pi directly.

![The dashboard](docs/dashboard.png)

## Features

- **Live metrics** — CPU (per core, load, temperature, fan), RAM, disk and NVMe health, network throughput. No polling: it updates as messages arrive.
- **Alerts** — one card gathers everything that needs attention (failed units, stopped containers, firewall down, hot or full hardware), and the browser tab shows the count.
- **Offline detection** — the publisher's last will tells the dashboard the moment the Pi drops off.
- **Services and Docker** — every systemd unit and container, searchable, with favorites that follow you across devices.
- **UFW** — firewall rules sorted by port.
- **Pironman controls** — OLED, RGB and fan mode from the browser.
- **Works on a phone** — responsive, swipe between tabs, installable as a PWA.

| Firewall | Pironman |
|---|---|
| ![Firewall rules](docs/firewall.png) | ![Pironman controls](docs/pironman.png) |

## Requirements

- Node 20+ to build.
- [Pi5_MQTT](https://github.com/Alex93IDE/Pi5_MQTT) running on the Pi.
- An MQTT broker with a **WebSocket listener** — browsers can't speak raw MQTT. For Mosquitto:

  ```
  listener 9001
  protocol websockets
  ```

## Installation

```bash
git clone https://github.com/Alex93IDE/Pi5_Dashboard.git
cd Pi5_Dashboard
npm install
cp .env.example .env   # set your broker host and credentials
npm run dev
```

Open the URL Vite prints. If the dot in the top-right corner turns green, you're connected.

## Deployment

```bash
npm run build    # static bundle in dist/
npm run deploy   # optional: rsync dist/ to DEPLOY_TARGET from .env
```

Any web server can host `dist/`. Each tab has its own URL, so the server must fall back to `index.html` — in nginx:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

To install it as an app, serve it over **HTTPS**.

## Configuration

`.env` is read at **build time**, so rebuild after changing it. See [`.env.example`](.env.example).

| variable | default | |
|---|---|---|
| `VITE_MQTT_PROTOCOL` | `ws` | `wss` if the page is served over HTTPS |
| `VITE_MQTT_HOST` | `localhost` | broker host |
| `VITE_MQTT_PORT` | `9001` | broker WebSocket port |
| `VITE_MQTT_USER` / `VITE_MQTT_PASS` | — | broker credentials |
| `VITE_TOPIC_FAST` | `pi5/fast` | metrics, every second |
| `VITE_TOPIC_SLOW` | `pi5/slow` | NVMe, bans, firewall |
| `VITE_TOPIC_STATUS` | `pi5/status` | `online` / `offline` |
| `VITE_TOPIC_SERVICES` | `pi5/services` | systemd units |
| `VITE_TOPIC_DOCKER` | `pi5/docker` | Docker containers |
| `VITE_TOPIC_CTRL` | `pi5/control/pironman` | case commands |
| `VITE_TOPIC_CTRL_SERVICES` | `pi5/control/services` | favorite commands |
| `DEPLOY_TARGET` | — | `user@host:/path` for `npm run deploy` |

Topics must match the publisher's.

### Broker ACL

Give the dashboard its own broker user with only what it needs:

```
user <dashboard_user>
topic read  pi5/fast
topic read  pi5/slow
topic read  pi5/status
topic read  pi5/services
topic read  pi5/docker
topic write pi5/control/pironman
topic write pi5/control/services
```

A missing topic fails silently: the subscription is accepted but never delivers. If a tab stays on "Waiting for data…", check this first.

## Security

- **Credentials end up in the bundle.** Anyone who can load the page can read them. Keep it on your LAN or behind a VPN, and rely on the ACL above to limit the damage.
- **The screen is a map of your machine:** IPs, ports, services, containers.
- **Use `wss` over HTTPS.** Browsers block `ws://` from HTTPS pages, and `ws` sends the password in the clear.
- **There's no auth layer, by design.** It assumes it's already somewhere private.

## Built with

Vue 3, TypeScript, Pinia, Vue Router, Vite, [vite-plugin-pwa](https://vite-pwa-org.netlify.app) and [lucide](https://lucide.dev). Screenshots use mock data.

## Project status

A personal project, actively used on my own Pi. Versions follow [SemVer](https://semver.org); the footer shows the version and build number. Changes are in [CHANGELOG.md](CHANGELOG.md).

Bug reports and ideas are welcome in [Issues](https://github.com/Alex93IDE/Pi5_Dashboard/issues). Pull requests too — for anything bigger than a fix, open an issue first.

## License

MIT — see [LICENSE](LICENSE).
