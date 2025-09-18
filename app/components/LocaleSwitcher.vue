<script setup lang="ts">
import { ref, computed, watch, Transition } from 'vue'
import { useI18n } from '#imports'
import { useLocale } from '@/composables/useLocale'

const { locale, setLocale } = useI18n()
const { setLocaleCustom } = useLocale()
const switchLocalePath = useSwitchLocalePath()

// reactive locale (fallback to 'en')
const current = ref(locale.value || 'en')

// map flags to locale codes
const flags: Record<string, string> = {
  en: 'twemoji:flag-united-states',
  ar: 'twemoji:flag-syria',
}
const getFlagIcon = (code: string) =>
  flags[code] || 'twemoji:globe-showing-americas'

// show the **other language's flag**
const icon = computed(() => {
  const other = current.value === 'en' ? 'ar' : 'en'
  return getFlagIcon(other)
})

// update locale + navigate whenever current changes
watch(current, async (val) => {
  setLocale(val)
  setLocaleCustom(val)
  locale.value = val
  if (switchLocalePath) {
    const path = switchLocalePath(val)
    if (path) await navigateTo(path)
  }
}, { immediate: true })

// toggle between en ↔ ar
function toggleLocale() {
  current.value = current.value === 'en' ? 'ar' : 'en'
}
</script>

<template>
  <button
    @click="toggleLocale"
    class="px-4 py-2 w-fit flex rounded bg-primary text-text hover:opacity-90 transition relative overflow-hidden"
  >
    <Transition name="flag" mode="out-in">
      <Icon :key="icon" :name="icon" size="25" />
    </Transition>
  </button>
</template>

<style scoped>
.flag-enter-active, .flag-leave-active {
  transition: all 0.25s ease;
}
.flag-enter-from {
  opacity: 0;
  transform: scale(0.8) rotate(-10deg);
}
.flag-enter-to {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}
.flag-leave-from {
  opacity: 1;
  transform: scale(1) rotate(0deg);
}
.flag-leave-to {
  opacity: 0;
  transform: scale(0.8) rotate(10deg);
}
</style>
