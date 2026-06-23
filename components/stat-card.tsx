import { TrendingDown, TrendingUp } from 'lucide-react'

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>
  title: string
  value: string | number
  trend?: {
    value: number
    direction: 'up' | 'down'
  }
  subtitle?: string
}

export function StatCard({
  icon: Icon,
  title,
  value,
  trend,
  subtitle,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6 backdrop-blur-sm hover:border-slate-700 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-slate-400 mb-2">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
          {subtitle && (
            <div className="mt-2 flex items-center gap-1">
              {trend?.direction === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  trend?.direction === 'down' ? 'text-red-500' : 'text-green-500'
                }`}
              >
                {trend?.direction === 'down' ? '↓' : '↑'} {Math.abs(trend?.value || 0)}%{' '}
                {subtitle}
              </span>
            </div>
          )}
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-800">
          <Icon className="h-6 w-6 text-slate-400" />
        </div>
      </div>
    </div>
  )
}
