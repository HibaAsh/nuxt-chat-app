export default defineEventHandler(() => {
  return { 
    status: 'ok', 
    message: 'Server is running', 
    timestamp: new Date().toISOString() 
  }
})
