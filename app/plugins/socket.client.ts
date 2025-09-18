import { io } from 'socket.io-client'
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  const runtimeConfig = useRuntimeConfig()
  
  // Use environment variable or fallback to Render URL
  const socketUrl = runtimeConfig.public.socketUrl || 'https://nuxt-chat-app-q1mh.onrender.com'
  
  const socket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    autoConnect: true
  })

  // Connection events for debugging
  socket.on('connect', () => {
    console.log('✅ Connected to Socket.io server:', socketUrl)
  })

  socket.on('disconnect', (reason) => {
    console.log('❌ Disconnected from Socket.io server:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket.io connection error:', error)
  })

  // Expose helper to logout explicitly
  const logout = (uid: string) => {
    socket.emit('logout', { uid })
  }

  // Also provide the socket URL for debugging
  const getSocketUrl = () => socketUrl

  nuxtApp.provide('socket', socket)
  nuxtApp.provide('socketLogout', logout)
  nuxtApp.provide('socketUrl', getSocketUrl)
})
