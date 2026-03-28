// ═══════════════════════════════════════════
// Company Code Screen — Device registration via
// manual code entry or QR scan.
// ═══════════════════════════════════════════

import { useState } from "react"
import { Leaf, ArrowRight, QrCode, Loader2, Building2, AlertCircle } from "lucide-react"
import { T } from "@/app/tokens.js"
import { verifyCompanyCode, setDeviceRegistration } from "@/lib/api/device.js"
import QRScanner from "./QRScanner.jsx"

export default function CompanyCodeScreen({ onRegistered }) {
  const [code, setCode]         = useState("")
  const [error, setError]       = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [scannerOpen, setScannerOpen] = useState(false)

  const handleSubmit = async (overrideCode) => {
    const submitCode = (overrideCode || code).trim()
    if (!submitCode) return
    setError(null)
    setSubmitting(true)
    try {
      const result = await verifyCompanyCode(submitCode)
      setDeviceRegistration(result.company)
      onRegistered(result.company)
    } catch (err) {
      setError(err.message || "Invalid company code")
    } finally {
      setSubmitting(false)
    }
  }

  const handleQRScan = (scannedCode) => {
    setScannerOpen(false)
    setCode(scannedCode)
    handleSubmit(scannedCode)
  }

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.font }}>
      <div style={{ background: T.sidebar, padding: "40px 20px 36px", textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 3, background: T.accent, margin: "0 auto 14px",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Leaf size={30} color={T.card} />
        </div>
        <div style={{ fontSize: 24, fontWeight: 600, color: T.card }}>CruPoint</div>
        <div style={{ fontSize: 14, color: "#64748B", marginTop: 6 }}>Field App</div>
      </div>

      <div style={{ padding: "32px 20px", maxWidth: 430, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 3, background: T.blueLight, margin: "0 auto 14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Building2 size={24} color={T.blue} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            Connect to your company
          </div>
          <div style={{ fontSize: 14, color: T.textLight, lineHeight: 1.5 }}>
            Enter the company code provided by your admin to set up this device.
          </div>
        </div>

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px",
            background: T.redLight, borderRadius: 3, marginBottom: 16,
            border: "1px solid #FECACA",
          }}>
            <AlertCircle size={18} color={T.red} style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: T.red }}>{error}</div>
          </div>
        )}

        {/* Use a real form so mobile keyboards get a native Submit button */}
        <form onSubmit={e => { e.preventDefault(); handleSubmit() }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: "block", fontSize: 13, fontWeight: 600, color: T.textMed, marginBottom: 8,
            }}>
              Company Code
            </label>
            <input
              type="text"
              inputMode="text"
              value={code}
              onChange={e => { setCode(e.target.value.toUpperCase()); setError(null) }}
              placeholder="e.g. CRUPOINT-A1B2"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              enterKeyHint="go"
              style={{
                width: "100%", padding: "16px 18px", borderRadius: 3,
                background: T.card, border: `1.5px solid ${error ? T.red : T.border}`,
                color: T.text, fontSize: 18, fontWeight: 600, fontFamily: T.font,
                letterSpacing: 1, textAlign: "center", outline: "none",
                boxSizing: "border-box",
                WebkitAppearance: "none", appearance: "none",
                transition: "border-color 0.15s",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !code.trim()}
            style={{
              width: "100%", padding: "16px", borderRadius: 3, border: "none", cursor: "pointer",
              background: T.accent, color: T.card, fontSize: 16, fontWeight: 600, fontFamily: T.font,
              opacity: (submitting || !code.trim()) ? 0.5 : 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(47,111,237,0.2)",
              WebkitAppearance: "none", appearance: "none",
              transition: "opacity 0.15s",
            }}
          >
            {submitting ? (
              <>
                <Loader2 size={18} style={{ animation: "spin 1s linear infinite" }} />
                Verifying...
              </>
            ) : (
              <>
                Connect Device <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{
          display: "flex", alignItems: "center", gap: 14, margin: "24px 0",
        }}>
          <div style={{ flex: 1, height: 1, background: T.border }} />
          <span style={{ fontSize: 12, color: T.textLight, fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: T.border }} />
        </div>

        <QRScanner open={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleQRScan} />
        <button
          onClick={() => setScannerOpen(true)}
          style={{
            width: "100%", padding: "16px", borderRadius: 3, cursor: "pointer",
            background: T.card, border: `1.5px solid ${T.border}`,
            color: T.text, fontSize: 15, fontWeight: 600, fontFamily: T.font,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <QrCode size={20} color={T.textMed} />
          Scan QR Code
        </button>
        <div style={{ textAlign: "center", marginTop: 8, fontSize: 12, color: T.textLight }}>
          Ask your admin for a QR code
        </div>

        <div style={{
          marginTop: 32, padding: "16px 18px", background: T.card, borderRadius: 3,
          border: `1px solid ${T.border}`,
        }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 6 }}>
            Don't have a code?
          </div>
          <div style={{ fontSize: 13, color: T.textLight, lineHeight: 1.5 }}>
            Contact your company admin. They can find the company code in the dashboard under Settings.
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
