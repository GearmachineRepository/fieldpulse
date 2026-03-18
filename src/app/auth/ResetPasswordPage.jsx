// ═══════════════════════════════════════════
// Reset Password Page — /reset-password
//
// Handles the redirect from Supabase password reset email.
// The URL contains an access_token in the hash fragment.
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Leaf, Lock, Eye, EyeOff, Check, AlertCircle } from "lucide-react"
import { T } from "@/app/tokens.js"
import { resetPassword } from "@/lib/api/auth.js"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)
  const [accessToken, setAccessToken] = useState(null)

  // Extract access_token from URL hash (Supabase puts it there)
  useEffect(() => {
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const token = params.get("access_token")
    if (token) {
      setAccessToken(token)
    } else {
      setError("Invalid or expired reset link. Please request a new one.")
    }
  }, [])

  const handleSubmit = async () => {
    if (!password || !confirm) return
    if (password !== confirm) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setError(null)
    setSubmitting(true)
    try {
      await resetPassword(accessToken, password)
      setSuccess(true)
    } catch (err) {
      setError(err.message || "Failed to reset password")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: T.bg, fontFamily: T.font, padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14, background: T.accent, margin: "0 auto 14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={28} color="#fff" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.text, letterSpacing: "-0.5px" }}>CruPoint</div>
          <div style={{ fontSize: 14, color: T.textLight, marginTop: 4 }}>Set a new password</div>
        </div>

        <div style={{
          background: T.card, borderRadius: 16, padding: 32,
          border: `1px solid ${T.border}`, boxShadow: T.shadowMd,
        }}>
          {success ? (
            <>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: T.accentLight, margin: "0 auto 12px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Check size={24} color={T.accent} />
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 6 }}>Password updated</div>
                <div style={{ fontSize: 14, color: T.textLight }}>You can now sign in with your new password.</div>
              </div>
              <button onClick={() => navigate("/login")} style={{
                width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
                background: T.accent, color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: T.font,
              }}>
                Go to Sign In
              </button>
            </>
          ) : (
            <>
              {error && (
                <div style={{
                  padding: "12px 16px", background: T.redLight, borderRadius: 10,
                  color: T.red, fontSize: 14, fontWeight: 600, marginBottom: 20,
                  border: "1px solid #FECACA", display: "flex", alignItems: "center", gap: 8,
                }}>
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {accessToken && (
                <>
                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMed, marginBottom: 6 }}>
                      New Password
                    </label>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
                      background: T.bg, borderRadius: 12, border: `1.5px solid ${T.border}`,
                    }}>
                      <Lock size={18} color={T.textLight} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password} onChange={e => { setPassword(e.target.value); setError(null) }}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        placeholder="At least 8 characters" autoFocus autoComplete="new-password"
                        style={{
                          flex: 1, padding: "14px 0", border: "none", outline: "none",
                          background: "transparent", fontSize: 15, fontFamily: T.font, color: T.text,
                        }}
                      />
                      <button onClick={() => setShowPassword(!showPassword)} style={{
                        border: "none", background: "none", cursor: "pointer", padding: 4,
                      }}>
                        {showPassword ? <EyeOff size={18} color={T.textLight} /> : <Eye size={18} color={T.textLight} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMed, marginBottom: 6 }}>
                      Confirm Password
                    </label>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
                      background: T.bg, borderRadius: 12, border: `1.5px solid ${T.border}`,
                    }}>
                      <Lock size={18} color={T.textLight} />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={confirm} onChange={e => { setConfirm(e.target.value); setError(null) }}
                        onKeyDown={e => e.key === "Enter" && handleSubmit()}
                        placeholder="Re-enter password" autoComplete="new-password"
                        style={{
                          flex: 1, padding: "14px 0", border: "none", outline: "none",
                          background: "transparent", fontSize: 15, fontFamily: T.font, color: T.text,
                        }}
                      />
                    </div>
                  </div>

                  <button onClick={handleSubmit} disabled={submitting || !password || !confirm} style={{
                    width: "100%", padding: "14px", borderRadius: 12, border: "none", cursor: "pointer",
                    background: T.accent, color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: T.font,
                    opacity: (submitting || !password || !confirm) ? 0.5 : 1,
                  }}>
                    {submitting ? "Updating..." : "Update Password"}
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={() => navigate("/login")} style={{
            border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
            fontSize: 13, color: T.textLight,
          }}>
            Back to Sign In
          </button>
        </div>
      </div>
    </div>
  )
}
