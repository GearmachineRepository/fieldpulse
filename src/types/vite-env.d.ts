/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_TAGLINE: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_WEATHER_API_KEY: string
  readonly VITE_NO_SSL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
