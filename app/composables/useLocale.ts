// composables/useLocale.js
export const useLocale = () => {  
  const locale = useState('locale', () => {
    if (process.server) {
      const event = useRequestEvent()
      const cookie = event?.node.req.headers.cookie || ''
      const localeMatch = cookie.match(/locale=([^;]+)/)
      return localeMatch?.[1] || 'en'
    }
    return localStorage.getItem('locale') || 'en'
  })

  const setLocaleCustom = async (newLocale) => {
    locale.value = newLocale

    if (process.client) {
      localStorage.setItem('locale', newLocale)
      document.documentElement.setAttribute('lang', newLocale)
      document.cookie = `locale=${newLocale}; path=/; max-age=31536000`
    }
  }

  return { locale, setLocaleCustom }
}