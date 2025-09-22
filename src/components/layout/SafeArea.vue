<template>
  <div class="safe-area" :class="{ 'with-tab-bar': showTabBar }">
    <div class="safe-area-content">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showTabBar?: boolean
}

withDefaults(defineProps<Props>(), {
  showTabBar: true
})
</script>

<style lang="scss" scoped>
.safe-area {
  min-height: 100vh;
  padding-top: env(safe-area-inset-top);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  
  &.with-tab-bar {
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
  
  &:not(.with-tab-bar) {
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  .safe-area-content {
    min-height: 100%;
  }
}
</style>