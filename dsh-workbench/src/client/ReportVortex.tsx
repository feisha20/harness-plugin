import React, { useId } from 'react'

const dust = Array.from({ length: 52 }, (_, index) => {
  const angle = index * 2.39996
  const radius = 55 + (index * 19 % 46)
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
    size: index % 9 === 0 ? 1.2 : .55,
    opacity: .24 + (index * 13 % 48) / 100,
  }
})

export function VortexDisc() {
  const id = useId()
  return (
    <g>
      <defs>
        <radialGradient id={`${id}-halo`}>
          <stop offset="35%" stopColor="#170c04" stopOpacity=".95" />
          <stop offset="56%" stopColor="#82410a" stopOpacity=".48" />
          <stop offset="76%" stopColor="#db7d13" stopOpacity=".18" />
          <stop offset="100%" stopColor="#f1a630" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`${id}-core`} cx="42%" cy="39%">
          <stop offset="55%" stopColor="#080604" />
          <stop offset="88%" stopColor="#211207" />
          <stop offset="100%" stopColor="#5f320d" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-45%" y="-45%" width="190%" height="190%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>
      <circle r="104" fill={`url(#${id}-halo)`} />
      <circle r="47" fill={`url(#${id}-core)`} />
      <circle r="49" fill="none" stroke="#ffb525" strokeWidth="8" opacity=".64" filter={`url(#${id}-glow)`} />
      <g fill="none">
        <circle r="46.5" stroke="#ffe7a3" strokeWidth="2.5" />
        <circle r="51" stroke="#ffad33" strokeWidth="2" opacity=".87" />
        <circle r="56" stroke="#f7c362" strokeWidth="1.5" opacity=".74" />
        <circle r="63" stroke="#d28728" strokeWidth="1" opacity=".57" />
        <circle r="72" stroke="#ac6726" strokeWidth="1" opacity=".4" />
        <circle r="80" stroke="#a5672a" strokeWidth=".8" opacity=".26" />
        <g className="wr-vortex-ring">
          <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="2.4s" repeatCount="indefinite" />
          <circle r="49" stroke="#fff0ae" strokeWidth="3" strokeLinecap="round" strokeDasharray="92 133 27 56" />
          <circle r="57" stroke="#ffca55" strokeWidth="2.6" strokeLinecap="round" strokeDasharray="107 108 37 106" strokeDashoffset="24" />
          <circle r="65" stroke="#cf7b18" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="70 151 28 159" strokeDashoffset="84" />
        </g>
      </g>
      <g className="wr-vortex-dust" fill="#e8a23c">
        <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="360 0 0" dur="9s" repeatCount="indefinite" />
        {dust.map(({ x, y, size, opacity }, index) => (
          <circle key={index} cx={x} cy={y} r={size} opacity={opacity} />
        ))}
      </g>
    </g>
  )
}

