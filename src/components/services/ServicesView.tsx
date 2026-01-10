import { useState, useMemo } from 'react'
import { 
  Pencil, 
  Trash2,
  Ban,
  CheckCircle,
  Scissors,
} from 'lucide-react'
import { ServiceDialog } from './ServiceDialog'
import { DeleteServiceDialog } from './DeleteServiceDialog'
import { useServices, useDeleteService, useToggleServiceActive, type Service } from '@/hooks/useServices'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ServicesViewProps {
  showAddDialog: boolean
  onAddDialogChange: (show: boolean) => void
}

export function ServicesView({ showAddDialog, onAddDialogChange }: ServicesViewProps) {
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [deletingService, setDeletingService] = useState<Service | null>(null)
  const [isServiceInUse, setIsServiceInUse] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const { data: services = [], isLoading } = useServices()
  const deleteService = useDeleteService()
  const toggleServiceActive = useToggleServiceActive()
  const { toast } = useToast()

  // Filter services based on active status
  const filteredServices = useMemo(() => {
    if (showInactive) return services
    return services.filter(s => s.is_active)
  }, [services, showInactive])

  const handleToggleActive = async (service: Service) => {
    const newStatus = !service.is_active
    
    try {
      await toggleServiceActive.mutateAsync({ 
        id: service.id, 
        is_active: newStatus 
      })
      toast({
        title: service.is_active ? 'Service Deactivated' : 'Service Reactivated',
        description: `"${service.name}" has been ${service.is_active ? 'deactivated' : 'reactivated'}.`,
      })
    } catch (error) {
      console.error('Failed to toggle service:', error)
      toast({
        title: 'Error',
        description: `Failed to ${service.is_active ? 'deactivate' : 'reactivate'} service. Please try again.`,
      })
    }
  }

  const handleDeleteClick = async (service: Service) => {
    setDeletingService(service)
    
    // Check if service is in use
    const { data: appointmentPets, error } = await supabase
      .from('appointment_pets')
      .select('id')
      .eq('service_id', service.id)
      .limit(1)

    if (error) {
      console.error('Error checking service usage:', error)
      toast({
        title: 'Error',
        description: 'Failed to check service usage. Please try again.',
      })
      return
    }

    const inUse = appointmentPets && appointmentPets.length > 0
    setIsServiceInUse(inUse)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deletingService) return

    try {
      await deleteService.mutateAsync(deletingService.id)
      toast({
        title: 'Deleted',
        description: `"${deletingService.name}" has been deleted.`,
      })
      setShowDeleteDialog(false)
      setDeletingService(null)
    } catch (error) {
      console.error('Failed to delete:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete. Please try again.',
      })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Toggle for Show Inactive */}
      <div className="px-4 py-3 border-b border-gray-100">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="h-4 w-4 text-primary rounded"
          />
          <span className="text-sm text-gray-600">Show Inactive</span>
        </label>
      </div>

      {/* Services List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading services...</div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <p>No services yet</p>
            <p className="text-sm mt-2">Add your first service to get started</p>
          </div>
        ) : (
          filteredServices.map((service) => {
            const isInactive = !service.is_active

            return (
              <div
                key={service.id}
                className={`border rounded-lg p-4 transition-colors ${
                  isInactive 
                    ? 'border-gray-200 bg-gray-50 opacity-60' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Line 1: Icon, Name, Badge, Duration, Price */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <Scissors className="h-5 w-5 text-primary flex-shrink-0" />
                    <h3 className="font-semibold text-base text-gray-900">
                      {service.name}
                    </h3>
                    {isInactive && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                        Inactive
                      </span>
                    )}
                    <span className="text-sm text-gray-500">
                      ({service.duration_minutes}min)
                    </span>
                  </div>
                  <div className="text-base font-bold text-gray-900 ml-4">
                    ${service.base_price.toFixed(0)}
                  </div>
                </div>

                {/* Line 2: Description, Edit, Toggle, Delete */}
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600 flex-1">
                    {service.description || 'No description'}
                  </p>
                  <div className="flex gap-1 ml-4">
                    <button
                      onClick={() => setEditingService(service)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      aria-label="Edit service"
                    >
                      <Pencil className="h-4 w-4 text-gray-600" />
                    </button>
                    
                    {/* Toggle Active/Inactive button */}
                    <button
                      onClick={() => handleToggleActive(service)}
                      className={`p-2 rounded-lg transition-colors ${
                        isInactive
                          ? 'hover:bg-green-50 text-green-600'
                          : 'hover:bg-yellow-50 text-yellow-600'
                      }`}
                      aria-label={isInactive ? 'Reactivate service' : 'Deactivate service'}
                      title={isInactive ? 'Reactivate' : 'Deactivate'}
                    >
                      {isInactive ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </button>
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteClick(service)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Delete service"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Add Service Dialog */}
      <ServiceDialog
        open={showAddDialog}
        onOpenChange={onAddDialogChange}
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

      {/* Delete Service Dialog */}
      {deletingService && (
        <DeleteServiceDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          serviceName={deletingService.name}
          isInUse={isServiceInUse}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  )
}
