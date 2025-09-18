export default defineEventHandler(() => {
  return { 
    status: 'ok', 
    message: 'Server is running', 
    timestamp: new Date().toISOString(),
    url: 'https://nuxt-chat-app-q1mh.onrender.com',
    socket: 'Available at /socket.io/'
  }
})
