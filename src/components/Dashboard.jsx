import SummaryBar from './SummaryBar'
import MemberTable from './MemberTable'

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
    })
  } catch {
    return iso
  }
}

export default function Dashboard({ members, updatedAt, loading, fetchError }) {
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
      <header className="py-10 px-4 text-center">
        <div className="inline-flex items-center gap-3 mb-3">
          <span className="text-4xl">🏁</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-amber-400 bg-clip-text text-transparent">
            SCSA 주식 경마
          </h1>
          <span className="text-4xl">🏁</span>
        </div>
        <p className="text-gray-500 text-sm mt-1">구매 이후 수익률 실시간 추적 · 과연 누가 1등일까?</p>
      </header>

      <main className="max-w-6xl mx-auto px-4 pb-16 space-y-6">
        {/* Status */}
        {(loading || fetchError) && (
          <div
            className={`text-center py-3 px-5 rounded-lg text-sm ${
              loading
                ? 'bg-gray-800/60 text-gray-400'
                : 'bg-red-900/30 border border-red-800/50 text-red-400'
            }`}
          >
            {loading ? '⏳ 시세 데이터 불러오는 중...' : '⚠️ 데이터 로딩 실패 — GitHub Actions 배포 후 시세가 업데이트됩니다'}
          </div>
        )}

        {/* Summary bar */}
        {!loading && (
          <section>
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">
              실시간 순위
            </h2>
            <SummaryBar sorted={sorted} />
          </section>
        )}

        {/* Race track visual */}
        {!loading && validRates.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">
              경주 현황
            </h2>
            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 space-y-3">
              {sorted.map(m => {
                const rate = m.profitRate
                const pct = rate !== null && maxAbsRate > 0
                  ? Math.min((Math.abs(rate) / maxAbsRate) * 50, 50)
                  : 0
                const positive = rate !== null && rate >= 0

                return (
                  <div key={m.id} className="flex items-center gap-3">
                    <span className="w-14 text-sm font-bold flex-shrink-0" style={{ color: m.color }}>
                      🐴 {m.name}
                    </span>
                    <div className="flex-1 relative h-7 bg-gray-900 rounded overflow-hidden">
                      <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-700 z-10" />
                      {rate !== null && (
                        <div
                          className="absolute top-1 bottom-1 flex items-center"
                          style={
                            positive
                              ? {
                                  left: '50%',
                                  width: `${pct}%`,
                                  background: `linear-gradient(to right, ${m.color}66, ${m.color})`,
                                  borderRadius: '0 4px 4px 0',
                                }
                              : {
                                  right: '50%',
                                  width: `${pct}%`,
                                  background: `linear-gradient(to left, ${m.color}66, ${m.color})`,
                                  borderRadius: '4px 0 0 4px',
                                }
                          }
                        />
                      )}
                    </div>
                    <span
                      className={`w-20 text-sm font-bold text-right tabular-nums flex-shrink-0 ${
                        rate === null ? 'text-gray-600' : positive ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {rate === null ? '-' : `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`}
                    </span>
                  </div>
                )
              })}
              <div className="flex justify-between text-xs text-gray-700 px-[calc(50%+4px)] mt-1">
                <span>← 손실</span>
                <span>수익 →</span>
              </div>
            </div>
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

      {/* Footer */}
      <footer className="text-center py-6 border-t border-gray-800/50">
        {updatedAt ? (
          <p className="text-gray-600 text-xs">
            마지막 업데이트: {formatUpdatedAt(updatedAt)} (KST)
          </p>
        ) : (
          <p className="text-gray-700 text-xs">
            GitHub Actions가 시세를 자동 업데이트합니다
          </p>
        )}
        <p className="text-gray-800 text-xs mt-1">SCSA 주식 경마 · 데이터 출처: Yahoo Finance, CoinGecko</p>
      </footer>
    </div>
  )
}
