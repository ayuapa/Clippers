import { Calendar, Users, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BottomNavProps {
  currentView: 'schedule' | 'clients' | 'more'
  onViewChange: (view: 'schedule' | 'clients' | 'more') => void
}

export function BottomNav({ currentView, onViewChange }: BottomNavProps) {
  const navItems = [
    { id: 'schedule' as const, label: 'Schedule', icon: Calendar },
    { id: 'clients' as const, label: 'Clients', icon: Users },
    { id: 'more' as const, label: 'More', icon: MoreHorizontal },
  ]

  return (
    <nav className="border-t border-gray-200 bg-white">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentView === item.id

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={cn(
                'flex flex-col items-center justify-center w-full py-3 px-3 min-h-[60px] transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

