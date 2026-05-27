import SummaryBar from './SummaryBar'
import MemberTable from './MemberTable'
import ProfitLineChart from './ProfitLineChart'

function formatUpdatedAt(iso) {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  } catch {
    return iso
  }
}

export default function Dashboard({ members, totalStats, updatedAt, loading, isLive, fetchError, onRefresh }) {
  const sorted = [...members].sort((a, b) => {
    if (a.profitRate === null && b.profitRate === null) return 0
    if (a.profitRate === null) return 1
    if (b.profitRate === null) return -1
    return b.profitRate - a.profitRate
  })

  const validRates = members.map(m => m.profitRate).filter(r => r !== null)
  const maxAbsRate = validRates.length > 0
    ? Math.max(...validRates.map(r => Math.abs(r)), 0.01)
    : 0.01

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-gray-100">
      {/* Header */}
      <header className="pt-6 pb-4 px-4 text-center">
        <div className="flex items-center justify-center gap-2">
          {loading ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 bg-gray-800/50 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
              시세 가져오는 중…
            </span>
          ) : isLive ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/40 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              실시간 · {formatUpdatedAt(updatedAt)} (KST)
            </span>
          ) : fetchError ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-red-400 bg-red-900/20 border border-red-800/40 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              시세 로딩 실패
            </span>
          ) : updatedAt ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-sky-400 bg-sky-900/20 border border-sky-800/40 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
              최신 스냅샷 · {formatUpdatedAt(updatedAt)} (KST)
            </span>
          ) : null}

          {!loading && (
            <button
              onClick={onRefresh}
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors px-2 py-1 rounded hover:bg-gray-800"
            >
              ↻ 새로고침
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
        {/* Fetch error banner */}
        {fetchError && !loading && (
          <div className="text-center py-3 px-5 rounded-lg text-sm bg-red-900/30 border border-red-800/50 text-red-400">
            ⚠️ Yahoo Finance 연결 실패 — 잠시 후 다시 시도하거나 ↻ 새로고침을 눌러주세요
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800/40 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Total summary */}
        {!loading && validRates.length > 0 && (
          <section>
            <SummaryBar totalStats={totalStats} />
          </section>
        )}

        {/* Daily return chart */}
        {!loading && validRates.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">
              일자별 수익률
            </h2>
            <ProfitLineChart members={sorted} />
          </section>
        )}

        {/* Detail table */}
        {!loading && (
          <section>
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">
              상세 데이터
            </h2>
            <MemberTable sorted={sorted} maxAbsRate={maxAbsRate} />
          </section>
        )}
      </main>

      <footer className="text-center py-6 border-t border-gray-800/50">
        <p className="text-gray-800 text-xs">
          데이터 출처: Yahoo Finance · 5분마다 자동 갱신
        </p>
      </footer>
    </div>
  )
}
