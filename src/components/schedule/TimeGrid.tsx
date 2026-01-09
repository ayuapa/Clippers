import { useRef, useEffect, useState, useMemo } from 'react'
import { usePinch } from '@use-gesture/react'
import { useAppointments, useUpdateAppointment } from '@/hooks/useAppointments'
import { BookingDetailsDialog } from '@/components/booking/BookingDetailsDialog'

type FilterType = 'all' | 'confirmed' | 'completed'

interface TimeGridProps {
  selectedDate: Date
  filterType?: FilterType
  onTimeSlotClick?: (date: Date, time: string) => void
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 6) // 6 AM to 7 PM
const BASE_MINUTE_HEIGHT = 1.5 // Base pixels per minute at 100% (compact default)

export function TimeGrid({ selectedDate, filterType = 'all', onTimeSlotClick }: TimeGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const { data: allAppointments = [], isLoading } = useAppointments(selectedDate)
  const updateAppointment = useUpdateAppointment()
  const [selectedAppointment, setSelectedAppointment] = useState<string | null>(null)
  
  // Density zoom state (changes vertical spacing, not scale transform)
  const [zoomLevel, setZoomLevel] = useState(1) // 0.5x to 2.0x
  const [showZoomIndicator, setShowZoomIndicator] = useState(false)
  const zoomTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // 🆕 PHASE 1-3: Long-press, drag state, and visual preview
  const [draggingApt, setDraggingApt] = useState<{
    id: string
    initialY: number
    currentY: number
    originalStartTime: Date
    durationMinutes: number
    newStartTime?: Date
    newEndTime?: Date
    displayTime?: string
  } | null>(null)
  
  // 🆕 PHASE 5-6: Feedback and animations
  const [notification, setNotification] = useState<{
    message: string
    type: 'success' | 'error' | 'warning'
  } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [lastSnappedMinute, setLastSnappedMinute] = useState<number | null>(null)
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const pointerStartYRef = useRef<number>(0)
  const pointerIdRef = useRef<number | null>(null)
  const hasDraggedRef = useRef<boolean>(false)
  const isLongPressActiveRef = useRef<boolean>(false)
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Calculate dynamic minute height based on zoom level
  const minuteHeight = BASE_MINUTE_HEIGHT * zoomLevel

  // Filter appointments based on filterType
  const appointments = useMemo(() => {
    if (filterType === 'all') {
      return allAppointments
    }
    if (filterType === 'confirmed') {
      // Show appointments that are scheduled (not completed)
      return allAppointments.filter(apt => apt.status === 'scheduled')
    }
    if (filterType === 'completed') {
      // Show completed appointments
      return allAppointments.filter(apt => apt.status === 'completed')
    }
    return allAppointments
  }, [allAppointments, filterType])

  // 🆕 Calculate layout positions - Cascading layout with same-time grouping
  const appointmentsWithLayout = useMemo(() => {
    if (appointments.length === 0) return []

    // Sort appointments by start time, then by ID for consistency
    const sorted = [...appointments].sort((a, b) => {
      const timeCompare = new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
      if (timeCompare !== 0) return timeCompare
      return a.id.localeCompare(b.id)
    })

    // Calculate layout for each appointment
    const layoutMap = new Map<string, { 
      layer: number
      sameTimeGroupId: string
      sameTimeGroupSize: number
      indexInGroup: number
    }>()

    sorted.forEach((apt) => {
      const aptStart = new Date(apt.start_time).getTime()
      const aptEnd = new Date(apt.end_time).getTime()
      
      // Find all appointments that are "active" when this one starts
      // (i.e., they start before this one ends and end after this one starts)
      const activeAppts = sorted.filter((other) => {
        if (other.id === apt.id) return false
        const otherStart = new Date(other.start_time).getTime()
        const otherEnd = new Date(other.end_time).getTime()
        // Active if it overlaps with the start time of this appointment
        return otherStart < aptEnd && otherEnd > aptStart && otherStart < aptStart
      })

      // Check if any active appointments start at the EXACT same time
      const sameTimeAppts = sorted.filter((other) => 
        new Date(other.start_time).getTime() === aptStart
      )

      if (sameTimeAppts.length > 1) {
        // Multiple appointments at same time - equal width split
        const groupId = `group-${aptStart}`
        const indexInGroup = sameTimeAppts.findIndex((a) => a.id === apt.id)
        layoutMap.set(apt.id, {
          layer: activeAppts.length,
          sameTimeGroupId: groupId,
          sameTimeGroupSize: sameTimeAppts.length,
          indexInGroup
        })
      } else {
        // Single appointment at this time - cascading layout
        layoutMap.set(apt.id, {
          layer: activeAppts.length,
          sameTimeGroupId: `single-${apt.id}`,
          sameTimeGroupSize: 1,
          indexInGroup: 0
        })
      }
    })

    // Calculate width and offset for each appointment
    return appointments.map((apt) => {
      const layout = layoutMap.get(apt.id)!
      
      if (layout.sameTimeGroupSize > 1) {
        // Same start time - equal width split with 5px gap
        const gapPx = 5
        const widthPercent = 100 / layout.sameTimeGroupSize
        const leftOffsetPercent = widthPercent * layout.indexInGroup
        
        return {
          ...apt,
          widthPercent,
          leftOffsetPercent,
          gapPx,
          layer: layout.layer,
          isSameTimeGroup: true
        }
      } else {
        // Different start time - cascading with 5% reduction per layer
        const widthReduction = layout.layer * 5
        const widthPercent = Math.max(30, 100 - widthReduction) // Min 30% width
        const leftOffsetPercent = widthReduction
        
        return {
          ...apt,
          widthPercent,
          leftOffsetPercent,
          gapPx: 0,
          layer: layout.layer,
          isSameTimeGroup: false
        }
      }
    })
  }, [appointments])

  const selectedApt = appointmentsWithLayout.find((apt) => apt.id === selectedAppointment)

  // Pinch-to-zoom gesture handler - changes density (vertical spacing)
  const bind = usePinch(
    ({ offset: [s], event }) => {
      // Prevent browser's default page zoom
      event?.preventDefault()
      
      // Don't zoom if we're in the middle of a long-press or drag
      if (longPressTimerRef.current || draggingApt) {
        console.log('🚫 Pinch blocked - long-press/drag active')
        return
      }
      
      // Constrain zoom between 0.5x (compressed) and 2.5x (expanded)
      const constrainedZoom = Math.max(0.5, Math.min(2.5, s))
      setZoomLevel(constrainedZoom)

      // Show zoom indicator
      setShowZoomIndicator(true)
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current)
      zoomTimeoutRef.current = setTimeout(() => {
        setShowZoomIndicator(false)
      }, 1000)
    },
    {
      scaleBounds: { min: 0.5, max: 2.5 },
      rubberband: true,
      from: () => [zoomLevel, 0],
      enabled: !draggingApt, // Disable pinch when dragging
      preventDefault: true, // Prevent default browser behavior
    }
  )

  // Auto-scroll to 7 AM on mount or date change
  useEffect(() => {
    if (containerRef.current) {
      const sevenAMPosition = (7 - 6) * 60 * minuteHeight
      containerRef.current.scrollTop = sevenAMPosition
    }
  }, [selectedDate, minuteHeight])

  // Reset zoom when date changes
  useEffect(() => {
    setZoomLevel(1)
  }, [selectedDate])

  // Cleanup zoom timeout on unmount
  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        clearTimeout(zoomTimeoutRef.current)
      }
    }
  }, [])

  const hourHeight = 60 * minuteHeight

  // 🆕 PHASE 5: Helper function to show notifications
  const showNotification = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setNotification({ message, type })
    
    // Clear existing timeout
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current)
    }
    
    // Auto-hide after 3 seconds
    notificationTimeoutRef.current = setTimeout(() => {
      setNotification(null)
    }, 3000)
  }

  // 🆕 PHASE 5: Haptic feedback helper
  const hapticFeedback = (pattern: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!navigator.vibrate) return
    
    const patterns = {
      light: 10,
      medium: 30,
      heavy: 50
    }
    navigator.vibrate(patterns[pattern])
  }

  // 🆕 PHASE 5: Conflict detection - check if slot is occupied
  const hasConflictAtTime = (newStartTime: Date, newEndTime: Date, excludeAptId: string) => {
    return appointmentsWithLayout.some(apt => {
      if (apt.id === excludeAptId) return false
      
      const aptStart = new Date(apt.start_time).getTime()
      const aptEnd = new Date(apt.end_time).getTime()
      const newStart = newStartTime.getTime()
      const newEnd = newEndTime.getTime()
      
      return newStart < aptEnd && aptStart < newEnd
    })
  }

  // 🆕 PHASE 1: Long-press detection handlers (using Pointer Events)
  const handlePointerDown = (e: React.PointerEvent, aptId: string, apt: any) => {
    // Only handle primary pointer (no multi-touch)
    if (!e.isPrimary) {
      console.log('🚫 Non-primary pointer, ignoring')
      return
    }

    console.log('👆 Pointer down on appointment:', aptId, 'type:', e.pointerType)

    pointerStartYRef.current = e.clientY
    pointerIdRef.current = e.pointerId
    hasDraggedRef.current = false
    isLongPressActiveRef.current = false

    // Capture pointer to this element
    e.currentTarget.setPointerCapture(e.pointerId)

    // Start long-press timer (500ms)
    longPressTimerRef.current = setTimeout(() => {
      console.log('✅ Long-press activated for:', aptId)
      isLongPressActiveRef.current = true
      
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50)
      }

      // Activate drag mode
      const startTime = new Date(apt.start_time)
      const endTime = new Date(apt.end_time)
      const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)

      setDraggingApt({
        id: aptId,
        initialY: e.clientY,
        currentY: e.clientY,
        originalStartTime: startTime,
        durationMinutes
      })

      console.log('📦 Drag state initialized:', {
        id: aptId,
        startTime: startTime.toLocaleTimeString(),
        duration: durationMinutes
      })
    }, 500)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    // Only track the pointer we're watching
    if (e.pointerId !== pointerIdRef.current) return

    const moveDistance = Math.abs(e.clientY - pointerStartYRef.current)

    // Cancel long-press if moved > 10px before activation
    if (longPressTimerRef.current && moveDistance > 10 && !isLongPressActiveRef.current) {
      console.log('🚫 Cancelled long-press (moved', moveDistance, 'px)')
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
      return
    }

    // If drag is active
    if (draggingApt && isLongPressActiveRef.current) {
      // CRITICAL: Prevent all default behavior (scroll, selection, etc.)
      e.preventDefault()
      e.stopPropagation()
      
      // Prevent scroll on the container
      if (containerRef.current) {
        containerRef.current.style.overflow = 'hidden'
      }
      
      hasDraggedRef.current = true

      const newY = e.clientY
      const dragOffsetY = newY - draggingApt.initialY

      // 🆕 PHASE 2: Calculate new time with 15-min snapping
      const minutesOffset = dragOffsetY / minuteHeight
      
      // Get original time in minutes from midnight
      const originalHour = draggingApt.originalStartTime.getHours()
      const originalMinute = draggingApt.originalStartTime.getMinutes()
      const originalMinutesFromMidnight = originalHour * 60 + originalMinute
      
      // Calculate new time
      const newMinutesFromMidnight = originalMinutesFromMidnight + minutesOffset
      
      // Snap to nearest 15 minutes
      const snappedMinutes = Math.round(newMinutesFromMidnight / 15) * 15
      
      // Bounds check (6 AM to 8 PM minus duration)
      const minMinutes = 6 * 60 // 6 AM
      const maxMinutes = 20 * 60 - draggingApt.durationMinutes // 8 PM minus duration
      const boundedMinutes = Math.max(minMinutes, Math.min(maxMinutes, snappedMinutes))
      
      // Convert back to hours and minutes
      const newHour = Math.floor(boundedMinutes / 60)
      const newMinute = boundedMinutes % 60
      
      // Create new Date objects
      const newStartTime = new Date(draggingApt.originalStartTime)
      newStartTime.setHours(newHour, newMinute, 0, 0)
      
      const newEndTime = new Date(newStartTime.getTime() + draggingApt.durationMinutes * 60 * 1000)

      // Format display time
      const displayTime = newStartTime.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })

      // 🆕 PHASE 5: Haptic feedback when snapping to new interval
      if (lastSnappedMinute !== boundedMinutes) {
        hapticFeedback('light')
        setLastSnappedMinute(boundedMinutes)
      }

      console.log('🔄 Drag move:', {
        dragOffsetPx: Math.round(dragOffsetY),
        minutesOffset: Math.round(minutesOffset),
        snappedTo: `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`,
        displayTime
      })

      // Update state with new calculated position
      setDraggingApt({
        ...draggingApt,
        currentY: newY,
        newStartTime,
        newEndTime,
        displayTime
      })
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    // Only handle the pointer we're tracking
    if (e.pointerId !== pointerIdRef.current) return

    console.log('✋ Pointer up, draggingApt:', !!draggingApt, 'hasDragged:', hasDraggedRef.current)
    
    // Restore scroll on container
    if (containerRef.current) {
      containerRef.current.style.overflow = 'auto'
    }
    
    // Clear long-press timer if still pending
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // If we were dragging
    if (draggingApt && hasDraggedRef.current && draggingApt.newStartTime && draggingApt.newEndTime) {
      console.log('💾 Saving appointment to new time:', draggingApt.displayTime)
      
      // 🆕 PHASE 5: Check for conflicts
      const hasConflict = hasConflictAtTime(
        draggingApt.newStartTime,
        draggingApt.newEndTime,
        draggingApt.id
      )
      
      if (hasConflict) {
        console.log('⚠️ Conflict detected - appointments will overlap')
        hapticFeedback('medium')
        // Still allow the update but show a warning
        showNotification('Time slot has other appointments', 'warning')
      }
      
      // 🆕 PHASE 4-5: Update database with loading state and feedback
      setIsUpdating(true)
      hapticFeedback('medium')
      
      updateAppointment.mutate(
        {
          id: draggingApt.id,
          start_time: draggingApt.newStartTime.toISOString(),
          end_time: draggingApt.newEndTime.toISOString(),
        },
        {
          onSuccess: () => {
            console.log('✅ Appointment updated successfully!')
            setIsUpdating(false)
            hapticFeedback('heavy')
            showNotification('Appointment rescheduled', 'success')
          },
          onError: (error) => {
            console.error('❌ Failed to update appointment:', error)
            setIsUpdating(false)
            hapticFeedback('heavy')
            showNotification('Failed to reschedule', 'error')
          },
        }
      )
      
      // Cleanup
      setDraggingApt(null)
      isLongPressActiveRef.current = false
      setLastSnappedMinute(null)
      
      // Keep hasDraggedRef true briefly to prevent click
      setTimeout(() => {
        hasDraggedRef.current = false
        pointerIdRef.current = null
      }, 100)
      return
    }

    // Cleanup
    setDraggingApt(null)
    isLongPressActiveRef.current = false
    pointerIdRef.current = null
    
    // If it was a quick tap, allow click
    if (!hasDraggedRef.current) {
      console.log('👆 Quick tap - will open payment dialog')
    }
    
    setTimeout(() => {
      hasDraggedRef.current = false
    }, 50)
  }

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current)
      }
    }
  }, [])

  // 🆕 PHASE 5: Cleanup notification timeout on unmount
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current)
      }
    }
  }, [])

  // Debug: Log on component mount
  useEffect(() => {
    console.log('🟢 TimeGrid mounted - drag handlers ready')
    console.log('📱 Testing: Tap any appointment to see logs')
  }, [])

  return (
    <div
      ref={containerRef}
      {...bind()}
      className="w-full h-full overflow-y-auto overflow-x-hidden select-none"
      style={{ 
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y pinch-zoom' // Allow both scrolling and pinching
      }}
    >
      <div
        ref={contentRef}
        className="relative"
        style={{ 
          height: `${HOURS.length * hourHeight}px`,
          minHeight: '100%'
        }}
      >
        {/* Time Labels & Grid Lines */}
        {HOURS.map((hour) => {
          const topPosition = (hour - 6) * hourHeight

          return (
            <div
              key={hour}
              className="absolute left-0 right-0 border-t border-gray-200"
              style={{ top: `${topPosition}px` }}
            >
              <div className="flex">
                {/* Time Label */}
                <div className="w-16 flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-500 bg-white sticky left-0">
                  {formatTime(hour)}
                </div>

                {/* Grid Area */}
                <div className="flex-1 relative min-h-[1px]">
                  {/* 15-minute subdivisions */}
                  {[15, 30, 45].map((minute) => (
                    <div
                      key={minute}
                      className="absolute left-0 right-0 border-t border-gray-100"
                      style={{ top: `${(minute / 60) * hourHeight}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )
        })}

        {/* Clickable Time Slots Layer */}
        {onTimeSlotClick && (
          <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
            {HOURS.map((hour) => {
              return [0, 30].map((minute) => {
                const topPosition = ((hour - 6) * 60 + minute) * minuteHeight
                const slotDate = new Date(selectedDate)
                slotDate.setHours(hour, minute, 0, 0)
                const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                
                return (
                  <button
                    key={`${hour}-${minute}`}
                    onClick={() => onTimeSlotClick(slotDate, timeString)}
                    className="absolute left-0 right-0 hover:bg-primary/5 transition-colors pointer-events-auto cursor-pointer"
                    style={{ 
                      top: `${topPosition}px`,
                      height: `${30 * minuteHeight}px`
                    }}
                    aria-label={`Create appointment at ${timeString}`}
                  />
                )
              })
            })}
          </div>
        )}

        {/* Appointments Layer */}
        <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
          {isLoading ? (
            <div className="flex items-center justify-center h-full pointer-events-none">
              <p className="text-gray-400 text-sm">Loading appointments...</p>
            </div>
          ) : appointmentsWithLayout.length === 0 ? (
            <div className="flex items-center justify-center h-full pointer-events-none">
              <p className="text-gray-400 text-sm">No appointments scheduled</p>
            </div>
          ) : (
            <>
              {/* Regular appointments (or faded during drag) */}
              {appointmentsWithLayout.map((apt) => {
              const startTime = new Date(apt.start_time)
              const endTime = new Date(apt.end_time)
              
              const startHour = startTime.getHours()
              const startMinute = startTime.getMinutes()
              const endHour = endTime.getHours()
              const endMinute = endTime.getMinutes()

              const startMinutesFromSix = (startHour - 6) * 60 + startMinute
              const durationMinutes = (endHour - startHour) * 60 + (endMinute - startMinute)

              const top = startMinutesFromSix * minuteHeight
              const height = durationMinutes * minuteHeight

              // 🆕 NEW: Calculate width and position based on cascading/grouping layout
              const cardWidth = apt.widthPercent // Percentage
              const leftOffset = apt.leftOffsetPercent // Percentage
              const gapPx = apt.isSameTimeGroup ? apt.gapPx : 0 // Gap only for same-time groups

              // Calculate dynamic font size based on zoom level
              const baseFontSize = Math.max(0.7, Math.min(1, zoomLevel * 0.8))
              const timeFormat = startTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
              })

              return (
                <div
                  key={apt.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    // Only open payment dialog if it wasn't a drag
                    if (!hasDraggedRef.current) {
                      console.log('💳 Opening payment dialog for:', apt.id)
                      setSelectedAppointment(apt.id)
                    } else {
                      console.log('🚫 Suppressing click (was a drag)')
                    }
                  }}
                  onPointerDown={(e) => handlePointerDown(e, apt.id, apt)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={(e) => {
                    console.log('⚠️ Pointer cancelled')
                    // Restore scroll
                    if (containerRef.current) {
                      containerRef.current.style.overflow = 'auto'
                    }
                    handlePointerUp(e)
                  }}
                  className="absolute rounded-lg shadow-sm border-2 border-white cursor-pointer hover:shadow-md transition-shadow pointer-events-auto select-none"
                  style={{
                    position: 'absolute',
                    top: `${top}px`,
                    height: `${height}px`,
                    left: apt.isSameTimeGroup 
                      ? `calc(${leftOffset}% + ${gapPx / 2}px)` 
                      : `${leftOffset}%`,
                    width: apt.isSameTimeGroup 
                      ? `calc(${cardWidth}% - ${gapPx}px)` 
                      : `${cardWidth}%`,
                    backgroundColor: '#E9D5FF',
                    fontSize: `${baseFontSize}rem`,
                    opacity: draggingApt?.id === apt.id ? 0.4 : 1,
                    transition: 'opacity 0.2s',
                    touchAction: 'none',
                    WebkitUserSelect: 'none',
                    userSelect: 'none',
                    padding: '4px 8px 4px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    overflow: 'hidden',
                    boxSizing: 'border-box'
                  }}
                >
                  {/* Conditional layout based on duration */}
                  {durationMinutes <= 30 ? (
                    // Short appointments (≤30 min): Horizontal layout with just name and time
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <div className="font-bold text-gray-900 truncate leading-tight" style={{ flex: 1, minWidth: 0 }}>
                        {apt.client_name} | {apt.pet_name}
                      </div>
                      <div className="font-medium text-purple-600 text-sm leading-tight ml-2" style={{ flexShrink: 0 }}>
                        {timeFormat}
                      </div>
                    </div>
                  ) : (
                    // Long appointments (>30 min): Vertical layout with all details
                    <>
                      {/* Customer Name (Pet Name) */}
                      <div className="font-bold text-gray-900 truncate leading-tight" style={{ alignSelf: 'flex-start', width: '100%' }}>
                        {apt.client_name} ({apt.pet_name})
                      </div>
                      
                      {/* Time */}
                      <div className="font-medium text-purple-600 text-sm leading-tight mt-0.5" style={{ alignSelf: 'flex-start', width: '100%' }}>
                        {timeFormat}
                      </div>
                      
                      {/* Service */}
                      <div className="text-gray-700 truncate leading-tight text-sm mt-0.5" style={{ alignSelf: 'flex-start', width: '100%' }}>
                        {apt.service_name}
                      </div>
                      
                      {/* Payment Status Badge */}
                      {apt.payment_status === 'paid' && (
                        <div className="text-green-600 font-medium leading-tight mt-1" style={{ fontSize: `${baseFontSize * 0.85}rem`, alignSelf: 'flex-start', width: '100%' }}>
                          ✓ Paid
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
            
            {/* 🆕 PHASE 3: Drag Preview (Ghost Card with Attached Time Badge) */}
            {draggingApt && draggingApt.newStartTime && draggingApt.newEndTime && (() => {
              const apt = appointmentsWithLayout.find(a => a.id === draggingApt.id)
              if (!apt) return null
              
              const newStartHour = draggingApt.newStartTime.getHours()
              const newStartMinute = draggingApt.newStartTime.getMinutes()
              const newStartMinutesFromSix = (newStartHour - 6) * 60 + newStartMinute
              const newTop = newStartMinutesFromSix * minuteHeight
              const newHeight = draggingApt.durationMinutes * minuteHeight
              
              // Use same layout properties as original
              const cardWidth = apt.widthPercent
              const leftOffset = apt.leftOffsetPercent
              const gapPx = apt.isSameTimeGroup ? apt.gapPx : 0
              
              const baseFontSize = Math.max(0.7, Math.min(1, zoomLevel * 0.8))
              
              return (
                <div className="absolute pointer-events-none" style={{ 
                  top: `${newTop}px`, 
                  left: apt.isSameTimeGroup 
                    ? `calc(${leftOffset}% + ${gapPx / 2}px)` 
                    : `${leftOffset}%`,
                  width: apt.isSameTimeGroup 
                    ? `calc(${cardWidth}% - ${gapPx}px)` 
                    : `${cardWidth}%`,
                  zIndex: 100 
                }}>
                  {/* Time Badge - Attached to top-left of card */}
                  <div
                    className="absolute bg-purple-600 text-white px-2 py-0.5 rounded shadow-md font-medium text-xs"
                    style={{
                      top: '-22px',
                      left: '0px',
                    }}
                  >
                    {draggingApt.displayTime}
                  </div>
                  
                  {/* Ghost Card */}
                  <div
                    className="rounded-lg shadow-lg border-2 border-white transition-all duration-100 ease-out"
                    style={{
                      height: `${newHeight}px`,
                      backgroundColor: '#E9D5FF',
                      opacity: 0.85,
                      fontSize: `${baseFontSize}rem`,
                      transform: 'scale(1.02)',
                      padding: '4px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Conditional layout based on duration */}
                    {draggingApt.durationMinutes <= 30 ? (
                      // Short appointments (≤30 min): Horizontal layout
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <div className="font-bold text-gray-900 truncate leading-tight" style={{ flex: 1, minWidth: 0 }}>
                          {apt.client_name} | {apt.pet_name}
                        </div>
                        <div className="font-medium text-purple-600 text-sm leading-tight ml-2" style={{ flexShrink: 0 }}>
                          {draggingApt.displayTime}
                        </div>
                      </div>
                    ) : (
                      // Long appointments (>30 min): Vertical layout
                      <>
                        {/* Customer Name (Pet Name) */}
                        <div className="font-bold text-gray-900 truncate leading-tight" style={{ alignSelf: 'flex-start', width: '100%' }}>
                          {apt.client_name} ({apt.pet_name})
                        </div>
                        
                        {/* Time */}
                        <div className="font-medium text-purple-600 text-sm leading-tight mt-0.5" style={{ alignSelf: 'flex-start', width: '100%' }}>
                          {draggingApt.displayTime}
                        </div>
                        
                        {/* Service */}
                        <div className="text-gray-700 truncate leading-tight text-sm mt-0.5" style={{ alignSelf: 'flex-start', width: '100%' }}>
                          {apt.service_name}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )
            })()}
          </>
          )}
        </div>

        {/* Current Time Indicator */}
        <CurrentTimeIndicator minuteHeight={minuteHeight} />
      </div>

      {/* Zoom Level Indicator */}
      {showZoomIndicator && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg z-50 pointer-events-none">
          <div className="text-sm font-medium">{Math.round(zoomLevel * 100)}%</div>
        </div>
      )}

      {/* Booking Details Dialog */}
      {selectedApt && (
        <BookingDetailsDialog
          open={!!selectedAppointment}
          onOpenChange={(open) => !open && setSelectedAppointment(null)}
          appointmentId={selectedApt.id}
        />
      )}

      {/* 🆕 PHASE 5: Loading Indicator */}
      {isUpdating && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl px-6 py-4 z-50 pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent" />
            <div className="text-sm font-medium text-gray-700">Rescheduling...</div>
          </div>
        </div>
      )}

      {/* 🆕 PHASE 5: Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-20 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg z-50 pointer-events-none animate-in slide-in-from-bottom-5 duration-300 ${
            notification.type === 'success'
              ? 'bg-green-600 text-white'
              : notification.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-orange-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' && <span className="text-lg">✓</span>}
            {notification.type === 'error' && <span className="text-lg">✗</span>}
            {notification.type === 'warning' && <span className="text-lg">⚠</span>}
            <span className="font-medium text-sm">{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}

function CurrentTimeIndicator({ minuteHeight }: { minuteHeight: number }) {
  const [position, setPosition] = useState<number | null>(null)

  useEffect(() => {
    const updatePosition = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()

      if (hours >= 6 && hours < 20) {
        const minutesFromSix = (hours - 6) * 60 + minutes
        setPosition(minutesFromSix * minuteHeight)
      } else {
        setPosition(null)
      }
    }

    updatePosition()
    const interval = setInterval(updatePosition, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [minuteHeight])

  if (position === null) return null

  return (
    <div
      className="absolute left-16 right-0 h-0.5 bg-red-500 z-10 pointer-events-none"
      style={{ top: `${position}px` }}
    >
      <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
    </div>
  )
}

function formatTime(hour: number): string {
  if (hour === 0) return '12 AM'
  if (hour === 12) return '12 PM'
  if (hour < 12) return `${hour} AM`
  return `${hour - 12} PM`
}
