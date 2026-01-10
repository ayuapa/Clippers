import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ItemOrDiscount {
  id: string
  name: string
  description: string | null
  type: 'item' | 'discount'
  icon: string
  default_amount: number | null
  is_percentage: boolean
  created_at?: string
  updated_at?: string
}

export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('items_and_discounts')
        .select('*')
        .order('type')
        .order('name')

      if (error) throw error
      return data as ItemOrDiscount[]
    },
  })
}

export function useCreateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (item: Omit<ItemOrDiscount, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('items_and_discounts')
        // @ts-expect-error - Supabase generated types are too strict
        .insert([item])
        .select()
        .single()

      if (error) throw error
      return data as ItemOrDiscount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useUpdateItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ItemOrDiscount> & { id: string }) => {
      const { data, error } = await supabase
        .from('items_and_discounts')
        // @ts-expect-error - Supabase generated types are too strict
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ItemOrDiscount
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}

export function useDeleteItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('items_and_discounts')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
