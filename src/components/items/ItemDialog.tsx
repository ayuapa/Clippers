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
import { useCreateItem, useUpdateItem, type ItemOrDiscount } from '@/hooks/useItems'
import { useToast } from '@/hooks/use-toast'

interface ItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mode: 'create' | 'edit'
  item?: ItemOrDiscount
}

export function ItemDialog({
  open,
  onOpenChange,
  mode,
  item,
}: ItemDialogProps) {
  const createItem = useCreateItem()
  const updateItem = useUpdateItem()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'item' as 'item' | 'discount',
    amountType: 'none' as 'none' | 'fixed' | 'percentage',
    amount: '',
  })

  useEffect(() => {
    if (mode === 'edit' && item) {
      let amountType: 'none' | 'fixed' | 'percentage' = 'none'
      if (item.default_amount !== null) {
        amountType = item.is_percentage ? 'percentage' : 'fixed'
      }

      setFormData({
        name: item.name,
        description: item.description || '',
        type: item.type,
        amountType,
        amount: item.default_amount?.toString() || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        type: 'item',
        amountType: 'none',
        amount: '',
      })
    }
  }, [mode, item, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate amount if fixed or percentage is selected
    if (formData.amountType !== 'none') {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        toast({
          title: 'Validation Error',
          description: 'Please enter a valid amount.',
        })
        return
      }
    }
    
    try {
      const itemData: Omit<ItemOrDiscount, 'id' | 'created_at' | 'updated_at'> = {
        name: formData.name,
        description: formData.description || null,
        type: formData.type,
        icon: formData.type === 'item' ? 'package' : 'percent', // Fixed icons based on type
        default_amount: formData.amountType === 'none' ? null : parseFloat(formData.amount),
        is_percentage: formData.amountType === 'percentage',
      }

      if (mode === 'create') {
        await createItem.mutateAsync(itemData)
      } else if (item) {
        await updateItem.mutateAsync({ id: item.id, ...itemData })
      }

      onOpenChange(false)
    } catch (error) {
      console.error('Failed to save item/discount:', error)
      toast({
        title: 'Error',
        description: 'Failed to save. Please try again.',
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Add Item/Discount' : 'Edit Item/Discount'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Selection */}
          <div className="space-y-2">
            <Label>Type *</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="item"
                  checked={formData.type === 'item'}
                  onChange={() =>
                    setFormData({ ...formData, type: 'item' })
                  }
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">Item</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="discount"
                  checked={formData.type === 'discount'}
                  onChange={() =>
                    setFormData({ ...formData, type: 'discount' })
                  }
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">Discount</span>
              </label>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder={formData.type === 'item' ? 'e.g., Matting' : 'e.g., Senior Discount'}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Brief description..."
              rows={2}
            />
          </div>

          {/* Default Amount */}
          <div className="space-y-3">
            <Label>Default Amount (Optional)</Label>
            
            {/* Amount Type Selection */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="amountType"
                  value="fixed"
                  checked={formData.amountType === 'fixed'}
                  onChange={() =>
                    setFormData({ ...formData, amountType: 'fixed' })
                  }
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm flex-1">Fixed Amount ($)</span>
                {formData.amountType === 'fixed' && (
                  <Input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    placeholder="20.00"
                    className="w-24"
                  />
                )}
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="amountType"
                  value="percentage"
                  checked={formData.amountType === 'percentage'}
                  onChange={() =>
                    setFormData({ ...formData, amountType: 'percentage' })
                  }
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm flex-1">Percentage (%)</span>
                {formData.amountType === 'percentage' && (
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="1"
                      min="0"
                      max="100"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      placeholder="10"
                      className="w-20"
                    />
                    <span className="text-sm text-gray-500">%</span>
                  </div>
                )}
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="amountType"
                  value="none"
                  checked={formData.amountType === 'none'}
                  onChange={() =>
                    setFormData({ ...formData, amountType: 'none', amount: '' })
                  }
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">No Default (decide at checkout)</span>
              </label>
            </div>
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
            <Button type="submit" className="flex-1">
              {mode === 'create' ? 'Add' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
