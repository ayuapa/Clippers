import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  addMonths,
  format,
  isSameDay,
  set,
  differenceInMinutes,
} from 'date-fns'
import { formatInSydney } from '@/lib/timezone'

interface EditDateTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate: Date
  initialStartTime: Date
  initialEndTime: Date
  onSave: (date: Date, startTime: Date, endTime: Date) => void
}

export function EditDateTimeDialog({
  open,
  onOpenChange,
  initialDate,
  initialStartTime,
  initialEndTime,
  onSave,
}: EditDateTimeDialogProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate)
  const [selectedStartTime, setSelectedStartTime] = useState(initialStartTime)
  const [calendarMonth, setCalendarMonth] = useState(initialDate)
  const [showCustomTime, setShowCustomTime] = useState(false)

  // Generate time slots from 6:00 AM to 8:00 PM (30-minute intervals)
  const timeSlots = []
  for (let hour = 6; hour <= 20; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 20 && minute > 0) break // Stop at 8:00 PM
      timeSlots.push({ hour, minute })
    }
  }

  // Calculate duration from initial times
  const durationMinutes = differenceInMinutes(initialEndTime, initialStartTime)

  // Generate calendar days
  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart)
  const paddedDays = Array(startPadding).fill(null).concat(monthDays)

  const goToPreviousMonth = () => {
    setCalendarMonth(addMonths(calendarMonth, -1))
  }

  const goToNextMonth = () => {
    setCalendarMonth(addMonths(calendarMonth, 1))
  }

  const handleDateChange = (newDate: Date) => {
    setSelectedDate(newDate)
    // Update selectedStartTime to use the new date but keep the same time-of-day
    const newStartTime = set(newDate, {
      hours: selectedStartTime.getHours(),
      minutes: selectedStartTime.getMinutes(),
      seconds: 0,
      milliseconds: 0,
    })
    setSelectedStartTime(newStartTime)
  }

  const handleTimeSlotClick = (hour: number, minute: number) => {
    // Create new Date with selected date and time
    const newStartTime = set(selectedDate, { hours: hour, minutes: minute, seconds: 0, milliseconds: 0 })
    setSelectedStartTime(newStartTime)
    setShowCustomTime(false)
  }

  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number)
    const newStartTime = set(selectedDate, { hours, minutes, seconds: 0, milliseconds: 0 })
    setSelectedStartTime(newStartTime)
  }

  const handleSave = () => {
    // Calculate end time based on duration
    const endTime = new Date(selectedStartTime.getTime() + durationMinutes * 60000)
    onSave(selectedDate, selectedStartTime, endTime)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">Select Date & Time</DialogTitle>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Calendar */}
          <div className="px-6 py-4 border-b border-gray-200">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={goToPreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">
                  {format(calendarMonth, 'MMMM yyyy')}
                </span>
                {!isSameDay(selectedDate, new Date()) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date()
                      handleDateChange(today)
                      setCalendarMonth(today)
                    }}
                    className="h-7 text-xs"
                  >
                    Today
                  </Button>
                )}
              </div>
              <button
                onClick={goToNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              {/* Calendar days */}
              {paddedDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => day && handleDateChange(day)}
                  disabled={!day}
                  className={`
                    aspect-square flex items-center justify-center rounded-lg text-sm
                    ${!day ? 'invisible' : ''}
                    ${
                      day && isSameDay(day, selectedDate)
                        ? 'bg-primary text-white font-semibold'
                        : day && isSameDay(day, new Date())
                        ? 'bg-gray-100 font-medium'
                        : 'hover:bg-gray-50'
                    }
                  `}
                >
                  {day && format(day, 'd')}
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots */}
          <div className="px-6 py-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Time slots</h3>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {timeSlots.map(({ hour, minute }) => {
                const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
                const displayTime = format(set(new Date(), { hours: hour, minutes: minute }), 'h:mma')
                const isSelected = 
                  selectedStartTime.getHours() === hour && 
                  selectedStartTime.getMinutes() === minute

                return (
                  <button
                    key={timeString}
                    onClick={() => handleTimeSlotClick(hour, minute)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                      }
                    `}
                  >
                    {displayTime}
                  </button>
                )
              })}
            </div>

            {/* Custom Time */}
            {!showCustomTime ? (
              <button
                onClick={() => setShowCustomTime(true)}
                className="w-full py-3 px-4 rounded-lg bg-pink-50 text-pink-600 font-medium text-sm hover:bg-pink-100 transition-colors"
              >
                Custom time
              </button>
            ) : (
              <div className="p-4 rounded-lg bg-gray-50">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter custom time
                </label>
                <input
                  type="time"
                  value={format(selectedStartTime, 'HH:mm')}
                  onChange={handleCustomTimeChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={() => setShowCustomTime(false)}
                  className="mt-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Use time slots instead
                </button>
              </div>
            )}

            {/* Selected Date/Time Preview */}
            <div className="mt-4 p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm font-medium text-purple-900">
                {formatInSydney(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              <p className="text-sm text-purple-700">
                {formatInSydney(selectedStartTime, 'h:mm a')} ({durationMinutes} minutes)
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 text-base font-semibold"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button
              className="h-12 text-base font-semibold bg-primary hover:bg-primary/90"
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
