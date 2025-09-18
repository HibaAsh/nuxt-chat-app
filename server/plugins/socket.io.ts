import type { NitroApp } from 'nitropack'
import { Server as IOServer } from 'socket.io'
import { Server as Engine } from 'engine.io'
import { defineEventHandler } from 'h3'

export default defineNitroPlugin((nitroApp: NitroApp) => {
  const engine = new Engine()
  const io = new IOServer()

  io.bind(engine)

  // Track users by UID with multiple sockets
  const usersByUid = new Map<
    string,
    { displayName: string; photoURL?: string; sockets: Set<string> }
  >()

  io.on('connection', (socket) => {
    console.log('Connected:', socket.id)

    // Register a user socket
    socket.on('register', (userData: any) => {
      const { uid, displayName, photoURL } = userData

      if (!usersByUid.has(uid)) {
        usersByUid.set(uid, { displayName, photoURL, sockets: new Set() })
      }

      usersByUid.get(uid)!.sockets.add(socket.id)

      broadcastUsers()
      console.log('User registered:', displayName)
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
      // Ack back to sender
      socket.emit('message-ack', msg)
    })

    // Handle group message
    socket.on('group-message', (msg: any) => {
      socket.broadcast.emit('group-message', msg)
      socket.emit('message-ack', msg)
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Disconnected:', socket.id)
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

  nitroApp.router.use(
    '/socket.io/',
    defineEventHandler({
      handler(event) {
        engine.handleRequest(event.node.req, event.node.res)
        event._handled = true
      },
      websocket: {
        open(peer) {
          // @ts-expect-error internal
          engine.prepare(peer._internal.nodeReq)
          // @ts-expect-error internal
          engine.onWebSocket(peer._internal.nodeReq, peer._internal.nodeReq.socket, peer.websocket)
        }
      }
    })
  )
})
