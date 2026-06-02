import { MEMBERS } from './data/members'
import { useLivePrices } from './hooks/useLivePrices'
import Dashboard from './components/Dashboard'

const CHART_START_DATE = '2026-05-22'

export default function App() {
  const { prices, histories, usdKrw, updatedAt, loading, isLive, error, refresh } = useLivePrices()

  const membersWithStats = MEMBERS.map(m => {
    const currentPrice = prices?.[m.id] ?? null
    const historyRates = (histories?.[m.id] ?? [])
      .filter(point => point.date >= CHART_START_DATE)
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
      profitRate,
      profitAmount,
      investmentKrw,
      currentValueKrw,
    }
  })

  const totalStats = (() => {
    const rows = membersWithStats.filter(m => m.investmentKrw !== null && m.currentValueKrw !== null)
    if (rows.length !== MEMBERS.length) return null
    const investmentKrw = rows.reduce((sum, m) => sum + m.investmentKrw, 0)
    const currentValueKrw = rows.reduce((sum, m) => sum + m.currentValueKrw, 0)
    const profitKrw = currentValueKrw - investmentKrw
    const profitRate = investmentKrw > 0 ? (profitKrw / investmentKrw) * 100 : null
    return { investmentKrw, currentValueKrw, profitKrw, profitRate, usdKrw }
  })()

  return (
    <Dashboard
      members={membersWithStats}
      totalStats={totalStats}
      updatedAt={updatedAt}
      loading={loading}
      isLive={isLive}
      fetchError={error}
      onRefresh={refresh}
    />
  )
}
