export default function RacingBar({ rate, maxAbsRate, color }) {
  if (rate === null || maxAbsRate === 0) {
    return (
      <div className="relative h-5 rounded overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-700" />
        <span className="text-gray-600 text-xs z-10">-</span>
      </div>
    )
  }

  const isPositive = rate >= 0
  const barPct = Math.min((Math.abs(rate) / maxAbsRate) * 50, 50)

  return (
    <div className="relative h-5 rounded overflow-hidden bg-gray-900/80">
      {/* Left quarter line */}
      <div className="absolute top-0 bottom-0 left-1/4 w-px bg-gray-800/60" />
      {/* Right quarter line */}
      <div className="absolute top-0 bottom-0 left-3/4 w-px bg-gray-800/60" />
      {/* Center line */}
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-600 z-10" />

      {/* Bar */}
      <div
        className="absolute top-[3px] bottom-[3px]"
        style={
          isPositive
            ? {
                left: '50%',
                width: `${barPct}%`,
                background: `linear-gradient(to right, ${color}99, ${color})`,
                borderRadius: '0 3px 3px 0',
              }
            : {
                right: '50%',
                width: `${barPct}%`,
                background: `linear-gradient(to left, ${color}99, ${color})`,
                borderRadius: '3px 0 0 3px',
              }
        }
      />
    </div>
  )
}
