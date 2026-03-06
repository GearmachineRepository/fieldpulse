// ═══════════════════════════════════════════
// useWeather — GPS-aware weather fetching
// ═══════════════════════════════════════════

import { useState, useCallback } from 'react'
import { getSimulatedWeather, getWeatherByCoords } from '../lib/weather.js'

/**
 * Provides current weather state and a refresh callback.
 * Automatically falls back to simulated weather if GPS or
 * the weather API is unavailable.
 *
 * @returns {{ weather: object, fetchWeather: () => void }}
 */
export function useWeather() {
  const [weather, setWeather] = useState(() => getSimulatedWeather())

  const fetchWeather = useCallback(() => {
    if (!navigator.geolocation) {
      setWeather(getSimulatedWeather())
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const w = await getWeatherByCoords(pos.coords.latitude, pos.coords.longitude)
          setWeather(w)
        } catch {
          setWeather(getSimulatedWeather())
        }
      },
      () => setWeather(getSimulatedWeather()),
      { timeout: 8000 }
    )
  }, [])

  return { weather, fetchWeather, setWeather }
}
