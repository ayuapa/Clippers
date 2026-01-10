import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Search, Check } from 'lucide-react'
import { useServices } from '@/hooks/useServices'

interface ServiceSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  excludeServiceIds: string[] // Services already in booking or extras
  onServiceSelect: (serviceId: string, serviceName: string, duration: number, price: number) => void
}

export function ServiceSelectorDialog({
  open,
  onOpenChange,
  excludeServiceIds,
  onServiceSelect,
}: ServiceSelectorDialogProps) {
  const { data: services = [] } = useServices()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  // Filter out already-added services and inactive services
  const availableServices = services.filter(s => 
    !excludeServiceIds.includes(s.id) && s.is_active
  )

  // Filter based on search
  const filteredServices = availableServices.filter(service => {
    const searchLower = searchQuery.toLowerCase()
    return (
      service.name.toLowerCase().includes(searchLower) ||
      (service.description && service.description.toLowerCase().includes(searchLower))
    )
  })

  const handleSelect = () => {
    if (!selectedServiceId) return
    
    const service = services.find(s => s.id === selectedServiceId)
    if (!service) return

    onServiceSelect(service.id, service.name, service.duration_minutes, service.base_price)
    onOpenChange(false)
    setSelectedServiceId(null)
    setSearchQuery('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <DialogTitle className="text-xl font-semibold">Add Service</DialogTitle>
        </DialogHeader>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Service List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            {filteredServices.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No services found</p>
                {searchQuery && (
                  <p className="text-xs mt-1">Try a different search term</p>
                )}
              </div>
            ) : (
              filteredServices.map((service) => {
                const isSelected = service.id === selectedServiceId
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`
                      w-full flex items-center justify-between p-3 rounded-lg transition-colors
                      ${
                        isSelected
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'border-2 border-transparent hover:bg-gray-50'
                      }
                    `}
                  >
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">
                        {service.duration_minutes}min • ${service.base_price.toFixed(0)}
                      </p>
                    </div>
                    {isSelected && (
                      <Check className="h-5 w-5 text-primary flex-shrink-0 ml-2" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 text-base font-semibold"
              onClick={() => {
                onOpenChange(false)
                setSelectedServiceId(null)
                setSearchQuery('')
              }}
            >
              Cancel
            </Button>
            <Button
              className="h-12 text-base font-semibold bg-primary hover:bg-primary/90"
              onClick={handleSelect}
              disabled={!selectedServiceId}
            >
              Add Service
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
