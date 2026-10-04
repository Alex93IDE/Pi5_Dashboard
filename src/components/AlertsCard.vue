<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink } from "vue-router";
import { TriangleAlert, CircleCheck } from "lucide-vue-next";
import { useMqttStore } from "../stores/mqtt";
import { toNumber } from "../utils/number";

type Alert = {
  level: "error" | "warn";
  title: string;
  detail: string;
  to?: string; // route name to jump to
};

// The fast topic arrives every second; this long without one means the
// publisher (not the broker) has stopped.
const STALE_MS = 15_000;

const store = useMqttStore();

const now = ref(Date.now());
let timer: ReturnType<typeof setInterval>;
onMounted(() => (timer = setInterval(() => (now.value = Date.now()), 5_000)));
onUnmounted(() => clearInterval(timer));

const alerts = computed<Alert[]>(() => {
  const list: Alert[] = [];
  const fast = store.fastData;
  const slow = store.slowData;

  // Connection
  if (store.status === "disconnected") {
    list.push({ level: "error", title: "Broker", detail: "not connected — data below may be stale" });
  } else if (store.status === "connected" && fast.timestamp) {
    const age = now.value - new Date(fast.timestamp).getTime();
    if (age > STALE_MS) {
      list.push({ level: "warn", title: "Publisher", detail: `no metrics for ${Math.round(age / 1000)} s` });
    }
  }

  // systemd: "failed" is always an error; "inactive" only matters for the
  // units you starred — for the rest it's normal (oneshots, missing hardware…).
  for (const svc of store.services ?? []) {
    const title = svc.name.replace(/\.service$/, "");
    if (svc.active === "failed") {
      list.push({ level: "error", title, detail: `failed · ${svc.sub}`, to: "services" });
    } else if (svc.favorite && svc.active !== "active") {
      list.push({ level: "error", title, detail: `${svc.active} · ${svc.sub}`, to: "services" });
    }
  }

  // Docker: a container that isn't running is worth a look; dead, restarting
  // or a starred one down is an error.
  for (const c of store.docker ?? []) {
    if (c.state === "running") continue;
    const serious = c.favorite || c.state === "dead" || c.state === "restarting";
    list.push({ level: serious ? "error" : "warn", title: c.name, detail: c.status, to: "docker" });
  }

  // Firewall
  if (slow.ufw_status && slow.ufw_status !== "active") {
    list.push({ level: "error", title: "UFW", detail: `firewall ${slow.ufw_status}`, to: "ufw" });
  }

  // Hardware — same red thresholds the cards use.
  const cpuTemp = fast.cpu_temp;
  if (cpuTemp !== null && cpuTemp >= 80) {
    list.push({ level: "warn", title: "CPU", detail: `temperature ${cpuTemp.toFixed(0)} °C` });
  }
  if (fast.ram_pct !== null && fast.ram_pct >= 90) {
    list.push({ level: "warn", title: "RAM", detail: `${fast.ram_pct.toFixed(0)} % used` });
  }
  if (fast.disk_pct !== null && fast.disk_pct >= 90) {
    list.push({ level: "warn", title: "Disk", detail: `${fast.disk_pct.toFixed(0)} % full` });
  }

  const nvmeTemp = toNumber(slow.nvme_temp);
  if (nvmeTemp !== null && nvmeTemp >= 70) {
    list.push({ level: "warn", title: "NVMe", detail: `temperature ${nvmeTemp} °C` });
  }
  const nvmeSpare = toNumber(slow.nvme_spare);
  if (nvmeSpare !== null && nvmeSpare <= 10) {
    list.push({ level: "error", title: "NVMe", detail: `spare capacity ${nvmeSpare} %` });
  }
  const nvmeUsed = toNumber(slow.nvme_used);
  if (nvmeUsed !== null && nvmeUsed >= 90) {
    list.push({ level: "warn", title: "NVMe", detail: `wear ${nvmeUsed} %` });
  }
  const nvmeErrors = toNumber(slow.nvme_errors);
  if (nvmeErrors !== null && nvmeErrors > 0) {
    list.push({ level: "error", title: "NVMe", detail: `${nvmeErrors} media errors` });
  }

  // Errors first, otherwise keep the order above.
  return list.sort((a, b) => Number(b.level === "error") - Number(a.level === "error"));
});

const errorCount = computed(() => alerts.value.filter((a) => a.level === "error").length);
</script>

<template>
  <div class="card" :class="{ 'has-errors': errorCount > 0 }">
    <div class="card-header">
      <TriangleAlert :size="16" />
      <span>Alerts</span>
      <span v-if="alerts.length" class="count" :class="errorCount ? 'count-error' : 'count-warn'">
        {{ alerts.length }}
      </span>
    </div>

    <div class="card-body">
      <div v-if="!alerts.length" class="ok">
        <CircleCheck :size="28" />
        <span>Everything looks fine</span>
      </div>
      <ul v-else class="alerts">
        <li v-for="(a, i) in alerts" :key="i">
          <component
            :is="a.to ? RouterLink : 'div'"
            :to="a.to ? { name: a.to } : undefined"
            class="alert"
            :class="`alert-${a.level}`"
          >
            <span class="dot" />
            <span class="title">{{ a.title }}</span>
            <span class="detail">{{ a.detail }}</span>
          </component>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.card {
  width: 500px;
  border-color: rgba(245, 158, 11, 0.15);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 0 32px rgba(245, 158, 11, 0.04), 0 12px 40px rgba(0, 0, 0, 0.6);
}

.card.has-errors {
  border-color: rgba(239, 68, 68, 0.25);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 0 32px rgba(239, 68, 68, 0.07), 0 12px 40px rgba(0, 0, 0, 0.6);
}

.count {
  margin-left: auto;
  padding: 1px 8px;
  border-radius: 999px;
  font-family: var(--font-mono);
  letter-spacing: 0;
}

.count-error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.12);
}

.count-warn {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
}

.ok {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: #22c55e;
  font-size: 13px;
}

.alerts {
  list-style: none;
  margin: 0;
  padding: 0;
  width: 100%;
  max-height: 320px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  color: inherit;
  text-decoration: none;
}

a.alert:hover {
  background: rgba(255, 255, 255, 0.06);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.title {
  flex-shrink: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
}

.detail {
  margin-left: auto;
  min-width: 0;
  font-size: 10.5px;
  font-family: var(--font-mono);
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.alert-error {
  border-color: rgba(239, 68, 68, 0.15);
}

.alert-error .dot {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}

.alert-error .detail {
  color: #ef4444;
}

.alert-warn .dot {
  background: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
}

.alert-warn .detail {
  color: #f59e0b;
}
</style>
