import { useExcelMode } from '../context/ExcelModeContext'

function fmtKrw(value, { signed = false } = {}) {
  if (value === null || value === undefined) return '-'
  const sign = signed ? (value > 0 ? '+' : value < 0 ? '-' : '') : ''
  return `${sign}₩${Math.round(Math.abs(value)).toLocaleString('ko-KR')}`
}

function fmtRate(rate) {
  if (rate === null || rate === undefined) return '-'
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(2)}%`
}

function fmtUsdKrw(rate) {
  if (!rate) return '-'
  return `₩${rate.toLocaleString('ko-KR', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  })}`
}

export default function SummaryBar({ totalStats }) {
  const { excelMode } = useExcelMode()
  const positive = totalStats?.profitRate >= 0

  if (excelMode) {
    return (
      <div className="border" style={{ borderColor: '#c0c0c0', fontFamily: 'Calibri, Arial, sans-serif' }}>
        {/* Excel-style header row */}
        <div
          className="grid grid-cols-5 border-b"
          style={{ background: '#217346', borderColor: '#1a5c30' }}
        >
          {['항목', '총 수익률', '총 투자금', '현재 평가금', '총 손익'].map(h => (
            <div
              key={h}
              className="px-3 py-1.5 text-xs font-semibold text-white border-r last:border-r-0"
              style={{ borderColor: '#1a5c30' }}
            >
              {h}
            </div>
          ))}
        </div>
        {/* Data row */}
        <div className="grid grid-cols-5" style={{ background: 'white' }}>
          <div className="px-3 py-2 text-xs border-r" style={{ borderColor: '#e0e0e0', color: '#444' }}>
            이번달 합계
          </div>
          <div
            className="px-3 py-2 text-sm font-bold border-r tabular-nums"
            style={{
              borderColor: '#e0e0e0',
              color: totalStats ? (positive ? '#1a7a3c' : '#c62828') : '#999',
            }}
          >
            {fmtRate(totalStats?.profitRate)}
          </div>
          <div className="px-3 py-2 text-xs border-r tabular-nums" style={{ borderColor: '#e0e0e0', color: '#444' }}>
            {fmtKrw(totalStats?.investmentKrw)}
          </div>
          <div className="px-3 py-2 text-xs border-r tabular-nums" style={{ borderColor: '#e0e0e0', color: '#444' }}>
            {fmtKrw(totalStats?.currentValueKrw)}
          </div>
          <div
            className="px-3 py-2 text-xs tabular-nums font-semibold"
            style={{ color: totalStats ? (positive ? '#1a7a3c' : '#c62828') : '#999' }}
          >
            {fmtKrw(totalStats?.profitKrw, { signed: true })}
          </div>
        </div>
        {/* USD/KRW row */}
        <div className="grid grid-cols-5 border-t" style={{ borderColor: '#e0e0e0', background: '#f9f9f9' }}>
          <div className="px-3 py-1.5 text-xs border-r" style={{ borderColor: '#e0e0e0', color: '#888' }}>
            환율 (USD/KRW)
          </div>
          <div className="col-span-4 px-3 py-1.5 text-xs tabular-nums" style={{ color: '#444' }}>
            {fmtUsdKrw(totalStats?.usdKrw)}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
            이번달 총 합계 수익률
          </p>
          <div
            className={`mt-2 text-3xl font-extrabold tabular-nums ${
              totalStats
                ? positive
                  ? 'text-emerald-400'
                  : 'text-red-400'
                : 'text-gray-600'
            }`}
          >
            {fmtRate(totalStats?.profitRate)}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-gray-950/50 px-3 py-2">
            <p className="text-[11px] text-gray-600">총 투자금</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-200">
              {fmtKrw(totalStats?.investmentKrw)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-950/50 px-3 py-2">
            <p className="text-[11px] text-gray-600">현재 평가금</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-200">
              {fmtKrw(totalStats?.currentValueKrw)}
            </p>
          </div>
          <div className="rounded-lg bg-gray-950/50 px-3 py-2">
            <p className="text-[11px] text-gray-600">총 손익</p>
            <p
              className={`mt-1 text-sm font-semibold tabular-nums ${
                totalStats
                  ? positive
                    ? 'text-emerald-400'
                    : 'text-red-400'
                  : 'text-gray-600'
              }`}
            >
              {fmtKrw(totalStats?.profitKrw, { signed: true })}
            </p>
          </div>
          <div className="rounded-lg bg-gray-950/50 px-3 py-2">
            <p className="text-[11px] text-gray-600">USD/KRW</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-gray-200">
              {fmtUsdKrw(totalStats?.usdKrw)}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
