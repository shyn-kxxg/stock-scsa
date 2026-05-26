import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ── 종목 설정 ────────────────────────────────────────────────────────────────
// Yahoo Finance 심볼: .KS = 코스피, .KQ = 코스닥
// 심볼 확인: https://finance.yahoo.com/lookup
const KRX_STOCKS = [
  { id: 'hyemin',   symbol: '189350.KQ', name: '도이치모터스' },
  { id: 'hyejun',   symbol: '069960.KS', name: '현대백화점'   },
  { id: 'seunggi',  symbol: '008260.KS', name: 'KBI동양철관'  },
  { id: 'junyoung', symbol: '005380.KS', name: '현대차'        },
  { id: 'yewon',    symbol: '006220.KQ', name: '한국파마'      },
]

const CRYPTO = [
  { id: 'seohyeon', coinId: 'qtum', name: 'QTUM' },
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

async function fetchYahooPrice(symbol, auth) {
  // Attempt 1: without crumb
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d&includePrePost=false`
    const data = curlGet(url)
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
    if (price) return price
  } catch { /* fallthrough */ }

  await delay(1000)

  // Attempt 2: with crumb
  if (auth) {
    try {
      const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d&crumb=${encodeURIComponent(auth.crumb)}`
      const result = execSync(
        `curl -s --max-time 12 --retry 1 -H "User-Agent: Mozilla/5.0" -H "Accept: application/json" -H "Cookie: ${auth.cookie}" "${url}"`,
        { encoding: 'utf-8', timeout: 18000 }
      )
      const data = JSON.parse(result)
      const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
      if (price) return price
    } catch { /* fallthrough */ }
  }

  return null
}

async function fetchCoinGeckoPrice(coinId) {
  try {
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`
    const data = curlGet(url)
    return data?.[coinId]?.usd ?? null
  } catch { /* fallthrough */ }
  return null
}

async function main() {
  console.log('[fetch-prices] 시세 데이터 수집 시작')

  const auth = await getYahooAuth()
  console.log(auth?.crumb ? `[fetch-prices] Yahoo 인증 성공: ${auth.crumb}` : '[fetch-prices] Yahoo 인증 건너뜀')

  const prices = {}

  for (const s of KRX_STOCKS) {
    const price = await fetchYahooPrice(s.symbol, auth)
    prices[s.id] = price
    console.log(`[fetch-prices] ${s.name} (${s.symbol}): ${price ?? '실패'}`)
    await delay(1200)
  }

  for (const c of CRYPTO) {
    const price = await fetchCoinGeckoPrice(c.coinId)
    prices[c.id] = price
    console.log(`[fetch-prices] ${c.name}: ${price ?? '실패'}`)
  }

  const output = {
    updatedAt: new Date().toISOString(),
    prices,
  }

  const outPath = path.join(__dirname, '..', 'public', 'data.json')
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8')
  console.log('[fetch-prices] 저장 완료:', outPath)
  console.log('[fetch-prices] 결과:', JSON.stringify(prices))
}

main().catch(err => {
  console.error('[fetch-prices] 오류:', err.message)
})
