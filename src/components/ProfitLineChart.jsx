import { useEffect, useState } from 'react'

function fmtRate(rate) {
  const sign = rate > 0 ? '+' : ''
  return `${sign}${rate.toFixed(1)}%`
}

function fmtDate(date) {
  const [, month, day] = date.split('-')
  return `${Number(month)}/${Number(day)}`
}

function buildPath(points, xForDate, yForRate) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${xForDate(point.date)} ${yForRate(point.rate)}`)
    .join(' ')
}

export default function ProfitLineChart({ members }) {
  const [isMobile, setIsMobile] = useState(false)

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

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-2 sm:p-4">
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

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-[320px] max-w-none mx-auto"
          style={{ width: `${width}px` }}
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
                return (
                  <circle
                    key={`${member.id}-${point.date}`}
                    cx={xForDate(point.date)}
                    cy={yForRate(point.rate)}
                    r={isLast ? 4 : 2.5}
                    fill={member.color}
                    opacity={isLast ? 1 : 0.55}
                  >
                    <title>{`${member.name} ${point.date} ${fmtRate(point.rate)}`}</title>
                  </circle>
                )
              })}
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
