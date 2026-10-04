# Changelog

This project follows [Semantic Versioning](https://semver.org): a **major** bump means you have to change something to upgrade (topics, `.env`, broker ACL or the required Pi5_MQTT version), a **minor** adds features, a **patch** fixes bugs.

The footer shows the version and the build number (`v2.3.0 · 202610041656`). The build number changes on every build, so it tells you whether a device is running the latest deploy.

## 2.3.0

- Installable PWA with a "New version available" banner.

## 2.2.0

- Network card and a one-minute RAM graph.
- Offline state: the dashboard greys out when the Pi's last will reports `offline`.
- Swipe between tabs on touch screens.

## 2.1.0

- Mobile layout, styled 404 page, alert count in the browser tab.

## 2.0.0

- Tab navigation, Services and Docker pages, Alerts card.
- **Breaking:** service status moved from `svc_*` fields in `pi5/slow` to its own `pi5/services` topic, labelled with systemd's description. `VITE_SERVICE_LABELS` is gone.

### Upgrading from 1.x

Update [Pi5_MQTT](https://github.com/Alex93IDE/Pi5_MQTT) first, then:

1. If you use non-default topics, add `VITE_TOPIC_STATUS`, `VITE_TOPIC_SERVICES`, `VITE_TOPIC_DOCKER` and `VITE_TOPIC_CTRL_SERVICES` to `.env`. Delete `VITE_SERVICE_LABELS`.
2. Add the new topics to the broker ACL (see the README). The publisher's user also needs `topic write pi5/status`.
3. Rebuild and deploy.

## 1.1.0

- Build number in the footer.
- `npm run deploy` (rsync to `DEPLOY_TARGET`).

## 1.0.0

- First version.
