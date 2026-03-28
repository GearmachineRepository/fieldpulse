// ═══════════════════════════════════════════
// useWeather — Geolocation + weather API
// Falls back to simulated data when unavailable.
// ═══════════════════════════════════════════

import { useState, useCallback } from 'react'
import { getSimulatedWeather, getWeatherByCoords } from '@/lib/weather.js'

export default function useWeather() {
  const [weather, setWeather] = useState(getSimulatedWeather())
  const [loading, setLoading] = useState(false)

  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) {
      setWeather(getSimulatedWeather())
      return
    }

    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const w = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude)
          setWeather(w)
        } catch {
          setWeather(getSimulatedWeather())
        } finally {
          setLoading(false)
        }
      },
      () => {
        setWeather(getSimulatedWeather())
        setLoading(false)
      },
      { timeout: 8000 },
    )
  }, [])

  return { weather, loading, fetch: fetchWeather }
}
