import { useState, useEffect, useRef } from 'react'
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
import { useClient, useCreateClient, useUpdateClient } from '@/hooks/useClients'
import { useCreatePet } from '@/hooks/usePets'
import { MapPin, Dog, X, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader'

interface PetFormData {
  id: string // temporary ID for UI
  name: string
  breed: string
  temperament: string
  medical_notes: string
}

interface ClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  clientId?: string
}

export function ClientDialog({
  open,
  onOpenChange,
  mode,
  clientId,
}: ClientDialogProps) {
  const { data: client } = useClient(clientId || '')
  const createClient = useCreateClient()
  const updateClient = useUpdateClient()
  const createPet = useCreatePet()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    suburb: '',
    postcode: '',
    latitude: '',
    longitude: '',
    notes: '',
  })
  const [pets, setPets] = useState<PetFormData[]>([])
  const addressInputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (mode === 'edit' && client) {
      setFormData({
        firstName: client.first_name,
        lastName: client.last_name,
        phone: client.phone,
        email: client.email || '',
        address: client.address,
        suburb: client.suburb,
        postcode: client.postcode,
        latitude: client.latitude?.toString() || '',
        longitude: client.longitude?.toString() || '',
        notes: client.notes || '',
      })
      setPets([]) // Don't show pets in edit mode (manage via Profile tab)
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        address: '',
        suburb: '',
        postcode: '',
        latitude: '',
        longitude: '',
        notes: '',
      })
      setPets([]) // Reset pets for new client
    }
  }, [mode, client, open])

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!open) return

    let mounted = true

    const initAutocomplete = async () => {
      try {
        // Wait for the Dialog to fully render and ref to be attached
        let attempts = 0
        while (!addressInputRef.current && attempts < 20) {
          await new Promise(resolve => setTimeout(resolve, 50))
          attempts++
        }

        if (!addressInputRef.current) {
          console.error('Address input ref not available')
          return
        }

        // Load Google Maps API with Places library
        await loadGoogleMapsAPI()
        
        if (!mounted || !addressInputRef.current) return

        // Destroy existing instance if any
        if (autocompleteRef.current) {
          google.maps.event.clearInstanceListeners(autocompleteRef.current)
          autocompleteRef.current = null
        }

        // Create new autocomplete instance
        const autocomplete = new google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            componentRestrictions: { country: 'au' },
            fields: ['address_components', 'geometry'],
            types: ['address'],
          }
        )

        autocompleteRef.current = autocomplete

        // Handle place selection
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace()

          if (!place.address_components || !place.geometry) {
            return
          }

          let streetNumber = ''
          let route = ''
          let locality = ''
          let postalCode = ''

          // Extract components
          place.address_components.forEach((component) => {
            const types = component.types
            if (types.includes('street_number')) {
              streetNumber = component.long_name
            } else if (types.includes('route')) {
              route = component.long_name
            } else if (types.includes('locality')) {
              locality = component.long_name
            } else if (types.includes('postal_code')) {
              postalCode = component.long_name
            }
          })

          const fullAddress = [streetNumber, route].filter(Boolean).join(' ')
          const lat = place.geometry.location?.lat()
          const lng = place.geometry.location?.lng()

          // Update form
          setFormData((prev) => ({
            ...prev,
            address: fullAddress || prev.address,
            suburb: locality || prev.suburb,
            postcode: postalCode || prev.postcode,
            latitude: lat ? lat.toString() : prev.latitude,
            longitude: lng ? lng.toString() : prev.longitude,
          }))

          toast({
            title: '✓ Address Selected',
            description: 'All location details filled automatically!',
          })
        })

        console.log('✅ Address autocomplete ready')
      } catch (error) {
        console.error('Failed to initialize address autocomplete:', error)
      }
    }

    initAutocomplete()

    // Cleanup
    return () => {
      mounted = false
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
        autocompleteRef.current = null
      }
    }
  }, [open, toast])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const clientData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address,
        suburb: formData.suburb,
        postcode: formData.postcode,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        notes: formData.notes || null,
        is_active: true,
      }

      if (mode === 'create') {
        // Create client first
        const newClient = await createClient.mutateAsync(clientData)
        
        // Then create all pets for this client
        if (pets.length > 0 && newClient?.id) {
          for (const pet of pets) {
            if (pet.name.trim()) { // Only save pets with names
              await createPet.mutateAsync({
                client_id: newClient.id,
                name: pet.name,
                species: 'dog',
                breed: pet.breed || null,
                weight_kg: null,
                age_years: null,
                temperament: pet.temperament || null,
                medical_notes: pet.medical_notes || null,
                photo_url: null,
              })
            }
          }
        }
        
        toast({
          title: 'Success!',
          description: `Client ${pets.length > 0 ? `and ${pets.length} pet(s)` : ''} added successfully!`,
        })
      } else if (clientId) {
        await updateClient.mutateAsync({ id: clientId, ...clientData })
        toast({
          title: 'Success!',
          description: 'Client updated successfully!',
        })
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save client:', error)
      toast({
        title: 'Error',
        description: 'Failed to save client. Please try again.',
      })
    }
  }
  
  const addPet = () => {
    setPets([...pets, {
      id: `temp-${Date.now()}`,
      name: '',
      breed: '',
      temperament: '',
      medical_notes: '',
    }])
  }
  
  const removePet = (id: string) => {
    setPets(pets.filter(p => p.id !== id))
  }
  
  const updatePetField = (id: string, field: keyof Omit<PetFormData, 'id'>, value: string) => {
    setPets(pets.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-lg max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => {
          // Prevent dialog from closing when clicking on Google Places autocomplete dropdown
          const target = e.target as HTMLElement
          if (target.closest('.pac-container')) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Client' : 'Edit Client'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) =>
                  setFormData({ ...formData, firstName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) =>
                  setFormData({ ...formData, lastName: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="0412 345 678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">
              Address *
              <span className="text-xs text-purple-600 ml-1 font-normal">
                (start typing for suggestions)
              </span>
            </Label>
            <Input
              id="address"
              ref={addressInputRef}
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              placeholder="e.g., 123 George Street, Sydney..."
              required
              autoComplete="off"
            />
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              Type your address and select from Google's suggestions
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="suburb">
                Suburb *
                <span className="text-xs text-gray-500 ml-1 font-normal">(auto-filled)</span>
              </Label>
              <Input
                id="suburb"
                value={formData.suburb}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
                placeholder="Will auto-fill from address"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postcode">
                Postcode *
                <span className="text-xs text-gray-500 ml-1 font-normal">(auto-filled)</span>
              </Label>
              <Input
                id="postcode"
                value={formData.postcode}
                readOnly
                className="bg-gray-50 cursor-not-allowed"
                placeholder="Will auto-fill"
                required
              />
            </div>
          </div>

          {/* Location Coordinates (Auto-filled) */}
          {formData.latitude && formData.longitude && (
            <div className="pt-2 pb-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-medium text-gray-700">
                  Location Coordinates
                </Label>
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>Ready for map view</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="latitude" className="text-xs text-gray-500">
                    Latitude
                  </Label>
                  <Input
                    id="latitude"
                    value={formData.latitude}
                    readOnly
                    className="bg-gray-50 text-sm cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor="longitude" className="text-xs text-gray-500">
                    Longitude
                  </Label>
                  <Input
                    id="longitude"
                    value={formData.longitude}
                    readOnly
                    className="bg-gray-50 text-sm cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Pets Section (only in create mode) */}
          {mode === 'create' && (
            <div className="pt-2 pb-2 border-t border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Dog className="h-5 w-5 text-primary" />
                  Pets ({pets.length})
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addPet}
                  className="h-8 text-primary border-primary hover:bg-primary/10"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Pet
                </Button>
              </div>

              {pets.length === 0 ? (
                <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <Dog className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No pets added yet</p>
                  <p className="text-xs text-gray-400 mt-1">Click "Add Pet" to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pets.map((pet, index) => (
                    <div
                      key={pet.id}
                      className="relative border border-gray-200 rounded-lg p-3 bg-gray-50"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Pet #{index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePet(pet.id)}
                          className="h-6 w-6 p-0 text-red-500 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <Input
                          placeholder="Pet name (e.g., Max) *"
                          value={pet.name}
                          onChange={(e) => updatePetField(pet.id, 'name', e.target.value)}
                          className="bg-white"
                        />
                        <Input
                          placeholder="Breed (e.g., Golden Retriever)"
                          value={pet.breed}
                          onChange={(e) => updatePetField(pet.id, 'breed', e.target.value)}
                          className="bg-white"
                        />
                        <Input
                          placeholder="Temperament (e.g., Friendly, nervous)"
                          value={pet.temperament}
                          onChange={(e) => updatePetField(pet.id, 'temperament', e.target.value)}
                          className="bg-white"
                        />
                        <Textarea
                          placeholder="Medical notes (allergies, medications...)"
                          value={pet.medical_notes}
                          onChange={(e) => updatePetField(pet.id, 'medical_notes', e.target.value)}
                          rows={2}
                          className="bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional information..."
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
              {mode === 'create' ? 'Add Client' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

