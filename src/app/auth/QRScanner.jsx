// ═══════════════════════════════════════════
// QR Scanner — Camera-based QR code reader
//
// Uses the native BarcodeDetector API (Chrome 83+,
// Safari 17+, Capacitor WebView). Falls back to
// an unsupported message on older browsers.
//
// On successful scan, parses the JSON payload
// { app: "crupoint", code: "CRUPOINT-A1B2" }
// and calls onScan(code).
// ═══════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react"
import { X, Camera, AlertCircle } from "lucide-react"
import { T } from "@/app/tokens.js"

export default function QRScanner({ open, onClose, onScan }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const animRef = useRef(null)
  const [error, setError] = useState(null)

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!open) { stopCamera(); return }

    // Check BarcodeDetector support
    if (!("BarcodeDetector" in window)) {
      setError("QR scanning is not supported on this browser. Please enter the code manually.")
      return
    }

    let cancelled = false
    const detector = new BarcodeDetector({ formats: ["qr_code"] })

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          scanLoop(detector)
        }
      } catch (err) {
        if (!cancelled) {
          if (err.name === "NotAllowedError") {
            setError("Camera access denied. Please allow camera permissions and try again.")
          } else {
            setError("Could not access camera. Please enter the code manually.")
          }
        }
      }
    }

    function scanLoop(det) {
      if (!videoRef.current || cancelled) return
      det.detect(videoRef.current)
        .then(barcodes => {
          if (cancelled) return
          for (const barcode of barcodes) {
            try {
              const data = JSON.parse(barcode.rawValue)
              if (data.app === "crupoint" && data.code) {
                stopCamera()
                onScan(data.code)
                return
              }
            } catch {
              // Not our QR format — try rawValue directly as a code
              if (barcode.rawValue && barcode.rawValue.length > 3) {
                stopCamera()
                onScan(barcode.rawValue)
                return
              }
            }
          }
          animRef.current = requestAnimationFrame(() => scanLoop(det))
        })
        .catch(() => {
          animRef.current = requestAnimationFrame(() => scanLoop(det))
        })
    }

    startCamera()
    return () => { cancelled = true; stopCamera() }
  }, [open, onScan, stopCamera])

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
          <div style={{
            textAlign: "center", padding: "0 32px", color: "#fff",
          }}>
            <AlertCircle size={40} color={T.red} style={{ marginBottom: 16 }} />
            <p style={{ fontSize: 16, lineHeight: 1.5 }}>{error}</p>
            <button
              onClick={() => { stopCamera(); onClose() }}
              style={{
                marginTop: 20, padding: "14px 28px", borderRadius: 3, border: "none",
                background: T.accent, color: "#fff", fontSize: 15, fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Enter Code Manually
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              playsInline
              muted
            />
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
