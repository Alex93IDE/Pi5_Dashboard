<script setup lang="ts">
import { computed } from "vue";
import { useMqtt } from "../composables/mqtt";
import { useMqttStore } from "../stores/mqtt";
import { Network, ArrowUp, Clock, Shield, ShieldAlert, Wifi } from "lucide-vue-next";

const { connect, disconnect } = useMqtt();
const store = useMqttStore();

const enabled = computed(() => store.status !== "disconnected")

const wgColor  = computed(() => Number(store.fastData.wg_active ?? 0) > 0  ? "#38bdf8" : "var(--text-muted)")
const f2bColor = computed(() => (store.slowData.f2b_bans  ?? 0) > 0  ? "#fb923c" : "var(--text-muted)")
const csColor  = computed(() => (store.slowData.cs_bans   ?? 0) > 0  ? "#fb923c" : "var(--text-muted)");

function formatTime(ts: string | number | null): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleTimeString([], { hour12: false });
}

function toggle() {
  if (enabled.value) {
    disconnect();
  } else {
    connect();
  }
}
</script>

<template>
  <div class="layout">
    <header class="header">
      <!-- Left: title + IP -->
      <div class="header-left">
        <span class="title">Pi5 Dashboard</span>
        <span class="subtitle">
          <Network :size="11" />
          {{ store.fastData.ip ?? "—" }}
        </span>
      </div>

      <!-- Center: stats -->
      <div class="header-center">
        <div class="stat">
          <span class="stat-label"><ArrowUp :size="11" /> uptime</span>
          <span class="stat-value">{{ store.fastData.uptime ?? "—" }}</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-label"><Clock :size="11" /> time</span>
          <span class="stat-value">{{ formatTime(store.fastData.timestamp) }}</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-label"><Wifi :size="11" /> WireGuard</span>
          <span class="stat-value" :style="{ color: wgColor }">
            {{ store.fastData.wg_active ?? "—" }} / {{ store.fastData.wg_total ?? "—" }}
          </span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-label"><ShieldAlert :size="11" /> F2B</span>
          <span class="stat-value" :style="{ color: f2bColor }">{{ store.slowData.f2b_bans ?? "—" }}</span>
        </div>
        <div class="stat-divider" />
        <div class="stat">
          <span class="stat-label"><Shield :size="11" /> CrowdSec</span>
          <span class="stat-value" :style="{ color: csColor }">{{ store.slowData.cs_bans ?? "—" }}</span>
        </div>
      </div>

      <!-- Right: status + toggle -->
      <div class="header-right">
        <div class="status-wrap">
          <span class="dot" :class="store.status" />
        </div>
        <label class="toggle-wrap">
          <input type="checkbox" :checked="enabled" @change="toggle" />
          <span class="slider"></span>
        </label>
      </div>
    </header>
    <main class="content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg);
}

.header {
  background-color: var(--bg-surface);
  border-bottom: 1px solid var(--border);
  padding: 0 1.5rem;
  height: 64px;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
}

/* Left */
.header-left {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.02em;
}

.subtitle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
}

/* Center */
.header-center {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  display: flex;
  align-items: center;
  gap: 0.2rem;
  font-size: 0.6rem;
  font-family: var(--font-mono);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: 0.8rem;
  font-family: var(--font-mono);
  color: var(--text);
  font-weight: 500;
}


.stat-divider {
  width: 1px;
  height: 28px;
  background-color: var(--border);
}

/* Right */
.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.status-wrap {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.status-label {
  font-size: 0.7rem;
  font-family: var(--font-mono);
}

.status-label.connected {
  color: var(--success);
}
.status-label.connecting {
  color: var(--warning);
}
.status-label.disconnected {
  color: var(--error);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.connected {
  background-color: var(--success);
  box-shadow: 0 0 6px var(--success);
}

.dot.connecting {
  background-color: var(--warning);
  box-shadow: 0 0 6px var(--warning);
  animation: pulse 1s infinite;
}

.dot.disconnected {
  background-color: var(--error);
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

/* Toggle */
.toggle-wrap {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.toggle-wrap input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  inset: 0;
  background-color: var(--border);
  border-radius: 24px;
  transition: background-color 0.2s;
}

.slider::before {
  content: "";
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  top: 3px;
  background-color: var(--text-muted);
  border-radius: 50%;
  transition: transform 0.2s, background-color 0.2s;
}

.toggle-wrap input:checked + .slider {
  background-color: var(--primary-muted);
}

.toggle-wrap input:checked + .slider::before {
  transform: translateX(20px);
  background-color: var(--primary);
}

.content {
  flex: 1;
  padding: 1.5rem;
}
</style>
