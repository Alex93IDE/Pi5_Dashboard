<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useMqtt } from "./composables/mqtt";
import UpdateBanner from "./components/UpdateBanner.vue";

const { connect, disconnect } = useMqtt();

onMounted(() => {
  connect();
});
onUnmounted(() => disconnect());
</script>

<template>
  <router-view />
  <UpdateBanner />
</template>
