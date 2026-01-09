import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface Pet {
  id: string
  client_id: string
  name: string
  species: 'dog' | 'cat' | 'other'
  breed: string | null
  weight_kg: number | null
  age_years: number | null
  temperament: string | null
  medical_notes: string | null
  photo_url: string | null
}

export function usePets(clientId?: string | null) {
  return useQuery({
    queryKey: ['pets', clientId ?? 'all'],
    queryFn: async () => {
      let query = supabase.from('pets').select('*')

      if (clientId) {
        query = query.eq('client_id', clientId)
      }

      const { data, error } = await query.order('name')

      if (error) throw error
      return data as Pet[]
    },
  })
}

export function useCreatePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (pet: Omit<Pet, 'id'>) => {
      const { data, error } = await supabase
        .from('pets')
        // @ts-expect-error - Supabase generated types are too strict
        .insert([pet])
        .select()
        .single()

      if (error) throw error
      return data as Pet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['pets', data.client_id] })
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useUpdatePet() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Pet> & { id: string }) => {
      const { data, error} = await supabase
        .from('pets')
        // @ts-expect-error - Supabase generated types are too strict
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Pet
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pets'] })
      queryClient.invalidateQueries({ queryKey: ['pets', data.client_id] })
    },
  })
}

