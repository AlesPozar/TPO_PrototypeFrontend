import type { SVGProps } from 'react'

export function SolaraLogo({ size = 32, ...props }: SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Outer glow ring */}
      <circle cx="20" cy="20" r="18" fill="oklch(0.72 0.19 45 / 0.1)" />
      {/* Sun rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 20 + 11 * Math.cos(rad)
        const y1 = 20 + 11 * Math.sin(rad)
        const x2 = 20 + 17 * Math.cos(rad)
        const y2 = 20 + 17 * Math.sin(rad)
        return (
          <line
            key={angle}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="oklch(0.72 0.19 45)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        )
      })}
      {/* Sun core */}
      <circle cx="20" cy="20" r="8" fill="oklch(0.72 0.19 45)" />
      <circle cx="20" cy="20" r="5" fill="oklch(0.85 0.15 45)" />
    </svg>
  )
}

// Inline SVG string for favicon
export const FAVICON_SVG = `<svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="20" cy="20" r="18" fill="rgba(249,115,22,0.15)"/>
  <line x1="20" y1="9" x2="20" y2="3" stroke="#F97316" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="27.78" y1="12.22" x2="32.09" y2="7.91" stroke="#F97316" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="31" y1="20" x2="37" y2="20" stroke="#F97316" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="27.78" y1="27.78" x2="32.09" y2="32.09" stroke="#F97316" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="20" y1="31" x2="20" y2="37" stroke="#F97316" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="12.22" y1="27.78" x2="7.91" y2="32.09" stroke="#F97316" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="9" y1="20" x2="3" y2="20" stroke="#F97316" stroke-width="2.2" stroke-linecap="round"/>
  <line x1="12.22" y1="12.22" x2="7.91" y2="7.91" stroke="#F97316" stroke-width="2.2" stroke-linecap="round"/>
  <circle cx="20" cy="20" r="8" fill="#F97316"/>
  <circle cx="20" cy="20" r="5" fill="#FED7AA"/>
</svg>`
