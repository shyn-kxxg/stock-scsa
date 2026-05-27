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
  const positive = totalStats?.profitRate >= 0

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
