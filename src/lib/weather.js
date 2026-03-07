// ═══════════════════════════════════════════
// Weather Helper
// Uses OpenWeatherMap if API key is set,
// falls back to simulated data for testing
// ═══════════════════════════════════════════

import { WIND_DIRS } from '@/config/index.js'

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY

// Simulated weather for testing without API key
export function getSimulatedWeather() {
  return {
    temp: Math.round(68 + Math.random() * 15),
    humidity: Math.round(35 + Math.random() * 35),
    windSpeed: Math.round(2 + Math.random() * 12),
    windDir: WIND_DIRS[Math.floor(Math.random() * 16)],
    conditions: ['Clear', 'Partly Cloudy', 'Overcast', 'Hazy'][Math.floor(Math.random() * 4)],
    simulated: true,
  }
}

// Real weather from OpenWeatherMap
export async function getWeatherByCoords(lat, lon) {
  if (!API_KEY) {
    console.log('No weather API key — using simulated weather')
    return getSimulatedWeather()
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
    )
    if (!res.ok) throw new Error(`Weather API: ${res.status}`)

    const data = await res.json()

    // Convert wind degrees to compass direction
    const deg = data.wind?.deg || 0
    const dirIndex = Math.round(deg / 22.5) % 16
    const windDir = WIND_DIRS[dirIndex]

    // Map weather condition codes to simple descriptions
    const conditionId = data.weather?.[0]?.id || 800
    let conditions = 'Clear'
    if (conditionId >= 200 && conditionId < 600) conditions = 'Rainy'
    else if (conditionId >= 600 && conditionId < 700) conditions = 'Snowy'
    else if (conditionId >= 700 && conditionId < 800) conditions = 'Hazy'
    else if (conditionId === 801 || conditionId === 802) conditions = 'Partly Cloudy'
    else if (conditionId === 803 || conditionId === 804) conditions = 'Overcast'

    return {
      temp: Math.round(data.main?.temp || 70),
      humidity: Math.round(data.main?.humidity || 50),
      windSpeed: Math.round(data.wind?.speed || 0),
      windDir,
      conditions,
      simulated: false,
    }
  } catch (err) {
    console.error('Weather fetch failed, using simulated:', err.message)
    return getSimulatedWeather()
  }
}

// Check chemical restrictions against current weather
export function checkRestrictions(chemical, wx) {
  const r = chemical.wxRestrictions
  if (!r) return []

  const results = []
  const checks = [
    { key: 'temp', wxVal: wx.temp, rule: r.temp },
    { key: 'humidity', wxVal: wx.humidity, rule: r.humidity },
    { key: 'windSpeed', wxVal: wx.windSpeed, rule: r.windSpeed },
    { key: 'conditions', wxVal: wx.conditions, rule: r.conditions },
  ]

  for (const c of checks) {
    if (!c.rule) continue
    let triggered = false
    if (c.rule.op === '>' && c.wxVal > c.rule.value) triggered = true
    if (c.rule.op === '<' && c.wxVal < c.rule.value) triggered = true
    if (c.rule.op === '==' && c.wxVal === c.rule.value) triggered = true
    if (triggered) results.push({ field: c.key, ...c.rule })
  }

  return results
}
