import { Server } from 'socket.io'

export default defineNitroPlugin((nitroApp) => {
  // Get the HTTP server from Nitro
  const httpServer = nitroApp.h3App.nodeServer
  
  // Create Socket.io server
  const io = new Server(httpServer, {
    cors: {
      origin: [
        "https://nuxt-chat-app-q1mh.onrender.com",
        "https://your-vercel-app.vercel.app", // Replace with your Vercel URL later
        "http://localhost:3000"
      ],
      methods: ["GET", "POST"],
      credentials: true
    }
  })

  // Track users by UID with multiple sockets
  const usersByUid = new Map<
    string,
    { displayName: string; photoURL?: string; sockets: Set<string> }
  >()

  io.on('connection', (socket) => {
    console.log('✅ Connected:', socket.id)

    // Register a user socket
    socket.on('register', (userData: any) => {
      const { uid, displayName, photoURL } = userData

      if (!usersByUid.has(uid)) {
        usersByUid.set(uid, { displayName, photoURL, sockets: new Set() })
      }

      usersByUid.get(uid)!.sockets.add(socket.id)
      broadcastUsers()
      console.log('👤 User registered:', displayName)
    })

    // Logout from one socket explicitly
    socket.on('logout', ({ uid }: { uid: string }) => {
      const userData = usersByUid.get(uid)
      if (userData) {
        userData.sockets.delete(socket.id)
        if (userData.sockets.size === 0) {
          usersByUid.delete(uid)
        }
        broadcastUsers()
        console.log('User logged out:', uid)
      }
    })

    // Handle private message
    socket.on('private-message', (msg: any) => {
      const recipient = usersByUid.get(msg.toUid)
      if (recipient) {
        recipient.sockets.forEach(sid => io.to(sid).emit('private-message', msg))
      }
      socket.emit('message-ack', msg)
    })

    // Handle group message
    socket.on('group-message', (msg: any) => {
      socket.broadcast.emit('group-message', msg)
      socket.emit('message-ack', msg)
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id)
      for (const [uid, data] of usersByUid.entries()) {
        data.sockets.delete(socket.id)
        if (data.sockets.size === 0) {
          usersByUid.delete(uid)
        }
      }
      broadcastUsers()
    })

    // Helper: broadcast current online users
    function broadcastUsers() {
      io.emit(
        'users',
        Array.from(usersByUid.entries()).map(([uid, data]) => ({
          uid,
          displayName: data.displayName,
          photoURL: data.photoURL
        }))
      )
    }
  })

  console.log('✅ Socket.io server initialized for: https://nuxt-chat-app-q1mh.onrender.com')
})
