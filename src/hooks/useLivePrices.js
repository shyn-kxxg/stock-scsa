import { useState, useEffect, useCallback } from 'react'
import { JUNE_MEMBERS, QUOTE_MEMBERS } from '../data/members'

const YAHOO_MEMBERS = JUNE_MEMBERS.filter(m => m.type === 'stock')
const CHART_START_DATE = '2026-05-22'

// Yahoo Finance v8 chart endpoint (no API key, publicly documented)
function yahooUrl(symbol, range = '1d') {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}&includePrePost=false&_=${Date.now()}`
}

function yahooHistoryUrl(symbol) {
  const period1 = Math.floor(new Date(`${CHART_START_DATE}T00:00:00Z`).getTime() / 1000)
  const period2 = Math.floor(Date.now() / 1000)
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}&includePrePost=false&_=${Date.now()}`
}

function validNumber(value) {
  return Number.isFinite(value) ? value : null
}

function validDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function parseChartPayload(text) {
  try {
    return JSON.parse(text)
  } catch {
    const jsonText = text.match(/Markdown Content:\s*({[\s\S]*})\s*$/)?.[1]
    return jsonText ? JSON.parse(jsonText) : null
  }
}

const CHART_URLS = [
  rawUrl => rawUrl,
  rawUrl => `https://r.jina.ai/http://${rawUrl}`,
]

async function fetchChart(rawUrl, expectedSymbol) {
  for (const chartUrl of CHART_URLS) {
    const chart = await fetchChartUrl(chartUrl(rawUrl), expectedSymbol)
    if (chart) return chart
  }
  return null
}

async function fetchChartUrl(rawUrl, expectedSymbol) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(rawUrl, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = parseChartPayload(await res.text())
    const chart = data?.chart?.result?.[0] ?? null
    const meta = chart?.meta
    if (!meta) return null
    if (expectedSymbol && meta.symbol && meta.symbol !== expectedSymbol) return null
    return chart
  } catch {
    return null
  } finally {
    window.clearTimeout(timeoutId)
  }
}

async function fetchYahooPrice(symbol) {
  const chart = await fetchChart(yahooUrl(symbol), symbol)
  return validNumber(chart?.meta?.regularMarketPrice)
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

function parseTenMinuteHistory(chart) {
  const timestamps = chart?.timestamp ?? []
  const closes = chart?.indicators?.quote?.[0]?.close ?? []
  const buckets = new Map()

  for (let index = 0; index < timestamps.length; index += 1) {
    const close = closes[index]
    if (!Number.isFinite(close)) continue
    const timestampMs = timestamps[index] * 1000
    const bucketMs = Math.floor(timestampMs / (10 * 60 * 1000)) * 10 * 60 * 1000
    buckets.set(bucketMs, {
      timestamp: new Date(bucketMs).toISOString(),
      close,
    })
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, point]) => point)
}

async function fetchYahooMarketData(symbol) {
  const chart = await fetchChart(yahooHistoryUrl(symbol), symbol)
  return {
    price: validNumber(chart?.meta?.regularMarketPrice),
    history: parseHistory(chart),
    tenMinuteHistory: [],
  }
}

async function fetchAllMarketData() {
  const stockResults = await Promise.all(
    YAHOO_MEMBERS.map(m => fetchYahooMarketData(m.symbol).then(data => [m.quoteId, data])),
  )

  const prices = {}
  const histories = {}
  const tenMinuteHistories = {}

  for (const [id, data] of stockResults) {
    prices[id] = data.price
    histories[id] = data.history
    tenMinuteHistories[id] = data.tenMinuteHistory
  }

  return { prices, histories, tenMinuteHistories }
}

async function fetchUsdKrw() {
  return fetchYahooPrice('USDKRW=X')
}

async function fetchSnapshotPrices() {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), 8000)
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data.json`, {
      cache: 'no-store',
      signal: controller.signal,
    })
    if (!res.ok) return null
    const data = await res.json()
    const rawPrices = data?.prices ?? null
    const prices = rawPrices && Object.fromEntries(
      QUOTE_MEMBERS.map(member => [member.quoteId, validNumber(rawPrices[member.quoteId])]),
    )
    if (!prices || !Object.values(prices).some(p => p !== null)) return null
    const rawHistories = data?.histories ?? {}
    const histories = Object.fromEntries(
      QUOTE_MEMBERS.map(member => [
        member.quoteId,
        (rawHistories[member.quoteId] ?? []).filter(point => (
          validDateString(point?.date) && Number.isFinite(point?.close)
        )),
      ]),
    )
    const rawTenMinuteHistories = data?.tenMinuteHistories ?? {}
    const tenMinuteHistories = Object.fromEntries(
      QUOTE_MEMBERS.map(member => [
        member.quoteId,
        (rawTenMinuteHistories[member.quoteId] ?? []).filter(point => (
          typeof point?.timestamp === 'string' && Number.isFinite(point?.close)
        )),
      ]),
    )
    return {
      prices,
      histories,
      tenMinuteHistories,
      usdKrw: validNumber(data?.exchangeRates?.usdKrw),
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
    }
  } catch {
    return null
  } finally {
    window.clearTimeout(timeoutId)
  }
}

const REFRESH_INTERVAL_MS = 60 * 1000 // 1분마다 실시간 시세 재호출

export function useLivePrices() {
  const [prices, setPrices] = useState(null)
  const [histories, setHistories] = useState({})
  const [tenMinuteHistories, setTenMinuteHistories] = useState({})
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
        setTenMinuteHistories(snapshot.tenMinuteHistories)
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
        const mergedTenMinuteHistories = {
          ...(snapshot?.tenMinuteHistories ?? {}),
          ...Object.fromEntries(
            Object.entries(liveData.tenMinuteHistories).filter(([, history]) => history.length > 0),
          ),
        }
        setPrices(merged)
        setHistories(mergedHistories)
        setTenMinuteHistories(mergedTenMinuteHistories)
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
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [refresh])

  return { prices, histories, tenMinuteHistories, usdKrw, updatedAt, loading, isLive, error, refresh }
}
