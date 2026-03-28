// ═══════════════════════════════════════════
// Admin Login Page — /login
// Email + password → redirect to /admin
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Leaf, Eye, EyeOff, Loader2, Mail, Lock, Check } from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"
import { forgotPassword } from "@/lib/api/auth.js"

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const { isAdmin, restoring, loginAdmin } = useAuth()

  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotSubmitting, setForgotSubmitting] = useState(false)

  // Redirect if already logged in
  useEffect(() => {
    if (!restoring && isAdmin) navigate("/dashboard", { replace: true })
  }, [isAdmin, restoring, navigate])

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!email.trim() || !password) return
    setError(null)
    setSubmitting(true)
    try {
      await loginAdmin(email.trim(), password)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err.message || "Invalid email or password")
      setPassword("")
    } finally {
      setSubmitting(false)
    }
  }

  const handleForgot = async () => {
    if (!forgotEmail.trim()) return
    setForgotSubmitting(true)
    try {
      await forgotPassword(forgotEmail.trim())
      setForgotSent(true)
    } catch {
      setForgotSent(true) // always show success to prevent email enumeration
    } finally {
      setForgotSubmitting(false)
    }
  }

  if (restoring) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, fontFamily: T.font }}>
        <Loader2 size={24} color={T.accent} style={{ animation: "spin 1s linear infinite" }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: T.bg, fontFamily: T.font, padding: 20,
    }}>
      <div style={{ width: "100%", maxWidth: 400 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 3, background: T.accent, margin: "0 auto 14px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={28} color={T.card} />
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: T.text, letterSpacing: "-0.5px" }}>CruPoint</div>
          <div style={{ fontSize: 14, color: T.textLight, marginTop: 4 }}>Sign in to your dashboard</div>
        </div>

        <div style={{
          background: T.card, borderRadius: 3, padding: 32,
          border: `1px solid ${T.border}`, boxShadow: T.shadowMd,
        }}>
          {error && (
            <div style={{
              padding: "12px 16px", background: T.redLight, borderRadius: 3,
              color: T.red, fontSize: 14, fontWeight: 600, marginBottom: 20,
              border: `1px solid #FECACA`,
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={{
              display: "block", fontSize: 13, fontWeight: 600, color: T.textMed, marginBottom: 6,
            }}>
              Email
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
              background: T.bg, borderRadius: 3, border: `1.5px solid ${T.border}`,
              transition: "border-color 0.15s",
            }}>
              <Mail size={18} color={T.textLight} />
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="you@company.com"
                autoFocus
                autoComplete="email"
                style={{
                  flex: 1, padding: "14px 0", border: "none", outline: "none",
                  background: "transparent", fontSize: 15, fontFamily: T.font, color: T.text,
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: "block", fontSize: 13, fontWeight: 600, color: T.textMed, marginBottom: 6,
            }}>
              Password
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
              background: T.bg, borderRadius: 3, border: `1.5px solid ${T.border}`,
              transition: "border-color 0.15s",
            }}>
              <Lock size={18} color={T.textLight} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Enter your password"
                autoComplete="current-password"
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

          <button
            onClick={handleSubmit}
            disabled={submitting || !email.trim() || !password}
            style={{
              width: "100%", padding: "14px", borderRadius: 3, border: "none", cursor: "pointer",
              background: T.accent, color: T.card, fontSize: 16, fontWeight: 600, fontFamily: T.font,
              opacity: (submitting || !email.trim() || !password) ? 0.5 : 1,
              transition: "opacity 0.15s",
              boxShadow: "0 4px 14px rgba(47,111,237,0.2)",
            }}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>

          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false) }} style={{
              border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
              fontSize: 13, color: T.accent, fontWeight: 600,
            }}>
              Forgot your password?
            </button>
          </div>
        </div>

        {/* Forgot password overlay */}
        {showForgot && (
          <div style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}>
            <div style={{
              width: "100%", maxWidth: 400, background: T.card, borderRadius: 4, padding: 32,
              border: `1px solid ${T.border}`, boxShadow: T.shadowMd,
            }}>
              {forgotSent ? (
                <>
                  <div style={{ textAlign: "center", marginBottom: 20 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 3, background: T.accentLight, margin: "0 auto 12px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Check size={24} color={T.accent} />
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 6 }}>Check your email</div>
                    <div style={{ fontSize: 14, color: T.textLight, lineHeight: 1.5 }}>
                      If an account exists for <strong style={{ color: T.text }}>{forgotEmail}</strong>, we sent a password reset link.
                    </div>
                  </div>
                  <button onClick={() => setShowForgot(false)} style={{
                    width: "100%", padding: "14px", borderRadius: 3, border: "none", cursor: "pointer",
                    background: T.accent, color: T.card, fontSize: 15, fontWeight: 600, fontFamily: T.font,
                  }}>
                    Back to Sign In
                  </button>
                </>
              ) : (
                <>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ fontSize: 18, fontWeight: 600, color: T.text, marginBottom: 6 }}>Reset your password</div>
                    <div style={{ fontSize: 14, color: T.textLight }}>Enter your email and we'll send a reset link.</div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
                      background: T.bg, borderRadius: 3, border: `1.5px solid ${T.border}`,
                    }}>
                      <Mail size={18} color={T.textLight} />
                      <input
                        type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                        placeholder="you@company.com" autoFocus
                        onKeyDown={e => { if (e.key === "Enter" && forgotEmail.trim()) handleForgot() }}
                        style={{
                          flex: 1, padding: "14px 0", border: "none", outline: "none",
                          background: "transparent", fontSize: 15, fontFamily: T.font, color: T.text,
                        }}
                      />
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => setShowForgot(false)} style={{
                      flex: 1, padding: "14px", borderRadius: 3, cursor: "pointer",
                      background: "transparent", border: `1.5px solid ${T.border}`,
                      color: T.textMed, fontSize: 15, fontWeight: 600, fontFamily: T.font,
                    }}>
                      Cancel
                    </button>
                    <button onClick={handleForgot} disabled={forgotSubmitting || !forgotEmail.trim()} style={{
                      flex: 2, padding: "14px", borderRadius: 3, border: "none", cursor: "pointer",
                      background: T.accent, color: T.card, fontSize: 15, fontWeight: 600, fontFamily: T.font,
                      opacity: (forgotSubmitting || !forgotEmail.trim()) ? 0.5 : 1,
                    }}>
                      {forgotSubmitting ? "Sending..." : "Send Reset Link"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Signup link */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={() => navigate("/signup")} style={{
            border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
            fontSize: 14, color: T.textMed, fontWeight: 500,
          }}>
            Don't have an account? <span style={{ color: T.accent, fontWeight: 600 }}>Sign up</span>
          </button>
        </div>

        {/* Field app link */}
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button onClick={() => navigate("/app")} style={{
            border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
            fontSize: 13, color: T.textLight,
          }}>
            Crew member? Open Field App →
          </button>
        </div>

        {/* Back to landing */}
        <div style={{ textAlign: "center", marginTop: 8 }}>
          <button onClick={() => navigate("/")} style={{
            border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
            fontSize: 13, color: T.textLight,
          }}>
            ← Back to CruPoint.com
          </button>
        </div>
      </div>
    </div>
  )
}
