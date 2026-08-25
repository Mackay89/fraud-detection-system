/**
 * /routes/data.js
 * In-memory store for demo; swap with MongoDB/DynamoDB in production.
 */

const express = require("express");
const router  = express.Router();

const MAX_READINGS = 500;

// ── In-memory store ────────────────────────────────────────────────────────────

let readings = [];        // raw sensor readings
let alerts   = [];        // anomaly records

// Seed some demo data on startup
function seedDemoData() {
  const devices   = ["sensor-001", "sensor-002", "sensor-003", "sensor-004", "sensor-005"];
  const locations = ["Warehouse A", "Warehouse B", "Office Floor 1", "Server Room", "Rooftop"];
  const now       = Math.floor(Date.now() / 1000);

  for (let i = 60; i >= 0; i--) {
    const idx = Math.floor(Math.random() * devices.length);
    readings.push({
      device_id:   devices[idx],
      location:    locations[idx],
      temperature: +(20 + Math.random() * 60).toFixed(2),
      humidity:    +(30 + Math.random() * 60).toFixed(2),
      pressure:    +(1000 + Math.random() * 20).toFixed(2),
      battery_pct: +(20 + Math.random() * 80).toFixed(1),
      alert:       "OK",
      timestamp:   now - i * 2,
    });
  }
}

seedDemoData();

// ── Helpers ────────────────────────────────────────────────────────────────────

function classifyAlert(reading) {
  if (reading.temperature > 70) return "CRITICAL_TEMP_HIGH";
  if (reading.temperature < 0)  return "CRITICAL_TEMP_LOW";
  if (reading.humidity > 85)    return "WARNING_HUMIDITY";
  if (reading.battery_pct < 25) return "WARNING_BATTERY";
  return "OK";
}

function addReading(data, io) {
  const reading = {
    ...data,
    alert:     classifyAlert(data),
    received:  Date.now(),
  };

  readings.unshift(reading);
  if (readings.length > MAX_READINGS) readings.pop();

  if (reading.alert !== "OK") {
    alerts.unshift(reading);
    if (alerts.length > 100) alerts.pop();
    io?.emit("alert", reading);
  }

  io?.emit("reading", reading);
  return reading;
}

// ── Routes ─────────────────────────────────────────────────────────────────────

// GET /data  →  latest N readings
router.get("/", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, MAX_READINGS);
  res.json(readings.slice(0, limit));
});

// POST /data  →  ingest a new reading (called by Spark / producer)
router.post("/", (req, res) => {
  const reading = addReading(req.body, req.io);
  res.status(201).json(reading);
});

// GET /data/alerts  →  anomalies only
router.get("/alerts", (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  res.json(alerts.slice(0, limit));
});

// GET /data/stats  →  aggregated stats per device
router.get("/stats", (req, res) => {
  const byDevice = {};

  for (const r of readings) {
    if (!byDevice[r.device_id]) {
      byDevice[r.device_id] = {
        device_id:  r.device_id,
        location:   r.location,
        count:      0,
        sum_temp:   0,
        max_temp:   -Infinity,
        min_temp:    Infinity,
        sum_humid:  0,
        alert_count: 0,
      };
    }
    const s = byDevice[r.device_id];
    s.count++;
    s.sum_temp  += r.temperature;
    s.max_temp   = Math.max(s.max_temp, r.temperature);
    s.min_temp   = Math.min(s.min_temp, r.temperature);
    s.sum_humid += r.humidity;
    if (r.alert !== "OK") s.alert_count++;
  }

  const stats = Object.values(byDevice).map((s) => ({
    device_id:   s.device_id,
    location:    s.location,
    reading_count: s.count,
    avg_temp:    +(s.sum_temp  / s.count).toFixed(2),
    max_temp:    +s.max_temp.toFixed(2),
    min_temp:    +s.min_temp.toFixed(2),
    avg_humidity: +(s.sum_humid / s.count).toFixed(2),
    alert_count:  s.alert_count,
  }));

  res.json(stats);
});

// GET /data/timeseries?device=sensor-001  →  last N readings for charting
router.get("/timeseries", (req, res) => {
  const { device, limit = 30 } = req.query;
  let data = readings;
  if (device) data = data.filter((r) => r.device_id === device);
  res.json(data.slice(0, parseInt(limit)).reverse());
});

module.exports = router;
