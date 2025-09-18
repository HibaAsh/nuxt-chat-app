<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '#imports'

const { locale } = useI18n()

const direction = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'))

useHead(
  computed(() => ({
    htmlAttrs: {
      lang: locale.value,
      dir: direction.value
    },
    title: locale.value === 'ar' 
      ? 'محادثات فورية بين المستخدمين | ChatApp' 
      : 'Instant Chat Between Users | ChatApp',
    meta: [
      {
        name: 'description',
        content: locale.value === 'ar'
          ? 'تطبيق دردشة سريع وآمن بين المستخدمين، دردش مع صديقك أو انضم إلى غرف عامة للتواصل'
          : 'Fast and secure chat app for one-on-one and public room conversations. Connect instantly with friends.'
      },
      { name: 'keywords', content: 'chat, messaging, real-time, users, public rooms, private chat' },
      { name: 'author', content: 'Your Company Name' },
      { name: 'robots', content: 'index, follow' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' }
    ],
    link: [
      {
        rel: 'canonical',
        href: locale.value === 'ar'
          ? 'https://yourdomain.com/ar'
          : 'https://yourdomain.com/en'
      }
    ]
  }))
)
</script>

<template>
  <div :dir="direction" class="min-h-screen">
    <slot />
  </div>
</template>
