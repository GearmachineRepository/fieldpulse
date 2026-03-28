// ═══════════════════════════════════════════
// Pricing Page — /pricing
// 3-tier pricing cards, no transactions wired up yet
// ═══════════════════════════════════════════

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Leaf, Check } from "lucide-react"
import { T } from "@/app/tokens.js"

const PLANS = [
  {
    name: "Starter",
    price: { monthly: 29, annual: 24 },
    description: "For small crews getting organized",
    features: [
      "Up to 5 users",
      "1 crew",
      "Route management",
      "Spray log documentation",
      "Basic reporting",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    price: { monthly: 79, annual: 66 },
    description: "For growing operations with multiple crews",
    features: [
      "Up to 25 users",
      "Unlimited crews",
      "Route optimization",
      "Advanced reporting & analytics",
      "Resource library",
      "Schedule management",
      "Service plans",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: null,
    description: "For large organizations needing custom solutions",
    features: [
      "Unlimited users",
      "Unlimited crews",
      "Everything in Professional",
      "Custom integrations",
      "Dedicated account manager",
      "SSO / SAML",
      "Custom reporting",
      "SLA guarantee",
    ],
    cta: "Contact Sales",
    popular: false,
  },
]

export default function PricingPage() {
  const navigate = useNavigate()
  const [billing, setBilling] = useState("monthly")

  return (
    <div style={{
      minHeight: "100vh", background: T.bg, fontFamily: T.font, color: T.text,
    }}>
      {/* Nav */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px", maxWidth: 1200, margin: "0 auto",
      }}>
        <button onClick={() => navigate("/")} style={{
          display: "flex", alignItems: "center", gap: 8, border: "none",
          background: "none", cursor: "pointer", fontFamily: T.font,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 3, background: T.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Leaf size={18} color={T.card} />
          </div>
          <span style={{ fontSize: 18, fontWeight: 600, color: T.text }}>CruPoint</span>
        </button>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => navigate("/login")} style={{
            padding: "10px 20px", borderRadius: 3, border: `1.5px solid ${T.border}`,
            background: T.card, cursor: "pointer", fontFamily: T.font,
            fontSize: 14, fontWeight: 600, color: T.text,
          }}>
            Sign In
          </button>
          <button onClick={() => navigate("/signup")} style={{
            padding: "10px 20px", borderRadius: 3, border: "none",
            background: T.accent, cursor: "pointer", fontFamily: T.font,
            fontSize: 14, fontWeight: 600, color: T.card,
          }}>
            Get Started
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ textAlign: "center", padding: "60px 20px 40px", maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ fontSize: 40, fontWeight: 600, marginBottom: 12, letterSpacing: "-1px", lineHeight: 1.1 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 18, color: T.textLight, lineHeight: 1.6, marginBottom: 32 }}>
          Start with a 14-day free trial. No credit card required. Upgrade when you're ready.
        </p>

        {/* Billing toggle */}
        <div style={{
          display: "inline-flex", background: T.card, borderRadius: 3,
          border: `1px solid ${T.border}`, padding: 4,
        }}>
          <button onClick={() => setBilling("monthly")} style={{
            padding: "10px 24px", borderRadius: 3, border: "none", cursor: "pointer",
            fontFamily: T.font, fontSize: 14, fontWeight: 600,
            background: billing === "monthly" ? T.accent : "transparent",
            color: billing === "monthly" ? T.card : T.textMed,
            transition: "all 0.15s",
          }}>
            Monthly
          </button>
          <button onClick={() => setBilling("annual")} style={{
            padding: "10px 24px", borderRadius: 3, border: "none", cursor: "pointer",
            fontFamily: T.font, fontSize: 14, fontWeight: 600,
            background: billing === "annual" ? T.accent : "transparent",
            color: billing === "annual" ? T.card : T.textMed,
            transition: "all 0.15s",
          }}>
            Annual <span style={{ fontSize: 12, opacity: 0.8 }}>(save 17%)</span>
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="pricing-grid" style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 24, maxWidth: 1100, margin: "0 auto", padding: "0 20px 80px",
      }}>
        <style>{`@media (max-width: 900px) { .pricing-grid { grid-template-columns: 1fr !important; max-width: 440px !important; } }`}</style>
        {PLANS.map(plan => (
          <div key={plan.name} style={{
            background: T.card, borderRadius: 3, padding: 36,
            border: plan.popular ? `2px solid ${T.accent}` : `1px solid ${T.border}`,
            position: "relative", display: "flex", flexDirection: "column",
            boxShadow: plan.popular ? "0 8px 30px rgba(47,111,237,0.12)" : "none",
          }}>
            {plan.popular && (
              <div style={{
                position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
                background: T.accent, color: T.card, padding: "4px 16px", borderRadius: 3,
                fontSize: 12, fontWeight: 600, letterSpacing: "0.5px",
              }}>
                MOST POPULAR
              </div>
            )}

            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>{plan.name}</div>
            <div style={{ fontSize: 14, color: T.textLight, marginBottom: 24 }}>{plan.description}</div>

            {plan.price ? (
              <div style={{ marginBottom: 28 }}>
                <span style={{ fontSize: 44, fontWeight: 600, letterSpacing: "-2px" }}>
                  ${billing === "monthly" ? plan.price.monthly : plan.price.annual}
                </span>
                <span style={{ fontSize: 16, color: T.textLight }}>/month</span>
                {billing === "annual" && (
                  <div style={{ fontSize: 13, color: T.accent, fontWeight: 600, marginTop: 4 }}>
                    Billed annually (${plan.price.annual * 12}/yr)
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginBottom: 28 }}>
                <span style={{ fontSize: 36, fontWeight: 600 }}>Custom</span>
                <div style={{ fontSize: 13, color: T.textLight, marginTop: 4 }}>
                  Tailored to your organization
                </div>
              </div>
            )}

            <button onClick={() => plan.price ? navigate("/signup") : null} style={{
              width: "100%", padding: "14px", borderRadius: 3, border: "none", cursor: "pointer",
              fontFamily: T.font, fontSize: 15, fontWeight: 600,
              background: plan.popular ? T.accent : T.bg,
              color: plan.popular ? T.card : T.text,
              marginBottom: 28,
              boxShadow: plan.popular ? "0 4px 14px rgba(47,111,237,0.2)" : "none",
            }}>
              {plan.cta}
            </button>

            <div style={{ flex: 1 }}>
              {plan.features.map(f => (
                <div key={f} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "8px 0",
                  fontSize: 14, color: T.textMed,
                }}>
                  <Check size={16} color={T.accent} style={{ flexShrink: 0 }} />
                  {f}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: "center", padding: "32px 20px", borderTop: `1px solid ${T.border}`,
        color: T.textLight, fontSize: 13,
      }}>
        All plans include a 14-day free trial. Cancel anytime.
      </div>
    </div>
  )
}
