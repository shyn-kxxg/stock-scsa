import { MEMBERS } from './data/members'
import { useLivePrices } from './hooks/useLivePrices'
import Dashboard from './components/Dashboard'
import { ExcelModeProvider } from './context/ExcelModeContext'
import { useMemo, useState } from 'react'

const MONTHS = [
  {
    id: '2026-05',
    label: '5월',
    title: '2026년 5월',
    startDate: '2026-05-22',
    endDate: '2026-06-19',
    members: MEMBERS,
  },
  {
    id: '2026-06',
    label: '6월',
    title: '2026년 6월',
    startDate: '2026-06-20',
    members: MEMBERS,
  },
]

function latestCloseInRange(history, startDate, endDate) {
  const rows = (history ?? [])
    .filter(point => point.date >= startDate && (!endDate || point.date <= endDate))
    .sort((a, b) => a.date.localeCompare(b.date))
  return rows.at(-1)?.close ?? null
}

function kstDateString(iso) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return formatter.format(iso ? new Date(iso) : new Date())
}

const KST_MARKET_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function isKoreanMarketOpen(timestamp = Date.now()) {
  const parts = Object.fromEntries(
    KST_MARKET_TIME_FORMATTER
      .formatToParts(new Date(timestamp))
      .map(part => [part.type, part.value]),
  )
  if (parts.weekday === 'Sat' || parts.weekday === 'Sun') return false
  const hour = Number(parts.hour === '24' ? '0' : parts.hour)
  const minute = Number(parts.minute)
  const minutes = hour * 60 + minute
  return minutes >= 9 * 60 && minutes <= 15 * 60 + 30
}

function currentTenMinuteTimestamp() {
  const bucketMs = Math.floor(Date.now() / (10 * 60 * 1000)) * 10 * 60 * 1000
  return new Date(bucketMs).toISOString()
}

function buildTenMinuteRates(member, tenMinuteHistory, currentPrice, month) {
  const points = (tenMinuteHistory ?? [])
    .filter(point => {
      const date = kstDateString(point.timestamp)
      return date >= month.startDate && (!month.endDate || date <= month.endDate)
    })
    .map(point => ({
      date: point.timestamp,
      rate: ((point.close - member.purchasePrice) / member.purchasePrice) * 100,
    }))
    .filter(point => Number.isFinite(point.rate))

  const today = kstDateString()
  const todayInMonth = today >= month.startDate && (!month.endDate || today <= month.endDate)
  if (todayInMonth && isKoreanMarketOpen() && currentPrice !== null) {
    const livePoint = {
      date: currentTenMinuteTimestamp(),
      rate: ((currentPrice - member.purchasePrice) / member.purchasePrice) * 100,
    }
    const lastIndex = points.findIndex(point => point.date === livePoint.date)
    if (lastIndex >= 0) {
      points[lastIndex] = livePoint
    } else {
      points.push(livePoint)
    }
  }

  return points.sort((a, b) => a.date.localeCompare(b.date))
}

function buildMonthlyMembers(month, { prices, histories, tenMinuteHistories, usdKrw }) {
  return month.members.map(m => {
    const history = histories?.[m.id] ?? []
    const monthClose = latestCloseInRange(history, month.startDate, month.endDate)
    const currentPrice = month.endDate
      ? monthClose
      : prices?.[m.id] ?? monthClose
    const rangedHistory = history
      .filter(point => point.date >= month.startDate && (!month.endDate || point.date <= month.endDate))

    if (!month.endDate && currentPrice !== null) {
      const today = kstDateString()
      const lastHistoryDate = rangedHistory.at(-1)?.date
      if (!lastHistoryDate || lastHistoryDate < today) {
        rangedHistory.push({ date: today, close: currentPrice })
      }
    }

    const historyRates = rangedHistory
      .map(point => ({
        date: point.date,
        rate: ((point.close - m.purchasePrice) / m.purchasePrice) * 100,
      }))

    const profitRate =
      currentPrice !== null
        ? ((currentPrice - m.purchasePrice) / m.purchasePrice) * 100
        : null
    const profitAmount =
      currentPrice !== null
        ? m.totalInvestment * (currentPrice / m.purchasePrice - 1)
        : null
    const krwRate = m.currency === 'USD' ? usdKrw : 1
    const investmentKrw = krwRate ? m.totalInvestment * krwRate : null
    const currentValueKrw =
      currentPrice !== null && krwRate
        ? m.totalInvestment * (currentPrice / m.purchasePrice) * krwRate
        : null

    return {
      ...m,
      currentPrice,
      historyRates,
      tenMinuteRates: buildTenMinuteRates(m, tenMinuteHistories?.[m.id], currentPrice, month),
      profitRate,
      profitAmount,
      investmentKrw,
      currentValueKrw,
      monthId: month.id,
    }
  })
}

function buildTotalStats(members, usdKrw) {
  const rows = members.filter(m => m.investmentKrw !== null && m.currentValueKrw !== null)
  if (rows.length !== members.length) return null
  const investmentKrw = rows.reduce((sum, m) => sum + m.investmentKrw, 0)
  const currentValueKrw = rows.reduce((sum, m) => sum + m.currentValueKrw, 0)
  const profitKrw = currentValueKrw - investmentKrw
  const profitRate = investmentKrw > 0 ? (profitKrw / investmentKrw) * 100 : null
  return { investmentKrw, currentValueKrw, profitKrw, profitRate, usdKrw }
}

export default function App() {
  const { prices, histories, tenMinuteHistories, usdKrw, updatedAt, loading, isLive, error, refresh } = useLivePrices()
  const [activeMonthId, setActiveMonthId] = useState(MONTHS.at(-1).id)

  const monthViews = useMemo(() => MONTHS.map(month => {
    const members = buildMonthlyMembers(month, { prices, histories, tenMinuteHistories, usdKrw })
    return {
      ...month,
      members,
      totalStats: buildTotalStats(members, usdKrw),
    }
  }), [prices, histories, tenMinuteHistories, usdKrw])

  const activeMonth = monthViews.find(month => month.id === activeMonthId) ?? monthViews.at(-1)
  const cumulativeMembers = useMemo(() => MEMBERS.map(member => {
    const rows = monthViews
      .map(month => month.members.find(row => row.id === member.id))
      .filter(Boolean)
    const completedRows = rows.filter(row => row.profitAmount !== null)
    const totalInvestment = completedRows.reduce((sum, row) => sum + row.totalInvestment, 0)
    const profitAmount = completedRows.reduce((sum, row) => sum + row.profitAmount, 0)
    const profitRate = totalInvestment > 0 ? (profitAmount / totalInvestment) * 100 : null
    return {
      ...member,
      profitRate,
      profitAmount: completedRows.length > 0 ? profitAmount : null,
      monthCount: completedRows.length,
    }
  }), [monthViews])

  return (
    <ExcelModeProvider>
      <Dashboard
        members={activeMonth.members}
        totalStats={activeMonth.totalStats}
        months={monthViews}
        activeMonthId={activeMonth.id}
        onMonthChange={setActiveMonthId}
        cumulativeMembers={cumulativeMembers}
        updatedAt={updatedAt}
        loading={loading}
        isLive={isLive}
        fetchError={error}
        onRefresh={refresh}
      />
    </ExcelModeProvider>
  )
}
