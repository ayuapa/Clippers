import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ServiceDialog } from './ServiceDialog'
import { useServices, type Service } from '@/hooks/useServices'

export function ServicesView() {
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const { data: services = [], isLoading } = useServices()

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Services & Pricing</h1>
          <Button size="sm" onClick={() => setIsAddServiceOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading services...</div>
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No services yet</p>
            <p className="text-sm mt-2">Add your first service to get started</p>
          </div>
        ) : (
          services.map((service) => (
            <div
              key={service.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: service.color }}
                    />
                    <h3 className="font-semibold text-base text-gray-900">
                      {service.name}
                    </h3>
                  </div>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <div className="text-lg font-bold text-primary">
                      ${service.base_price.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {service.duration_minutes} mins
                    </div>
                  </div>
                </div>

                <div className="flex gap-1 ml-4">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingService(service)}
                    className="h-9 w-9"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Service Dialog */}
      <ServiceDialog
        open={isAddServiceOpen}
        onOpenChange={setIsAddServiceOpen}
        mode="create"
      />

      {/* Edit Service Dialog */}
      {editingService && (
        <ServiceDialog
          open={!!editingService}
          onOpenChange={(open) => !open && setEditingService(null)}
          mode="edit"
          service={editingService}
        />
      )}
    </div>
  )
}

