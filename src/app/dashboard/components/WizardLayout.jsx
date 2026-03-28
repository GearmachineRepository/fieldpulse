// ═══════════════════════════════════════════
// WizardLayout — Multi-step form
//
// Step pills at top (amber active, muted future,
// green completed). Future steps are NOT clickable
// until current step is complete.
// ═══════════════════════════════════════════

import { Check } from 'lucide-react'
import s from './WizardLayout.module.css'

/**
 * @param {{
 *   steps: Array<{ key: string, label: string }>,
 *   activeStep: number,
 *   canAdvance?: boolean,
 *   onBack?: () => void,
 *   onNext?: () => void,
 *   onSubmit?: () => void,
 *   submitting?: boolean,
 *   children: React.ReactNode,
 * }} props
 */
export default function WizardLayout({
  steps,
  activeStep,
  canAdvance = true,
  onBack,
  onNext,
  onSubmit,
  submitting = false,
  children,
}) {
  const isLast = activeStep === steps.length - 1
  const isFirst = activeStep === 0

  return (
    <div className={s.wizard}>
      {/* Step indicator */}
      <div className={s.steps}>
        {steps.map((step, i) => {
          const isActive = i === activeStep
          const isCompleted = i < activeStep
          const isFuture = i > activeStep

          return (
            <div
              key={step.key}
              className={[
                s.step,
                isActive ? s.stepActive : '',
                isCompleted ? s.stepCompleted : '',
                isFuture ? s.stepFuture : '',
              ].join(' ')}
            >
              <div className={s.stepDot}>
                {isCompleted ? <Check size={12} /> : <span>{i + 1}</span>}
              </div>
              <span className={s.stepLabel}>{step.label}</span>
              {i < steps.length - 1 && <div className={s.stepLine} />}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className={s.content}>{children}</div>

      {/* Navigation */}
      <div className={s.nav}>
        <button className={s.backBtn} onClick={onBack} disabled={isFirst} type="button">
          Back
        </button>

        {isLast ? (
          <button
            className={s.submitBtn}
            onClick={onSubmit}
            disabled={!canAdvance || submitting}
            type="button"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        ) : (
          <button className={s.nextBtn} onClick={onNext} disabled={!canAdvance} type="button">
            Next
          </button>
        )}
      </div>
    </div>
  )
}
