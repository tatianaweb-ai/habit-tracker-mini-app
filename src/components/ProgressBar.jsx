import { useId } from 'react'
import { Check } from 'lucide-react'

/** Кольцевой прогресс с оранжево-янтарным градиентом. */
export default function ProgressBar({ done, total, size = 'lg', caption = 'привычек выполнено' }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0
  const rawId = useId()
  const gradientId = `progress-${rawId.replace(/:/g, '')}`

  const large = size === 'lg'
  const box = large ? 184 : 64
  const stroke = large ? 7 : 9
  const radius = 50 - stroke
  const circumference = 2 * Math.PI * radius
  const isComplete = total > 0 && done === total

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: box, height: box }} data-testid="progress-ring">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>

          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth={stroke}
            className="stroke-orange-100"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - percent / 100)}
            stroke={`url(#${gradientId})`}
            className={percent === 0 ? 'opacity-0' : 'transition-opacity'}
            style={{ transition: 'stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold text-gray-900 ${large ? 'text-5xl' : 'text-sm'}`}
            style={large ? undefined : { fontSize: '0.95rem' }}
          >
            {percent}%
          </span>
          {large && (
            <span className="mt-1 text-sm font-medium text-gray-600">
              {done} из {total}
            </span>
          )}
          {large && isComplete && (
            <span className="animate-pop mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-600">
              <Check size={12} strokeWidth={3} />
              День закрыт
            </span>
          )}
        </div>
      </div>

      {caption && (
        <p className="mt-4 text-center text-sm font-medium text-gray-600">
          {total > 0 ? caption : 'Добавьте первую привычку, чтобы начать'}
        </p>
      )}
    </div>
  )
}

/** Линейный оранжевый прогресс с плавным заполнением. */
export function LinearProgress({ done, total, className = '' }) {
  const percent = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div
      className={`h-2.5 w-full overflow-hidden rounded-full bg-orange-100 ${className}`}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-[width] duration-700 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
