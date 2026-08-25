require('dotenv').config()
const express = require('express')
const cors = require('cors')
const http = require('http')
const { Server } = require('socket.io')
const jwt = require('jsonwebtoken')
const dataRoutes = require('./routes/data')

const app = express()
const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

const PORT = process.env.PORT || 5000
const JWT_SECRET = process.env.JWT_SECRET || 'iot-secret-key'

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use((req, _res, next) => { req.io = io; next() })

const users = {}

app.post('/auth/signup', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
  if (users[username]) return res.status(409).json({ error: 'Username already exists' })
  users[username] = password
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' })
  res.status(201).json({ token, username })
})

app.post('/auth/login', (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
  if (!users[username]) return res.status(401).json({ error: 'User not found - please sign up first' })
  if (users[username] !== password) return res.status(401).json({ error: 'Incorrect password' })
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' })
  res.json({ token, username })
})

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/data', dataRoutes)

io.on('connection', socket => {
  console.log('Client connected:', socket.id)
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id))
})

// ── Built-in IoT simulator — generates live readings every 2 seconds ──────────
const DEVICES = [
  { id: 'sensor-001', location: 'Warehouse A',   type: 'industrial' },
  { id: 'sensor-002', location: 'Warehouse B',   type: 'industrial' },
  { id: 'sensor-003', location: 'Office Floor 1', type: 'office' },
  { id: 'sensor-004', location: 'Server Room',   type: 'critical' },
  { id: 'sensor-005', location: 'Rooftop',       type: 'outdoor' },
]
const BASELINES = {
  industrial: { temp: 45, humidity: 60 },
  office:     { temp: 22, humidity: 45 },
  critical:   { temp: 18, humidity: 35 },
  outdoor:    { temp: 28, humidity: 70 },
}

function randomReading() {
  const device = DEVICES[Math.floor(Math.random() * DEVICES.length)]
  const base = BASELINES[device.type]
  const temperature = Math.round((base.temp + (Math.random() - 0.5) * 20) * 100) / 100
  const humidity    = Math.round((base.humidity + (Math.random() - 0.5) * 20) * 100) / 100
  const pressure    = Math.round((1010 + (Math.random() - 0.5) * 10) * 100) / 100
  const battery_pct = Math.round((20 + Math.random() * 80) * 10) / 10

  let alert = 'OK'
  if (temperature > 70) alert = 'CRITICAL_TEMP_HIGH'
  else if (temperature < 0) alert = 'CRITICAL_TEMP_LOW'
  else if (humidity > 85) alert = 'WARNING_HUMIDITY'
  else if (battery_pct < 25) alert = 'WARNING_BATTERY'

  return {
    device_id:   device.id,
    location:    device.location,
    type:        device.type,
    temperature,
    humidity,
    pressure,
    battery_pct,
    alert,
    timestamp:   Math.floor(Date.now() / 1000),
    iso_time:    new Date().toISOString(),
    received:    Date.now(),
  }
}

// Inject a new reading into the data store every 2 seconds
const dataModule = require('./routes/data')
setInterval(() => {
  const reading = randomReading()
  // POST to own API internally
  const http2 = require('http')
  const body = JSON.stringify(reading)
  const req2 = http2.request({
    hostname: 'localhost', port: PORT, path: '/data',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
  })
  req2.write(body)
  req2.end()
  io.emit('reading', reading)
  if (reading.alert !== 'OK') io.emit('alert', reading)
  console.log('Simulated: ' + reading.device_id + ' | ' + reading.temperature + 'C | ' + reading.alert)
}, 2000)

server.listen(PORT, () => {
  console.log('IoT API running on http://localhost:' + PORT)
  console.log('Built-in simulator active - generating readings every 2s')
})
