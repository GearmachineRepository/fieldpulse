// ═══════════════════════════════════════════
// Avatar — UI Kit Primitive
// Initials-based avatar with optional photo
// ═══════════════════════════════════════════

import styles from './Avatar.module.css'

/**
 * @param {string} name          Full name (used for initials)
 * @param {string} [photoUrl]    Optional photo URL
 * @param {string} [color]       Background color (hex)
 * @param {'sm'|'md'|'lg'} [size='md']
 */
export default function Avatar({ name, photoUrl, color = '#2D7A3A', size = 'md', className = '' }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() || '')
    .join('')

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${className}`}
      style={{ backgroundColor: photoUrl ? 'transparent' : color }}
      title={name}
    >
      {photoUrl ? (
        <img src={photoUrl} alt={name} className={styles.photo} />
      ) : (
        initials
      )}
    </div>
  )
}

/** Stack of overlapping avatars */
Avatar.Stack = function AvatarStack({ items, max = 5, size = 'sm' }) {
  const visible = items.slice(0, max)
  const overflow = items.length - max

  return (
    <div className={styles.stack}>
      {visible.map((item, i) => (
        <Avatar key={item.id || i} name={item.name} photoUrl={item.photoUrl} color={item.color} size={size} />
      ))}
      {overflow > 0 && (
        <div className={`${styles.avatar} ${styles[size]} ${styles.overflow}`}>
          +{overflow}
        </div>
      )}
    </div>
  )
}
