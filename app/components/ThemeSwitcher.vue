<script setup lang="ts">
import { ref, watch } from 'vue'

const theme = ref(localStorage.getItem('theme') || 'dark')
const icon = computed(() => theme.value === 'dark' ? 'tdesign:mode-light' : 'tdesign:mode-dark')

watch(theme, (val) => {
  const html = document.documentElement
  if (val === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
  localStorage.setItem('theme', val)
}, { immediate: true })

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <button
    @click="toggleTheme"
    class="px-4 py-2 w-fit flex rounded bg-primary text-text hover:opacity-90 transition relative overflow-hidden"
  >
    <Transition name="flag" mode="out-in">
      <Icon :key="icon" :name="icon" size="25" />
    </Transition>
  </button>
</template>
