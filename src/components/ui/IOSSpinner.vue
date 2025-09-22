<template>
  <div 
    class="ios-spinner"
    :style="{ width: `${size}px`, height: `${size}px` }"
  >
    <svg
      class="ios-spinner__svg"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        class="ios-spinner__circle"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-dasharray="31.416"
        stroke-dashoffset="31.416"
      />
    </svg>
  </div>
</template>

<script setup lang="ts">
interface Props {
  size?: number
}

withDefaults(defineProps<Props>(), {
  size: 20
})
</script>

<style lang="scss" scoped>
.ios-spinner {
  display: inline-block;
  
  &__svg {
    width: 100%;
    height: 100%;
    animation: ios-spinner-rotate 1s linear infinite;
  }
  
  &__circle {
    animation: ios-spinner-dash 1.5s ease-in-out infinite;
  }
}

@keyframes ios-spinner-rotate {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes ios-spinner-dash {
  0% {
    stroke-dasharray: 1, 150;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -35;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -124;
  }
}
</style>