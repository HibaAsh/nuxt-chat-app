<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  image?: string // user image URL
  size?: number // width/height in pixels
  online?: boolean // show online indicator
  alt?: string // alt text
}>()

const avatarSize = props.size || 40
</script>

<template>
  <div class="relative inline-block" :style="{ width: avatarSize + 'px', height: avatarSize + 'px' }">
    <!-- Avatar Image -->
    <div class="flex gap-10">
      <img v-if="props.image" :src="props.image" :lazy-src="props.image"
        class="w-full h-full rounded-full object-cover border border-gray-200" />
        
      <div v-else class="iconify-wrapper flex w-full h-full rounded-full border border-gray-200 bg-gray-600">
        <Icon class="text-white" name="ri:user-line" />
      </div>
    </div>

    <!-- Online indicator -->
    <span v-if="props.online"
      class="absolute bottom-0 right-0 block w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
  </div>
</template>

<style scoped>
/* Optional: subtle shadow */
img {
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}

.iconify-wrapper {
  .iconify {
    width: 65%;
    height: 65%;
    margin: auto;
  }
}
</style>
