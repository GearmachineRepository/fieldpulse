// ═══════════════════════════════════════════
// Input — UI Kit Primitive
// Replaces inputStyle() inline helper
// ═══════════════════════════════════════════

import { forwardRef } from 'react'
import styles from './Input.module.css'

/**
 * @param {string} [label]      Uppercase label above the input
 * @param {string} [error]      Error message below the input
 * @param {'text'|'number'|'password'|'email'|'tel'|'search'|'url'} [type='text']
 * @param {string} [className]
 */
const Input = forwardRef(function Input({
  label,
  error,
  className = '',
  id,
  ...rest
}, ref) {
  const inputId = id || (label ? `input-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`${styles.input} ${error ? styles.inputError : ''}`}
        {...rest}
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
})

export default Input

/**
 * Textarea variant — same styling, multi-line.
 */
export const Textarea = forwardRef(function Textarea({
  label,
  error,
  className = '',
  id,
  rows = 3,
  ...rest
}, ref) {
  const inputId = id || (label ? `textarea-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`${styles.input} ${styles.textarea} ${error ? styles.inputError : ''}`}
        {...rest}
      />
      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
})

/**
 * Select variant — dropdown.
 */
export const Select = forwardRef(function Select({
  label,
  error,
  options = [],
  placeholder,
  className = '',
  id,
  ...rest
}, ref) {
  const inputId = id || (label ? `select-${label.replace(/\s+/g, '-').toLowerCase()}` : undefined)

  return (
    <div className={`${styles.wrapper} ${className}`}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={inputId}
        className={`${styles.input} ${styles.select} ${error ? styles.inputError : ''}`}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <div className={styles.error}>{error}</div>}
    </div>
  )
})
