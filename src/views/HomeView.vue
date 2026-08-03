<script setup lang="ts">
import DiskNetCard from "../components/DiskNetCard.vue";
import CpuCard from "../components/CpuCard.vue";
import RamCard from "../components/RamCard.vue";
import PironmanControl from "../components/PironmanControl.vue";
import ServicesCard from "../components/ServicesCard.vue";
import UfwCard from "../components/UfwCard.vue";
</script>

<template>
  <div class="dashboard">
    <CpuCard />
    <RamCard />
    <PironmanControl />
    <div class="full-row">
      <DiskNetCard />
      <ServicesCard />
    </div>
    <div class="full-row">
      <UfwCard />
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: flex-start;
  align-content: flex-start;
  gap: 20px;
  padding: 32px 24px;
  min-height: 100vh;
  background: radial-gradient(
      ellipse 80% 60% at 50% 0%,
      rgba(4, 145, 115, 0.06) 0%,
      transparent 70%
    ),
    var(--bg);
}

.full-row {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}
</style>
