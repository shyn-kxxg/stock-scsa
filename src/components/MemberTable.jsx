import RacingBar from './RacingBar'
import { useExcelMode } from '../context/ExcelModeContext'

const RANK_LABELS = ['👑 1위', '🥈 2위', '🥉 3위', '4위', '5위', '6위']
const RANK_LABELS_EXCEL = ['1위', '2위', '3위', '4위', '5위', '6위']

function fmtPrice(price, currency) {
  if (price === null) return '-'
  if (currency === 'USD') return `$${price.toFixed(2)}`
  return `₩${Math.round(price).toLocaleString('ko-KR')}`
}

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

export default function MemberTable({ sorted, maxAbsRate }) {
  const { excelMode } = useExcelMode()

  const headers = [
    { label: '순위' },
    { label: '이름' },
    { label: '종목' },
    { label: '구매 단가', className: 'hidden sm:table-cell' },
    { label: '현재 주가', className: 'hidden sm:table-cell' },
    { label: '수익률 그래프' },
    { label: '수익률' },
    { label: '수익 금액' },
    { label: '구매 단가', className: 'sm:hidden' },
    { label: '현재 주가', className: 'sm:hidden' },
  ]

  if (excelMode) {
    return (
      <div className="overflow-x-auto border" style={{ borderColor: '#c0c0c0', fontFamily: 'Calibri, Arial, sans-serif' }}>
        <table className="w-full min-w-[760px] border-collapse" style={{ fontSize: 12 }}>
          <thead>
            <tr style={{ background: '#217346' }}>
              {headers.map((h, index) => (
                <th
                  key={`${h.label}-${index}`}
                  className={`py-2 px-3 text-xs font-semibold text-white whitespace-nowrap text-left first:pl-4 last:pr-4 border-r ${h.className ?? ''}`}
                  style={{ borderColor: '#1a5c30' }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((m, idx) => (
              <tr
                key={m.id}
                style={{
                  background: idx % 2 === 0 ? 'white' : '#EEF4ED',
                  borderBottom: '1px solid #e0e0e0',
                }}
              >
                {/* Rank */}
                <td className="py-2 px-3 pl-4 whitespace-nowrap border-r" style={{ borderColor: '#e0e0e0' }}>
                  <span style={{ color: '#444' }}>{RANK_LABELS_EXCEL[idx]}</span>
                </td>

                {/* Name */}
                <td className="py-2 px-3 whitespace-nowrap border-r" style={{ borderColor: '#e0e0e0' }}>
                  <span style={{ color: m.color, fontWeight: 700 }}>{m.name}</span>
                </td>

                {/* Stock */}
                <td className="py-2 px-3 whitespace-nowrap border-r" style={{ borderColor: '#e0e0e0', color: '#333' }}>
                  {m.stock}
                </td>

                {/* Purchase price - desktop */}
                <td className="hidden sm:table-cell py-2 px-3 whitespace-nowrap text-right border-r" style={{ borderColor: '#e0e0e0', color: '#555' }}>
                  {fmtPrice(m.purchasePrice, m.currency)}
                </td>

                {/* Current price - desktop */}
                <td className="hidden sm:table-cell py-2 px-3 whitespace-nowrap text-right border-r" style={{ borderColor: '#e0e0e0', color: '#222', fontWeight: 600 }}>
                  {fmtPrice(m.currentPrice, m.currency)}
                </td>

                {/* Bar */}
                <td className="py-2 px-3 w-48 min-w-[160px] border-r" style={{ borderColor: '#e0e0e0' }}>
                  <RacingBar rate={m.profitRate} maxAbsRate={maxAbsRate} color={m.color} />
                </td>

                {/* Profit rate */}
                <td className="py-2 px-3 whitespace-nowrap text-right border-r" style={{ borderColor: '#e0e0e0' }}>
                  {fmtRate(m.profitRate, true)}
                </td>

                {/* Profit amount */}
                <td className="py-2 px-3 pr-4 whitespace-nowrap text-right border-r" style={{ borderColor: '#e0e0e0' }}>
                  {fmtAmount(m.profitAmount, m.currency, true)}
                </td>

                {/* Purchase price - mobile */}
                <td className="sm:hidden py-2 px-3 whitespace-nowrap text-right border-r" style={{ borderColor: '#e0e0e0', color: '#555' }}>
                  {fmtPrice(m.purchasePrice, m.currency)}
                </td>

                {/* Current price - mobile */}
                <td className="sm:hidden py-2 px-3 pr-4 whitespace-nowrap text-right" style={{ color: '#222', fontWeight: 600 }}>
                  {fmtPrice(m.currentPrice, m.currency)}
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
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr className="border-b border-gray-800 bg-gray-900/40">
            {headers.map((h, index) => (
              <th
                key={`${h.label}-${index}`}
                className={`py-3 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap text-left first:pl-5 last:pr-5 ${h.className ?? ''}`}
              >
                {h.label}
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
              <td className="py-4 px-3 pl-5 whitespace-nowrap">
                <span className="text-sm text-gray-400">{RANK_LABELS[idx]}</span>
              </td>
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
              <td className="py-4 px-3 whitespace-nowrap">
                <span className="text-sm text-gray-300">{m.stock}</span>
              </td>
              <td className="hidden sm:table-cell py-4 px-3 whitespace-nowrap text-right">
                <span className="text-sm text-gray-400 tabular-nums">
                  {fmtPrice(m.purchasePrice, m.currency)}
                </span>
              </td>
              <td className="hidden sm:table-cell py-4 px-3 whitespace-nowrap text-right">
                <span className="text-sm text-gray-200 tabular-nums font-medium">
                  {fmtPrice(m.currentPrice, m.currency)}
                </span>
              </td>
              <td className="py-4 px-3 w-48 min-w-[160px]">
                <RacingBar rate={m.profitRate} maxAbsRate={maxAbsRate} color={m.color} />
              </td>
              <td className="py-4 px-3 whitespace-nowrap text-right">
                {fmtRate(m.profitRate, false)}
              </td>
              <td className="py-4 px-3 pr-5 whitespace-nowrap text-right">
                {fmtAmount(m.profitAmount, m.currency, false)}
              </td>
              <td className="sm:hidden py-4 px-3 whitespace-nowrap text-right">
                <span className="text-sm text-gray-400 tabular-nums">
                  {fmtPrice(m.purchasePrice, m.currency)}
                </span>
              </td>
              <td className="sm:hidden py-4 px-3 pr-5 whitespace-nowrap text-right">
                <span className="text-sm text-gray-200 tabular-nums font-medium">
                  {fmtPrice(m.currentPrice, m.currency)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
