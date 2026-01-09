import { create } from 'zustand'

interface Appointment {
  id: string
  client_id: string
  client_name: string
  pet_id: string
  pet_name: string
  service_id: string
  service_name: string
  start_time: Date
  end_time: Date
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  price: number
  payment_status: 'unpaid' | 'paid'
  payment_method: 'cash' | 'card' | 'payid' | null
  notes: string | null
  color: string
}

interface AppointmentStore {
  appointments: Appointment[]
  addAppointment: (appointment: Omit<Appointment, 'id'>) => void
  updateAppointment: (id: string, updates: Partial<Appointment>) => void
  deleteAppointment: (id: string) => void
  getAppointmentsByDate: (date: Date) => Appointment[]
}

export const useAppointmentStore = create<AppointmentStore>((set, get) => ({
  appointments: [
    // Mock data for testing
    {
      id: '1',
      client_id: '1',
      client_name: 'Sarah Johnson',
      pet_id: '1',
      pet_name: 'Max',
      service_id: '1',
      service_name: 'Full Groom',
      start_time: new Date(new Date().setHours(9, 30, 0, 0)),
      end_time: new Date(new Date().setHours(11, 0, 0, 0)),
      status: 'scheduled',
      price: 85,
      payment_status: 'unpaid',
      payment_method: null,
      notes: null,
      color: '#7c3aed',
    },
    {
      id: '2',
      client_id: '2',
      client_name: 'Michael Smith',
      pet_id: '3',
      pet_name: 'Buddy',
      service_id: '2',
      service_name: 'Deshed Treatment',
      start_time: new Date(new Date().setHours(14, 0, 0, 0)),
      end_time: new Date(new Date().setHours(15, 0, 0, 0)),
      status: 'scheduled',
      price: 65,
      payment_status: 'unpaid',
      payment_method: null,
      notes: null,
      color: '#ec4899',
    },
  ],
  addAppointment: (appointment) =>
    set((state) => ({
      appointments: [
        ...state.appointments,
        { ...appointment, id: Math.random().toString(36).substr(2, 9) },
      ],
    })),
  updateAppointment: (id, updates) =>
    set((state) => ({
      appointments: state.appointments.map((apt) =>
        apt.id === id ? { ...apt, ...updates } : apt
      ),
    })),
  deleteAppointment: (id) =>
    set((state) => ({
      appointments: state.appointments.filter((apt) => apt.id !== id),
    })),
  getAppointmentsByDate: (date) => {
    const appointments = get().appointments
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    return appointments.filter(
      (apt) => apt.start_time >= startOfDay && apt.start_time <= endOfDay
    )
  },
}))

