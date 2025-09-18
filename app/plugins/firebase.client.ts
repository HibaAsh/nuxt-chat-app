import { defineNuxtPlugin } from '#app'
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, signOut } from 'firebase/auth'

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig()

  const firebaseConfig = {
    apiKey: config.public.firebaseApiKey,
    authDomain: config.public.firebaseAuthDomain,
    projectId: config.public.firebaseProjectId,
    storageBucket: config.public.firebaseStorageBucket,
    messagingSenderId: config.public.firebaseMessagingSenderId,
    appId: config.public.firebaseAppId,
    measurementId: config.public.firebaseMeasurementId
  }

  const app = initializeApp(firebaseConfig)
  const auth = getAuth(app)
  const provider = new GoogleAuthProvider()

  nuxtApp.provide('auth', auth)
  nuxtApp.provide('provider', provider)
  nuxtApp.provide('signIn', () => signInWithPopup(auth, provider))
  nuxtApp.provide('signOut', () => signOut(auth))
})
