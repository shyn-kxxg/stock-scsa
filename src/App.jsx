import { useState, useEffect } from 'react'
import { MEMBERS } from './data/members'
import Dashboard from './components/Dashboard'

export default function App() {
  const [prices, setPrices] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    const base = import.meta.env.BASE_URL ?? '/'
    fetch(`${base}data.json?t=${Date.now()}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        setPrices(data.prices ?? {})
        setUpdatedAt(data.updatedAt ?? null)
      })
      .catch(() => {
        setFetchError(true)
        setPrices({})
      })
      .finally(() => setLoading(false))
  }, [])

  const membersWithStats = MEMBERS.map(m => {
    const currentPrice = prices?.[m.id] ?? null
    const profitRate =
      currentPrice !== null
        ? ((currentPrice - m.purchasePrice) / m.purchasePrice) * 100
        : null
    const profitAmount =
      currentPrice !== null
        ? m.totalInvestment * ((currentPrice / m.purchasePrice) - 1)
        : null
    return { ...m, currentPrice, profitRate, profitAmount }
  })

  return (
    <Dashboard
      members={membersWithStats}
      updatedAt={updatedAt}
      loading={loading}
      fetchError={fetchError}
    />
  )
}
