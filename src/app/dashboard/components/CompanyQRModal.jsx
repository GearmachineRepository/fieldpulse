// ═══════════════════════════════════════════
// Registration Code Manager Modal
//
// Full management: create codes with optional
// expiry, view active/expired/revoked, generate
// QR, copy, download, print, revoke.
// ═══════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react"
import {
  X, QrCode, Copy, Check, Loader2, Download, Printer,
  Plus, Trash2, Clock, Shield, AlertCircle, ChevronLeft,
} from "lucide-react"
import QRCodeLib from "qrcode"
import {
  getRegistrationCodes, createRegistrationCode,
  revokeRegistrationCode, getRegistrationCodeQR,
} from "@/lib/api/device.js"
import s from "./CompanyQRModal.module.css"

const EXPIRY_OPTIONS = [
  { value: "",    label: "Never expires" },
  { value: "1h",  label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d",  label: "7 days" },
  { value: "30d", label: "30 days" },
]

function isExpired(code) {
  return code.expires_at && new Date(code.expires_at) < new Date()
}

function isActive(code) {
  return !code.revoked && !isExpired(code)
}

function formatExpiry(expiresAt) {
  if (!expiresAt) return "Never"
  const d = new Date(expiresAt)
  const now = new Date()
  if (d < now) return "Expired"
  const diff = d - now
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days}d ${hours % 24}h left`
  if (hours > 0) return `${hours}h left`
  const mins = Math.floor(diff / (1000 * 60))
  return `${mins}m left`
}

export default function CompanyQRModal({ open, onClose }) {
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [newLabel, setNewLabel] = useState("")
  const [newExpiry, setNewExpiry] = useState("")

  // QR view
  const [qrView, setQrView] = useState(null) // { code, svg, company }
  const [qrLoading, setQrLoading] = useState(false)
  const canvasRef = useRef(null)
  const [copied, setCopied] = useState(false)

  const loadCodes = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getRegistrationCodes()
      setCodes(data)
    } catch (e) {
      setError(e.message || "Failed to load codes")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadCodes()
    if (!open) { setQrView(null); setShowCreate(false) }
  }, [open, loadCodes])

  // Render QR to hidden canvas when qrView changes
  useEffect(() => {
    if (!qrView?.code || !canvasRef.current) return
    const payload = JSON.stringify({ app: "crupoint", code: qrView.code })
    QRCodeLib.toCanvas(canvasRef.current, payload, {
      width: 280,
      margin: 2,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    })
  }, [qrView])

  const handleCreate = async () => {
    setCreating(true)
    try {
      await createRegistrationCode({
        label: newLabel.trim() || undefined,
        expiresIn: newExpiry || undefined,
      })
      setNewLabel("")
      setNewExpiry("")
      setShowCreate(false)
      await loadCodes()
    } catch (e) {
      setError(e.message || "Failed to create code")
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (id) => {
    try {
      await revokeRegistrationCode(id)
      await loadCodes()
      if (qrView) setQrView(null)
    } catch (e) {
      setError(e.message || "Failed to revoke code")
    }
  }

  const handleShowQR = async (codeRow) => {
    setQrLoading(true)
    try {
      const data = await getRegistrationCodeQR(codeRow.id)
      setQrView(data)
    } catch (e) {
      setError(e.message || "Failed to generate QR")
    } finally {
      setQrLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!qrView?.code) return
    try {
      await navigator.clipboard.writeText(qrView.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard not available */ }
  }

  const handleDownload = () => {
    if (!canvasRef.current) return
    const link = document.createElement("a")
    link.download = `crupoint-${qrView?.code || "device"}-qr.png`
    link.href = canvasRef.current.toDataURL()
    link.click()
  }

  const handlePrint = () => {
    if (!canvasRef.current || !qrView) return
    const dataUrl = canvasRef.current.toDataURL()
    const companyName = qrView.company || "CruPoint"
    const printWindow = window.open("", "_blank")
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head><title>Device Registration QR — ${companyName}</title></head>
        <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui,-apple-system,sans-serif">
          <div style="text-align:center">
            <h2 style="margin:0 0 8px;font-size:20px">${companyName}</h2>
            <p style="margin:0 0 20px;font-size:13px;color:#666">Scan to register your device</p>
            <img src="${dataUrl}" width="280" height="280" />
            <p style="margin:16px 0 0;font-size:14px;color:#333">Or enter code manually:</p>
            <p style="margin:6px 0 0;font-size:22px;font-weight:700;letter-spacing:2px;font-family:monospace">${qrView.code}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  if (!open) return null

  const activeCodes = codes.filter(isActive)
  const inactiveCodes = codes.filter(c => !isActive(c))

  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={s.header}>
          <div className={s.headerLeft}>
            {qrView ? (
              <button className={s.backBtn} onClick={() => setQrView(null)}>
                <ChevronLeft size={18} />
              </button>
            ) : (
              <Shield size={18} />
            )}
            <span>{qrView ? `QR — ${qrView.code}` : "Registration Codes"}</span>
          </div>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className={s.body}>
          {error && (
            <div className={s.errorBanner}>
              <AlertCircle size={14} />
              <span>{error}</span>
              <button onClick={() => setError(null)}><X size={12} /></button>
            </div>
          )}

          {/* ── QR View ── */}
          {qrView ? (
            <>
              <div
                className={s.qrContainer}
                dangerouslySetInnerHTML={{ __html: qrView.svg }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />

              <div className={s.codeSection}>
                <span className={s.codeLabel}>Manual code:</span>
                <div className={s.codeRow}>
                  <code className={s.codeValue}>{qrView.code}</code>
                  <button className={s.copyBtn} onClick={handleCopy}>
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
              </div>

              <div className={s.actions}>
                <button className={s.actionBtn} onClick={handleDownload}>
                  <Download size={14} /> Download PNG
                </button>
                <button className={s.actionBtn} onClick={handlePrint}>
                  <Printer size={14} /> Print
                </button>
              </div>

              <p className={s.hint}>
                Print and post this QR code for crews to scan with their phones. Revoke it anytime from this panel.
              </p>
            </>
          ) : (
            <>
              {/* ── Code List ── */}
              {loading ? (
                <div className={s.loadingState}>
                  <Loader2 size={20} className={s.spinner} />
                  <span>Loading codes...</span>
                </div>
              ) : (
                <>
                  {/* Create new */}
                  {showCreate ? (
                    <div className={s.createForm}>
                      <div className={s.createField}>
                        <label className={s.fieldLabel}>Label (optional)</label>
                        <input
                          className={s.fieldInput}
                          type="text"
                          value={newLabel}
                          onChange={e => setNewLabel(e.target.value)}
                          placeholder='e.g. "Truck QR", "Office poster"'
                        />
                      </div>
                      <div className={s.createField}>
                        <label className={s.fieldLabel}>Expires</label>
                        <select
                          className={s.fieldInput}
                          value={newExpiry}
                          onChange={e => setNewExpiry(e.target.value)}
                        >
                          {EXPIRY_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className={s.createActions}>
                        <button className={s.cancelBtn} onClick={() => setShowCreate(false)}>Cancel</button>
                        <button className={s.primaryBtn} onClick={handleCreate} disabled={creating}>
                          {creating ? "Creating..." : "Generate Code"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button className={s.createBtn} onClick={() => setShowCreate(true)}>
                      <Plus size={16} /> Generate New Code
                    </button>
                  )}

                  {/* Active codes */}
                  {activeCodes.length === 0 && !showCreate && (
                    <div className={s.emptyState}>
                      <QrCode size={28} strokeWidth={1.5} />
                      <p>No active registration codes</p>
                      <span>Generate a code to let crews register their devices.</span>
                    </div>
                  )}

                  {activeCodes.length > 0 && (
                    <div className={s.codeList}>
                      <div className={s.listLabel}>Active</div>
                      {activeCodes.map(c => (
                        <div key={c.id} className={s.codeItem}>
                          <div className={s.codeItemLeft}>
                            <code className={s.codeItemCode}>{c.code}</code>
                            {c.label && <span className={s.codeItemLabel}>{c.label}</span>}
                            <span className={s.codeItemExpiry}>
                              <Clock size={11} /> {formatExpiry(c.expires_at)}
                            </span>
                          </div>
                          <div className={s.codeItemActions}>
                            <button
                              className={s.qrBtn}
                              onClick={() => handleShowQR(c)}
                              disabled={qrLoading}
                              title="Show QR"
                            >
                              <QrCode size={15} />
                            </button>
                            <button
                              className={s.revokeBtn}
                              onClick={() => handleRevoke(c.id)}
                              title="Revoke"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Inactive codes */}
                  {inactiveCodes.length > 0 && (
                    <div className={s.codeList}>
                      <div className={s.listLabel}>Revoked / Expired</div>
                      {inactiveCodes.map(c => (
                        <div key={c.id} className={`${s.codeItem} ${s.codeItemInactive}`}>
                          <div className={s.codeItemLeft}>
                            <code className={s.codeItemCode}>{c.code}</code>
                            {c.label && <span className={s.codeItemLabel}>{c.label}</span>}
                            <span className={s.codeItemExpiry}>
                              {c.revoked ? "Revoked" : "Expired"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
