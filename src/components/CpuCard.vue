<script setup lang="ts">
import { computed } from "vue";
import { Cpu, Thermometer, Zap, Wind } from "lucide-vue-next";
import { useMqttStore } from "../stores/mqtt";

const store = useMqttStore();

const cpuPct = computed(() => store.fastData.cpu_pct);
const cpuFreq = computed(() => store.fastData.cpu_freq);
const cpuTemp = computed(() => store.fastData.cpu_temp);
const fanRpm = computed(() => store.fastData.fan_rpm);

const freqGHz = computed(() =>
  cpuFreq.value !== null ? (cpuFreq.value / 1000).toFixed(2) : null
);

const tempColor = computed(() => {
  const t = cpuTemp.value;
  if (t === null) return "#525875";
  if (t >= 80) return "#ef4444";
  if (t >= 65) return "#f97316";
  return "#22c55e";
});

const pctColor = computed(() => {
  const p = cpuPct.value;
  if (p === null) return "#525875";
  if (p >= 90) return "#ef4444";
  if (p >= 70) return "#f97316";
  return "#22c55e";
});

const CIRC = 2 * Math.PI * 52;
const pctDash = computed(() => {
  const filled = ((cpuPct.value ?? 0) / 100) * CIRC;
  return `${filled} ${CIRC}`;
});
</script>

<template>
  <div class="card">
    <div class="card-header">
      <Cpu :size="16" />
      <span>CPU</span>
    </div>

    <div class="card-body">
      <div class="gauge-wrap">
        <svg class="gauge" viewBox="0 0 120 120">
          <defs>
            <filter id="glow-cpu" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="60" cy="60" r="52" class="gauge-bg" />
          <circle
            cx="60"
            cy="60"
            r="52"
            class="gauge-fill"
            :stroke="pctColor"
            :stroke-dasharray="pctDash"
            stroke-dashoffset="0"
            transform="rotate(-90 60 60)"
            filter="url(#glow-cpu)"
          />
        </svg>
        <div class="gauge-label">
          <span class="gauge-value" :style="{ color: pctColor }">
            {{ cpuPct !== null ? cpuPct.toFixed(0) : "—" }}
          </span>
          <span class="gauge-unit" :style="{ color: pctColor }">%</span>
        </div>
      </div>

      <div class="metrics">
        <div class="metric">
          <Thermometer :size="14" :style="{ color: tempColor }" />
          <div class="metric-content">
            <span class="metric-label">Temp</span>
            <span class="metric-value" :style="{ color: tempColor }">
              {{ cpuTemp !== null ? `${cpuTemp.toFixed(1)}°` : "—" }}
            </span>
          </div>
        </div>
        <div class="metric">
          <Zap :size="14" style="color: #a78bfa" />
          <div class="metric-content">
            <span class="metric-label">Freq</span>
            <span class="metric-value" style="color: #a78bfa">
              {{ freqGHz !== null ? `${freqGHz}G` : "—" }}
            </span>
          </div>
        </div>
        <div class="metric">
          <Wind :size="14" style="color: #38bdf8" />
          <div class="metric-content">
            <span class="metric-label">Fan</span>
            <span class="metric-value" style="color: #38bdf8">
              {{ fanRpm !== null ? `${fanRpm}` : "—" }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  height: 280px;
  border-color: rgba(34, 197, 94, 0.15);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 0 32px rgba(34, 197, 94, 0.06), 0 12px 40px rgba(0, 0, 0, 0.6);
}
</style>
