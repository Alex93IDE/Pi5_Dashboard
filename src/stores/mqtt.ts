import { defineStore } from "pinia";

export type UfwRule = {
  num: number;
  to: string;
  action: string;
  from: string;
};

export type FastData = {
  cpu_pct: number | null;
  cpu_freq: number | null;
  cpu_temp: number | null;
  fan_rpm: number | null;
  ram_used: number | null;
  ram_total: number | null;
  ram_pct: number | null;
  disk_used: number | null;
  disk_total: number | null;
  disk_pct: number | null;
  ip: string | null;
  uptime: string | null;
  wg_active: number | null;
  wg_total: number | null;
  timestamp: string | number | null; // ISO 8601 as published; Date parses either

  oled_enable: boolean | null;
  rgb_enable: boolean | null;
  rgb_color: string | null;
  rgb_brightness: number | null;
  rgb_speed: number | null;
  rgb_style: string | null;
  fan_mode: number | null;
};

/**
 * The publisher emits one `svc_<alias>` boolean per unit it watches, and those
 * aliases are configured on its side — so they are typed as an open set here
 * instead of being pinned to any one machine's service list.
 */
export type SlowData = {
  // The NVMe fields come straight out of smartctl, so they can be strings
  // like "100%" or "3,234" rather than plain numbers.
  nvme_temp: string | number | null;
  nvme_spare: string | number | null;
  nvme_used: string | number | null;
  nvme_hours: string | number | null;
  nvme_unsafe: string | number | null;
  nvme_errors: string | number | null;
  f2b_bans: number | null;
  cs_bans: number | null;
  ufw_status: string | null;
  ufw_rules: UfwRule[] | null;
} & { [service: `svc_${string}`]: boolean | null | undefined };

export type ConnectionStatus = "connecting" | "connected" | "disconnected";

const emptyFast: FastData = {
  cpu_pct: null,
  cpu_freq: null,
  cpu_temp: null,
  fan_rpm: null,
  ram_used: null,
  ram_total: null,
  ram_pct: null,
  disk_used: null,
  disk_total: null,
  disk_pct: null,
  ip: null,
  uptime: null,
  wg_active: null,
  wg_total: null,
  timestamp: null,
  oled_enable: null,
  rgb_enable: null,
  rgb_color: null,
  rgb_brightness: null,
  rgb_speed: null,
  rgb_style: null,
  fan_mode: null,
};

const emptySlow: SlowData = {
  nvme_temp: null,
  nvme_spare: null,
  nvme_used: null,
  nvme_hours: null,
  nvme_unsafe: null,
  nvme_errors: null,
  f2b_bans: null,
  cs_bans: null,
  ufw_status: null,
  ufw_rules: null,
};

export const useMqttStore = defineStore("mqtt", {
  state: () => ({
    status: "disconnected" as ConnectionStatus,
    fastData: { ...emptyFast },
    slowData: { ...emptySlow } as SlowData,
  }),
  actions: {
    setFastData(data: Partial<FastData>) {
      this.fastData = { ...this.fastData, ...data };
    },
    setSlowData(data: Partial<SlowData>) {
      this.slowData = { ...this.slowData, ...data };
    },
    setStatus(status: ConnectionStatus) {
      this.status = status;
    },
  },
});
