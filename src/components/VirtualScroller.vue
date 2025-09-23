<template>
  <div 
    ref="containerRef"
    class="virtual-scroller"
    :style="{ height: `${containerHeight}px` }"
    @scroll="handleScroll"
  >
    <div 
      class="virtual-scroller-spacer"
      :style="{ height: `${totalHeight}px` }"
    >
      <div 
        class="virtual-scroller-content"
        :style="{ transform: `translateY(${offsetY}px)` }"
      >
        <div
          v-for="item in visibleItems"
          :key="getItemKey(item.index)"
          class="virtual-scroller-item"
          :style="{ 
            height: `${getItemHeight(item.index)}px`,
            minHeight: `${getItemHeight(item.index)}px`
          }"
        >
          <slot 
            :item="items[item.index]" 
            :index="item.index"
            :is-visible="true"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { usePerformanceOptimization } from '../composables/usePerformanceOptimization'

interface Props {
  items: any[]
  itemHeight?: number | ((index: number) => number)
  containerHeight: number
  buffer?: number
  overscan?: number
  keyField?: string
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 50,
  buffer: 5,
  overscan: 3,
  keyField: 'id'
})

const emit = defineEmits<{
  scroll: [{ scrollTop: number; scrollLeft: number }]
  visibleRangeChange: [{ start: number; end: number }]
}>()

const { throttle } = usePerformanceOptimization()

// Refs
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)

// Computed properties
const itemCount = computed(() => props.items.length)

const getItemHeight = (index: number): number => {
  if (typeof props.itemHeight === 'function') {
    return props.itemHeight(index)
  }
  return props.itemHeight
}

const getItemKey = (index: number): string | number => {
  const item = props.items[index]
  if (item && typeof item === 'object' && props.keyField in item) {
    return item[props.keyField]
  }
  return index
}

// Calculate total height
const totalHeight = computed(() => {
  if (typeof props.itemHeight === 'function') {
    let height = 0
    for (let i = 0; i < itemCount.value; i++) {
      height += getItemHeight(i)
    }
    return height
  }
  return itemCount.value * props.itemHeight
})

// Calculate visible range
const visibleRange = computed(() => {
  if (itemCount.value === 0) {
    return { start: 0, end: 0 }
  }

  let start = 0
  let end = 0

  if (typeof props.itemHeight === 'function') {
    // Variable height calculation
    let accumulatedHeight = 0
    
    // Find start index
    for (let i = 0; i < itemCount.value; i++) {
      const itemHeight = getItemHeight(i)
      if (accumulatedHeight + itemHeight > scrollTop.value) {
        start = i
        break
      }
      accumulatedHeight += itemHeight
    }

    // Find end index
    const visibleHeight = props.containerHeight
    accumulatedHeight = 0
    for (let i = start; i < itemCount.value; i++) {
      accumulatedHeight += getItemHeight(i)
      if (accumulatedHeight >= visibleHeight) {
        end = i + 1
        break
      }
    }

    if (end === 0) end = itemCount.value
  } else {
    // Fixed height calculation
    start = Math.floor(scrollTop.value / props.itemHeight)
    end = Math.min(
      start + Math.ceil(props.containerHeight / props.itemHeight) + 1,
      itemCount.value
    )
  }

  // Apply buffer and overscan
  const bufferedStart = Math.max(0, start - props.buffer)
  const bufferedEnd = Math.min(itemCount.value, end + props.buffer + props.overscan)

  return { start: bufferedStart, end: bufferedEnd }
})

// Calculate offset for positioning
const offsetY = computed(() => {
  if (visibleRange.value.start === 0) return 0

  if (typeof props.itemHeight === 'function') {
    let offset = 0
    for (let i = 0; i < visibleRange.value.start; i++) {
      offset += getItemHeight(i)
    }
    return offset
  }

  return visibleRange.value.start * props.itemHeight
})

// Visible items
const visibleItems = computed(() => {
  const items = []
  for (let i = visibleRange.value.start; i < visibleRange.value.end; i++) {
    items.push({
      index: i,
      height: getItemHeight(i)
    })
  }
  return items
})

// Throttled scroll handler
const handleScroll = throttle((event: Event) => {
  const target = event.target as HTMLElement
  scrollTop.value = target.scrollTop

  emit('scroll', {
    scrollTop: target.scrollTop,
    scrollLeft: target.scrollLeft
  })
}, 16) // ~60fps

// Watch for visible range changes
watch(visibleRange, (newRange, oldRange) => {
  if (newRange.start !== oldRange?.start || newRange.end !== oldRange?.end) {
    emit('visibleRangeChange', newRange)
  }
}, { immediate: true })

// Scroll to specific item
const scrollToItem = (index: number, alignment: 'start' | 'center' | 'end' = 'start') => {
  if (!containerRef.value || index < 0 || index >= itemCount.value) return

  let targetScrollTop = 0

  if (typeof props.itemHeight === 'function') {
    for (let i = 0; i < index; i++) {
      targetScrollTop += getItemHeight(i)
    }
  } else {
    targetScrollTop = index * props.itemHeight
  }

  // Adjust based on alignment
  if (alignment === 'center') {
    targetScrollTop -= (props.containerHeight - getItemHeight(index)) / 2
  } else if (alignment === 'end') {
    targetScrollTop -= props.containerHeight - getItemHeight(index)
  }

  // Ensure within bounds
  targetScrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight.value - props.containerHeight))

  containerRef.value.scrollTop = targetScrollTop
}

// Scroll to top
const scrollToTop = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = 0
  }
}

// Scroll to bottom
const scrollToBottom = () => {
  if (containerRef.value) {
    containerRef.value.scrollTop = totalHeight.value
  }
}

// Expose methods
defineExpose({
  scrollToItem,
  scrollToTop,
  scrollToBottom,
  getVisibleRange: () => visibleRange.value
})
</script>

<style lang="scss" scoped>
.virtual-scroller {
  overflow: auto;
  position: relative;
  
  // Optimize scrolling performance
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
  will-change: scroll-position;
  
  // Hide scrollbar on mobile
  &::-webkit-scrollbar {
    display: none;
  }
  
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.virtual-scroller-spacer {
  position: relative;
  width: 100%;
}

.virtual-scroller-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  will-change: transform;
}

.virtual-scroller-item {
  width: 100%;
  overflow: hidden;
}
</style>