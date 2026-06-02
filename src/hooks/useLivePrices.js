import { useState, useEffect, useCallback } from 'react'
import { MEMBERS } from '../data/members'

const YAHOO_MEMBERS = MEMBERS.filter(m => m.type === 'stock')
const CHART_START_DATE = '2026-05-22'

// Yahoo Finance v8 chart endpoint (no API key, publicly documented)
function yahooUrl(symbol, range = '1d') {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}&includePrePost=false`
}

function yahooHistoryUrl(symbol) {
  const period1 = Math.floor(new Date(`${CHART_START_DATE}T00:00:00Z`).getTime() / 1000)
  const period2 = Math.floor(Date.now() / 1000)
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}&includePrePost=false`
}

// CORS proxies tried in order
const PROXIES = [
  url => url,                                                        // direct (works if Yahoo allows CORS for this IP)
  url => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  url => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
]

async function fetchChartWithProxyFallback(rawUrl, expectedSymbol) {
  for (const proxy of PROXIES) {
    try {
      const res = await fetch(proxy(rawUrl), {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const data = await res.json()
      const meta = data?.chart?.result?.[0]?.meta
      if (expectedSymbol && meta?.symbol && meta.symbol !== expectedSymbol) continue
      if (meta) return data?.chart?.result?.[0] ?? null
    } catch {
      // try next proxy
    }
  }
  return null
}

async function fetchYahooPrice(symbol) {
  const chart = await fetchChartWithProxyFallback(yahooUrl(symbol), symbol)
  return chart?.meta?.regularMarketPrice ?? null
}

function parseHistory(chart) {
  const timestamps = chart?.timestamp ?? []
  const closes = chart?.indicators?.quote?.[0]?.close ?? []
  return timestamps
    .map((timestamp, index) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
    }))
    .filter(point => Number.isFinite(point.close) && point.date >= CHART_START_DATE)
}

async function fetchYahooMarketData(symbol) {
  const chart = await fetchChartWithProxyFallback(yahooHistoryUrl(symbol), symbol)
  return {
    price: chart?.meta?.regularMarketPrice ?? null,
    history: parseHistory(chart),
  }
}

async function fetchAllMarketData() {
  const stockResults = await Promise.all(
    YAHOO_MEMBERS.map(m => fetchYahooMarketData(m.symbol).then(data => [m.id, data])),
  )

  const prices = {}
  const histories = {}

  for (const [id, data] of stockResults) {
    prices[id] = data.price
    histories[id] = data.history
  }

  return { prices, histories }
}

async function fetchUsdKrw() {
  return fetchYahooPrice('USDKRW=X')
}

async function fetchSnapshotPrices() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data.json`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const data = await res.json()
    const prices = data?.prices ?? null
    if (!prices || !Object.values(prices).some(p => p !== null)) return null
    return {
      prices,
      histories: data?.histories ?? {},
      usdKrw: data?.exchangeRates?.usdKrw ?? null,
      updatedAt: data.updatedAt ?? null,
    }
  } catch {
    return null
  }
}

const REFRESH_INTERVAL_MS = 5 * 60 * 1000 // 5분마다 자동 갱신

export function useLivePrices() {
  const [prices, setPrices] = useState(null)
  const [histories, setHistories] = useState({})
  const [usdKrw, setUsdKrw] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const snapshot = await fetchSnapshotPrices()
      if (snapshot) {
        setPrices(snapshot.prices)
        setHistories(snapshot.histories)
        setUsdKrw(snapshot.usdKrw)
        setUpdatedAt(snapshot.updatedAt)
        setIsLive(false)
      }

      const [liveData, liveUsdKrw] = await Promise.all([
        fetchAllMarketData(),
        fetchUsdKrw(),
      ])
      const liveResult = liveData.prices
      const anyLiveSuccess = Object.values(liveResult).some(p => p !== null)
      if (anyLiveSuccess || liveUsdKrw !== null) {
        const merged = {
          ...(snapshot?.prices ?? {}),
          ...Object.fromEntries(Object.entries(liveResult).filter(([, price]) => price !== null)),
        }
        const mergedHistories = {
          ...(snapshot?.histories ?? {}),
          ...Object.fromEntries(
            Object.entries(liveData.histories).filter(([, history]) => history.length > 0),
          ),
        }
        setPrices(merged)
        setHistories(mergedHistories)
        setUsdKrw(liveUsdKrw ?? snapshot?.usdKrw ?? null)
        setUpdatedAt(new Date().toISOString())
        setIsLive(true)
      } else if (!snapshot) {
        setError(true)
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [refresh])

  return { prices, histories, usdKrw, updatedAt, loading, isLive, error, refresh }
}
