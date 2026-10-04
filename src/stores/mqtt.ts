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
};

export type SystemdService = {
  name: string;
  active: string; // active | inactive | failed | activating | deactivating | reloading
  sub: string; // running, exited, dead, failed, auto-restart…
  // Unit file state: enabled | disabled | static | masked | indirect | enabled-runtime | generated …
  // "" when the unit has no unit file. Informational only — never an error.
  enabled: string;
  description: string;
  favorite: boolean;
};

export type DockerContainer = {
  name: string;
  image: string;
  state: string; // running | exited | paused | restarting | created | dead
  status: string; // Docker's own human-readable text, shown as-is
  favorite: boolean;
};

export type FavoriteSource = "systemd" | "docker";

export const favoriteKey = (source: FavoriteSource, name: string) =>
  `${source}:${name}`;

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
    // null until the first retained message arrives; [] means "none".
    services: null as SystemdService[] | null,
    docker: null as DockerContainer[] | null,
    // Favorite toggles sent but not yet confirmed, keyed by favoriteKey() and
    // holding the requested value. The daemon confirms by republishing the list.
    pendingFavorites: {} as Record<string, boolean>,
  }),
  actions: {
    setFastData(data: Partial<FastData>) {
      this.fastData = { ...this.fastData, ...data };
    },
    setSlowData(data: Partial<SlowData>) {
      this.slowData = { ...this.slowData, ...data };
    },
    setServices(list: SystemdService[]) {
      this.services = list;
      this.settleFavorites("systemd", list);
    },
    setDocker(list: DockerContainer[]) {
      this.docker = list;
      this.settleFavorites("docker", list);
    },
    markFavoritePending(source: FavoriteSource, name: string, value: boolean) {
      this.pendingFavorites[favoriteKey(source, name)] = value;
    },
    clearFavoritePending(source: FavoriteSource, name: string) {
      delete this.pendingFavorites[favoriteKey(source, name)];
    },
    settleFavorites(source: FavoriteSource, list: { name: string; favorite: boolean }[]) {
      for (const item of list) {
        const key = favoriteKey(source, item.name);
        if (this.pendingFavorites[key] === item.favorite) delete this.pendingFavorites[key];
      }
    },
    setStatus(status: ConnectionStatus) {
      this.status = status;
    },
  },
});
