// ═══════════════════════════════════════════
// Skeleton — UI Kit Primitive
// Animated loading placeholder shapes
// ═══════════════════════════════════════════

import s from "./Skeleton.module.css"

/**
 * @param {'text'|'heading'|'circle'|'card'} [variant='text']
 * @param {number|string} [width] — CSS width override
 * @param {number|string} [height] — CSS height override
 * @param {string} [className]
 */
export default function Skeleton({ variant = "text", width, height, className = "" }) {
  const variantClass = s[variant] || s.text
  return (
    <div
      className={`${s.skeleton} ${variantClass} ${className}`}
      style={{ ...(width ? { width } : {}), ...(height ? { height } : {}) }}
    />
  )
}
