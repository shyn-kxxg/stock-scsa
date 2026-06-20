import { useState } from 'react'
import SummaryBar from './SummaryBar'
import MemberTable from './MemberTable'
import ProfitLineChart from './ProfitLineChart'
import ExcelRibbon from './ExcelRibbon'
import { useExcelMode } from '../context/ExcelModeContext'

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
    return null
  }
}

export default function Dashboard({ members, totalStats, updatedAt, loading, isLive, fetchError, onRefresh }) {
  const { excelMode, setExcelMode } = useExcelMode()
  const [activeTab, setActiveTab] = useState('홈')

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

  if (excelMode) {
    return (
      <div
        className="min-h-screen flex flex-col"
        style={{ fontFamily: 'Calibri, "맑은 고딕", Arial, sans-serif', background: '#f2f2f2' }}
      >
        {/* Excel Ribbon */}
        <ExcelRibbon activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Column headers bar (A B C ...) */}
        <div
          className="flex items-center border-b sticky top-0 z-10"
          style={{ background: '#f2f2f2', borderColor: '#c0c0c0' }}
        >
          {/* Row header placeholder */}
          <div style={{ width: 30, minWidth: 30, borderRight: '1px solid #c0c0c0', height: 18 }} />
          {/* Columns */}
          {['A','B','C','D','E','F','G','H','I','J','K','L','M'].map(col => (
            <div
              key={col}
              className="flex-1 text-center text-xs border-r"
              style={{ borderColor: '#c0c0c0', height: 18, lineHeight: '18px', color: '#444', minWidth: 60 }}
            >
              {col}
            </div>
          ))}
          {/* Excel Mode toggle in column header area */}
          <div className="ml-auto pr-2 flex items-center" style={{ position: 'absolute', right: 0, top: 0, height: 18 }}>
            <button
              onClick={() => setExcelMode(false)}
              className="text-xs px-2 py-0 hover:bg-gray-300 border"
              style={{ borderColor: '#c0c0c0', background: '#ffffff', color: '#111', height: 18, fontSize: 10 }}
            >
              엑셀 모드 끄기
            </button>
          </div>
        </div>

        {/* Spreadsheet area */}
        <div className="flex-1 flex overflow-auto" style={{ background: 'white' }}>
          {/* Row numbers */}
          <div className="flex flex-col border-r" style={{ minWidth: 30, background: '#f2f2f2', borderColor: '#c0c0c0' }}>
            {Array.from({ length: 60 }).map((_, i) => (
              <div
                key={i}
                className="text-right pr-1 text-xs border-b"
                style={{ height: 20, lineHeight: '20px', borderColor: '#e0e0e0', color: '#666', fontSize: 10 }}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto py-4 px-4 space-y-4">

              {/* Status row — styled as Excel cell info */}
              <div className="flex items-center gap-3 pb-1 border-b" style={{ borderColor: '#c0c0c0' }}>
                <div className="flex items-center gap-2">
                  {loading ? (
                    <span className="text-xs px-2 py-0.5 border" style={{ borderColor: '#c0c0c0', background: '#fff9c4', color: '#111' }}>
                      시세 가져오는 중...
                    </span>
                  ) : isLive ? (
                    <span className="text-xs px-2 py-0.5 border" style={{ borderColor: '#4CAF50', background: '#e8f5e9', color: '#111' }}>
                      실시간 · {formatUpdatedAt(updatedAt)} (KST)
                    </span>
                  ) : fetchError ? (
                    <span className="text-xs px-2 py-0.5 border" style={{ borderColor: '#ef5350', background: '#ffebee', color: '#111' }}>
                      시세 로딩 실패
                    </span>
                  ) : updatedAt ? (
                    <span className="text-xs px-2 py-0.5 border" style={{ borderColor: '#42a5f5', background: '#e3f2fd', color: '#111' }}>
                      최신 스냅샷 · {formatUpdatedAt(updatedAt)} (KST)
                    </span>
                  ) : null}

                  {!loading && (
                    <button
                      onClick={onRefresh}
                      className="text-xs px-2 py-0.5 border hover:bg-gray-100"
                      style={{ borderColor: '#c0c0c0', color: '#111' }}
                    >
                      새로고침
                    </button>
                  )}
                </div>
              </div>

              {/* Error banner */}
              {fetchError && !loading && (
                <div className="text-sm px-3 py-2 border" style={{ borderColor: '#ef9a9a', background: '#ffebee', color: '#111' }}>
                  Yahoo Finance 연결 실패 - 잠시 후 다시 시도하거나 새로고침을 눌러주세요
                </div>
              )}

              {/* Loading skeleton */}
              {loading && (
                <div className="space-y-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-8 border animate-pulse" style={{ borderColor: '#c0c0c0', background: '#f5f5f5' }} />
                  ))}
                </div>
              )}

              {/* Summary */}
              {!loading && validRates.length > 0 && (
                <section>
                  <div className="text-xs font-semibold mb-1 px-0.5" style={{ color: '#217346', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    이번달 총 합계 수익률
                  </div>
                  <SummaryBar totalStats={totalStats} />
                </section>
              )}

              {/* Chart */}
              {!loading && validRates.length > 0 && (
                <section>
                  <div className="text-xs font-semibold mb-1 px-0.5" style={{ color: '#217346', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    일자별 수익률
                  </div>
                  <ProfitLineChart members={sorted} />
                </section>
              )}

              {/* Table */}
              {!loading && (
                <section>
                  <div className="text-xs font-semibold mb-1 px-0.5" style={{ color: '#217346', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    상세 데이터
                  </div>
                  <MemberTable sorted={sorted} maxAbsRate={maxAbsRate} />
                </section>
              )}

              {/* Footer row */}
              <div className="pt-2 border-t text-xs" style={{ borderColor: '#c0c0c0', color: '#888' }}>
                데이터 출처: Yahoo Finance · 5분마다 자동 갱신
              </div>
            </div>
          </div>
        </div>

        {/* Sheet tab bar */}
        <div
          className="flex items-center border-t gap-0"
          style={{ background: '#f2f2f2', borderColor: '#c0c0c0', height: 22 }}
        >
          <button
            className="text-xs px-3 border-r border-t-2 bg-white"
            style={{ borderColor: '#c0c0c0', borderTopColor: '#217346', height: '100%', fontWeight: 600 }}
          >
            주식경쟁
          </button>
          <button
            className="text-xs px-3 border-r hover:bg-gray-100"
            style={{ borderColor: '#c0c0c0', height: '100%', color: '#666' }}
          >
            수익률 분석
          </button>
          <button
            className="w-6 h-full border-r flex items-center justify-center text-gray-400 hover:bg-gray-100"
            style={{ borderColor: '#c0c0c0' }}
          >
            +
          </button>
        </div>
      </div>
    )
  }

  // Default dark mode
  return (
    <div className="min-h-screen bg-[#0d0d1a] text-gray-100">
      {/* Header */}
      <header className="pt-6 pb-4 px-4 text-center relative">
        {/* Excel mode toggle - top right */}
        <div className="absolute right-4 top-4">
          <button
            onClick={() => setExcelMode(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border transition-colors hover:bg-green-900/30"
            style={{ borderColor: '#217346', color: '#4ade80' }}
            title="엑셀 모드로 전환"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect width="14" height="14" rx="2" fill="#217346" />
              <text x="1.5" y="11" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial">X</text>
            </svg>
            엑셀 모드
          </button>
        </div>

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
        {fetchError && !loading && (
          <div className="text-center py-3 px-5 rounded-lg text-sm bg-red-900/30 border border-red-800/50 text-red-400">
            ⚠️ Yahoo Finance 연결 실패 — 잠시 후 다시 시도하거나 ↻ 새로고침을 눌러주세요
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-800/40 rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {!loading && validRates.length > 0 && (
          <section>
            <SummaryBar totalStats={totalStats} />
          </section>
        )}

        {!loading && validRates.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-2 px-1">
              일자별 수익률
            </h2>
            <ProfitLineChart members={sorted} />
          </section>
        )}

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
