import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ChevronRight, X, Plus } from 'lucide-react'
import { useAppointments, useUpdateAppointment } from '@/hooks/useAppointments'
import { useServices } from '@/hooks/useServices'
import { usePets } from '@/hooks/usePets'
import { useToast } from '@/hooks/use-toast'
import { formatInSydney } from '@/lib/timezone'
import { differenceInMinutes } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { EditDateTimeDialog } from './EditDateTimeDialog'
import { ClientSelectorDialog } from './ClientSelectorDialog'
import { ChangeSummaryDialog } from './ChangeSummaryDialog'
import { CheckoutDialog } from './CheckoutDialog'

interface EditablePetService {
  id?: string // appointment_pets.id if existing
  pet_id: string
  service_id: string
  price: number
  pet_name?: string
  service_name?: string
  service_duration?: number
}

interface BookingDetailsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  appointmentId: string
}

export function BookingDetailsDialog({
  open,
  onOpenChange,
  appointmentId,
}: BookingDetailsDialogProps) {
  const { data: allAppointments = [] } = useAppointments()
  const appointment = allAppointments.find((apt) => apt.id === appointmentId)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const updateAppointment = useUpdateAppointment()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false)
  const [editedStartTime, setEditedStartTime] = useState<Date | null>(null)
  const [editedEndTime, setEditedEndTime] = useState<Date | null>(null)
  const [editedClientId, setEditedClientId] = useState<string | null>(null)
  const [editedPetServices, setEditedPetServices] = useState<EditablePetService[]>([])
  const [showDateTimeDialog, setShowDateTimeDialog] = useState(false)
  const [showClientDialog, setShowClientDialog] = useState(false)
  const [showChangeSummary, setShowChangeSummary] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  
  // Fetch data for editing
  const { data: clientPets = [] } = usePets(isEditing ? (editedClientId || appointment?.client_id) : null)
  const { data: allServices = [] } = useServices()

  if (!appointment) return null

  // Initialize edit state when entering edit mode
  const initializeEditMode = () => {
    setIsEditing(true)
    setEditedStartTime(new Date(appointment.start_time))
    setEditedEndTime(new Date(appointment.end_time))
    setEditedClientId(appointment.client_id)
    
    // Initialize pet services from appointment_pets
    const appointmentPets = Array.isArray(appointment.appointment_pets)
      ? appointment.appointment_pets
      : []
    
    setEditedPetServices(
      appointmentPets.map((ap: any) => ({
        id: ap.id,
        pet_id: ap.pet_id,
        service_id: ap.service_id,
        price: ap.price || 0,
        pet_name: ap.pets?.name,
        service_name: ap.services?.name,
        service_duration: ap.services?.duration_minutes,
      }))
    )
  }

  // Calculate duration (use edited times if in edit mode)
  const startTime = isEditing && editedStartTime ? editedStartTime : new Date(appointment.start_time)
  const endTime = isEditing && editedEndTime ? editedEndTime : new Date(appointment.end_time)
  const durationMinutes = differenceInMinutes(endTime, startTime)
  const hours = Math.floor(durationMinutes / 60)
  const minutes = durationMinutes % 60
  const durationText = hours > 0 
    ? `${hours}hr${minutes > 0 ? ` ${minutes}min` : ''}`
    : `${minutes}min`

  // Format date and time
  const dateStr = formatInSydney(startTime, 'EEEE do MMMM yyyy')
  const timeStr = `${formatInSydney(startTime, 'h:mma')} - ${formatInSydney(endTime, 'h:mma')}`

  // Get current client name (edited or original)
  const currentClientName = isEditing && editedClientId 
    ? allAppointments.find(a => a.client_id === editedClientId)?.client_name || appointment.client_name
    : appointment.client_name

  // Parse appointment_pets (use edited if in edit mode)
  const displayPets = isEditing && editedPetServices.length > 0
    ? editedPetServices
    : (Array.isArray(appointment.appointment_pets) ? appointment.appointment_pets : [])

  // Calculate total from displayed pets
  const calculatedTotal = displayPets.reduce((sum: number, item: any) => sum + (item.price || 0), 0)
  const totalPrice = calculatedTotal || 0
  
  // Calculate GST (assuming it's included in the total)
  const totalWithoutGst = totalPrice / 1.1
  const gst = totalPrice - totalWithoutGst
  
  // Recalculate end time when services change in edit mode
  const handlePetServicesChange = (newPetServices: EditablePetService[]) => {
    setEditedPetServices(newPetServices)
    
    // Recalculate duration and end time
    const totalDuration = newPetServices.reduce((sum, ps) => sum + (ps.service_duration || 0), 0)
    if (editedStartTime) {
      const newEndTime = new Date(editedStartTime.getTime() + totalDuration * 60000)
      setEditedEndTime(newEndTime)
    }
  }

  // Save changes to database
  const handleSaveChanges = async () => {
    if (!editedStartTime || !editedEndTime || !editedClientId) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields.',
      })
      return
    }

    if (editedPetServices.length === 0) {
      toast({
        title: 'Error',
        description: 'Please add at least one pet and service.',
      })
      return
    }

    // Validate all pet services have selections
    const invalidPetService = editedPetServices.find(ps => !ps.pet_id || !ps.service_id)
    if (invalidPetService) {
      toast({
        title: 'Error',
        description: 'Please select a pet and service for all entries.',
      })
      return
    }

    setIsSaving(true)
    try {
      // Calculate new total price
      const newTotalPrice = editedPetServices.reduce((sum, ps) => sum + ps.price, 0)

      // Step 1: Update the main appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        // @ts-expect-error - Supabase generated types are too strict
        .update({
          client_id: editedClientId,
          start_time: editedStartTime.toISOString(),
          end_time: editedEndTime.toISOString(),
          price: newTotalPrice,
          // Update legacy fields for backward compatibility
          pet_id: editedPetServices[0].pet_id,
          service_id: editedPetServices[0].service_id,
        })
        .eq('id', appointmentId)

      if (appointmentError) throw appointmentError

      // Step 2: Delete old appointment_pets records
      const { error: deleteError } = await supabase
        .from('appointment_pets')
        .delete()
        .eq('appointment_id', appointmentId)

      if (deleteError) throw deleteError

      // Step 3: Insert new appointment_pets records
      const appointmentPetsData = editedPetServices.map(ps => ({
        appointment_id: appointmentId,
        pet_id: ps.pet_id,
        service_id: ps.service_id,
        price: ps.price,
      }))

      const { error: insertError } = await supabase
        .from('appointment_pets')
        // @ts-expect-error - Supabase generated types are too strict
        .insert(appointmentPetsData)

      if (insertError) throw insertError

      // Success!
      toast({
        title: 'Booking Updated',
        description: 'Your changes have been saved successfully.',
      })

      // Reset edit mode and close dialogs
      setIsEditing(false)
      setShowChangeSummary(false)
      setIsSaving(false)
      
      // Invalidate appointments query to refresh data (non-blocking)
      queryClient.invalidateQueries({ queryKey: ['appointments'] }).catch(err => {
        console.error('Failed to invalidate queries:', err)
      })
      
      // Close the main dialog
      onOpenChange(false)
    } catch (error: any) {
      console.error('Failed to save changes:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to save changes. Please try again.',
      })
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? 'Editing Booking' : 'Booking Details'}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Date & Time */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Date & Time</h3>
            {isEditing ? (
              <button
                className="w-full flex items-center justify-between py-2 px-3 -mx-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                onClick={() => setShowDateTimeDialog(true)}
              >
                <div>
                  <p className="text-base text-gray-900">{dateStr}</p>
                  <p className="text-base text-gray-900">
                    {timeStr} <span className="text-gray-500">({durationText})</span>
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ) : (
              <div>
                <p className="text-base text-gray-900">{dateStr}</p>
                <p className="text-base text-gray-900">
                  {timeStr} <span className="text-gray-500">({durationText})</span>
                </p>
              </div>
            )}
          </div>

          {/* Client */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">Client</h3>
            {isEditing ? (
              <button
                className="w-full flex items-center justify-between py-2 px-3 -mx-3 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => setShowClientDialog(true)}
              >
                <span className="text-base text-gray-900 font-medium">
                  {currentClientName}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            ) : (
              <button
                className="w-full flex items-center justify-between py-2 px-3 -mx-3 hover:bg-gray-50 rounded-lg transition-colors"
                onClick={() => {
                  console.log('Navigate to client:', appointment.client_id)
                }}
              >
                <span className="text-base text-gray-900 font-medium">
                  {currentClientName}
                </span>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>

          {/* Pets, Services & Items */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-3">Pets, Services & Items</h3>
            <div className="space-y-3">
              {displayPets.length === 0 && (
                <div className="text-sm text-gray-500 italic py-2">
                  {isEditing ? 'Add pets and services below' : 'No pets/services data available'}
                </div>
              )}
              {displayPets.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-bold text-primary">🐕</span>
                  </div>
                  {isEditing ? (
                    <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto] gap-3">
                      <div className="space-y-2">
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={item.pet_id}
                          onChange={(e) => {
                            const newPetServices = [...editedPetServices]
                            const selectedPet = clientPets.find(p => p.id === e.target.value)
                            newPetServices[index] = {
                              ...newPetServices[index],
                              pet_id: e.target.value,
                              pet_name: selectedPet?.name,
                            }
                            handlePetServicesChange(newPetServices)
                          }}
                        >
                          <option value="">Select Pet</option>
                          {clientPets.map((pet) => (
                            <option key={pet.id} value={pet.id}>
                              {pet.name}
                            </option>
                          ))}
                        </select>
                        <select
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          value={item.service_id}
                          onChange={(e) => {
                            const newPetServices = [...editedPetServices]
                            const selectedService = allServices.find(s => s.id === e.target.value)
                            newPetServices[index] = {
                              ...newPetServices[index],
                              service_id: e.target.value,
                              price: selectedService?.base_price || 0,
                              service_name: selectedService?.name,
                              service_duration: selectedService?.duration_minutes,
                            }
                            handlePetServicesChange(newPetServices)
                          }}
                        >
                          <option value="">Select Service</option>
                          {allServices.map((service) => (
                            <option key={service.id} value={service.id}>
                              {service.name} (${service.base_price})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col items-end justify-between">
                        <button
                          onClick={() => {
                            const newPetServices = editedPetServices.filter((_, i) => i !== index)
                            handlePetServicesChange(newPetServices)
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                        <span className="text-base font-semibold text-gray-900">
                          ${(item.price || 0).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-gray-900">
                          {item.pets?.name || item.pet_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.services?.name || item.service_name || 'Unknown'} ({item.services?.duration_minutes || item.service_duration || 0}min)
                        </p>
                      </div>
                      <div className="text-base font-semibold text-gray-900">
                        ${(item.price || 0).toFixed(0)}
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {isEditing && (
                <button
                  onClick={() => {
                    handlePetServicesChange([
                      ...editedPetServices,
                      { pet_id: '', service_id: '', price: 0 },
                    ])
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 py-2"
                >
                  <Plus className="h-4 w-4" />
                  Add another pet
                </button>
              )}

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
          {isEditing ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-12 text-base font-semibold"
                onClick={() => {
                  // Cancel editing - reset state
                  setIsEditing(false)
                  setEditedStartTime(null)
                  setEditedEndTime(null)
                  setEditedClientId(null)
                  setEditedPetServices([])
                }}
              >
                Cancel
              </Button>
              <Button
                className="h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                onClick={() => setShowChangeSummary(true)}
                disabled={editedPetServices.length === 0 || editedPetServices.some(ps => !ps.pet_id || !ps.service_id)}
              >
                Save
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 text-base font-semibold"
                  onClick={initializeEditMode}
                >
                  Edit booking
                </Button>
                <Button
                  className="h-12 text-base font-semibold bg-gray-900 hover:bg-gray-800"
                  onClick={() => setShowCheckout(true)}
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
            </>
          )}
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
      
      {/* Edit Date & Time Dialog */}
      {isEditing && editedStartTime && (
        <EditDateTimeDialog
          open={showDateTimeDialog}
          onOpenChange={setShowDateTimeDialog}
          initialDate={editedStartTime}
          initialStartTime={editedStartTime}
          initialEndTime={editedEndTime || endTime}
          onSave={(_date, startTime, endTime) => {
            setEditedStartTime(startTime)
            setEditedEndTime(endTime)
            setShowDateTimeDialog(false)
          }}
        />
      )}
      
      {/* Client Selector Dialog */}
      {isEditing && (
        <ClientSelectorDialog
          open={showClientDialog}
          onOpenChange={setShowClientDialog}
          currentClientId={editedClientId || appointment.client_id}
          onClientSelect={(clientId) => {
            setEditedClientId(clientId)
            // Clear pet services when client changes
            setEditedPetServices([])
            setShowClientDialog(false)
          }}
        />
      )}
      
      {/* Change Summary Dialog */}
      {isEditing && showChangeSummary && editedStartTime && editedEndTime && (
        <ChangeSummaryDialog
          open={showChangeSummary}
          onOpenChange={setShowChangeSummary}
          oldData={{
            client_name: appointment.client_name,
            start_time: new Date(appointment.start_time),
            end_time: new Date(appointment.end_time),
            pets: (Array.isArray(appointment.appointment_pets) ? appointment.appointment_pets : []).map((ap: any) => ({
              pet_name: ap.pets?.name || 'Unknown',
              service_name: ap.services?.name || 'Unknown',
              price: ap.price || 0,
            })),
          }}
          newData={{
            client_name: currentClientName,
            start_time: editedStartTime,
            end_time: editedEndTime,
            pets: editedPetServices.map(ps => ({
              pet_name: ps.pet_name || clientPets.find(p => p.id === ps.pet_id)?.name || 'Unknown',
              service_name: ps.service_name || allServices.find(s => s.id === ps.service_id)?.name || 'Unknown',
              price: ps.price,
            })),
          }}
          onConfirm={handleSaveChanges}
          isSaving={isSaving}
        />
      )}
      
      {/* Checkout Dialog */}
      <CheckoutDialog
        open={showCheckout}
        onOpenChange={(open) => {
          setShowCheckout(open)
          // Close main dialog when checkout completes
          if (!open) {
            onOpenChange(false)
          }
        }}
        appointmentId={appointmentId}
      />
    </Dialog>
  )
}
