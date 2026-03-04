import { C, WIND_DIRS, FONT } from '../config.js'

export default function WindCompass({ direction, speed, size = 86 }) {
  const di = WIND_DIRS.indexOf(direction)
  const angle = di >= 0 ? di * 22.5 : 0
  const r = size / 2 - 10
  const cx = size / 2
  const cy = size / 2
  const rad = ((angle - 90) * Math.PI) / 180
  const tipX = cx + Math.cos(rad) * (r - 2)
  const tipY = cy + Math.sin(rad) * (r - 2)
  const bL = ((angle - 90 + 150) * Math.PI) / 180
  const bR = ((angle - 90 - 150) * Math.PI) / 180
  const bLen = 13
  const high = speed > 10
  const col = high ? C.red : C.accent

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r + 4} fill="#F4F3EF" stroke={C.cardBorder} strokeWidth={1.5} />
      {['N', 'E', 'S', 'W'].map((d, i) => {
        const a = ((i * 90 - 90) * Math.PI) / 180
        return (
          <text
            key={d}
            x={cx + Math.cos(a) * (r - 1)}
            y={cy + Math.sin(a) * (r - 1)}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fill={C.textLight}
            fontFamily={FONT}
            fontWeight={800}
          >
            {d}
          </text>
        )
      })}
      <polygon
        points={`${tipX},${tipY} ${cx + Math.cos(bL) * bLen},${cy + Math.sin(bL) * bLen} ${cx},${cy} ${cx + Math.cos(bR) * bLen},${cy + Math.sin(bR) * bLen}`}
        fill={col}
        opacity={0.9}
      />
      <circle cx={cx} cy={cy} r={4} fill={col} />
    </svg>
  )
}
