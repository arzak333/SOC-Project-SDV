import { useState } from 'react'
import { HeatmapEntry } from '../types'
import { useLanguage } from '../context/LanguageContext'

interface Props {
  data: HeatmapEntry[]
  loading?: boolean
}

const DAY_KEYS = ['heatmap.sun', 'heatmap.mon', 'heatmap.tue', 'heatmap.wed', 'heatmap.thu', 'heatmap.fri', 'heatmap.sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function getCellColor(count: number, max: number): string {
  if (count === 0 || max === 0) return 'bg-gray-700'
  const ratio = count / max
  if (ratio < 0.15) return 'bg-blue-950'
  if (ratio < 0.35) return 'bg-blue-800'
  if (ratio < 0.6)  return 'bg-blue-600'
  if (ratio < 0.8)  return 'bg-orange-500'
  return 'bg-red-500'
}

export default function ActivityHeatmap({ data, loading }: Props) {
  const { t } = useLanguage()
  const [tooltip, setTooltip] = useState<{ day: number; hour: number; count: number } | null>(null)

  if (loading) {
    return (
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
        <div className="h-[180px] flex items-center justify-center text-gray-500">{t('heatmap.loading')}</div>
      </div>
    )
  }

  // Build lookup map
  const grid: Record<string, number> = {}
  let max = 0
  for (const entry of data) {
    const key = `${entry.day}-${entry.hour}`
    grid[key] = entry.count
    if (entry.count > max) max = entry.count
  }

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-300">{t('heatmap.title')}</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <span>{t('heatmap.low')}</span>
          {['bg-gray-700', 'bg-blue-950', 'bg-blue-800', 'bg-blue-600', 'bg-orange-500', 'bg-red-500'].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>{t('heatmap.high')}</span>
        </div>
      </div>

      {/* Hours header */}
      <div className="flex">
        <div className="w-8 shrink-0" />
        <div className="flex flex-1">
          {HOURS.map((h) => (
            <div key={h} className="flex-1 text-center text-gray-600" style={{ fontSize: 9 }}>
              {h % 4 === 0 ? `${h}h` : ''}
            </div>
          ))}
        </div>
      </div>

      {/* Grid rows */}
      {DAY_KEYS.map((dayKey, dayIdx) => (
        <div key={dayIdx} className="flex items-center mt-1">
          <div className="w-8 shrink-0 text-right pr-1 text-gray-500" style={{ fontSize: 10 }}>
            {t(dayKey)}
          </div>
          <div className="flex flex-1 gap-px">
            {HOURS.map((h) => {
              const count = grid[`${dayIdx}-${h}`] || 0
              return (
                <div
                  key={h}
                  className={`flex-1 rounded-sm cursor-default transition-opacity hover:opacity-80 ${getCellColor(count, max)}`}
                  style={{ height: 14 }}
                  onMouseEnter={() => setTooltip({ day: dayIdx, hour: h, count })}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>
        </div>
      ))}

      {/* Tooltip */}
      {tooltip && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          {t(DAY_KEYS[tooltip.day])} {tooltip.hour}h–{tooltip.hour + 1}h : <span className="text-white font-medium">{tooltip.count} {t('heatmap.events')}</span>
        </div>
      )}
    </div>
  )
}
