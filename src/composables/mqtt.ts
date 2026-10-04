import mqtt, { type MqttClient } from "mqtt";
import { ref } from "vue";
import { useMqttStore, type FavoriteSource } from "../stores/mqtt";
import { broker, brokerUrl, topics } from "../config";

const client = ref<MqttClient | null>(null);

// The daemon republishes every 30 s, so if a favorite toggle hasn't been
// confirmed by then the command was rejected and the star should settle back.
const FAVORITE_TIMEOUT_MS = 35_000;

// The status topic carries "online" / "offline". Accept it bare, as a JSON
// string, or as {"status": "..."} so a small change on the daemon side doesn't
// silently break it.
function parseStatus(raw: string): boolean | null {
  let value: unknown = raw.trim();
  try {
    value = JSON.parse(raw);
  } catch {
    // bare word — keep it as is
  }
  if (value && typeof value === "object") {
    value = (value as Record<string, unknown>).status ?? (value as Record<string, unknown>).state;
  }
  if (value === "online") return true;
  if (value === "offline") return false;
  return null;
}

export function useMqtt() {
  const store = useMqttStore();

  function connect() {
    store.setStatus("connecting");
    client.value = mqtt.connect(brokerUrl, {
      username: broker.username,
      password: broker.password,
      reconnectPeriod: 10000,
    });

    client.value.on("connect", () => {
      store.setStatus("connected");
      client.value?.subscribe([topics.status, topics.fast, topics.slow, topics.services, topics.docker]);
    });

    client.value.on("disconnect", () => store.setStatus("disconnected"));
    client.value.on("error", (err) => console.error("MQTT error:", err));

    client.value.on("message", (topic, message) => {
      if (topic === topics.status) {
        store.setPiOnline(parseStatus(message.toString()));
        return;
      }
      try {
        const data = JSON.parse(message.toString());
        if (topic === topics.fast) store.setFastData(data);
        if (topic === topics.slow) store.setSlowData(data);
        if (topic === topics.services && Array.isArray(data)) store.setServices(data);
        if (topic === topics.docker && Array.isArray(data)) store.setDocker(data);
      } catch (e) {
        console.error("Could not parse MQTT message:", e);
      }
    });
  }

  function disconnect() {
    client.value?.end();
    store.setStatus("disconnected");
  }

  function publish(topic: string, payload: unknown) {
    client.value?.publish(topic, JSON.stringify(payload));
  }

  // The star only moves once the daemon republishes the list with the new
  // value; until then the item is marked pending.
  function setFavorite(source: FavoriteSource, name: string, value: boolean) {
    store.markFavoritePending(source, name, value);
    publish(topics.controlServices, { action: "favorite", source, name, value });
    setTimeout(() => store.clearFavoritePending(source, name), FAVORITE_TIMEOUT_MS);
  }

  return { connect, disconnect, publish, setFavorite };
}
