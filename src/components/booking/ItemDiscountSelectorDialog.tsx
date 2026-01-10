import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Package, Percent } from 'lucide-react'
import { useItems, type ItemOrDiscount } from '@/hooks/useItems'

interface ItemDiscountSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'item' | 'discount'
  onSelect: (id: string, name: string, defaultAmount: number | null, isPercentage: boolean, customAmount?: number) => void
}

export function ItemDiscountSelectorDialog({
  open,
  onOpenChange,
  type,
  onSelect,
}: ItemDiscountSelectorDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [amountType, setAmountType] = useState<'fixed' | 'percentage'>('fixed')
  
  const { data: allItems = [] } = useItems()

  // Filter items/discounts based on type
  const items = useMemo(() => {
    return allItems
      .filter(item => item.type === type)
      .filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [allItems, type, searchQuery])

  const selectedItem = useMemo(() => {
    return items.find(item => item.id === selectedId)
  }, [items, selectedId])

  const handleSelect = () => {
    if (!selectedItem) return

    const amount = customAmount ? parseFloat(customAmount) : (selectedItem.default_amount || 0)
    
    // If discount has no default, use the chosen amountType; otherwise use the stored is_percentage
    const isPercentage = selectedItem.default_amount === null && type === 'discount' 
      ? amountType === 'percentage'
      : selectedItem.is_percentage
    
    onSelect(
      selectedItem.id,
      selectedItem.name,
      selectedItem.default_amount,
      isPercentage,
      amount
    )

    // Reset and close
    setSelectedId(null)
    setCustomAmount('')
    setAmountType('fixed')
    setSearchQuery('')
    onOpenChange(false)
  }

  const handleItemClick = (item: ItemOrDiscount) => {
    setSelectedId(item.id)
    // If there's a default amount, use it; otherwise leave empty for user input
    if (item.default_amount !== null) {
      setCustomAmount(item.default_amount.toString())
      // Set amountType based on stored is_percentage
      setAmountType(item.is_percentage ? 'percentage' : 'fixed')
    } else {
      setCustomAmount('')
      // Default to fixed for items, user can choose for discounts
      setAmountType('fixed')
    }
  }

  const formatDefaultAmount = (item: ItemOrDiscount) => {
    if (!item.default_amount) return 'custom amount'
    if (item.is_percentage) return `${item.default_amount}%`
    return `$${item.default_amount.toFixed(0)}`
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md max-h-[80vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle>Add {type === 'item' ? 'Item' : 'Discount'}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="px-6 py-3 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${type}s...`}
              className="pl-10"
            />
          </div>
        </div>

        {/* Items/Discounts List */}
        <div className="flex-1 overflow-y-auto px-6 py-3">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
              {searchQuery ? 'No matches found' : `No ${type}s configured`}
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = selectedId === item.id
                const IconComponent = type === 'item' ? Package : Percent

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`w-full text-left p-4 rounded-lg border transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                        isSelected ? 'text-primary' : 'text-gray-600'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className={`font-semibold text-base ${
                            isSelected ? 'text-primary' : 'text-gray-900'
                          }`}>
                            {item.name}
                          </h4>
                          <span className="text-sm text-gray-500 flex-shrink-0">
                            {formatDefaultAmount(item)}
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Amount Input & Actions (shown when item is selected) */}
        {selectedItem && (
          <div className="px-6 py-4 border-t border-gray-200 space-y-4">
            {/* Show $ vs % choice for discounts with no default */}
            {type === 'discount' && selectedItem.default_amount === null && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Type
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={amountType === 'fixed'}
                      onChange={() => setAmountType('fixed')}
                      className="h-4 w-4 text-primary"
                    />
                    <span className="text-sm">Fixed Amount ($)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={amountType === 'percentage'}
                      onChange={() => setAmountType('percentage')}
                      className="h-4 w-4 text-primary"
                    />
                    <span className="text-sm">Percentage (%)</span>
                  </label>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Amount {amountType === 'percentage' ? '(%)' : '($)'}
              </label>
              <Input
                type="number"
                inputMode="decimal"
                step={amountType === 'percentage' ? '1' : '0.01'}
                min="0"
                max={amountType === 'percentage' ? '100' : undefined}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder={amountType === 'percentage' ? '10' : '20.00'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedId(null)
                  setCustomAmount('')
                  setAmountType('fixed')
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSelect}
                disabled={!customAmount || parseFloat(customAmount) <= 0}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {/* Close button when nothing selected */}
        {!selectedItem && (
          <div className="px-6 py-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
