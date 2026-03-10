// ═══════════════════════════════════════════
// useWeather — Data Hook
// Wraps geolocation + weather API.
// Falls back to simulated weather if
// geolocation is unavailable or denied.
// ═══════════════════════════════════════════

import { useState, useCallback } from 'react'
import { getSimulatedWeather, getWeatherByCoords } from '@/lib/weather.js'

export default function useWeather() {
  const [weather, setWeather] = useState(getSimulatedWeather())
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(() => {
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

  return { weather, loading, fetch }
}
