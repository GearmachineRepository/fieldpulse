// ═══════════════════════════════════════════
// QR Scanner — Camera-based QR code reader
//
// Uses jsQR for universal browser support (iOS Safari,
// Android Chrome, desktop). Falls back gracefully if
// camera access is denied or unavailable.
//
// On successful scan, parses the JSON payload
// { app: "crupoint", code: "CRUPOINT-A1B2" }
// and calls onScan(code).
// ═══════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Camera, AlertCircle } from "lucide-react"
import { T } from "@/app/tokens.js"
import jsQR from "jsqr"

export default function QRScanner({ open, onClose, onScan }) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const animRef = useRef(null)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    animRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  const isSecureContext = typeof window !== "undefined" && (
    window.isSecureContext ||
    window.location.protocol === "https:" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  )

  useEffect(() => {
    if (!open) { stopCamera(); setError(null); return }

    let cancelled = false

    async function startCamera() {
      // Camera API requires HTTPS (secure context)
      if (!isSecureContext) {
        setError("Camera requires a secure connection (HTTPS). You're currently on HTTP — ask your admin to enable HTTPS, or enter the code manually.")
        return
      }

      // Check for camera API support
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Some mobile browsers need a moment after page load for mediaDevices to register
        // Try the legacy API as a last resort
        const legacyGetUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
        if (!legacyGetUserMedia) {
          setError("Camera is not supported on this browser. Please use Chrome, Safari, or Firefox — or enter the code manually.")
          return
        }
        // Wrap legacy API in a promise
        try {
          const stream = await new Promise((resolve, reject) => {
            legacyGetUserMedia.call(navigator,
              { video: { facingMode: "environment" } },
              resolve, reject
            )
          })
          if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
          streamRef.current = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            videoRef.current.setAttribute("playsinline", "true")
            await videoRef.current.play()
            scanLoop()
          }
          return
        } catch (err) {
          if (!cancelled) setError("Could not access camera. Please enter the code manually.")
          return
        }
      }

      try {
        // This call triggers the browser's camera permission prompt on mobile
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.setAttribute("playsinline", "true") // iOS requirement
          await videoRef.current.play()
          scanLoop()
        }
      } catch (err) {
        if (!cancelled) {
          if (err.name === "NotAllowedError") {
            setError("Camera access was denied. Tap \"Try Again\" to re-prompt, or go to your browser settings to allow camera access for this site.")
          } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
            setError("No camera found on this device. Please enter the code manually.")
          } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
            setError("Camera is in use by another app. Close other camera apps and try again.")
          } else if (err.name === "OverconstrainedError") {
            // Try again without facingMode constraint
            try {
              const stream = await navigator.mediaDevices.getUserMedia({ video: true })
              if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
              streamRef.current = stream
              if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.setAttribute("playsinline", "true")
                await videoRef.current.play()
                scanLoop()
              }
              return
            } catch {
              if (!cancelled) setError("Could not access camera. Please enter the code manually.")
            }
          } else {
            setError(`Could not access camera (${err.name || "unknown error"}). Please enter the code manually.`)
          }
        }
      }
    }

    function scanLoop() {
      if (cancelled || !videoRef.current || !canvasRef.current) return

      const video = videoRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d", { willReadFrequently: true })

      if (video.readyState !== video.HAVE_ENOUGH_DATA) {
        animRef.current = requestAnimationFrame(scanLoop)
        return
      }

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      })

      if (code && code.data) {
        try {
          const data = JSON.parse(code.data)
          if (data.app === "crupoint" && data.code) {
            stopCamera()
            onScan(data.code)
            return
          }
        } catch {
          // Not JSON — try raw value as a code
          if (code.data.length > 3) {
            stopCamera()
            onScan(code.data)
            return
          }
        }
      }

      animRef.current = requestAnimationFrame(scanLoop)
    }

    startCamera()
    return () => { cancelled = true; stopCamera() }
  }, [open, onScan, stopCamera, retryCount, isSecureContext])

  const handleRetry = () => {
    stopCamera()
    setError(null)
    setRetryCount(c => c + 1)
  }

  if (!open) return null

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "#000", display: "flex", flexDirection: "column",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", background: "rgba(0,0,0,0.8)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff", fontWeight: 600, fontSize: 16 }}>
          <Camera size={20} />
          Scan QR Code
        </div>
        <button
          onClick={() => { stopCamera(); onClose() }}
          style={{
            background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 3,
            padding: 8, cursor: "pointer", display: "flex",
          }}
        >
          <X size={20} color="#fff" />
        </button>
      </div>

      {/* Camera view */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        {error ? (
          <div style={{ textAlign: "center", padding: "0 32px", color: "#fff" }}>
            <AlertCircle size={40} color={T.red} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 16, lineHeight: 1.5 }}>{error}</p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
              <button
                onClick={handleRetry}
                style={{
                  padding: "14px 28px", borderRadius: 3,
                  border: "1.5px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.1)",
                  color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer",
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => { stopCamera(); onClose() }}
                style={{
                  padding: "14px 28px", borderRadius: 3, border: "none",
                  background: T.accent, color: "#fff", fontSize: 15, fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Enter Code Manually
              </button>
            </div>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              playsInline
              muted
            />
            {/* Hidden canvas for frame capture */}
            <canvas ref={canvasRef} style={{ display: "none" }} />
            {/* Scan frame overlay */}
            <div style={{
              position: "absolute", width: 240, height: 240,
              border: "3px solid rgba(255,255,255,0.8)",
              borderRadius: 3, pointerEvents: "none",
            }} />
          </>
        )}
      </div>

      {/* Footer hint */}
      {!error && (
        <div style={{
          padding: "20px", textAlign: "center", background: "rgba(0,0,0,0.8)",
          color: "rgba(255,255,255,0.7)", fontSize: 14,
        }}>
          Point your camera at the QR code provided by your admin
        </div>
      )}
    </div>
  )
}
