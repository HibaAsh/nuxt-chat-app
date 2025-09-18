export default defineEventHandler((event) => {
  return {
    message: 'Socket.io debug endpoint',
    timestamp: new Date().toISOString(),
    url: event.node.req.url,
    method: event.method
  }
})
