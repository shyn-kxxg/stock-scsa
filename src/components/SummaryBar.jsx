function fmt(rate) {
  if (rate === null) return '···'
  const sign = rate >= 0 ? '+' : ''
  return `${sign}${rate.toFixed(2)}%`
}

const RANK_ICONS = ['👑', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣']

export default function SummaryBar({ sorted }) {
  return (
    <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
      <div className="flex flex-wrap gap-x-1 gap-y-2 items-center justify-center">
        {sorted.map((m, idx) => {
          const positive = m.profitRate !== null && m.profitRate >= 0
          const negative = m.profitRate !== null && m.profitRate < 0
          return (
            <div key={m.id} className="flex items-center gap-1">
              {idx > 0 && (
                <span className="text-gray-700 hidden sm:inline px-1">|</span>
              )}
              <span className="text-xs text-gray-500">{RANK_ICONS[idx]}</span>
              <span className="text-sm font-semibold" style={{ color: m.color }}>
                🐴 {m.name}
              </span>
              <span
                className={`text-sm font-bold tabular-nums ${
                  positive
                    ? 'text-emerald-400'
                    : negative
                    ? 'text-red-400'
                    : 'text-gray-500'
                }`}
              >
                {fmt(m.profitRate)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
