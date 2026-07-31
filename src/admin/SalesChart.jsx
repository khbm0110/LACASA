// Mini graphique en aire/ligne, dessine a la main en SVG (aucune librairie
// de graphiques n est installee dans ce projet et l environnement ne peut
// pas en telecharger). Attend un tableau de 24 valeurs (une par heure).
export default function SalesChart({ hourly = [], height = 220 }) {
  const values = hourly.length === 24 ? hourly : Array.from({ length: 24 }, (_, i) => hourly[i] || 0)
  const max = Math.max(...values, 1)
  const width = 1000
  const stepX = width / 23

  const points = values.map((v, i) => {
    const x = i * stepX
    const y = height - (v / max) * (height - 20) - 4
    return [x, y]
  })

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ")
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`

  const labels = [
    { hour: 0, text: "00:00" },
    { hour: 6, text: "06:00" },
    { hour: 12, text: "12:00" },
    { hour: 18, text: "18:00" },
    { hour: 23, text: "23:00" }
  ]

  return (
    <svg viewBox={`0 0 ${width} ${height + 24}`} className="w-full" preserveAspectRatio="none" style={{ height }}>
      <defs>
        <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF7A3D" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#FF7A3D" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="0" x2={width} y1={height * f} y2={height * f} stroke="rgba(244,238,224,0.08)" strokeWidth="1" />
      ))}
      <path d={areaPath} fill="url(#salesFill)" />
      <path d={linePath} fill="none" stroke="#FF7A3D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {labels.map((l) => (
        <text key={l.hour} x={l.hour * stepX} y={height + 18} fontSize="20" fill="#B8B0A0"
          textAnchor={l.hour === 0 ? "start" : l.hour === 23 ? "end" : "middle"}>
          {l.text}
        </text>
      ))}
    </svg>
  )
}
