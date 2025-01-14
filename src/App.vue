<script setup lang="ts">
import { RouterView } from 'vue-router'

import Toast from 'primevue/toast';
</script>

<template>
    <Toast /> <!-- 确保 Toast 组件在根组件中 -->
  <RouterView />
</template>
