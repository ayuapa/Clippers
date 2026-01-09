import { useAppointments } from '@/hooks/useAppointments'
import { useMemo } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { Clock, User, Dog, Scissors, MapPin, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface ListViewProps {
  selectedDate: Date
  filterType: 'all' | 'confirmed' | 'completed'
  onAppointmentClick?: (appointmentId: string) => void
}

export function ListView({ selectedDate, filterType, onAppointmentClick }: ListViewProps) {
  const { data: allAppointments = [], isLoading } = useAppointments(selectedDate)

  // Filter appointments based on filterType
  const appointments = useMemo(() => {
    let filtered = allAppointments
    
    if (filterType === 'confirmed') {
      filtered = filtered.filter(apt => apt.status === 'scheduled')
    } else if (filterType === 'completed') {
      filtered = filtered.filter(apt => apt.status === 'completed')
    }
    
    return filtered.sort((a, b) => 
      new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    )
  }, [allAppointments, filterType])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading appointments...</p>
        </div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 px-8">
        <Clock className="h-12 w-12 text-gray-300 mb-3" />
        <p className="font-medium text-gray-600 mb-1">No appointments</p>
        <p className="text-sm text-gray-400 text-center">
          {filterType === 'all' 
            ? `No appointments scheduled for ${format(selectedDate, 'MMM d, yyyy')}`
            : `No ${filterType} appointments for this date`}
        </p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="p-3 space-y-2">
        {appointments.map((apt) => {
          const startTime = new Date(apt.start_time)
          const endTime = new Date(apt.end_time)
          const timeString = formatInTimeZone(startTime, 'Australia/Sydney', 'h:mm a')
          const endTimeString = formatInTimeZone(endTime, 'Australia/Sydney', 'h:mm a')

          return (
            <div
              key={apt.id}
              onClick={() => onAppointmentClick?.(apt.id)}
              className="bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-3 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
            >
              {/* Time with Status Badge */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-purple-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-gray-900">
                    {timeString} - {endTimeString}
                  </span>
                </div>
                
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded ${
                    apt.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : apt.status === 'scheduled'
                      ? 'bg-blue-100 text-blue-700'
                      : apt.status === 'cancelled'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {apt.status === 'scheduled' ? 'Confirmed' : apt.status}
                </span>
              </div>

              {/* Name | Pet */}
              <div className="flex items-center gap-1.5 text-sm text-gray-900 mb-1.5">
                <User className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="font-medium">{apt.client_name}</span>
                <span className="text-gray-400">|</span>
                <Dog className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-gray-700">{apt.pet_name}</span>
              </div>

              {/* Service | Cost */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1.5">
                  <Scissors className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                  <span className="text-gray-700">{apt.service_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                    <span className="font-semibold text-gray-900">
                      {apt.price.toFixed(2)}
                    </span>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      apt.payment_status === 'paid'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {apt.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

