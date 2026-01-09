import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TimeGrid } from './TimeGrid'
import { MapView } from './MapView'
import { ListView } from './ListView'
import { BookingDialog } from '@/components/booking/BookingDialog'
import { WeekDatePicker } from '@/components/booking/WeekDatePicker'
import { cn } from '@/lib/utils'

type FilterType = 'all' | 'confirmed' | 'completed'
type ViewMode = 'grid' | 'map' | 'list'

export function ScheduleView() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false)
  const [bookingDate, setBookingDate] = useState<Date | undefined>(undefined)
  const [selectedTime, setSelectedTime] = useState<string | undefined>(undefined)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)
  const [showViewDropdown, setShowViewDropdown] = useState(false)
  
  const segmentedControlRef = useRef<HTMLDivElement>(null)

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const openNewAppointment = () => {
    const now = new Date()
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    setBookingDate(now)
    setSelectedTime(currentTime)
    setIsBookingDialogOpen(true)
  }

  // Check if selected date is today
  const isToday = () => {
    const today = new Date()
    return (
      selectedDate.getDate() === today.getDate() &&
      selectedDate.getMonth() === today.getMonth() &&
      selectedDate.getFullYear() === today.getFullYear()
    )
  }

  // Visual indicators for non-default selections
  const isFilterActive = filterType !== 'all'
  const isViewActive = viewMode !== 'grid'
  const isTodayActive = isToday()

  const filterLabels: Record<FilterType, string> = {
    all: 'All',
    confirmed: 'Confirmed',
    completed: 'Completed'
  }

  const viewLabels: Record<ViewMode, string> = {
    grid: 'Grid',
    map: 'Map',
    list: 'List'
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (segmentedControlRef.current && !segmentedControlRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false)
        setShowViewDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className=" border-b border-gray-200 bg-white px-4 pt-2 pb-4 sticky top-0 z-20">
        {/* Week Date Picker with Action Button */}
        <WeekDatePicker
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          actionButton={
            <Button
              size="icon"
              variant="ghost"
              onClick={openNewAppointment}
              className="h-11 w-11 hover:bg-transparent"
            >
              <Plus className="h-8 w-8 text-primary" strokeWidth={2.5} />
            </Button>
          }
        />

        {/* Segmented Control: Filter | Today | View */}
        <div className="mt-2 mb-0 relative" ref={segmentedControlRef}>
          <div className="flex items-stretch h-8 rounded-lg border border-gray-300 bg-white shadow-md overflow-hidden">
            {/* Filter Dropdown */}
            <div className="flex-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  console.log('Filter button clicked, current state:', showFilterDropdown)
                  setShowFilterDropdown(!showFilterDropdown)
                  setShowViewDropdown(false)
                }}
                className={cn(
                  "w-full h-full px-3 text-sm font-medium bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors border-r border-gray-200 inline-flex items-center justify-center gap-1.5 pb-[10px]",
                  isFilterActive ? "text-primary" : "text-gray-700"
                )}
                
              >
                <span>{filterLabels[filterType]}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Today Button */}
            <button
              onClick={goToToday}
              className={cn(
                "flex-1 h-full px-3 text-sm font-medium bg-white hover:bg-gray-50 hover:text-primary active:bg-gray-100 transition-colors border-r border-gray-200 inline-flex items-center justify-center pb-[10px]",
                isTodayActive ? "text-primary" : "text-gray-700"
              )}
              
            >
              Today
            </button>

            {/* View Dropdown */}
            <div className="flex-1">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  console.log('View button clicked, current state:', showViewDropdown)
                  setShowViewDropdown(!showViewDropdown)
                  setShowFilterDropdown(false)
                }}
                className={cn(
                  "w-full h-full px-3 text-sm font-medium bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors inline-flex items-center justify-center gap-1.5 pb-[10px]",
                  isViewActive ? "text-primary" : "text-gray-700"
                )}
                
              >
                <span>{viewLabels[viewMode]}</span>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showViewDropdown ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Dropdown Menu */}
          {showFilterDropdown && (
            <div 
              className="absolute left-4 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
              style={{ zIndex: 1000 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  console.log('Filter clicked: all')
                  setFilterType('all')
                  setShowFilterDropdown(false)
                }}
                className={cn(
                  'w-full py-2.5 px-4 text-sm font-medium text-left transition-colors cursor-pointer',
                  filterType === 'all' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                All
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => {
                  console.log('Filter clicked: confirmed')
                  setFilterType('confirmed')
                  setShowFilterDropdown(false)
                }}
                className={cn(
                  'w-full py-2.5 px-4 text-sm font-medium text-left transition-colors cursor-pointer',
                  filterType === 'confirmed' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                Confirmed
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => {
                  console.log('Filter clicked: completed')
                  setFilterType('completed')
                  setShowFilterDropdown(false)
                }}
                className={cn(
                  'w-full py-2.5 px-4 text-sm font-medium text-left transition-colors cursor-pointer',
                  filterType === 'completed' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                Completed
              </button>
            </div>
          )}

          {/* View Dropdown Menu */}
          {showViewDropdown && (
            <div 
              className="absolute right-4 mt-1 w-36 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden"
              style={{ zIndex: 1000 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  console.log('View clicked: grid')
                  setViewMode('grid')
                  setShowViewDropdown(false)
                }}
                className={cn(
                  'w-full py-2.5 px-4 text-sm font-medium text-left transition-colors cursor-pointer',
                  viewMode === 'grid' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                Grid
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => {
                  console.log('View clicked: map')
                  setViewMode('map')
                  setShowViewDropdown(false)
                }}
                className={cn(
                  'w-full py-2.5 px-4 text-sm font-medium text-left transition-colors cursor-pointer',
                  viewMode === 'map' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                Map
              </button>
              <div className="border-t border-gray-100" />
              <button
                onClick={() => {
                  console.log('View clicked: list')
                  setViewMode('list')
                  setShowViewDropdown(false)
                }}
                className={cn(
                  'w-full py-2.5 px-4 text-sm font-medium text-left transition-colors cursor-pointer',
                  viewMode === 'list' 
                    ? 'bg-purple-100 text-purple-700 font-semibold' 
                    : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                )}
              >
                List
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'grid' && (
          <TimeGrid 
            selectedDate={selectedDate} 
            filterType={filterType}
            onTimeSlotClick={(date, time) => {
              setBookingDate(date)
              setSelectedTime(time)
              setIsBookingDialogOpen(true)
            }}
          />
        )}
        
        {viewMode === 'map' && (
          <MapView 
            selectedDate={selectedDate}
            filterType={filterType}
          />
        )}
        
        {viewMode === 'list' && (
          <ListView 
            selectedDate={selectedDate}
            filterType={filterType}
          />
        )}
      </div>

      {/* Booking Dialog */}
      <BookingDialog
        open={isBookingDialogOpen}
        onOpenChange={(open) => {
          setIsBookingDialogOpen(open)
          if (!open) {
            setBookingDate(undefined)
            setSelectedTime(undefined)
          }
        }}
        defaultDate={bookingDate || selectedDate}
        defaultTime={selectedTime}
      />
    </div>
  )
}


