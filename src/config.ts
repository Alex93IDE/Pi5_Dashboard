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
  services: env.VITE_TOPIC_SERVICES || "pi5/services",
  docker: env.VITE_TOPIC_DOCKER || "pi5/docker",
  controlServices: env.VITE_TOPIC_CTRL_SERVICES || "pi5/control/services",
};

