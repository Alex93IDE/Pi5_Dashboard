<script setup lang="ts">
import DiskNetCard from "../components/DiskNetCard.vue";
import CpuCard from "../components/CpuCard.vue";
import RamCard from "../components/RamCard.vue";
import AlertsCard from "../components/AlertsCard.vue";
</script>

<template>
  <div class="page">
    <CpuCard />
    <RamCard />
    <div class="full-row">
      <DiskNetCard />
      <AlertsCard />
    </div>
  </div>
</template>

<style scoped>
.full-row {
  width: 100%;
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}
</style>
