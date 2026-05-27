import RacingBar from './RacingBar'

const RANK_LABELS = ['👑 1위', '🥈 2위', '🥉 3위', '4위', '5위', '6위']

function fmtPrice(price, currency) {
  if (price === null) return <span className="text-gray-600">-</span>
  if (currency === 'USD') return `$${price.toFixed(2)}`
  return `₩${Math.round(price).toLocaleString('ko-KR')}`
}

function fmtRate(rate) {
  if (rate === null) return <span className="text-gray-600 text-sm">-</span>
  const positive = rate >= 0
  const sign = positive ? '+' : ''
  return (
    <span
      className={`font-bold tabular-nums ${positive ? 'text-emerald-400' : 'text-red-400'}`}
    >
      {sign}{rate.toFixed(2)}%
    </span>
  )
}

function fmtAmount(amount, currency) {
  if (amount === null) return <span className="text-gray-600 text-sm">-</span>
  const positive = amount >= 0
  const sign = positive ? '+' : '-'
  const abs = Math.abs(amount)
  const str =
    currency === 'USD'
      ? `${sign}$${abs.toFixed(2)}`
      : `${sign}₩${Math.round(abs).toLocaleString('ko-KR')}`
  return (
    <span className={`font-semibold tabular-nums ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {str}
    </span>
  )
}

export default function MemberTable({ sorted, maxAbsRate }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full min-w-[720px] border-collapse">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/40">
            {['순위', '이름', '종목', '구매 단가', '현재 주가', '수익률 그래프', '수익률', '수익 금액'].map(h => (
              <th
                key={h}
                className="py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-left first:pl-5 last:pr-5"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, idx) => (
            <tr
              key={m.id}
              className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors"
            >
              {/* Rank */}
              <td className="py-4 px-3 pl-5 whitespace-nowrap">
                <span className="text-sm text-gray-400">{RANK_LABELS[idx]}</span>
              </td>

              {/* Name */}
              <td className="py-4 px-3 whitespace-nowrap">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: `${m.color}18`,
                    color: m.color,
                    border: `1px solid ${m.color}44`,
                  }}
                >
                  {m.name}
                </div>
              </td>

              {/* Stock */}
              <td className="py-4 px-3 whitespace-nowrap">
                <span className="text-sm text-gray-300">{m.stock}</span>
              </td>

              {/* Purchase price */}
              <td className="py-4 px-3 whitespace-nowrap text-right">
                <span className="text-sm text-gray-400 tabular-nums">
                  {fmtPrice(m.purchasePrice, m.currency)}
                </span>
              </td>

              {/* Current price */}
              <td className="py-4 px-3 whitespace-nowrap text-right">
                <span className="text-sm text-gray-200 tabular-nums font-medium">
                  {fmtPrice(m.currentPrice, m.currency)}
                </span>
              </td>

              {/* Bar */}
              <td className="py-4 px-3 w-48 min-w-[160px]">
                <RacingBar
                  rate={m.profitRate}
                  maxAbsRate={maxAbsRate}
                  color={m.color}
                />
              </td>

              {/* Profit rate */}
              <td className="py-4 px-3 whitespace-nowrap text-right">
                {fmtRate(m.profitRate)}
              </td>

              {/* Profit amount */}
              <td className="py-4 px-3 pr-5 whitespace-nowrap text-right">
                {fmtAmount(m.profitAmount, m.currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
