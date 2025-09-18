export default defineEventHandler((event) => {
  return {
    message: 'Socket.io server debug',
    timestamp: new Date().toISOString(),
    server: 'https://nuxt-chat-app-q1mh.onrender.com',
    endpoint: '/socket.io/',
    test: 'Visit https://nuxt-chat-app-q1mh.onrender.com/socket.io/socket.io.js to test Socket.io'
  }
})
