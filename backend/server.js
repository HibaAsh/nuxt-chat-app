const express = require('express')
const http = require('http')
const { Server } = require('socket.io')

const app = express()
const server = http.createServer(app)

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)

const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : '*',
    methods: ['GET', 'POST']
  }
})

const usersByUid = new Map()

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('register', (userData) => {
    if (!userData || !userData.uid) return
    const { uid, displayName, photoURL } = userData

    if (!usersByUid.has(uid)) {
      usersByUid.set(uid, { displayName, photoURL, sockets: new Set() })
    }
    usersByUid.get(uid).sockets.add(socket.id)

    broadcastUsers()
    console.log('Registered', uid, 'sockets:', usersByUid.get(uid).sockets.size)
  })

  socket.on('logout', ({ uid }) => {
    if (!uid) return
    const data = usersByUid.get(uid)
    if (data) {
      data.sockets.delete(socket.id)
      if (data.sockets.size === 0) usersByUid.delete(uid)
      broadcastUsers()
      console.log('Logout socket removed for', uid)
    }
  })

  socket.on('private-message', (msg) => {
    try {
      const { toUid } = msg || {}
      const recipient = usersByUid.get(toUid)
      if (recipient) {
        recipient.sockets.forEach(sid => io.to(sid).emit('private-message', msg))
      }
      socket.emit('message-ack', msg)
    } catch (e) {
      console.error('private-message error', e)
    }
  })

  socket.on('group-message', (msg) => {
    try {
      socket.broadcast.emit('group-message', msg)
      socket.emit('message-ack', msg)
    } catch (e) {
      console.error('group-message error', e)
    }
  })

  socket.on('disconnect', () => {
    for (const [uid, data] of usersByUid.entries()) {
      if (data.sockets.has(socket.id)) {
        data.sockets.delete(socket.id)
        if (data.sockets.size === 0) {
          usersByUid.delete(uid)
          console.log('User fully disconnected:', uid)
        } else {
          console.log('Socket removed but user still connected on other sessions:', uid)
        }
      }
    }
    broadcastUsers()
    console.log('Socket disconnected:', socket.id)
  })

  function broadcastUsers() {
    const payload = Array.from(usersByUid.entries()).map(([uid, d]) => ({
      uid,
      displayName: d.displayName,
      photoURL: d.photoURL
    }))
    io.emit('users', payload)
  }
})

app.get('/', (req, res) => res.send('Socket server ok'))

const port = Number(process.env.PORT || 3001)
server.listen(port, () => {
  console.log(`Socket server listening on port ${port}`)
})
