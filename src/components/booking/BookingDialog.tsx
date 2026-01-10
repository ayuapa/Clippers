import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useClients } from '@/hooks/useClients'
import { usePets } from '@/hooks/usePets'
import { useServices } from '@/hooks/useServices'
import { useCreateAppointment, type CreateAppointmentWithPets } from '@/hooks/useAppointments'
import { Calendar, Clock, User, Dog, Scissors, Plus, X } from 'lucide-react'
import { formatInTimeZone } from 'date-fns-tz'

interface BookingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultDate?: Date
  defaultTime?: string
}

interface PetServicePair {
  id: string // temporary ID for UI
  petId: string
  serviceId: string
}

export function BookingDialog({
  open,
  onOpenChange,
  defaultDate,
  defaultTime,
}: BookingDialogProps) {
  const createAppointment = useCreateAppointment()
  const { data: clients = [] } = useClients()
  const { data: allPets = [] } = usePets(undefined)
  const { data: services = [] } = useServices()
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    clientId: '',
    notes: '',
  })
  
  const [petServices, setPetServices] = useState<PetServicePair[]>([])

  const clientPets = allPets.filter((p) => p.client_id === formData.clientId)

  // Calculate total duration from all selected services
  const totalDuration = useMemo(() => {
    return petServices.reduce((total, ps) => {
      const service = services.find(s => s.id === ps.serviceId)
      return total + (service?.duration_minutes || 0)
    }, 0)
  }, [petServices, services])

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      // Format date for input (YYYY-MM-DD)
      const dateToUse = defaultDate || new Date()
      const formattedDate = formatInTimeZone(dateToUse, 'Australia/Sydney', 'yyyy-MM-dd')
      const timeToUse = defaultTime || '09:00'
      
      setFormData({
        date: formattedDate,
        time: timeToUse,
        clientId: '',
        notes: '',
      })
      setPetServices([])
    }
  }, [open, defaultDate, defaultTime])

  // Update date and time when defaultDate or defaultTime changes
  useEffect(() => {
    if (defaultDate && open) {
      const formattedDate = formatInTimeZone(defaultDate, 'Australia/Sydney', 'yyyy-MM-dd')
      setFormData(prev => ({ ...prev, date: formattedDate }))
    }
  }, [defaultDate, open])

  useEffect(() => {
    if (defaultTime && open) {
      setFormData(prev => ({ ...prev, time: defaultTime }))
    }
  }, [defaultTime, open])

  const addPetService = () => {
    setPetServices([...petServices, {
      id: `temp-${Date.now()}`,
      petId: '',
      serviceId: '',
    }])
  }

  const removePetService = (id: string) => {
    setPetServices(petServices.filter(ps => ps.id !== id))
  }

  const updatePetService = (id: string, field: 'petId' | 'serviceId', value: string) => {
    setPetServices(petServices.map(ps => 
      ps.id === id ? { ...ps, [field]: value } : ps
    ))
  }

  const canSubmit = formData.clientId && formData.date && formData.time && 
                    petServices.length > 0 && 
                    petServices.every(ps => ps.petId && ps.serviceId)

  const handleSubmit = async () => {
    if (!canSubmit) return

    try {
      // Parse date and time
      const [hours, minutes] = formData.time.split(':').map(Number)
      const appointmentDate = new Date(formData.date)
      appointmentDate.setHours(hours, minutes, 0, 0)
      
      const endTime = new Date(appointmentDate)
      endTime.setMinutes(endTime.getMinutes() + totalDuration)

      // Prepare pets array with prices
      const petsWithPrices = petServices.map(ps => {
        const service = services.find(s => s.id === ps.serviceId)
        return {
          pet_id: ps.petId,
          service_id: ps.serviceId,
          price: service?.base_price || 0,
        }
      })

      const appointmentData: CreateAppointmentWithPets = {
        client_id: formData.clientId,
        start_time: appointmentDate.toISOString(),
        end_time: endTime.toISOString(),
        status: 'scheduled',
        payment_status: 'unpaid',
        payment_method: null,
        notes: formData.notes || null,
        pets: petsWithPrices,
      }

      await createAppointment.mutateAsync(appointmentData)

      // Close and reset
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create appointment:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Appointment</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date and Time Row */}
          <div className="grid grid-cols-[60%_40%] gap-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Client
            </Label>
            <Select
              value={formData.clientId}
              onValueChange={(value) => {
                setFormData({ ...formData, clientId: value })
                // Reset pet services when client changes
                setPetServices([])
              }}
            >
              <SelectTrigger id="client">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Pets Section */}
          <div className="space-y-3 pt-2 pb-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Dog className="h-5 w-5 text-primary" />
                Pets & Services ({petServices.length})
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addPetService}
                disabled={!formData.clientId || clientPets.length === 0}
                className="h-8 w-8 p-0 text-primary border-primary hover:bg-primary/10"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {!formData.clientId ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Dog className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Please select a client first</p>
                <p className="text-xs text-gray-400 mt-1">Choose a client to see their pets</p>
              </div>
            ) : clientPets.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Dog className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">This client has no pets</p>
                <p className="text-xs text-gray-400 mt-1">Add a pet from the client's profile first</p>
              </div>
            ) : petServices.length === 0 ? (
              <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Dog className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No pets added yet</p>
                <p className="text-xs text-gray-400 mt-1">Click + to add a pet and service</p>
              </div>
            ) : (
                <div className="space-y-3">
                  {petServices.map((ps, index) => (
                    <div
                      key={ps.id}
                      className="relative border border-gray-200 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Dog className="h-4 w-4 text-primary" />
                          Pet #{index + 1}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePetService(ps.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="space-y-3">
                        {/* Pet Selection */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600">Pet</Label>
                          <Select
                            value={ps.petId}
                            onValueChange={(value) => updatePetService(ps.id, 'petId', value)}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select a pet" />
                            </SelectTrigger>
                            <SelectContent>
                              {clientPets.map((pet) => (
                                <SelectItem key={pet.id} value={pet.id}>
                                  {pet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Service Selection */}
                        <div className="space-y-1">
                          <Label className="text-xs text-gray-600 flex items-center gap-1">
                            <Scissors className="h-3 w-3" />
                            Service
                          </Label>
                          <Select
                            value={ps.serviceId}
                            onValueChange={(value) => updatePetService(ps.id, 'serviceId', value)}
                          >
                            <SelectTrigger className="bg-white">
                              <SelectValue placeholder="Select a service" />
                            </SelectTrigger>
                            <SelectContent>
                              {services.filter(s => s.is_active).map((service) => (
                                <SelectItem key={service.id} value={service.id}>
                                  {service.name} ({service.duration_minutes} min - ${service.base_price})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Total Duration Display */}
                  {totalDuration > 0 && (
                    <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-center">
                      <p className="text-sm font-medium text-primary">
                        Total Duration: {Math.floor(totalDuration / 60)}h {totalDuration % 60}m
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any special instructions..."
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={!canSubmit}
            >
              Create Appointment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
