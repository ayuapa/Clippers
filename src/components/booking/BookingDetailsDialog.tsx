import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'
import { useAppointments, useUpdateAppointment } from '@/hooks/useAppointments'
import { useToast } from '@/hooks/use-toast'
import { formatInSydney } from '@/lib/timezone'
import { format, differenceInMinutes } from 'date-fns'

interface BookingDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
  onEdit?: () => void
  onCheckout?: () => void
}

export function BookingDetailsDialog({
  open,
  onOpenChange,
  appointmentId,
  onEdit,
  onCheckout,
}: BookingDetailsDialogProps) {
  const { data: allAppointments = [] } = useAppointments()
  const appointment = allAppointments.find((apt) => apt.id === appointmentId)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const updateAppointment = useUpdateAppointment()
  const { toast } = useToast()

  if (!appointment) return null

  // Calculate duration
  const startTime = new Date(appointment.start_time)
  const endTime = new Date(appointment.end_time)
  const durationMinutes = differenceInMinutes(endTime, startTime)
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  const durationText = hours > 0 
    ? `${hours}hr${minutes > 0 ? ` ${minutes}min` : ''}`
    : `${minutes}min`

  // Format date and time
  const dateStr = formatInSydney(startTime, 'EEEE do MMMM yyyy')
  const timeStr = `${formatInSydney(startTime, 'h:mma')} - ${formatInSydney(endTime, 'h:mma')}`

  // Parse appointment_pets (it's a JSON array from the DB)
  const appointmentPets = Array.isArray(appointment.appointment_pets)
    ? appointment.appointment_pets
    : []

  // Calculate total from appointment_pets if total_price not available
  const calculatedTotal = appointmentPets.reduce((sum, item: any) => sum + (item.price || 0), 0)
  const totalPrice = calculatedTotal || 0
  
  // Calculate GST (assuming it's included in the total)
  const totalWithoutGst = totalPrice / 1.1
  const gst = totalPrice - totalWithoutGst

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">Booking Details</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Date & Time */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Date & Time</h3>
            <p className="text-base text-gray-900">
              {dateStr}
            </p>
            <p className="text-base text-gray-900">
              {timeStr} <span className="text-gray-500">({durationText})</span>
            </p>
          </div>

          {/* Client */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Client</h3>
            <button
              className="w-full flex items-center justify-between py-2 px-3 -mx-3 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => {
                // TODO: Navigate to client details
                console.log('Navigate to client:', appointment.client_id)
              }}
            >
              <span className="text-base text-gray-900 font-medium">
                {appointment.client_name}
              </span>
              <ChevronRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Pets, Services & Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Pets, Services & Items</h3>
            <div className="space-y-3">
              {appointmentPets.length === 0 && (
                <div className="text-sm text-gray-500 italic py-2">
                  No pets/services data available
                </div>
              )}
              {appointmentPets.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">🐕</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900">{item.pets?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-600">
                      {item.services?.name || 'Unknown'} ({item.services?.duration_minutes || 0}min)
                    </p>
                  </div>
                  <div className="text-base font-semibold text-gray-900">
                    ${(item.price || 0).toFixed(0)}
                  </div>
                </div>
              ))}

              {/* Divider */}
              <div className="border-t border-gray-200 my-3" />

              {/* GST */}
              <div className="flex items-center justify-between px-3">
                <span className="text-sm text-gray-600">GST (inclusive)</span>
                <span className="text-sm font-medium text-gray-900">
                  ${gst.toFixed(0)}
                </span>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between px-3 pt-2">
                <span className="text-xl font-bold text-gray-900">TOTAL</span>
                <span className="text-xl font-bold text-gray-900">
                  ${totalPrice.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 text-base font-semibold"
              onClick={() => {
                if (onEdit) onEdit()
                console.log('Edit booking:', appointmentId)
              }}
            >
              Edit booking
            </Button>
            <Button
              className="h-12 text-base font-semibold bg-gray-900 hover:bg-gray-800"
              onClick={() => {
                if (onCheckout) onCheckout()
                console.log('Checkout:', appointmentId)
              }}
            >
              CHECKOUT
            </Button>
          </div>

          <button
            onClick={() => setShowCancelConfirm(true)}
            className="w-full text-center text-sm font-medium text-red-600 hover:text-red-700 py-2"
          >
            Cancel booking
          </button>
        </div>

        {/* Cancel Confirmation (simple for now) */}
        {showCancelConfirm && (
          <div className="absolute inset-0 bg-white rounded-lg flex items-center justify-center p-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Cancel this booking?</h3>
              <p className="text-sm text-gray-600">This action cannot be undone.</p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1"
                >
                  No, keep it
                </Button>
                <Button
                  variant="destructive"
                  onClick={async () => {
                    setIsCancelling(true)
                    try {
                      await updateAppointment.mutateAsync({
                        id: appointmentId,
                        status: 'cancelled',
                      })
                      toast({
                        title: 'Booking Cancelled',
                        description: 'The appointment has been cancelled successfully.',
                      })
                      setShowCancelConfirm(false)
                      onOpenChange(false)
                    } catch (error) {
                      console.error('Failed to cancel booking:', error)
                      toast({
                        title: 'Error',
                        description: 'Failed to cancel booking. Please try again.',
                      })
                      setIsCancelling(false)
                    }
                  }}
                  disabled={isCancelling}
                  className="flex-1"
                >
                  {isCancelling ? 'Cancelling...' : 'Yes, cancel'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
