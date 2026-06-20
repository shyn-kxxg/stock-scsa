import { useEffect, useState, useRef, useCallback } from 'react'
import { useExcelMode } from '../context/ExcelModeContext'

function fmtRate(rate) {
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

function fmtDate(date) {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

function fmtTimeLabel(label) {
  const date = new Date(label)
  if (Number.isNaN(date.getTime())) return label
  return date.toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const KST_MARKET_TIME_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function isKoreanMarketOpen(timestamp) {
  const parts = Object.fromEntries(
    KST_MARKET_TIME_FORMATTER
      .formatToParts(new Date(timestamp))
      .map(part => [part.type, part.value]),
  )
  const weekday = parts.weekday
  if (weekday === 'Sat' || weekday === 'Sun') return false

  const hour = Number(parts.hour === '24' ? '0' : parts.hour)
  const minute = Number(parts.minute)
  const minutes = hour * 60 + minute
  return minutes >= 9 * 60 && minutes <= 15 * 60 + 30
}

function fmtPrice(price, currency) {
  if (price == null) return null
  if (currency === 'USD') return `$${price.toFixed(2)}`
  return `₩${Math.round(price).toLocaleString('ko-KR')}`
}

function buildPath(points, xForDate, yForRate) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForDate(point.date)} ${yForRate(point.rate)}`)
    .join(' ')
}

export default function ProfitLineChart({ members, mode = 'daily' }) {
  const { excelMode } = useExcelMode()
  const [isMobile, setIsMobile] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const svgRef = useRef(null)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 639px)')
    const update = () => setIsMobile(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  const series = members
    .map(member => ({
      ...member,
      points: member.historyRates ?? [],
    }))
    .filter(member => member.points.length > 0)

  if (series.length === 0) {
    if (excelMode) {
      return (
        <div className="border px-6 py-4 text-sm" style={{ borderColor: '#c0c0c0', background: 'white', color: '#888' }}>
          일자별 수익률 데이터를 가져오는 중입니다.
        </div>
      )
    }
    return (
      <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-center text-sm text-gray-500">
        일자별 수익률 데이터를 가져오는 중입니다.
      </div>
    )
  }

  const dates = [...new Set(series.flatMap(member => member.points.map(point => point.date)))].sort()
  const allRates = series.flatMap(member => member.points.map(point => point.rate))
  const minRate = Math.min(0, ...allRates)
  const maxRate = Math.max(0, ...allRates)
  const padding = Math.max((maxRate - minRate) * 0.12, 1)
  const yMin = minRate - padding
  const yMax = maxRate + padding

  const left = isMobile ? 36 : 58
  const right = isMobile ? 12 : 24
  const dayWidth = isMobile ? 15 : 40
  const minWidth = isMobile ? 360 : 720
  const width = Math.max(minWidth, left + right + Math.max(dates.length - 1, 1) * dayWidth)
  const height = 360
  const top = 26
  const bottom = 50
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom

  const xForDate = date => {
    const index = dates.indexOf(date)
    if (dates.length <= 1) return left + plotWidth
    return left + (index / (dates.length - 1)) * plotWidth
  }

  const yForRate = rate => top + ((yMax - rate) / (yMax - yMin)) * plotHeight

  const yTicks = [yMax, (yMax + 0) / 2, 0, (yMin + 0) / 2, yMin]
  const xTickDates = dates.filter((_, index) => {
    if (dates.length <= 5) return true
    return index === 0 || index === dates.length - 1 || index % Math.ceil(dates.length / 5) === 0
  })

  // Snap mouse to nearest date column, show tooltip for all series on that date
  const HOVER_SNAP_PX = 30

  const handleMouseMove = useCallback((e) => {
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const scaleX = width / rect.width
    const mouseX = (e.clientX - rect.left) * scaleX

    if (mouseX < left - HOVER_SNAP_PX || mouseX > left + plotWidth + HOVER_SNAP_PX) {
      setTooltip(null)
      return
    }

    // Find nearest date
    let nearestDate = null
    let nearestDist = Infinity
    for (const date of dates) {
      const dx = Math.abs(xForDate(date) - mouseX)
      if (dx < nearestDist) {
        nearestDist = dx
        nearestDate = date
      }
    }

    if (!nearestDate || nearestDist > HOVER_SNAP_PX) {
      setTooltip(null)
      return
    }

    const entries = series
      .map(member => {
        const point = member.points.find(p => p.date === nearestDate)
        if (!point) return null
        // Compute price for this date
        const price = member.purchasePrice != null
          ? member.purchasePrice * (1 + point.rate / 100)
          : null
        return {
          name: member.name,
          color: member.color,
          rate: point.rate,
          price,
          currency: member.currency,
        }
      })
      .filter(Boolean)

    if (entries.length === 0) {
      setTooltip(null)
      return
    }

    const svgX = xForDate(nearestDate)
    const tooltipX = (svgX / width) * rect.width + rect.left
    setTooltip({ date: nearestDate, entries, svgX, screenX: tooltipX, screenY: rect.top })
  }, [series, dates, width, left, plotWidth, xForDate])

  const handleMouseLeave = useCallback(() => setTooltip(null), [])

  const excelSeriesColors = ['#4472C4', '#ED7D31', '#A9D18E', '#FFC000', '#5B9BD5', '#70AD47']

  if (mode === 'ten-minute') {
    return <TenMinuteLineChart members={members} excelMode={excelMode} isMobile={isMobile} />
  }

  if (excelMode) {
    return (
      <div
        className="border"
        style={{ borderColor: '#c0c0c0', background: 'white', fontFamily: 'Calibri, Arial, sans-serif', position: 'relative' }}
      >
        {/* Chart title bar */}
        <div
          className="px-3 py-1.5 border-b text-sm font-semibold"
          style={{ background: '#f2f2f2', borderColor: '#c0c0c0', color: '#333' }}
        >
          차트 1 — 일자별 수익률 (꺾은선형)
        </div>

        {/* Legend */}
        <div className="px-3 pt-2 pb-1 flex flex-wrap gap-x-4 gap-y-1">
          {series.map((member, i) => (
            <div key={member.id} className="flex items-center gap-1.5 text-xs" style={{ color: '#333' }}>
              <span
                className="inline-block w-6 h-3"
                style={{ background: excelSeriesColors[i % excelSeriesColors.length] }}
              />
              {member.name}
            </div>
          ))}
        </div>

        <div
          className="overflow-x-auto relative"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="h-[320px] max-w-none mx-auto"
            style={{ width: `${width}px`, display: 'block' }}
            role="img"
            aria-label="일자별 수익률 선그래프"
          >
            {/* Plot background */}
            <rect x={left} y={top} width={plotWidth} height={plotHeight} fill="white" stroke="#c0c0c0" strokeWidth="1" />

            {/* Y grid + labels */}
            {yTicks.map(tick => (
              <g key={tick}>
                <line
                  x1={left}
                  x2={left + plotWidth}
                  y1={yForRate(tick)}
                  y2={yForRate(tick)}
                  stroke={Math.abs(tick) < 0.001 ? '#888' : '#e0e0e0'}
                  strokeWidth={Math.abs(tick) < 0.001 ? 1 : 0.8}
                />
                <text
                  x={left - 6}
                  y={yForRate(tick) + 4}
                  textAnchor="end"
                  fill="#666"
                  fontSize="10"
                  fontFamily="Calibri, Arial, sans-serif"
                >
                  {fmtRate(tick)}
                </text>
              </g>
            ))}

            {/* X grid + labels */}
            {xTickDates.map(date => (
              <g key={date}>
                <line
                  x1={xForDate(date)}
                  x2={xForDate(date)}
                  y1={top}
                  y2={top + plotHeight}
                  stroke="#e0e0e0"
                  strokeWidth="0.8"
                />
                <text
                  x={xForDate(date)}
                  y={height - 22}
                  textAnchor="middle"
                  fill="#666"
                  fontSize="10"
                  fontFamily="Calibri, Arial, sans-serif"
                >
                  {fmtDate(date)}
                </text>
              </g>
            ))}

            {/* Tooltip vertical line */}
            {tooltip && (
              <line
                x1={tooltip.svgX}
                x2={tooltip.svgX}
                y1={top}
                y2={top + plotHeight}
                stroke="#999"
                strokeWidth="1"
                strokeDasharray="4 3"
              />
            )}

            {/* Series lines */}
            {series.map((member, i) => {
              const color = excelSeriesColors[i % excelSeriesColors.length]
              return (
                <g key={member.id}>
                  <path
                    d={buildPath(member.points, xForDate, yForRate)}
                    fill="none"
                    stroke={color}
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {member.points.map((point, index) => {
                    const isLast = index === member.points.length - 1
                    const isHovered = tooltip?.date === point.date
                    return (
                      <circle
                        key={`${member.id}-${point.date}`}
                        cx={xForDate(point.date)}
                        cy={yForRate(point.rate)}
                        r={isHovered ? 5 : isLast ? 4 : 2.5}
                        fill={isHovered ? 'white' : color}
                        stroke={color}
                        strokeWidth={isHovered ? 2 : 0}
                        opacity={isHovered ? 1 : isLast ? 1 : 0.7}
                      />
                    )
                  })}
                </g>
              )
            })}
          </svg>

          {/* Tooltip */}
          {tooltip && (
            <div
              className="pointer-events-none absolute z-20 border shadow-sm text-xs"
              style={{
                background: 'white',
                borderColor: '#c0c0c0',
                padding: '6px 10px',
                top: 8,
                left: Math.min(
                  (tooltip.svgX / width) * 100 + 2,
                  68
                ) + '%',
                minWidth: 160,
                fontFamily: 'Calibri, Arial, sans-serif',
              }}
            >
              <div className="font-semibold pb-1 mb-1 border-b" style={{ borderColor: '#e0e0e0', color: '#217346' }}>
                {fmtDate(tooltip.date)}
              </div>
              {tooltip.entries.map(entry => (
                <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                  <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}</span>
                  <span style={{ color: '#333' }}>
                    {fmtRate(entry.rate)}
                    {entry.price != null && (
                      <span style={{ color: '#888', marginLeft: 6 }}>
                        ({fmtPrice(entry.price, entry.currency)})
                      </span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Excel chart border bottom label */}
        <div className="px-3 py-1 text-center text-xs" style={{ color: '#888', borderTop: '1px solid #e0e0e0' }}>
          날짜
        </div>
      </div>
    )
  }

  // Default dark mode chart
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-2 sm:p-4" style={{ position: 'relative' }}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {series.map(member => (
          <div key={member.id} className="flex items-center gap-2 text-xs text-gray-400">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: member.color }}
            />
            <span className="font-semibold" style={{ color: member.color }}>
              {member.name}
            </span>
          </div>
        ))}
      </div>

      <div
        className="overflow-x-auto relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="h-[320px] max-w-none mx-auto"
          style={{ width: `${width}px`, display: 'block' }}
          role="img"
          aria-label="일자별 수익률 선그래프"
        >
          <rect x={left} y={top} width={plotWidth} height={plotHeight} fill="#11182755" rx="8" />

          {yTicks.map(tick => (
            <g key={tick}>
              <line
                x1={left}
                x2={left + plotWidth}
                y1={yForRate(tick)}
                y2={yForRate(tick)}
                stroke={Math.abs(tick) < 0.001 ? '#6b7280' : '#1f2937'}
                strokeWidth={Math.abs(tick) < 0.001 ? 1.5 : 1}
              />
              <text
                x={left - 10}
                y={yForRate(tick) + 4}
                textAnchor="end"
                className="fill-gray-500 text-[11px]"
              >
                {fmtRate(tick)}
              </text>
            </g>
          ))}

          {xTickDates.map(date => (
            <g key={date}>
              <line
                x1={xForDate(date)}
                x2={xForDate(date)}
                y1={top}
                y2={top + plotHeight}
                stroke="#1f2937"
              />
              <text
                x={xForDate(date)}
                y={height - 20}
                textAnchor="middle"
                className="fill-gray-500 text-[11px]"
              >
                {fmtDate(date)}
              </text>
            </g>
          ))}

          {/* Tooltip vertical line */}
          {tooltip && (
            <line
              x1={tooltip.svgX}
              x2={tooltip.svgX}
              y1={top}
              y2={top + plotHeight}
              stroke="#6b7280"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
          )}

          {series.map(member => (
            <g key={member.id}>
              <path
                d={buildPath(member.points, xForDate, yForRate)}
                fill="none"
                stroke={member.color}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {member.points.map((point, index) => {
                const isLast = index === member.points.length - 1
                const isHovered = tooltip?.date === point.date
                return (
                  <circle
                    key={`${member.id}-${point.date}`}
                    cx={xForDate(point.date)}
                    cy={yForRate(point.rate)}
                    r={isHovered ? 6 : isLast ? 4 : 2.5}
                    fill={isHovered ? '#0d0d1a' : member.color}
                    stroke={member.color}
                    strokeWidth={isHovered ? 2.5 : 0}
                    opacity={isHovered ? 1 : isLast ? 1 : 0.55}
                  />
                )
              })}
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="pointer-events-none absolute z-20 rounded-lg border text-xs shadow-xl"
            style={{
              background: '#1a1a2e',
              borderColor: '#2a2a42',
              padding: '8px 12px',
              top: 8,
              left: Math.min(
                (tooltip.svgX / width) * 100 + 2,
                68
              ) + '%',
              minWidth: 160,
            }}
          >
            <div className="font-semibold pb-1 mb-1.5 border-b border-gray-700 text-gray-300">
              {fmtDate(tooltip.date)}
            </div>
            {tooltip.entries.map(entry => (
              <div key={entry.name} className="flex items-center justify-between gap-4 py-0.5">
                <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}</span>
                <span className="text-gray-300">
                  {fmtRate(entry.rate)}
                  {entry.price != null && (
                    <span className="text-gray-500 ml-1.5">
                      ({fmtPrice(entry.price, entry.currency)})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function TenMinuteLineChart({ members, excelMode, isMobile }) {
  const [now, setNow] = useState(() => Date.now())
  const marketOpen = isKoreanMarketOpen(now)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const series = members
    .map(member => ({
      ...member,
      points: member.tenMinuteRates ?? [],
    }))
    .filter(member => member.points.length > 0)

  if (series.length === 0) {
    return (
      <div
        className={excelMode ? 'border px-6 py-4 text-sm' : 'rounded-xl border border-gray-800 bg-gray-900/40 p-6 text-center text-sm text-gray-500'}
        style={excelMode ? { borderColor: '#c0c0c0', background: 'white', color: '#888' } : undefined}
      >
        10분 수익률 데이터가 아직 없습니다.
      </div>
    )
  }

  const slots = [...new Set(series.flatMap(member => member.points.map(point => point.date)))].sort()
  const allRates = series.flatMap(member => member.points.map(point => point.rate))
  const minRate = Math.min(0, ...allRates)
  const maxRate = Math.max(0, ...allRates)
  const padding = Math.max((maxRate - minRate) * 0.12, 0.5)
  const yMin = minRate - padding
  const yMax = maxRate + padding
  const left = isMobile ? 36 : 58
  const right = isMobile ? 12 : 24
  const stepWidth = isMobile ? 54 : 96
  const width = Math.max(isMobile ? 420 : 760, left + right + (slots.length - 1) * stepWidth)
  const height = 360
  const top = 26
  const bottom = 50
  const plotWidth = width - left - right
  const plotHeight = height - top - bottom
  const yTicks = [yMax, (yMax + 0) / 2, 0, (yMin + 0) / 2, yMin]
  const xForDate = date => {
    const index = slots.indexOf(date)
    if (slots.length <= 1) return left + plotWidth
    return left + (index / (slots.length - 1)) * plotWidth
  }
  const yForRate = rate => top + ((yMax - rate) / (yMax - yMin)) * plotHeight
  const excelSeriesColors = ['#4472C4', '#ED7D31', '#A9D18E', '#FFC000', '#5B9BD5', '#70AD47']

  if (excelMode) {
    return (
      <div
        className="border"
        style={{ borderColor: '#c0c0c0', background: 'white', fontFamily: 'Calibri, Arial, sans-serif', position: 'relative' }}
      >
        <div className="px-3 py-1.5 border-b text-sm font-semibold" style={{ background: '#f2f2f2', borderColor: '#c0c0c0', color: '#333' }}>
          차트 1 — 10분 수익률 (실시간)
        </div>
        <div className="px-3 pt-2 pb-1 flex flex-wrap items-center gap-x-4 gap-y-1">
          {series.map((member, i) => (
            <div key={member.id} className="flex items-center gap-1.5 text-xs" style={{ color: '#333' }}>
              <span className="inline-block w-6 h-3" style={{ background: excelSeriesColors[i % excelSeriesColors.length] }} />
              {member.name}
            </div>
          ))}
          <span className="text-xs" style={{ color: '#666' }}>
            {marketOpen ? '현재 10분 구간만 현재가 반영' : '장외 시간 - 데이터 고정'}
          </span>
        </div>
        <div className="overflow-x-auto relative">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-[320px] max-w-none mx-auto"
            style={{ width: `${width}px`, display: 'block' }}
            role="img"
            aria-label="10분 단위 실시간 수익률 선그래프"
          >
            <rect x={left} y={top} width={plotWidth} height={plotHeight} fill="white" stroke="#c0c0c0" strokeWidth="1" />
            {yTicks.map(tick => (
              <g key={tick}>
                <line x1={left} x2={left + plotWidth} y1={yForRate(tick)} y2={yForRate(tick)} stroke={Math.abs(tick) < 0.001 ? '#888' : '#e0e0e0'} strokeWidth={Math.abs(tick) < 0.001 ? 1 : 0.8} />
                <text x={left - 6} y={yForRate(tick) + 4} textAnchor="end" fill="#666" fontSize="10" fontFamily="Calibri, Arial, sans-serif">
                  {fmtRate(tick)}
                </text>
              </g>
            ))}
            {slots.map(slot => (
              <g key={slot}>
                <line x1={xForDate(slot)} x2={xForDate(slot)} y1={top} y2={top + plotHeight} stroke="#e0e0e0" strokeWidth="0.8" />
                <text x={xForDate(slot)} y={height - 22} textAnchor="middle" fill="#666" fontSize="10" fontFamily="Calibri, Arial, sans-serif">
                  {fmtTimeLabel(slot)}
                </text>
              </g>
            ))}
            {series.map((member, i) => {
              const color = excelSeriesColors[i % excelSeriesColors.length]
              return (
                <g key={member.id}>
                  <path d={buildPath(member.points, xForDate, yForRate)} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                  {member.points.map((point, index) => (
                    <circle key={`${member.id}-${point.date}`} cx={xForDate(point.date)} cy={yForRate(point.rate)} r={index === member.points.length - 1 ? 4.5 : 2.5} fill={color} opacity={index === member.points.length - 1 ? 1 : 0.75} />
                  ))}
                </g>
              )
            })}
          </svg>
        </div>
        <div className="px-3 py-1 text-center text-xs" style={{ color: '#888', borderTop: '1px solid #e0e0e0' }}>
          10분 단위
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-2 sm:p-4" style={{ position: 'relative' }}>
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {series.map(member => (
          <div key={member.id} className="flex items-center gap-2 text-xs text-gray-400">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: member.color }} />
            <span className="font-semibold" style={{ color: member.color }}>{member.name}</span>
          </div>
        ))}
        <span className="text-xs text-gray-600">
          {marketOpen ? '현재 10분 구간만 현재가 반영' : '장외 시간 - 데이터 고정'}
        </span>
      </div>
      <div className="overflow-x-auto relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[320px] max-w-none mx-auto"
          style={{ width: `${width}px`, display: 'block' }}
          role="img"
          aria-label="10분 단위 실시간 수익률 선그래프"
        >
          <rect x={left} y={top} width={plotWidth} height={plotHeight} fill="#11182755" rx="8" />
          {yTicks.map(tick => (
            <g key={tick}>
              <line x1={left} x2={left + plotWidth} y1={yForRate(tick)} y2={yForRate(tick)} stroke={Math.abs(tick) < 0.001 ? '#6b7280' : '#1f2937'} strokeWidth={Math.abs(tick) < 0.001 ? 1.5 : 1} />
              <text x={left - 10} y={yForRate(tick) + 4} textAnchor="end" className="fill-gray-500 text-[11px]">
                {fmtRate(tick)}
              </text>
            </g>
          ))}
          {slots.map(slot => (
            <g key={slot}>
              <line x1={xForDate(slot)} x2={xForDate(slot)} y1={top} y2={top + plotHeight} stroke="#1f2937" />
              <text x={xForDate(slot)} y={height - 20} textAnchor="middle" className="fill-gray-500 text-[11px]">
                {fmtTimeLabel(slot)}
              </text>
            </g>
          ))}
          {series.map(member => (
            <g key={member.id}>
              <path d={buildPath(member.points, xForDate, yForRate)} fill="none" stroke={member.color} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              {member.points.map((point, index) => (
                <circle key={`${member.id}-${point.date}`} cx={xForDate(point.date)} cy={yForRate(point.rate)} r={index === member.points.length - 1 ? 4.5 : 2.5} fill={member.color} opacity={index === member.points.length - 1 ? 1 : 0.55} />
              ))}
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
