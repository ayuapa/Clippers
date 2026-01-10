import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatInSydney } from '@/lib/timezone'

interface PetService {
  pet_name?: string
  service_name?: string
  price: number
}

interface ChangeSummaryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  oldData: {
    client_name: string
    start_time: Date
    end_time: Date
    pets: PetService[]
  }
  newData: {
    client_name: string
    start_time: Date
    end_time: Date
    pets: PetService[]
  }
  onConfirm: () => void
  isSaving: boolean
}

export function ChangeSummaryDialog({
  open,
  onOpenChange,
  oldData,
  newData,
  onConfirm,
  isSaving,
}: ChangeSummaryDialogProps) {
  // Calculate changes
  const clientChanged = oldData.client_name !== newData.client_name
  const dateChanged = !isSameDay(oldData.start_time, newData.start_time)
  const timeChanged = 
    oldData.start_time.getTime() !== newData.start_time.getTime() ||
    oldData.end_time.getTime() !== newData.end_time.getTime()
  const petsChanged = 
    JSON.stringify(oldData.pets) !== JSON.stringify(newData.pets)

  const oldTotal = oldData.pets.reduce((sum, p) => sum + (p.price || 0), 0)
  const newTotal = newData.pets.reduce((sum, p) => sum + (p.price || 0), 0)
  const priceChanged = oldTotal !== newTotal

  function isSameDay(date1: Date, date2: Date) {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">Confirm Changes</DialogTitle>
        </DialogHeader>

        {/* Changes List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <p className="text-sm text-gray-600">
            Review the changes before saving:
          </p>

          {clientChanged && (
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <p className="text-sm font-medium text-yellow-900 mb-1">Client</p>
              <p className="text-sm text-yellow-700">
                <span className="line-through">{oldData.client_name}</span>
                {' → '}
                <span className="font-medium">{newData.client_name}</span>
              </p>
            </div>
          )}

          {(dateChanged || timeChanged) && (
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">Date & Time</p>
              {dateChanged && (
                <p className="text-sm text-blue-700">
                  <span className="line-through">
                    {formatInSydney(oldData.start_time, 'EEEE, MMM d, yyyy')}
                  </span>
                  {' → '}
                  <span className="font-medium">
                    {formatInSydney(newData.start_time, 'EEEE, MMM d, yyyy')}
                  </span>
                </p>
              )}
              {timeChanged && (
                <p className="text-sm text-blue-700">
                  <span className="line-through">
                    {formatInSydney(oldData.start_time, 'h:mma')} - {formatInSydney(oldData.end_time, 'h:mma')}
                  </span>
                  {' → '}
                  <span className="font-medium">
                    {formatInSydney(newData.start_time, 'h:mma')} - {formatInSydney(newData.end_time, 'h:mma')}
                  </span>
                </p>
              )}
            </div>
          )}

          {petsChanged && (
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm font-medium text-purple-900 mb-2">Pets & Services</p>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-purple-600 mb-1">Before:</p>
                  {oldData.pets.map((pet, i) => (
                    <p key={i} className="text-sm text-purple-700 line-through">
                      {pet.pet_name} - {pet.service_name}
                    </p>
                  ))}
                </div>
                <div>
                  <p className="text-xs text-purple-600 mb-1">After:</p>
                  {newData.pets.map((pet, i) => (
                    <p key={i} className="text-sm text-purple-900 font-medium">
                      {pet.pet_name} - {pet.service_name}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {priceChanged && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-900 mb-1">Total Price</p>
              <p className="text-sm text-green-700">
                <span className="line-through">${oldTotal.toFixed(0)}</span>
                {' → '}
                <span className="font-medium text-lg">${newTotal.toFixed(0)}</span>
              </p>
            </div>
          )}

          {!clientChanged && !dateChanged && !timeChanged && !petsChanged && !priceChanged && (
            <div className="text-center py-4 text-gray-500">
              <p className="text-sm">No changes detected</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 text-base font-semibold"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="h-12 text-base font-semibold bg-primary hover:bg-primary/90"
              onClick={onConfirm}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Confirm & Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
