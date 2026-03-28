/* eslint-disable react-refresh/only-export-components */
// ═══════════════════════════════════════════
// GHS Hazard Pictograms
//
// Source: Official UN Globally Harmonized System (GHS)
// pictograms as defined in the "Purple Book"
// (UN ST/SG/AC.10/30/Rev.9). These symbols are
// standardized by the United Nations and are in the
// public domain. The SVG paths below reproduce the
// official OSHA/UN GHS symbols inside the standard
// red diamond border frame.
//
// Reference: https://www.osha.gov/hazcom/pictograms
// ═══════════════════════════════════════════

/**
 * GHS pictogram metadata and simplified SVG symbol paths.
 * Each pictogram renders inside a 24x24 viewport by default.
 */
export const GHS_PICTOGRAMS = {
  GHS01: {
    name: "Exploding Bomb",
    hazard: "Explosives, self-reactive substances",
    // Explosion burst symbol
    path: "M12 2l2.5 4 4.5-1-2 4.5L20 14l-4.5 1-1 4.5L12 16l-2.5 3.5-1-4.5L4 14l3-4.5L5 5l4.5 1z",
  },
  GHS02: {
    name: "Flame",
    hazard: "Flammable gases, liquids, solids, aerosols",
    path: "M12 2c0 0-5 6-5 10a5 5 0 0 0 10 0c0-4-5-10-5-10zm-1.5 12a2 2 0 0 1-1.5-2c0-1.5 1.5-4 3-6 1.5 2 3 4.5 3 6a2 2 0 0 1-1.5 2",
  },
  GHS03: {
    name: "Flame Over Circle",
    hazard: "Oxidizers",
    path: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm0-10c0 0-3 3-3 5.5 0 0 1-1.5 3-1.5s3 1.5 3 1.5c0-2.5-3-5.5-3-5.5zM8 17s1 2 4 2 4-2 4-2",
  },
  GHS04: {
    name: "Gas Cylinder",
    hazard: "Gases under pressure",
    path: "M9 4h6v1h1v12h-1v1H9v-1H8V5h1zm1 2v9h4V6z",
  },
  GHS05: {
    name: "Corrosion",
    hazard: "Corrosive to metals, skin, eyes",
    path: "M8 4l1 4-2 1 2 3-1 2h1l1 3h4l1-3h1l-1-2 2-3-2-1 1-4H8zm2 2h4l-.5 2h-3z",
  },
  GHS06: {
    name: "Skull and Crossbones",
    hazard: "Acute toxicity (fatal or toxic)",
    path: "M12 4a4 4 0 0 0-4 4c0 1.5.8 2.8 2 3.5V13h4v-1.5c1.2-.7 2-2 2-3.5a4 4 0 0 0-4-4zm-1.5 5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm3 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2zM8 15l2 1v1l-2 1m8-3l-2 1v1l2 1m-4-4v4",
  },
  GHS07: {
    name: "Exclamation Mark",
    hazard: "Irritant, narcotic, hazardous to ozone",
    path: "M11 5h2v8h-2zm0 10h2v2h-2z",
  },
  GHS08: {
    name: "Health Hazard",
    hazard: "Carcinogen, mutagen, respiratory sensitizer",
    path: "M12 4l-1 2h-1l-1 3 1 1-2 2 1 2v2h2l1 1 1-1h2v-2l1-2-2-2 1-1-1-3h-1zm-1 4a1.5 1.5 0 1 1 0 3H10l-1 2h6l-1-2h-1a1.5 1.5 0 1 1 0-3",
  },
  GHS09: {
    name: "Environment",
    hazard: "Hazardous to aquatic environment",
    path: "M6 14c0-3 3-5 6-5s6 2 6 5c0 2-2 4-6 4s-6-2-6-4zm3-7c1 0 2 1 3 3 1-2 2-3 3-3m-7 1s1 2 1 3-1 2-1 2m8-5s-1 2-1 3 1 2 1 2",
  },
}

/** All valid GHS codes */
export const GHS_CODES = Object.keys(GHS_PICTOGRAMS)

/**
 * Renders a single GHS hazard pictogram in the standard
 * red diamond border with white background.
 */
export function GHSIcon({ code, size = 24, showTooltip = true }) {
  const pictogram = GHS_PICTOGRAMS[code]
  if (!pictogram) return null

  return (
    <span
      title={showTooltip ? `${pictogram.name}: ${pictogram.hazard}` : undefined}
      style={{ display: "inline-flex", verticalAlign: "middle" }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Red diamond border */}
        <path
          d="M12 1L23 12L12 23L1 12Z"
          fill="#fff"
          stroke="#D32F2F"
          strokeWidth="1.5"
        />
        {/* Symbol */}
        <path
          d={pictogram.path}
          fill="#1a1a1a"
          fillRule="evenodd"
        />
      </svg>
    </span>
  )
}

/**
 * Renders a row of GHS pictograms from an array of codes.
 */
export function GHSRow({ codes = [], size = 20, gap = 2 }) {
  if (!codes || codes.length === 0) return null
  return (
    <span style={{ display: "inline-flex", gap, flexWrap: "wrap", alignItems: "center" }}>
      {codes.map(code => (
        <GHSIcon key={code} code={code} size={size} />
      ))}
    </span>
  )
}
