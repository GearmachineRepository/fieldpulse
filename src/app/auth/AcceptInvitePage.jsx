// ═══════════════════════════════════════════
// Accept Invite Page — /invite/:token
//
// Public page where invited users create
// their account and join an organization.
// ═══════════════════════════════════════════

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { Leaf, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import useAuth from "@/hooks/useAuth.jsx"
import { setAuthToken } from "@/lib/api/core.js"
import { validateInviteToken, acceptInvitation } from "@/lib/api/invitations.js"
import s from "./AcceptInvitePage.module.css"

export default function AcceptInvitePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { isAdmin } = useAuth()

  const [invite, setInvite] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (isAdmin) {
      navigate("/dashboard", { replace: true })
      return
    }
    validateInviteToken(token)
      .then(setInvite)
      .catch(err => setError(err.message || "Invalid or expired invitation"))
      .finally(() => setLoading(false))
  }, [token, isAdmin, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)

    if (!name.trim()) { setSubmitError("Name is required"); return }
    if (password.length < 6) { setSubmitError("Password must be at least 6 characters"); return }
    if (password !== confirmPassword) { setSubmitError("Passwords do not match"); return }

    setSubmitting(true)
    try {
      const result = await acceptInvitation(token, { name: name.trim(), password })
      if (result.token) {
        setAuthToken(result.token)
        // Force page reload to pick up new session
        window.location.href = "/dashboard"
      }
    } catch (err) {
      setSubmitError(err.message || "Failed to create account")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={s.page}>
        <div className={s.card}>
          <Loader2 size={24} className={s.spinner} />
          <p className={s.loadingText}>Validating invitation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={s.page}>
        <div className={s.card}>
          <AlertCircle size={32} className={s.errorIcon} />
          <h2 className={s.title}>Invitation Invalid</h2>
          <p className={s.errorText}>{error}</p>
          <a href="/login" className={s.link}>Go to login</a>
        </div>
      </div>
    )
  }

  return (
    <div className={s.page}>
      <div className={s.card}>
        <div className={s.logoMark}>
          <Leaf size={22} />
        </div>
        <h2 className={s.title}>Join {invite.orgName}</h2>
        <p className={s.subtitle}>
          You've been invited as <strong className={s.roleBadge}>{invite.role.toUpperCase()}</strong>
        </p>

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.field}>
            <label className={s.label}>Email</label>
            <div className={s.readOnly}>{invite.email}</div>
          </div>
          <div className={s.field}>
            <label className={s.label}>Full Name</label>
            <input
              className={s.input}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              autoFocus
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>Password</label>
            <input
              className={s.input}
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div className={s.field}>
            <label className={s.label}>Confirm Password</label>
            <input
              className={s.input}
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>

          {submitError && <div className={s.formError}>{submitError}</div>}

          <button type="submit" className={s.submitBtn} disabled={submitting}>
            {submitting ? <Loader2 size={16} className={s.spinner} /> : <CheckCircle2 size={16} />}
            {submitting ? "Creating account..." : "Create Account & Join"}
          </button>
        </form>

        <p className={s.footerText}>
          Already have an account? <a href="/login" className={s.link}>Sign in</a>
        </p>
      </div>
    </div>
  )
}
