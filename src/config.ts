// Everything host-specific lives here, read from .env at build time.
// Vite inlines these into the bundle, so treat them as public — see the
// security notes in the README before pointing this at a broker.

const env = import.meta.env;

export const broker = {
  protocol: env.VITE_MQTT_PROTOCOL || "ws",
  host: env.VITE_MQTT_HOST || "localhost",
  port: env.VITE_MQTT_PORT || "9001",
  username: env.VITE_MQTT_USER || undefined,
  password: env.VITE_MQTT_PASS || undefined,
};

export const brokerUrl = `${broker.protocol}://${broker.host}:${broker.port}`;

export const topics = {
  fast: env.VITE_TOPIC_FAST || "pi5/fast",
  slow: env.VITE_TOPIC_SLOW || "pi5/slow",
  control: env.VITE_TOPIC_CTRL || "pi5/control/pironman",
};

/**
 * Display names for the services the publisher reports on.
 *
 * The publisher sends one `svc_<alias>` field per unit it watches, and the
 * dashboard renders whatever arrives — so this is purely cosmetic. Give it
 * comma-separated `alias:Label` pairs to override the auto-generated title:
 *
 *   VITE_SERVICE_LABELS=mqtt:MQTT,adguard:AdGuard,f2b:Fail2ban
 *
 * Anything not listed falls back to the capitalised alias.
 */
export const serviceLabels: Record<string, string> = Object.fromEntries(
  (env.VITE_SERVICE_LABELS || "")
    .split(",")
    .map((pair: string) => pair.trim())
    .filter(Boolean)
    .map((pair: string) => {
      const [alias, label] = pair.split(":");
      return [alias.trim(), (label ?? alias).trim()];
    })
);
