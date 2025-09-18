// https://nuxt.com/docs/api/configuration/nuxt-config

import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId:
        process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.NUXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    },
  },

  css: ["~/assets/css/tailwind.css"],

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt", "@nuxt/icon", "@nuxt/image", "@nuxtjs/i18n"],

  nitro: {
    preset: 'node-server',
    experimental: {
      websocket: true,
    },
  },

  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  
  i18n: {
    locales: [
      { code: 'en', name: 'English', dir: 'ltr', file: 'en.json' },
      { code: 'ar', name: 'Arabic', dir: 'rtl', file: 'ar.json' }
    ],
    defaultLocale: 'en',
    strategy: "prefix",
    detectBrowserLanguage: false,
  },

  alias: {
    '@i18n': fileURLToPath(new URL('./i18n', import.meta.url)),
  },

  
  vite: {
    resolve: {
      alias: {
        '@i18n': fileURLToPath(new URL('./i18n', import.meta.url))
      }
    },
  },
});
