// ═══════════════════════════════════════════
// Company QR Code Modal
//
// Shows the company QR code that field crews
// can scan to register their device. Fetches
// the QR SVG from the backend on open.
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import { X, QrCode, Copy, Check, Loader2 } from "lucide-react"
import s from "./CompanyQRModal.module.css"
import { request } from "@/lib/api/core.js"

export default function CompanyQRModal({ open, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setError(null)
    request("/device/qr-code")
      .then(setData)
      .catch(e => setError(e.message || "Failed to load QR code"))
      .finally(() => setLoading(false))
  }, [open])

  const handleCopy = async () => {
    if (!data?.code) return
    try {
      await navigator.clipboard.writeText(data.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard not available */
    }
  }

  if (!open) return null

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            <QrCode size={20} />
            <span>Device Registration</span>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className={s.body}>
          {loading && (
            <div className={s.loadingState}>
              <Loader2 size={24} className={s.spinner} />
              <span>Generating QR code...</span>
            </div>
          )}

          {error && (
            <div className={s.errorState}>
              <p>{error}</p>
            </div>
          )}

          {data && !loading && (
            <>
              <p className={s.instructions}>
                Have your crew scan this QR code with their device camera to
                register for field access.
              </p>

              {/* QR Code */}
              <div
                className={s.qrContainer}
                dangerouslySetInnerHTML={{ __html: data.svg }}
              />

              {/* Company code fallback */}
              <div className={s.codeSection}>
                <span className={s.codeLabel}>Or enter manually:</span>
                <div className={s.codeRow}>
                  <code className={s.codeValue}>{data.code}</code>
                  <button className={s.copyBtn} onClick={handleCopy}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <p className={s.hint}>
                This code is unique to your company. Share it only with
                authorized crew members.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
