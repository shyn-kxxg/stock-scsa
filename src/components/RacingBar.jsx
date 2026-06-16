import { useExcelMode } from '../context/ExcelModeContext'

export default function RacingBar({ rate, maxAbsRate, color }) {
  const { excelMode } = useExcelMode()

  if (rate === null || maxAbsRate === 0) {
    if (excelMode) {
      return (
        <div className="relative h-5 flex items-center" style={{ background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
          <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: '#c0c0c0' }} />
          <span className="text-xs w-full text-center" style={{ color: '#999', position: 'relative', zIndex: 1 }}>-</span>
        </div>
      )
    }
    return (
      <div className="relative h-5 rounded overflow-hidden bg-gray-900 flex items-center justify-center">
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-700" />
        <span className="text-gray-600 text-xs z-10">-</span>
      </div>
    )
  }

  const isPositive = rate >= 0
  const barPct = Math.min((Math.abs(rate) / maxAbsRate) * 50, 50)

  if (excelMode) {
    const excelColor = isPositive ? '#70AD47' : '#FF0000'
    return (
      <div className="relative h-5" style={{ background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
        <div className="absolute top-0 bottom-0 left-1/4 w-px" style={{ background: '#e0e0e0' }} />
        <div className="absolute top-0 bottom-0 left-3/4 w-px" style={{ background: '#e0e0e0' }} />
        <div className="absolute top-0 bottom-0 left-1/2 w-px" style={{ background: '#c0c0c0', zIndex: 1 }} />
        <div
          className="absolute top-[3px] bottom-[3px]"
          style={
            isPositive
              ? { left: '50%', width: `${barPct}%`, background: excelColor }
              : { right: '50%', width: `${barPct}%`, background: excelColor }
          }
        />
      </div>
    )
  }

  return (
    <div className="relative h-5 rounded overflow-hidden bg-gray-900/80">
      <div className="absolute top-0 bottom-0 left-1/4 w-px bg-gray-800/60" />
      <div className="absolute top-0 bottom-0 left-3/4 w-px bg-gray-800/60" />
      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-600 z-10" />
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
