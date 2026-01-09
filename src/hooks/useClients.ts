import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Client {
  id: string
  first_name: string
  last_name: string
  phone: string
  email: string | null
  address: string
  suburb: string
  postcode: string
  notes: string | null
  is_active: boolean
  latitude?: number | null
  longitude?: number | null
  petCount?: number
}

export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data: clients, error } = await supabase
        .from('clients')
        .select('*')
        .order('first_name')

      if (error) throw error

      // Get pet counts for each client
      const { data: petCounts } = await supabase
        .from('pets')
        .select('client_id')

      const countsMap = new Map<string, number>()
      petCounts?.forEach((pet) => {
        countsMap.set(pet.client_id, (countsMap.get(pet.client_id) || 0) + 1)
      })

      return clients.map((client) => ({
        ...client,
        petCount: countsMap.get(client.id) || 0,
      })) as Client[]
    },
  })
}

export function useClient(id: string) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Client
    },
    enabled: !!id,
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (client: Omit<Client, 'id' | 'petCount'>) => {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Client> & { id: string }) => {
      const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useSoftDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      // 1. Soft delete the client (set is_active to false)
      const { error: clientError } = await supabase
        .from('clients')
        .update({ is_active: false })
        .eq('id', clientId)

      if (clientError) throw clientError

      // 2. Delete all incomplete appointments for this client
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('client_id', clientId)
        .neq('status', 'completed')

      if (appointmentError) throw appointmentError

      return { clientId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    },
  })
}

export function useHardDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientId: string) => {
      // 1. Delete all incomplete appointments (completed appointments stay)
      const { error: appointmentError } = await supabase
        .from('appointments')
        .delete()
        .eq('client_id', clientId)
        .neq('status', 'completed')

      if (appointmentError) throw appointmentError

      // 2. Delete all pets for this client
      const { error: petsError } = await supabase
        .from('pets')
        .delete()
        .eq('client_id', clientId)

      if (petsError) throw petsError

      // 3. Hard delete the client
      const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (clientError) throw clientError

      return { clientId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
      queryClient.invalidateQueries({ queryKey: ['pets'] })
    },
  })
}

