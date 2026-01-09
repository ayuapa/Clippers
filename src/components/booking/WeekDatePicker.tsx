import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { addDays, startOfWeek, format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns'

interface WeekDatePickerProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  actionButton?: React.ReactNode
}

export function WeekDatePicker({ selectedDate, onDateChange, actionButton }: WeekDatePickerProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 0 })
  )
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(selectedDate)
  const calendarRef = useRef<HTMLDivElement>(null)
  const weekContainerRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number>(0)

  // Update week view when selectedDate changes externally
  useEffect(() => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 })
    setCurrentWeekStart(weekStart)
    setCalendarMonth(selectedDate)
  }, [selectedDate])

  // Generate 7 days for the current week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const goToPreviousWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, -7))
  }

  const goToNextWeek = () => {
    setCurrentWeekStart(addDays(currentWeekStart, 7))
  }

  // Touch gesture handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    // Swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        // Swiped left - go to next week
        goToNextWeek()
      } else {
        // Swiped right - go to previous week
        goToPreviousWeek()
      }
    }
  }

  const handleCalendarSelect = (date: Date) => {
    onDateChange(date)
    setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 0 }))
    setIsCalendarOpen(false)
  }

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsCalendarOpen(false)
      }
    }

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isCalendarOpen])

  // Generate calendar days
  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)
  const paddedDays = Array(startPadding).fill(null).concat(monthDays)

  const goToPreviousMonth = () => {
    setCalendarMonth(addDays(startOfMonth(calendarMonth), -1))
  }

  const goToNextMonth = () => {
    setCalendarMonth(addDays(endOfMonth(calendarMonth), 1))
  }

  return (
    <div className="space-y-2 relative">
      {/* Month/Year Header with Calendar Popup */}
      <div className="flex items-center justify-center relative">
        <button
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="flex items-center gap-1.5 text-base font-semibold hover:bg-gray-100 px-3 py-1.5 rounded-md transition-colors"
        >
          {format(selectedDate, 'MMMM yyyy')}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* Optional Action Button - Positioned Absolutely on Right */}
        {actionButton && (
          <div className="absolute right-0 flex-shrink-0">
            {actionButton}
          </div>
        )}

        {/* Calendar Dropdown */}
        {isCalendarOpen && (
          <div
            ref={calendarRef}
            className="absolute top-12 left-1/2 transform -translate-x-1/2 z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <Button
                size="icon"
                variant="ghost"
                onClick={goToPreviousMonth}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="font-semibold">
                {format(calendarMonth, 'MMMM yyyy')}
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={goToNextMonth}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {paddedDays.map((day, i) => {
                if (!day) {
                  return <div key={`empty-${i}`} />
                }
                const isSelected = isSameDay(day, selectedDate)
                const isToday = isSameDay(day, new Date())

                return (
                  <button
                    key={i}
                    onClick={() => handleCalendarSelect(day)}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-lg
                      transition-colors
                      ${
                        isSelected
                          ? 'bg-primary text-white font-semibold'
                          : isToday
                          ? 'bg-gray-100 font-semibold'
                          : 'hover:bg-gray-50'
                      }
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Week View with Navigation */}
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          onClick={goToPreviousWeek}
          className="h-7 w-7 flex-shrink-0"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </Button>

        <div
          ref={weekContainerRef}
          className="flex-1 grid grid-cols-7 gap-0.5 touch-pan-y select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {weekDays.map((day) => {
            const isSelected = isSameDay(day, selectedDate)
            const isToday = isSameDay(day, new Date())

            return (
              <button
                key={day.toISOString()}
                onClick={() => onDateChange(day)}
                className={`
                  flex flex-col items-center justify-center py-2 px-1 rounded-full
                  transition-all min-w-0 active:scale-95
                  ${
                    isSelected
                      ? 'bg-primary text-white shadow-md'
                      : isToday
                      ? 'bg-gray-100 text-gray-900'
                      : 'hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <span className={`text-[9px] font-semibold uppercase mb-0.5 ${isSelected ? 'text-white/90' : 'text-gray-500'}`}>
                  {format(day, 'EEE')[0]}
                </span>
                <span className={`text-lg font-bold ${isSelected ? 'text-white' : ''}`}>
                  {format(day, 'd')}
                </span>
              </button>
            )
          })}
        </div>

        <Button
          size="icon"
          variant="ghost"
          onClick={goToNextWeek}
          className="h-7 w-7 flex-shrink-0"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

