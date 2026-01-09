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
import { useCreateService, useUpdateService, type Service } from '@/hooks/useServices'

interface ServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  service?: Service
}

const DEFAULT_COLORS = [
  '#7c3aed', // Purple
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Green
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Violet
  '#06b6d4', // Cyan
]

export function ServiceDialog({
  open,
  onOpenChange,
  mode,
  service,
}: ServiceDialogProps) {
  const createService = useCreateService()
  const updateService = useUpdateService()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base_price: '',
    duration_minutes: '',
    color: DEFAULT_COLORS[0],
  })

  useEffect(() => {
    if (mode === 'edit' && service) {
      setFormData({
        name: service.name,
        description: service.description || '',
        base_price: service.base_price.toString(),
        duration_minutes: service.duration_minutes.toString(),
        color: service.color,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        base_price: '',
        duration_minutes: '',
        color: DEFAULT_COLORS[0],
      })
    }
  }, [mode, service, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || null,
        base_price: parseFloat(formData.base_price),
        duration_minutes: parseInt(formData.duration_minutes),
        color: formData.color,
      }

      if (mode === 'create') {
        await createService.mutateAsync(serviceData)
      } else if (service) {
        await updateService.mutateAsync({ id: service.id, ...serviceData })
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save service:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add New Service' : 'Edit Service'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Full Groom"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description of the service..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={formData.base_price}
                onChange={(e) =>
                  setFormData({ ...formData, base_price: e.target.value })
                }
                placeholder="85.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duration (mins) *</Label>
              <Input
                id="duration"
                type="number"
                inputMode="numeric"
                step="15"
                min="15"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: e.target.value,
                  })
                }
                placeholder="90"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color Tag</Label>
            <div className="flex gap-2">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, color })}
                  className={`h-10 w-10 rounded-full transition-all ${
                    formData.color === color
                      ? 'ring-2 ring-offset-2 ring-gray-900'
                      : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
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
              {mode === 'create' ? 'Add Service' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

