import { useState, useEffect } from 'react'
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
import { useCreatePet, useUpdatePet, type Pet } from '@/hooks/usePets'

interface PetDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  clientId: string
  pet?: Pet
}

export function PetDialog({
  open,
  onOpenChange,
  mode,
  clientId,
  pet,
}: PetDialogProps) {
  const createPet = useCreatePet()
  const updatePet = useUpdatePet()
  
  const [formData, setFormData] = useState({
    name: '',
    breed: '',
    temperament: '',
    medical_notes: '',
  })

  useEffect(() => {
    if (mode === 'edit' && pet) {
      setFormData({
        name: pet.name,
        breed: pet.breed || '',
        temperament: pet.temperament || '',
        medical_notes: pet.medical_notes || '',
      })
    } else {
      setFormData({
        name: '',
        breed: '',
        temperament: '',
        medical_notes: '',
      })
    }
  }, [mode, pet, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const petData = {
        client_id: clientId,
        name: formData.name,
        species: 'dog' as const, // Always dog
        breed: formData.breed || null,
        weight_kg: null, // Removed field
        age_years: null, // Removed field
        temperament: formData.temperament || null,
        medical_notes: formData.medical_notes || null,
        photo_url: null,
      }

      if (mode === 'create') {
        await createPet.mutateAsync(petData)
      } else if (pet) {
        await updatePet.mutateAsync({ id: pet.id, ...petData })
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save pet:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Pet' : 'Edit Pet'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pet Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Max"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Breed</Label>
            <Input
              id="breed"
              value={formData.breed}
              onChange={(e) =>
                setFormData({ ...formData, breed: e.target.value })
              }
              placeholder="e.g., Golden Retriever"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="temperament">Temperament</Label>
            <Input
              id="temperament"
              value={formData.temperament}
              onChange={(e) =>
                setFormData({ ...formData, temperament: e.target.value })
              }
              placeholder="e.g., Friendly, nervous, energetic"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medical">Medical Notes</Label>
            <Textarea
              id="medical"
              value={formData.medical_notes}
              onChange={(e) =>
                setFormData({ ...formData, medical_notes: e.target.value })
              }
              placeholder="Any allergies, medications, or health concerns..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {mode === 'create' ? 'Add Pet' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

