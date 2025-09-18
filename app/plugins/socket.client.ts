import { io } from 'socket.io-client'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const socket = io() // Connect to same origin

  // Expose helper to logout explicitly
  const logout = (uid: string) => {
    socket.emit('logout', { uid })
  }

  nuxtApp.provide('socket', socket)
  nuxtApp.provide('socketLogout', logout)
})
