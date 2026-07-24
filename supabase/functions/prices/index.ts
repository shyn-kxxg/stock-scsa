const CHART_START_DATE = '2026-05-22'
const SNAPSHOT_KEY = 'latest'
const CACHE_TTL_SECONDS = Number(Deno.env.get('PRICE_CACHE_TTL_SECONDS') ?? '60')

const QUOTES = [
  { quoteId: '2026-07-seunggi', name: '승기', stock: '블룸에너지', symbol: 'BE' },
  { quoteId: '2026-07-junyoung', name: '준영', stock: 'SK하이닉스', symbol: '000660.KS' },
  { quoteId: '2026-07-yewon', name: '예원', stock: '알테오젠', symbol: '196170.KQ' },
  { quoteId: '2026-07-hyemin', name: '혜민', stock: '제너럴일렉트릭', symbol: 'GE' },
  { quoteId: '2026-07-hyejun', name: '혜준', stock: '버티브홀딩스', symbol: 'VRT' },
  { quoteId: '2026-07-seohyeon', name: '서현', stock: '아마존', symbol: 'AMZN' },
]

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

function jsonResponse(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers)
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value)
  }
  headers.set('Content-Type', 'application/json')

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  })
}

function yahooHistoryUrl(symbol: string) {
  const period1 = Math.floor(new Date(`${CHART_START_DATE}T00:00:00Z`).getTime() / 1000)
  const period2 = Math.floor(Date.now() / 1000)
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&period1=${period1}&period2=${period2}&includePrePost=false&_=${Date.now()}`
}

function yahooIntradayUrl(symbol: string) {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1m&range=1d&includePrePost=false&_=${Date.now()}`
}

function yahooUrl(symbol: string) {
  return `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false&_=${Date.now()}`
}

function validNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function parseHistory(chart: any) {
  const timestamps = chart?.timestamp ?? []
  const closes = chart?.indicators?.quote?.[0]?.close ?? []
  return timestamps
    .map((timestamp: number, index: number) => ({
      date: new Date(timestamp * 1000).toISOString().slice(0, 10),
      close: closes[index],
    }))
    .filter((point: { date: string; close: unknown }) => (
      typeof point.close === 'number' && Number.isFinite(point.close) && point.date >= CHART_START_DATE
    ))
}

function parseTenMinuteHistory(chart: any) {
  const timestamps = chart?.timestamp ?? []
  const closes = chart?.indicators?.quote?.[0]?.close ?? []
  const buckets = new Map<number, { timestamp: string; close: number }>()

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

async function fetchYahooChart(url: string, expectedSymbol?: string) {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0',
      },
    })
    if (!response.ok) return null
    const data = await response.json()
    const chart = data?.chart?.result?.[0] ?? null
    const meta = chart?.meta
    if (!meta) return null
    if (expectedSymbol && meta.symbol && meta.symbol !== expectedSymbol) return null
    return chart
  } catch {
    return null
  }
}

async function getStoredSnapshot() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return null

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, '')}/rest/v1/price_snapshots?key=eq.${SNAPSHOT_KEY}&select=data,updated_at&limit=1`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  )
  if (!response.ok) return null
  const rows = await response.json()
  const row = rows?.[0]
  return row ? { data: row.data, updatedAt: row.updated_at as string } : null
}

async function saveStoredSnapshot(data: unknown) {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) return

  await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/price_snapshots?on_conflict=key`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      key: SNAPSHOT_KEY,
      data,
      updated_at: new Date().toISOString(),
    }),
  })
}

function isFresh(iso?: string | null) {
  if (!iso) return false
  return Date.now() - new Date(iso).getTime() < CACHE_TTL_SECONDS * 1000
}

async function fetchLiveSnapshot(previous: any = {}) {
  const prices = { ...(previous.prices ?? {}) }
  const histories = { ...(previous.histories ?? {}) }
  const tenMinuteHistories = { ...(previous.tenMinuteHistories ?? {}) }

  const results = await Promise.all(QUOTES.map(async quote => {
    const [historyChart, intradayChart] = await Promise.all([
      fetchYahooChart(yahooHistoryUrl(quote.symbol), quote.symbol),
      fetchYahooChart(yahooIntradayUrl(quote.symbol), quote.symbol),
    ])
    return { quote, historyChart, intradayChart }
  }))

  for (const { quote, historyChart, intradayChart } of results) {
    const price = validNumber(historyChart?.meta?.regularMarketPrice)
    if (price !== null) {
      prices[quote.quoteId] = price
      histories[quote.quoteId] = parseHistory(historyChart)
    }
    if (intradayChart) {
      tenMinuteHistories[quote.quoteId] = parseTenMinuteHistory(intradayChart)
    }
  }

  const usdKrwChart = await fetchYahooChart(yahooUrl('USDKRW=X'), 'USDKRW=X')
  const usdKrw = validNumber(usdKrwChart?.meta?.regularMarketPrice)

  return {
    updatedAt: new Date().toISOString(),
    prices,
    histories,
    tenMinuteHistories,
    exchangeRates: {
      usdKrw: usdKrw ?? previous.exchangeRates?.usdKrw ?? null,
    },
  }
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (request.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, { status: 405 })
  }

  const url = new URL(request.url)
  const force = url.searchParams.get('refresh') === '1'
  const stored = await getStoredSnapshot()

  if (!force && stored?.data && isFresh(stored.updatedAt)) {
    return jsonResponse(stored.data, {
      headers: {
        'Cache-Control': 'public, max-age=30',
        'X-Price-Source': 'supabase-cache',
      },
    })
  }

  const data = await fetchLiveSnapshot(stored?.data)
  await saveStoredSnapshot(data)
  return jsonResponse(data, {
    headers: {
      'Cache-Control': 'public, max-age=30',
      'X-Price-Source': 'yahoo-live',
    },
  })
})
