import mqtt, { type MqttClient } from "mqtt";
import { ref } from "vue";
import { useMqttStore } from "../stores/mqtt";
import { broker, brokerUrl, topics } from "../config";

const client = ref<MqttClient | null>(null);

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
      client.value?.subscribe([topics.fast, topics.slow]);
    });

    client.value.on("disconnect", () => store.setStatus("disconnected"));
    client.value.on("error", (err) => console.error("MQTT error:", err));

    client.value.on("message", (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        if (topic === topics.fast) store.setFastData(data);
        if (topic === topics.slow) store.setSlowData(data);
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

  return { connect, disconnect, publish };
}
