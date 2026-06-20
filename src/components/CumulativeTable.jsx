import RacingBar from './RacingBar'
import { useExcelMode } from '../context/ExcelModeContext'

const RANK_LABELS = ['1위', '2위', '3위', '4위', '5위', '6위']

function fmtRate(rate, excelMode) {
  if (rate === null) {
    return excelMode
      ? <span style={{ color: '#999' }}>-</span>
      : <span className="text-gray-600 text-sm">-</span>
  }
  const positive = rate >= 0
  const sign = positive ? '+' : ''
  if (excelMode) {
    return (
      <span style={{ color: positive ? '#1a7a3c' : '#c62828', fontWeight: 700 }}>
        {sign}{rate.toFixed(2)}%
      </span>
    )
  }
  return (
    <span className={`font-bold tabular-nums ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {sign}{rate.toFixed(2)}%
    </span>
  )
}

function fmtAmount(amount, currency, excelMode) {
  if (amount === null) {
    return excelMode
      ? <span style={{ color: '#999' }}>-</span>
      : <span className="text-gray-600 text-sm">-</span>
  }
  const positive = amount >= 0
  const sign = positive ? '+' : '-'
  const abs = Math.abs(amount)
  const str =
    currency === 'USD'
      ? `${sign}$${abs.toFixed(2)}`
      : `${sign}₩${Math.round(abs).toLocaleString('ko-KR')}`
  if (excelMode) {
    return (
      <span style={{ color: positive ? '#1a7a3c' : '#c62828', fontWeight: 600 }}>
        {str}
      </span>
    )
  }
  return (
    <span className={`font-semibold tabular-nums ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {str}
    </span>
  )
}

export default function CumulativeTable({ rows, maxAbsRate }) {
  const { excelMode } = useExcelMode()
  const sorted = [...rows].sort((a, b) => {
    if (a.profitRate === null && b.profitRate === null) return 0
    if (a.profitRate === null) return 1
    if (b.profitRate === null) return -1
    return b.profitRate - a.profitRate
  })

  const headers = ['순위', '이름', '누적 수익률 그래프', '누적 수익률', '누적 수익 금액', '집계 월']

  if (excelMode) {
    return (
      <div className="overflow-x-auto border" style={{ borderColor: '#c0c0c0', fontFamily: 'Calibri, Arial, sans-serif' }}>
        <table className="w-full min-w-[620px] border-collapse" style={{ fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#217346' }}>
              {headers.map(header => (
                <th
                  key={header}
                  className="py-2 px-3 text-xs font-semibold text-white whitespace-nowrap text-left first:pl-4 last:pr-4 border-r"
                  style={{ borderColor: '#1a5c30' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, idx) => (
              <tr
                key={row.id}
                style={{
                  background: idx % 2 === 0 ? 'white' : '#EEF4ED',
                  borderBottom: '1px solid #e0e0e0',
                }}
              >
                <td className="py-2 px-3 pl-4 whitespace-nowrap border-r" style={{ borderColor: '#e0e0e0', color: '#444' }}>
                  {RANK_LABELS[idx]}
                </td>
                <td className="py-2 px-3 whitespace-nowrap border-r" style={{ borderColor: '#e0e0e0' }}>
                  <span style={{ color: row.color, fontWeight: 700 }}>{row.name}</span>
                </td>
                <td className="py-2 px-3 w-52 min-w-[180px] border-r" style={{ borderColor: '#e0e0e0' }}>
                  <RacingBar rate={row.profitRate} maxAbsRate={maxAbsRate} color={row.color} />
                </td>
                <td className="py-2 px-3 whitespace-nowrap text-right border-r" style={{ borderColor: '#e0e0e0' }}>
                  {fmtRate(row.profitRate, true)}
                </td>
                <td className="py-2 px-3 whitespace-nowrap text-right border-r" style={{ borderColor: '#e0e0e0' }}>
                  {fmtAmount(row.profitAmount, row.currency, true)}
                </td>
                <td className="py-2 px-3 pr-4 whitespace-nowrap text-right" style={{ color: '#444' }}>
                  {row.monthCount}개월
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-800">
      <table className="w-full min-w-[620px] border-collapse">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/40">
            {headers.map(header => (
              <th
                key={header}
                className="py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-left first:pl-5 last:pr-5"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row, idx) => (
            <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
              <td className="py-4 px-3 pl-5 whitespace-nowrap">
                <span className="text-sm text-gray-400">{RANK_LABELS[idx]}</span>
              </td>
              <td className="py-4 px-3 whitespace-nowrap">
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-bold"
                  style={{
                    backgroundColor: `${row.color}18`,
                    color: row.color,
                    border: `1px solid ${row.color}44`,
                  }}
                >
                  {row.name}
                </div>
              </td>
              <td className="py-4 px-3 w-52 min-w-[180px]">
                <RacingBar rate={row.profitRate} maxAbsRate={maxAbsRate} color={row.color} />
              </td>
              <td className="py-4 px-3 whitespace-nowrap text-right">
                {fmtRate(row.profitRate, false)}
              </td>
              <td className="py-4 px-3 whitespace-nowrap text-right">
                {fmtAmount(row.profitAmount, row.currency, false)}
              </td>
              <td className="py-4 px-3 pr-5 whitespace-nowrap text-right text-sm text-gray-400">
                {row.monthCount}개월
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
