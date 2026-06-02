import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const CHART_START_DATE = '2026-05-22'

// ── 종목 설정 ────────────────────────────────────────────────────────────────
// Yahoo Finance 심볼: .KS = 코스피, .KQ = 코스닥
// 심볼 확인: https://finance.yahoo.com/lookup
const KRX_STOCKS = [
  { id: 'hyemin',   symbol: '067990.KQ', name: '도이치모터스' },
  { id: 'hyejun',   symbol: '069960.KS', name: '현대백화점'   },
  { id: 'seunggi',  symbol: '008970.KS', name: 'KBI동양철관'  },
  { id: 'junyoung', symbol: '005380.KS', name: '현대차'        },
  { id: 'yewon',    symbol: '032300.KQ', name: '한국파마'      },
  { id: 'seohyeon', symbol: 'QTUM',      name: 'QTUM ETF'      },
]
// ─────────────────────────────────────────────────────────────────────────────

function curlGet(url) {
  try {
    const result = execSync(
      `curl -s --max-time 12 --retry 2 --retry-delay 3 -H "User-Agent: Mozilla/5.0" -H "Accept: application/json" "${url}"`,
      { encoding: 'utf-8', timeout: 20000 }
    )
    return JSON.parse(result)
  } catch {
    return null
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms))
}

async function getYahooAuth() {
  try {
    const cookie = execSync(
      'curl -s --max-time 10 -c - -H "User-Agent: Mozilla/5.0" "https://fc.yahoo.com/" | awk \'/A3/{print "A3=" $NF}\'',
      { encoding: 'utf-8', timeout: 15000 }
    ).trim()

    const crumbResult = execSync(
      `curl -s --max-time 10 -H "User-Agent: Mozilla/5.0" -H "Cookie: ${cookie || 'A3=d'}" "https://query2.finance.yahoo.com/v1/test/getcrumb"`,
      { encoding: 'utf-8', timeout: 15000 }
    ).trim()

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

async function fetchYahooChart(symbol, auth, range = '1d') {
  const query = range === 'fromStartDate'
    ? `period1=${Math.floor(new Date(`${CHART_START_DATE}T00:00:00Z`).getTime() / 1000)}&period2=${Math.floor(Date.now() / 1000)}`
    : `range=${range}`

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&${query}&includePrePost=false`
    const data = curlGet(url)
    const chart = data?.chart?.result?.[0]
    if (chart?.meta?.regularMarketPrice) return chart
  } catch { /* fallthrough */ }

  await delay(1000)

  if (auth) {
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&${query}&crumb=${encodeURIComponent(auth.crumb)}`
      const result = execSync(
        `curl -s --max-time 12 --retry 1 -H "User-Agent: Mozilla/5.0" -H "Accept: application/json" -H "Cookie: ${auth.cookie}" "${url}"`,
        { encoding: 'utf-8', timeout: 18000 }
      )
      const data = JSON.parse(result)
      const chart = data?.chart?.result?.[0]
      if (chart?.meta?.regularMarketPrice) return chart
    } catch { /* fallthrough */ }
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
  console.log(auth?.crumb ? `[fetch-prices] Yahoo 인증 성공: ${auth.crumb}` : '[fetch-prices] Yahoo 인증 건너뜀')

  const prices = {}
  const histories = {}

  for (const s of KRX_STOCKS) {
    const chart = await fetchYahooChart(s.symbol, auth, 'fromStartDate')
    const price = chart?.meta?.regularMarketPrice ?? null
    prices[s.id] = price
    histories[s.id] = parseHistory(chart)
    console.log(`[fetch-prices] ${s.name} (${s.symbol}): ${price ?? '실패'}`)
    await delay(1200)
  }

  const usdKrw = await fetchYahooPrice('USDKRW=X', auth)
  console.log(`[fetch-prices] USD/KRW (USDKRW=X): ${usdKrw ?? '실패'}`)

  if (!Object.values(prices).some(price => price !== null)) {
    throw new Error('모든 시세 수집 실패: 기존 data.json을 보존합니다')
  }

  const output = {
    updatedAt: new Date().toISOString(),
    prices,
    histories,
    exchangeRates: {
      usdKrw,
    },
  }

  const outPath = path.join(__dirname, '..', 'public', 'data.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log('[fetch-prices] 저장 완료:', outPath)
  console.log('[fetch-prices] 결과:', JSON.stringify(prices))
}

main().catch(err => {
  console.error('[fetch-prices] 오류:', err.message)
})
