// composables/useDirection.ts

export const useDirection = () => {
  const { locale } = useI18n()
  // const vuetify = useVuetify()

  const setDirection = (lang: string) => {
    const isRTL = lang === 'ar'
    
    // Set HTML attributes
    if (process.client) {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr'
      document.documentElement.lang = lang
    }
    
    // // Set Vuetify direction
    // vuetify.rtl.value = isRTL
    
    // // Set Vuetify locale
    // vuetify.locale.current.value = lang
  }

  // Watch for locale changes
  watch(locale, (newLocale) => {
    setDirection(newLocale)
  }, { immediate: true })

  return { setDirection }
}