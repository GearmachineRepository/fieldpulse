// ═══════════════════════════════════════════
// Signup Page — /signup
// Name + email + password → create account → redirect to /admin
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Leaf, Eye, EyeOff, Loader2, Mail, Lock, User } from "lucide-react"
import { T } from "@/app/tokens.js"
import useAuth from "@/hooks/useAuth.jsx"

export default function SignupPage() {
  const navigate = useNavigate()
  const { isAdmin, restoring, signupAdmin } = useAuth()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!restoring && isAdmin) navigate("/dashboard", { replace: true })
  }, [isAdmin, restoring, navigate])

  const canSubmit = name.trim() && email.trim() && password.length >= 8

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!canSubmit) return
    setError(null)
    setSubmitting(true)
    try {
      await signupAdmin(name.trim(), email.trim(), password)
      navigate("/dashboard", { replace: true })
    } catch (err) {
      setError(err.message || "Failed to create account")
    } finally {
      setSubmitting(false)
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
            <Leaf size={28} color="#fff" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: T.text, letterSpacing: "-0.5px" }}>CruPoint</div>
          <div style={{ fontSize: 14, color: T.textLight, marginTop: 4 }}>Create your account</div>
        </div>

        <div style={{
          background: T.card, borderRadius: 3, padding: 32,
          border: `1px solid ${T.border}`, boxShadow: T.shadowMd,
        }}>
          {error && (
            <div style={{
              padding: "12px 16px", background: T.redLight, borderRadius: 3,
              color: T.red, fontSize: 14, fontWeight: 600, marginBottom: 20,
              border: "1px solid #FECACA",
            }}>
              {error}
            </div>
          )}

          {/* Name */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMed, marginBottom: 6 }}>
              Full Name
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
              background: T.bg, borderRadius: 3, border: `1.5px solid ${T.border}`,
            }}>
              <User size={18} color={T.textLight} />
              <input
                type="text" value={name}
                onChange={e => { setName(e.target.value); setError(null) }}
                placeholder="Your full name" autoFocus autoComplete="name"
                style={{
                  flex: 1, padding: "14px 0", border: "none", outline: "none",
                  background: "transparent", fontSize: 15, fontFamily: T.font, color: T.text,
                }}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 18 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMed, marginBottom: 6 }}>
              Email
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
              background: T.bg, borderRadius: 3, border: `1.5px solid ${T.border}`,
            }}>
              <Mail size={18} color={T.textLight} />
              <input
                type="email" value={email}
                onChange={e => { setEmail(e.target.value); setError(null) }}
                placeholder="you@company.com" autoComplete="email"
                style={{
                  flex: 1, padding: "14px 0", border: "none", outline: "none",
                  background: "transparent", fontSize: 15, fontFamily: T.font, color: T.text,
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.textMed, marginBottom: 6 }}>
              Password
            </label>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, padding: "0 14px",
              background: T.bg, borderRadius: 3, border: `1.5px solid ${T.border}`,
            }}>
              <Lock size={18} color={T.textLight} />
              <input
                type={showPassword ? "text" : "password"} value={password}
                onChange={e => { setPassword(e.target.value); setError(null) }}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="Min. 8 characters" autoComplete="new-password"
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
            {password && password.length < 8 && (
              <div style={{ fontSize: 12, color: T.red, marginTop: 6 }}>Password must be at least 8 characters</div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            style={{
              width: "100%", padding: "14px", borderRadius: 3, border: "none", cursor: "pointer",
              background: T.accent, color: "#fff", fontSize: 16, fontWeight: 600, fontFamily: T.font,
              opacity: (submitting || !canSubmit) ? 0.5 : 1,
              transition: "opacity 0.15s",
              boxShadow: "0 4px 14px rgba(47,111,237,0.2)",
            }}
          >
            {submitting ? "Creating account..." : "Create Account"}
          </button>

          <div style={{ fontSize: 12, color: T.textLight, textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>
            Includes a 14-day free trial. No credit card required.
          </div>
        </div>

        {/* Login link */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <button onClick={() => navigate("/login")} style={{
            border: "none", background: "none", cursor: "pointer", fontFamily: T.font,
            fontSize: 14, color: T.textMed, fontWeight: 500,
          }}>
            Already have an account? <span style={{ color: T.accent, fontWeight: 600 }}>Sign in</span>
          </button>
        </div>

        <div style={{ textAlign: "center", marginTop: 12 }}>
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
