<script setup lang="ts">
import { computed } from "vue";
import { ArrowDown, ArrowUp, Network } from "lucide-vue-next";
import { useMqttStore } from "../stores/mqtt";
import Sparkline, { type SparkSeries } from "./Sparkline.vue";

const store = useMqttStore();

const RX_COLOR = "#38bdf8";
const TX_COLOR = "#a78bfa";

function formatRate(bytes: number | null): { value: string; unit: string } {
  if (bytes === null) return { value: "—", unit: "" };
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return { value: v >= 100 || i === 0 ? v.toFixed(0) : v.toFixed(1), unit: units[i] };
}

const rx = computed(() => formatRate(store.fastData.net_rx));
const tx = computed(() => formatRate(store.fastData.net_tx));

// Both lines share one scale so they can be compared. The 1 KB/s floor keeps
// an idle link from looking like a spike.
const scaleMax = computed(() =>
  Math.max(1024, ...store.netHistory.map((s) => Math.max(s.rx, s.tx)))
);
const peak = computed(() => formatRate(scaleMax.value));
const series = computed<SparkSeries[]>(() => [
  { values: store.netHistory.map((s) => s.rx), color: RX_COLOR, fill: true },
  { values: store.netHistory.map((s) => s.tx), color: TX_COLOR },
]);
</script>

<template>
  <div class="card">
    <div class="card-header">
      <Network :size="16" />
      <span>Network</span>
      <span v-if="store.fastData.net_iface" class="iface">{{ store.fastData.net_iface }}</span>
    </div>

    <div class="card-body">
      <div class="rates">
        <div class="rate">
          <span class="rate-label"><ArrowDown :size="12" :style="{ color: RX_COLOR }" /> Down</span>
          <span class="rate-value" :style="{ color: RX_COLOR }">
            {{ rx.value }}<span class="rate-unit">{{ rx.unit }}</span>
          </span>
        </div>
        <div class="rate">
          <span class="rate-label"><ArrowUp :size="12" :style="{ color: TX_COLOR }" /> Up</span>
          <span class="rate-value" :style="{ color: TX_COLOR }">
            {{ tx.value }}<span class="rate-unit">{{ tx.unit }}</span>
          </span>
        </div>
      </div>

      <Sparkline :series="series" :max="scaleMax" :top-label="`${peak.value} ${peak.unit}`" />
    </div>
  </div>
</template>

<style scoped>
.card {
  border-color: rgba(56, 189, 248, 0.15);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 0 32px rgba(56, 189, 248, 0.06), 0 12px 40px rgba(0, 0, 0, 0.6);
}

.iface {
  margin-left: auto;
  padding: 2px 8px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.07);
  background: rgba(255, 255, 255, 0.03);
  font-family: var(--font-mono);
  letter-spacing: 0.03em;
  text-transform: none;
}

.rates {
  display: flex;
  gap: 7px;
  width: 100%;
}

.rate {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 11px;
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(255, 255, 255, 0.055);
}

.rate-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: rgba(107, 112, 144, 0.7);
}

.rate-value {
  font-size: 24px;
  font-weight: 700;
  font-family: var(--font-mono);
  line-height: 1;
  letter-spacing: -0.02em;
}

.rate-unit {
  margin-left: 4px;
  font-size: 11px;
  font-weight: 500;
  opacity: 0.55;
}
</style>
