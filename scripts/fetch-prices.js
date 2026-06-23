import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { JUNE_MEMBERS } from '../src/data/members.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHART_START_DATE = '2026-05-22'

const STOCKS = JUNE_MEMBERS.filter(member => member.type === 'stock')
const outPath = path.join(__dirname, '..', 'public', 'data.json')

async function fetchText(url, options = {}) {
  const signal = AbortSignal.timeout(options.timeoutMs ?? 12000)
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
      Accept: options.accept ?? 'application/json',
      ...(options.cookie ? { Cookie: options.cookie } : {}),
    },
    signal,
  })
  if (!res.ok) return null
  return {
    text: await res.text(),
    setCookie: res.headers.get('set-cookie') ?? '',
  }
}

async function fetchJson(url, options = {}) {
  try {
    const result = await fetchText(url, options)
    if (!result?.text) return null
    return JSON.parse(result.text)
  } catch {
    return null
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function getYahooAuth() {
  try {
    const fcResponse = await fetchText('https://fc.yahoo.com/', {
      accept: 'text/html,*/*',
      timeoutMs: 10000,
    })
    const cookieMatch = fcResponse?.setCookie.match(/(?:^|,\s*)(A3=[^;,\s]+)/)
    const cookie = cookieMatch?.[1] ?? ''

    const crumbResponse = await fetchText('https://query2.finance.yahoo.com/v1/test/getcrumb', {
      accept: 'text/plain,*/*',
      cookie: cookie || 'A3=d',
      timeoutMs: 10000,
    })
    const crumbResult = crumbResponse?.text?.trim() ?? ''

    if (crumbResult && crumbResult.length < 60 && !crumbResult.startsWith('<') && !crumbResult.includes('Too Many')) {
      return { crumb: crumbResult, cookie: cookie || '' }
    }
  } catch { /* fallthrough */ }
  return null
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

async function fetchYahooChart(symbol, auth, range = '1d', interval = '1d') {
  const query = range === 'fromStartDate'
    ? `period1=${Math.floor(new Date(`${CHART_START_DATE}T00:00:00Z`).getTime() / 1000)}&period2=${Math.floor(Date.now() / 1000)}`
    : `range=${range}`

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&${query}&includePrePost=false&_=${Date.now()}`
    const data = await fetchJson(url)
    const chart = data?.chart?.result?.[0]
    if (chart?.meta?.regularMarketPrice) return chart
  } catch { /* fallthrough */ }

  await delay(1000)

  if (auth) {
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&${query}&crumb=${encodeURIComponent(auth.crumb)}&_=${Date.now()}`
      const data = await fetchJson(url, { cookie: auth.cookie, timeoutMs: 12000 })
      const chart = data?.chart?.result?.[0]
      if (chart?.meta?.regularMarketPrice) return chart
    } catch { /* fallthrough */ }
  }

  return null
}

async function fetchYahooChartWithRetries(symbol, auth, range = '1d', interval = '1d', attempts = 3) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const chart = await fetchYahooChart(symbol, auth, range, interval)
    if (chart) return chart
    if (attempt < attempts) await delay(1500 * attempt)
  }
  return null
}

async function fetchYahooPrice(symbol, auth) {
  const chart = await fetchYahooChart(symbol, auth)
  return chart?.meta?.regularMarketPrice ?? null
}

async function main() {
  console.log('[fetch-prices] 시세 데이터 수집 시작')

  const auth = await getYahooAuth()
  console.log(auth?.crumb ? '[fetch-prices] Yahoo 인증 성공' : '[fetch-prices] Yahoo 인증 건너뜀')

  const previous = fs.existsSync(outPath)
    ? JSON.parse(fs.readFileSync(outPath, 'utf-8'))
    : {}
  const prices = { ...(previous.prices ?? {}) }
  const histories = { ...(previous.histories ?? {}) }
  const tenMinuteHistories = { ...(previous.tenMinuteHistories ?? {}) }

  for (const s of STOCKS) {
    const [chart, intradayChart] = await Promise.all([
      fetchYahooChartWithRetries(s.symbol, auth, 'fromStartDate'),
      fetchYahooChartWithRetries(s.symbol, auth, '1d', '1m'),
    ])
    const price = chart?.meta?.regularMarketPrice ?? null
    if (price !== null) {
      prices[s.quoteId] = price
      histories[s.quoteId] = parseHistory(chart)
    }
    if (intradayChart) {
      tenMinuteHistories[s.quoteId] = parseTenMinuteHistory(intradayChart)
    }
    console.log(`[fetch-prices] ${s.name} / ${s.stock} (${s.symbol}): ${price ?? '실패'}`)
    await delay(1200)
  }

  const usdKrw = await fetchYahooPrice('USDKRW=X', auth)
  console.log(`[fetch-prices] USD/KRW (USDKRW=X): ${usdKrw ?? '실패'}`)

  const hasJunePrice = STOCKS.some(s => prices[s.quoteId] !== null && prices[s.quoteId] !== undefined)
  if (!hasJunePrice) {
    throw new Error('모든 시세 수집 실패: 기존 data.json을 보존합니다')
  }

  const output = {
    updatedAt: new Date().toISOString(),
    prices,
    histories,
    tenMinuteHistories,
    exchangeRates: {
      usdKrw,
    },
  }

  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log('[fetch-prices] 저장 완료:', outPath)
  console.log('[fetch-prices] 결과:', JSON.stringify(prices))
}

main().catch(err => {
  console.error('[fetch-prices] 오류:', err.message)
})
