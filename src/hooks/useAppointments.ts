import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { startOfDay, endOfDay } from 'date-fns'

export interface AppointmentPet {
  id: string
  appointment_id: string
  pet_id: string
  service_id: string
  price: number
  pets?: { name: string }
  services?: { name: string; color: string; duration_minutes: number }
}

export interface Appointment {
  id: string
  client_id: string
  pet_id: string // Legacy field (first pet for backward compatibility)
  service_id: string // Legacy field (first service for backward compatibility)
  start_time: string
  end_time: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  price: number // Total price
  payment_status: 'unpaid' | 'paid'
  payment_method: 'cash' | 'card' | 'payid' | null
  notes: string | null
  // Joined data
  clients?: { 
    first_name: string
    last_name: string
    latitude?: number | null
    longitude?: number | null
    address?: string
    suburb?: string
  }
  pets?: { name: string }
  services?: { name: string; color: string }
  appointment_pets?: AppointmentPet[]
}

export interface AppointmentWithDetails extends Appointment {
  client_name: string
  pet_name: string // Comma-separated if multiple
  service_name: string // Comma-separated if multiple
  color: string
}

export function useAppointments(date?: Date) {
  return useQuery({
    queryKey: ['appointments', date?.toDateString()],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          clients (first_name, last_name, latitude, longitude, address, suburb),
          pets (name),
          services (name, color),
          appointment_pets (
            id,
            pet_id,
            service_id,
            price,
            pets (name),
            services (name, color, duration_minutes)
          )
        `)

      if (date) {
        const start = startOfDay(date).toISOString()
        const end = endOfDay(date).toISOString()
        query = query.gte('start_time', start).lte('start_time', end)
      }

      const { data, error } = await query.order('start_time')

      if (error) throw error

      // Transform to include flat fields
      return (data as Appointment[]).map((apt) => {
        // Use appointment_pets if available, otherwise fall back to legacy fields
        const hasPetServices = apt.appointment_pets && apt.appointment_pets.length > 0
        
        const petNames = hasPetServices
          ? apt.appointment_pets!.map(ap => ap.pets?.name || 'Unknown').join(', ')
          : apt.pets?.name || 'Unknown'
        
        const serviceNames = hasPetServices
          ? apt.appointment_pets!.map(ap => ap.services?.name || 'Unknown').join(', ')
          : apt.services?.name || 'Unknown'
        
        const color = hasPetServices
          ? apt.appointment_pets![0].services?.color || '#7c3aed'
          : apt.services?.color || '#7c3aed'

        return {
          ...apt,
          client_name: apt.clients
            ? `${apt.clients.first_name} ${apt.clients.last_name}`
            : 'Unknown',
          pet_name: petNames,
          service_name: serviceNames,
          color: color,
        }
      }) as AppointmentWithDetails[]
    },
  })
}

export interface CreateAppointmentWithPets {
  client_id: string
  start_time: string
  end_time: string
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  payment_status?: 'unpaid' | 'paid'
  payment_method?: 'cash' | 'card' | 'payid' | null
  notes?: string | null
  pets: Array<{
    pet_id: string
    service_id: string
    price: number
  }>
}

export function useCreateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAppointmentWithPets) => {
      // Calculate total price
      const totalPrice = data.pets.reduce((sum, p) => sum + p.price, 0)
      
      // Create the main appointment with first pet/service for legacy compatibility
      const firstPet = data.pets[0]
      const appointmentData = {
        client_id: data.client_id,
        pet_id: firstPet.pet_id,
        service_id: firstPet.service_id,
        start_time: data.start_time,
        end_time: data.end_time,
        status: data.status || 'scheduled',
        price: totalPrice,
        payment_status: data.payment_status || 'unpaid',
        payment_method: data.payment_method || null,
        notes: data.notes || null,
      }

      const { data: appointment, error: appointmentError } = await (supabase as any)
        .from('appointments')
        .insert([appointmentData])
        .select()
        .single()

      if (appointmentError) throw appointmentError

      // Create appointment_pets entries for all pets
      const appointmentPetsData = data.pets.map(pet => ({
        appointment_id: appointment.id,
        pet_id: pet.pet_id,
        service_id: pet.service_id,
        price: pet.price,
      }))

      const { error: petsError } = await (supabase as any)
        .from('appointment_pets')
        .insert(appointmentPetsData)

      if (petsError) throw petsError

      return appointment as any
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}
