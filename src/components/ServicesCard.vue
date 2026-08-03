<script setup lang="ts">
import { computed } from "vue";
import { Activity } from "lucide-vue-next";
import { useMqttStore } from "../stores/mqtt";
import { serviceLabels } from "../config";

const store = useMqttStore();

// The publisher decides which units it watches, so the card follows whatever
// `svc_*` fields turn up rather than keeping its own list in sync by hand.
function labelFor(alias: string): string {
  return serviceLabels[alias] ?? alias.charAt(0).toUpperCase() + alias.slice(1);
}

const statuses = computed(() =>
  Object.entries(store.slowData)
    .filter(([key]) => key.startsWith("svc_"))
    .map(([key, active]) => ({
      key,
      label: labelFor(key.slice("svc_".length)),
      active: (active ?? null) as boolean | null,
    }))
);
</script>

<template>
  <div class="card">
    <div class="card-header">
      <Activity :size="16" />
      <span>Services</span>
    </div>

    <div class="card-body">
      <div v-if="!statuses.length" class="svc-empty">—</div>
      <div v-else class="svc-grid">
        <div
          v-for="svc in statuses"
          :key="svc.key"
          class="svc-item"
          :class="
            svc.active === null
              ? 'svc-unknown'
              : svc.active
              ? 'svc-on'
              : 'svc-off'
          "
        >
          <span class="svc-dot" />
          <div class="svc-info">
            <span class="svc-label">{{ svc.label }}</span>
            <span class="svc-status">
              {{ svc.active === null ? "—" : svc.active ? "running" : "down" }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card {
  width: 500px;
  border-color: rgba(56, 189, 248, 0.15);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    0 0 32px rgba(56, 189, 248, 0.05), 0 12px 40px rgba(0, 0, 0, 0.6);
}

.svc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  width: 100%;
}

.svc-item {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 11px;
  padding: 10px 13px;
}

.svc-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.svc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.svc-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  line-height: 1;
}

.svc-status {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  line-height: 1;
}

.svc-empty {
  color: var(--text-muted);
  font-size: 14px;
  padding: 20px 0;
}

/* States */
.svc-on .svc-dot {
  background: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
}

.svc-on .svc-status {
  color: #22c55e;
}

.svc-off .svc-dot {
  background: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
  animation: blink 1.2s step-start infinite;
}

.svc-off .svc-status {
  color: #ef4444;
}

.svc-off {
  border-color: rgba(239, 68, 68, 0.15);
}

.svc-unknown .svc-dot {
  background: #525875;
}

.svc-unknown .svc-status {
  color: #525875;
}

@keyframes blink {
  50% {
    opacity: 0.2;
  }
}
</style>
