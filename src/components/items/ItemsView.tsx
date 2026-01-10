import { useState } from 'react'
import { 
  Pencil, 
  Trash2,
  Package,
  Percent,
} from 'lucide-react'
import { ItemDialog } from './ItemDialog'
import { DeleteItemDialog } from './DeleteItemDialog'
import { useItems, useDeleteItem, type ItemOrDiscount } from '@/hooks/useItems'
import { useToast } from '@/hooks/use-toast'

interface ItemsViewProps {
  showAddDialog: boolean
  onAddDialogChange: (show: boolean) => void
}

export function ItemsView({ showAddDialog, onAddDialogChange }: ItemsViewProps) {
  const [editingItem, setEditingItem] = useState<ItemOrDiscount | null>(null)
  const [deletingItem, setDeletingItem] = useState<ItemOrDiscount | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { data: items = [], isLoading } = useItems()
  const deleteItem = useDeleteItem()
  const { toast } = useToast()

  // Separate items and discounts
  const itemsList = items.filter(i => i.type === 'item')
  const discountsList = items.filter(i => i.type === 'discount')

  const handleDeleteClick = (item: ItemOrDiscount) => {
    setDeletingItem(item)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingItem) return

    try {
      await deleteItem.mutateAsync(deletingItem.id)
      toast({
        title: 'Deleted',
        description: `"${deletingItem.name}" has been deleted.`,
      })
      setShowDeleteDialog(false)
      setDeletingItem(null)
    } catch (error) {
      console.error('Failed to delete:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete. Please try again.',
      })
    }
  }

  const formatAmount = (item: ItemOrDiscount) => {
    if (!item.default_amount) return 'no default'
    if (item.is_percentage) return `${item.default_amount}%`
    return `$${item.default_amount.toFixed(0)}`
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Items & Discounts List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <>
            {/* Items Section */}
            {itemsList.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Items
                </h2>
                <div className="space-y-3">
                  {itemsList.map((item) => {
                    return (
                      <div
                        key={item.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        {/* Line 1: Icon, Name, Default Amount */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Package className="h-5 w-5 text-primary flex-shrink-0" />
                            <h3 className="font-semibold text-base text-gray-900">
                              {item.name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              (default: {formatAmount(item)})
                            </span>
                          </div>
                        </div>

                        {/* Line 2: Description, Edit, Delete */}
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 flex-1">
                            {item.description || 'No description'}
                          </p>
                          <div className="flex gap-1 ml-4">
                            <button
                              onClick={() => setEditingItem(item)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              aria-label="Edit item"
                            >
                              <Pencil className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(item)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              aria-label="Delete item"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Discounts Section */}
            {discountsList.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
                  Discounts
                </h2>
                <div className="space-y-3">
                  {discountsList.map((discount) => {
                    return (
                      <div
                        key={discount.id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                      >
                        {/* Line 1: Icon, Name, Default Amount */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 flex-1">
                            <Percent className="h-5 w-5 text-primary flex-shrink-0" />
                            <h3 className="font-semibold text-base text-gray-900">
                              {discount.name}
                            </h3>
                            <span className="text-sm text-gray-500">
                              (default: {formatAmount(discount)})
                            </span>
                          </div>
                        </div>

                        {/* Line 2: Description, Edit, Delete */}
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600 flex-1">
                            {discount.description || 'No description'}
                          </p>
                          <div className="flex gap-1 ml-4">
                            <button
                              onClick={() => setEditingItem(discount)}
                              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                              aria-label="Edit discount"
                            >
                              <Pencil className="h-4 w-4 text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleDeleteClick(discount)}
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                              aria-label="Delete discount"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {itemsList.length === 0 && discountsList.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <p>No items or discounts yet</p>
                <p className="text-sm mt-2">Add your first item or discount to get started</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add Dialog */}
      <ItemDialog
        open={showAddDialog}
        onOpenChange={onAddDialogChange}
        mode="create"
      />

      {/* Edit Dialog */}
      {editingItem && (
        <ItemDialog
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          mode="edit"
          item={editingItem}
        />
      )}

      {/* Delete Dialog */}
      {deletingItem && (
        <DeleteItemDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          itemName={deletingItem.name}
          itemType={deletingItem.type}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
